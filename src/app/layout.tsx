"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import Footer from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

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
