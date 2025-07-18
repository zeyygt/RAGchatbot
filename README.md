# RAGchatbot Python Backend

This is the backend for the RAGchatbot project, built with FastAPI and FAISS for semantic search and question answering.

## Features
- REST API with FastAPI
- Semantic search using FAISS and Sentence Transformers
- Loads and indexes question-answer pairs from `dummy_data.json`
- Streams responses for chat applications
- CORS enabled for frontend integration

## Getting Started

### 1. Clone the repository
```
git clone <your-repo-url>
cd RAGchatbot
```

### 2. Create and activate a virtual environment
```
python -m venv .venv
.venv\Scripts\activate  # On Windows
```

### 3. Install dependencies
```
pip install -r requirements.txt
```

### 4. Run the backend server
```
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`.

## File Structure
- `app.py` - Main FastAPI application
- `faiss_indexer.py` - FAISS-based semantic search logic
- `dummy_data.json` - Sample Q&A data for indexing
- `requirements.txt` - Python dependencies

## Endpoints
- `POST /ask` - Ask a question. Returns a response from the knowledge base or streams a fallback answer.

## Notes
- Make sure `dummy_data.json` exists and is formatted correctly.
- The backend is designed to work with a React frontend (see `gemini-chat/`).

## License
MIT
