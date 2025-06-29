"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { ArrowLeft, LineChart, Power, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useBankData } from "@/hooks/use-bank-data";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TrendGraph from "@/components/trend-graph";
import DailyView from "@/components/daily-view";
import DataEntryForm from "@/components/data-entry-form";
import type { DailyRecord } from "@/lib/types";

const NoDataView = ({ onAdd }: { onAdd: () => void }) => (
  <div className="text-center py-8">
    <p className="text-muted-foreground mb-4">No data recorded for this date.</p>
    <Button onClick={onAdd}>Add Record</Button>
  </div>
);

export default function BankrollTrackerPage() {
  const [showCalendarOverlay, setShowCalendarOverlay] = React.useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const { data, loading, saveData, getLatestDateWithData } = useBankData();
  const { toast } = useToast();

  const urlDateStr = searchParams.get("date");
  const date = urlDateStr && isValid(parseISO(urlDateStr)) ? parseISO(urlDateStr) : undefined;
  const view = searchParams.get("view") === "trend" ? "trend" : "dashboard";
  const isEditing = searchParams.get("editing") === "true";

  React.useEffect(() => {
    if (loading || date) return;

    const latestDate = getLatestDateWithData();
    const initialDate = latestDate || new Date();
    const initialDateStr = format(initialDate, 'yyyy-MM-dd');

    const params = new URLSearchParams(searchParams.toString());
    params.set('date', initialDateStr);
    router.replace(`${pathname}?${params.toString()}`);
  }, [loading, date, getLatestDateWithData, pathname, router, searchParams]);

  const setView = (newView: "dashboard" | "trend") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`${pathname}?${params.toString()}`);
  };

  const setIsEditing = (editing: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (editing) {
      params.set("editing", "true");
    } else {
      params.delete("editing");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const datesWithData = React.useMemo(
    () =>
      Object.keys(data)
        .map((dateStr) => parseISO(dateStr))
        .filter((d) => isValid(d)),
    [data]
  );

  const modifiers = { hasData: datesWithData };
  const modifiersClassNames = { hasData: "has-data" };

  const selectedDateStr = date ? format(date, "yyyy-MM-dd") : "";
  const record = data[selectedDateStr];

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && isValid(selectedDate)) {
      setShowCalendarOverlay(false);
      const newDateStr = format(selectedDate, "yyyy-MM-dd");
      
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", newDateStr);

      const recordExists = !!data[newDateStr];
      if (!recordExists) {
        params.set("editing", "true");
      } else {
        params.delete("editing");
      }
      
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleSave = (newRecord: Omit<DailyRecord, "date">) => {
    if (date) {
      saveData(date, newRecord);
      setIsEditing(false);
    }
  };

  if (!date) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background p-4 md:p-8">
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">
            Balance Tracker
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {view === "dashboard" ? (
            <Button variant="outline" onClick={() => setView("trend")}>
              <LineChart className="mr-2 h-4 w-4" />
              {isMobile ? "Trend" : "View Trend"}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setView("dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isMobile ? "Dashboard" : "Back to Dashboard"}
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout}>
            <Power className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
            {!isMobile && <span>Logout</span>}
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {view === "dashboard" ? (
          <div className="grid gap-4 md:gap-8 lg:grid-cols-[1fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Dialog
                    open={showCalendarOverlay}
                    onOpenChange={setShowCalendarOverlay}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-xl font-semibold text-foreground p-0 h-auto underline text-blue-600"
                      >
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
                ) : isEditing ? (
                  <DataEntryForm
                    key={selectedDateStr}
                    initialData={record}
                    onSave={handleSave}
                    selectedDate={date}
                    onCancel={() => setIsEditing(false)}
                  />
                ) : record ? (
                  <DailyView
                    key={selectedDateStr}
                    record={record}
                    onEdit={() => setIsEditing(true)}
                  />
                ) : (
                  <NoDataView onAdd={() => setIsEditing(true)} />
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
