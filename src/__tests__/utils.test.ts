/**
 * ============================================================================
 * 工具函式單元測試
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from '@/lib/utils';

// ============================================================================
// cn() 測試
// ============================================================================

describe('cn - CSS 類別合併', () => {
    it('應該合併多個類別', () => {
        expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
    });

    it('應該處理條件類別', () => {
        expect(cn('base', true && 'active')).toBe('base active');
        expect(cn('base', false && 'active')).toBe('base');
    });

    it('應該處理衝突的 Tailwind 類別（後者覆蓋前者）', () => {
        // tailwind-merge 會移除衝突的類別
        expect(cn('p-2', 'p-4')).toBe('p-4');
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('應該處理物件格式', () => {
        expect(cn({ 'text-white': true, 'text-black': false })).toBe('text-white');
    });

    it('應該處理陣列格式', () => {
        expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
    });

    it('應該忽略 undefined 和 null', () => {
        expect(cn('base', undefined, null, 'active')).toBe('base active');
    });
});

// ============================================================================
// formatCurrency() 測試
// ============================================================================

describe('formatCurrency - 貨幣格式化', () => {
    it('應該格式化正數金額', () => {
        expect(formatCurrency(1234)).toBe('$1,234');
    });

    it('應該處理零', () => {
        expect(formatCurrency(0)).toBe('$0');
    });

    it('應該處理負數', () => {
        expect(formatCurrency(-500)).toBe('-$500');
    });

    it('應該四捨五入小數（無小數位）', () => {
        expect(formatCurrency(1234.4)).toBe('$1,234');
        expect(formatCurrency(1234.5)).toBe('$1,235');
        expect(formatCurrency(1234.6)).toBe('$1,235');
    });

    it('應該處理大數字', () => {
        expect(formatCurrency(1000000)).toBe('$1,000,000');
    });

    it('應該處理小數字', () => {
        expect(formatCurrency(0.4)).toBe('$0');
        expect(formatCurrency(0.5)).toBe('$1');
    });
});
