# 付錢啦 (SplitEase) - 智慧分帳應用

**付錢啦 (SplitEase)** 是一款現代化的網頁應用程式，旨在簡化團體活動中的費用分攤過程。無論是與朋友旅行、與室友合租，或是一起聚餐，這個工具都能讓分帳變得輕鬆、透明且無爭議。

應用程式基於 **Next.js** 和 **Firebase** 構建，提供即時的資料同步與流暢的使用者體驗。

---

## ✨ 功能亮點 (Key Features)

*   **⚡️ 一鍵建立群組**：無需註冊，快速開始。每個群組擁有唯一連結，保護隱私。
*   **👥 彈性成員管理**：輕鬆新增、移除成員，並可 **鎖定成員列表** 以確保後續記帳準確性。
*   **🆔 設定個人身份**：可指定哪位成員是「我」，系統會記住您的身份，方便快速新增費用。
*   **💸 多元分帳方式**：支援 **均分 (Equally)**、**指定金額 (Amount)**、**百分比 (Percentage)**、**份額 (Shares)** 等多種常見分帳情境。
*   **🤲 多付款人支援**：一筆費用可由多位成員共同支付 (Multi-payer)。
*   **📊 視覺化消費分析**：自動生成 **消費統計圖表 (Spending Chart)**，直觀顯示每位成員的實際支出與大戶排行。
*   **🤖 即時智慧結算**：自動計算 **最簡化的還款方案**（例如：A 欠 B，B 欠 C → 系統建議 A 直接轉給 C），大幅減少轉帳次數。
*   **🗑️ 危險區域管理**：支援 **刪除群組** 功能，當活動結束且不再需要資料時，可徹底清除。
*   **🔄 一鍵結清**：可將當前帳務封存至 **歷史紀錄**，並開始新的記帳週期（餘額歸零）。
*   **📜 歷史紀錄追蹤**：輕鬆查閱所有的費用明細與過去的結算歷史。
*   **📱 手機版優化**：精心調校的 RWD 響應式介面，標題與工具列自動適應，操作順手。
*   **🛠️ 實用小工具**：內建 **世界時鐘 (World Clock)** 與 **匯率換算 (Currency Converter)**，出國旅遊更方便。

---

## 🛠️ 技術棧 (Tech Stack)

本專案採用了一系列現代化的網頁技術，以實現高效能與良好的開發體驗。

