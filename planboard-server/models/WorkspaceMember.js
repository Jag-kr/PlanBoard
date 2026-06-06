const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkspaceMember = sequelize.define('WorkspaceMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.ENUM('ADMIN', 'MANAGER', 'MEMBER'), defaultValue: 'MEMBER' }
}, { tableName: 'workspace_members', underscored: true });

module.exports = WorkspaceMember;
