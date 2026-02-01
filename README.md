# 付錢啦 (SplitEase) - 智慧分帳應用

**付錢啦 (SplitEase)** 是一款現代化的網頁應用程式，旨在簡化團體活動中的費用分攤過程。無論是與朋友旅行、與室友合租，或是一起聚餐，這個工具都能讓分帳變得輕鬆、透明且無爭議。

應用程式基於 **Next.js** 和 **Firebase** 構建，並部署於 **Cloudflare Pages**，提供即時的資料同步與流暢的使用者體驗。

---

## ✨ 功能亮點 (Key Features)

### 核心記帳功能
*   **⚡️ 一鍵建立群組**：無需註冊，快速開始。每個群組擁有唯一連結，保護隱私。
*   **👥 彈性成員管理**：輕鬆新增、移除成員，並可 **鎖定成員列表** 以確保後續記帳準確性。
*   **🆔 強制身份確認**：首次進入群組時，系統會自動彈出成員列表要求選擇「我是誰」，並以動畫提示引導操作。
*   **📝 費用追蹤歸屬**：每筆費用會自動記錄是由誰新增的 (`createdBy`)，並在費用歷史中顯示「由 XXX 新增」。
*   **💸 多元分帳方式**：支援 **均分 (Equally)**、**指定金額 (Amount)**、**百分比 (Percentage)**、**份額 (Shares)** 等多種常見分帳情境。
*   **🤲 多付款人支援**：一筆費用可由多位成員共同支付 (Multi-payer)。

### 智慧結算功能
*   **📊 視覺化消費分析**：自動生成 **消費統計圖表 (Spending Chart)**，直觀顯示每位成員的實際支出與大戶排行。
*   **🤖 即時智慧結算**：自動計算 **最簡化的還款方案**（例如：A 欠 B，B 欠 C → 系統建議 A 直接轉給 C），大幅減少轉帳次數。
*   **🔄 一鍵結清**：可將當前帳務封存至 **歷史紀錄**，並開始新的記帳週期（餘額歸零）。
*   **📜 歷史紀錄追蹤**：輕鬆查閱所有的費用明細與過去的結算歷史。

### 使用者體驗
*   **📱 手機版優化**：精心調校的 RWD 響應式介面，標題與工具列自動適應，操作順手。禁用水平滾動確保最佳閱讀體驗。
*   **🔐 危險區域管理**：支援 **刪除群組** 功能，需輸入確認文字 `delete` 才能執行，防止誤操作。
*   **🛠️ 實用小工具**：內建 **世界時鐘 (World Clock)** 與 **匯率換算 (Currency Converter)**，出國旅遊更方便。
*   **📤 分享邀請**：一鍵產生 QR Code，輕鬆邀請朋友加入群組。

---

## 🛠️ 技術棧 (Tech Stack)

本專案採用了一系列現代化的網頁技術，以實現高效能與良好的開發體驗。

