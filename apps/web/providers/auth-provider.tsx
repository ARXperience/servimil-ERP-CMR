'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand persist to hydrate
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.push('/login');
    } else if (isAuthenticated && isPublicPath) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router, isHydrated]);

  if (!isHydrated) {
    return null; // Or a subtle loading state
  }

  return <>{children}</>;
}
