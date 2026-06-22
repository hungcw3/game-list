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
async function init() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'muon-choi'
    )
  `);
}

// API lấy danh sách game
app.get('/api/games', async function(req, res) {
  const result = await db.execute('SELECT * FROM games');
  res.json(result.rows);
});

// API thêm game mới
app.post('/api/games', async function(req, res) {
  const { name, status } = req.body;
  const result = await db.execute({
    sql: 'INSERT INTO games (name, status) VALUES (?, ?)',
    args: [name, status || 'muon-choi']
  });
  res.json({ id: Number(result.lastInsertRowid), name, status: status || 'muon-choi' });
});

// API xóa game
app.delete('/api/games/:id', async function(req, res) {
  await db.execute({
    sql: 'DELETE FROM games WHERE id = ?',
    args: [req.params.id]
  });
  res.json({ success: true });
});

// API cập nhật trạng thái
app.put('/api/games/:id', async function(req, res) {
  const { status } = req.body;
  await db.execute({
    sql: 'UPDATE games SET status = ? WHERE id = ?',
    args: [status, req.params.id]
  });
  res.json({ success: true });
});

init().then(function() {
  app.listen(3000, function() {
    console.log('Server đang chạy tại http://localhost:3000');
  });
});