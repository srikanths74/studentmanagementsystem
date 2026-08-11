// server.js - Main Express Application Server
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// Middleware
// =============================================
app.set('trust proxy', 1);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'sms-secret-key-2024',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// Serve HTML files
app.set('views', path.join(process.cwd(), 'views'));

// =============================================
// Auth Middleware
// =============================================
function isAuthenticated(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/login');
}

// =============================================
// Page Routes
// =============================================

// Helper to serve view files cross-platform
function serveView(res, fileName) {
  const cwdPath = path.join(process.cwd(), 'views', fileName);
  const dirPath = path.join(__dirname, 'views', fileName);
  res.sendFile(cwdPath, (err) => {
    if (err) {
      res.sendFile(dirPath);
    }
  });
}

// Root → redirect to dashboard or login
app.get('/', (req, res) => {
  if (req.session && req.session.admin) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Login Page
app.get('/login', (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/dashboard');
  serveView(res, 'login.html');
});

// Dashboard Page
app.get('/dashboard', isAuthenticated, (req, res) => {
  serveView(res, 'dashboard.html');
});

// View Students Page
app.get('/students', isAuthenticated, (req, res) => {
  serveView(res, 'students.html');
});

// Add Student Page
app.get('/add-student', isAuthenticated, (req, res) => {
  serveView(res, 'add-student.html');
});

// Edit Student Page
app.get('/edit-student', isAuthenticated, (req, res) => {
  serveView(res, 'edit-student.html');
});

// =============================================
// API Routes
// =============================================

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM admin WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length > 0) {
      req.session.admin = {
        id: rows[0].id,
        username: rows[0].username,
        full_name: rows[0].full_name,
        email: rows[0].email
      };
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.json({ success: false, message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error (Database connection failed)' });
  }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.json({ success: true });
  });
});

// GET /api/session - Get current admin info
app.get('/api/session', (req, res) => {
  if (req.session.admin) {
    res.json({ loggedIn: true, admin: req.session.admin });
  } else {
    res.json({ loggedIn: false });
  }
});

// GET /api/students - Get all students
app.get('/api/students', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM students ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch students error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
});

// GET /api/students/:id - Get single student
app.get('/api/students/:id', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM students WHERE id = ?',
      [req.params.id]
    );
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] });
    } else {
      res.json({ success: false, message: 'Student not found' });
    }
  } catch (err) {
    console.error('Fetch student error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/students - Add new student
app.post('/api/students', isAuthenticated, async (req, res) => {
  const { name, email, phone, course, gender, dob, address } = req.body;
  if (!name || !email) {
    return res.json({ success: false, message: 'Name and Email are required' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO students (name, email, phone, course, gender, dob, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, course || null, gender || 'Male', dob || null, address || null]
    );
    res.json({ success: true, message: 'Student added successfully!', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.json({ success: false, message: 'A student with this email already exists' });
    } else {
      console.error('Add student error:', err);
      res.status(500).json({ success: false, message: 'Failed to add student' });
    }
  }
});

// PUT /api/students/:id - Update student
app.put('/api/students/:id', isAuthenticated, async (req, res) => {
  const { name, email, phone, course, gender, dob, address } = req.body;
  if (!name || !email) {
    return res.json({ success: false, message: 'Name and Email are required' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE students SET name=?, email=?, phone=?, course=?, gender=?, dob=?, address=? WHERE id=?',
      [name, email, phone || null, course || null, gender || 'Male', dob || null, address || null, req.params.id]
    );
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Student updated successfully!' });
    } else {
      res.json({ success: false, message: 'Student not found' });
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.json({ success: false, message: 'A student with this email already exists' });
    } else {
      console.error('Update student error:', err);
      res.status(500).json({ success: false, message: 'Failed to update student' });
    }
  }
});

// DELETE /api/students/:id - Delete student
app.delete('/api/students/:id', isAuthenticated, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM students WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Student deleted successfully!' });
    } else {
      res.json({ success: false, message: 'Student not found' });
    }
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete student' });
  }
});

// GET /api/stats - Dashboard statistics
app.get('/api/stats', isAuthenticated, async (req, res) => {
  try {
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM students');
    const [[{ males }]] = await db.execute("SELECT COUNT(*) as males FROM students WHERE gender='Male'");
    const [[{ females }]] = await db.execute("SELECT COUNT(*) as females FROM students WHERE gender='Female'");
    const [[{ recent }]] = await db.execute(
      "SELECT COUNT(*) as recent FROM students WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    res.json({ success: true, data: { total, males, females, recent } });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// =============================================
// Start Server
// =============================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Student Management System - Running    ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║   URL:  http://localhost:${PORT}            ║`);
  console.log('║   Login: admin / admin123                ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
