import os
import uvicorn
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, ToolMessage, SystemMessage
from langchain_core.tools import tool

from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from fastapi.middleware.cors import CORSMiddleware

# 1. Load Keys
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("⚠️  WARNING: GROQ_API_KEY not found in environment variables!")
    print("Please set GROQ_API_KEY in your Render dashboard.")
    # Don't crash - set a placeholder for now
    GROQ_API_KEY = "placeholder_key"


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, you'd limit this to your specific URL
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)



# Database Setup
engine = create_engine("sqlite:////tmp/medisync_memory.db")
Base = declarative_base()

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    conditions = Column(String) # e.g., "Diabetes, Nut Allergy, High Blood Pressure"

Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)



# 2. Define Tools
@tool
def get_dietary_guidelines(condition: str):
    """Provides specific dietary recommendations based on a medical condition."""
    guidelines = {
        "hyperlipidemia": "Eat: Oatmeal, Salmon, Walnuts, Olive oil. Avoid: Butter, Fried foods, Processed meats.", 
        "high blood pressure": "Eat: Leafy Greens, Berries, Beets, Bananas. Avoid: Processed foods, Sugary drinks, Excess salt.",
        "general": "Eat: Whole grains, Lean proteins, Fresh vegetables, Healthy fats. Avoid: Processed foods, Sugary drinks, Refined grains."
    }
    return guidelines.get(condition.lower(), guidelines["general"])

@tool
def find_specialist(condition: str):
    """Suggests the type of medical doctor to see for a specific condition."""
    specialists = {"hyperlipidemia": "Cardiologist"}
    return f"Consider seeing a {specialists.get(condition.lower(), 'General Practitioner')}."

@tool
def save_user_info(name: str, conditions: str):
    """Saves or updates the user's name and health conditions to the database."""
    session = Session()
    user = session.query(UserProfile).first()
    if not user:
        user = UserProfile(name=name, conditions=conditions)
        session.add(user)
    else:
        user.name = name
        user.conditions = conditions
    session.commit()
    session.close()
    return f"I've updated your profile, {name}. I'll remember your conditions: {conditions}."

@tool
def get_austin_clinics(specialty: str):
    """Provides a list of clinics in the Austin, Texas area based on specialty."""
    clinics = {
        "cardiologist": ["Austin Heart", "St. David's Cardiovascular"],
        "endocrinologist": ["Texas Diabetes & Endocrinology", "Austin Endocrinology"]
    }
    return clinics.get(specialty.lower(), ["Seton Medical Center", "Baylor Scott & White"])

@tool
def calculate_bmi(weight_lb: float, height_in: float):
    """Calculate BMI for given weight in pounds and height in inches. Use this when user mentions BMI, height, weight, or measurements."""
    bmi = (weight_lb / (height_in ** 2)) * 703
    if bmi < 18.5:
        category = "underweight"
    elif bmi <= 24.9:
        category = "normal weight"
    elif bmi <= 29.9:
        category = "overweight"
    else:
        category = "obese"
    return f"Based on your height and weight, your calculated BMI is {bmi:.1f}, which falls into the {category} category. This may be relevant to your condition, hyperlipidemia."

tools = [get_dietary_guidelines, find_specialist, save_user_info, get_austin_clinics, calculate_bmi]
tools_dict = {t.name: t for t in tools}

# 3. Initialize Brain & Bind Tools
llm = ChatGroq(
   model="llama-3.3-70b-versatile",
    groq_api_key=GROQ_API_KEY
).bind_tools(tools)

async def run_medisync_agent(user_input: str):
    # 1. Fetch from DB
    session = Session()
    user = session.query(UserProfile).first()
    user_context = "No profile found." if not user else f"User: {user.name}, Condition: {user.conditions}."
    session.close()
    
    # Debug: Print input and context
    print(f"DEBUG: User input: {user_input}")
    print(f"DEBUG: User context: {user_context}")

    # 2. System Prompt
    messages = [
        SystemMessage(content=(
            f"You are the MediSync Assistant. {user_context} "
            "IMPORTANT: Only mention the specific conditions listed in the user profile. "
            "Do NOT assume or mention conditions like diabetes unless they are explicitly in the user's profile. "
            "If the user asks about BMI, height, weight, or measurements, you MUST use the calculate_bmi tool. "
            "When you use tools, you MUST include the tool's result in your final response. "
            "Always provide a helpful text response, even if you don't use a tool."
        )),
        HumanMessage(content=user_input)
    ]
    
    # Pass 1: Initial Thought
    ai_msg = llm.invoke(messages)
    
    # Debug: Print AI response details
    print(f"DEBUG: AI response content: '{ai_msg.content}'")
    print(f"DEBUG: AI tool calls: {ai_msg.tool_calls}")
    
    # 3. Logic Gate: If tools are called, execute them
    if ai_msg.tool_calls:
        messages.append(ai_msg)
        for tool_call in ai_msg.tool_calls:
            tool_name = tool_call["name"]
            selected_tool = tools_dict[tool_name]
            observation = selected_tool.invoke(tool_call["args"])
            messages.append(ToolMessage(content=str(observation), tool_call_id=tool_call["id"]))
        
        # Pass 2: Final Summary
        final_response = llm.invoke(messages)
        if final_response.content:
            return final_response.content
        else:
            # Return the last tool observation as fallback
            return messages[-1].content if messages else "I processed your request but couldn't generate a specific recommendation. Please try rephrasing your question."
    
    # 4. Fallback: If no tools were called, return the AI's plain text response
    if not ai_msg.content:
        return "I understood your request but couldn't find a specific recommendation. Could you provide more details about your symptoms?"
        
    return ai_msg.content

# 5. BMI Direct Route
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
        "message": f"Based on your height and weight, your calculated BMI is {bmi:.1f}, which falls into the {category} category. This may be relevant to your condition, hyperlipidemia."
    }

# 5.1. Dietary Guidelines Direct Route
@app.get("/diet")
async def get_diet_direct(condition: str = "hyperlipidemia"):
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

# 6. The Route
@app.get("/advise")
async def get_patient_advice(user_query: str):
    try:
        # We call the correct function name here
        response = await run_medisync_agent(user_query)
        
        if not response or not response.strip():
            return {"response": "I'm sorry, I couldn't generate a recommendation. Please try again."}
            
        return {"response": response}
    
    except Exception as e:
        print(f"Error occurred: {e}")
        # This will now tell you the EXACT line number and error in PowerShell
        raise HTTPException(status_code=500, detail=str(e))

# For Render deployment - export the app handler
handler = app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
