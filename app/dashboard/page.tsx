'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import useAppStore from '@/store/appStore';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, globalLogo, logoLocations } = useAppStore();

  const isAdmin = currentUser?.role === 'admin';
  const canForms = currentUser?.permissions?.includes('forms') || isAdmin;
  const canReports = currentUser?.permissions?.includes('reports') || isAdmin;
  const canUsers = currentUser?.permissions?.includes('users') || isAdmin;
  const canSettings = currentUser?.permissions?.includes('settings') || isAdmin;

  return (
    <>
      {/* Watermark logo u pozadini */}
      {globalLogo && logoLocations.includes('dashboard') && (
        <img
          src={globalLogo}
          alt="Watermark Logo"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'contain',
            opacity: 0.08,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Logo ako je omogućen */}
          {globalLogo && logoLocations.includes('dashboard') && (
            <div className="flex justify-center mb-6">
              <img 
                src={globalLogo} 
                alt="Company Logo" 
                className="h-12 max-w-xs object-contain"
              />
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Dobrodošli, {currentUser?.username || 'Korisnik'}!
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Forme */}
              {canForms && (
                <div 
                  className="bg-blue-50 p-6 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => router.push('/forms')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    <PlusIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Forme
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Kreirajte i upravljajte formama za prikupljanje podataka
                  </p>
                </div>
              )}
              
              {/* Izvještaji */}
              {canReports && (
                <div 
                  className="bg-green-50 p-6 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                  onClick={() => router.push('/reports')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <ChartBarIcon className="h-8 w-8 text-green-600" />
                    <EyeIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Izvještaji
                  </h3>
                  <p className="text-green-700 text-sm">
                    Pregledajte i generišite izvještaje iz prikupljenih podataka
                  </p>
                </div>
              )}
              
              {/* Korisnici */}
              {canUsers && (
                <div 
                  className="bg-purple-50 p-6 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                  onClick={() => router.push('/users')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <UsersIcon className="h-8 w-8 text-purple-600" />
                    <PlusIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Korisnici
                  </h3>
                  <p className="text-purple-700 text-sm">
                    Upravljajte korisnicima i dozvolama
                  </p>
                </div>
              )}
              
              {/* Postavke */}
              {canSettings && (
                <div 
                  className="bg-orange-50 p-6 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                  onClick={() => router.push('/settings')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Cog6ToothIcon className="h-8 w-8 text-orange-600" />
                    <EyeIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">
                    Postavke
                  </h3>
                  <p className="text-orange-700 text-sm">
                    Konfigurišite aplikaciju i korisničke postavke
                  </p>
                </div>
              )}
            </div>

            {/* Ako korisnik nema pristup ničemu */}
            {!canForms && !canReports && !canUsers && !canSettings && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nemate pristup nijednoj funkcionalnosti.</p>
                <p className="text-gray-400 text-sm">Kontaktirajte administratora.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 