'use client';

import Header from '@/components/Header';
import useAppStore from '@/store/appStore';

export default function DashboardPage() {
  const { currentUser } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Dobrodošli, {currentUser?.username || 'Korisnik'}!
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Forme
              </h3>
              <p className="text-blue-700">
                Kreirajte i upravljajte formama za prikupljanje podataka
              </p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Izvještaji
              </h3>
              <p className="text-green-700">
                Pregledajte i generišite izvještaje iz prikupljenih podataka
              </p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Postavke
              </h3>
              <p className="text-purple-700">
                Konfigurišite aplikaciju i korisničke postavke
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 