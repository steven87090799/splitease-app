'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, Scale, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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


export function CurrencyConverterCard() {
  const [amount, setAmount] = useState<number | undefined>(1000);
  const [fromCurrency, setFromCurrency] = useState('TWD');
  const [toCurrency, setToCurrency] = useState('JPY');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setError(null);
        setIsLoading(true);
        // Using a new API that supports TWD. Fetching against EUR as a stable base.
        const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.min.json`);
        if (!response.ok) {
          throw new Error('無法獲取最新匯率，請稍後再試。');
        }
        const data = await response.json();
        
        // The new API format is { date: "...", eur: { "twd": 34.9, ... } }
        const ratesFromApi = data.eur;
        ratesFromApi['eur'] = 1; // Add base currency to the rates object

        const supportedAndAvailable = Object.keys(currencyMap).filter(c => ratesFromApi[c.toLowerCase()]);
        setAvailableCurrencies(supportedAndAvailable);
        
        if (!supportedAndAvailable.includes(fromCurrency)) {
            setFromCurrency('TWD');
        }
        if (!supportedAndAvailable.includes(toCurrency)) {
            setToCurrency('JPY');
        }
        
        setRates(ratesFromApi);

      } catch (e: any) {
        const errorMessage = e.message.includes('Failed to fetch') 
            ? '無法連接到匯率服務，請檢查您的網路連線。'
            : '無法載入匯率資料，請稍後再試。';
        setError(errorMessage);
        setAvailableCurrencies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const rateBetweenSelected = useMemo(() => {
    if (isLoading || !rates[fromCurrency.toLowerCase()] || !rates[toCurrency.toLowerCase()]) return null;
    const rateFrom = rates[fromCurrency.toLowerCase()]; // FROM per EUR
    const rateTo = rates[toCurrency.toLowerCase()]; // TO per EUR
    return rateTo / rateFrom; // (TO/EUR) / (FROM/EUR) = TO/FROM
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">正在載入即時匯率...</span>
        </div>
      );
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
      <>
        <div className="space-y-4">
            <div className="flex items-center gap-2">
            <Select value={fromCurrency} onValueChange={setFromCurrency} disabled={availableCurrencies.length === 0}>
                <SelectTrigger>
                <SelectValue placeholder="選擇貨幣" />
                </SelectTrigger>
                <SelectContent>
                {availableCurrencies.map(code => (
                    <SelectItem key={code} value={code}>
                    {`${code} (${currencyMap[code] || code})`}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Input
                type="number"
                value={amount ?? ''}
                onChange={e => {
                const val = e.target.value;
                setAmount(val === '' ? undefined : parseFloat(val));
                }}
                placeholder="輸入金額"
                className="text-lg font-bold"
                disabled={availableCurrencies.length === 0}
            />
            </div>
            
            <div className="flex justify-center">
                <Button variant="ghost" size="icon" onClick={handleSwap} disabled={availableCurrencies.length === 0}>
                    <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
            <Select value={toCurrency} onValueChange={setToCurrency} disabled={availableCurrencies.length === 0}>
                <SelectTrigger>
                <SelectValue placeholder="選擇貨幣" />
                </SelectTrigger>
                <SelectContent>
                {availableCurrencies.map(code => (
                    <SelectItem key={code} value={code}>
                     {`${code} (${currencyMap[code] || code})`}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Input
                type="number"
                value={convertedAmount !== undefined ? convertedAmount.toFixed(2) : ''}
                readOnly
                placeholder="換算結果"
                className="text-lg font-bold bg-muted/50"
                disabled={availableCurrencies.length === 0}
            />
            </div>
        </div>
      </>
    );
  }
  
  const displayRate = useMemo(() => {
    if (isLoading) return '載入中...';
    if (error || !rateBetweenSelected) return '無法取得匯率';

    let base = fromCurrency;
    let quote = toCurrency;
    let rate = rateBetweenSelected;

    if (fromCurrency === 'TWD' && toCurrency !== 'TWD') {
        base = toCurrency;
        quote = fromCurrency;
        rate = 1 / rateBetweenSelected;
    }

    return `1 ${base} ≈ ${rate.toFixed(2)} ${quote}`;
  }, [isLoading, error, rateBetweenSelected, fromCurrency, toCurrency]);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground text-base">匯率換算</span>
              </div>
              <div className="flex items-center gap-3">
                  {!isOpen && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {displayRate}
                      </span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-4 px-4 pb-2">
            {renderContent()}
          </CardContent>
          <CardDescription className="px-4 pb-4 text-xs text-muted-foreground">
            匯率資料僅供參考。
          </CardDescription>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