*   **前端框架**: [Next.js 15](https://nextjs.org/) (App Router)
*   **UI 元件**: React 19 搭配 [ShadCN/UI](https://ui.shadcn.com/)
*   **樣式**: Tailwind CSS
*   **圖表**: Recharts
*   **後端 & 資料庫**: Firebase (Firestore)
*   **表單管理**: React Hook Form
*   **資料驗證**: Zod
*   **測試框架**: Vitest (包含單元測試與數學模擬驗證)
*   **語言**: TypeScript

---

## 📂 專案架構 (Project Structure)

本專案遵循 Next.js App Router 的標準結構，並將關注點分離 (Separation of Concerns)，旨在提高程式碼的可讀性、可維護性與可擴展性。

```bash
/
├── src/
│   ├── app/                # Next.js 路由與核心頁面
│   │   ├── layout.tsx      # 全域佈局 (Font, Toaster, Context Provider)
│   │   ├── page.tsx        # 首頁 (Landing Page & Create Group)
│   │   ├── globals.css     # 全域樣式 & Tailwind 變數
│   │   └── group/
│   │       └── [groupId]/
│   │           └── page.tsx # 動態群組頁面 (Server Component)
│   ├── components/         # React 元件
│   │   ├── ui/             # (ShadCN) 通用基礎 UI 元件 (Button, Card, Input...)
│   │   └── splitease/      # 專為此應用設計的業務邏輯元件
│   │       ├── group-page.tsx           # 群組頁面核心 (State Management)
│   │       ├── app-header.tsx           # 應用程式標頭 (Title, WorldClock, Tools)
│   │       ├── group-sidebar.tsx        # 側邊導航欄 (Desktop Sidebar)
│   │       ├── add-expense-card.tsx     # 新增費用卡片 (Form Logic)
│   │       ├── members-card.tsx         # 成員管理卡片
│   │       ├── summary-card.tsx         # 費用統計卡片 (含 BarChart)
│   │       ├── calculation-details-card.tsx # 計算明細與結算建議 (Debts)
│   │       ├── expenses-list-card.tsx   # 費用清單
│   │       ├── settlement-history-card.tsx # 結算歷史
│   │       ├── share-dialog.tsx         # 分享對話框 (QR Code)
│   │       ├── world-clock.tsx          # 世界時鐘元件
│   │       └── currency-converter-popover.tsx # 匯率換算小工具
│   ├── firebase/           # Firebase 設定與自訂 Hooks
│   │   ├── config.ts       # Firebase SDK 初始化配置
│   │   ├── client-provider.tsx # Client-side SDK 初始化與 Loading 處理
│   │   ├── provider.tsx    # React Context Provider
│   │   └── firestore/      # 封裝 Firestore 操作
│   │       ├── useDoc.ts        # 單一文件監聽 Hook
│   │       └── useCollection.ts # 集合監聽 Hook
│   ├── hooks/              # 全域自定義 React Hooks
│   │   ├── useCurrentUser.ts    # 管理「我是誰」 (LocalStorage)
│   │   └── useToast.ts          # Toast 通知 Hook
│   ├── lib/                # 共用工具函式、類型與常數
│   │   ├── types.ts        # TypeScript 核心型別定義 (Group, Expense...)
│   │   ├── utils.ts        # 工具函式 (cn, formatCurrency, calculateSettlements)
│   │   └── timezones.ts    # 時區資料常數
│   └── __tests__/          # 測試文件
│       ├── edge-cases.test.ts # 邊界情況測試
│       └── math-proof.test.ts # 數學模擬驗證
├── firestore.rules         # Firestore 安全性規則
├── .env                    # 環境變數檔案 (gitignore)
├── next.config.ts          # Next.js 專案設定
├── tailwind.config.ts      # Tailwind CSS 樣式設定
└── package.json            # 專案依賴與腳本
```

### 架構詳解 (Architecture Details)

#### `src/app/`
*   **layout.tsx**: 負責載入字體、Firebase Client Provider 與全域 Toaster。
*   **page.tsx**: 負責產生新群組 (addDoc) 並導向。
*   **group/[groupId]/page.tsx**: 負責接收 URL 參數，解析 groupId，並渲染 `GroupPage`。

#### `src/components/splitease/`
*   **group-page.tsx**: 這是真正的前端核心。它透過 `useDoc` 訂閱 Firestore 資料，計算餘額 (`useMemo`)，並將資料分發給各個子元件 (Cards)。
*   **utils.ts**: 這裡存放了最關鍵的「 **分帳演算法** (`calculateSplitShares`)」與「 **智慧結算演算法** (`calculateSettlements`)」。我們將邏輯抽離至此，以利於進行嚴格的單元測試。

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

# 設定環境變數 (參考 .env.example)
# 建立 .env 檔案並填入您的 Firebase Config
touch .env
```
`.env` 範例：
```env
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_ID"
# ...其他設定
```

### 3. 執行應用程式
```bash
# 啟動開發伺服器 (預設 http://localhost:9002 或 3000)
npm run dev

# 執行測試
npm test

# 建置生產版本
npm run build
npm run start
```

---

## 📖 如何使用 (Usage Guide)

1.  **建立群組**：進入首頁，點擊「建立新分帳群組」。
2.  **管理成員**：在成員卡片中新增朋友。點擊 **"👤"** 圖示將某人設為「我」（方便操作），完成後點 **"🔒"** 鎖定列表。
3.  **新增費用**：填寫金額、選擇 **付款人**，並設定 **分攤方式**（例如 A 先墊付 $1000，A/B/C 均分）。
4.  **查看分析**：
    *   **費用統計**：透過長條圖查看誰是消費大戶。
    *   **計算明細**：查看系統建議的「最簡還款路徑」（誰該給誰多少）。
5.  **結清帳務**：當旅程結束，點擊「 **結清款項 (Settle Up)** 」。系統會將當前帳務封存入歷史紀錄，所有人餘額歸零，準備開始下一段旅程。
6.  **分享與協作**：點擊右上角的分享按鈕，透過 QR Code 邀請朋友加入。

---
**Maintainer**: Steven
**Version**: 1.1.0 (Mobile Optimized & Math Proofed)
