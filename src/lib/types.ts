/**
 * ============================================================================
 * 型別定義 (Type Definitions)
 * ============================================================================
 * 
 * @description 定義應用程式中使用的所有核心資料型別。
 *              這些型別確保了 TypeScript 的型別安全，並作為資料結構的文件。
 */

// ============================================================================
// 基礎型別
// ============================================================================

/**
 * 群組成員
 * 
 * @description 代表群組中的一個成員
 * @property {string} id - 唯一識別碼（使用 crypto.randomUUID() 產生）
 * @property {string} name - 成員顯示名稱
 */
export type Member = {
  id: string;
  name: string;
};

// ============================================================================
// 費用相關型別
// ============================================================================

/**
 * 付款明細
 * 
 * @description 記錄一筆費用中每位付款人的付款金額
 *              支援多人代墊的情況（例如：A 墊 300、B 墊 200）
 * 
 * @property {string} memberId - 付款成員的 ID
 * @property {number} amount - 該成員付的金額
 * 
 * @usage 儲存在 Expense.paidBy 陣列中
 */
export type PayerDetail = {
  memberId: string;
  amount: number;
};

/**
 * 分帳明細
 * 
 * @description 記錄一筆費用中每位成員的分攤詳情
 * 
 * @property {string} memberId - 成員 ID
 * @property {number} value - 分攤值（根據 splitMethod 解讀方式不同）
 *                            - 'equally': 無意義（均分時忽略）
 *                            - 'amount': 實際金額
 *                            - 'percentage': 百分比（0-100）
 *                            - 'shares': 份數
 * @property {boolean} selected - 該成員是否參與此費用分攤
 * 
 * @usage 儲存在 Expense.splitDetails 陣列中
 */
export type SplitDetail = {
  memberId: string;
  value: number;
  selected: boolean;
};

/**
 * 分帳方式
 * 
 * @description 定義費用如何在成員之間分攤
 * 
 * @value 'equally' - 均分：總金額平分給所有參與者
 * @value 'percentage' - 按百分比：每人承擔指定百分比
 * @value 'shares' - 按份數：例如 A 2份、B 1份，則 A 付 2/3、B 付 1/3
 * @value 'amount' - 按金額：直接指定每人的金額
 */
export type SplitMethod = 'equally' | 'percentage' | 'shares' | 'amount';

/**
 * 費用記錄
 * 
 * @description 代表一筆消費記錄，包含完整的付款和分帳資訊
 * 
 * @property {string} id - 唯一識別碼
 * @property {string} description - 費用描述（例如：「晚餐」、「計程車」）
 * @property {number} totalAmount - 費用總金額
 * @property {PayerDetail[]} paidBy - 付款明細（誰付了多少）
 * @property {SplitMethod} splitMethod - 分帳方式
 * @property {SplitDetail[]} splitDetails - 每位成員的分帳明細
 * @property {string} date - 建立時間（ISO 8601 格式）
 */
export type Expense = {
  id: string;
  description: string;
  totalAmount: number;
  paidBy: PayerDetail[];
  splitMethod: SplitMethod;
  splitDetails: SplitDetail[];
  date: string;
};

// ============================================================================
// 結算相關型別
// ============================================================================

/**
 * 債務
 * 
 * @description 代表一筆「誰需要付給誰多少錢」的記錄
 *              這是系統根據餘額計算出的最簡交易結果
 * 
 * @property {string} from - 付款人名稱（欠錢的人）
 * @property {string} to - 收款人名稱（被欠錢的人）
 * @property {number} amount - 金額
 * 
 * @usage 由 GroupPage 的 debts useMemo 計算產生，顯示在 SummaryCard 中
 */
export type Debt = {
  from: string; // member name
  to: string; // member name
  amount: number;
};

/**
 * 結算記錄
 * 
 * @description 代表一次帳目結算的歷史紀錄
 *              當使用者按下「結算」按鈕時，目前所有費用會被歸檔到此結構中
 * 
 * @property {string} id - 唯一識別碼
 * @property {string} date - 結算時間（ISO 8601 格式）
 * @property {Expense[]} expenses - 此次結算包含的所有費用
 * @property {Debt[]} debts - 此次結算計算出的債務清單
 */
export type Settlement = {
  id: string;
  date: string;
  expenses: Expense[];
  debts: Debt[];
};

// ============================================================================
// 群組型別
// ============================================================================

/**
 * 群組
 * 
 * @description 代表一個分帳群組，儲存在 Firestore 的 'groups' 集合中
 *              這是應用程式的核心資料結構
 * 
 * @property {string} id - Firestore 文件 ID
 * @property {string} [name] - 群組名稱（可選，可編輯）
 * @property {Member[]} members - 群組成員列表
 * @property {Expense[]} expenses - 目前未結算的費用列表
 * @property {Settlement[]} settlementHistory - 歷史結算紀錄
 * @property {object} createdAt - Firestore 時間戳記（建立時間）
 */
export type Group = {
  id: string;
  name?: string; // New: Add editable group name
  members: Member[];
  expenses: Expense[];
  settlementHistory: Settlement[];
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

// ============================================================================
// 本地儲存型別
// ============================================================================

/**
 * 群組歷史項目
 * 
 * @description 儲存在 localStorage 中的群組紀錄，用於側邊欄的「最近群組」功能
 *              這是輕量級的群組摘要，不包含完整的費用資料
 * 
 * @property {string} id - 群組 ID（對應 Firestore 文件 ID）
 * @property {string} name - 群組名稱（顯示用）
 * @property {string} lastAccessed - 最後存取時間（ISO 8601 格式，用於排序）
 * 
 * @usage 由 useGroupHistory hook 管理，儲存 key: 'splitease_groupHistory'
 */
export type GroupHistoryItem = {
  id: string;
  name: string;
  lastAccessed: string;
};
