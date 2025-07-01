"use client"

import * as React from "react"
import { format, parseISO, isBefore } from "date-fns"
import { Copy, Banknote, Landmark, PiggyBank, CalendarClock, Pencil } from "lucide-react"

import type { DailyRecord } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BankLogo } from "@/components/bank-logo"

interface DailyViewProps {
  record: DailyRecord;
  onEdit: () => void;
}

export default function DailyView({ record, onEdit }: DailyViewProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const totalBalance = record.accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalFdBalance = record.accounts.reduce((acc, curr) => acc + curr.fds.reduce((fdAcc, fd) => fdAcc + fd.principal, 0), 0);
  const totalCombinedBalance = totalBalance + totalFdBalance;

  const handleCopy = () => {
    let text = `-----------------------------\n`;
    text += `---- Balance : ${format(parseISO(record.date), 'dd-MM-yyyy')} ---\n`;
    text += `-----------------------------\n`;
    text += `*${formatCurrency(totalCombinedBalance)}*\n\n`;

    record.accounts.forEach(account => {
        const accountFdTotal = account.fds.reduce((acc, fd) => acc + fd.principal, 0);
        text += `-----------------------------\n`;
        text += `*${account.holderName} - ${account.bankName} - ${account.accountNumber}*\n`;
        text += `-----------------------------\n`;
        text += `Balance : ${formatCurrency(account.balance)}\n`;
        if (account.fds.length > 0) {
            text += `FD : ${formatCurrency(accountFdTotal)}\n\n`;
            text += `-------- FD Details --------\n`;
            account.fds.forEach(fd => {
                text += `${format(parseISO(fd.maturityDate), 'dd MMM yyyy')} : ${formatCurrency(fd.principal)}\n`;
            });
        }
        text += `\n`;
    });
    
    navigator.clipboard.writeText(text.trim());
    toast({
      title: "Copied to clipboard!",
      description: "You can now paste the balance details in WhatsApp.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col">
            <h3 className="text-lg text-muted-foreground">Total Balance</h3>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalCombinedBalance)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onEdit} variant="outline" size="icon" className="sm:hidden">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button onClick={onEdit} variant="outline" className="hidden sm:flex">
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button onClick={handleCopy} size="icon" className="sm:hidden">
            <Copy className="h-4 w-4" />
          </Button>
          <Button onClick={handleCopy} className="hidden sm:flex">
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
        </div>
      </div>
      <Separator />
      <Accordion type="multiple" defaultValue={record.accounts.map(a => a.id)} className="w-full">
        {record.accounts.map(account => {
          const accountFdTotal = account.fds.reduce((acc, fd) => acc + fd.principal, 0);
          return (
            <AccordionItem value={account.id} key={account.id}>
              <AccordionTrigger className="text-lg hover:no-underline">
                <div className="flex items-center gap-4 w-full">
                  <BankLogo bankName={account.bankName} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-left">
                    <span className="font-semibold">{account.holderName} - {account.bankName}</span>
                    <span className="text-sm text-muted-foreground font-mono">{account.accountNumber}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 p-4 bg-background rounded-lg border min-w-[140px]">
                    <div className="flex items-center text-muted-foreground mb-2"><Banknote className="w-4 h-4 mr-2" />
                      {isMobile ? "Balance" : "Account Balance"}
                    </div>
                    <div className="text-2xl font-semibold">{formatCurrency(account.balance)}</div>
                  </div>
                  <div className="flex-1 p-4 bg-background rounded-lg border min-w-[140px]">
                    <div className="flex items-center text-muted-foreground mb-2"><PiggyBank className="w-4 h-4 mr-2" />
                      {isMobile ? "Deposits" : "Fixed Deposits"}
                    </div>
                    <div className="text-2xl font-semibold">{formatCurrency(accountFdTotal)}</div>
                  </div>
                </div>

                {account.fds.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>FD Maturity Details</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {account.fds.map(fd => {
                            const isMatured = isBefore(parseISO(fd.maturityDate), parseISO(record.date));
                            return (
                                <TooltipProvider key={fd.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <li className={cn("flex justify-between items-center p-2 rounded-md", isMatured ? 'bg-destructive/10' : 'bg-muted/50')}>
                                                <div className="flex items-center">
                                                    <CalendarClock className={cn("w-4 h-4 mr-3", isMatured ? 'text-destructive' : 'text-muted-foreground')} />
                                                    <div>
                                                        <span className={cn("font-mono", isMatured && "text-destructive font-semibold")}>{format(parseISO(fd.maturityDate), 'dd MMM yyyy')}</span>
                                                    </div>
                                                </div>
                                                <span className={cn("font-semibold", isMatured && "text-destructive")}>{formatCurrency(fd.principal)}</span>
                                            </li>
                                        </TooltipTrigger>
                                        {isMatured && <TooltipContent><p>This FD has matured.</p></TooltipContent>}
                                    </Tooltip>
                                </TooltipProvider>
                            )
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
