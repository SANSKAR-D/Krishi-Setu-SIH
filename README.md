# Krishi-Setu: Intelligent Farm Management & AI Agronomy System

🌍 **Live Demo:** [https://krishi-setu-sih.vercel.app/](https://krishi-setu-sih.vercel.app/)

**Krishi-Setu** is a comprehensive, microservice-based web platform designed to bridge the gap between precision farming data and daily agricultural practices. It empowers farmers and agronomists with data-driven decision-making through spatial mapping, market insights, and a highly advanced multimodal AI assistant.

---

## 🌟 Key Features

*   **Interactive Dashboard:** A centralized view of agricultural metrics, crop calendars, and real-time market data.
*   **GIS Farm Mapping:** Interactive map (powered by Mapbox and Turf.js) allowing users to draw farm boundaries, calculate exact acreage, and instantly fetch location-specific environmental data (Soil health, Elevation, 7-day Weather forecasts).
*   **ExpertChat (AI Agronomist):** An advanced multimodal AI agent capable of diagnosing crop diseases from uploaded images, referencing documented agricultural knowledge (RAG), and autonomously executing predictive tools for yield and water requirements.
*   **Live Market Data:** Integration with the `Agmarknet` API to fetch real-time commodity prices and arrivals across Indian states.
*   **Crop Calendar Management:** Plan, track, and manage crop cycles efficiently.

---

## 📁 Folder Structure

```text
Krishi-Setu/
├── backend/
│   ├── gis_microservice/       # Python FastAPI for GIS (Mapbox) and Market Data
│   │   ├── database.py         # SQLAlchemy & GeoAlchemy2 models
│   │   ├── main.py             # FastAPI entry point & API routes
│   │   ├── schema.sql          # PostGIS setup scripts
│   │   └── req.txt             # Python dependencies
│   ├── microservices/          # Python FastAPI for AI Agent
│   │   ├── agent.py            # LangGraph workflow, Pinecone RAG, Gemini Tool calling
│   │   ├── backend.py          # FastAPI entry point
│   │   └── pyproject.toml      # Python dependencies
│   └── server/                 # Node.js API Gateway & Auth
│       ├── controllers/        # Logic for Auth, Dashboard, Crop Plans, Chat
│       ├── models/             # Mongoose schemas (User, CropPlan, ChatHistory)
│       ├── routes/             # Express API routes
│       ├── server.js           # Express app setup and MongoDB connection
│       └── package.json        # Node.js dependencies
├── frontend/                   # React.js UI (Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (Dashboard, Navbar, ExpertChat)
│   │   ├── context/            # React Context (AuthContext)
│   │   ├── pages/              # Main route pages (GISMap, Login, Register, MarketData)
│   │   ├── App.jsx             # Main layout and routing
│   │   ├── index.css           # Tailwind configuration & global styles
│   │   └── main.jsx            # React DOM rendering
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite bundler configuration
├── sih_presentation_guide.md   # Generated SIH Presentation slides
├── .gitignore
└── README.md
```

---

## 🏗️ System Architecture

Krishi-Setu utilizes a robust **Microservices Architecture** to separate heavy geospatial processing and AI orchestration from standard web traffic.

### 1. The Client (Frontend)
*   **Framework:** React.js (built with Vite)
*   **Styling:** Tailwind CSS, Lucide Icons
*   **Mapping:** Mapbox GL JS, Turf.js, `@mapbox/mapbox-gl-draw`
*   **Data Visualization:** Recharts
*   **Routing:** React Router DOM

### 2. The API Gateway (Node.js Server)
*   **Framework:** Node.js, Express
*   **Database:** MongoDB Atlas (via Mongoose)
*   **Security:** `express-rate-limit` (Global API rate limiting), JWT Auth, `bcryptjs`
*   **Role:** Acts as the primary entry point. Manages user authentication, saves chat histories, handles crop calendar CRUD operations, and securely proxies requests to the Python microservices.

### 3. AI Agent Microservice (Python)
*   **Framework:** FastAPI
*   **Orchestration:** **LangGraph** (State machine for cyclical AI reasoning and tool calling)
*   **LLM & Tools:** LangChain, Google Gemini (`gemini-3.5-flash-lite`)
*   **RAG (Vector Database):** Pinecone vector store using FastEmbed (`sentence-transformers/all-MiniLM-L6-v2`) for embeddings.
*   **Memory:** PostgreSQL (`langgraph-checkpoint-postgres`) with `psycopg_pool` connection pooling to remember long chat histories efficiently.
*   **Role:** Handles complex conversational logic. It can analyze images via a Deep Learning node, search Pinecone for context, and decide when to trigger external ML models (Yield prediction, Water requirement prediction, Crop recommendations).

### 4. GIS & Market Microservice (Python)
*   **Framework:** FastAPI
*   **Geospatial DB:** PostgreSQL with **PostGIS**, SQLAlchemy, GeoAlchemy2
*   **Geometry Processing:** Shapely
*   **External Integrations:** Open-Meteo API (Weather/Elevation), ISRIC SoilGrids API (Soil Health), Agmarknet API (Market Data).
*   **Role:** Manages the storage and querying of spatial farm boundaries. Aggregates heavy environmental data concurrently using `httpx` async clients and caches results in-memory with TTL to ensure lightning-fast map interactions.

---

## 🔄 Data Flow (Example: ExpertChat)

1.  **Input:** User uploads a photo of a diseased leaf and asks, "What's wrong with my crop?"
2.  **Routing:** React sends the payload to the Node.js API Gateway, which forwards it to the Python AI Microservice.
3.  **State Machine (LangGraph):**
    *   **DL Node:** Evaluates the image against deep learning models.
    *   **RAG Node:** Queries Pinecone for treatments related to the detected disease.
    *   **Agent Node:** Gemini synthesizes the DL results, the RAG context, and historical Postgres memory to formulate a precise answer. (If needed, it loops into a **Tool Node** to run ML predictions before answering).
4.  **Response:** The agronomist-level advice is streamed back to the frontend UI.

---

## ⚙️ Environment Variables Required

To run the full stack locally, you will need the following `.env` configurations across the different services:

### Frontend (`frontend/.env`)
```env
VITE_MAPBOX_TOKEN=your_mapbox_access_token
VITE_GIS_URL=http://localhost:8001
# Add backend API URL if configured differently
```

### Node.js Gateway (`backend/server/.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_URL=your_cloudinary_url # If handling image uploads
```

### AI Microservice (`backend/microservices/.env`)
```env
DATABASE_URL=your_postgres_neon_url_for_memory
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index
GOOGLE_API_KEY=your_gemini_api_key
DL_URL=url_for_deep_learning_service
ML_URL=url_for_ml_prediction_service
```

### GIS Microservice (`backend/gis_microservice/.env`)
```env
# Requires a PostgreSQL database with the PostGIS extension enabled
DATABASE_URL=postgresql://user:password@localhost/gis_db
```

---

## 🚀 Running Locally

1.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
2.  **Node.js API Gateway:**
    ```bash
    cd backend/server
    npm install
    npm run dev
    ```
3.  **Python Microservices (AI & GIS):**
    ```bash
    # Ensure you have Python 3.9+ installed
    # AI Service
    cd backend/microservices
    pip install -r requirements.txt # Adjust based on your setup
    uvicorn backend:app --port 8000 --reload

    # GIS Service
    cd backend/gis_microservice
    pip install -r req.txt
    uvicorn main:app --port 8001 --reload
    ```
