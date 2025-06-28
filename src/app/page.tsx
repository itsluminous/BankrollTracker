"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { ArrowLeft, Download, LineChart, Upload, Wallet } from "lucide-react";

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
  const { data, loading, getLatestRecord, saveData, importData } =
    useBankData();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    }
  };

  const handleSave = (newRecord: Omit<DailyRecord, "date">) => {
    if (date) {
      saveData(date, newRecord);
      setIsEditing(false);
    }
  };

  const handleExport = () => {
    if (Object.keys(data).length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
      });
      return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `bankroll-data-${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
    toast({
      title: "Data Exported",
      description: "Your data has been downloaded as a JSON file.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          throw new Error("File could not be read.");
        }
        const parsedData = JSON.parse(text);

        const success = await importData(parsedData);
        if (success) {
          toast({
            title: "Import Successful!",
            description: "Your data has been imported.",
            className: "bg-accent text-accent-foreground",
          });
          setDate(new Date());
        } else {
          throw new Error("Invalid data format in the file.");
        }
      } catch (error) {
        const description =
          error instanceof Error
            ? error.message
            : "An unknown error occurred.";
        toast({
          variant: "destructive",
          title: "Import Failed",
          description,
        });
      } finally {
        if (event.target) {
          event.target.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">
            Bankroll Tracker
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
          <div className="grid gap-4 md:gap-8 lg:grid-cols-[auto_1fr]">
            <Card className="w-min self-start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
              />
              <CardFooter className="flex flex-col items-stretch gap-2 border-t p-4">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm" onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="application/json"
                  onChange={handleFileChange}
                />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {date ? format(date, "dd MMMM yyyy") : ""}
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
                  <DailyView record={record} onEdit={() => setIsEditing(true)} />
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
