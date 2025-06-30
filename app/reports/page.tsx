'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/store/appStore';
import { ReportConfig } from '@/types';
import { ChartBarIcon, DocumentTextIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';
import Header from '@/components/Header';

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { currentUser, globalLogo, logoLocations } = useAppStore();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/report-templates');
        setReports(response.data);
      } catch (error) {
        toast.error('Nije uspjelo dohvatanje izvještaja.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Da li ste sigurni da želite obrisati ovaj izvještaj?')) {
      try {
        await axios.delete(`/api/report-templates/${id}`);
        setReports(reports.filter(r => r.id !== id));
        toast.success('Izvještaj je obrisan.');
      } catch (error) {
        toast.error('Brisanje izvještaja nije uspjelo.');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Učitavanje...</div>;
  }

  return (
    <>
      <Header />
      {/* Watermark logo u pozadini */}
      {globalLogo && logoLocations.includes('reports') && (
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
      <div className="max-w-7xl mx-auto mt-10 p-6">
        {/* Logo ako je omogućen */}
        {globalLogo && logoLocations.includes('reports') && (
          <div className="flex justify-center mb-6">
            <img 
              src={globalLogo} 
              alt="Company Logo" 
              className="h-12 max-w-xs object-contain"
            />
          </div>
        )}
        
        <BackButton toDashboard className="mb-6" />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Izvještaji</h2>
          </div>
        </div>

        {/* Thumbnail sekcije */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Admin izvještaji thumbnail */}
          <div className="card p-6 border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Admin Izvještaji</h3>
                <p className="text-gray-600">Izvještaji koje kreira admin za korisnike</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">
                Kreirajte i upravljajte izvještajima koje mogu vidjeti odobreni korisnici.
              </p>
              <div className="text-sm text-gray-600">
                <div>• Kreirajte custom izvještaje</div>
                <div>• Upravljajte pristupom korisnika</div>
                <div>• Eksportujte podatke</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn-primary flex-1" 
                onClick={() => router.push('/reports/create')}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Kreiraj izvještaj
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => router.push('/reports/admin-create')}
              >
                <EyeIcon className="h-5 w-5" />
                Pregledaj
              </button>
            </div>
          </div>

          {/* AI izvještaji thumbnail */}
          <div className="card p-6 border-2 border-purple-200 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <SparklesIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">AI Izvještaji</h3>
                <p className="text-gray-600">Inteligentni izvještaji sa AI analizom</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">
                Generišite inteligentne izvještaje pomoću AI tehnologije.
              </p>
              <div className="text-sm text-gray-600">
                <div>• Automatska analiza podataka</div>
                <div>• AI generisani insights</div>
                <div>• Pametne preporuke</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn-primary flex-1 bg-purple-600 hover:bg-purple-700" 
                onClick={() => router.push('/reports/ai-create')}
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                AI Izvještaj
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => router.push('/reports/ai-create')}
              >
                <EyeIcon className="h-5 w-5" />
                Pregledaj
              </button>
            </div>
          </div>
        </div>

        {/* Lista postojećih izvještaja */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Postojeći izvještaji</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map(report => (
              <div key={report.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    <h3 className="font-bold text-lg">{report.name}</h3>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{report.description}</p>
                
                <div className="text-sm text-gray-500 mb-4">
                  <div>Google Sheet: {report.dataSource.googleSheetName}</div>
                  <div>Polja: {report.displayFields.length}</div>
                </div>

                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => router.push(`/reports/builder?report=${report.id}`)} 
                    className="btn-icon" 
                    title="Pogledaj izvještaj"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => router.push(`/reports/create?edit=${report.id}`)} 
                    className="btn-icon" 
                    title="Uredi"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(report.id)} 
                    className="btn-icon text-red-500" 
                    title="Obriši"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {reports.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nema izvještaja</h3>
              <p className="text-gray-500 mb-4">Izvještaji se kreiraju u admin dijelu</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 