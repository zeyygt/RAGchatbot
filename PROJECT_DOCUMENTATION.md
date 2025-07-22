# RAG Chatbot Project - Complete Technical Documentation

## 🎯 Project Overview

This project implements a **Retrieval-Augmented Generation (RAG) chatbot** that combines semantic search with large language models to provide intelligent IT support assistance. The system uses a two-tier response architecture where it first searches a knowledge base using vector similarity, and falls back to a local LLM for general queries.

## 🏗️ Architecture Overview

```
Frontend (React)  →  Backend (FastAPI)  →  FAISS Index + Ollama LLM
     ↓                      ↓                       ↓
React Chat UI    →    REST API + SSE    →    Vector Search + Text Generation
```

### Core Methodology: RAG (Retrieval-Augmented Generation)

1. **Knowledge Base Creation**: Documents are converted to vector embeddings using sentence transformers
2. **Semantic Retrieval**: User queries are embedded and compared against the knowledge base using cosine similarity
3. **Threshold-Based Response**: If similarity score ≥ 0.7, return knowledge base answer; otherwise, use LLM fallback
4. **Streaming Response**: LLM responses are streamed word-by-word for better user experience

## 📁 Project Structure

```
RAGchatbot/
├── app.py                 # FastAPI backend server
├── faiss_indexer.py       # Vector search and embedding logic
├── dummy_data.json        # Knowledge base (Q&A pairs)
├── requirements.txt       # Python dependencies
├── README.md             # Basic project info
├── .gitignore            # Git ignore rules
├── venv/                 # Python virtual environment
└── gemini-chat/          # React frontend
    ├── package.json      # Node.js dependencies
    ├── public/           # Static assets
    └── src/
        ├── App.js        # Main React component
        ├── chat.js       # Chat interface component
        ├── index.js      # React entry point
        └── *.css         # Styling files
```

## 🔧 Technical Components

### Backend Architecture (Python/FastAPI)

#### 1. **FastAPI Server (`app.py`)**

- **Purpose**: REST API server with CORS support and streaming capabilities
- **Key Features**:
  - Single endpoint: `POST /ask` for question processing
  - Server-Sent Events (SSE) for real-time response streaming
  - Integration with both FAISS and Ollama systems

#### 2. **FAISS Vector Search (`faiss_indexer.py`)**

- **Purpose**: Semantic search engine for the knowledge base
- **Libraries Used**:
  - `faiss-cpu`: Facebook AI Similarity Search for efficient vector operations
  - `sentence-transformers`: Multilingual embedding model
  - `scikit-learn`: Cosine similarity calculations
  - `numpy`: Vector operations

**Vector Search Workflow**:

```python
1. Load Q&A data from JSON → 2. Generate embeddings → 3. Build FAISS index → 4. Search similar questions
```

#### 3. **Knowledge Base (`dummy_data.json`)**

- **Structure**: Array of question-answer pairs in JSON format
- **Example**:

```json
[
  {
    "question": "Wi-Fi çalışmıyor",
    "answer": "Modemi kapatıp açmayı deneyin ve ağ ayarlarını kontrol edin."
  }
]
```

### Frontend Architecture (React)

#### 1. **React Chat Interface (`gemini-chat/src/chat.js`)**

- **Purpose**: Modern chat UI with real-time messaging
- **Key Features**:
  - Dark/Light theme toggle
  - Real-time message streaming
  - Message formatting (markdown support, bullet points)
  - Typing indicators
  - Responsive design

#### 2. **Server-Sent Events Integration**

- **Purpose**: Real-time streaming of LLM responses
- **Implementation**: Uses `fetch()` with `ReadableStream` for chunk processing

## 📚 Libraries and Dependencies Explained

### Backend Dependencies (`requirements.txt`)

| Library                 | Version | Purpose                  | Methodology                                                  |
| ----------------------- | ------- | ------------------------ | ------------------------------------------------------------ |
| `fastapi`               | Latest  | Web framework            | Async REST API with automatic OpenAPI docs                   |
| `uvicorn`               | Latest  | ASGI server              | High-performance async server for FastAPI                    |
| `python-dotenv`         | Latest  | Environment variables    | Secure configuration management                              |
| `faiss-cpu`             | Latest  | Vector similarity search | Efficient nearest neighbor search in high-dimensional spaces |
| `sentence-transformers` | Latest  | Text embeddings          | Pre-trained multilingual models for semantic understanding   |
| `scikit-learn`          | Latest  | ML utilities             | Cosine similarity calculations and preprocessing             |
| `requests`              | Latest  | HTTP client              | Communication with Ollama LLM API                            |

### Frontend Dependencies (`gemini-chat/package.json`)

| Library         | Version | Purpose            |
| --------------- | ------- | ------------------ |
| `react`         | ^19.1.0 | Frontend framework |
| `react-dom`     | ^19.1.0 | DOM rendering      |
| `react-icons`   | ^5.5.0  | Icon components    |
| `react-scripts` | 5.0.1   | Build tools        |

## 🔬 Key Methodologies

### 1. **Semantic Search with FAISS**

- **Model**: `paraphrase-multilingual-MiniLM-L12-v2`
- **Index Type**: `IndexFlatIP` (Inner Product for cosine similarity)
- **Similarity Threshold**: 0.7 (configurable)
- **Normalization**: L2 normalization for accurate cosine similarity

