# 🧋 飲料團購 App

輕鬆管理團購訂單的 Web 應用程式。

## 功能特色

- 📋 **建立菜單** - 手動新增或 OCR 掃描菜單圖片
- 📱 **QR Code 分享** - 產生點餐連結，方便同事掃描
- 🛒 **線上點餐** - 選擇飲料、冰量、甜度
- 📊 **訂單管理** - 即時查看訂單統計和明細

## 技術架構

### 前端
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- QRCode.react

### 後端
- Express.js
- better-sqlite3 (SQLite)

## 快速開始

### 安裝依賴

```bash
# 前端
npm install

# 後端
cd server && npm install
```

### 啟動開發伺服器

```bash
# 方式一：同時啟動前後端
npm run dev:all

# 方式二：分別啟動
# Terminal 1 - 後端
cd server && npm run dev

# Terminal 2 - 前端
npm run dev
```

### 存取應用程式

- 前端: http://localhost:5173
- 後端 API: http://localhost:3001

## API 端點

| Method | Endpoint | 描述 |
|--------|----------|------|
| GET | /api/menus | 取得所有菜單 |
| GET | /api/menus/:id | 取得單一菜單 |
| POST | /api/menus | 建立菜單 |
| DELETE | /api/menus/:id | 刪除菜單 |
| GET | /api/sessions | 取得所有訂單 session |
| GET | /api/sessions/:id | 取得單一 session |
| POST | /api/sessions | 建立 session |
| POST | /api/sessions/:id/orders | 新增訂單到 session |

## 測試

```bash
# 執行 E2E 測試（需先啟動前後端）
npm run dev:all  # 在另一個 terminal
npx playwright test
```

## 部署

### 外網存取 (ngrok)

```bash
ngrok http 5173
```

## License

MIT
