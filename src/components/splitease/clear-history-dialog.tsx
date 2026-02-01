import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2 } from 'lucide-react';

interface ClearHistoryDialogProps {
    onClear: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClearHistoryDialog({ onClear, open, onOpenChange }: ClearHistoryDialogProps) {
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClear = async () => {
        setIsDeleting(true);
        // Simulate small delay or just call function
        await onClear();
        setIsDeleting(false);
        onOpenChange(false);
        setConfirmationText('');
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            onOpenChange(newOpen);
            if (!newOpen) setConfirmationText('');
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full relative overflow-hidden group/clear mt-4
                        border border-destructive/20 bg-destructive/5 hover:bg-destructive/10
                        text-muted-foreground hover:text-destructive
                        justify-start transition-all duration-300"
                >
                    <Trash2 className="mr-2 h-4 w-4 transition-transform group-hover/clear:rotate-12 uppercase" />
                    <span className="font-mono tracking-wider text-xs uppercase">Clear Database</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>確定要清除所有群組紀錄嗎？</DialogTitle>
                    <DialogDescription>
                        此操作將會清除您在本機上的所有群組歷史紀錄，但**不會**刪除雲端上的群組本身。請在下方輸入 <strong className="text-foreground">delete</strong> 以確認。
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Input
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="delete"
                        className="font-mono"
                        autoFocus
                        autoComplete="off"
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isDeleting}>取消</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={confirmationText !== 'delete' || isDeleting}
                        onClick={(e) => {
                            e.preventDefault();
                            handleClear();
                        }}
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "確定清除"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
