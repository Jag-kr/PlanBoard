const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Workspace = sequelize.define('Workspace', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  owner_id: { type: DataTypes.UUID, allowNull: false }
}, { tableName: 'workspaces', underscored: true });

module.exports = Workspace;
