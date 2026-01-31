'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2, Users } from 'lucide-react';
import type { Member, SplitMethod, Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EpicSubmitButton } from '@/components/ui/epic-submit-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/use-current-user';

const expenseFormSchema = z.object({
  description: z.string().min(1, '描述為必填項。'),
  totalAmount: z.coerce.number({ invalid_type_error: '金額必須是數字。' }).min(0.01, '金額必須為正數。'),
  paidBy: z.array(z.object({
    memberId: z.string().min(1),
    amount: z.coerce.number({ invalid_type_error: '金額必須是數字。' }).nonnegative('金額不能為負數。'),
  })).min(1, '至少要有一位付款人。'),
  splitMethod: z.enum(['equally', 'percentage', 'shares', 'amount']),
  splitDetails: z.array(z.object({
    memberId: z.string().min(1),
    value: z.coerce.number().nonnegative('分攤值不能為負數。'),
    selected: z.boolean(),
  }))
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface AddExpenseCardProps {
  members: Member[];
  onAddExpense: (data: Omit<Expense, 'id' | 'date'>) => void;
  isLocked: boolean;
}

export function AddExpenseCard({ members, onAddExpense, isLocked }: AddExpenseCardProps) {
  const { toast } = useToast();
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equally');
  const { currentUser } = useCurrentUser();

  const getDefaultPaidBy = useCallback(() => {
    if (currentUser) {
      return [{ memberId: currentUser.id, amount: undefined }];
    }
    if (members.length > 0) {
      return [{ memberId: members[0].id, amount: undefined }];
    }
    return [];
  }, [currentUser, members]);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      totalAmount: undefined,
      paidBy: getDefaultPaidBy(),
      splitMethod: 'equally',
      splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true }))
    },
  });

  const { fields: paidByFields, append: appendPayer, remove: removePayer } = useFieldArray({
    control: form.control,
    name: "paidBy",
  });
  const { fields: splitDetailFields } = useFieldArray({
    control: form.control,
    name: "splitDetails",
  });

  useEffect(() => {
    form.reset({
      description: '',
      totalAmount: undefined,
      paidBy: getDefaultPaidBy(),
      splitMethod: 'equally',
      splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true }))
    });
  }, [members, currentUser, form.reset, getDefaultPaidBy]);


  const totalAmount = form.watch('totalAmount');
  const splitDetails = form.watch('splitDetails');
  const paidBy = form.watch('paidBy');
  const selectedMembersCount = splitDetails.filter(d => d.selected).length;

  const handleSplitMethodChange = (value: string) => {
    const method = value as SplitMethod;
    setSplitMethod(method);
    form.setValue('splitMethod', method);
    const defaultSplit = members.map((m, i) => ({
      ...splitDetails[i],
      value: method === 'equally' || method === 'shares' ? 1 : 0
    }));
    form.setValue('splitDetails', defaultSplit);
  };

  const toggleSelectAll = (checked: boolean) => {
    const newSplitDetails = splitDetails.map(detail => ({ ...detail, selected: checked }));
    form.setValue('splitDetails', newSplitDetails);
  }

  function onSubmit(data: ExpenseFormData) {
    const totalPaid = data.paidBy.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (Math.abs(totalPaid - (data.totalAmount || 0)) > 0.01) {
      form.setError("totalAmount", { type: "manual", message: "支付總額必須等於費用總額。" })
      return;
    }

    const selectedMembersCount = data.splitDetails.filter(d => d.selected).length;
    if (selectedMembersCount === 0) {
      form.setError("splitMethod", { type: "manual", message: "請至少選擇一位成員進行分攤。" })
      return;
    }

    if (data.splitMethod === 'percentage') {
      const totalPercentage = data.splitDetails.filter(d => d.selected).reduce((sum, s) => sum + s.value, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        form.setError("splitMethod", { type: "manual", message: "分攤百分比總和必須為 100%。" })
        return;
      }
    }
    if (data.splitMethod === 'amount') {
      const totalSplitAmount = data.splitDetails.filter(d => d.selected).reduce((sum, s) => sum + s.value, 0);
      if (Math.abs(totalSplitAmount - (data.totalAmount || 0)) > 0.01) {
        form.setError("splitMethod", { type: "manual", message: "分攤金額總和必須等於費用總金額。" })
        return;
      }
    }

    const submissionData = {
      ...data,
      splitDetails: data.splitDetails.filter(d => d.selected)
    }
    onAddExpense(submissionData);
    form.reset({
      description: '',
      totalAmount: undefined,
      paidBy: getDefaultPaidBy(),
      splitMethod: 'equally',
      splitDetails: members.map(m => ({ memberId: m.id, value: 1, selected: true }))
    });
    setSplitMethod('equally');
    toast({
      title: "費用已新增",
      description: `「${data.description}」已被記錄。`,
    });
  }

  if (members.length === 0 || !isLocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>新增費用</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
            <Users className="w-12 h-12 mb-4" />
            <p>請先在「修改成員」中新增成員並鎖定列表，才能開始新增費用。</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>新增費用</CardTitle>
          <CardDescription>為群組記錄一筆新費用。</CardDescription>
        </div>
        <EpicSubmitButton
          type="submit"
          disabled={!form.formState.isDirty || !form.formState.isValid || form.formState.isSubmitting}
          onClick={() => form.handleSubmit(onSubmit)()}
        />
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">描述</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：晚餐" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">金額</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="pl-7 h-10"
                          step="0.01"
                          {...field}
                          onChange={e => {
                            const val = e.target.value;
                            const numVal = val === '' ? undefined : parseFloat(val);
                            field.onChange(numVal);
                            if (paidBy.length === 1) {
                              form.setValue('paidBy.0.amount', numVal as any, { shouldValidate: true });
                            }
                          }}
                          value={field.value ?? ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormItem>
              <FormLabel>付款人</FormLabel>
              {members.length > 1 && (
                <div className="space-y-2 py-2">
                  <Label className="text-xs text-muted-foreground">快速選擇</Label>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <Button
                        key={member.id}
                        type="button"
                        variant={paidBy?.[0]?.memberId === member.id && paidBy.length === 1 ? 'default' : 'outline'}
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          const totalAmountValue = form.getValues('totalAmount');
                          form.setValue('paidBy', [{ memberId: member.id, amount: (totalAmountValue || 0) as any }], { shouldValidate: true, shouldDirty: true });
                        }}
                      >
                        {member.name}
                      </Button>
                    ))}
                  </div>
                  <div className="relative flex items-center pt-2">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-2 text-xs text-muted-foreground">或</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {paidByFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Controller
                        control={form.control}
                        name={`paidBy.${index}.memberId`}
                        render={({ field: controllerField }) => (
                          <Select onValueChange={controllerField.onChange} value={controllerField.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="選擇成員" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {members.map(member => (
                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <Controller
                      control={form.control}
                      name={`paidBy.${index}.amount`}
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            className="pl-6 w-32"
                            step="0.01"
                            {...field}
                            onChange={e => {
                              const val = e.target.value;
                              field.onChange(val === '' ? undefined : parseFloat(val));
                            }}
                            value={field.value ?? ''}
                          />
                        </div>
                      )}
                    />
                    {paidByFields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePayer(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendPayer({ memberId: members[0].id, amount: 0 as any })} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> 新增付款人
              </Button>
            </FormItem>

            <FormItem>
              <div className='flex items-center justify-between'>
                <FormLabel>分攤給</FormLabel>
                <div className='flex items-center gap-2'>
                  <Label htmlFor='select-all' className='text-sm font-normal'>全選</Label>
                  <Checkbox id='select-all' onCheckedChange={(checked) => toggleSelectAll(!!checked)} checked={selectedMembersCount === members.length} />
                </div>
              </div>
              <Tabs value={splitMethod} onValueChange={handleSplitMethodChange} className="w-full">
                <TabsList>
                  <TabsTrigger value="equally">均分</TabsTrigger>
                  <TabsTrigger value="amount">指定金額</TabsTrigger>
                  <TabsTrigger value="percentage">按百分比</TabsTrigger>
                  <TabsTrigger value="shares">按份額</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="pt-3 space-y-2">
                {splitDetailFields.map((field, index) => {
                  const member = members.find(m => m.id === field.memberId);
                  return (
                    <div key={field.id} className="flex items-center justify-between py-1">
                      <div className='flex items-center gap-2'>
                        <Controller
                          control={form.control}
                          name={`splitDetails.${index}.selected`}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label className={`text-sm ${!splitDetails[index].selected ? 'text-muted-foreground' : ''}`}>{member?.name}</Label>
                      </div>
                      {splitMethod === 'equally' && (
                        <span className={`text-sm text-muted-foreground ${!splitDetails[index].selected ? 'line-through' : ''}`}>
                          {((totalAmount || 0) > 0 && selectedMembersCount > 0) ? ((totalAmount || 0) / selectedMembersCount).toFixed(2) : '0.00'}
                        </span>
                      )}
                      {splitMethod !== 'equally' && (
                        <Controller
                          control={form.control}
                          name={`splitDetails.${index}.value`}
                          render={({ field }) => (
                            <div className="relative">
                              {splitMethod === 'percentage' && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>}
                              {splitMethod === 'amount' && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>}
                              <Input
                                type="number"
                                step={splitMethod === 'percentage' ? '1' : '0.01'}
                                className={`h-8 text-sm ${splitMethod === 'amount' ? "pl-5 w-20" : "w-20"}`} {...field}
                                disabled={!splitDetails[index].selected}
                                onChange={e => {
                                  const val = e.target.value;
                                  field.onChange(val === '' ? 0 : parseFloat(val));
                                }}
                                value={field.value ?? ''}
                              />
                            </div>
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              <FormMessage>{form.formState.errors.splitMethod?.message}</FormMessage>
            </FormItem>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
