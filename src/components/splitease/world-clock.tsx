'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { timezones } from '@/lib/timezones';

export function WorldClock() {
  const [leftTimezone, setLeftTimezone] = useState('Asia/Taipei');
  const [rightTimezone, setRightTimezone] = useState('Asia/Tokyo');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [leftPopoverOpen, setLeftPopoverOpen] = useState(false);
  const [rightPopoverOpen, setRightPopoverOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, timeZone: string) => {
    try {
      return date.toLocaleTimeString('en-US', {
        timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error(`Invalid timezone: ${timeZone}`);
      return '??:??';
    }
  };

  const getTimezoneLabel = (tzValue: string) => {
    return timezones.find(tz => tz.value === tzValue)?.label || tzValue;
  }

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 text-sm max-w-xs">
      <Popover open={leftPopoverOpen} onOpenChange={setLeftPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="flex-1 basis-0 min-w-0 flex flex-col items-center justify-center h-full p-0 text-center px-1 gap-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap" title={getTimezoneLabel(leftTimezone)}>
              {getTimezoneLabel(leftTimezone)}
            </span>
            <span className="font-semibold font-mono tracking-wider text-sm">
              {formatTime(currentTime, leftTimezone)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[250px]">
          <Command>
            <CommandInput placeholder="搜尋時區..." />
            <CommandList>
              <ScrollArea className="h-72">
                <CommandEmpty>找不到時區。</CommandEmpty>
                <CommandGroup>
                  {timezones.map(tz => (
                    <CommandItem
                      key={tz.value}
                      value={tz.label}
                      onSelect={() => {
                        setLeftTimezone(tz.value);
                        setLeftPopoverOpen(false);
                      }}
                    >
                      {tz.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Globe className="w-5 h-5 text-muted-foreground shrink-0 self-center" />

      <Popover open={rightPopoverOpen} onOpenChange={setRightPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="flex-1 basis-0 min-w-0 flex flex-col items-center justify-center h-full p-0 text-center px-1 gap-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap" title={getTimezoneLabel(rightTimezone)}>
              {getTimezoneLabel(rightTimezone)}
            </span>
            <span className="font-semibold font-mono tracking-wider text-sm">
              {formatTime(currentTime, rightTimezone)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[250px]">
          <Command>
            <CommandInput placeholder="搜尋時區..." />
            <CommandList>
              <ScrollArea className="h-72">
                <CommandEmpty>找不到時區。</CommandEmpty>
                <CommandGroup>
                  {timezones.map(tz => (
                    <CommandItem
                      key={tz.value}
                      value={tz.label}
                      onSelect={() => {
                        setRightTimezone(tz.value);
                        setRightPopoverOpen(false);
                      }}
                    >
                      {tz.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
