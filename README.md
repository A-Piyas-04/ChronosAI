# Chronos AI

An AI-powered time scheduling platform. Chronos AI authenticates users, manages tasks and preferences, syncs Google Calendar events, and uses a rule-based scheduling engine to generate an optimised weekly plan — surfaced through a Next.js calendar UI.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start — Docker (recommended)](#quick-start--docker-recommended)
- [Manual Setup — Local Development](#manual-setup--local-development)
  - [1. Backend](#1-backend)
  - [2. Frontend](#2-frontend)
- [Using the GUI](#using-the-gui)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2, Alembic, asyncpg |
| **Task queue** | Celery 5 + Redis 7 |
| **Database** | PostgreSQL 16 |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Auth** | JWT (email/password) + Google OAuth 2.0 |
| **Calendar** | Google Calendar API, FullCalendar (in-browser) |

---

## Prerequisites

| Tool | Min version | Notes |
|------|-------------|-------|
| Docker + Docker Compose | Latest stable | For the recommended path |
| Python | 3.11+ | For local backend |
| Node.js | 18+ | For local frontend |
| PostgreSQL | 16 | If running locally without Docker |
| Redis | 7 | If running locally without Docker |

---

## Project Structure

```
ChronosAI/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Route handlers (auth, users, tasks, calendar, schedule, jobs)
│   │   ├── core/            # Config (Pydantic Settings), security, dependencies
│   │   ├── db/              # SQLAlchemy models, Alembic migrations
│   │   ├── services/        # Scheduling engine, Google Calendar service
│   │   └── workers/         # Celery app, calendar sync & schedule tasks
│   ├── tests/
│   ├── .env.example
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── (auth)/          # /login, /register pages
│   │   └── (app)/           # /dashboard, /tasks, /onboarding pages
│   ├── components/          # UI components (WeeklyCalendar, modals, etc.)
│   ├── lib/                 # Axios client, query hooks, utilities
│   ├── .env.local.example
│   └── package.json
├── Docs/
│   ├── api.md               # Full API reference
│   ├── scheduling-logic.md  # Scheduling engine details
│   └── chronos-db-plan.md   # Database design
└── docker-compose.yml
```

---

## Quick Start — Docker (recommended)

This path starts every service (Postgres, Redis, backend, Celery worker + beat, frontend) with a single command.

**1. Clone and enter the repo**

```bash
git clone <repo-url>
cd ChronosAI
```

**2. Create the backend environment file**

```bash
copy backend\.env.example backend\.env
```

Open `backend\.env` and fill in the required values:

```env
# Generate a random secret key, e.g.: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=<your-secret-key>

# Generate a Fernet key: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEY=<your-fernet-key>

# These are pre-filled for Docker networking — leave as-is unless you change service names
DATABASE_URL=postgresql+asyncpg://chronos_user:chronos_pass@db:5432/chronos_db
REDIS_URL=redis://redis:6379/0

# Optional: fill in to enable Google OAuth and Calendar sync
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**3. Start all services**

```bash
docker compose up --build
```

> On first run Docker builds both images. Subsequent starts are faster: `docker compose up`.

**4. Run database migrations**

In a second terminal, once the `backend` container is healthy:

```bash
docker compose exec backend alembic upgrade head
```

**5. Open the app**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Interactive API docs (Swagger) | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health check | http://localhost:8000/health |

---

## Manual Setup — Local Development

Use this path if you want hot-reload on both sides without Docker. You still need a running **PostgreSQL 16** and **Redis 7** instance (either locally installed or via `docker compose up db redis`).

### 1. Backend

**Create and activate a virtual environment**

```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

**Install dependencies**

```bash
pip install -r requirements.txt
```

**Configure environment variables**

```bash
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `.env`. For a local database, change the host from `db` to `localhost`:

```env
DATABASE_URL=postgresql+asyncpg://chronos_user:chronos_pass@localhost:5432/chronos_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<your-secret-key>
FERNET_KEY=<your-fernet-key>
FRONTEND_URL=http://localhost:3000
```

**Apply database migrations**

```bash
alembic upgrade head
```

**Start the API server**

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend is now running at **http://localhost:8000**.

**Start Celery worker (optional — needed for async schedule generation and calendar sync)**

In a separate terminal (with the venv active, from the `backend` folder):

```bash
celery -A app.workers.celery_app:celery_app worker --loglevel=info --queues=calendar_sync,schedule_generation
```

**Start Celery beat (optional — periodic calendar sync)**

```bash
celery -A app.workers.celery_app:celery_app beat --loglevel=info
```

---

### 2. Frontend

**Install dependencies**

```bash
cd frontend
npm install
```

**Configure environment variables**

```bash
copy .env.local.example .env.local   # Windows
# cp .env.local.example .env.local   # macOS/Linux
```

The defaults already point to the local backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Start the dev server**

```bash
npm run dev
```

The frontend is now running at **http://localhost:3000**.

---

## Using the GUI

Open **http://localhost:3000** in your browser. The app redirects to `/login` if you have no session.

### 1. Register an account

Go to **http://localhost:3000/register**, fill in your name, email, and password, then click **Sign Up**.  
Alternatively use **Continue with Google** if you have configured OAuth credentials.

### 2. Onboarding

After first login you are redirected to `/onboarding`. Set your:
- **Working hours** (e.g. 09:00 – 18:00)
- **Preferred focus block duration**
- **Break preferences**

These preferences drive the scheduling engine.

### 3. Create tasks — `/tasks`

Click **New Task** and fill in:
- Title and description
- Priority (low / medium / high)
- Due date
- Estimated duration (hours)

Tasks appear in the task list and are inputs to the schedule generator.

### 4. Dashboard — `/dashboard`

The dashboard shows a **weekly calendar view**. Use the **← Prev / Next →** buttons to navigate weeks.

Click **Generate Schedule** to open the modal:
- Select the target week
- Click **Generate** — this calls `POST /api/v1/schedule/generate` (synchronous) or triggers an async Celery job via `POST /api/v1/jobs/generate-schedule` if the worker is running

Once generated, colour-coded session blocks appear on the calendar showing when to work on each task.

### 5. Google Calendar sync (optional)

If Google OAuth is configured, go to the profile / settings area and connect your Google account. The backend will fetch your busy events and the scheduling engine will avoid those windows when building your plan.

---

## API Reference

Full endpoint documentation lives in [`Docs/api.md`](Docs/api.md).

Interactive Swagger UI is available at **http://localhost:8000/docs** while the server is running.

Key route groups:

| Prefix | Description |
|--------|-------------|
| `POST /api/v1/auth/register` | Create account |
| `POST /api/v1/auth/login` | Obtain JWT |
| `GET  /api/v1/auth/google` | Start Google OAuth flow |
| `GET  /api/v1/users/me` | Current user profile |
| `CRUD /api/v1/tasks` | Task management |
| `GET  /api/v1/calendar/events` | Fetch synced calendar events |
| `POST /api/v1/schedule/generate` | Generate weekly schedule (sync) |
| `GET  /api/v1/schedule` | Retrieve existing schedule sessions |
| `POST /api/v1/jobs/generate-schedule` | Queue async schedule generation |
| `GET  /api/v1/jobs/{job_id}` | Poll async job status |
| `GET  /health` | Health check |

---

## Running Tests

**Backend**

```bash
cd backend
pytest
```

Tests use `pytest-asyncio` and set `CELERY_TASK_ALWAYS_EAGER=true` via `conftest.py` so Celery tasks execute synchronously without a running worker.

**Frontend**

```bash
cd frontend
npm run lint
```
