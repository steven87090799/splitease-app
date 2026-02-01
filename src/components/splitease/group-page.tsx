'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc, DocumentReference } from 'firebase/firestore';
import type { Member, Expense, Debt, Settlement, Group } from '@/lib/types';
import type { ExpenseFormData } from './add-expense-card';
import { AppHeader } from './app-header';
import { MembersCard } from './members-card';
import { AddExpenseCard } from './add-expense-card';
import { ExpensesListCard } from './expenses-list-card';
import { SummaryCard } from './summary-card';
import { SettlementHistoryCard } from './settlement-history-card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import { useGroupHistory } from '@/hooks/use-group-history';
import { CalculationDetailsCard } from './calculation-details-card';
import { UserIdentityEnforcer } from './user-identity-enforcer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { formatCurrency, calculateBalances, calculateSettlements } from '@/lib/utils';

/**
 * ============================================================================
 * GroupPage 元件
 * ============================================================================
 * 
 * @description 群組分帳頁面的主要元件，負責管理整個群組的狀態與操作。
 *              這是應用程式中最核心的頁面，包含成員管理、費用新增、餘額計算、結算等功能。
 * 
 * @param {object} props - 元件屬性
 * @param {string} props.groupId - 群組的 Firestore 文件 ID，從 URL 動態路由取得
 * 
 * @returns {JSX.Element} 群組頁面的完整 UI
 * 
 * @usage 由 `app/group/[groupId]/page.tsx` 呼叫，傳入動態路由參數 groupId
 * 
 * @example
 * <GroupPage groupId="abc123" />
 */
