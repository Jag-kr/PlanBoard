const sequelize = require('../config/db');
const User = require('./User');
const Workspace = require('./Workspace');
const WorkspaceMember = require('./WorkspaceMember');
const Invitation = require('./Invitation');
const Project = require('./Project');
const Task = require('./Task');
const Comment = require('./Comment');

// ── User ↔ WorkspaceMember ─────────────────────────────────────────────────
User.hasMany(WorkspaceMember, { foreignKey: 'user_id', onDelete: 'CASCADE' });
WorkspaceMember.belongsTo(User, { foreignKey: 'user_id' });

// ── Workspace ↔ WorkspaceMember ────────────────────────────────────────────
Workspace.hasMany(WorkspaceMember, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
WorkspaceMember.belongsTo(Workspace, { foreignKey: 'workspace_id' });

// ── Workspace → owner (User) ───────────────────────────────────────────────
Workspace.belongsTo(User, { as: 'owner', foreignKey: 'owner_id' });
User.hasMany(Workspace, { as: 'ownedWorkspaces', foreignKey: 'owner_id' });

// ── Workspace ↔ Project ────────────────────────────────────────────────────
Workspace.hasMany(Project, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
Project.belongsTo(Workspace, { foreignKey: 'workspace_id' });

// ── Project ↔ Task ─────────────────────────────────────────────────────────
Project.hasMany(Task, { foreignKey: 'project_id', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'project_id' });

// ── Task → assignee (User) ─────────────────────────────────────────────────
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignee_id' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assignee_id' });

// ── Task → creator (User) ──────────────────────────────────────────────────
Task.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(Task, { as: 'createdTasks', foreignKey: 'created_by' });

// ── Task ↔ Comment ─────────────────────────────────────────────────────────
Task.hasMany(Comment, { foreignKey: 'task_id', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'task_id' });

// ── Comment → User ─────────────────────────────────────────────────────────
Comment.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Comment, { foreignKey: 'user_id' });

// ── Workspace ↔ Invitation ─────────────────────────────────────────────────
Workspace.hasMany(Invitation, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
Invitation.belongsTo(Workspace, { foreignKey: 'workspace_id' });

module.exports = {
  sequelize,
  User,
  Workspace,
  WorkspaceMember,
  Invitation,
  Project,
  Task,
  Comment
};
