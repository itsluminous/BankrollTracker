"use client";

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (!mounted) {
    return null;
  }

  return (
    <footer className="flex flex-wrap justify-between items-center p-4 border-t text-sm gap-4">
      <div className="flex items-center gap-4">
        <Link href="https://github.com/itsluminous/BankrollTracker" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {t('footer.repository')}
        </Link>
      </div>
      <div className="flex-grow text-center">
        <p>&copy; {new Date().getFullYear()}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => changeLanguage('en')} variant={i18n.language === 'en' ? 'secondary' : 'ghost'} size="sm">
          English
        </Button>
        <Button onClick={() => changeLanguage('hi')} variant={i18n.language === 'hi' ? 'secondary' : 'ghost'} size="sm">
          हिंदी
        </Button>
      </div>
    </footer>
  );
};

export default Footer;
