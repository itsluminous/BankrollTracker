"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { ArrowLeft, LineChart, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import type { DailyRecord } from "@/lib/types";
import { useBankData } from "@/hooks/use-bank-data";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TrendGraph from "@/components/trend-graph";
import DailyView from "@/components/daily-view";
import DataEntryForm from "@/components/data-entry-form";

export default function BankrollTrackerPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [view, setView] = React.useState<"dashboard" | "trend">("dashboard");
  const [isEditing, setIsEditing] = React.useState(false);
  const [showCalendarOverlay, setShowCalendarOverlay] = React.useState(false);
  const { data, loading, getLatestRecord, saveData } =
    useBankData();
  const { toast } = useToast();

  React.useEffect(() => {
    setIsEditing(false);
  }, [date]);

  const datesWithData = React.useMemo(
    () =>
      Object.keys(data)
        .map((dateStr) => parseISO(dateStr))
        .filter((d) => isValid(d)),
    [data]
  );

  const modifiers = {
    hasData: datesWithData,
  };

  const modifiersClassNames = {
    hasData: "has-data",
  };

  const selectedDateStr = date ? format(date, "yyyy-MM-dd") : "";
  const record = data[selectedDateStr];
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && isValid(selectedDate)) {
      setDate(selectedDate);
      setShowCalendarOverlay(false);
    }
  };

  const handleSave = (newRecord: Omit<DailyRecord, "date">) => {
    if (date) {
      saveData(date, newRecord);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">
            Balance Tracker
          </h1>
        </div>
        {view === "dashboard" ? (
          <Button variant="outline" onClick={() => setView("trend")}>
            <LineChart className="mr-2 h-4 w-4" />
            View Trend
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setView("dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        )}
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {view === "dashboard" ? (
          <div className="grid gap-4 md:gap-8 lg:grid-cols-[1fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Dialog open={showCalendarOverlay} onOpenChange={setShowCalendarOverlay}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="text-xl font-semibold text-foreground p-0 h-auto underline text-blue-600">
                        {date ? format(date, "dd MMMM yyyy") : ""}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-auto max-w-fit">
                      <DialogHeader>
                        <DialogTitle>Select Date</DialogTitle>
                        <DialogDescription>
                          View or enter balance data.
                        </DialogDescription>
                      </DialogHeader>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        modifiers={modifiers}
                        modifiersClassNames={modifiersClassNames}
                        className="p-0"
                      />
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : record && !isEditing ? (
                  <DailyView key={selectedDateStr} record={record} onEdit={() => setIsEditing(true)} />
                ) : (
                  <DataEntryForm
                    key={selectedDateStr}
                    initialData={record}
                    onSave={handleSave}
                    selectedDate={date || new Date()}
                    onCancel={record ? () => setIsEditing(false) : undefined}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Balance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[600px] w-full" />
              ) : (
                <TrendGraph allRecords={Object.values(data)} />
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
