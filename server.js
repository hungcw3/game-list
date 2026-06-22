const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Tạo hoặc mở file database
const db = new sqlite3.Database('games.db');

// Tạo bảng nếu chưa có
db.run(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'muon-choi'
  )
`);

// API lấy danh sách game
app.get('/api/games', function(req, res) {
  db.all('SELECT * FROM games', function(err, rows) {
    res.json(rows);
  });
});

// API thêm game mới
app.post('/api/games', function(req, res) {
  const { name, status } = req.body;
  db.run(
    'INSERT INTO games (name, status) VALUES (?, ?)',
    [name, status || 'muon-choi'],
    function(err) {
      res.json({ id: this.lastID, name, status: status || 'muon-choi' });
    }
  );
});

// API xóa game
app.delete('/api/games/:id', function(req, res) {
  db.run('DELETE FROM games WHERE id = ?', [req.params.id], function(err) {
    res.json({ success: true });
  });
});

// API cập nhật trạng thái
app.put('/api/games/:id', function(req, res) {
  const { status } = req.body;
  db.run(
    'UPDATE games SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      res.json({ success: true });
    }
  );
});

app.listen(3000, function() {
  console.log('Server đang chạy tại http://localhost:3000');
});