"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import Footer from '@/components/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    document.title = "Balance Tracker";
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased flex flex-col min-h-screen">
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
          <Toaster />
        </body>
      </html>
    </I18nextProvider>
  );
}
