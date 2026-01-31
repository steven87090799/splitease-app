'use client';

import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import * as React from 'react';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [instances, setInstances] = React.useState<FirebaseInstances | null>(
    null
  );
  const [configError, setConfigError] = React.useState(false);

  React.useEffect(() => {
    if (firebaseConfig.apiKey) {
      const app =
        getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setInstances({ app, auth, firestore });
      setConfigError(false);
    } else {
      console.error(
        'Firebase API Key is missing. Firebase could not be initialized.'
      );
      setConfigError(true);
    }
  }, []);

  if (configError) {
    return (
        <main className="container mx-auto p-4 md:p-8">
            <Alert variant="destructive" className="mt-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Firebase 設定錯誤</AlertTitle>
                <AlertDescription>
                   <p>應用程式無法連接到 Firebase，因為必要的設定金鑰缺失。</p>
                   <p className="mt-2">這通常是因為 <code>.env</code> 檔案中的環境變數沒有被正確載入。</p>
                   <p className="mt-2">請確認您的專案根目錄下有 <code>.env</code> 檔案，並且已填入所有必要的 <code>NEXT_PUBLIC_FIREBASE_*</code> 變數。</p>
                </AlertDescription>
            </Alert>
        </main>
    );
  }

  if (!instances) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">連接至 Firebase...</p>
        </div>
    );
  }

  return (
    <FirebaseProvider
      app={instances.app}
      auth={instances.auth}
      firestore={instances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
