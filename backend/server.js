require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { sequelize } = require('./models');
const { setIo } = require('./sockets/emitter');
const initSockets = require('./sockets');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspace');
const invitationRoutes = require('./routes/invitation');
const projectRoutes = require('./routes/project');
const taskRoutes = require('./routes/task');
const commentRoutes = require('./routes/comment');

// ── App & HTTP server ──────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

setIo(io);
initSockets(io);

// ── Express middleware ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Swagger API docs ───────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'PlanBoard API Docs',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Serve raw OpenAPI spec as JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', commentRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ── Database sync & server start ───────────────────────────────────────────
const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connection established successfully.');

    await sequelize.sync({ alter: true });
    console.log('[DB] Models synchronised.');

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(`[Docs]   http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    console.error('[DB] Failed to connect or sync:', err.message);
    process.exit(1);
  }
};

start();
