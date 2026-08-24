from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from agent import agent_app

app = FastAPI(title="Krishi Setu Agentic Router", version="1.0.0")

class AgentRequest(BaseModel):
    user_query: str
    image_urls: Optional[List[str]] = None

class AgentResponse(BaseModel):
    final_advice: str
    state_details: Dict[str, Any]

@app.post("/ask", response_model=AgentResponse)
async def ask_agent(request: AgentRequest):
    try:
        # Initialize the state with the incoming request data
        initial_state = {
            "user_query": request.user_query,
            "image_urls": request.image_urls
        }
        
        # Remove None values to keep state clean (optional, but good practice)
        initial_state = {k: v for k, v in initial_state.items() if v is not None}
        
        # Run the LangGraph agent
        final_state = agent_app.invoke(initial_state)
        
        return {
            "final_advice": final_state.get("final_advice", "Sorry, I couldn't generate an answer."),
            "state_details": {
                "dl_result": final_state.get("dl_result"),
                "ml_yield_result": final_state.get("ml_yield_result"),
                "ml_water_result": final_state.get("ml_water_result"),
                "ml_recommend_result": final_state.get("ml_recommend_result"),
                "rag_context": final_state.get("rag_context"),
                "web_search_result": final_state.get("web_search_result"),
                "run_dl": final_state.get("run_dl"),
                "run_ml_yield": final_state.get("run_ml_yield"),
                "run_ml_water": final_state.get("run_ml_water"),
                "run_ml_recommend": final_state.get("run_ml_recommend"),
                "run_rag": final_state.get("run_rag"),
                "run_web_search": final_state.get("run_web_search")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
