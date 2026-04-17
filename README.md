# 🤖 Agicom - AI-Powered Customer Service Agent

**GDGoC Hackathon 2026 - Team FUTURA**

An intelligent multi-agent system designed to revolutionize e-commerce customer service through AI-driven insights, real-time coordination, and automated decision-making.

---

## 📋 Overview

Agicom is a sophisticated customer service management platform that leverages AI agents to handle diverse tasks across:

- **Customer Support** - Intelligent chatbot for customer inquiries and support
- **Review Analysis** - AI-powered sentiment analysis and insights from customer reviews
- **Pricing Strategy** - Data-driven pricing recommendations and optimization
- **Content Management** - Automated content generation and optimization
- **Risk Management** - Proactive identification and mitigation of business risks

---

## 🎯 Key Features

### 🧠 Multi-Agent Architecture
- **CS Agent**: Handles customer support tickets and inquiries
- **Pricing Agent**: Analyzes market trends and recommends pricing strategies
- **Content Agent**: Generates and optimizes product descriptions and marketing content
- **Risk Agent**: Monitors and alerts on potential business risks

### 📊 Intelligent Dashboard
- Real-time KPI tracking (Revenue, Orders, Conversion Rate, AOV)
- Visual performance trends and analytics
- Task coordination and workflow management
- Daily summary reports and insights

### 💬 Advanced Chat System
- Context-aware customer conversations
- Chat history management
- Personalized customer profiles
- Ẩn danh (Anonymous) support

### 🗄️ Robust Data Management
- Review log tracking with AI insights
- Coordination task management
- Daily archive and reporting
- Multi-database support (SQLite/PostgreSQL)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python (40.3%) |
| **Frontend** | JavaScript (22.3%), HTML (5.7%) |
| **Styling** | CSS (31.7%) |
| **Database** | SQLAlchemy ORM |
| **Framework** | FastAPI (Python backend) |

---

## 📁 Project Structure

```
gdgoc-futura-agicom/
├── backend/
│   ├── database.py          # Database models & ORM setup
│   ├── agents/              # AI Agent implementations
│   └── api/                 # FastAPI routes
├── frontend/
│   ├── assets/
│   │   ├── css/             # Styling (components, variables)
│   │   ├── js/              # JavaScript functionality
│   │   └── images/          # Assets
│   └── views/               # HTML pages
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+ (optional, for frontend development)
- PostgreSQL or SQLite

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hmd-dsai/gdgoc-futura-agicom.git
   cd gdgoc-futura-agicom
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure database**
   - Update `SQLALCHEMY_DATABASE_URL` in `backend/database.py`
   - Run migrations: `python -c "from backend.database import init_db; init_db()"`

4. **Start the backend**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

5. **Open the frontend**
   - Serve frontend files using your preferred HTTP server
   - Navigate to `http://localhost:8000`

---

## 📊 Database Schema

### Core Tables
- **ChatLogs** - Customer service chat records
- **ReviewLog** - Product reviews with AI insights
- **CoordinationTask** - Inter-agent task assignments
- **DailySummaryArchive** - Historical reports and insights
- **ChatMessage** - Chat history for personalized conversations

---

## 🔗 API Endpoints

Key backend endpoints include:
- `/chat` - Customer service chat interface
- `/reviews` - Review analysis and insights
- `/pricing` - Pricing recommendations
- `/content` - Content generation
- `/dashboard` - Analytics and KPI data

---

## 👥 Team FUTURA

**GDGoC Hackathon 2026 Project**

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## 📞 Support

For questions or issues, please open a GitHub issue or contact the team.

---

**Last Updated**: April 17, 2026
```

---

## 💡 Next Steps

You can customize this README further by:

1. **Adding a Demo/Screenshots section** with GIF or images of the dashboard
2. **Including setup instructions** for AI model configuration
3. **Adding API documentation** with example requests/responses
4. **Documenting agent capabilities** in detail
5. **Adding troubleshooting section** for common issues

Would you like me to:
- Update the README with any specific information?
- Push this README to your repository?
- Add additional sections?