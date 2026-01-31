'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const createNewGroup = async () => {
    if (!firestore) {
        // TODO: Show an error to the user
        console.error("Firestore is not available");
        return;
    };
    setIsLoading(true);

    const defaultMembers = [
      { id: crypto.randomUUID(), name: '小黑' },
      { id: crypto.randomUUID(), name: '佑佑' },
      { id: crypto.randomUUID(), name: '家愷' },
      { id: crypto.randomUUID(), name: '羿捷' },
      { id: crypto.randomUUID(), name: '孟孟' },
    ];

    try {
      const newGroupDoc = await addDoc(collection(firestore, 'groups'), {
        name: '未命名群組',
        members: defaultMembers,
        expenses: [],
        settlementHistory: [],
        createdAt: serverTimestamp(),
      });
      router.push(`/group/${newGroupDoc.id}`);
    } catch (error) {
      console.error('Error creating new group:', error);
      // TODO: Show an error to the user
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-center">
        <div className="flex items-center gap-4 mb-4">
            <h1 className="text-5xl md:text-6xl font-headline font-bold">付錢啦</h1>
        </div>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
            輕鬆解決分帳問題，建立一個群組，分享連結即可開始！
        </p>
        <Button onClick={createNewGroup} disabled={isLoading || !firestore} size="lg">
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isLoading ? '建立中...' : '建立新分帳群組'}
        </Button>
    </main>
  );
}
