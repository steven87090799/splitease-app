'use client';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import * as React from 'react';

const FirebaseAppContext = React.createContext<FirebaseApp | undefined>(
  undefined
);
const AuthContext = React.createContext<Auth | undefined>(undefined);
const FirestoreContext = React.createContext<Firestore | undefined>(undefined);

export function FirebaseProvider({
  children,
  app,
  auth,
  firestore,
}: {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) {
  return (
    <FirebaseAppContext.Provider value={app}>
      <AuthContext.Provider value={auth}>
        <FirestoreContext.Provider value={firestore}>
          {children}
        </FirestoreContext.Provider>
      </AuthContext.Provider>
    </FirebaseAppContext.Provider>
  );
}

export const useFirebaseApp = () => React.useContext(FirebaseAppContext);
export const useAuth = () => React.useContext(AuthContext);
export const useFirestore = () => React.useContext(FirestoreContext);
