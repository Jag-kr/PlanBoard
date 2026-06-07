# PlanBoard

**Multi-Tenant SaaS Project Management Platform** — Jira-inspired Kanban board with real-time collaboration, workspace RBAC, and live comment threads.

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18 + Vite + Tailwind CSS                  |
| Backend  | Node.js + Express + Sequelize ORM               |
| Database | PostgreSQL 16                                   |
| Auth     | JWT (localStorage)                              |
| Email    | Nodemailer + Gmail App Password                 |
| Deploy   | Render (Static Site + Web Service + Managed DB) |

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
│   │   └── utils/          # helpers, toast, constants
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

| Variable       | Value                                               |
| -------------- | --------------------------------------------------- |
| `DATABASE_URL` | `postgres://<user>:<pass>@localhost:5432/planboard` |
| `JWT_SECRET`   | Any long random string                              |
| `CLIENT_URL`   | `http://localhost:3000`                             |
| `GMAIL_USER`   | Your Gmail address _(optional — for invite emails)_ |
| `GMAIL_PASS`   | Gmail App Password _(optional)_                     |

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE planboard;"

# Install dependencies and start (auto-syncs DB schema on first run)
npm install
npm run dev
# → API running at http://localhost:3001
```

### 3. Set up the frontend

```bash
# In a new terminal
cd frontend

cp .env.example .env

npm install
npm run dev
# → App running at http://localhost:3000
```

### Local URLs

| Service      | URL                          |
| ------------ | ---------------------------- |
| Frontend     | http://localhost:3000        |
| Backend API  | http://localhost:3001        |
| Health check | http://localhost:3001/health |

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

| Field          | Value              |
| -------------- | ------------------ |
| Name           | `planboard-server` |
| Root Directory | `backend`          |
| Runtime        | Node               |
| Build Command  | `npm install`      |
| Start Command  | `npm start`        |

3. Environment variables:

| Key            | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL` | Internal Database URL from Step 1                                          |
| `JWT_SECRET`   | A long random secret (generate with `openssl rand -hex 32`)                |
| `CLIENT_URL`   | `https://planboard-client.onrender.com` _(set after frontend is deployed)_ |
| `GMAIL_USER`   | Your Gmail address _(optional)_                                            |
| `GMAIL_PASS`   | Gmail App Password _(optional)_                                            |
| `NODE_ENV`     | `production`                                                               |

4. Deploy — note the service URL (e.g. `https://planboard-server.onrender.com`)

### Step 3 — Deploy the Frontend (Static Site)

1. **New → Static Site** → connect your GitHub repo
2. Settings:

| Field             | Value                          |
| ----------------- | ------------------------------ |
| Name              | `planboard-client`             |
| Root Directory    | `frontend`                     |
| Build Command     | `npm install && npm run build` |
| Publish Directory | `dist`                         |

3. Environment variables:

| Key | Value |
| --- | ----- |

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

| Variable       | Required | Description                                                             |
| -------------- | :------: | ----------------------------------------------------------------------- |
| `PORT`         |    No    | HTTP port (default: 5000)                                               |
| `DATABASE_URL` |    ✅    | Full PostgreSQL connection string                                       |
| `JWT_SECRET`   |    ✅    | Secret for signing JWTs                                                 |
| `CLIENT_URL`   |    ✅    | Frontend origin (CORS whitelist)                                        |
| `GMAIL_USER`   |    No    | Gmail address for invite emails                                         |
| `GMAIL_PASS`   |    No    | Gmail [App Password](https://support.google.com/accounts/answer/185833) |

---

## API Overview

| Method | Endpoint                              | Auth | Min Role |
| ------ | ------------------------------------- | :--: | -------- |
| POST   | `/api/auth/signup`                    |  No  | —        |
| POST   | `/api/auth/login`                     |  No  | —        |
| GET    | `/api/workspaces/mine`                | JWT  | —        |
| POST   | `/api/workspaces`                     | JWT  | —        |
| PATCH  | `/api/workspaces/:id`                 | JWT  | ADMIN    |
| GET    | `/api/workspaces/:id/stats`           | JWT  | MEMBER   |
| GET    | `/api/workspaces/:id/members`         | JWT  | MEMBER   |
| POST   | `/api/workspaces/:id/invite`          | JWT  | MANAGER  |
| POST   | `/api/invitations/:token/accept`      | JWT  | —        |
| PATCH  | `/api/workspaces/:id/members/:userId` | JWT  | ADMIN    |
| DELETE | `/api/workspaces/:id/members/:userId` | JWT  | ADMIN    |
| GET    | `/api/workspaces/:id/projects`        | JWT  | MEMBER   |
| POST   | `/api/workspaces/:id/projects`        | JWT  | MANAGER  |
| PATCH  | `/api/projects/:id`                   | JWT  | MANAGER  |
| DELETE | `/api/projects/:id`                   | JWT  | MANAGER  |
| GET    | `/api/projects/:id/tasks`             | JWT  | MEMBER   |
| POST   | `/api/projects/:id/tasks`             | JWT  | MANAGER  |
| PATCH  | `/api/tasks/:id`                      | JWT  | MEMBER\* |
| DELETE | `/api/tasks/:id`                      | JWT  | MANAGER  |
| GET    | `/api/tasks/:id/comments`             | JWT  | MEMBER   |
| POST   | `/api/tasks/:id/comments`             | JWT  | MEMBER\* |
| DELETE | `/api/comments/:id`                   | JWT  | MEMBER\* |

- Members can only update or comment on tasks assigned to them. \* Own comments only; MANAGER+ can delete any.

---

## Features

- 🔐 **Auth** — JWT signup / login, email-based workspace invitations
- 🏢 **Multi-workspace** — create and switch between workspaces
- 👥 **RBAC** — ADMIN / MANAGER / MEMBER with enforced permissions on every endpoint; members can only edit/comment tasks assigned to them
- 📋 **Kanban board** — 4 columns: Todo → In Progress → In Review → Done
- 🖱️ **Drag & Drop** — HTML5 Drag API, no external libraries
- 💬 **Comments** — live comment threads with Ctrl+Enter to post
- 📊 **Dashboard** — stat cards, My Tasks, Recent Activity feed
- 📧 **Invitations** — styled HTML email invites via Nodemailer + Gmail
- 🏥 **Health check** — `GET /health` for uptime monitoring

---

## RBAC Matrix

| Action                   | ADMIN | MANAGER | MEMBER |
| ------------------------ | :---: | :-----: | :----: |
| Workspace settings       |  ✅   |   ❌    |   ❌   |
| Invite / remove members  |  ✅   |   ✅    |   ❌   |
| Create / delete projects |  ✅   |   ✅    |   ❌   |
| Create / assign tasks    |  ✅   |   ✅    |   ❌   |
| Delete any task          |  ✅   |   ✅    |   ❌   |
| Comment on tasks         |  ✅   |   ✅    |  ✅\*  |
| Delete own comments      |  ✅   |   ✅    |   ✅   |

- Members can only edit or comment on tasks assigned to them.
