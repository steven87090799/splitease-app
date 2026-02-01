import { useState, useRef, useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';
import { doc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, X, CloudOff, Loader2, AlertTriangle, Wallet } from 'lucide-react';
import { useGroupHistory } from '@/hooks/use-group-history';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ClearHistoryDialog } from '@/components/splitease/clear-history-dialog';
import { useToast } from '@/hooks/use-toast';

export function GroupSidebar() {
  const { groups, clearHistory, removeGroupFromHistory } = useGroupHistory();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteGroupDialog, setDeleteGroupDialog] = useState<{ isOpen: boolean; groupId: string; groupName: string }>({ isOpen: false, groupId: '', groupName: '' });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteFromCloud, setDeleteFromCloud] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  // Focus input when dialog opens
  // Focus logic removed to let Radix UI handle it naturally

  const handleNavigation = (href: string) => {
    router.push(href);
    setOpenMobile(false);
  };

  const handleClearHistory = () => {
    clearHistory();
    setIsDialogOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupDialog.groupId || !firestore) return;

    setIsDeleting(true);
    try {
      // If user wants to delete from cloud too
      if (deleteFromCloud) {
        const groupRef = doc(firestore, 'groups', deleteGroupDialog.groupId);
        await deleteDoc(groupRef);
        toast({
          title: "群組已從雲端刪除",
          description: `「${deleteGroupDialog.groupName}」已永久刪除。`,
        });
      } else {
        toast({
          title: "已從歷史紀錄移除",
          description: `「${deleteGroupDialog.groupName}」已從您的歷史紀錄移除，但雲端資料仍然保留。`,
        });
      }

      removeGroupFromHistory(deleteGroupDialog.groupId);
      setDeleteGroupDialog({ isOpen: false, groupId: '', groupName: '' });
      setDeleteConfirmText('');
      setDeleteFromCloud(false);

      // If we're currently viewing this group and deleted from cloud, redirect
      if (deleteFromCloud && pathname.includes(deleteGroupDialog.groupId)) {
        router.push('/');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "刪除失敗",
        description: "無法刪除群組，請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Wallet className="w-8 h-8 text-primary" />
          <span className="text-xl font-headline font-semibold whitespace-nowrap">付錢啦</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 px-3 
                         bg-background/50 border border-border/50
                         hover:bg-primary/10 hover:border-primary/50 hover:text-primary
                         transition-all duration-300
                         group"
              onClick={() => handleNavigation('/')}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center 
                              border border-primary/30 bg-primary/10
                              group-hover:border-primary group-hover:bg-primary/20
                              transition-all duration-300">
                <PlusCircle className="h-3 w-3 text-primary group-hover:text-primary" />
              </div>
              <span className="text-sm font-medium">建立新群組</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>最近的群組</SidebarGroupLabel>
          <SidebarMenu>
            {groups.length > 0 ? groups.map(group => {
              const isActive = pathname.includes(group.id);
              return (
                <SidebarMenuItem key={group.id} className="group/item">
                  <div className="relative flex items-center w-full transition-all duration-300 border rounded-md group/item border-white/5 bg-background/20 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] overflow-hidden">
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => handleNavigation(`/group/${group.id}`)}
                      className="flex flex-col items-start flex-1 h-auto py-3 pl-3 pr-8 transition-colors duration-300 hover:bg-transparent active:bg-transparent data-[active=true]:bg-primary/10 data-[active=true]:border-primary/50"
                    >
                      <span className={`font-semibold truncate w-full text-left transition-colors duration-300 ${isActive ? 'text-primary' : 'group-hover/item:text-primary'}`}>{group.name}</span>
                      <span className="text-xs text-muted-foreground/70 group-hover/item:text-muted-foreground/90">
                        {formatDistanceToNow(new Date(group.lastAccessed), { addSuffix: true, locale: zhTW })}
                      </span>
                    </SidebarMenuButton>

                    {/* Unified Delete Button Overlay */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 bg-gradient-to-l from-background/80 to-transparent">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors group/delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteGroupDialog({ isOpen: true, groupId: group.id, groupName: group.name });
                        }}
                      >
                        <X className="h-4 w-4 transition-transform duration-500 ease-in-out group-hover/delete:rotate-180" />
                      </Button>
                    </div>
                  </div>
                </SidebarMenuItem>
              );
            }) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                <p>尚無群組紀錄。</p>
                <p>建立或開啟一個群組來開始！</p>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Single Group Delete Dialog */}
        <AlertDialog
          open={deleteGroupDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteGroupDialog({ isOpen: false, groupId: '', groupName: '' });
              setDeleteConfirmText('');
            }
          }}
        >
          <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[425px]">
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                確定要刪除「{deleteGroupDialog.groupName}」嗎？
              </AlertDialogTitle>
              <AlertDialogDescription asChild className="text-base text-muted-foreground">
                <div className="text-base text-muted-foreground">
                  <p className="mb-4">此操作將會從您的歷史紀錄中移除此群組。</p>
                  <div className="flex items-start space-x-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-amber-500">
                    <CloudOff className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">雲端資料保留政策</p>
                      <p className="text-xs opacity-90">
                        預設情況下，雲端資料會被保留。若這是一個誤創的群組，您可以勾選下方選項將其永久刪除。
                      </p>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-cloud"
                  checked={deleteFromCloud}
                  onCheckedChange={(checked) => setDeleteFromCloud(checked as boolean)}
                  className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                />
                <Label
                  htmlFor="delete-cloud"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${deleteFromCloud ? 'text-destructive' : ''}`}
                >
                  同時從雲端資料庫永久刪除 (危險)
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">請輸入群組名稱 <span className="font-mono text-foreground font-bold">{deleteGroupDialog.groupName}</span> 以確認：</Label>
                <Input
                  ref={deleteInputRef}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={deleteGroupDialog.groupName}
                  className="font-mono border-destructive/30 focus-visible:ring-destructive/30"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteConfirmText !== deleteGroupDialog.groupName || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteGroup();
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    刪除中...
                  </>
                ) : (
                  '確定刪除'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarContent>
      {groups.length > 0 && (
        <SidebarFooter className="border-t-0 border-none pt-4">
          <ClearHistoryDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onClear={handleClearHistory}
          />

          <div className="w-full group/footer cursor-default mb-2">
            {/* Tech Data Stream Separator */}
            <div className="relative h-[2px] w-full my-3 overflow-hidden">
              <div className="absolute inset-0 bg-primary/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent translate-x-[-100%] group-hover/footer:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </div>

            <div className="flex flex-col gap-1 px-1">
              {/* Tech Label */}
              <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] text-primary/30 uppercase group-hover/footer:text-primary/70 transition-colors duration-500">
                <span>Core.Sys</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/20 group-hover/footer:bg-emerald-500/80 group-hover/footer:shadow-[0_0_5px_rgba(16,185,129,0.5)] transition-all duration-500" />
              </div>

              {/* Signature Block */}
              <div className="flex flex-col text-[10px] font-mono text-muted-foreground/40 group-hover/footer:text-primary/60 transition-colors duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-2 bg-primary/20 group-hover/footer:bg-primary/80 transition-all duration-500" />
                  <span className="tracking-widest hover:text-primary transition-colors">BY STEVEN.CHANG</span>
                </div>
                <div className="pl-2.5 opacity-50 text-[9px]">v1.1.0</div>
              </div>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
