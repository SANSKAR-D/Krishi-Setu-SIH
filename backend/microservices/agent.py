import os
import json
import requests
from typing import TypedDict, List, Optional, Dict, Any, Annotated

from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, SystemMessage, AnyMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode 
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# 1. State Definition
# ==========================================
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    user_query: str
    image_urls: Optional[List[str]]
    dl_result: Optional[Dict[str, Any]]
    rag_context: Optional[str]
    user_id: Optional[str]

# ==========================================
# 2. Tools Definition
# ==========================================

@tool
def predict_yield(lat: float, lon: float, crop_type: str, soil_type: str, soil_ph: float, n: float, p: float, k: float, soil_quality: float, month: int) -> str:
    """Predict crop yield based on geographical and soil parameters."""
    print("--- TOOL: PREDICT YIELD ---")
    ml_url = os.getenv("ML_URL")
    if not ml_url:
        return "ML_URL environment variable is not set."
    url = f"{ml_url}/predict-yield"
    payload = {
        "lat": lat, "lon": lon, "crop_type": crop_type, "soil_type": soil_type,
        "soil_ph": soil_ph, "n": n, "p": p, "k": k, "soil_quality": soil_quality, "month": month
    }
    try:
        response = requests.post(url, json=payload, timeout=30)  # type: ignore
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def predict_water_requirement(crop: str, soil: str, region: str, temp_range: str, weather: str) -> str:
    """Predict water or irrigation requirements for a crop."""
    print("--- TOOL: PREDICT WATER REQUIREMENT ---")
    ml_url = os.getenv("ML_URL")
    if not ml_url:
        return "ML_URL environment variable is not set."
    url = f"{ml_url}/water-requirement"
    payload = {
        "crop": crop, "soil": soil, "region": region, "temp_range": temp_range, "weather": weather
    }
    try:
        response = requests.post(url, json=payload, timeout=30)  # type: ignore
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def recommend_crop(lat: float, lon: float, n: float, p: float, k: float, ph: float, top_n: int = 5) -> str:
    """Recommend the best crops to grow based on soil and location parameters."""
    print("--- TOOL: RECOMMEND CROP ---")
    ml_url = os.getenv("ML_URL")
    if not ml_url:
        return "ML_URL environment variable is not set."
    url = f"{ml_url}/recommend-crop"
    payload = {
        "lat": lat, "lon": lon, "n": n, "p": p, "k": k, "ph": ph, "top_n": top_n
    }
    try:
        response = requests.post(url, json=payload, timeout=30)  # type: ignore
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def web_search(query: str) -> str:
    """Search the web for current market prices, recent news, or general information."""
    print(f"--- TOOL: WEB SEARCH (Query: {query}) ---")
    from langchain_tavily import TavilySearch
    try:
        search = TavilySearch(max_results=3)
        results = search.invoke(query)
        return str(results)
    except Exception as e:
        return f"Web search failed: {str(e)}"

tools = [predict_yield, predict_water_requirement, recommend_crop, web_search]
tool_node = ToolNode(tools)

# ==========================================
# 3. Nodes
# ==========================================

def dl_node(state: AgentState):
    print("--- DEEP LEARNING NODE ---")
    image_urls = state.get("image_urls")
    if not image_urls:
        return {"dl_result": None}
    
    if len(image_urls) < 3:
        return {"dl_result": {"error": "Need 3 to 5 images for disease prediction."}}
    
    dl_url = os.getenv("DL_URL")
    if not dl_url:
        return {"dl_result": {"error": "DL_URL environment variable is not set."}}
        
    url = f"{dl_url}/predict-disease-url"
    payload = {"image_urls": image_urls}
    
    try:
        response = requests.post(url, json=payload, timeout=30)  # type: ignore
        response.raise_for_status()
        return {"dl_result": response.json()}
    except Exception as e:
        return {"dl_result": {"error": str(e)}}

def rag_node(state: AgentState):
    print("--- RAG NODE (Pinecone) ---")
    from langchain_pinecone import PineconeVectorStore
    from langchain_huggingface import HuggingFaceEmbeddings
    
    index_name = os.getenv("PINECONE_INDEX_NAME")
    if not index_name:
        return {"rag_context": "Pinecone index name not configured in environment."}
        
    query = state.get("user_query", "")
    dl_result = state.get("dl_result")
    
    if dl_result and "error" not in dl_result:
        # Incorporate DL result into the query to get specific context
        query = f"Information about crop disease: {json.dumps(dl_result)}"
        
    try:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        db = PineconeVectorStore(index_name=index_name, embedding=embeddings)
        
        results = db.similarity_search(query, k=4)
        if not results:
            return {"rag_context": "No relevant context found in knowledge base."}
            
        context_chunks = [doc.page_content for doc in results]
        return {"rag_context": "\n\n".join(context_chunks)}
    except Exception as e:
        return {"rag_context": f"Error accessing knowledge base: {str(e)}"}

def agent_node(state: AgentState):
    print("--- AGENT NODE ---")
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", temperature=0.3)
    llm_with_tools = llm.bind_tools(tools)
    
    sys_msg = "You are an expert agricultural AI assistant. You have access to tools for predicting yield, water requirements, recommending crops, and searching the web. Use them when necessary."
    
    context = []
    if state.get("dl_result"):
        context.append(f"Disease Prediction Result from user images: {json.dumps(state['dl_result'])}")
    if state.get("rag_context"):
        context.append(f"Knowledge Base Context: {state['rag_context']}")
        
    if context:
        sys_msg += "\n\nBackground Context provided by the system:\n" + "\n".join(context)
        
    # Trim chat history to the last 20 messages to save context limits
    recent_messages = state["messages"][-20:]
    messages = [SystemMessage(content=sys_msg)] + recent_messages
    
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# ==========================================
# 4. Graph Edge Logic
# ==========================================
def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools_node"
    return END

# ==========================================
# 5. Build Graph
# ==========================================
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("dl_node", dl_node)
workflow.add_node("rag_node", rag_node)
workflow.add_node("agent_node", agent_node)
workflow.add_node("tools_node", tool_node)

# Add Edges
workflow.add_edge(START, "dl_node")
workflow.add_edge("dl_node", "rag_node")
workflow.add_edge("rag_node", "agent_node")
workflow.add_conditional_edges("agent_node", should_continue, ["tools_node", END])
workflow.add_edge("tools_node", "agent_node")

# Compile with memory for chat history
db_url = os.getenv("DATABASE_URL")
pool = None
if db_url:
    from langgraph.checkpoint.postgres import PostgresSaver
    from psycopg_pool import ConnectionPool
    # Establish a connection pool to Neon with autocommit to allow concurrent index creation
    pool = ConnectionPool(
        conninfo=db_url, 
        max_size=20, 
        min_size=0,         # Allow the pool to shrink to 0 when idle
        timeout=30,         # Timeout if connection fails
        max_idle=30,        # Reduced to 30s to prevent Neon from dropping idle connections
        kwargs={"autocommit": True}
    )
    memory = PostgresSaver(pool)
    memory.setup()  # Automatically create tables if they don't exist
else:
    # Fallback if no database URL is provided yet
    from langgraph.checkpoint.memory import MemorySaver
    memory = MemorySaver()

agent_app = workflow.compile(checkpointer=memory)
