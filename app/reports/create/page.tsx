'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateReportPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect na admin-create stranicu
    router.push('/reports/admin-create');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Preusmjeravanje na kreiranje izvještaja...</p>
      </div>
    </div>
  );
} 