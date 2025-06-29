import * as React from "react";
import BankrollTrackerClient from "./bankroll-tracker-client";
import { ProtectedRoute } from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";

export default function BankrollTrackerPage() {
  return (
    <ProtectedRoute>
      <React.Suspense fallback={
        <div className="flex min-h-screen w-full flex-col bg-background p-4 md:p-8">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      }>
        <BankrollTrackerClient />
      </React.Suspense>
    </ProtectedRoute>
  );
}
