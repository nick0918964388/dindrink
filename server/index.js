const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
// Use DB_PATH env var for Docker, fallback to local file for development
const dbPath = process.env.DB_PATH || path.join(__dirname, 'drink-order.db');
const db = new Database(dbPath);

// Create tables with new schema
db.exec(`
  -- 餐廳表
  CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  -- 菜單表（與餐廳綁定）
  CREATE TABLE IF NOT EXISTS menus (
    id TEXT PRIMARY KEY,
    restaurantId TEXT NOT NULL,
    items TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (restaurantId) REFERENCES restaurants(id)
  );

  -- 團購訂單表
  CREATE TABLE IF NOT EXISTS group_orders (
    id TEXT PRIMARY KEY,
    restaurantId TEXT NOT NULL,
    restaurantName TEXT NOT NULL,
    menuId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    createdAt TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    FOREIGN KEY (restaurantId) REFERENCES restaurants(id),
    FOREIGN KEY (menuId) REFERENCES menus(id)
  );

  -- 個人點餐表
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    groupOrderId TEXT NOT NULL,
    userName TEXT NOT NULL,
    items TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (groupOrderId) REFERENCES group_orders(id)
  );

  -- 向後相容：保留舊表
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    menuId TEXT NOT NULL,
    menuName TEXT NOT NULL,
    orders TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL
  );
`);

