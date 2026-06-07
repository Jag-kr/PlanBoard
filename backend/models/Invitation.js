const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Invitation = sequelize.define(
  "Invitation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workspace_id: { type: DataTypes.UUID, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    role: {
      type: DataTypes.ENUM("ADMIN", "MANAGER", "MEMBER"),
      defaultValue: "MEMBER",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "ACCEPTED", "EXPIRED"),
      defaultValue: "PENDING",
    },
  },
  { tableName: "invitations", underscored: true },
);

module.exports = Invitation;
