import os
import json
import requests
from typing import TypedDict, List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END, START
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# 1. State Definition
# ==========================================
class AgentState(TypedDict):
    user_query: str
    image_urls: Optional[List[str]]  # URLs to 3-5 images for DL service
    
    # Optional Inputs
    lat: Optional[float]
    lon: Optional[float]
    n: Optional[float]
    p: Optional[float]
    k: Optional[float]
    ph: Optional[float]
    soil_quality: Optional[float]
    month: Optional[int]
    crop: Optional[str]
    soil: Optional[str]
    region: Optional[str]
    temp_range: Optional[str]
    weather: Optional[str]
    top_n: Optional[int]
    
    # Router decisions
    run_dl: bool
    run_ml_yield: bool
    run_ml_water: bool
    run_ml_recommend: bool
    run_rag: bool
    run_web_search: bool

    # Sub-system Outputs
    dl_result: Optional[Dict[str, Any]]
    ml_yield_result: Optional[Dict[str, Any]]
    ml_water_result: Optional[Dict[str, Any]]
    ml_recommend_result: Optional[Dict[str, Any]]
    rag_context: Optional[str]
    web_search_result: Optional[str]
    
    # Final Synthesized Output
    final_advice: Optional[str]

# ==========================================
# 2. Router Model
# ==========================================
class RouterDecision(BaseModel):
    run_dl: bool = Field(default=False, description="True if the user provided images and is asking about plant diseases.")
    run_ml_yield: bool = Field(default=False, description="True if the user is asking about crop yield prediction.")
    run_ml_water: bool = Field(default=False, description="True if the user is asking about water or irrigation requirements.")
    run_ml_recommend: bool = Field(default=False, description="True if the user is asking for crop recommendations based on soil data.")
    run_rag: bool = Field(default=False, description="True if the user is asking for general agriculture guidelines, government schemes, or advisories.")
    run_web_search: bool = Field(default=False, description="True if the user is asking for current market prices, recent news, or information that requires a live web search.")

# ==========================================
# 2.5 Preprocess Model
# ==========================================
class PreprocessOutput(BaseModel):
    lat: Optional[float] = Field(default=None, description="Latitude mentioned in the query.")
    lon: Optional[float] = Field(default=None, description="Longitude mentioned in the query.")
    n: Optional[float] = Field(default=None, description="Nitrogen (N) value mentioned.")
    p: Optional[float] = Field(default=None, description="Phosphorus (P) value mentioned.")
    k: Optional[float] = Field(default=None, description="Potassium (K) value mentioned.")
    ph: Optional[float] = Field(default=None, description="Soil pH value mentioned.")
    soil_quality: Optional[float] = Field(default=None, description="Soil quality index mentioned.")
    month: Optional[int] = Field(default=None, description="Month (1-12) mentioned.")
    crop: Optional[str] = Field(default=None, description="Crop name mentioned.")
    soil: Optional[str] = Field(default=None, description="Soil type mentioned.")
    region: Optional[str] = Field(default=None, description="Geographical region mentioned.")
    temp_range: Optional[str] = Field(default=None, description="Temperature range mentioned (e.g. '20-30').")
    weather: Optional[str] = Field(default=None, description="Weather condition mentioned (e.g. 'Sunny').")
    top_n: Optional[int] = Field(default=5, description="Number of recommendations requested.")

# ==========================================
# 3. Nodes
# ==========================================

def preprocess_node(state: AgentState):
    print("--- PREPROCESS NODE ---")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0)
    parser = llm.with_structured_output(PreprocessOutput)
    
    prompt = f"""Extract agricultural parameters from the following user query. 
If a parameter is not explicitly mentioned, leave it as null/None.
User Query: {state.get('user_query', '')}
"""
    extracted = parser.invoke(prompt)
    return {k: v for k, v in extracted.model_dump().items() if v is not None}

