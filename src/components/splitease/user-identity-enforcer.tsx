'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';

interface UserIdentityEnforcerProps {
    isDialogOpen: boolean;
    onForceOpen: () => void;
    memberCount: number;
}

export function UserIdentityEnforcer({ isDialogOpen, onForceOpen, memberCount }: UserIdentityEnforcerProps) {
    const { currentUser, isLoaded } = useCurrentUser();

    useEffect(() => {
        // Only enforce AFTER localStorage has been loaded
        // and if there are members to select from
        if (isLoaded && !currentUser && !isDialogOpen && memberCount > 0) {
            onForceOpen();
        }
    }, [currentUser, isDialogOpen, onForceOpen, memberCount, isLoaded]);

    return null;
}

