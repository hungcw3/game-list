const express = require('express');
const { createClient } = require('@libsql/client');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Tạo hoặc mở file database
const db = createClient({
  url: 'file:games.db'
});

// Tạo bảng nếu chưa có
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'gamelist_secret_123';

async function init() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'muon-choi'
    )
  `);
}

// API đăng ký
app.post('/api/register', async function(req, res) {
  const { email, password } = req.body;

  // Mã hóa password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.execute({
      sql: 'INSERT INTO users (email, password) VALUES (?, ?)',
      args: [email, hashedPassword]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Email đã tồn tại' });
  }
});

// API đăng nhập
app.post('/api/login', async function(req, res) {
  const { email, password } = req.body;

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email]
  });

  const user = result.rows[0];
  if (!user) {
    return res.status(400).json({ error: 'Email không tồn tại' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Sai password' });
  }

  const token = jwt.sign({ userId: user.id }, SECRET_KEY);
  res.json({ token });
});

// Middleware xác thực token
function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

// API lấy danh sách game
app.get('/api/games', authMiddleware, async function(req, res) {
  const result = await db.execute({
    sql: 'SELECT * FROM games WHERE user_id = ?',
    args: [req.userId]
  });
  res.json(result.rows);
});

// API thêm game mới
app.post('/api/games', authMiddleware, async function(req, res) {
  const { name, status } = req.body;
  const result = await db.execute({
    sql: 'INSERT INTO games (user_id, name, status) VALUES (?, ?, ?)',
    args: [req.userId, name, status || 'muon-choi']
  });
  res.json({ id: Number(result.lastInsertRowid), name, status: status || 'muon-choi' });
});

// API xóa game
app.delete('/api/games/:id', authMiddleware, async function(req, res) {
  await db.execute({
    sql: 'DELETE FROM games WHERE id = ? AND user_id = ?',
    args: [req.params.id, req.userId]
  });
  res.json({ success: true });
});

// API cập nhật trạng thái
app.put('/api/games/:id', authMiddleware, async function(req, res) {
  const { status } = req.body;
  await db.execute({
    sql: 'UPDATE games SET status = ? WHERE id = ? AND user_id = ?',
    args: [status, req.params.id, req.userId]
  });
  res.json({ success: true });
});

init().then(function() {
  app.listen(3000, function() {
    console.log('Server đang chạy tại http://localhost:3000');
  });
});