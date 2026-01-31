'use client';

/**
 * ============================================================================
 * useGroupHistory Hook
 * ============================================================================
 * 
 * @description 管理群組歷史紀錄的 React Context 和 Hook
 *              使用 localStorage 永久儲存使用者造訪過的群組列表
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { GroupHistoryItem } from '@/lib/types';

// ============================================================================
// 常數
// ============================================================================

/** localStorage 儲存鍵名 */
const LOCAL_STORAGE_KEY = 'splitease_groupHistory';

// ============================================================================
// 型別定義
// ============================================================================

/**
 * GroupHistory Context 的型別
 * 
 * @interface GroupHistoryContextType
 * @property {GroupHistoryItem[]} groups - 群組歷史列表（按最後存取時間排序）
 * @property {(group: GroupHistoryItem) => void} addGroupToHistory - 新增或更新群組到歷史
 * @property {(groupId: string, updates: Partial<Omit<GroupHistoryItem, 'id'>>) => void} updateGroupInHistory - 更新特定群組的資訊
 * @property {(groupId: string) => void} removeGroupFromHistory - 從歷史中移除群組
 * @property {() => void} clearHistory - 清除所有歷史紀錄
 */
interface GroupHistoryContextType {
  groups: GroupHistoryItem[];
  addGroupToHistory: (group: GroupHistoryItem) => void;
  updateGroupInHistory: (groupId: string, updates: Partial<Omit<GroupHistoryItem, 'id'>>) => void;
  removeGroupFromHistory: (groupId: string) => void;
  clearHistory: () => void;
}

/** Context 實例 */
const GroupHistoryContext = createContext<GroupHistoryContextType | undefined>(undefined);

// ============================================================================
// Provider 元件
// ============================================================================

/**
 * 群組歷史 Provider
 * 
 * @description 提供群組歷史紀錄的狀態管理，包含讀取、新增、更新、刪除和清除功能。
 *              資料自動同步到 localStorage 以持久化儲存。
 * 
 * @param {object} props - 元件屬性
 * @param {React.ReactNode} props.children - 子元件
 * 
 * @usage 在 app/layout.tsx 中包裝整個應用程式
 * 
 * @example
 * <GroupHistoryProvider>
 *   <App />
 * </GroupHistoryProvider>
 */
export function GroupHistoryProvider({ children }: { children: React.ReactNode }) {
  // ========== 狀態 ==========
  /** 群組歷史列表 */
  const [groups, setGroups] = useState<GroupHistoryItem[]>([]);

  // ========== 初始化：從 localStorage 讀取 ==========
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        setGroups(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Could not access localStorage or parse history.", error);
    }
  }, []);

  // ========== 輔助函式 ==========
  /**
   * 儲存歷史到 localStorage
   * 
   * @description 排序群組（按最後存取時間降序）並儲存到 localStorage
   * @param {GroupHistoryItem[]} updatedGroups - 更新後的群組列表
   */
  const saveHistory = (updatedGroups: GroupHistoryItem[]) => {
    try {
      // Sort by lastAccessed date descending before saving
      const sortedGroups = updatedGroups.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
      setGroups(sortedGroups);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedGroups));
    } catch (error) {
      console.error("Could not access localStorage to save history.", error);
    }
  }

  // ========== 公開 API ==========
  /**
   * 新增群組到歷史
   * 
   * @description 若群組已存在，更新其名稱和最後存取時間；若不存在，新增到列表
   * @param {GroupHistoryItem} newGroup - 要新增/更新的群組資訊
   */
  const addGroupToHistory = useCallback((newGroup: GroupHistoryItem) => {
    setGroups(prevGroups => {
      const existingGroup = prevGroups.find(g => g.id === newGroup.id);
      let updatedGroups;
      if (existingGroup) {
        // If group exists, update its lastAccessed time and potentially its name
        updatedGroups = prevGroups.map(g =>
          g.id === newGroup.id ? { ...g, lastAccessed: new Date().toISOString(), name: newGroup.name } : g
        );
      } else {
        // If group is new, add it
        updatedGroups = [...prevGroups, newGroup];
      }
      saveHistory(updatedGroups);
      return updatedGroups; // This return is for the state setter, not used by saveHistory
    });
  }, []);

  /**
   * 更新歷史中的群組資訊
   * 
   * @description 更新指定群組的部分屬性（例如：只更新名稱）
   * @param {string} groupId - 群組 ID
   * @param {Partial<Omit<GroupHistoryItem, 'id'>>} updates - 要更新的屬性
   */
  const updateGroupInHistory = useCallback((groupId: string, updates: Partial<Omit<GroupHistoryItem, 'id'>>) => {
    setGroups(prevGroups => {
      const updatedGroups = prevGroups.map(g =>
        g.id === groupId ? { ...g, ...updates } : g
      );
      saveHistory(updatedGroups);
      return updatedGroups;
    })
  }, []);

  /**
   * 從歷史中移除群組
   * 
   * @description 將指定群組從歷史列表中刪除
   * @param {string} groupId - 要移除的群組 ID
   */
  const removeGroupFromHistory = useCallback((groupId: string) => {
    setGroups(prevGroups => {
      const updatedGroups = prevGroups.filter(g => g.id !== groupId);
      saveHistory(updatedGroups);
      return updatedGroups;
    });
  }, []);

  /**
   * 清除所有歷史紀錄
   * 
   * @description 清空群組列表並從 localStorage 中刪除資料
   */
  const clearHistory = useCallback(() => {
    setGroups([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Could not clear history from localStorage.", error);
    }
  }, []);

  // ========== 渲染 ==========
  return React.createElement(
    GroupHistoryContext.Provider,
    { value: { groups, addGroupToHistory, updateGroupInHistory, removeGroupFromHistory, clearHistory } },
    children
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * 使用群組歷史 Hook
 * 
 * @description 存取群組歷史 Context 的 Hook
 * 
 * @returns {GroupHistoryContextType} 群組歷史的狀態和操作方法
 * 
 * @throws {Error} 若在 GroupHistoryProvider 外部使用
 * 
 * @usage 在任何需要存取群組歷史的元件中使用
 * 
 * @example
 * const { groups, addGroupToHistory, clearHistory } = useGroupHistory();
 * 
 * // 顯示歷史列表
 * groups.map(group => <GroupItem key={group.id} {...group} />);
 * 
 * // 新增到歷史
 * addGroupToHistory({ id: 'abc123', name: '聚餐', lastAccessed: new Date().toISOString() });
 */
export const useGroupHistory = () => {
  const context = useContext(GroupHistoryContext);
  if (context === undefined) {
    throw new Error('useGroupHistory must be used within a GroupHistoryProvider');
  }
  return context;
};
