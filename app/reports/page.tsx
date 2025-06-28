'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';
import useAppStore from '@/store/appStore';
import useStoreHydrated from '@/hooks/useStoreHydrated';

interface ReportTemplate {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  googleSheetName: string;
  parameters: string; // JSON string
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  allowedUsers?: string;
  sections?: any[];
}

const ReportsPage = () => {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const isHydrated = useStoreHydrated();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [aiAllowedUsers, setAiAllowedUsers] = useState<string[]>([]);
  const [hasAiAccess, setHasAiAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    const fetchData = async () => {
      try {
        // Provjeri pristup AI izvještajima
        const savedAllowedUsers = localStorage.getItem('aiAllowedUsers');
        if (savedAllowedUsers) {
          try {
            const allowedUsers = JSON.parse(savedAllowedUsers);
            setAiAllowedUsers(allowedUsers);
            // Provjeri da li trenutni korisnik ima pristup
            setHasAiAccess(
              currentUser?.role === 'admin' || 
              (currentUser?.username && allowedUsers.includes(currentUser.username))
            );
          } catch (e) {
            setAiAllowedUsers([]);
            setHasAiAccess(currentUser?.role === 'admin');
          }
        } else {
          setHasAiAccess(currentUser?.role === 'admin');
        }

        // Dohvati izvještaje
        const res = await fetch('/api/report-templates');
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // Filtriraj izvještaje za obične korisnike
          let filteredTemplates = data;
          if (currentUser?.role !== 'admin') {
            filteredTemplates = data.filter((template: ReportTemplate) => {
              if (!template.allowedUsers) return false;
              try {
                const allowedUsers = JSON.parse(template.allowedUsers);
                return allowedUsers.includes(currentUser?.username);
              } catch {
                return false;
              }
            });
          }
          setTemplates(filteredTemplates);
        } else {
          setTemplates([]);
        }
      } catch (error) {
        console.error('Greška pri dohvatanju izvještaja:', error);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isHydrated, currentUser]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">Izveštaji</h1>
        </div>
      </div>

      {/* Dugmad za kreiranje - samo za admina */}
      {currentUser.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Napravi novi izvještaj */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Napravi novi izvještaj</h2>
              <p className="text-gray-600 mb-4">
                Kreirajte izvještaje koristeći postojeće šablone i Google Sheets integraciju
              </p>
              <Link 
                href="/reports/admin-create" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Otvori Builder
              </Link>
            </div>
          </div>

          {/* AI Izvještaj */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">AI izvještaj</h2>
              <p className="text-gray-600 mb-4">
                Generišite izvještaje pomoću veštačke inteligencije
              </p>
              <Link 
                href="/reports/ai-create" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Otvori AI Builder
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AI izvještaj dugme za obične korisnike koji imaju pristup */}
      {currentUser.role !== 'admin' && hasAiAccess && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">AI izvještaj</h2>
              <p className="text-gray-600 mb-4">
                Generišite izvještaje pomoću veštačke inteligencije
              </p>
              <Link 
                href="/reports/ai-create" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Otvori AI Builder
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail-ovi izvještaja */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {currentUser.role === 'admin' ? 'Svi izvještaji' : 'Dostupni izvještaji'}
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">
              {currentUser.role === 'admin' 
                ? 'Nema kreiranih izvještaja. Kreirajte prvi izvještaj koristeći builder.' 
                : 'Nemate dostupnih izvještaja. Kontaktirajte administratora.'
              }
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="p-6">
                  {/* Thumbnail */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {template.thumbnail ? (
                      <img 
                        src={template.thumbnail} 
                        alt={template.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Naziv i opis */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  {template.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                  )}
                  
                  {/* Datum kreiranja */}
                  <div className="text-xs text-gray-500 mb-4">
                    Kreiran: {new Date(template.createdAt).toLocaleDateString('bs-BA')}
                  </div>
                  
                  {/* Dugme za otvaranje */}
                  <button 
                    onClick={() => router.push(`/reports/builder?id=${template.id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Otvori izvještaj
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistika - samo za admina */}
      {currentUser.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Statistika</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
              <div className="text-sm text-gray-600">Dostupnih šablona</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">-</div>
              <div className="text-sm text-gray-600">Generisanih izvještaja</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">-</div>
              <div className="text-sm text-gray-600">AI izvještaja</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 