/**
 * ============================================================================
 * 計算邏輯單元測試
 * ============================================================================
 * 
 * 測試 group-page.tsx 中的餘額計算和債務計算邏輯
 * 這些是應用程式的核心業務邏輯
 */

import { describe, it, expect } from 'vitest';
import type { Member, Expense, Debt, SplitMethod } from '@/lib/types';

// ============================================================================
// 測試用的計算函式（從 group-page.tsx 提取的純函式版本）
// ============================================================================

/**
 * 計算餘額
 * @see group-page.tsx 中的 balances useMemo
 */
function calculateBalances(members: Member[], expenses: Expense[]): Map<string, number> {
    const userBalances = new Map<string, number>();

    members.forEach(m => userBalances.set(m.id, 0));

    expenses.forEach(expense => {
        // 付款者餘額增加
        expense.paidBy.forEach(payer => {
            userBalances.set(payer.memberId, (userBalances.get(payer.memberId) || 0) + payer.amount);
        });

        // 計算分攤
        let splitShares: { memberId: string, share: number }[] = [];
        const selectedSplitDetails = expense.splitDetails.filter(d => d.selected);

        switch (expense.splitMethod) {
            case 'equally':
                if (selectedSplitDetails.length > 0) {
                    const amountPerPerson = expense.totalAmount / selectedSplitDetails.length;
                    splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: amountPerPerson }));
                }
                break;
            case 'amount':
                splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: s.value }));
                break;
            case 'percentage':
                splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: expense.totalAmount * (s.value / 100) }));
                break;
            case 'shares':
                const totalShares = selectedSplitDetails.reduce((sum, s) => sum + s.value, 0);
                if (totalShares > 0) {
                    splitShares = selectedSplitDetails.map(s => ({ memberId: s.memberId, share: expense.totalAmount * (s.value / totalShares) }));
                }
                break;
        }

        // 分攤者餘額減少
        splitShares.forEach(split => {
            userBalances.set(split.memberId, (userBalances.get(split.memberId) || 0) - split.share);
        });
    });

    return userBalances;
}

/**
 * 計算最簡債務
 * @see group-page.tsx 中的 debts useMemo
 */
function calculateDebts(members: Member[], balances: Map<string, number>): Debt[] {
    const balancesCopy = new Map(balances);
    const debtors = Array.from(balancesCopy.entries())
        .filter(([, balance]) => balance < -0.01)
        .map(([id, balance]) => ({ id, balance: -balance }));
    const creditors = Array.from(balancesCopy.entries())
        .filter(([, balance]) => balance > 0.01)
        .map(([id, balance]) => ({ id, balance }));
    const settledDebts: Debt[] = [];

    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => a.balance - b.balance);

    while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        const amount = Math.min(debtor.balance, creditor.balance);

        if (amount > 0.01) {
            settledDebts.push({
                from: members.find(m => m.id === debtor.id)?.name || '未知',
                to: members.find(m => m.id === creditor.id)?.name || '未知',
                amount,
            });
        }

        debtor.balance -= amount;
        creditor.balance -= amount;

        if (debtor.balance < 0.01) debtors.shift();
        if (creditor.balance < 0.01) creditors.shift();
    }

    return settledDebts;
}

// ============================================================================
// 測試資料
// ============================================================================

const createMembers = (): Member[] => [
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' },
    { id: 'c', name: 'Charlie' },
];

const createExpense = (
    paidById: string,
    amount: number,
    splitMethod: SplitMethod,
    splitMemberIds: string[] = ['a', 'b', 'c'],
    splitValues?: number[]
): Expense => ({
    id: 'exp1',
    description: '測試費用',
    totalAmount: amount,
    paidBy: [{ memberId: paidById, amount }],
    splitMethod,
    splitDetails: splitMemberIds.map((id, i) => ({
        memberId: id,
        value: splitValues ? splitValues[i] : 1,
        selected: true,
    })),
    date: new Date().toISOString(),
});

// ============================================================================
// 餘額計算測試
// ============================================================================

