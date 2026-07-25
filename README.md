# Nodoos AI — Autonomous Revenue Defense Suite

> **Multi-Tenant SaaS Churn-Rescue Dashboard** with isolated customer telemetry, AI sentiment analysis summaries, rules-matrix playbooks, and per-organization Slack workspace integration.

---

## 🌟 Architecture Overview

```
                         ┌───────────────────────────────────────┐
                         │        SUPABASE (Postgres + pgvector)  │
                         │                                         │
                         │  organizations        profiles          │
                         │  slack_integrations   notifications     │
                         │  fact_product_usage   support_tickets   │
                         │  churn_rescue_actions                   │
                         └───────────────┬─────────────────────────┘
                                         │
                                         ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                  FASTAPI BACKEND (Python)                    │
        │                                                               │
        │   /api/agent/run          → triggers the LangGraph workflow   │
        │   /api/accounts/at-risk   → reads flagged accounts (scoped)   │
        │   /api/actions            → reads churn_rescue_actions log    │
        │   /api/slack/callback     → exchanges codes & encrypts keys   │
        │                                                               │
        │   ┌───────────────────────────────────────────────────────┐  │
        │   │              LANGGRAPH AGENT (agent/graph.py)          │  │
        │   │                                                         │  │
        │   │  Node 1: usage_drop_detector                           │  │
        │   │    → runs SQL (7d vs 28d moving avg) via SQLAlchemy    │  │
        │   │                                                         │  │
        │   │  Node 2: support_sentiment_analyzer                    │  │
        │   │    → pulls open tickets → Groq (Llama 3.3 70B) LLM     │  │
        │   │    → structured Pydantic JSON validation               │  │
        │   │                                                         │  │
        │   │  Node 3: playbook_trigger_agent                        │  │
        │   │    → rules-matrix lookup → writes to Postgres          │  │
        │   │    → looks up & decrypts Slack access credentials      │  │
        │   │    → fires Slack webhook + Resend email                │  │
        │   └───────────────────────────────────────────────────────┘  │
        │              Traced end-to-end via LangSmith / Langfuse       │
        └───────────────┬───────────────────────────────┬───────────────┘
                         │ REST (JSON)                   │ REST (JSON)
                         ▼                               ▼
        ┌───────────────────────────────┐ ┌───────────────────────────────┐
        │     NODOOS AI SUITE LANDING   │ │   CSM EXECUTIVE DASHBOARD    │
        │   - Hero, Features, Pricing   │ │   - At-Risk Accounts Table    │
        │   - Real Supabase Auth        │ │   - Root Cause & Detail Drawer│
        │   - Cookie-based middleware   │ │   - Slack Onboarding Flow     │
        │   - Google OAuth + Sign-up    │ │   - Playbook Edit, Live Signals│
        └───────────────────────────────┘ └───────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Component |
|---|---|
| **Database** | **Supabase Postgres + pgvector** (Free 500MB DB) |
| **Agent Framework** | **LangGraph** (3-node Python graph) |
| **LLM Inference** | **Groq API** (Llama 3.3 70B free) / **Ollama** fallback |
| **Backend API** | **FastAPI + SQLAlchemy 2.0 Async + slowapi** |
| **Frontend UI** | **Next.js 14 (App Router) + Tailwind + shadcn/ui** |
| **Authentication** | **Supabase Auth** (Email + Google OAuth) |
| **Notifications** | **Slack OAuth v2 (Incoming Webhooks)** + **Resend Email API** |
| **Token Security** | **Symmetric cryptography** (`Fernet` key encryption) |
| **Observability** | **LangSmith** |
| **Cron Scheduling** | **GitHub Actions Cron** (runs `POST /api/agent/run-all`) |

---

## ⚡ Setup & Deployment Checklist (Step-by-Step)

Follow these instructions to spin up the entire suite from scratch.

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Under **Project Settings** → **Database**, get your connection string (under URI, use transaction or session pooler, ensure it starts with `postgresql://`).
3. Under **Project Settings** → **API**, copy the `Project URL` (value for `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`) and `anon public` key (value for `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Find the JWT Secret under API settings. This is your `SUPABASE_JWT_SECRET`.
5. Under **Authentication** → **Providers**, enable **Google** (if utilizing Google OAuth) and configure your Google Cloud OAuth Client ID/Secret. Set the redirect URI to:
   `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`.

### 2. Database Migrations
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Copy the contents of [`backend/db/schema.sql`](file:///e:/Personal%20Projects/NodoosAI/backend/db/schema.sql) and execute the queries.
3. This creates all tables (`organizations`, `profiles`, `slack_integrations`, `notifications`, etc.), indexes, enables **Row-Level Security (RLS)**, creates the `get_my_org_id()` helper, and registers the triggers to automatically create organizations and profiles for new users.

### 3. Create a Slack App
1. Go to [Slack API: Applications](https://api.slack.com/apps) and create a new App from scratch.
2. Under **OAuth & Permissions**:
   - Add the Redirect URL: `https://<your-backend-domain>/api/slack/callback` (or `http://localhost:3000/api/slack/callback` for local development).
   - Under **Scopes** → **User Token Scopes** or **Bot Token Scopes**, add `incoming-webhook` and `chat:write`.
3. Under **Basic Information**, retrieve your **Client ID** (`SLACK_CLIENT_ID`) and **Client Secret** (`SLACK_CLIENT_SECRET`).

### 4. Setup Backend Environment (.env)
Create a `.env` in the `backend/` directory with:
```env
DATABASE_URL=postgresql+asyncpg://postgres:<pass>@db.<ref>.supabase.co:5432/postgres
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=<jwt-secret-from-supabase>
SLACK_CLIENT_ID=<slack-client-id>
SLACK_CLIENT_SECRET=<slack-client-secret>
SLACK_TOKEN_ENCRYPTION_KEY=<fernet-32-byte-key>
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL_FROM=onboarding@resend.dev
NOTIFICATION_EMAIL_TO=your-email@company.com
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-domain.vercel.app
```
*Note: Generate `SLACK_TOKEN_ENCRYPTION_KEY` using `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`.*

### 5. Setup Frontend Environment (.env.local)
Create a `.env.local` in the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 6. Local Execution
Run backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m api.main
```
Run frontend:
```bash
cd frontend
npm install
npm run dev
```

### 7. Deployment Configuration
#### Render Deployment (Backend)
- Deploy your repo to Render using the `render.yaml` configuration.
- Render automatically picks up `requirements.txt` and starts the app with Uvicorn.
- Fill out all required environment variables in Render's dashboard.

#### Vercel Deployment (Frontend)
- Deploy the `frontend` folder to Vercel.
- Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL` (pointing to Render) in the Vercel Dashboard.

#### GitHub Actions (Cron + CI)
- Add `ci.yml` and `run-agent.yml` in `.github/workflows/`.
- Configure `BACKEND_API_URL` as a secret in your repository settings.

---

## 👥 License & Credits

Designed with **Google Antigravity** as an open-source alternative to Snowflake CoCo CLI & Cortex. Free tier deployment compatible with Vercel, Render, and Supabase.
