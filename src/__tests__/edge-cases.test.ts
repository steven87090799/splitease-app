/**
 * ============================================================================
 * 嚴謹邊界測試 - Edge Cases & Stress Tests
 * ============================================================================
 * 
 * 測試金錢計算精度、極端輸入、效能和邊界情況
 */

import { describe, it, expect } from 'vitest';
import type { Member, Expense, Debt, SplitMethod } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

import { calculateBalances, calculateSettlements } from '@/lib/utils';

// ============================================================================
// 金錢精度測試
// ============================================================================

describe('金錢精度測試 - Financial Precision', () => {
    describe('浮點數誤差處理', () => {
        it('0.1 + 0.2 問題（經典浮點誤差）', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
                { id: 'c', name: 'C' },
            ];
            // 0.3 三人均分應該每人 0.1
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '小額測試',
                totalAmount: 0.3,
                paidBy: [{ memberId: 'a', amount: 0.3 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);
            const sum = Array.from(balances.values()).reduce((a, b) => a + b, 0);

            // 餘額總和應該趨近 0（允許極小誤差）
            expect(Math.abs(sum)).toBeLessThan(0.0001);
        });

        it('無法整除的金額（例如 100/3）', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
                { id: 'c', name: 'C' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '100 元三人分',
                totalAmount: 100,
                paidBy: [{ memberId: 'a', amount: 100 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);

            // 每人應付 33.333...
            expect(balances.get('a')).toBeCloseTo(66.6667, 2);
            expect(balances.get('b')).toBeCloseTo(-33.3333, 2);
            expect(balances.get('c')).toBeCloseTo(-33.3333, 2);

            // 總和仍應趨近 0
            const sum = Array.from(balances.values()).reduce((a, b) => a + b, 0);
            expect(Math.abs(sum)).toBeLessThan(0.0001);
        });

        it('極小金額分帳（0.01 元）', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '一分錢',
                totalAmount: 0.01,
                paidBy: [{ memberId: 'a', amount: 0.01 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);

            expect(balances.get('a')).toBeCloseTo(0.005, 4);
            expect(balances.get('b')).toBeCloseTo(-0.005, 4);
        });

        it('極大金額（百萬級）', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '大額測試',
                totalAmount: 1000000.99,
                paidBy: [{ memberId: 'a', amount: 1000000.99 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);

            expect(balances.get('a')).toBeCloseTo(500000.495, 2);
            expect(balances.get('b')).toBeCloseTo(-500000.495, 2);
        });

        it('百分比不等於 100% 的情況', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
                { id: 'c', name: 'C' },
            ];
            // 33.33 + 33.33 + 33.33 = 99.99，不是 100
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '百分比測試',
                totalAmount: 300,
                paidBy: [{ memberId: 'a', amount: 300 }],
                splitMethod: 'percentage',
                splitDetails: [
                    { memberId: 'a', value: 33.33, selected: true },
                    { memberId: 'b', value: 33.33, selected: true },
                    { memberId: 'c', value: 33.33, selected: true },
                ],
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);

            // 計算應該仍然正確執行
            const aBalance = balances.get('a') || 0;
            const bBalance = balances.get('b') || 0;
            const cBalance = balances.get('c') || 0;

            // A 付 300，但只承擔 33.33% = 99.99
            expect(aBalance).toBeCloseTo(300 - 99.99, 2);
            expect(bBalance).toBeCloseTo(-99.99, 2);
            expect(cBalance).toBeCloseTo(-99.99, 2);
        });
    });

    describe('貨幣格式化邊界', () => {
        it('負數格式化', () => {
            expect(formatCurrency(-1234)).toBe('-$1,234');
        });

        it('極大數字格式化', () => {
            expect(formatCurrency(999999999)).toBe('$999,999,999');
        });

        it('零格式化', () => {
            expect(formatCurrency(0)).toBe('$0');
        });

        it('小數四捨五入', () => {
            expect(formatCurrency(10.4)).toBe('$10');
            expect(formatCurrency(10.5)).toBe('$11');
            expect(formatCurrency(10.6)).toBe('$11');
        });
    });
});

// ============================================================================
// 極端輸入測試
// ============================================================================

