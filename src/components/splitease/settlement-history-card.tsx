'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Member, Settlement, SplitMethod } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Archive } from 'lucide-react';

interface SettlementHistoryCardProps {
  settlements: Settlement[];
  members: Member[];
}

const splitMethodText: Record<SplitMethod, string> = {
  equally: '均分',
  amount: '指定金額',
  percentage: '按百分比',
  shares: '按份額',
};

export function SettlementHistoryCard({
  settlements,
  members,
}: SettlementHistoryCardProps) {
  const getMemberName = (id: string) =>
    members.find(m => m.id === id)?.name || '未知成員';

  return (
    <Card>
      <CardHeader>
        <CardTitle>結算歷史</CardTitle>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
            <Archive className="w-12 h-12 mb-4" />
            <p>尚無結算紀錄。</p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-2">
            {settlements.map(settlement => {
              const totalAmount = settlement.expenses.reduce(
                (sum, exp) => sum + exp.totalAmount,
                0
              );
              return (
                <AccordionItem
                  value={settlement.id}
                  key={settlement.id}
                  className="bg-secondary/30 rounded-lg px-4"
                >
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">
                          結算於{' '}
                          {new Date(settlement.date).toLocaleDateString('zh-TW')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          共 {settlement.expenses.length} 筆費用
                        </span>
                      </div>
                      <span className="font-headline font-semibold text-lg">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">費用明細</h4>
                        <ul className="space-y-2 text-sm pl-2 border-l-2 border-primary/50 ml-2">
                          {settlement.expenses.map(expense => (
                            <li key={expense.id} className="pl-2">
                              <div className="flex justify-between">
                                <span>{expense.description}</span>
                                <span>{formatCurrency(expense.totalAmount)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <p>
                                  付款人:{' '}
                                  {expense.paidBy
                                    .map(
                                      p =>
                                        `${getMemberName(
                                          p.memberId
                                        )} (${formatCurrency(p.amount)})`
                                    )
                                    .join(', ')}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                       <div>
                        <h4 className="font-semibold mb-2">最終交易</h4>
                         <ul className="space-y-1">
                            {settlement.debts.map((debt, i) => (
                              <li key={i} className="flex items-center justify-between text-sm p-2 rounded-md bg-background/50">
                                <span>
                                  <span className="font-bold">{debt.from}</span> 應付給{' '}
                                  <span className="font-bold">{debt.to}</span>
                                </span>
                                <span className="font-semibold">{formatCurrency(debt.amount)}</span>
                              </li>
                            ))}
                         </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