### 2. **Two-Tier Response System**

```python
if similarity_score >= 0.7:
    return knowledge_base_answer
else:
    fallback_to_ollama_llm()
```

### 3. **Streaming Response Architecture**

- **Protocol**: Server-Sent Events (SSE)
- **Format**: JSON chunks with type indicators
- **Types**: `start`, `chunk`, `end`, `error`

### 4. **Embedding Generation Process**

1. **Text Preprocessing**: Normalize and clean input text
2. **Tokenization**: Convert text to model tokens
3. **Embedding**: Generate 384-dimensional vectors
4. **Normalization**: L2 normalize for cosine similarity
5. **Indexing**: Store in FAISS index for fast retrieval

## 🚀 Installation and Setup Guide

### Prerequisites

- Python 3.8+
- Node.js 16+
- Ollama (for LLM fallback)

### Backend Setup

1. **Clone and Navigate**

```bash
git clone <repository-url>
cd RAGchatbot
```

2. **Create Virtual Environment**

```bash
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

3. **Install Python Dependencies**

```bash
pip install -r requirements.txt
```

4. **Setup Ollama (LLM Backend)**

```bash
# Install Ollama from https://ollama.ai
# Pull the required model
ollama pull trendyol-chat
```

5. **Prepare Knowledge Base**

- Edit `dummy_data.json` with your Q&A pairs
- Ensure proper JSON format with "question" and "answer" fields

6. **Start Backend Server**

```bash
uvicorn app:app --reload
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to Frontend Directory**

```bash
cd gemini-chat
```

2. **Install Node Dependencies**

```bash
npm install
```

3. **Start React Development Server**

```bash
npm start
```

Frontend will be available at `http://localhost:3000`

## 🔧 Configuration Options

### Backend Configuration

- **FAISS Similarity Threshold**: Modify in `faiss_indexer.py` (default: 0.7)
- **Ollama Model**: Change model name in `app.py`
- **CORS Settings**: Modify origins in `app.py`

### Frontend Configuration

- **API Endpoint**: Update in `chat.js` (default: `http://localhost:8000`)
- **Theme Colors**: Modify theme object in `chat.js`
- **Streaming Settings**: Adjust chunk processing timing

## 🔍 API Documentation

### Endpoint: `POST /ask`

**Request Body**:

```json
{
  "question": "User's question",
  "messages": [
    {
      "role": "user|assistant",
      "content": "Message content"
    }
  ]
}
```

**Response Types**:

1. **FAISS Response** (JSON):

```json
{
  "response": "Answer from knowledge base",
  "source": "faiss",
  "score": 0.85
}
```

2. **Streaming Response** (SSE):

```
data: {"type": "start", "source": "ollama-trendyol-chat"}
data: {"type": "chunk", "content": "Word "}
data: {"type": "chunk", "content": "by "}
data: {"type": "chunk", "content": "word"}
data: {"type": "end"}
```

## 🧪 Testing the System

### Test FAISS Search

```bash
cd RAGchatbot
python faiss_indexer.py
# Enter a question when prompted
```

### Test Full API

```bash
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "Wi-Fi çalışmıyor", "messages": []}'
```

## 🔄 Extending the System

### Adding New Data

1. Update `dummy_data.json` with new Q&A pairs
2. Restart the backend (embeddings are regenerated on startup)

### Changing the LLM

1. Install different Ollama model: `ollama pull <model-name>`
2. Update model name in `app.py`

### Modifying the Embedding Model

1. Change model name in `faiss_indexer.py`
2. Ensure model supports your language requirements

## 🐛 Troubleshooting

### Common Issues

1. **FAISS Import Error**

   - Ensure `faiss-cpu` is installed correctly
   - Try `pip install faiss-cpu --no-cache-dir`

2. **Ollama Connection Error**

   - Verify Ollama is running: `ollama list`
   - Check if model is pulled: `ollama pull trendyol-chat`

3. **CORS Errors**

   - Ensure backend is running on port 8000
   - Check CORS settings in `app.py`

4. **Streaming Not Working**
   - Verify SSE support in browser
   - Check network connectivity to backend

## 📈 Performance Considerations

### FAISS Optimization

- **Index Type**: For large datasets, consider `IndexIVFFlat` or `IndexHNSW`
- **Memory Usage**: Current setup loads all embeddings in RAM
- **Query Speed**: O(n) search with `IndexFlatIP`

### Streaming Optimization

- **Chunk Size**: Adjust word-by-word streaming for performance
- **Buffer Management**: Monitor memory usage during long responses

## 🔒 Security Considerations

- **API Endpoints**: Add authentication for production use
- **Environment Variables**: Store sensitive configs in `.env` files
- **CORS**: Restrict origins for production deployment
- **Input Validation**: Add proper request validation

## 📝 Future Enhancements

1. **Advanced RAG Features**:

   - Document chunking for larger texts
   - Multi-modal search (images + text)
   - Query expansion and rewriting

2. **UI Improvements**:

   - Voice input/output
   - File upload for document indexing
   - Chat history persistence

3. **Backend Enhancements**:

   - User authentication
   - Analytics and logging
   - Multiple knowledge bases

4. **Performance Optimizations**:
   - Caching layer
   - Async embedding generation
   - Load balancing for multiple users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

_This documentation covers the complete technical architecture of the RAG chatbot system. For additional questions or contributions, please refer to the project repository._
