"use client"

import * as React from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, isBefore, parse, isValid } from "date-fns"
import { PlusCircle, Trash2, Save, AlertTriangle, X } from "lucide-react"

import type { Account } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { DatePicker } from "./ui/date-picker"
import { useTranslation } from "react-i18next"

interface AccountEditDialogProps {
  account: Account
  selectedDate: Date
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (account: Account) => void
  onDelete: (accountId: string) => void
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

export function AccountEditDialog({ account, selectedDate, open, onOpenChange, onSave, onDelete }: AccountEditDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const handleDelete = () => {
    onDelete(account.id)
    toast({
      title: t('dataEntry.accountDeleted'),
      description: t('dataEntry.accountDeletedDesc'),
      className: "bg-accent text-accent-foreground",
    })
    onOpenChange(false)
  }

  const form = useForm<z.infer<ReturnType<typeof accountSchema>>>({
    resolver: zodResolver(accountSchema(t)),
    mode: "onBlur",
    defaultValues: JSON.parse(JSON.stringify(account)),
  })

  React.useEffect(() => {
    if (open) {
      form.reset(JSON.parse(JSON.stringify(account)))
    }
  }, [account, open, form])

  const onSubmit = (values: z.infer<ReturnType<typeof accountSchema>>) => {
    onSave(values)
    toast({
      title: t('dataEntry.dataSaved'),
      description: t('dataEntry.dataSavedDesc', { date: format(selectedDate, "PPP") }),
      className: "bg-accent text-accent-foreground",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('dataEntry.editAccount')}</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="holderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dataEntry.accountHolder')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('dataEntry.accountHolder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dataEntry.bankName')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dataEntry.accountNumber')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('dataEntry.accountNumber')} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dataEntry.accountBalance')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FDFormArray form={form} control={form.control} selectedDate={selectedDate} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('dataEntry.cancel')}
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> {t('dataEntry.saveData')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function FDFormArray({ form, control, selectedDate }: { form: any; control: any; selectedDate: Date }) {
  const { t } = useTranslation()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fds"
  })

  const fds = useWatch({
    control,
    name: "fds",
  })

  return (
    <div className="space-y-4">
      <h4 className="font-medium">{t('dataEntry.fixedDeposits')}</h4>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">{t('dataEntry.noFixedDeposits')}</p>}
      <div className="space-y-2">
        {fields.map((fd, fdIndex) => {
          const maturityValue = fds?.[fdIndex]?.maturityDate
          const parsedDate = maturityValue ? parse(maturityValue, "yyyy-MM-dd", new Date()) : null
          const isDateValid = parsedDate && isValid(parsedDate)
          const isDateInvalid = !isDateValid
          const isMatured = isDateValid && isBefore(parsedDate, selectedDate)

          return (
            <div key={fd.id} className={cn("flex items-end gap-2 p-2 rounded-md", 
                isMatured ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50",
                isDateInvalid && "bg-destructive/10 border border-destructive/20"
            )}>
              <FormField
                control={control}
                name={`fds.${fdIndex}.principal`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>{t('dataEntry.principal')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('dataEntry.principalAmount')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`fds.${fdIndex}.maturityDate`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>{t('dataEntry.maturityDate')}</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="yyyy-mm-dd"
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
          )
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
  )
}
