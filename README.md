# PlanBoard

**Multi-Tenant SaaS Project Management Platform** — Jira-inspired Kanban board with real-time collaboration.

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express + Sequelize |
| Database | PostgreSQL 16 |
| Auth | JWT (localStorage) |
| Real-time | Socket.IO |
| Email | Nodemailer + Gmail |
| Docs | Swagger UI `/api/docs` |
| Local Dev | Docker Compose |

---

## Local Development (Docker Compose)

### Prerequisites
- Docker + Docker Compose
- Git

### 1. Clone and configure
```bash
git clone <repo-url>
cd planboard

cp .env.example .env
# Edit .env — at minimum set JWT_SECRET
```

### 2. Start everything
```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| API Docs | http://localhost:5000/api/docs |
| PostgreSQL | localhost:5432 |

### 3. Stop
```bash
docker-compose down          # stop containers
docker-compose down -v       # stop + delete database volume
```

---

## Local Development (Without Docker)

### Prerequisites
- Node.js 26+ (via nvm)
- PostgreSQL 14+

### Backend

```bash
cd planboard-server
cp .env.example .env       # set DATABASE_URL, JWT_SECRET
npm install
npm run dev                # → http://localhost:5000
```

### Frontend

```bash
cd planboard-client
npm install
npm run dev                # → http://localhost:5173
```

---

## Environment Variables

### Root `.env` (docker-compose)

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key for JWT signing |
| `GMAIL_USER` | Gmail address for invitations (optional) |
| `GMAIL_PASS` | Gmail app password (optional) |

### `planboard-server/.env`

See [`planboard-server/.env.example`](planboard-server/.env.example)

### `planboard-client` (Vite)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |

---

## Deploy to Render

### Services to create

| Name | Type | Root dir |
|---|---|---|
| `planboard-db` | PostgreSQL (managed) | — |
| `planboard-server` | Web Service (Node) | `planboard-server/` |
| `planboard-client` | Static Site | `planboard-client/` |

### planboard-server env vars (Render)

```
DATABASE_URL   → auto-injected from Render PostgreSQL
JWT_SECRET     → your secret
CLIENT_URL     → https://planboard.onrender.com
GMAIL_USER     → your gmail (optional)
GMAIL_PASS     → gmail app password (optional)
```

### planboard-client build settings (Render)

```
Build command:   npm run build
Publish dir:     dist
```

Env vars:
```
VITE_API_URL    → https://planboard-api.onrender.com
VITE_SOCKET_URL → https://planboard-api.onrender.com
```

> **Sleep fix**: Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/health` every 10 min to prevent Render cold starts.

---

## Project Structure

```
planboard/
├── planboard-client/          # React + Vite frontend
│   ├── src/
│   │   ├── api/               # Axios modules per resource
│   │   ├── components/        # Navbar, KanbanBoard, TaskDrawer, etc.
│   │   ├── context/           # AuthContext, WorkspaceContext
│   │   ├── pages/             # Login, Signup, Dashboard, Board, etc.
│   │   └── utils/             # helpers, socket, toast, constants
│   └── Dockerfile
│
├── planboard-server/          # Express + Sequelize backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Features

- 🔐 **Auth** — JWT-based signup/login, invitation flow via email
- 🏢 **Multi-workspace** — create and switch between workspaces
- 👥 **RBAC** — ADMIN / MANAGER / MEMBER roles with enforced permissions
- 📋 **Kanban board** — 4-column drag-and-drop (Todo → In Progress → In Review → Done)
- ⚡ **Real-time** — task and comment updates via Socket.IO across browser tabs
- 💬 **Comments** — live comment threads on tasks
- 📊 **Dashboard** — stats cards, My Tasks, Recent Activity
- 📧 **Invitations** — email invites via Nodemailer + Gmail
- 📖 **API Docs** — Swagger UI at `/api/docs`
