'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/store/appStore';
import useStoreHydrated from '@/hooks/useStoreHydrated';

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const isHydrated = useStoreHydrated();

  useEffect(() => {
    if (isHydrated) {
      if (currentUser) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isHydrated, currentUser, router]);

  // TEST: Dodajem statički tekst da vidim da li se išta renderuje
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">TEST - APLIKACIJA RADI!</h1>
        <p className="text-lg text-gray-600 mb-4">Ako vidiš ovo, React se renderuje.</p>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">isHydrated: {String(isHydrated)} | currentUser: {currentUser ? 'Postoji' : 'Nema'}</p>
      </div>
    </div>
  );
} 