require("dotenv").config();
const mysql = require("mysql2/promise");

const databasePool = mysql.createPool({
  host: process.env.DB_HOST,
  user: "fake",
  password: "fake",
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
module.exports = databasePool;
