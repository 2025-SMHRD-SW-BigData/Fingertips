const mysql = require('mysql2/promise');

// MySQL 연결 풀 (promise 기반)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) ,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10)
});

module.exports = pool;
