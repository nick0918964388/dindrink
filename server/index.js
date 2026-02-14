const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new Database(path.join(__dirname, 'drink-order.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS menus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    items TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    menuId TEXT NOT NULL,
    menuName TEXT NOT NULL,
    orders TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (menuId) REFERENCES menus(id)
  );
`);

app.use(cors());
app.use(express.json());

// === Menu APIs ===

// Get all menus
app.get('/api/menus', (req, res) => {
  const menus = db.prepare('SELECT * FROM menus ORDER BY createdAt DESC').all();
  res.json(menus.map(m => ({ ...m, items: JSON.parse(m.items) })));
});

// Get single menu
app.get('/api/menus/:id', (req, res) => {
  const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(req.params.id);
  if (!menu) {
    return res.status(404).json({ error: 'Menu not found' });
  }
  res.json({ ...menu, items: JSON.parse(menu.items) });
});

// Create menu
app.post('/api/menus', (req, res) => {
  const { id, name, items, createdAt } = req.body;
  try {
    db.prepare('INSERT INTO menus (id, name, items, createdAt) VALUES (?, ?, ?, ?)')
      .run(id, name, JSON.stringify(items), createdAt);
    res.json({ id, name, items, createdAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete menu (and related sessions)
app.delete('/api/menus/:id', (req, res) => {
  try {
    // 先刪除相關的 sessions
    db.prepare('DELETE FROM sessions WHERE menuId = ?').run(req.params.id);
    // 再刪除 menu
    db.prepare('DELETE FROM menus WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Session APIs ===

// Get all sessions
app.get('/api/sessions', (req, res) => {
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY createdAt DESC').all();
  res.json(sessions.map(s => ({ ...s, orders: JSON.parse(s.orders) })));
});

// Get single session
app.get('/api/sessions/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ ...session, orders: JSON.parse(session.orders) });
});

// Create session
app.post('/api/sessions', (req, res) => {
  const { id, menuId, menuName, orders = [], createdAt } = req.body;
  try {
    db.prepare('INSERT INTO sessions (id, menuId, menuName, orders, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(id, menuId, menuName, JSON.stringify(orders), createdAt);
    res.json({ id, menuId, menuName, orders, createdAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add order to session
app.post('/api/sessions/:id/orders', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const orders = JSON.parse(session.orders);
  orders.push(req.body);

  db.prepare('UPDATE sessions SET orders = ? WHERE id = ?')
    .run(JSON.stringify(orders), req.params.id);

  res.json({ ...session, orders });
});

// Update session (for full replacement)
app.put('/api/sessions/:id', (req, res) => {
  const { menuId, menuName, orders, createdAt } = req.body;
  db.prepare('UPDATE sessions SET menuId = ?, menuName = ?, orders = ?, createdAt = ? WHERE id = ?')
    .run(menuId, menuName, JSON.stringify(orders), createdAt, req.params.id);
  res.json({ id: req.params.id, menuId, menuName, orders, createdAt });
});

// Delete session
app.delete('/api/sessions/:id', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
