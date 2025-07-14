import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# JSON verisini oku
with open("dummy_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

questions = [entry["question"] for entry in data]
answers = [entry["answer"] for entry in data]

# Embedding üret
embeddings = model.encode(questions, normalize_embeddings=True)

# FAISS index oluştur (cosine similarity)
dim = embeddings.shape[1]
index = faiss.IndexFlatIP(dim)
index.add(np.array(embeddings).astype("float32"))

# Arama fonksiyonu
def find_closest_question(user_question, threshold=0.7):
    user_embedding = model.encode([user_question], normalize_embeddings=True).astype("float32")
    D, I = index.search(user_embedding, k=1)

    score = D[0][0]
    idx = I[0][0]

    if score >= threshold:
        return answers[idx], score
    return None, score

def get_faiss_answer(question):
    answer, score = find_closest_question(question)
    if answer:
        return {"answer": answer, "score": float(score), "fallback": False}
    return {"answer": None, "score": float(score), "fallback": True}


if __name__ == "__main__":
    question = input("Sorunuzu yazın: ")
    answer, score = find_closest_question(question)
    if answer:
        print(f"Cevap ({round(score, 2)} benzerlik): {answer}")
    else:
        print(" Uygun cevap bulunamadı. Fallbacen_yakin_soruyu_bulk yapılmalı.")
