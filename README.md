# PlanBoard

**Multi-Tenant SaaS Project Management Platform** — Jira-inspired Kanban board with real-time collaboration, workspace RBAC, and live comment threads.

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express + Sequelize ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (localStorage) |
| Real-time | Socket.IO |
| Email | Nodemailer + Gmail App Password |
| API Docs | Swagger UI at `/api/docs` |
| Deploy | Render (Static Site + Web Service + Managed DB) |

---

## Project Structure

```
PlanBoard/
├── frontend/               # React + Vite static site
│   ├── public/
│   │   └── _redirects      # Render SPA fallback rule
│   ├── src/
│   │   ├── api/            # Axios modules per resource
│   │   ├── components/     # Navbar, KanbanBoard, TaskDrawer, etc.
│   │   ├── context/        # AuthContext, WorkspaceContext
│   │   ├── pages/          # Login, Signup, Dashboard, Board, …
│   │   └── utils/          # helpers, socket, toast, constants
│   ├── .env.example
│   └── vite.config.js
│
├── backend/                # Express + Sequelize API server
│   ├── config/             # db.js, mailer.js
│   ├── controllers/
│   ├── middleware/         # auth.js, rbac.js, errorHandler.js
│   ├── models/             # User, Workspace, Project, Task, …
│   ├── routes/
│   ├── services/           # mailerService.js
│   ├── sockets/            # Socket.IO init + emitter
│   ├── swagger.js
│   ├── server.js
│   └── .env.example
│
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm))
- PostgreSQL 14+ running locally

### 1. Clone the repo

```bash
git clone <repo-url>
cd PlanBoard
```

### 2. Set up the backend

```bash
cd backend

# Copy and edit env vars
cp .env.example .env
```

Open `backend/.env` and set:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgres://<user>:<pass>@localhost:5432/planboard` |
| `JWT_SECRET` | Any long random string |
| `CLIENT_URL` | `http://localhost:3000` |
| `GMAIL_USER` | Your Gmail address *(optional — for invite emails)* |
| `GMAIL_PASS` | Gmail App Password *(optional)* |

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE planboard;"

# Install dependencies and start (auto-syncs DB schema on first run)
npm install
npm run dev
# → API running at http://localhost:5000
# → Swagger docs at http://localhost:5000/api/docs
```

### 3. Set up the frontend

```bash
# In a new terminal
cd frontend

cp .env.example .env
# Local dev: leave VITE_API_URL and VITE_SOCKET_URL empty
# Vite proxy routes /api and /socket.io to localhost:5000

npm install
npm run dev
# → App running at http://localhost:3000
```

### Local URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Docs (Swagger) | http://localhost:5000/api/docs |
| Health check | http://localhost:5000/health |

---

## Deploy to Render

### Architecture

```
Render Project: PlanBoard
├── planboard-db      → PostgreSQL (Managed Database)
├── planboard-server  → Web Service  (Node.js — backend/)
└── planboard-client  → Static Site  (React build — frontend/)
```

### Step 1 — Create the Managed Database

1. In Render dashboard → **New → PostgreSQL**
2. Name: `planboard-db`, Region: your choice
3. After creation, copy the **Internal Database URL** (used in the next step)

### Step 2 — Deploy the Backend (Web Service)

1. **New → Web Service** → connect your GitHub repo
2. Settings:

| Field | Value |
|---|---|
| Name | `planboard-server` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |

3. Environment variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | Internal Database URL from Step 1 |
| `JWT_SECRET` | A long random secret (generate with `openssl rand -hex 32`) |
| `CLIENT_URL` | `https://planboard-client.onrender.com` *(set after frontend is deployed)* |
| `GMAIL_USER` | Your Gmail address *(optional)* |
| `GMAIL_PASS` | Gmail App Password *(optional)* |
| `NODE_ENV` | `production` |

4. Deploy — note the service URL (e.g. `https://planboard-server.onrender.com`)

### Step 3 — Deploy the Frontend (Static Site)

1. **New → Static Site** → connect your GitHub repo
2. Settings:

| Field | Value |
|---|---|
| Name | `planboard-client` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

3. Environment variables:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://planboard-server.onrender.com` |
| `VITE_SOCKET_URL` | `https://planboard-server.onrender.com` |

4. Deploy

### Step 4 — Update CORS on backend

Go back to `planboard-server` on Render and update:
```
CLIENT_URL = https://planboard-client.onrender.com
```

Trigger a redeploy.

> **Tip — prevent cold starts**: Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://planboard-server.onrender.com/health` every 5 minutes. Render free tier services sleep after 15 minutes of inactivity.

