"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

const publicPaths = ['/auth/login', '/auth/update-password'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push('/auth/login');
    }
  }, [user, loading, pathname, router]);

  if (loading || (!user && !publicPaths.includes(pathname))) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background p-4 md:p-8">
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
