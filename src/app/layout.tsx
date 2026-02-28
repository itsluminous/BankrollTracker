"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import Footer from '@/components/footer';
import { registerSW } from '@/lib/pwa';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    document.title = "Balance Tracker";
    registerSW();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="theme-color" content="#ffffff" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Balance Tracker" />
          <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        </head>
        <body className={`${inter.className} antialiased flex flex-col min-h-screen`}>
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