---

## Environment Variables Reference

### `backend/.env`

| Variable | Required | Description |
|---|:---:|---|
| `PORT` | No | HTTP port (default: 5000) |
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs |
| `CLIENT_URL` | ✅ | Frontend origin (CORS whitelist) |
| `GMAIL_USER` | No | Gmail address for invite emails |
| `GMAIL_PASS` | No | Gmail [App Password](https://support.google.com/accounts/answer/185833) |

### `frontend/.env`

| Variable | Required | Description |
|---|:---:|---|
| `VITE_API_URL` | No* | Backend base URL. Empty = use Vite proxy (local dev) |
| `VITE_SOCKET_URL` | No* | Socket.IO server URL. Empty = same origin |

*Required in production (Render), optional in local dev.

---

## API Overview

Full interactive docs at `/api/docs` (Swagger UI).

| Method | Endpoint | Auth | Min Role |
|---|---|:---:|---|
| POST | `/api/auth/signup` | No | — |
| POST | `/api/auth/login` | No | — |
| GET | `/api/workspaces/mine` | JWT | — |
| POST | `/api/workspaces` | JWT | — |
| PATCH | `/api/workspaces/:id` | JWT | ADMIN |
| GET | `/api/workspaces/:id/stats` | JWT | MEMBER |
| GET | `/api/workspaces/:id/members` | JWT | MEMBER |
| POST | `/api/workspaces/:id/invite` | JWT | MANAGER |
| POST | `/api/invitations/:token/accept` | JWT | — |
| PATCH | `/api/workspaces/:id/members/:userId` | JWT | ADMIN |
| DELETE | `/api/workspaces/:id/members/:userId` | JWT | ADMIN |
| GET | `/api/workspaces/:id/projects` | JWT | MEMBER |
| POST | `/api/workspaces/:id/projects` | JWT | MANAGER |
| PATCH | `/api/projects/:id` | JWT | MANAGER |
| DELETE | `/api/projects/:id` | JWT | MANAGER |
| GET | `/api/projects/:id/tasks` | JWT | MEMBER |
| POST | `/api/projects/:id/tasks` | JWT | MEMBER |
| PATCH | `/api/tasks/:id` | JWT | MEMBER |
| DELETE | `/api/tasks/:id` | JWT | MANAGER |
| GET | `/api/tasks/:id/comments` | JWT | MEMBER |
| POST | `/api/tasks/:id/comments` | JWT | MEMBER |
| DELETE | `/api/comments/:id` | JWT | MEMBER* |

\* Own comments only; MANAGER+ can delete any.

---

## Socket.IO Events

Connect with JWT auth:
```js
const socket = io('https://planboard-server.onrender.com', {
  auth: { token: localStorage.getItem('planboard_token') }
});
socket.emit('join:workspace', workspaceId);
```

| Event (server → client) | Payload | Trigger |
|---|---|---|
| `task:created` | `{ task }` | New task added to any project |
| `task:updated` | `{ task }` | Task fields changed |
| `task:deleted` | `{ taskId }` | Task removed |
| `comment:added` | `{ comment }` | New comment posted |

---

## Features

- 🔐 **Auth** — JWT signup / login, email-based workspace invitations
- 🏢 **Multi-workspace** — create and switch between workspaces
- 👥 **RBAC** — ADMIN / MANAGER / MEMBER with enforced permissions on every endpoint
- 📋 **Kanban board** — 4 columns: Todo → In Progress → In Review → Done
- 🖱️ **Drag & Drop** — HTML5 Drag API, no external libraries
- ⚡ **Real-time** — task and comment updates across browser sessions via Socket.IO
- 💬 **Comments** — live comment threads with Ctrl+Enter to post
- 📊 **Dashboard** — stat cards, My Tasks, Recent Activity feed
- 📧 **Invitations** — styled HTML email invites via Nodemailer + Gmail
- 📖 **API Docs** — Swagger UI with persistent bearer auth at `/api/docs`
- 🏥 **Health check** — `GET /health` for uptime monitoring

---

## RBAC Matrix

| Action | ADMIN | MANAGER | MEMBER |
|---|:---:|:---:|:---:|
| Workspace settings | ✅ | ❌ | ❌ |
| Invite / remove members | ✅ | ✅ | ❌ |
| Create / delete projects | ✅ | ✅ | ❌ |
| Create / assign tasks | ✅ | ✅ | ✅ |
| Delete any task | ✅ | ✅ | ❌ |
| Comment on tasks | ✅ | ✅ | ✅ |
| Delete own comments | ✅ | ✅ | ✅ |
