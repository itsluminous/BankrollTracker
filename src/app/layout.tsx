"use client";

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.title = "Balance Tracker";
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/auth/login') {
      router.push('/auth/login');
    }
  }, [user, loading, pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {user && pathname !== '/auth/login' && (
          <div className="absolute top-4 right-4">
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        )}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
