// db.js - MySQL Database Connection
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'studentdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    console.error('   Make sure MySQL is running and run schema.sql in MySQL Workbench first.');
  } else {
    console.log('✅ MySQL Connected Successfully!');
    connection.release();
  }
});

module.exports = promisePool;
