import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, ToolMessage, SystemMessage
from langchain_core.tools import tool

from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)

# Database Setup - Use environment variable for database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///:memory:")
engine = create_engine(DATABASE_URL)
Base = declarative_base()

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    conditions = Column(String)

# Create tables
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)

# Initialize Groq LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not set!")
    GROQ_API_KEY = "placeholder"

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.5,
    groq_api_key=GROQ_API_KEY
)

@tool
def get_dietary_guidelines(condition: str) -> str:
    """Get dietary guidelines for a specific health condition."""
    guidelines = {
        "hyperlipidemia": "Eat: Oatmeal, Salmon, Walnuts, Olive oil. Avoid: Butter, Fried foods, Processed meats.",
        "high blood pressure": "Eat: Leafy Greens, Berries, Beets, Bananas. Avoid: Processed foods, Sugary drinks, Excess salt.",
        "general": "Eat: Whole grains, Lean proteins, Fresh vegetables, Healthy fats. Avoid: Processed foods, Sugary drinks, Refined grains."
    }
    return guidelines.get(condition.lower(), guidelines["general"])

@tool
def calculate_bmi(weight: float, height: float) -> str:
    """Calculate BMI and provide health assessment."""
    bmi = (weight / (height ** 2)) * 703
    if bmi < 18.5:
        category = "underweight"
    elif bmi <= 24.9:
        category = "normal weight"
    elif bmi <= 29.9:
        category = "overweight"
    else:
        category = "obese"
    
    return f"Based on your height and weight, your calculated BMI is {bmi:.1f}, which falls into the {category} category."

@tool
def find_specialists(condition: str) -> str:
    """Find relevant medical specialists for a condition."""
    specialists = {
        "hyperlipidemia": "Cardiologist, Primary Care Physician, Registered Dietitian",
        "high blood pressure": "Cardiologist, Nephrologist, Primary Care Physician",
        "general": "Primary Care Physician, Registered Dietitian"
    }
    return specialists.get(condition.lower(), specialists["general"])

# Tools list
tools = [get_dietary_guidelines, calculate_bmi, find_specialists]
tools_dict = {tool.name: tool for tool in tools}

async def run_medisync_agent(user_input: str):
    """Run the MediSync AI agent"""
    session = Session()
    user = session.query(UserProfile).first()
    user_context = "No profile found." if not user else f"User: {user.name}, Condition: {user.conditions}."

    messages = [
        SystemMessage(content=(
            f"You are the MediSync Assistant. {user_context} "
            "IMPORTANT: Only mention the specific conditions listed in the user profile. "
            "If the user asks about BMI, height, weight, or measurements, you MUST use the calculate_bmi tool. "
            "When you use tools, you MUST include the tool's result in your final response. "
        )),
        HumanMessage(content=user_input)
    ]
    
    ai_msg = llm.invoke(messages)
    
    if ai_msg.tool_calls:
        messages.append(ai_msg)
        for tool_call in ai_msg.tool_calls:
            tool_name = tool_call["name"]
            selected_tool = tools_dict[tool_name]
            observation = selected_tool.invoke(tool_call["args"])
            messages.append(ToolMessage(content=str(observation), tool_call_id=tool_call["id"]))
        
        final_response = llm.invoke(messages)
        if final_response.content:
            return final_response.content
        else:
            return messages[-1].content if messages else "I processed your request but couldn't generate a specific recommendation."
    
    if not ai_msg.content:
        return "I understood your request but couldn't find a specific recommendation."
        
    return ai_msg.content

@app.get("/advise")
async def get_patient_advice(user_query: str):
    """Get patient advice from AI agent"""
    try:
        response = await run_medisync_agent(user_query)
        
        if not response or not response.strip():
            return {"response": "I'm sorry, I couldn't generate a recommendation. Please try again."}
            
        return {"response": response}
    
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/bmi")
async def calculate_bmi_direct(weight: float, height: float):
    """Direct BMI calculation endpoint"""
    bmi = (weight / (height ** 2)) * 703
    if bmi < 18.5:
        category = "underweight"
    elif bmi <= 24.9:
        category = "normal weight"
    elif bmi <= 29.9:
        category = "overweight"
    else:
        category = "obese"
    
    return {
        "bmi": round(bmi, 1),
        "category": category,
        "message": f"Based on your height and weight, your calculated BMI is {bmi:.1f}, which falls into the {category} category."
    }

@app.get("/diet")
async def get_diet_direct(condition: str = "general"):
    """Direct dietary guidelines endpoint"""
    guidelines = {
        "hyperlipidemia": "Eat: Oatmeal, Salmon, Walnuts, Olive oil. Avoid: Butter, Fried foods, Processed meats.", 
        "high blood pressure": "Eat: Leafy Greens, Berries, Beets, Bananas. Avoid: Processed foods, Sugary drinks, Excess salt.",
        "general": "Eat: Whole grains, Lean proteins, Fresh vegetables, Healthy fats. Avoid: Processed foods, Sugary drinks, Refined grains."
    }
    
    diet_plan = guidelines.get(condition.lower(), guidelines["general"])
    
    return {
        "condition": condition,
        "diet_plan": diet_plan,
        "message": f"Here's your personalized diet plan for {condition}: {diet_plan}"
    }

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "message": "MediSync API is running"}

# For Vercel deployment
handler = app
