# This is a collaboration project with a team of 4, where I largely contribute to Frontend, Backend and Hosting issues

# 🚀 Agicom - E-commerce Management Agentic AI System

**Project for GDGoC Hackathon 2026 - Team FUTURA**

**Agicom** is a smart E-commerce Management software system (E-commerce Dashboard) powered by a **Multi-Agent AI** architecture. Instead of just being a standard chatbot, Agicom operates as a virtual staff team, helping SME business owners automate Customer Service, Pricing Strategy Proposals, Content Planning, and Crisis Management in real-time.

---

## 🌟 Why Agicom?

SME shop owners are often overwhelmed with handling hundreds of messages, tracking competitor prices, and dealing with negative reviews. Agicom solves this problem using the **Observe -> Think -> Plan -> Act -> Learn** model:
- **Automation:** AI automatically replies to customers based on shop policies & context.
- **Optimization:** Tracks market prices to propose pricing strategies that maintain profit margins.
- **Continuous Learning:** Automatically saves AI responses edited by the shop owner into a Vector DB so the AI becomes smarter every day.

---

## 🧠 Multi-Agent Architecture

The system is divided into specialized Agents that communicate with each other via `CoordinationTasks` (SQLite):

### 1. 💬 Customer Service Agent (CSKH)
- **Technology:** RAG (Retrieval-Augmented Generation) combined with ChromaDB.
- **Task:** Reply to customer messages (Live Chat). Look up shop policies, product information, and conversation history.
- **Key Features:** Capable of personalization based on *Customer Profiles* (calculating churn probability, LTV). Integrates a **Safety Guardrail**: If unsafe content is detected in the message (`is_safe == False`) or the AI is not confident (`confidence_score < 0.7`), the message will be held back for the shop owner to approve.

### 2. 💰 Pricing Agent (Pricing & Strategy)
- **Task:** Analyze market data (competitor prices, ratings) and internal data (inventory, minimum profit margin).
- **Key Features:** Makes decisions to "Discount", "Increase price for positioning", or "Stand still". All decisions must ensure `min_margin_percent` (Slow Track flow).

### 3. 📝 Content Agent (Content Creation)
- **Task:** Listen to "pain points" from repeated questions in Live Chat and 1-3 star Reviews.
- **Key Features:** Automatically proposes producing TikTok Videos, FAQ Blogs, Comparison articles... along with estimated implementation time and impact level.

### 4. 🛡️ Risk & Quality Agent (Crisis Management)
- **Task:** Monitor all reviews and conversations.
- **Key Features:** If toxic phrases or 1-star reviews are detected, the AI switches the system state to **RED LEVEL**, automatically generating a *Crisis Response Plan* (Pause Ads, pre-draft customer apology templates).

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (SPA Architecture, no frameworks used to optimize speed).
- **Backend:** Python, FastAPI, SQLAlchemy.
- **Database:** - **Relational DB:** PostgreSQL (Deploy) / SQLite (Local)
  - **Vector DB:** ChromaDB (Stores knowledge base for RAG)
- **AI Models:** Google Gemini (`gemini-flash-latest` for reasoning).
- **Deployment:** Render (Backend) & Netlify (Frontend).

---

## 🔌 Core Endpoints

*(Note: The source code contains some experimental endpoints, below is the list of main APIs currently operating the system)*

| HTTP | Endpoint | Function |
|------|----------|-----------|
| `POST` | `/chat-v3` | Live Chat communication: Processes RAG, analyzes customer sentiment, returns Confidence Score. |
| `POST` | `/slow-track-strategy`| Pushes market data to AI for analysis and returns pricing strategy. |
| `GET` | `/api/content-suggestions`| Fetches a list of Content proposals synthesized by AI from Chats & Reviews. |
| `POST` | `/learn-from-review` | Analyzes new Reviews, extracts lessons to save to ChromaDB, creates warning tasks if reviews are bad. |
| `POST` | `/learn-feedback` | Human-in-the-loop: Shop owner edits AI's response, system saves the new Q&A pair to memory. |
| `GET` | `/api/crisis-overview`| Fetches aggregated crisis data (Bad reviews + Toxic chats) to display warnings. |
| `GET` | `/daily-summary` | Exports Daily Report. |

---

## 💻 Local Setup & Run Guide

### 1. Backend (FastAPI)
Requirements: Python 3.8+

```bash
# 1. Clone the repository & navigate to the backend folder
git clone https://github.com/your-repo/gdgoc-futura-agicom.git
cd gdgoc-futura-agicom/backend

# 2. Create a virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate  # (For Windows: venv\Scripts\activate)
pip install -r requirements.txt

# 3. Configure environment variables
# Create a .env file and add your Google Gemini API Key
echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env

# 4. Start the Server
uvicorn main:app --reload --port 8000
```
*Note: On the first run, the system will automatically call the `seed_demo.py` file to load sample data (products, chat history, vector DB) into SQLite and ChromaDB.*

### 2. Frontend (HTML/JS)
Because the Frontend uses pure Vanilla JS, you do not need to install Node.js or npm.
1. Navigate to the `frontend/` directory.
2. Open the `config.js` file and ensure the `AGICOM_API_BASE` variable is pointing to `http://localhost:8000`.
3. Use **Live Server** (VSCode Extension) or Python HTTP server to run:
```bash
python -m http.server 3000
```
4. Access `http://localhost:3000` to view the Dashboard.

---

## 🌍 Deployment Guide (Cloud)

The system is pre-configured for easy deployment on Cloud platforms:

### Deploy Backend (Render)
- The project includes a `render.yaml` file. You just need to create a Web Service on Render and point it to the repo.
- Add environment variables: `GOOGLE_API_KEY` and `DATABASE_URL` (Using Render's PostgreSQL).
- *Note on ChromaDB:* Due to Render's file system limits, the system uses `chromadb.EphemeralClient()`. Every time the server restarts, the code will automatically run `seed_demo.py` to reload the Knowledge base.

### Deploy Frontend (Netlify)
- Point Netlify to the `frontend/` directory.
- The `netlify.toml` and `_redirects` files are pre-configured to support SPA routing.
- **Important:** Update the `frontend/config.js` file to change the `AGICOM_API_BASE` variable to your Render Backend domain.

---

## 📂 Repo Tree
```text
.
├── backend
│   ├── main.py             # Main Router & API Endpoints
│   ├── services.py         # Processing logic of AI Agents
│   ├── database.py         # SQLAlchemy Config & Database Models
│   ├── models.py           # Pydantic Schemas for API
│   ├── prompts.py          # System Prompts for Gemini AI
│   ├── config.py           # ChromaDB & Gemini Client Config
│   └── seed_demo.py        # Script to load sample data
├── frontend
│   ├── index.html          # UI Layout framework
│   ├── app4.js             # Dashboard render logic & UI interaction
│   ├── api_integration.js  # API integration calls to Backend
│   ├── config.js           # Only file needing config changes for environments (Local/Cloud)
│   └── index4.css          # Design System
└── render.yaml             # Automated deployment config for Render
```

---

## 👨‍💻 Development Team

**FUTURA TEAM - GDGoC Hackathon 2026**
- *We believe that AI was not created to replace humans, but to serve as a powerful assistant, helping SME businesses focus on growth instead of operations.*

---
*MIT License © 2026 Team FUTURA*