describe('calculateBalances - 餘額計算', () => {
    describe('均分 (equally)', () => {
        it('三人均分 300 元，付款者餘額應為 +200', () => {
            const members = createMembers();
            const expenses = [createExpense('a', 300, 'equally')];
            const balances = calculateBalances(members, expenses);

            // Alice 墊了 300，但只需負擔 100，所以餘額 = 300 - 100 = 200
            expect(balances.get('a')).toBeCloseTo(200, 2);
            // Bob 和 Charlie 各需付 100
            expect(balances.get('b')).toBeCloseTo(-100, 2);
            expect(balances.get('c')).toBeCloseTo(-100, 2);
        });

        it('二人均分 100 元', () => {
            const members = createMembers();
            const expenses = [createExpense('a', 100, 'equally', ['a', 'b'])];
            const balances = calculateBalances(members, expenses);

            expect(balances.get('a')).toBeCloseTo(50, 2);
            expect(balances.get('b')).toBeCloseTo(-50, 2);
            expect(balances.get('c')).toBeCloseTo(0, 2);
        });
    });

    describe('按金額 (amount)', () => {
        it('指定金額分帳', () => {
            const members = createMembers();
            const expenses = [createExpense('a', 300, 'amount', ['a', 'b', 'c'], [100, 150, 50])];
            const balances = calculateBalances(members, expenses);

            // Alice 墊 300，負擔 100，餘額 = 200
            expect(balances.get('a')).toBeCloseTo(200, 2);
            expect(balances.get('b')).toBeCloseTo(-150, 2);
            expect(balances.get('c')).toBeCloseTo(-50, 2);
        });
    });

    describe('按百分比 (percentage)', () => {
        it('百分比分帳 (50/30/20)', () => {
            const members = createMembers();
            const expenses = [createExpense('a', 1000, 'percentage', ['a', 'b', 'c'], [50, 30, 20])];
            const balances = calculateBalances(members, expenses);

            // Alice: 1000 - 500 = 500
            expect(balances.get('a')).toBeCloseTo(500, 2);
            // Bob: 0 - 300 = -300
            expect(balances.get('b')).toBeCloseTo(-300, 2);
            // Charlie: 0 - 200 = -200
            expect(balances.get('c')).toBeCloseTo(-200, 2);
        });
    });

    describe('按份數 (shares)', () => {
        it('份數分帳 (2:1:1)', () => {
            const members = createMembers();
            const expenses = [createExpense('b', 400, 'shares', ['a', 'b', 'c'], [2, 1, 1])];
            const balances = calculateBalances(members, expenses);

            // Alice: 0 - 200 = -200 (2/4 of 400)
            expect(balances.get('a')).toBeCloseTo(-200, 2);
            // Bob: 400 - 100 = 300 (1/4 of 400)
            expect(balances.get('b')).toBeCloseTo(300, 2);
            // Charlie: 0 - 100 = -100 (1/4 of 400)
            expect(balances.get('c')).toBeCloseTo(-100, 2);
        });
    });

    describe('多筆費用', () => {
        it('兩筆費用的餘額累加', () => {
            const members = createMembers();
            const expense1 = createExpense('a', 300, 'equally');
            expense1.id = 'exp1';
            const expense2 = createExpense('b', 150, 'equally');
            expense2.id = 'exp2';

            const balances = calculateBalances(members, [expense1, expense2]);

            // Alice: (300 - 100) + (0 - 50) = 200 - 50 = 150
            expect(balances.get('a')).toBeCloseTo(150, 2);
            // Bob: (0 - 100) + (150 - 50) = -100 + 100 = 0
            expect(balances.get('b')).toBeCloseTo(0, 2);
            // Charlie: (0 - 100) + (0 - 50) = -150
            expect(balances.get('c')).toBeCloseTo(-150, 2);
        });
    });

    describe('邊界情況', () => {
        it('沒有費用時餘額全為 0', () => {
            const members = createMembers();
            const balances = calculateBalances(members, []);

            expect(balances.get('a')).toBe(0);
            expect(balances.get('b')).toBe(0);
            expect(balances.get('c')).toBe(0);
        });

        it('餘額總和應為 0（守恆定律）', () => {
            const members = createMembers();
            const expenses = [
                createExpense('a', 300, 'equally'),
                createExpense('b', 150, 'percentage', ['a', 'b'], [60, 40]),
            ];
            const balances = calculateBalances(members, expenses);

            const sum = Array.from(balances.values()).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(0, 2);
        });
    });
});

