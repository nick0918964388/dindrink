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

---

## 🐳 Docker 部署（推薦）

### 快速啟動

```bash
# 1. 複製環境變數設定檔
cp .env.example .env

# 2. 編輯 .env 設定（可選：設定 GEMINI_API_KEY 啟用 OCR）
vim .env

# 3. 啟動服務
docker compose up -d

# 4. 查看日誌
docker compose logs -f
```

### 存取應用程式

- **網站**: http://localhost:8080
- **API**: http://localhost:8080/api

### 環境變數說明

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `FRONTEND_PORT` | 前端服務 Port | `8080` |
| `GEMINI_API_KEY` | Gemini API Key（OCR 菜單辨識） | - |

### 資料持久化

SQLite 資料庫使用 Docker Volume 儲存，資料不會因容器重啟而遺失。

```bash
# 查看 volume
docker volume ls | grep drink-order

# 備份資料庫
docker compose exec backend cat /data/drink-order.db > backup.db

# 還原資料庫
docker compose cp backup.db backend:/data/drink-order.db
docker compose restart backend
```

### 常用指令

```bash
# 重新建置並啟動
docker compose up -d --build

# 停止服務
docker compose down

# 停止並刪除資料（謹慎使用）
docker compose down -v

# 查看服務狀態
docker compose ps

# 進入後端容器
docker compose exec backend sh
```

---

## 💻 本地開發

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

---

## API 端點

| Method | Endpoint | 描述 |
|--------|----------|------|
| GET | /api/restaurants | 取得所有餐廳（含菜單） |
| GET | /api/restaurants/:id | 取得單一餐廳 |
| POST | /api/restaurants | 建立餐廳 |
| DELETE | /api/restaurants/:id | 刪除餐廳 |
| GET | /api/group-orders | 取得所有團購訂單 |
| GET | /api/group-orders/:id | 取得單一團購訂單 |
| POST | /api/group-orders | 建立團購訂單 |
| PATCH | /api/group-orders/:id/status | 更新訂單狀態（lock/unlock） |
| DELETE | /api/group-orders/:id | 刪除團購訂單 |
| POST | /api/group-orders/:id/order-items | 新增點餐 |
| DELETE | /api/order-items/:id | 刪除點餐 |
| POST | /api/ocr | OCR 辨識菜單圖片 |

---

## 測試

```bash
# 執行 E2E 測試（需先啟動前後端）
npm run dev:all  # 在另一個 terminal
npx playwright test
```

---

## 外網存取

### 方式一：ngrok（開發測試用）

```bash
ngrok http 5173  # 本地開發
# 或
ngrok http 8080  # Docker 部署
```

### 方式二：反向代理（正式部署）

將 Docker 服務放在 Nginx/Caddy 等反向代理後面，設定 SSL 憑證。

---

## License

MIT
