// db.js - MySQL Database Connection
require('dotenv').config();
const mysql = require('mysql2');

let pool;

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  pool = mysql.createPool(connectionUrl);
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'studentdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
}

const promisePool = pool.promise();

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    console.error('   Make sure MySQL is running or check your environment variables (DB_HOST, DB_USER, DB_PASSWORD, etc.).');
  } else {
    console.log('✅ MySQL Connected Successfully!');
    connection.release();
  }
});

module.exports = promisePool;
