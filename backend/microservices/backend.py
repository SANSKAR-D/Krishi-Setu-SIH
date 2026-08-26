from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from agent import agent_app

app = FastAPI(title="Krishi Setu Agentic Router", version="1.0.0")

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
            "image_urls": request.image_urls
        }
        
        # Remove None values to keep state clean (optional, but good practice)
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

class SoilData(BaseModel):
    moisture: int
    ph: float
    nitrogen: str
    phosphorus: str
    potassium: str
    temperature: int
    weather_condition: Optional[str] = None

@app.post("/analyze-soil")
async def analyze_soil(data: SoilData):
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        import json
        
        llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", temperature=0)
        
        prompt = f"""
        You are an expert agricultural AI. Based on the following soil and weather data, 
        provide 2 to 3 short, actionable advisories.
        
        Data:
        Moisture: {data.moisture}%
        pH: {data.ph}
        Nitrogen: {data.nitrogen}
        Phosphorus: {data.phosphorus}
        Potassium: {data.potassium}
        Temperature: {data.temperature}°C
        Weather: {data.weather_condition}
        
        Reply ONLY with a JSON array of objects. Each object must have:
        "title" (string, short e.g. "Apply Nitrogen"),
        "description" (string, 1 short sentence),
        "severity" (string, either "critical", "warning", or "info").
        """
        
        response = llm.invoke(prompt)
        content = str(response.content).strip()
        if isinstance(response.content, str):
            content = response.content.strip()
        elif hasattr(response, "text"):
            content = response.text.strip()
            
        if content.startswith("```json"):
            content = content[7:-3]
            
        advisories = json.loads(content)
        return {"advisories": advisories}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
