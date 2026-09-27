# Parently 💜
> **Family-Centered Elder Care & Health Intelligence Platform**

Parently is a modern, proactive caregiving companion designed to give adult children peace of mind while empowering aging parents to stay connected, adhere to medication schedules, and monitor vital wellbeing signals.

---

## ✨ Highlights & Key Features

- **Care Calendar & Routine Monitoring**:
  - Unified timeline supporting **Medications, Health Check-ins, Doctor Visits, Activities, Reminders, and Clinical Alerts**.
  - **Day, Week, and Month** views with live current-time indicator and adherence badges.
  - **Today's Care Overview**: Daily caregiver intelligence summarizing medication adherence, check-in completion, activity counts, and pending appointments.
  - Interactive event detail drawer with medication dosages, physician info, and completion toggles.
- **Glass Intelligence Design System**:
  - High-end aesthetics featuring soft lavender accents, translucent frosted cards, subtle micro-interactions, responsive sliders, and rich data visualization.
- **Proactive Health & Daily Check-ins**:
  - Health logs (blood pressure, glucose, vitals, mood, pain level).
  - Medicine management with frequency, dosage instructions, and reminders.
- **AI Care Assistant & Reports**:
  - Longitudinal wellness summaries and risk flagging powered by FastAPI and language models.
- **Family Engagement**:
  - Multi-parent switching (`ParentSelector`), family timeline, quizzes, and legacy prompts.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS & Glassmorphism design tokens
- **Animations**: Framer Motion
- **State Management**: Zustand (with local persistence)
- **Data Fetching**: TanStack React Query & Axios
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ORM & Database**: SQLAlchemy with SQLite (local development) / PostgreSQL ready
- **Migrations**: Alembic
- **Async Tasks & Scheduling**: Celery with Redis
- **Security**: JWT Authentication, bcrypt password hashing, rate limiting, and OTP password recovery

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+
- (Optional) Redis for Celery background tasks

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev
```
Frontend web application will be accessible at `http://localhost:5173`.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── api/v1/           # REST endpoints (auth, health, medicines, calendar, ai)
│   │   ├── core/             # Security, config, DB session, rate-limiting
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Business logic, email, AI, reports
│   ├── celery_tasks/         # Celery background workers
│   └── requirements.txt
├── frontend/
│   ├── public/               # Static assets & web manifest
│   ├── src/
│   │   ├── api/              # API clients & mock services
│   │   ├── components/
│   │   │   ├── calendar/     # Care Calendar (Day, Week, Month, Detail Sheet, Add Modal)
│   │   │   ├── layout/       # Sidebar, BottomNav, Shell
│   │   │   ├── shared/       # ParentSelector, PageHeader, Skeletons
│   │   │   └── ui/           # Radix UI primitives
│   │   ├── hooks/            # React Query hooks
│   │   ├── pages/            # App screens (Calendar, Dashboard, Health, Auth)
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript definitions
│   └── package.json
├── .gitignore                # Comprehensive exclusions for security & hygiene
└── README.md
```

---

## 🔒 Security & Privacy

- All sensitive keys (`.env`), credentials, database files (`*.db`), virtual environments (`.venv`), and build artifacts are strictly excluded from version control.
- See `.env.example` files in root, `backend/`, and `frontend/` for required environment variables.
