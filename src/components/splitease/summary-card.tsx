'use client';

import type { Expense, Member } from '@/lib/types';
import { formatCurrency, calculateSplitShares } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';



interface SummaryCardProps {
  expenses: Expense[];
  members: Member[];
}

export function SummaryCard({ expenses, members }: SummaryCardProps) {
  // Calculate total consumed (share) per member
  const data = members.map(member => {
    const totalConsumed = expenses.reduce((sum, expense) => {
      const shares = calculateSplitShares(expense);
      const myShare = shares.find(s => s.memberId === member.id);
      return sum + (myShare ? myShare.share : 0);
    }, 0);
    return {
      name: member.name,
      amount: totalConsumed,
    };
  }).sort((a, b) => b.amount - a.amount);

  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>費用統計</CardTitle>
          <CardDescription>各成員的墊付金額統計。</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">尚無費用記錄。</p>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  width={60}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.amount === maxAmount && maxAmount > 0 ? '#ef4444' : 'hsl(var(--primary))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>

    </Card>
  );
}
