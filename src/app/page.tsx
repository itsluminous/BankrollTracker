import * as React from "react";
import BankrollTrackerClient from "./bankroll-tracker-client";
import { ProtectedRoute } from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Balance Tracker',
  description: 'Track your bank account balances and financial trends',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Balance Tracker',
  },
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg',
  },
};

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
