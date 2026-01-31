
import { describe, it, expect } from 'vitest';
import { calculateBalances, calculateSettlements } from '@/lib/utils';
import type { Member, Expense } from '@/lib/types';

describe('數學證明驗證 - Mathematical Proof', () => {
    it('模擬結算：執行所有建議還款後，所有人餘額應精確歸零', () => {
        // 1. 隨機生成複雜場景
        const memberCount = 20;
        const members: Member[] = Array.from({ length: memberCount }, (_, i) => ({
            id: `m${i}`,
            name: `Member_${i}`, // 使用獨特名稱方便查找
        }));

        const expenses: Expense[] = Array.from({ length: 100 }, (_, i) => {
            const payerId = members[Math.floor(Math.random() * memberCount)].id;
            const amount = Math.floor(Math.random() * 500) + 10;
            return {
                id: `exp${i}`,
                description: `Random ${i}`,
                totalAmount: amount,
                paidBy: [{ memberId: payerId, amount }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            };
        });

        // 2. 計算餘額與債務
        const balances = calculateBalances(expenses);
        const debts = calculateSettlements(balances, members);

        // 3. 模擬還款過程
        // 複製一份餘額表來進行模擬
        const simulatedBalances = new Map(balances);

        // 確保所有成員都在 Map 中 (避免 undefined)
        members.forEach(m => {
            if (!simulatedBalances.has(m.id)) simulatedBalances.set(m.id, 0);
        });

        debts.forEach(debt => {
            // 找出 ID (因為 debt 物件只給了 Name)
            const fromMember = members.find(m => m.name === debt.from);
            const toMember = members.find(m => m.name === debt.to);

            if (!fromMember || !toMember) throw new Error('找不到成員 ID');

            const fromId = fromMember.id;
            const toId = toMember.id;

            // 執行轉帳：
            // 付款人(From) 餘額增加 (原本是負的，付錢後變從 0 靠近)
            simulatedBalances.set(fromId, (simulatedBalances.get(fromId) || 0) + debt.amount);

            // 收款人(To) 餘額減少 (原本是正的，收錢後應收減少)
            simulatedBalances.set(toId, (simulatedBalances.get(toId) || 0) - debt.amount);
        });

        // 4. 驗證：所有人的餘額現在都應該是 0
        simulatedBalances.forEach((balance, memberId) => {
            // 允許極小浮點數誤差
            expect(balance).toBeCloseTo(0, 4);
        });

        console.log(`模擬驗證完成：${debts.length} 筆交易成功將 ${memberCount} 人帳務歸零`);
    });
});
