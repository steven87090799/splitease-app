'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { Member } from '@/lib/types';

interface CurrentUserContextType {
  currentUser: Member | null;
  setCurrentUser: (member: Member | null) => void;
  isCurrentUser: (memberId: string) => boolean;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export function CurrentUserProvider({ children, members }: { children: React.ReactNode; members: Member[] }) {
  const [currentUser, setCurrentUserState] = useState<Member | null>(null);

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('splitease_currentUser');
      if (storedUserId) {
        const user = members.find(m => m.id === storedUserId) || null;
        setCurrentUserState(user);
      }
    } catch (error) {
      console.error("Could not access localStorage.", error);
    }
  }, [members]);

  const setCurrentUser = useCallback((member: Member | null) => {
    setCurrentUserState(member);
    try {
      if (member) {
        localStorage.setItem('splitease_currentUser', member.id);
      } else {
        localStorage.removeItem('splitease_currentUser');
      }
    } catch (error) {
      console.error("Could not access localStorage.", error);
    }
  }, []);

  const isCurrentUser = useCallback((memberId: string) => {
    return currentUser?.id === memberId;
  }, [currentUser]);

  return React.createElement(
    CurrentUserContext.Provider,
    { value: { currentUser, setCurrentUser, isCurrentUser } },
    children
  );
}

export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
};
