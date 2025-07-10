from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)   
@app.post("/ask")
async def ask_question(request: Request):
    body = await request.json()
    question = body.get("question", "")

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(question) 

    return {"response": response.text}