// 遷移舊菜單資料到新架構
try {
  const oldMenus = db.prepare('SELECT * FROM menus WHERE restaurantId IS NULL').all();
  for (const menu of oldMenus) {
    // 創建對應的餐廳
    const restaurantExists = db.prepare('SELECT id FROM restaurants WHERE id = ?').get(menu.id);
    if (!restaurantExists) {
      db.prepare('INSERT INTO restaurants (id, name, createdAt) VALUES (?, ?, ?)')
        .run(menu.id, menu.name || '未命名餐廳', menu.createdAt);
      // 更新菜單的 restaurantId
      db.prepare('UPDATE menus SET restaurantId = ? WHERE id = ?')
        .run(menu.id, menu.id);
    }
  }
} catch (e) {
  // 忽略遷移錯誤（可能欄位不存在）
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === Restaurant APIs ===

// Get all restaurants with their menus
app.get('/api/restaurants', (req, res) => {
  const restaurants = db.prepare('SELECT * FROM restaurants ORDER BY createdAt DESC').all();
  const result = restaurants.map(r => {
    const menu = db.prepare('SELECT * FROM menus WHERE restaurantId = ? LIMIT 1').get(r.id);
    return {
      ...r,
      menu: menu ? { ...menu, items: JSON.parse(menu.items) } : null
    };
  });
  res.json(result);
});

// Get single restaurant with menu
app.get('/api/restaurants/:id', (req, res) => {
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  const menu = db.prepare('SELECT * FROM menus WHERE restaurantId = ? LIMIT 1').get(req.params.id);
  res.json({
    ...restaurant,
    menu: menu ? { ...menu, items: JSON.parse(menu.items) } : null
  });
});

// Create restaurant with menu
app.post('/api/restaurants', (req, res) => {
  const { id, name, createdAt, menu } = req.body;
  try {
    db.prepare('INSERT INTO restaurants (id, name, createdAt) VALUES (?, ?, ?)')
      .run(id, name, createdAt);
    
    if (menu) {
      db.prepare('INSERT INTO menus (id, restaurantId, items, createdAt) VALUES (?, ?, ?, ?)')
        .run(menu.id, id, JSON.stringify(menu.items), menu.createdAt);
    }
    
    res.json({ id, name, createdAt, menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete restaurant and its menu
app.delete('/api/restaurants/:id', (req, res) => {
  try {
    // 先刪除相關的 order_items
    const groupOrders = db.prepare('SELECT id FROM group_orders WHERE restaurantId = ?').all(req.params.id);
    for (const go of groupOrders) {
      db.prepare('DELETE FROM order_items WHERE groupOrderId = ?').run(go.id);
    }
    // 刪除 group_orders
    db.prepare('DELETE FROM group_orders WHERE restaurantId = ?').run(req.params.id);
    // 刪除 menus
    db.prepare('DELETE FROM menus WHERE restaurantId = ?').run(req.params.id);
    // 刪除 restaurant
    db.prepare('DELETE FROM restaurants WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Group Order APIs ===

// Get all group orders
app.get('/api/group-orders', (req, res) => {
  const groupOrders = db.prepare('SELECT * FROM group_orders ORDER BY createdAt DESC').all();
  const result = groupOrders.map(go => {
    const orderItems = db.prepare('SELECT * FROM order_items WHERE groupOrderId = ?').all(go.id);
    return {
      ...go,
      orderItems: orderItems.map(oi => ({ ...oi, items: JSON.parse(oi.items) }))
    };
  });
  res.json(result);
});

// Get single group order
app.get('/api/group-orders/:id', (req, res) => {
  const groupOrder = db.prepare('SELECT * FROM group_orders WHERE id = ?').get(req.params.id);
  if (!groupOrder) {
    return res.status(404).json({ error: 'Group order not found' });
  }
  const orderItems = db.prepare('SELECT * FROM order_items WHERE groupOrderId = ?').all(groupOrder.id);
  const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(groupOrder.menuId);
  res.json({
    ...groupOrder,
    orderItems: orderItems.map(oi => ({ ...oi, items: JSON.parse(oi.items) })),
    menu: menu ? { ...menu, items: JSON.parse(menu.items) } : null
  });
});

// Create group order
app.post('/api/group-orders', (req, res) => {
  const { id, restaurantId, restaurantName, menuId, status, createdAt, createdBy } = req.body;
  try {
    db.prepare(`
      INSERT INTO group_orders (id, restaurantId, restaurantName, menuId, status, createdAt, createdBy) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, restaurantId, restaurantName, menuId, status || 'open', createdAt, createdBy);
    res.json({ id, restaurantId, restaurantName, menuId, status: status || 'open', createdAt, createdBy, orderItems: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update group order status (lock/unlock)
app.patch('/api/group-orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['open', 'locked'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE group_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const groupOrder = db.prepare('SELECT * FROM group_orders WHERE id = ?').get(req.params.id);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE groupOrderId = ?').all(req.params.id);
  res.json({
    ...groupOrder,
    orderItems: orderItems.map(oi => ({ ...oi, items: JSON.parse(oi.items) }))
  });
});

// Delete group order
app.delete('/api/group-orders/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM order_items WHERE groupOrderId = ?').run(req.params.id);
    db.prepare('DELETE FROM group_orders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Order Item APIs ===

// Add order item to group order
app.post('/api/group-orders/:id/order-items', (req, res) => {
  const groupOrder = db.prepare('SELECT * FROM group_orders WHERE id = ?').get(req.params.id);
  if (!groupOrder) {
    return res.status(404).json({ error: 'Group order not found' });
  }
  if (groupOrder.status === 'locked') {
    return res.status(400).json({ error: '訂單已鎖定，無法新增點餐' });
  }

  const { id, userName, items, createdAt } = req.body;
  try {
    db.prepare('INSERT INTO order_items (id, groupOrderId, userName, items, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.params.id, userName, JSON.stringify(items), createdAt);
    
    const orderItems = db.prepare('SELECT * FROM order_items WHERE groupOrderId = ?').all(req.params.id);
    res.json({
      ...groupOrder,
      orderItems: orderItems.map(oi => ({ ...oi, items: JSON.parse(oi.items) }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order item
app.delete('/api/order-items/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM order_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Menu APIs (向後相容) ===

// Get all menus
app.get('/api/menus', (req, res) => {
  const menus = db.prepare(`
    SELECT m.*, r.name as restaurantName 
    FROM menus m 
    LEFT JOIN restaurants r ON m.restaurantId = r.id 
    ORDER BY m.createdAt DESC
  `).all();
  res.json(menus.map(m => ({ 
    ...m, 
    items: JSON.parse(m.items),
    name: m.restaurantName || '未命名餐廳'
  })));
});

// Get single menu
app.get('/api/menus/:id', (req, res) => {
  const menu = db.prepare(`
    SELECT m.*, r.name as restaurantName 
    FROM menus m 
    LEFT JOIN restaurants r ON m.restaurantId = r.id 
    WHERE m.id = ?
  `).get(req.params.id);
  if (!menu) {
    return res.status(404).json({ error: 'Menu not found' });
  }
  res.json({ 
    ...menu, 
    items: JSON.parse(menu.items),
    name: menu.restaurantName || '未命名餐廳'
  });
});

// Create menu (新版會透過 restaurant API 建立)
app.post('/api/menus', (req, res) => {
  const { id, name, items, createdAt } = req.body;
  try {
    // 同時建立餐廳和菜單
    const restaurantId = id;
    db.prepare('INSERT OR IGNORE INTO restaurants (id, name, createdAt) VALUES (?, ?, ?)')
      .run(restaurantId, name, createdAt);
    db.prepare('INSERT INTO menus (id, restaurantId, items, createdAt) VALUES (?, ?, ?, ?)')
      .run(id, restaurantId, JSON.stringify(items), createdAt);
    res.json({ id, name, items, createdAt, restaurantId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete menu (會連同餐廳一起刪除)
app.delete('/api/menus/:id', (req, res) => {
  try {
    const menu = db.prepare('SELECT restaurantId FROM menus WHERE id = ?').get(req.params.id);
    if (menu) {
      // 先刪除相關的 sessions
      db.prepare('DELETE FROM sessions WHERE menuId = ?').run(req.params.id);
      // 刪除 menu
      db.prepare('DELETE FROM menus WHERE id = ?').run(req.params.id);
      // 檢查是否還有其他菜單使用這個餐廳
      const otherMenus = db.prepare('SELECT id FROM menus WHERE restaurantId = ?').get(menu.restaurantId);
      if (!otherMenus) {
        db.prepare('DELETE FROM restaurants WHERE id = ?').run(menu.restaurantId);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Session APIs (向後相容) ===

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

// Update session
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

// === Gemini Vision API ===
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDfyQ1YJrDvr3iDI5HZLVJuBjYz50Cz1I0';
const GEMINI_MODEL = 'gemini-2.5-flash';

app.post('/api/ocr', async (req, res) => {
  try {
    const { image } = req.body;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `你是專業的台灣飲料店菜單 OCR 辨識系統。

【任務】從這張菜單圖片中提取所有飲料品項。

【輸出格式】嚴格的 JSON 陣列：
[{"name":"完整飲料名稱","price":中杯價格數字,"category":"分類名稱"}]

【辨識規則】
1. 逐區塊掃描：菜單可能分多欄、多區塊，請完整掃描每個區域
2. 飲料名稱：使用完整中文名稱（如「鮮萃大麥紅茶」「玫瑰普洱奶茶」「珍珠奶茶」）
3. 價格處理：
   - 如果有 M/L 或 中/大 兩種價格，取 M（中杯）價格
   - 價格必須是整數（如 40, 65），不含 $ 或 元
   - 價格範圍通常在 25-100 之間
4. 分類：根據菜單區塊標題判斷（如「原葉鮮萃茶」「鮮萃奶茶」「果茶」等）
5. 排除非飲料項目：加料、配料、冰度甜度說明等不要列入

【常見台灣飲料店品項參考】
鮮萃大麥紅茶、嗨神、玩火、碧螺春、玫瑰普洱、文山包種、東方美人、白桃蜜烏龍、大麥奶茶、玩火奶茶、烏瓦紅茶拿鐵、金萱拿鐵、觀音拿鐵、四季春、烏龍綠茶、茉莉烏龍、珍珠奶茶、粉條奶茶、檸檬紅茶、檸檬綠茶、蜂蜜檸檬、百香果、芭樂、話梅冰綠

【輸出】只輸出 JSON 陣列，不要任何其他文字：`
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16384
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API 錯誤: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    
    // 從 Gemini 回應中提取文字
    let responseText = '';
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = data.candidates[0].content.parts[0].text;
    }
    
    // 提取 JSON 陣列
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        // 過濾無效項目
        const cleaned = parsed.filter(item => 
          item.name && 
          typeof item.name === 'string' && 
          item.name.length > 1 &&
          item.name.length < 50 &&
          typeof item.price === 'number' && 
          item.price > 0 && 
          item.price < 500
        );
        responseText = JSON.stringify(cleaned);
      } catch (e) {
        console.error('JSON 解析失敗:', e.message);
      }
    }
    
    res.json({ response: responseText });
  } catch (err) {
    console.error('OCR 錯誤:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📸 OCR using Gemini Vision API (${GEMINI_MODEL})`);
});
