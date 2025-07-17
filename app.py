from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

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

    import asyncio

# ...existing code...

    def generate_stream():
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
            "- Be concise and avoid over-explaining things you're unsure about.\n"
            "- Maintain a helpful and professional tone.\n\n"
            f"Conversation so far:\n{history}"
            f"User question:\n{question}"
        )
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # First, send metadata
        yield f"data: {json.dumps({'type': 'start', 'source': 'gemini'})}\n\n"
        
        try:
            # Stream the response
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    print(f"Backend sending chunk: {repr(chunk.text)}")  # Debug log
                    
                    # Split larger chunks into smaller pieces for better streaming effect
                    words = chunk.text.split(' ')
                    for i, word in enumerate(words):
                        if i == 0:
                            word_to_send = word
                        else:
                            word_to_send = ' ' + word
                        
                        yield f"data: {json.dumps({'type': 'chunk', 'content': word_to_send})}\n\n"
                        
                        # Add small delay to make streaming visible
                        import time
                        time.sleep(0.05)  # 50ms delay between words
                        
        except Exception as e:
            print(f"Backend error: {e}")  # Debug log
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        
        # Signal end of stream
        yield f"data: {json.dumps({'type': 'end'})}\n\n"


    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )
