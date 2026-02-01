'use client';

import { useState, KeyboardEvent } from 'react';
import { Users, Share2, Edit, Check } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { WorldClock } from './world-clock';
import { ShareDialog } from './share-dialog';
import { Input } from '../ui/input';
import { useSidebar } from '../ui/sidebar';
import { MenuIcon } from '@/components/icons';
import { CurrencyConverterPopover } from './currency-converter-popover';

interface AppHeaderProps {
    groupName: string;
    onUpdateName: (newName: string) => void;
    onOpenMembers: () => void;
}

export function AppHeader({ groupName, onUpdateName, onOpenMembers }: AppHeaderProps) {
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentName, setCurrentName] = useState(groupName);
    const { toggleSidebar } = useSidebar();

    const handleShare = () => {
        setShareUrl(window.location.href);
        setIsShareDialogOpen(true);
    };

    const handleNameUpdate = () => {
        if (currentName.trim() && currentName !== groupName) {
            onUpdateName(currentName.trim());
        } else {
            setCurrentName(groupName); // Revert if empty or unchanged
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleNameUpdate();
        } else if (e.key === 'Escape') {
            setCurrentName(groupName);
            setIsEditing(false);
        }
    };

    return (
        <>
            <header className="min-h-[57px] h-auto py-2 flex items-center mb-4 space-y-0 w-full">
                {/* Desktop: Single row with title left, toolbar right */}
                {/* Mobile: Two rows - title on top, toolbar below */}
                <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 w-full">
                    <Button variant="ghost" size="icon" className="md:hidden -ml-2 shrink-0" onClick={toggleSidebar}>
                        <MenuIcon className="h-6 w-6 text-primary" />
                    </Button>

                    {/* Title Section */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isEditing ? (
                            <div className="relative w-full max-w-sm">
                                <Input
                                    value={currentName}
                                    onChange={(e) => setCurrentName(e.target.value)}
                                    onBlur={handleNameUpdate}
                                    onKeyDown={handleKeyDown}
                                    className="text-xl md:text-2xl lg:text-3xl font-headline font-bold h-9 pr-10 focus-visible:ring-primary/50"
                                    autoFocus
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                                    onMouseDown={handleNameUpdate}
                                >
                                    <Check className="h-5 w-5 text-primary" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 min-w-0 group">
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-headline font-bold text-foreground truncate">
                                    {groupName}
                                </h1>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                                setCurrentName(groupName);
                                                setIsEditing(true);
                                            }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>編輯群組名稱</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </div>

                    {/* Toolbar - on same row on desktop, wraps to new row on mobile */}
                    <div className="flex items-center gap-2 w-full md:w-auto order-last md:order-none">
                        {/* Mobile only: WorldClock on the left */}
                        <div className="flex md:hidden items-center">
                            <WorldClock />
                        </div>

                        {/* Spacer for mobile */}
                        <div className="flex-1 md:hidden" />

                        {/* Action toolbar */}
                        <div className="flex items-center bg-card border rounded-xl p-1 shadow-sm shrink-0">
                            <CurrencyConverterPopover />

                            {/* WorldClock - Desktop only */}
                            <div className="hidden md:flex items-center">
                                <div className="w-[1px] h-6 bg-border mx-1"></div>
                                <WorldClock />
                            </div>

                            <div className="w-[1px] h-6 bg-border mx-1"></div>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleShare}>
                                            <Share2 className="h-5 w-5" />
                                            <span className="sr-only">分享群組連結</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>分享群組連結</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <div className="w-[1px] h-6 bg-border mx-1"></div>

                            <Button
                                variant="ghost"
                                className="h-9 px-3 gap-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={onOpenMembers}
                            >
                                <Users className="h-4 w-4" />
                                <span className="font-medium hidden sm:inline">成員</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
            <ShareDialog
                url={shareUrl}
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
            />
        </>
    );
}
