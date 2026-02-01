'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { Member } from '@/lib/types';

interface CurrentUserContextType {
  currentUser: Member | null;
  setCurrentUser: (member: Member | null) => void;
  isCurrentUser: (memberId: string) => boolean;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export function CurrentUserProvider({ children, members, groupId }: { children: React.ReactNode; members: Member[]; groupId: string }) {
  const [currentUser, setCurrentUserState] = useState<Member | null>(null);

  // Use group-specific localStorage key
  const storageKey = `splitease_currentUser_${groupId}`;

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem(storageKey);
      if (storedUserId) {
        const user = members.find(m => m.id === storedUserId) || null;
        setCurrentUserState(user);
      } else {
        // Reset if no stored user for this group
        setCurrentUserState(null);
      }
    } catch (error) {
      console.error("Could not access localStorage.", error);
    }
  }, [members, storageKey]);

  const setCurrentUser = useCallback((member: Member | null) => {
    setCurrentUserState(member);
    try {
      if (member) {
        localStorage.setItem(storageKey, member.id);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Could not access localStorage.", error);
    }
  }, [storageKey]);

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