| 類別 | 技術 |
|------|------|
| **前端框架** | [Next.js 15](https://nextjs.org/) (App Router, Edge Runtime) |
| **UI 元件** | React 19 + [ShadCN/UI](https://ui.shadcn.com/) |
| **樣式** | Tailwind CSS 3.4 |
| **圖表** | Recharts |
| **後端 & 資料庫** | Firebase (Firestore) |
| **表單管理** | React Hook Form + Zod |
| **測試框架** | Vitest (53+ 測試，含壓力測試) |
| **部署平台** | Cloudflare Pages |
| **語言** | TypeScript 5 |

---

## 📂 專案架構 (Project Structure)

本專案遵循 Next.js App Router 的標準結構，並將關注點分離 (Separation of Concerns)，旨在提高程式碼的可讀性、可維護性與可擴展性。

```
/
├── src/
│   ├── app/                      # Next.js 路由與核心頁面
│   │   ├── layout.tsx            # 全域佈局 (Font, Toaster, Context Provider)
│   │   ├── page.tsx              # 首頁 (Landing Page & Create Group)
│   │   ├── globals.css           # 全域樣式 & Tailwind 變數
│   │   └── group/
│   │       └── [groupId]/
│   │           └── page.tsx      # 動態群組頁面 (Edge Runtime)
│   │
│   ├── components/               # React 元件
│   │   ├── icons.tsx             # 自訂圖示元件
│   │   ├── ui/                   # (ShadCN) 通用基礎 UI 元件
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── epic-submit-button.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   └── splitease/            # 專為此應用設計的業務邏輯元件
│   │       ├── group-page.tsx              # 群組頁面核心 (State Management)
│   │       ├── app-header.tsx              # 應用程式標頭 (Title, Tools)
│   │       ├── group-sidebar.tsx           # 側邊導航欄 (Desktop)
│   │       ├── add-expense-card.tsx        # 新增費用卡片 (Form Logic)
│   │       ├── members-card.tsx            # 成員管理卡片 (含身份選擇)
│   │       ├── summary-card.tsx            # 費用統計卡片 (含 BarChart)
│   │       ├── calculation-details-card.tsx # 計算明細與結算建議
│   │       ├── expenses-list-card.tsx      # 費用清單 (含創建者追蹤)
│   │       ├── settlement-history-card.tsx # 結算歷史
│   │       ├── share-dialog.tsx            # 分享對話框 (QR Code)
│   │       ├── clear-history-dialog.tsx    # 清除歷史對話框
│   │       ├── user-identity-enforcer.tsx  # 強制身份確認元件 ⭐ NEW
│   │       ├── world-clock.tsx             # 世界時鐘元件
│   │       ├── currency-converter-card.tsx # 匯率換算卡片
│   │       └── currency-converter-popover.tsx # 匯率換算彈出視窗
│   │
│   ├── firebase/                 # Firebase 設定與自訂 Hooks
│   │   ├── index.ts              # 匯出入口
│   │   ├── config.ts             # Firebase SDK 初始化配置
│   │   ├── client-provider.tsx   # Client-side SDK 初始化
│   │   ├── provider.tsx          # React Context Provider
│   │   └── firestore/            # 封裝 Firestore 操作
│   │       ├── use-doc.tsx       # 單一文件監聽 Hook
│   │       └── use-collection.tsx # 集合監聯 Hook
│   │
│   ├── hooks/                    # 全域自定義 React Hooks
│   │   ├── use-current-user.ts   # 管理「我是誰」(LocalStorage)
│   │   ├── use-group-history.ts  # 管理群組歷史紀錄 ⭐ NEW
│   │   ├── use-mobile.tsx        # 響應式裝置偵測
│   │   └── use-toast.ts          # Toast 通知 Hook
│   │
│   ├── lib/                      # 共用工具函式、類型與常數
│   │   ├── types.ts              # TypeScript 核心型別 (Group, Expense, createdBy...)
│   │   ├── utils.ts              # 工具函式 (cn, formatCurrency, calculateSettlements)
│   │   ├── timezones.ts          # 時區資料常數
│   │   ├── placeholder-images.ts # 佔位圖片工具
│   │   └── placeholder-images.json # 佔位圖片資料
│   │
│   └── __tests__/                # 測試文件 (53 tests)
│       ├── setup.ts              # 測試環境設定
│       ├── calculations.test.ts  # 計算邏輯測試 (15 tests)
│       ├── utils.test.ts         # 工具函式測試 (12 tests)
│       ├── edge-cases.test.ts    # 邊界情況與壓力測試 (25 tests)
│       └── math-proof.test.ts    # 數學模擬驗證 (1 test)
│
├── .vscode/                      # VS Code 編輯器設定
│   └── settings.json
├── firestore.rules               # Firestore 安全性規則
├── wrangler.toml                 # Cloudflare Pages 部署設定
├── .npmrc                        # NPM 設定 (legacy-peer-deps)
├── .env                          # 環境變數檔案 (gitignore)
├── next.config.ts                # Next.js 專案設定
├── tailwind.config.ts            # Tailwind CSS 樣式設定
├── tsconfig.json                 # TypeScript 設定
├── vitest.config.ts              # Vitest 測試設定
├── components.json               # ShadCN UI 設定
└── package.json                  # 專案依賴與腳本
```

### 架構詳解 (Architecture Details)

#### `src/app/`
*   **layout.tsx**: 負責載入字體、Firebase Client Provider 與全域 Toaster。
*   **page.tsx**: 負責產生新群組 (addDoc) 並導向。
*   **group/[groupId]/page.tsx**: 配置 Edge Runtime 以支援 Cloudflare Pages，解析 groupId 並渲染 `GroupPage`。

#### `src/components/splitease/`
*   **group-page.tsx**: 前端核心。透過 `useDoc` 訂閱 Firestore 資料，計算餘額 (`useMemo`)，並整合 `UserIdentityEnforcer` 強制用戶選擇身份。
*   **user-identity-enforcer.tsx**: 監控 `currentUser` 狀態，若用戶尚未選擇身份則自動開啟成員對話框。
*   **members-card.tsx**: 成員管理介面，即使鎖定成員列表仍可設定「我是誰」，並以動畫提示引導操作。
*   **add-expense-card.tsx**: 新增費用時自動記錄 `createdBy` 欄位，追蹤費用創建者。

#### `src/lib/utils.ts`
*   這裡存放了最關鍵的「 **分帳演算法** (`calculateSplitShares`)」與「 **智慧結算演算法** (`calculateSettlements`)」。我們將邏輯抽離至此，以利於進行嚴格的單元測試。

---

## 🚀 安裝與啟動 (Installation)

### 1. 環境設定 (Firebase)
本專案使用 Firebase 作為後端，您需要先建立專案：
1.  前往 [Firebase Console](https://console.firebase.google.com/)。
2.  建立新專案，啟用 **Firestore Database** (建議以測試模式開始)。
3.  在專案設定中新增 **Web App**，複製 `firebaseConfig`。

### 2. 本地專案設定
```bash
# Clone 儲存庫
git clone https://github.com/steven87090799/splitease-app.git
cd splitease-app

# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
# 編輯 .env 填入您的 Firebase Config
```

`.env` 範例：
```env
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
```

### 3. 執行應用程式
```bash
# 啟動開發伺服器 (http://localhost:9002)
npm run dev

# 執行測試 (53 tests)
npm test

# TypeScript 類型檢查
npm run typecheck

# 建置生產版本
npm run build
npm run start

# 建置 Cloudflare Pages 版本
npm run pages:build
```

---

## ☁️ 部署至 Cloudflare Pages

本專案已配置好 Cloudflare Pages 部署所需的設定：

1. **連接 GitHub**: 在 Cloudflare Dashboard 中連接您的 GitHub 儲存庫
2. **設定建置指令**:
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`
3. **設定環境變數**: 在 Cloudflare 設定中加入所有 `NEXT_PUBLIC_FIREBASE_*` 變數
4. **自動部署**: 每次 push 到 main 分支時自動觸發部署

---

## 📖 如何使用 (Usage Guide)

1.  **建立群組**：進入首頁，點擊「建立新分帳群組」。
2.  **選擇身份**：首次進入時，系統會自動打開成員管理視窗，點擊您名字旁邊跳動的 **「👤」** 圖示選擇「這是我」。
3.  **管理成員**：新增朋友，完成後點 **「🔒」** 鎖定列表（鎖定後仍可更改身份）。
4.  **新增費用**：填寫金額、選擇 **付款人**，並設定 **分攤方式**。費用會自動記錄是誰新增的。
5.  **查看分析**：
    *   **費用統計**：透過長條圖查看誰是消費大戶。
    *   **費用歷史**：查看每筆費用的詳細資訊與創建者。
    *   **計算明細**：查看系統建議的「最簡還款路徑」。
6.  **結清帳務**：當旅程結束，點擊「 **結清款項** 」。系統會將當前帳務封存入歷史紀錄。
7.  **分享與協作**：點擊右上角的分享按鈕，透過 QR Code 邀請朋友加入。

---

## 🧪 測試覆蓋 (Test Coverage)

本專案包含 **53 個測試案例**，確保核心演算法的正確性：

| 測試檔案 | 測試數量 | 說明 |
|---------|---------|------|
| `calculations.test.ts` | 15 | 分帳計算邏輯 |
| `utils.test.ts` | 12 | 工具函式測試 |
| `edge-cases.test.ts` | 25 | 邊界情況與壓力測試 (100 成員 + 500 費用) |
| `math-proof.test.ts` | 1 | 數學模擬驗證 (19 筆交易歸零驗證) |

```bash
npm test  # 執行所有測試
```

---

**Maintainer**: Steven  
**Repository**: [github.com/steven87090799/splitease-app](https://github.com/steven87090799/splitease-app)  
**Version**: 1.2.1 (Per-Group Identity Memory)