describe('極端輸入測試 - Extreme Inputs', () => {
    describe('名稱長度', () => {
        it('處理超長名稱（100 字元）', () => {
            const longName = 'A'.repeat(100);
            const members: Member[] = [
                { id: 'a', name: longName },
                { id: 'b', name: 'Bob' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '測試',
                totalAmount: 100,
                paidBy: [{ memberId: 'a', amount: 100 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);
            const debts = calculateSettlements(balances, members);

            // 計算應該正常運作
            expect(balances.get('a')).toBeCloseTo(50, 2);
            expect(debts[0].from).toBe('Bob');
            expect(debts[0].to).toBe(longName);
        });

        it('處理空名稱', () => {
            const members: Member[] = [
                { id: 'a', name: '' },
                { id: 'b', name: 'Bob' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '測試',
                totalAmount: 100,
                paidBy: [{ memberId: 'a', amount: 100 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            // 空名稱不應該導致錯誤
            const balances = calculateBalances(expenses);
            expect(balances.size).toBe(2);
        });

        it('處理 Unicode 名稱（中文、emoji）', () => {
            const members: Member[] = [
                { id: 'a', name: '張三豐' },
                { id: 'b', name: '🎉派對王👑' },
                { id: 'c', name: '日本語テスト' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '國際聚會',
                totalAmount: 300,
                paidBy: [{ memberId: 'a', amount: 300 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);
            const debts = calculateSettlements(balances, members);

            // 應該正常處理 Unicode
            expect(debts.some(d => d.to === '張三豐')).toBe(true);
            expect(debts.some(d => d.from === '🎉派對王👑')).toBe(true);
        });

        it('處理特殊字元', () => {
            const members: Member[] = [
                { id: 'a', name: 'O\'Brien' },
                { id: 'b', name: 'Test<script>alert(1)</script>' },
                { id: 'c', name: '  前後空格  ' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '特殊字元測試',
                totalAmount: 300,
                paidBy: [{ memberId: 'a', amount: 300 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            // 不應該拋出錯誤
            expect(() => {
                const balances = calculateBalances(expenses);
                calculateSettlements(balances, members);
            }).not.toThrow();
        });
    });

    describe('費用描述', () => {
        it('處理超長描述（500 字元）', () => {
            const longDesc = '這是一個非常長的描述'.repeat(50);
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: longDesc,
                totalAmount: 100,
                paidBy: [{ memberId: 'a', amount: 100 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            // 不應該影響計算
            const balances = calculateBalances(expenses);
            expect(balances.get('a')).toBeCloseTo(50, 2);
        });

        it('處理空描述', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '',
                totalAmount: 100,
                paidBy: [{ memberId: 'a', amount: 100 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);
            expect(balances.get('a')).toBeCloseTo(50, 2);
        });
    });

    describe('金額邊界', () => {
        it('金額為 0', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '零元',
                totalAmount: 0,
                paidBy: [{ memberId: 'a', amount: 0 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);
            expect(balances.get('a')).toBe(0);
            expect(balances.get('b')).toBe(0);
        });

        it('負數金額（應該視同正常處理）', () => {
            const members: Member[] = [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
            ];
            const expenses: Expense[] = [{
                id: 'exp1',
                description: '退款',
                totalAmount: -100,
                paidBy: [{ memberId: 'a', amount: -100 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            // 負數會被當作正常數字處理（可用於退款情境）
            const balances = calculateBalances(expenses);
            expect(balances.get('a')).toBeCloseTo(-50, 2);
            expect(balances.get('b')).toBeCloseTo(50, 2);
        });
    });
});

// ============================================================================
// 嚴格壓力測試
// ============================================================================

describe('嚴格壓力測試 - Heavy Stress Tests', () => {
    it('100 成員 + 500 筆費用', () => {
        const memberCount = 100;
        const expenseCount = 500;

        const members: Member[] = Array.from({ length: memberCount }, (_, i) => ({
            id: `m${i}`,
            name: `Member ${i}`,
        }));

        const expenses: Expense[] = Array.from({ length: expenseCount }, (_, i) => ({
            id: `exp${i}`,
            description: `費用 ${i}`,
            totalAmount: Math.floor(Math.random() * 1000) + 1,
            paidBy: [{ memberId: members[i % memberCount].id, amount: Math.floor(Math.random() * 1000) + 1 }],
            splitMethod: 'equally',
            splitDetails: members.slice(0, 10).map(m => ({ memberId: m.id, value: 1, selected: true })),
            date: new Date().toISOString(),
        }));

        const startTime = performance.now();
        const balances = calculateBalances(expenses);
        const debts = calculateSettlements(balances, members);
        const endTime = performance.now();

        console.log(`100 成員 + 500 費用: ${(endTime - startTime).toFixed(2)}ms`);

        expect(endTime - startTime).toBeLessThan(500); // 應該在 500ms 內完成
        expect(balances.size).toBe(memberCount);
    });

    it('極端情況：所有人互相欠錢', () => {
        const memberCount = 20;
        const members: Member[] = Array.from({ length: memberCount }, (_, i) => ({
            id: `m${i}`,
            name: `Member ${i}`,
        }));

        // 每個人都付一筆錢，其他人分攤
        const expenses: Expense[] = members.map((payer, i) => ({
            id: `exp${i}`,
            description: `${payer.name} 付的`,
            totalAmount: 100,
            paidBy: [{ memberId: payer.id, amount: 100 }],
            splitMethod: 'equally',
            splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
            date: new Date().toISOString(),
        }));

        const startTime = performance.now();
        const balances = calculateBalances(expenses);
        const debts = calculateSettlements(balances, members);
        const endTime = performance.now();

        console.log(`20 人互欠: ${(endTime - startTime).toFixed(2)}ms, 交易數: ${debts.length}`);

        // 如果每人出 100 元均分給 20 人，每人淨收支應該為 0
        const sum = Array.from(balances.values()).reduce((a, b) => a + b, 0);
        expect(Math.abs(sum)).toBeLessThan(0.01);

        // 由於大家都均分，最終應該沒有債務
        expect(debts.length).toBe(0);
    });

    it('最差情況：鏈式債務 A→B→C→...→Z', () => {
        const count = 26;
        const members: Member[] = Array.from({ length: count }, (_, i) => ({
            id: String.fromCharCode(65 + i), // A, B, C, ...
            name: String.fromCharCode(65 + i),
        }));

        // 每人付給下一個人 100 元
        const expenses: Expense[] = members.slice(0, -1).map((payer, i) => ({
            id: `exp${i}`,
            description: `${payer.name} → ${members[i + 1].name}`,
            totalAmount: 100,
            paidBy: [{ memberId: payer.id, amount: 100 }],
            splitMethod: 'amount',
            splitDetails: [{ memberId: members[i + 1].id, value: 100, selected: true }],
            date: new Date().toISOString(),
        }));

        const startTime = performance.now();
        const balances = calculateBalances(expenses);
        const debts = calculateSettlements(balances, members);
        const endTime = performance.now();

        console.log(`鏈式債務: ${(endTime - startTime).toFixed(2)}ms, 交易數: ${debts.length}`);

        // A 被欠 100，Z 欠 100，中間人都平衡
        expect(balances.get('A')).toBeCloseTo(100, 2);
        expect(balances.get('Z')).toBeCloseTo(-100, 2);

        // 最簡化應該只需要 1 筆交易：Z → A
        expect(debts.length).toBe(1);
        expect(debts[0].from).toBe('Z');
        expect(debts[0].to).toBe('A');
    });

    it('連續快速操作模擬（1000 次計算）', () => {
        const members: Member[] = [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
            { id: 'c', name: 'C' },
        ];

        const startTime = performance.now();

        for (let i = 0; i < 1000; i++) {
            const expenses: Expense[] = [{
                id: `exp${i}`,
                description: `快速測試 ${i}`,
                totalAmount: Math.random() * 1000,
                paidBy: [{ memberId: 'a', amount: Math.random() * 1000 }],
                splitMethod: 'equally',
                splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
                date: new Date().toISOString(),
            }];

            const balances = calculateBalances(expenses);
            calculateSettlements(balances, members);
        }

        const endTime = performance.now();
        console.log(`1000 次計算: ${(endTime - startTime).toFixed(2)}ms`);

        expect(endTime - startTime).toBeLessThan(1000); // 1 秒內完成 1000 次
    });

    it('記憶體壓力：大量成員的債務計算', () => {
        const memberCount = 200;
        const members: Member[] = Array.from({ length: memberCount }, (_, i) => ({
            id: `m${i}`,
            name: `Member ${i}`,
        }));

        // 創造複雜的債務關係
        const balances = new Map<string, number>();
        for (let i = 0; i < memberCount; i++) {
            balances.set(`m${i}`, (i % 2 === 0) ? i * 10 : -i * 10);
        }

        const startTime = performance.now();
        const debts = calculateSettlements(balances, members);
        const endTime = performance.now();

        console.log(`200 人債務計算: ${(endTime - startTime).toFixed(2)}ms, 交易數: ${debts.length}`);

        expect(endTime - startTime).toBeLessThan(200);

        // 驗證所有債務金額合理
        debts.forEach(debt => {
            expect(debt.amount).toBeGreaterThan(0);
            expect(debt.from).toBeTruthy();
            expect(debt.to).toBeTruthy();
        });
    });
});

// ============================================================================
// 資料一致性測試
// ============================================================================

describe('資料一致性測試 - Data Integrity', () => {
    it('餘額守恆：任何操作組合後總和應為 0', () => {
        const members: Member[] = [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
            { id: 'c', name: 'C' },
            { id: 'd', name: 'D' },
        ];

        // 隨機生成 50 筆不同類型的費用
        const splitMethods: SplitMethod[] = ['equally', 'amount', 'percentage', 'shares'];
        const expenses: Expense[] = Array.from({ length: 50 }, (_, i) => {
            const method = splitMethods[i % 4];
            const payerId = members[i % 4].id;
            const amount = Math.floor(Math.random() * 1000) + 1;

            return {
                id: `exp${i}`,
                description: `測試 ${i}`,
                totalAmount: amount,
                paidBy: [{ memberId: payerId, amount }],
                splitMethod: method,
                splitDetails: members.map((m, j) => ({
                    memberId: m.id,
                    value: method === 'percentage' ? 25 : (method === 'amount' ? amount / 4 : 1),
                    selected: true,
                })),
                date: new Date().toISOString(),
            };
        });

        const balances = calculateBalances(expenses);
        const sum = Array.from(balances.values()).reduce((a, b) => a + b, 0);

        // 餘額總和必須趨近 0
        expect(Math.abs(sum)).toBeLessThan(0.01);
    });

    it('多人代墊的正確處理', () => {
        const members: Member[] = [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
            { id: 'c', name: 'C' },
        ];

        // A 墊 200，B 墊 100，總計 300 三人均分
        const expenses: Expense[] = [{
            id: 'exp1',
            description: '多人代墊',
            totalAmount: 300,
            paidBy: [
                { memberId: 'a', amount: 200 },
                { memberId: 'b', amount: 100 },
            ],
            splitMethod: 'equally',
            splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true })),
            date: new Date().toISOString(),
        }];

        const balances = calculateBalances(expenses);

        // A: 200 - 100 = 100
        expect(balances.get('a')).toBeCloseTo(100, 2);
        // B: 100 - 100 = 0
        expect(balances.get('b')).toBeCloseTo(0, 2);
        // C: 0 - 100 = -100
        expect(balances.get('c')).toBeCloseTo(-100, 2);
    });

    it('部分成員不參與分攤', () => {
        const members: Member[] = [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
            { id: 'c', name: 'C' },
        ];

        // A 付 200，只有 A 和 B 分攤
        const expenses: Expense[] = [{
            id: 'exp1',
            description: '部分分攤',
            totalAmount: 200,
            paidBy: [{ memberId: 'a', amount: 200 }],
            splitMethod: 'equally',
            splitDetails: [
                { memberId: 'a', value: 1, selected: true },
                { memberId: 'b', value: 1, selected: true },
                { memberId: 'c', value: 1, selected: false }, // C 不參與
            ],
            date: new Date().toISOString(),
        }];

        const balances = calculateBalances(expenses);

        // A: 200 - 100 = 100
        expect(balances.get('a')).toBeCloseTo(100, 2);
        // B: 0 - 100 = -100
        expect(balances.get('b')).toBeCloseTo(-100, 2);
        // C: 0 - 0 = 0
        expect(balances.get('c') || 0).toBeCloseTo(0, 2);
    });
});