export function GroupPage({ groupId }: { groupId: string }) {
  // ========== Hooks 初始化 ==========
  /** Toast 提示 hook，用於顯示操作成功/失敗的訊息 */
  const { toast } = useToast();

  /** Firestore 實例，由 Firebase Context 提供 */
  const firestore = useFirestore();

  /** Next.js 路由器，用於頁面導航（如刪除群組後導回首頁） */
  const router = useRouter();

  /** 群組歷史紀錄 hook，用於管理側邊欄的「最近群組」列表 */
  const { addGroupToHistory, updateGroupInHistory } = useGroupHistory();

  // ========== Firestore 資料訂閱 ==========
  /**
   * @description 建立 Firestore 文件參考，使用 useMemo 避免重複建立
   * @returns {DocumentReference | null} 群組文件的參考，若 Firestore 未初始化則為 null
   */
  const groupRef = useMemo(() => firestore ? doc(firestore, 'groups', groupId) : null, [firestore, groupId]);

  /**
   * @description 訂閱 Firestore 群組文件，自動同步資料變更
   * @returns {object} 包含 data（群組資料）、error（錯誤）、loading（載入中）
   */
  const { data: group, error, loading } = useDoc<Group>(groupRef as DocumentReference<Group> | null);

  // ========== 本地 UI 狀態 ==========
  /** 成員列表是否鎖定（鎖定時無法新增/刪除成員） */
  const [isMembersLocked, setIsMembersLocked] = useState(true);

  /** 成員管理對話框是否開啟 */
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  /** 刪除群組確認對話框是否開啟 */
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  /** 刪除確認輸入框的文字（需輸入 'delete' 才能刪除） */
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  /** 是否正在刪除群組（用於顯示刪除中的 Loading 畫面） */
  const [isDeleting, setIsDeleting] = useState(false);

  // ========== 副作用 (Side Effects) ==========
  /**
   * @effect 更新群組歷史紀錄
   * @description 當群組資料載入或變更時，將此群組加入/更新到側邊欄的「最近群組」列表
   * @dependencies [group, addGroupToHistory]
   */
  useEffect(() => {
    // Add or update the group in the history when the page loads or group data changes.
    if (group) {
      addGroupToHistory({
        id: group.id,
        name: group.name || `群組 ${group.id.slice(0, 4)}...`,
        lastAccessed: new Date().toISOString(),
      });
    }
  }, [group, addGroupToHistory]);

  /**
   * @effect 自動開啟成員對話框（新群組）
   * @description 當使用者建立新群組或開啟空群組時，自動彈出成員管理對話框引導新增成員
   *              使用 localStorage 確保設定過成員後不會重複彈出
   * @dependencies [group, groupId]
   */
  useEffect(() => {
    if (!group) return;

    // Use localStorage to track if the dialog has been shown for this group (persists across sessions).
    const localStorageKey = `splitease_dialog_opened_${groupId}`;
    try {
      const hasOpened = localStorage.getItem(localStorageKey);
      if (hasOpened) {
        return;
      }
    } catch (e) {
      // localStorage might be unavailable (e.g., in private browsing on some browsers)
      console.warn("Could not access localStorage.", e);
    }

    const defaultNames = ['小黑', '佑佑', '家愷', '羿捷', '孟孟'];
    const hasOnlyDefaultMembers = group.members.length === 5 && group.members.every(m => defaultNames.includes(m.name));

    if ((group.members.length === 0 || hasOnlyDefaultMembers) && group.expenses.length === 0 && (!group.settlementHistory || group.settlementHistory.length === 0)) {
      setIsMemberDialogOpen(true);
      setIsMembersLocked(false);
    }

    // Mark this group ID as checked in localStorage to prevent the dialog from re-opening.
    try {
      localStorage.setItem(localStorageKey, 'true');
    } catch (e) {
      console.warn("Could not write to localStorage.", e);
    }
  }, [group, groupId]);

  // ========== 資料操作函式 ==========
  /**
   * 更新群組資料
   * 
   * @async
   * @description 將部分群組資料更新到 Firestore，並自動加上 updatedAt 時間戳記
   * 
   * @param {Partial<Omit<Group, 'id' | 'createdAt'>>} updatedData - 要更新的部分群組資料
   * @returns {Promise<void>} 無回傳值
   * 
   * @usage 被 handleAddMember、handleRemoveMember、handleAddExpense、handleSettleUp 等函式呼叫
   * 
   * @example
   * await updateGroup({ name: '新群組名稱' });
   * await updateGroup({ members: [...group.members, newMember] });
   */
  const updateGroup = async (updatedData: Partial<Omit<Group, 'id' | 'createdAt'>>) => {
    if (!groupRef) return;
    try {
      const dataToUpdate = { ...updatedData, updatedAt: serverTimestamp() };
      await updateDoc(groupRef, dataToUpdate);

      // If the name was updated, also update it in the history
      if (updatedData.name) {
        updateGroupInHistory(groupId, { name: updatedData.name });
      }
    } catch (e) {
      console.error("Error updating group:", e);
      toast({
        variant: "destructive",
        title: "更新群組失敗",
        description: "無法儲存您的變更，請檢查您的網路連線並重試。",
      });
    }
  }

  /**
   * 切換成員鎖定狀態
   * 
   * @description 切換成員列表的鎖定/解鎖狀態。鎖定時無法新增或刪除成員，可防止誤操作。
   *              解鎖轉鎖定時，會自動關閉成員對話框。
   * 
   * @returns {void}
   * 
   * @usage 由 MembersCard 的鎖定按鈕觸發
   */
  const toggleMembersLock = () => {
    // When locking, also close the dialog
    if (!isMembersLocked) {
      setIsMemberDialogOpen(false);
    }
    setIsMembersLocked(prev => !prev);
  };

  /**
   * 新增成員
   * 
   * @description 將新成員加入群組。會檢查名稱是否為空或重複。
   * 
   * @param {string} name - 新成員的名稱
   * @returns {void}
   * 
   * @usage 由 MembersCard 的新增成員輸入框觸發
   * 
   * @example
   * handleAddMember("小明")
   */
  const handleAddMember = (name: string) => {
    if (!group || name.trim() === '') return;
    if (group.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      toast({
        variant: "destructive",
        title: "重複的成員",
        description: "該名稱的成員已存在。",
      });
      return;
    }
    const newMember: Member = { id: crypto.randomUUID(), name };
    updateGroup({ members: [...group.members, newMember] });
  };

  /**
   * 移除成員
   * 
   * @description 從群組中移除指定成員。若該成員已參與任何費用記錄，則無法移除。
   * 
   * @param {string} id - 要移除的成員 ID
   * @returns {void}
   * 
   * @usage 由 MembersCard 的刪除按鈕觸發
   */
  const handleRemoveMember = (id: string) => {
    if (!group) return;
    if (group.expenses.some(e => e.paidBy.some(p => p.memberId === id) || e.splitDetails.some(s => s.memberId === id))) {
      toast({
        variant: "destructive",
        title: "無法移除成員",
        description: "該成員已參與現有費用，無法移除。",
      });
      return;
    }
    updateGroup({ members: group.members.filter(m => m.id !== id) });
  };

  /**
   * 新增費用
   * 
   * @description 將新費用記錄加入群組，自動產生 ID 和時間戳記。
   * 
   * @param {Omit<Expense, 'id' | 'date'>} data - 費用資料（不含 ID 和日期）
   * @returns {void}
   * 
   * @usage 由 AddExpenseCard 表單提交時觸發
   */
  const handleAddExpense = (data: Omit<Expense, 'id' | 'date'>) => {
    if (!group) return;
    const newExpense: Expense = {
      ...data,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    const newExpenses = [newExpense, ...(group.expenses || [])];
    updateGroup({ expenses: newExpenses });
  };

  /**
   * 結算帳目
   * 
   * @description 將目前所有費用記錄結算，存入歷史紀錄，並清空目前的費用列表。
   * 
   * @returns {void}
   * 
   * @usage 由 SummaryCard 的「結算」按鈕觸發
   */
  const handleSettleUp = () => {
    if (!group || !debts || group.expenses.length === 0) {
      toast({
        title: "沒有費用可結算",
        description: "目前沒有任何費用記錄可以結算。",
      });
      return;
    }

    const newSettlement: Settlement = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      expenses: [...group.expenses],
      debts: [...debts],
    };

    updateGroup({
      settlementHistory: [newSettlement, ...(group.settlementHistory || [])],
      expenses: [],
    });

    toast({
      title: "帳目已結清！",
      description: "所有費用均已結清並存檔。",
    })
  }

  /**
   * 觸發刪除群組對話框
   * 
   * @description 關閉成員對話框並開啟刪除確認對話框
   * 
   * @returns {void}
   * 
   * @usage 由 MembersCard 的「刪除群組」按鈕觸發
   */
  const handleTriggerDelete = () => {
    setIsMemberDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };

  /**
   * 刪除群組
   * 
   * @async
   * @description 永久刪除整個群組，包含所有成員、費用和結算歷史。
   *              刪除成功後會清理 body 樣式（防止 UI 卡住）並導航回首頁。
   * 
   * @returns {Promise<void>}
   * 
   * @usage 由刪除確認對話框的「確定刪除」按鈕觸發
   */
  const handleDeleteGroup = async () => {
    if (!groupRef) return;
    setIsDeleting(true);
    try {
      await deleteDoc(groupRef);

      // Cleanup any remaining body styles from Radix UI dialogs that might get stuck
      // when the component unmounts rapidly during redirection
      document.body.style.pointerEvents = '';
      document.body.style.removeProperty('pointer-events');
      document.body.removeAttribute('data-scroll-locked');
      document.body.classList.remove('antigravity-scroll-lock'); // Fix specifically for this environment

      toast({
        title: "群組已刪除",
        description: "已將您導回首頁。",
      });
      router.push('/');
    } catch (e) {
      console.error("Error deleting group:", e);
      toast({
        variant: "destructive",
        title: "刪除群組失敗",
        description: "無法刪除群組，請檢查您的網路連線並重試。",
      });
      setIsDeleting(false);
    }
  };

  // ========== 計算邏輯 (Computed Values) ==========
  /**
   * 計算每位成員的餘額
   * 
   * @description 根據所有費用記錄，計算每位成員的淨餘額。
   *              正值表示該成員被「欠錢」，負值表示該成員「欠人錢」。
   * 
   * @algorithm
   * 1. 初始化每位成員的餘額為 0
   * 2. 遍歷每筆費用：
   *    - 付款者餘額 += 付款金額（代表他墊了錢，別人欠他）
   *    - 根據分帳方式計算每人應付金額
   *    - 分攤者餘額 -= 應付金額（代表他欠錢）
   * 
   * @returns {Map<string, number>} 成員 ID 到餘額的映射
   *          - 正值：該成員被欠錢（creditor）
   *          - 負值：該成員欠錢（debtor）
   * 
   * @dependencies [group] - 當群組資料變更時重新計算
   * 
   * @usage 供 debts 計算使用，以及顯示在 CalculationDetailsCard 中
   */
  const balances = useMemo(() => {
    if (!group) return new Map();
    return calculateBalances(group.expenses || []);
  }, [group]);

  /**
   * 計算最簡交易（誰該付給誰多少錢）
   * 
   * @description 根據餘額計算最少次數的轉帳，將所有債務結清。
   *              使用貪婪演算法配對債務人和債權人。
   * 
   * @algorithm
   * 1. 分離債務人（餘額 < 0）和債權人（餘額 > 0）
   * 2. 按金額排序
   * 3. 配對最小債務人和最小債權人
   * 4. 轉帳金額 = min(債務人欠款, 債權人應收)
   * 5. 更新餘額，若任一方結清則移除
   * 6. 重複直到所有人結清
   * 
   * @returns {Debt[]} 債務列表，每筆包含 from（付款人）、to（收款人）、amount（金額）
   * 
   * @dependencies [balances, group] - 當餘額或群組變更時重新計算
   * 
   * @usage 供 SummaryCard、CalculationDetailsCard、handleSettleUp 使用
   */
  const debts = useMemo((): Debt[] => {
    if (!group) return [];
    return calculateSettlements(balances, group.members);
  }, [balances, group]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-4">
            <div className="flex justify-start">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Skeleton className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex justify-center min-w-0">
              <Skeleton className="h-9 w-48" />
            </div>
            <div className="flex items-center justify-end gap-1 md:gap-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="flex items-center justify-start">
            <Skeleton className="h-9 w-64" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <div className="lg:col-span-1 space-y-8 flex flex-col">
            <Skeleton className="h-[500px] w-full" />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>
            無法載入群組資料。可能是連結錯誤或網路問題。請檢查連結並重試。
          </AlertDescription>
        </Alert>
      </div>
    )
  }



  if (isDeleting) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">正在刪除群組...</p>
        </div>
      </div>
    );
  }

  return (
    <CurrentUserProvider members={group.members} groupId={groupId}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pt-0 pb-4 md:pb-6 lg:pb-8">
        <AppHeader
          groupName={group.name || '未命名群組'}
          onUpdateName={(newName) => updateGroup({ name: newName })}
          onOpenMembers={() => setIsMemberDialogOpen(true)}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Input & Tools */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-6 space-y-6">
              <AddExpenseCard members={group.members} onAddExpense={handleAddExpense} isLocked={isMembersLocked} />
            </div>
          </div>

          {/* Right Column: Summary & History */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <SummaryCard expenses={group.expenses} members={group.members} />

            {group.expenses.length > 0 && (
              <CalculationDetailsCard
                expenses={group.expenses}
                members={group.members}
                balances={balances}
                debts={debts}
                onSettleUp={handleSettleUp}
              />
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              <div className="space-y-8">
                <ExpensesListCard expenses={group.expenses} members={group.members} />
              </div>
              <div className="space-y-8">
                <SettlementHistoryCard settlements={group.settlementHistory} members={group.members} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="p-0 max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>管理群組成員</DialogTitle>
          </DialogHeader>
          <MembersCard
            members={group?.members || []}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            isLocked={isMembersLocked}
            onToggleLock={toggleMembersLock}
            onTriggerDelete={handleTriggerDelete}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirmationText('');
        }
        setIsDeleteDialogOpen(open)
      }}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除整個群組嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作將永久刪除此群組的所有資料，且無法復原。請在下方輸入 <strong className="text-foreground">delete</strong> 以確認。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="delete"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmationText !== 'delete'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteGroup}
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <UserIdentityEnforcer
        isDialogOpen={isMemberDialogOpen}
        onForceOpen={() => setIsMemberDialogOpen(true)}
        memberCount={group.members.length}
      />
    </CurrentUserProvider>
  );
}
