"use client"

import * as React from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, isBefore, parse, isValid } from "date-fns"
import { PlusCircle, Trash2, Save, AlertTriangle } from "lucide-react"

import type { DailyRecord, Account, FixedDeposit } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { DatePicker } from "./ui/date-picker";
import { useTranslation } from "react-i18next"
import { useBankData } from "@/hooks/use-bank-data";

interface DataEntryFormProps {
  initialData: DailyRecord | null;
  onSave: (data: Omit<DailyRecord, "date">) => void;
  selectedDate: Date;
  onCancel?: () => void;
}

const fdSchema = (t: any) => z.object({
  id: z.string(),
  principal: z.coerce.number().min(0, t('dataEntry.principalMin')),
  maturityDate: z.string().refine((val) => {
    try {
      const date = parse(val, "yyyy-MM-dd", new Date());
      return isValid(date);
    } catch {
      return false;
    }
  }, {
    message: t('dataEntry.invalidDate'),
  }),
});

const accountSchema = (t: any) => z.object({
  id: z.string(),
  holderName: z.string().min(1, t('dataEntry.holderNameRequired')),
  bankName: z.string().min(1, t('dataEntry.bankNameRequired')),
  accountNumber: z.string().min(1, t('dataEntry.accountNumberRequired')),
  balance: z.coerce.number().min(0, t('dataEntry.balanceMin')),
  fds: z.array(fdSchema(t)),
});

const formSchema = (t: any) => z.object({
  accounts: z.array(accountSchema(t)),
});


