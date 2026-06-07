# PlanBoard Server

REST API backend for the PlanBoard project management platform. Built with Node.js, Express, and PostgreSQL (Sequelize).

---

## Prerequisites

- **Node.js** v18+ (via [nvm](https://github.com/nvm-sh/nvm) recommended)
- **PostgreSQL** v14+

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
DATABASE_URL=postgres://planboard:planboard@localhost:5432/planboard
JWT_SECRET=your_super_secret_jwt_key_change_in_production
CLIENT_URL=http://localhost:3000
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_gmail_app_password
```

> **Note:** `GMAIL_USER` and `GMAIL_PASS` are optional. If not set, invitation emails are skipped (logged as a warning).

### 3. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE USER planboard WITH PASSWORD 'planboard';"
psql -U postgres -c "CREATE DATABASE planboard OWNER planboard;"
```

### 4. Start the server

**Development** (auto-restarts on file changes via nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server will sync the database schema automatically on startup and then listen on the configured port.

```
[DB] Connection established successfully.
[DB] Models synchronised.
[Server] Running on port 5000
```

---

## Project Structure

```
backend/
├── config/
│   ├── db.js              # Sequelize connection
│   └── mailer.js          # Nodemailer transporter
├── controllers/           # Route handler logic
│   ├── authController.js
│   ├── commentController.js
│   ├── dashboardController.js
│   ├── memberController.js
│   ├── projectController.js
│   ├── taskController.js
│   └── workspaceController.js
├── middleware/
│   ├── auth.js            # JWT Bearer token verification
│   ├── errorHandler.js    # Global error handler
│   └── rbac.js            # Role-based access control (ADMIN > MANAGER > MEMBER)
├── models/                # Sequelize models & associations
│   ├── index.js
│   ├── User.js
│   ├── Workspace.js
│   ├── WorkspaceMember.js
│   ├── Invitation.js
│   ├── Project.js
│   ├── Task.js
│   └── Comment.js
├── routes/                # Express routers
│   ├── auth.js
│   ├── workspace.js
│   ├── invitation.js
│   ├── project.js
│   ├── task.js
│   └── comment.js
├── services/
│   └── mailerService.js   # HTML invitation email sender
├── .env.example
├── .gitignore
├── package.json
└── server.js              # App entry point
```

---

## API Overview

| Method | Endpoint                           | Auth | Role            |
| ------ | ---------------------------------- | ---- | --------------- |
| POST   | `/api/auth/signup`                 | —    | —               |
| POST   | `/api/auth/login`                  | —    | —               |
| POST   | `/api/workspaces`                  | ✅   | any             |
| GET    | `/api/workspaces/mine`             | ✅   | any             |
| PATCH  | `/api/workspaces/:id`              | ✅   | ADMIN           |
| GET    | `/api/workspaces/:id/stats`        | ✅   | member          |
| GET    | `/api/workspaces/:id/members`      | ✅   | member          |
| POST   | `/api/workspaces/:id/invite`       | ✅   | MANAGER+        |
| PATCH  | `/api/workspaces/:id/members/:uid` | ✅   | ADMIN           |
| DELETE | `/api/workspaces/:id/members/:uid` | ✅   | ADMIN           |
| POST   | `/api/invitations/:token/accept`   | ✅   | any             |
| GET    | `/api/workspaces/:id/projects`     | ✅   | member          |
| POST   | `/api/workspaces/:id/projects`     | ✅   | MANAGER+        |
| PATCH  | `/api/projects/:id`                | ✅   | MANAGER+        |
| DELETE | `/api/projects/:id`                | ✅   | MANAGER+        |
| GET    | `/api/projects/:id/tasks`          | ✅   | member          |
| POST   | `/api/projects/:id/tasks`          | ✅   | MANAGER+        |
| PATCH  | `/api/tasks/:id`                   | ✅   | member\*        |
| DELETE | `/api/tasks/:id`                   | ✅   | MANAGER+        |
| GET    | `/api/tasks/:id/comments`          | ✅   | member          |
| POST   | `/api/tasks/:id/comments`          | ✅   | member\*        |
| DELETE | `/api/comments/:id`                | ✅   | author/MANAGER+ |

> \* Members can only update or comment on tasks assigned to them. MANAGER/ADMIN can update or comment on any task.

---

## Health Check

```
GET /health
```

Returns `{ status: "ok", timestamp: "..." }` — useful for container health probes.
