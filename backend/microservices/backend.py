from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from agent import agent_app, pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Cleanup resources on shutdown
    if pool is not None:
        pool.close()

app = FastAPI(title="Krishi Setu Agentic Router", version="1.0.0", lifespan=lifespan)

class AgentRequest(BaseModel):
    user_query: str
    image_urls: Optional[List[str]] = None
    thread_id: Optional[str] = "default"

class AgentResponse(BaseModel):
    final_advice: str
    state_details: Dict[str, Any]

@app.post("/ask", response_model=AgentResponse)
async def ask_agent(request: AgentRequest):
    try:
        from langchain_core.messages import HumanMessage
        
        # We pass the user_query both explicitly (for the RAG node) and in the messages list
        initial_state = {
            "messages": [HumanMessage(content=request.user_query)],
            "user_query": request.user_query,
            "image_urls": request.image_urls,
            "user_id": request.thread_id
        }
        
        # Remove None values to keep state clean 
        initial_state = {k: v for k, v in initial_state.items() if v is not None}
        
        config = {"configurable": {"thread_id": request.thread_id}}
        
        # Run the LangGraph agent
        final_state = agent_app.invoke(initial_state, config)
        
        final_message = final_state["messages"][-1].content
        if isinstance(final_message, list):
            final_advice = " ".join([item.get("text", "") for item in final_message if isinstance(item, dict) and item.get("type") == "text"])
        else:
            final_advice = str(final_message)
        
        return {
            "final_advice": final_advice,
            "state_details": {
                "dl_result": final_state.get("dl_result"),
                "rag_context": final_state.get("rag_context")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
