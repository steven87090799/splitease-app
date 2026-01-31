'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, Scale, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

const currencyMap: Record<string, string> = {
    'TWD': '新台幣',
    'USD': '美金',
    'JPY': '日圓',
    'EUR': '歐元',
    'CNY': '人民幣',
    'HKD': '港幣',
    'GBP': '英鎊',
    'AUD': '澳幣',
    'CAD': '加拿大幣',
    'SGD': '新加坡幣',
    'CHF': '瑞士法郎',
    'SEK': '瑞典克朗',
    'NOK': '挪威克朗',
    'DKK': '丹麥克朗',
    'KRW': '韓元',
    'THB': '泰銖',
    'MYR': '馬來西亞令吉',
};

export function CurrencyConverterPopover() {
    const [amount, setAmount] = useState<number | undefined>(1000);
    const [fromCurrency, setFromCurrency] = useState('TWD');
    const [toCurrency, setToCurrency] = useState('JPY');
    const [rates, setRates] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                setError(null);
                setIsLoading(true);
                const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.min.json`);
                if (!response.ok) {
                    throw new Error('無法獲取最新匯率');
                }
                const data = await response.json();

                const ratesFromApi = data.eur;
                ratesFromApi['eur'] = 1;

                const supportedAndAvailable = Object.keys(currencyMap).filter(c => ratesFromApi[c.toLowerCase()]);
                setAvailableCurrencies(supportedAndAvailable);

                if (!supportedAndAvailable.includes(fromCurrency)) setFromCurrency('TWD');
                if (!supportedAndAvailable.includes(toCurrency)) setToCurrency('JPY');

                setRates(ratesFromApi);

            } catch (e: any) {
                setError('無法載入匯率');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rateBetweenSelected = useMemo(() => {
        if (isLoading || !rates[fromCurrency.toLowerCase()] || !rates[toCurrency.toLowerCase()]) return null;
        const rateFrom = rates[fromCurrency.toLowerCase()];
        const rateTo = rates[toCurrency.toLowerCase()];
        return rateTo / rateFrom;
    }, [fromCurrency, toCurrency, rates, isLoading]);

    const convertedAmount = useMemo(() => {
        if (amount === undefined || !rateBetweenSelected) return undefined;
        return amount * rateBetweenSelected;
    }, [amount, rateBetweenSelected]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setAmount(convertedAmount ? parseFloat(convertedAmount.toFixed(4)) : undefined);
    };

    const displayTrigger = useMemo(() => {
        if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
        if (error) return <AlertTriangle className="h-4 w-4 text-destructive" />;

        if (!rateBetweenSelected) return <Scale className="h-4 w-4" />;

        let base = fromCurrency;
        let quote = toCurrency;
        let rate = rateBetweenSelected;

        // Smart display: always show >= 1 for base if possible for readability
        if (rate < 1 && fromCurrency === 'TWD') {
            // e.g. TWD -> USD is 0.03, show USD -> TWD rate instead if preferred? 
            // Or just keep as is. The user asked for "Time Left, Rate Right".
            // Let's stick to a simple format: "TWD/JPY ≈ 4.5"
        }

        if (fromCurrency === 'TWD' && toCurrency !== 'TWD') {
            // Show 1 Foreign = X TWD often makes more sense for Taiwanese users, 
            // BUT usually converters show 1 Base = X Quote.
            // Let's stick to 1 Base = X Quote for consistency with the modal.
        }

        return (
            <span className="text-xs font-mono font-medium">
                1 {fromCurrency} ≈ {rate.toFixed(2)} {toCurrency}
            </span>
        );
    }, [isLoading, error, rateBetweenSelected, fromCurrency, toCurrency]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 md:h-9 px-2 gap-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                    <Scale className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{displayTrigger}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="end">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none mb-2 flex items-center gap-2">
                        <Scale className="h-4 w-4" /> 匯率換算
                    </h4>

                    {error ? (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={amount ?? ''}
                                        onChange={e => setAmount(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                        className="h-8"
                                        placeholder="金額"
                                    />
                                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                                        <SelectTrigger className="h-8 w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableCurrencies.map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-center">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleSwap}>
                                        <ArrowRightLeft className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-8 rounded-md border bg-muted/50 px-3 py-1 text-sm flex items-center font-medium">
                                        {convertedAmount?.toFixed(2) ?? '...'}
                                    </div>
                                    <Select value={toCurrency} onValueChange={setToCurrency}>
                                        <SelectTrigger className="h-8 w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableCurrencies.map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="text-xs text-center text-muted-foreground pt-2">
                                1 {fromCurrency} ≈ {rateBetweenSelected?.toFixed(4)} {toCurrency}
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
