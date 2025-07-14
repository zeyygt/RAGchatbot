from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from dotenv import load_dotenv

# ====== FAISS tarafı ======
from faiss_indexer import get_faiss_answer    

# ====== Gemini ayarı ======
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
    messages = body.get("messages", [])  # frontend'den gelen geçmiş

    faiss_result = get_faiss_answer(question)
    if faiss_result["fallback"] is False:         
        return {
            "response": faiss_result["answer"],
            "source":  "faiss",
            "score":   faiss_result["score"]
        }

    # Mesaj geçmişini prompt'a ekle
    history = ""
    for msg in messages:
        prefix = "User:" if msg.get("role") == "user" else "Assistant:"
        history += f"{prefix} {msg.get('content', '')}\n"

    prompt = (
        "The internal technical knowledge base could not provide an exact answer to this question.\n"
        "You are acting as an IT support assistant. Please follow these rules when responding:\n"
        "- If you're unsure about the answer, do not hallucinate.\n"
        "- It's okay to say 'I'm not sure about this. Please contact the relevant department.'\n"
        "- Be concise and avoid over-explaining things you’re unsure about.\n"
        "- Maintain a helpful and professional tone.\n\n"
        f"Conversation so far:\n{history}"
        f"User question:\n{question}"
    )
    model = genai.GenerativeModel("gemini-1.5-flash")
    gemini_resp = model.generate_content(prompt)

    return {
        "response": gemini_resp.text,
        "source":  "gemini",
        "score":   None            # Gemini için benzerlik skoru yok
    }
