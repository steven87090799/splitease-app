'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
}

export function ShareDialog({ open, onOpenChange, url }: ShareDialogProps) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = () => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        setHasCopied(true);
        toast({
            title: '已複製連結！',
        });
        setTimeout(() => setHasCopied(false), 2000);
    };

    if (!url) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>分享群組</DialogTitle>
                <DialogDescription>
                    任何人只要有此連結，就能檢視並加入此群組。
                </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                    <div className="p-4 bg-white rounded-lg border">
                         <QRCode
                            value={url}
                            size={180}
                         />
                    </div>
                   
                    <div className="flex items-center space-x-2 w-full">
                        <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={url}
                            readOnly
                            className="text-sm"
                        />
                        </div>
                        <Button type="button" size="icon" className="px-3" onClick={handleCopy} disabled={!url}>
                            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">複製連結</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
