'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/store/appStore';
import useStoreHydrated from '@/hooks/useStoreHydrated';

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const isHydrated = useStoreHydrated();

  console.log('[HomePage] Render - isHydrated:', isHydrated, 'currentUser:', currentUser);

  useEffect(() => {
    console.log('[HomePage] useEffect pokrenut - isHydrated:', isHydrated, 'currentUser:', currentUser);
    if (isHydrated) {
      if (currentUser) {
        console.log('[HomePage] Preusmjeravam na dashboard');
        router.push('/dashboard');
      } else {
        console.log('[HomePage] Preusmjeravam na login');
        router.push('/login');
      }
    } else {
      console.log('[HomePage] Još nije hydrated, čekam...');
    }
  }, [isHydrated, currentUser, router]);

  console.log('[HomePage] Prikazujem loading spinner');
  // TEST: Hardcoded HTML
  return (
    <div>
      <h1 style={{color: 'red', fontSize: 32}}>TEST: OVO JE HOME PAGE</h1>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
} 