// ============================================================================
// 債務計算測試
// ============================================================================

describe('calculateDebts - 最簡交易計算', () => {
    it('單筆債務：一人欠一人', () => {
        const members = createMembers();
        const balances = new Map([
            ['a', 100],  // Alice 被欠 100
            ['b', -100], // Bob 欠 100
            ['c', 0],
        ]);

        const debts = calculateDebts(members, balances);

        expect(debts.length).toBe(1);
        expect(debts[0]).toEqual({ from: 'Bob', to: 'Alice', amount: 100 });
    });

    it('多筆債務：一人欠多人', () => {
        const members = createMembers();
        const balances = new Map([
            ['a', 100],
            ['b', 50],
            ['c', -150],
        ]);

        const debts = calculateDebts(members, balances);

        // Charlie 欠 150，需要付給 Bob 50 和 Alice 100
        expect(debts.length).toBe(2);
        const totalPaid = debts.reduce((sum, d) => sum + d.amount, 0);
        expect(totalPaid).toBeCloseTo(150, 2);
    });

    it('複雜情況：最簡化交易', () => {
        const members: Member[] = [
            { id: 'a', name: 'Alice' },
            { id: 'b', name: 'Bob' },
            { id: 'c', name: 'Charlie' },
            { id: 'd', name: 'David' },
        ];
        const balances = new Map([
            ['a', 100],
            ['b', -50],
            ['c', 50],
            ['d', -100],
        ]);

        const debts = calculateDebts(members, balances);

        // 最簡交易數量應該 <= min(債務人數, 債權人數)
        expect(debts.length).toBeLessThanOrEqual(2);

        // 驗證總交易金額正確
        const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0);
        expect(totalAmount).toBeCloseTo(150, 2);
    });

    it('全部平衡時無債務', () => {
        const members = createMembers();
        const balances = new Map([
            ['a', 0],
            ['b', 0],
            ['c', 0],
        ]);

        const debts = calculateDebts(members, balances);

        expect(debts.length).toBe(0);
    });

    it('忽略極小金額（< 0.01）', () => {
        const members = createMembers();
        const balances = new Map([
            ['a', 0.005],
            ['b', -0.005],
            ['c', 0],
        ]);

        const debts = calculateDebts(members, balances);

        expect(debts.length).toBe(0);
    });
});

// ============================================================================
// 壓力測試
// ============================================================================

describe('壓力測試', () => {
    it('應該能處理 50 個成員', () => {
        const members: Member[] = Array.from({ length: 50 }, (_, i) => ({
            id: `member${i}`,
            name: `Member ${i}`,
        }));

        const expenses: Expense[] = [{
            id: 'exp1',
            description: '大型聚餐',
            totalAmount: 5000,
            paidBy: [{ memberId: 'member0', amount: 5000 }],
            splitMethod: 'equally',
            splitDetails: members.map(m => ({
                memberId: m.id,
                value: 1,
                selected: true,
            })),
            date: new Date().toISOString(),
        }];

        const startTime = performance.now();
        const balances = calculateBalances(members, expenses);
        const debts = calculateDebts(members, balances);
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100); // 應該在 100ms 內完成
        expect(balances.size).toBe(50);
        expect(debts.length).toBeLessThanOrEqual(49); // 最多 49 筆交易
    });

    it('應該能處理 100 筆費用', () => {
        const members = createMembers();
        const expenses: Expense[] = Array.from({ length: 100 }, (_, i) => ({
            id: `exp${i}`,
            description: `費用 ${i}`,
            totalAmount: 100,
            paidBy: [{ memberId: members[i % 3].id, amount: 100 }],
            splitMethod: 'equally',
            splitDetails: members.map(m => ({
                memberId: m.id,
                value: 1,
                selected: true,
            })),
            date: new Date().toISOString(),
        }));

        const startTime = performance.now();
        const balances = calculateBalances(members, expenses);
        const debts = calculateDebts(members, balances);
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100); // 應該在 100ms 內完成

        // 驗證餘額守恆
        const sum = Array.from(balances.values()).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(0, 2);
    });
});
