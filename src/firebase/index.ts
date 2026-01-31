/**
 * ============================================================================
 * Firebase 初始化與匯出
 * ============================================================================
 * 
 * @description Firebase 客戶端初始化模組
 *              負責初始化 Firebase App、Auth、Firestore，並匯出相關 hooks
 */

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { firebaseConfig } from './config';
import { FirebaseClientProvider } from './client-provider';
import { useAuth, useFirestore, useFirebaseApp } from './provider';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';

/**
 * 初始化 Firebase
 * 
 * @description 初始化 Firebase App、Auth 和 Firestore 服務。
 *              若已有初始化的 App 則重用，避免重複初始化。
 * 
 * @returns {object} 包含三個 Firebase 服務：
 *          - {FirebaseApp} app - Firebase App 實例
 *          - {Auth} auth - Firebase Auth 服務
 *          - {Firestore} firestore - Firestore 資料庫服務
 * 
 * @usage 通常由 FirebaseClientProvider 在應用程式啟動時呼叫
 * 
 * @example
 * const { app, auth, firestore } = initializeFirebase();
 */
function initializeFirebase() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

// ============================================================================
// 匯出
// ============================================================================

export {
  /** 初始化 Firebase 服務 */
  initializeFirebase,

  /** Firebase Context Provider，用於包裝應用程式 */
  FirebaseClientProvider,

  /** 存取 Firebase Auth 服務的 Hook */
  useAuth,

  /** 存取 Firestore 資料庫的 Hook */
  useFirestore,

  /** 存取 Firebase App 實例的 Hook */
  useFirebaseApp,

  /** 訂閱 Firestore 集合的 Hook */
  useCollection,

  /** 訂閱 Firestore 單一文件的 Hook */
  useDoc,
};
