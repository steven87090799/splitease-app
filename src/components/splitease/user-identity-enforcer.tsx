'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';

interface UserIdentityEnforcerProps {
    isDialogOpen: boolean;
    onForceOpen: () => void;
    memberCount: number;
}

export function UserIdentityEnforcer({ isDialogOpen, onForceOpen, memberCount }: UserIdentityEnforcerProps) {
    const { currentUser } = useCurrentUser();

    useEffect(() => {
        // Only enforce if there are members to select from
        if (!currentUser && !isDialogOpen && memberCount > 0) {
            onForceOpen();
        }
    }, [currentUser, isDialogOpen, onForceOpen, memberCount]);

    return null;
}
