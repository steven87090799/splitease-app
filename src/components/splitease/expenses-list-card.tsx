import type { Expense, Member, SplitMethod } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { List } from 'lucide-react';
import { useState } from 'react';

interface ExpensesListCardProps {
  expenses: Expense[];
  members: Member[];
}

const splitMethodText: Record<SplitMethod, string> = {
  equally: '均分',
  amount: '指定金額',
  percentage: '按百分比',
  shares: '按份額',
};

const ExpandableText = ({ text, suffix }: { text: string; suffix?: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <span
      className={`cursor-pointer transition-all block text-left font-semibold ${isExpanded ? 'whitespace-normal break-all' : 'truncate'}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      title={text}
    >
      {text}
      {suffix}
    </span>
  );
};

export function ExpensesListCard({ expenses, members }: ExpensesListCardProps) {
  const getMemberName = (id: string) =>
    members.find(m => m.id === id)?.name || '未知';

  return (
    <Card>
      <CardHeader>
        <CardTitle>費用歷史</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
            <List className="w-12 h-12 mb-4" />
            <p>尚無費用記錄。</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {expenses.map(expense => (
              <AccordionItem value={expense.id} key={expense.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start w-full pr-4 gap-3">
                    <div className="flex flex-col text-left min-w-0">
                      <ExpandableText text={expense.description} />
                      <span className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('zh-TW')}
                        {expense.createdBy && (
                          <span className="ml-2 text-xs">
                            (由 {getMemberName(expense.createdBy)} 新增)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-headline font-semibold text-lg shrink-0">
                      {formatCurrency(expense.totalAmount)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>付款人：</strong>{' '}
                      {expense.paidBy
                        .map(
                          p =>
                            `${getMemberName(p.memberId)} (${formatCurrency(
                              p.amount
                            )})`
                        )
                        .join(', ')}
                    </p>
                    <div className='flex items-center gap-2'>
                      <strong>分攤方式：</strong> <Badge variant="secondary">{splitMethodText[expense.splitMethod]}</Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
