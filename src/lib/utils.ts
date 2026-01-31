/**
 * ============================================================================
 * 工具函式 (Utility Functions)
 * ============================================================================
 * 
 * @description 共用的工具函式，用於整個應用程式中
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Expense, Member, Debt } from "./types"

/**
 * 合併 CSS 類別名稱
 * 
 * @description 結合 clsx 和 tailwind-merge 的功能，智慧合併 Tailwind CSS 類別。
 *              處理衝突的 Tailwind 類別（例如：同時有 `p-2` 和 `p-4` 時，保留後者）。
 * 
 * @param {...ClassValue[]} inputs - 任意數量的類別名稱、物件或陣列
 * @returns {string} 合併後的類別名稱字串
 * 
 * @usage 用於動態組合元件的 className
 * 
 * @example
 * cn('px-2', 'py-1')                    // "px-2 py-1"
 * cn('p-2', condition && 'p-4')         // "p-4" (如果 condition 為 true)
 * cn('bg-red-500', 'bg-blue-500')       // "bg-blue-500" (後者覆蓋前者)
 * cn({ 'text-white': true, 'text-black': false }) // "text-white"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化貨幣金額
 * 
 * @description 將數字格式化為台幣貨幣格式
 * 
 * @param {number} amount - 要格式化的金額
 * @returns {string} 格式化後的貨幣字串（例如：「$1,234」）
 * 
 * @usage 用於顯示費用金額、餘額、債務等
 * 
 * @example
 * formatCurrency(1234)     // "$1,234"
 * formatCurrency(1234.56)  // "$1,235" (無小數位)
 * formatCurrency(0)        // "$0"
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 計算費用分攤
 * 
 * @description 根據費用的分攤方式（均分、金額、百分比、股份）計算每位成員的分攤金額
 * 
 * @param {Expense} expense - 費用物件
 * @returns {{ memberId: string; share: number }[]} 分攤結果陣列
 */
export function calculateSplitShares(expense: Expense) {
  let splitShares: { memberId: string; share: number }[] = [];
  const selectedSplitDetails = expense.splitDetails.filter(d => d.selected);

  if (selectedSplitDetails.length === 0) return [];

  switch (expense.splitMethod) {
    case 'equally':
      const amountPerPerson = expense.totalAmount / selectedSplitDetails.length;
      splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: amountPerPerson }));
      break;
    case 'amount':
      splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: s.value }));
      break;
    case 'percentage':
      splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: expense.totalAmount * (s.value / 100) }));
      break;
    case 'shares':
      const totalShares = selectedSplitDetails.reduce((sum, s) => sum + s.value, 0);
      if (totalShares > 0) {
        splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: expense.totalAmount * (s.value / totalShares) }));
      }
      break;
  }
  return splitShares;
}

/**
 * 計算成員餘額
 * 
 * @description 根據所有費用紀錄，計算每位成員的當前結餘（正數=別人欠我，負數=我欠別人）
 * 
 * @param {Expense[]} expenses - 費用列表
 * @returns {Map<string, number>} 成員餘額對應表 (MemberID -> Balance)
 */
export function calculateBalances(expenses: Expense[]) {
  const userBalances = new Map<string, number>();

  expenses.forEach(expense => {
    // 1. 付款者餘額增加（他墊了錢，所以別人欠他 -> 正數）
    expense.paidBy.forEach(payer => {
      userBalances.set(payer.memberId, (userBalances.get(payer.memberId) || 0) + payer.amount);
    });

    // 2. 分攤者餘額減少（他消費了，所以欠別人 -> 負數）
    const splitShares = calculateSplitShares(expense);
    splitShares.forEach(split => {
      userBalances.set(split.memberId, (userBalances.get(split.memberId) || 0) - split.share);
    });
  });

  return userBalances;
}

/**
 * 計算最簡交易（結算建議）
 * 
 * @description 使用貪婪演算法將複雜的債務關係簡化為最少筆數的轉帳建議
 * 
 * @param {Map<string, number>} balances - 成員餘額表
 * @param {Member[]} members - 成員列表（用於取得名稱）
 * @returns {Debt[]} 建議的還款列表
 */
export function calculateSettlements(balances: Map<string, number>, members: Member[]): Debt[] {
  // 複製餘額 Map 避免修改原資料
  const balancesCopy = new Map(balances);

  // 分離債務人（欠錢的人，餘額 < 0）和債權人（被欠錢的人，餘額 > 0）
  const debtors = Array.from(balancesCopy.entries())
    .filter(([, balance]) => balance < -0.01) // 忽略極小誤差
    .map(([id, balance]) => ({ id, balance: -balance })); // 轉為正數方便計算

  const creditors = Array.from(balancesCopy.entries())
    .filter(([, balance]) => balance > 0.01)
    .map(([id, balance]) => ({ id, balance }));

  const settledDebts: Debt[] = [];

  // 按金額排序（貪婪演算法：先處理小額? 不，通常先處理大額或小額? 這裡沿用原邏輯：從小到大排序?）
  // 原邏輯：debtors.sort((a, b) => a.balance - b.balance);
  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => a.balance - b.balance);

  // 配對債務人和債權人
  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    // 轉帳金額 = 兩者中金額較小者
    const amount = Math.min(debtor.balance, creditor.balance);

    // 忽略極小金額
    if (amount > 0.01) {
      settledDebts.push({
        from: members.find(m => m.id === debtor.id)?.name || '未知',
        to: members.find(m => m.id === creditor.id)?.name || '未知',
        amount,
      });
    }

    // 更新餘額
    debtor.balance -= amount;
    creditor.balance -= amount;

    // 若已結清則移除
    if (debtor.balance < 0.01) debtors.shift();
    if (creditor.balance < 0.01) creditors.shift();
  }

  return settledDebts;
}