def router_node(state: AgentState):
    print("--- ROUTER NODE ---")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0)
    router_llm = llm.with_structured_output(RouterDecision)
    
    query = state.get("user_query", "")
    has_images = bool(state.get("image_urls"))
    
    prompt = f"""You are an intelligent router for an agricultural AI system.
Analyze the following user query and decide which backend services need to be called.
User Query: {query}
Has Images Provided: {has_images}
"""
    decision = router_llm.invoke(prompt)
    
    return {
        "run_dl": decision.run_dl,
        "run_ml_yield": decision.run_ml_yield,
        "run_ml_water": decision.run_ml_water,
        "run_ml_recommend": decision.run_ml_recommend,
        "run_rag": decision.run_rag,
        "run_web_search": decision.run_web_search,
    }

def deep_learning_node(state: AgentState):
    print("--- DEEP LEARNING NODE ---")
    image_urls = state.get("image_urls", [])
    if not image_urls or len(image_urls) < 3:
        return {"dl_result": {"error": "Need 3 to 5 images for disease prediction."}}
    
    dl_url = os.getenv("DL_URL")    
    url = f"{dl_url}/predict-disease-url"
    payload = {"image_urls": image_urls}
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        return {"dl_result": response.json()}
    except Exception as e:
        return {"dl_result": {"error": str(e)}}

def ml_yield_node(state: AgentState):
    print("--- ML YIELD NODE ---")
    ml_url = os.getenv("ML_URL")    
    url = f"{ml_url}/predict-yield"
    payload = {
        "lat": state.get("lat", 0.0),
        "lon": state.get("lon", 0.0),
        "crop_type": state.get("crop", "Rice"),
        "soil_type": state.get("soil", "Loamy"),
        "soil_ph": state.get("ph", 6.5),
        "n": state.get("n", 0.0),
        "p": state.get("p", 0.0),
        "k": state.get("k", 0.0),
        "soil_quality": state.get("soil_quality", 0.5),
        "month": state.get("month", 1)
    }
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return {"ml_yield_result": response.json()}
    except Exception as e:
        return {"ml_yield_result": {"error": str(e)}}

def ml_water_node(state: AgentState):
    print("--- ML WATER NODE ---")
    ml_url = os.getenv("ML_URL")    
    url = f"{ml_url}/water-requirement"
    payload = {
        "crop": state.get("crop", "Wheat"),
        "soil": state.get("soil", "Clay"),
        "region": state.get("region", "North"),
        "temp_range": state.get("temp_range", "20-30"),
        "weather": state.get("weather", "Sunny")
    }
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return {"ml_water_result": response.json()}
    except Exception as e:
        return {"ml_water_result": {"error": str(e)}}

def ml_recommend_node(state: AgentState):
    print("--- ML RECOMMEND CROP NODE ---")
    ml_url = os.getenv("ML_URL")    
    url = f"{ml_url}/recommend-crop"
    payload = {
        "lat": state.get("lat", 0.0),
        "lon": state.get("lon", 0.0),
        "n": state.get("n", 0.0),
        "p": state.get("p", 0.0),
        "k": state.get("k", 0.0),
        "ph": state.get("ph", 6.5),
        "top_n": state.get("top_n", 5)
    }
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return {"ml_recommend_result": response.json()}
    except Exception as e:
        return {"ml_recommend_result": {"error": str(e)}}

def rag_node(state: AgentState):
    print("--- RAG NODE (Pinecone) ---")
    from langchain_pinecone import PineconeVectorStore
    from langchain_huggingface import HuggingFaceEmbeddings
    import os
    
    query = state.get("user_query", "")
    index_name = os.getenv("PINECONE_INDEX_NAME")
    
    if not index_name:
        return {"rag_context": "Pinecone index name not configured in environment."}
        
    try:
        # NOTE: You MUST use the exact same embedding model here as you did in ingest_data.py
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        db = PineconeVectorStore(index_name=index_name, embedding=embeddings)
        
        # Retrieve top 4 most relevant chunks
        results = db.similarity_search(query, k=4)
        
        if not results:
            return {"rag_context": "No relevant context found in knowledge base."}
            
        context_chunks = [doc.page_content for doc in results]
        return {"rag_context": "\n\n".join(context_chunks)}
    except Exception as e:
        return {"rag_context": f"Error accessing knowledge base: {str(e)}"}