export default function DataEntryForm({ initialData, onSave, selectedDate, onCancel }: DataEntryFormProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { getLatestRecord } = useBankData();
    const [prefillLoading, setPrefillLoading] = React.useState(true);
    const [latestRecord, setLatestRecord] = React.useState<DailyRecord | null>(null);

    React.useEffect(() => {
        const fetchPrefillData = async () => {
            if (!initialData) {
                setPrefillLoading(true);
                const record = await getLatestRecord(selectedDate);
                setLatestRecord(record);
                setPrefillLoading(false);
            } else {
                setPrefillLoading(false);
            }
        };
        fetchPrefillData();
    }, [selectedDate, initialData, getLatestRecord]);

    const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
        resolver: zodResolver(formSchema(t)),
        mode: "onBlur",
        defaultValues: {
            accounts: initialData?.accounts 
                ? JSON.parse(JSON.stringify(initialData.accounts)) 
                : latestRecord?.accounts 
                    ? JSON.parse(JSON.stringify(latestRecord.accounts)) 
                    : [],
        },
    });

    React.useEffect(() => {
        if (!initialData && latestRecord) {
            form.reset({ accounts: JSON.parse(JSON.stringify(latestRecord.accounts)) });
        } else if (initialData) {
            form.reset({ accounts: JSON.parse(JSON.stringify(initialData.accounts)) });
        } else {
            form.reset({ accounts: [] });
        }
    }, [initialData, latestRecord, form]);


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "accounts",
    });

    const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
        onSave(values);
        toast({
            title: t('dataEntry.dataSaved'),
            description: t('dataEntry.dataSavedDesc', { date: format(selectedDate, "PPP") }),
            className: "bg-accent text-accent-foreground",
        });
    };

  if (prefillLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">{t('dataEntry.loadingPrevious')}</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          {fields.map((account, accountIndex) => (
            <Card key={account.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-muted/30 p-4">
                  <div className="space-y-1.5">
                    <FormField
                      control={form.control}
                      name={`accounts.${accountIndex}.holderName`}
                      render={({ field }) => (
                        <Input {...field} placeholder={t('dataEntry.accountHolder')} className="text-lg font-semibold border-0 shadow-none p-0 h-auto bg-transparent focus-visible:ring-0" />
                      )}
                    />
                    <div className="flex gap-4 items-center">
                      <FormField
                          control={form.control}
                          name={`accounts.${accountIndex}.bankName`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    id={field.name}
                                    name={field.name}
                                    className="text-sm border-0 shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 w-auto min-w-[100px] gap-1"
                                  >
                                    <SelectValue placeholder={t('dataEntry.selectBank')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="HDFC">HDFC</SelectItem>
                                  <SelectItem value="SBI">SBI</SelectItem>
                                  <SelectItem value="PNB">PNB</SelectItem>
                                  <SelectItem value="ICICI">ICICI</SelectItem>
                                  <SelectItem value="Others">Others</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name={`accounts.${accountIndex}.accountNumber`}
                          render={({ field }) => (
                              <Input {...field} placeholder={t('dataEntry.accountNumber')} className="text-sm border-0 shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 font-mono" />
                          )}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(accountIndex)} data-testid={`delete-account-${accountIndex}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                 <FormField
                    control={form.control}
                    name={`accounts.${accountIndex}.balance`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={`accounts.${accountIndex}.balance`}>{t('dataEntry.accountBalance')}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} id={`accounts.${accountIndex}.balance`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                  <FDFormArray accountIndex={accountIndex} form={form} control={form.control} selectedDate={selectedDate}/>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={() => append({ id: `new_${Date.now()}`, holderName: '', bankName: '', accountNumber: '', balance: 0, fds: [] })}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('dataEntry.addAccount')}
            </Button>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  {t('dataEntry.cancel')}
                </Button>
              )}
              <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> {t('dataEntry.saveData')}
              </Button>
            </div>
        </div>
      </form>
    </Form>
  )
}


function FDFormArray({ accountIndex, form, control, selectedDate }: { accountIndex: number; form: any; control: any; selectedDate: Date }) {
    const { t } = useTranslation();
    const { fields, append, remove } = useFieldArray({
      control,
      name: `accounts.${accountIndex}.fds`
    });

    const fds = useWatch({
      control,
      name: `accounts.${accountIndex}.fds`,
    });

    return (
      <div className="space-y-4">
        <h4 className="font-medium">{t('dataEntry.fixedDeposits')}</h4>
        {fields.length === 0 && <p className="text-sm text-muted-foreground">{t('dataEntry.noFixedDeposits')}</p>}
        <div className="space-y-2">
          {fields.map((fd, fdIndex) => {
            const maturityValue = fds?.[fdIndex]?.maturityDate;
            const parsedDate = maturityValue ? parse(maturityValue, "yyyy-MM-dd", new Date()) : null;
            const isDateValid = parsedDate && isValid(parsedDate);
            const isDateInvalid = !isDateValid
            const isMatured = isDateValid && isBefore(parsedDate, selectedDate);

            return (
              <div key={fd.id} className={cn("flex items-end gap-2 p-2 rounded-md", 
                  isMatured ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50",
                  isDateInvalid && "bg-destructive/10 border border-destructive/20"
              )}>
                <FormField
                  control={control}
                  name={`accounts.${accountIndex}.fds.${fdIndex}.principal`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel htmlFor={`accounts.${accountIndex}.fds.${fdIndex}.principal`}>{t('dataEntry.principal')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('dataEntry.principalAmount')} {...field} id={`accounts.${accountIndex}.fds.${fdIndex}.principal`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`accounts.${accountIndex}.fds.${fdIndex}.maturityDate`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel htmlFor={`accounts.${accountIndex}.fds.${fdIndex}.maturityDate`}>{t('dataEntry.maturityDate')}</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="yyyy-mm-dd"
                          id={`accounts.${accountIndex}.fds.${fdIndex}.maturityDate`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {(isMatured || isDateInvalid) && (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertTriangle className="h-5 w-5 text-destructive mb-2.5" />
                       </TooltipTrigger>
                       <TooltipContent>
                         {isMatured ? (
                           <p>{t('dataEntry.fdMatured')}</p>
                         ) : (
                           <p>{t('dataEntry.invalidDateFormat')}</p>
                         )}
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                 )}
                 <Button type="button" variant="ghost" size="icon" onClick={() => remove(fdIndex)} className="shrink-0 mb-1">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ id: `new_fd_${Date.now()}`, principal: 0, maturityDate: format(new Date(), 'yyyy-MM-dd') })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> {t('dataEntry.addFd')}
        </Button>
      </div>
    );
  }
