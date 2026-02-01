'use client';

import type { Expense, Member, Debt } from '@/lib/types';
import { formatCurrency, calculateSplitShares } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Calculator, ArrowRight, PartyPopper } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useState } from 'react';

interface CalculationDetailsCardProps {
  expenses: Expense[];
  members: Member[];
  balances: Map<string, number>;
  debts: Debt[];
  onSettleUp: () => void;
}

const ExpandableText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <span
      className={`cursor-pointer transition-all block text-left ${isExpanded ? 'whitespace-normal break-all' : 'truncate'}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      title={text} // Fallback for hover
    >
      {text}
    </span>
  );
};

export function CalculationDetailsCard({ expenses, members, balances, debts, onSettleUp }: CalculationDetailsCardProps) {
  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || '未知';

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

  if (expenses.length === 0) {
    return null; // Don't render the card if there are no expenses
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          計算明細
        </CardTitle>
        <CardDescription>所有費用的詳細拆分過程，確保帳目準確無誤。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className='text-lg font-semibold mb-2'>費用拆分</h3>
          <p className='text-sm text-muted-foreground mb-4'>共 {expenses.length} 筆費用，總支出 {formatCurrency(totalSpending)}</p>
          <Accordion type="multiple" className="w-full space-y-2">
            {expenses.map((expense) => {
              const splitShares = calculateSplitShares(expense);
              return (
                <AccordionItem value={expense.id} key={expense.id} className="bg-secondary/30 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center w-full pr-4 gap-3">
                      <ExpandableText text={expense.description} />
                      <span className="font-semibold shrink-0">{formatCurrency(expense.totalAmount)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong className='text-muted-foreground'>付款人:</strong>
                        <ul className='list-disc pl-5 mt-1'>
                          {expense.paidBy.map(p => <li key={p.memberId}>{getMemberName(p.memberId)}: {formatCurrency(p.amount)}</li>)}
                        </ul>
                      </div>
                      <div>
                        <strong className='text-muted-foreground'>分攤給:</strong>
                        <ul className='list-disc pl-5 mt-1'>
                          {splitShares.map(s => <li key={s.memberId}>{getMemberName(s.memberId)}: {formatCurrency(s.share)}</li>)}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        <Separator />

        <div>
          <h3 className='text-lg font-semibold mb-2'>成員結餘</h3>
          <p className='text-sm text-muted-foreground mb-4'>這是每位成員在所有費用拆分後的最終應付或應收金額。</p>
          <ul className='space-y-1'>
            {Array.from(balances.entries()).map(([memberId, balance]) => {
              const member = members.find(m => m.id === memberId);
              if (!member) return null;

              const color = balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-muted-foreground';
              const label = balance > 0 ? '應收' : balance < 0 ? '應付' : '結清';

              return (
                <li key={member.id} className='flex justify-between items-center text-sm p-2 rounded-md bg-background'>
                  <span>{member.name}</span>
                  <div className='flex items-center gap-2'>
                    <Badge variant={balance === 0 ? "secondary" : "outline"} className={color}>{label} {formatCurrency(Math.abs(balance))}</Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <Separator />

        <div>
          <h3 className='text-lg font-semibold mb-2'>最簡交易</h3>
          <p className='text-sm text-muted-foreground mb-4'>為結清所有帳務，建議進行以下交易。</p>
          {debts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">無需交易！</p>
          ) : (
            <ul className="space-y-2">
              {debts.map((debt, i) => (
                <li key={i} className="flex items-center justify-center text-center text-sm p-3 rounded-md bg-background">
                  <span className="font-bold text-primary">{debt.from}</span>
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-primary">{debt.to}</span>
                  <span className="font-headline font-semibold text-base ml-4">{formatCurrency(debt.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {debts.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="pt-2 pb-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full transform hover:scale-105 transition-all duration-300"
                  >
                    結清款項
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確定要結清所有款項嗎？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作會將目前的費用記錄封存，並將所有餘額歸零。您之後可以在「結算歷史」中查看這次的紀錄。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onSettleUp}>確定結清</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}
