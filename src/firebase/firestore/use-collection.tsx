'use client';
import {
  collection,
  onSnapshot,
  query,
  where,
  type CollectionReference,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import * as React from 'react';

import { useFirestore } from '..';

export function useCollection<T>(
  path: string,
  uid?: string
): { data: T[] | null; loading: boolean } {
  const firestore = useFirestore();
  const [data, setData] = React.useState<T[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!firestore) {
      return;
    }
    const ref = collection(firestore, path) as CollectionReference<T>;
    let q: Query<T> | CollectionReference<T> = ref;
    if (uid) {
      q = query(ref, where('uid', '==', uid));
    }
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path, uid]);

  return { data, loading };
}
