'use client';

/**
 * ============================================================================
 * useDoc Hook
 * ============================================================================
 * 
 * @description 訂閱 Firestore 單一文件的即時更新
 *              這是應用程式中讀取 Firestore 資料的主要方式
 */

import {
  onSnapshot,
  doc,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';
import * as React from 'react';

import { useFirestore } from '..';

/**
 * 訂閱 Firestore 文件
 * 
 * @description 使用 Firestore onSnapshot 監聽文件變更，自動同步資料到 React 狀態。
 *              當文件內容在 Firestore 中改變時，元件會自動重新渲染。
 * 
 * @template T - 文件資料的型別（例如：Group、Member 等）
 * 
 * @param {DocumentReference<T> | null} ref - Firestore 文件參考
 *        傳入 null 時，會清空資料並設定 loading 為 false
 * 
 * @returns {object} 包含三個屬性的物件：
 *          - {T | null} data - 文件資料，不存在或載入中時為 null
 *          - {boolean} loading - 是否正在載入中
 *          - {Error | null} error - 錯誤物件，無錯誤時為 null
 * 
 * @usage 搭配 doc() 函式建立參考後使用
 * 
 * @example
 * const groupRef = useMemo(() => doc(firestore, 'groups', groupId), [firestore, groupId]);
 * const { data: group, loading, error } = useDoc<Group>(groupRef);
 * 
 * if (loading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 * if (!group) return <NotFound />;
 * return <GroupPage group={group} />;
 * 
 * @see https://firebase.google.com/docs/firestore/query-data/listen
 */
export function useDoc<T>(
  ref: DocumentReference<T> | null
): { data: T | null; loading: boolean; error: Error | null } {
  // ========== 狀態管理 ==========
  /** 文件資料 */
  const [data, setData] = React.useState<T | null>(null);

  /** 載入狀態 */
  const [loading, setLoading] = React.useState(true);

  /** 錯誤狀態 */
  const [error, setError] = React.useState<Error | null>(null);

  // ========== 訂閱 Firestore ==========
  React.useEffect(() => {
    // 若無參考，清空狀態並返回
    if (!ref) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    // 重置狀態
    setLoading(true);
    setData(null);
    setError(null);

    // 建立即時監聽器
    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          // 文件存在：設定資料（將 id 併入資料物件）
          setData({ ...(doc.data() as T), id: doc.id });
        } else {
          // 文件不存在：清空資料
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        // 錯誤處理
        console.error('Error fetching document: ', error);
        setError(error);
        setLoading(false);
      }
    );

    // 清理函式：元件卸載時取消訂閱
    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
