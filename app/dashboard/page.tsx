"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAppStore from "@/store/appStore";
import useStoreHydrated from "@/hooks/useStoreHydrated";
import { DocumentTextIcon, ChartBarIcon, CogIcon, UserIcon } from '@heroicons/react/24/outline';
import Header from "@/components/Header";
import axios from "axios";

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, activeForms, setActiveForms, globalLogo, logoLocations } = useAppStore();
  const isHydrated = useStoreHydrated();

  // Učitaj forme kada se dashboard učita
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/forms');
        setActiveForms(response.data);
      } catch (error) {
        console.error('Greška pri učitavanju formi:', error);
      }
    };

    if (isHydrated && currentUser) {
      fetchForms();
    }
  }, [isHydrated, currentUser, setActiveForms]);

  // Ako nije hydrated, prikaži loading
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Ako nema korisnika, redirect na login
  if (!currentUser) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header className="no-print" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
          <div className="min-h-screen bg-gray-50 pt-8">
            {/* Logo ako je omogućen */}
            {globalLogo && logoLocations?.includes('dashboard') && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="flex justify-center">
                  <img 
                    src={globalLogo} 
                    alt="Company Logo" 
                    className="h-16 max-w-xs object-contain"
                  />
                </div>
              </div>
            )}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Dobrodošli, {currentUser.username}!
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {currentUser.role === 'admin' 
                      ? 'Upravljajte formama i pratite podatke' 
                      : 'Ovdje se nalaze forme i izvještaji kojima imate pristup.'
                    }
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/login')} 
                  className="btn-secondary"
                >
                  Nazad
                </button>
              </div>
              
              {/* Quick Stats - samo za admina */}
              {currentUser.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Aktivne forme</p>
                        <p className="text-2xl font-semibold text-gray-900">{activeForms.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Izveštaji</p>
                        <p className="text-2xl font-semibold text-gray-900">5</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CogIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Postavke</p>
                        <p className="text-2xl font-semibold text-gray-900">-</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Admin opcije */}
                {currentUser.role === 'admin' && (
                  <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                       onClick={() => router.push('/users')}>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <UserIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Upravljaj korisnicima</h3>
                        <p className="text-sm text-gray-500 mt-1">Dodaj, uređuj i deaktiviraj korisnike</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thumbnail forme - prikazuje prvu dostupnu formu */}
                {currentUser.permissions?.includes('forms') && activeForms.length > 0 && (
                  <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                       onClick={() => router.push('/forms')}>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">{activeForms[0].name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Kliknite za sve forme</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Izvještaji - za sve koji imaju pristup */}
                {currentUser.permissions?.includes('reports') && (
                  <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                       onClick={() => router.push('/reports')}>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <ChartBarIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Izvještaji</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {currentUser.role === 'admin' ? 'Pregledajte analitiku i izvještaje' : 'Pogledajte izvještaje'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Postavke - samo za admina */}
                {currentUser.role === 'admin' && (
                  <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                       onClick={() => router.push('/settings')}>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <CogIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Postavke</h3>
                        <p className="text-sm text-gray-500 mt-1">Konfigurišite aplikaciju</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dodatne informacije za obične korisnike */}
              {currentUser.role !== 'admin' && (
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-blue-800">💡 Kako koristiti aplikaciju:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {currentUser.permissions?.includes('forms') && (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium mb-1">📋 Forme</div>
                        <div className="text-gray-600">Popunite forme za unos podataka u sistem</div>
                      </div>
                    )}
                    {currentUser.permissions?.includes('reports') && (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium mb-1">📊 Izvještaji</div>
                        <div className="text-gray-600">Pogledajte analize i izvještaje podataka</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </main>
      </div>
    </div>
  );
} 