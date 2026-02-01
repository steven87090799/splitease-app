'use client';

import { useState } from 'react';
import { Plus, Trash2, UserPlus, Lock, Unlock, UserCircle, CheckCircle2 } from 'lucide-react';
import type { Member } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { useCurrentUser } from '@/hooks/use-current-user';

// ============================================================================
// 型別定義
// ============================================================================

/**
 * MembersCard 元件的 Props
 * 
 * @interface MembersCardProps
 * @property {Member[]} members - 群組成員列表
 * @property {(name: string) => void} onAddMember - 新增成員的回呼函式
 * @property {(id: string) => void} onRemoveMember - 移除成員的回呼函式
 * @property {boolean} isLocked - 成員列表是否鎖定（鎖定時無法編輯）
 * @property {() => void} onToggleLock - 切換鎖定狀態的回呼函式
 * @property {() => void} onTriggerDelete - 觸發刪除群組對話框的回呼函式
 */
interface MembersCardProps {
  members: Member[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  onTriggerDelete: () => void;
}

// ============================================================================
// MembersCard 元件
// ============================================================================

/**
 * 成員管理卡片元件
 * 
 * @description 顯示群組成員列表，並提供新增、移除成員和設定「我是誰」的功能。
 *              支援鎖定/解鎖狀態，鎖定時無法編輯成員。
 * 
 * @param {MembersCardProps} props - 元件屬性
 * @returns {JSX.Element} 成員管理卡片 UI
 * 
 * @usage 由 GroupPage 的 Dialog 或直接嵌入頁面中使用
 * 
 * @example
 * <MembersCard
 *   members={group.members}
 *   onAddMember={handleAddMember}
 *   onRemoveMember={handleRemoveMember}
 *   isLocked={isMembersLocked}
 *   onToggleLock={toggleMembersLock}
 *   onTriggerDelete={handleTriggerDelete}
 * />
 */
export function MembersCard({ members, onAddMember, onRemoveMember, isLocked, onToggleLock, onTriggerDelete }: MembersCardProps) {
  // ========== 本地狀態 ==========
  /** 新成員名稱輸入值 */
  const [newMemberName, setNewMemberName] = useState('');

  /** 當前使用者 Context，用於識別和設定「我是誰」 */
  const { isCurrentUser, setCurrentUser } = useCurrentUser();

  // ========== 事件處理函式 ==========
  /**
   * 處理新增成員按鈕點擊
   * 
   * @description 呼叫 onAddMember 並清空輸入框
   * @returns {void}
   */
  const handleAddClick = () => {
    if (isLocked) return;
    onAddMember(newMemberName);
    setNewMemberName('');
  };

  /**
   * 處理 Enter 鍵按下
   * 
   * @description 當使用者在輸入框按下 Enter 時新增成員
   * @param {React.KeyboardEvent<HTMLInputElement>} e - 鍵盤事件
   * @returns {void}
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddClick();
    }
  };

  // ========== 渲染 ==========
  return (
    <Card>
      <TooltipProvider>
        {/* 卡片標題區：顯示標題、描述和鎖定按鈕 */}
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>群組成員</CardTitle>
              <CardDescription>{isLocked ? '成員已鎖定。' : '新增、移除或設定您的身份。'}</CardDescription>
            </div>
            {/* 鎖定/解鎖按鈕 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleLock} aria-label={isLocked ? '解鎖成員列表' : '鎖定成員列表'} className={!isLocked ? 'animate-pulse-strong' : ''}>
                  {isLocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isLocked ? '點擊以解鎖並編輯成員' : '點擊以鎖定成員並開始記帳'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        {/* 卡片內容區 */}
        <CardContent>
          {/* 未選擇身份時的提示 */}
          {!isCurrentUser(members.find(m => isCurrentUser(m.id))?.id || '') && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3 animate-pulse">
              <UserCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-primary font-medium">
                請點擊您名字旁的 <UserCircle className="inline-block h-4 w-4 mx-1" /> 按鈕，確認您的身份。
              </div>
            </div>
          )}

          {/* 新增成員輸入區 */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="新成員姓名"
              aria-label="新成員姓名"
              disabled={isLocked}
            />
            <Button onClick={handleAddClick} aria-label="新增新成員" disabled={isLocked || !newMemberName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 成員列表 */}
          <div className="space-y-2">
            {members.length > 0 ? (
              members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 group"
                >
                  {/* 成員資訊：頭像、名稱、「這是我」徽章 */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary-foreground font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                    {isCurrentUser(member.id) && (
                      <Badge variant="outline" className="text-primary border-primary h-6">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        這是我
                      </Badge>
                    )}
                  </div>

                  {/* 操作按鈕：設定為我、刪除 */}
                  <div className="flex items-center">
                    {/* 設定為「我」按鈕（非當前使用者且未鎖定時顯示） */}
                    {!isLocked && !isCurrentUser(member.id) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${!isCurrentUser(members.find(m => isCurrentUser(m.id))?.id || '') ? 'text-primary animate-bounce' : 'text-muted-foreground'}`}
                            aria-label={`設定 ${member.name} 為我`}
                            onClick={() => setCurrentUser(member)}
                          >
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>設定為「我」</p></TooltipContent>
                      </Tooltip>
                    )}

                    {/* 刪除成員按鈕（僅解鎖時顯示） */}
                    {!isLocked && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`移除 ${member.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>確定要移除 {member.name} 嗎？</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作無法復原。如果此成員已參與任何費用，將無法移除。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => onRemoveMember(member.id)}
                            >
                              確定移除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))
            ) : (
              /* 無成員時的空狀態提示 */
              <div className="text-center text-muted-foreground py-4">
                <UserPlus className="mx-auto h-8 w-8 mb-2" />
                <p>請先新增成員。</p>
              </div>
            )}
          </div>
        </CardContent>

        <Separator />

        {/* 卡片底部：刪除群組按鈕 */}
        <CardFooter className="pt-6">
          <Button variant="destructive" className="w-full" onClick={onTriggerDelete}>
            刪除群組
          </Button>
        </CardFooter>
      </TooltipProvider>
    </Card>
  );
}
