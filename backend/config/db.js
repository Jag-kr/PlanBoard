const { Sequelize } = require("sequelize");
require("dotenv").config();

const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  // Neon (and any hosted PG) requires TLS; cert is publicly trusted so it is verified.
  dialectOptions: { ssl: isLocal ? false : true },
});

module.exports = sequelize;
