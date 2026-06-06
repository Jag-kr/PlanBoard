const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  project_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'), defaultValue: 'TODO' },
  priority: { type: DataTypes.ENUM('URGENT', 'HIGH', 'MEDIUM', 'LOW'), defaultValue: 'MEDIUM' },
  assignee_id: { type: DataTypes.UUID },
  due_date: { type: DataTypes.DATEONLY },
  created_by: { type: DataTypes.UUID, allowNull: false }
}, { tableName: 'tasks', underscored: true });

module.exports = Task;