def web_search_node(state: AgentState):
    print("--- WEB SEARCH NODE (TAVILY) ---")
    from langchain_community.tools.tavily_search import TavilySearchResults
    try:
        search = TavilySearchResults(max_results=3)
        results = search.invoke(state.get("user_query", ""))
        return {"web_search_result": str(results)}
    except Exception as e:
        return {"web_search_result": f"Web search failed: {str(e)}"}

def synthesize_node(state: AgentState):
    print("--- SYNTHESIZER NODE ---")
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", temperature=0.3)
    
    context = []
    if state.get("dl_result"):
        context.append(f"Disease Prediction Result: {json.dumps(state['dl_result'])}")
    if state.get("ml_yield_result"):
        context.append(f"Yield Prediction Result: {json.dumps(state['ml_yield_result'])}")
    if state.get("ml_water_result"):
        context.append(f"Water Requirement Result: {json.dumps(state['ml_water_result'])}")
    if state.get("ml_recommend_result"):
        context.append(f"Crop Recommendation Result: {json.dumps(state['ml_recommend_result'])}")
    if state.get("rag_context"):
        context.append(f"Government Advisory / RAG Context: {state['rag_context']}")
    if state.get("web_search_result"):
        context.append(f"Web Search Results: {state['web_search_result']}")
        
    context_str = "\n".join(context)
    
    prompt = f"""You are an expert agricultural assistant.
A farmer has asked the following query:
"{state.get('user_query', '')}"

Based on the various AI models and services we ran, here are the raw results:
{context_str}

Please synthesize this information into a clear, actionable, and easy-to-understand advice for the farmer.
Do not expose the raw JSON. Summarize the findings nicely.
"""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"final_advice": response.content}

# ==========================================
# 4. Graph Edge Logic
# ==========================================
def route_after_router(state: AgentState) -> List[str]:
    destinations = []
    if state.get("run_dl"): destinations.append("deep_learning_node")
    if state.get("run_ml_yield"): destinations.append("ml_yield_node")
    if state.get("run_ml_water"): destinations.append("ml_water_node")
    if state.get("run_ml_recommend"): destinations.append("ml_recommend_node")
    if state.get("run_rag"): destinations.append("rag_node")
    if state.get("run_web_search"): destinations.append("web_search_node")
    
    if not destinations:
        # If the router didn't pick anything, just go straight to synthesizer to answer directly
        destinations.append("synthesize_node")
    return destinations

# ==========================================
# 5. Build Graph
# ==========================================
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("preprocess_node", preprocess_node)
workflow.add_node("router_node", router_node)
workflow.add_node("deep_learning_node", deep_learning_node)
workflow.add_node("ml_yield_node", ml_yield_node)
workflow.add_node("ml_water_node", ml_water_node)
workflow.add_node("ml_recommend_node", ml_recommend_node)
workflow.add_node("rag_node", rag_node)
workflow.add_node("web_search_node", web_search_node)
workflow.add_node("synthesize_node", synthesize_node)

# Add Edges
workflow.add_edge(START, "preprocess_node")
workflow.add_edge("preprocess_node", "router_node")
workflow.add_conditional_edges("router_node", route_after_router)
workflow.add_edge("deep_learning_node", "synthesize_node")
workflow.add_edge("ml_yield_node", "synthesize_node")
workflow.add_edge("ml_water_node", "synthesize_node")
workflow.add_edge("ml_recommend_node", "synthesize_node")
workflow.add_edge("rag_node", "synthesize_node")
workflow.add_edge("web_search_node", "synthesize_node")
workflow.add_edge("synthesize_node", END)

# Compile
agent_app = workflow.compile()
