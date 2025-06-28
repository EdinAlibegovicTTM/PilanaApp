"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/store/appStore';
import { FormConfig } from '@/types';
import { DocumentTextIcon, PencilSquareIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

export default function FormsPage() {
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { currentUser, globalLogo, logoLocations } = useAppStore();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/forms');
        setForms(response.data);
      } catch (error) {
        toast.error('Nije uspjelo dohvatanje formi.');
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Da li ste sigurni da želite obrisati ovu formu?')) {
      try {
        await axios.delete(`/api/forms/${id}`);
        setForms(forms.filter(f => f.id !== id));
        toast.success('Forma je obrisana.');
      } catch (error) {
        toast.error('Brisanje forme nije uspjelo.');
      }
    }
  };

  // Filtriraj forme za korisnika koji nije admin
  const visibleForms = currentUser?.role === 'admin'
    ? forms
    : forms.filter(form => form.isActive && form.allowedUsers?.includes(currentUser?.username || ''));

  if (loading) {
    return <div className="p-8 text-center">Učitavanje...</div>;
  }

  // Prikaz za ADMINA
  if (currentUser?.role === 'admin') {
    return (
      <>
        {/* Watermark logo u pozadini svih formi */}
        {globalLogo && logoLocations.includes('forms') && (
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
          {globalLogo && logoLocations.includes('forms') && (
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
              <h2 className="text-2xl font-bold">Upravljanje formama</h2>
            </div>
            <button className="btn-primary" onClick={() => router.push('/forms/create')}>
              + Nova forma
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map(form => (
              <div key={form.id} className="card p-0 flex flex-col justify-between relative overflow-hidden group">
                <div className="relative h-40 w-full">
                  {form.image ? (
                    <>
                      {/* Pozadinska slika */}
                      <img 
                        src={form.image} 
                        alt="Form background" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Overlay sa poljima forme */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white/90 rounded-lg p-3 m-2 max-w-full max-h-full overflow-hidden">
                          <div className="text-xs font-medium text-gray-800 mb-2">
                            {form.name}
                          </div>
                          <div className="space-y-1 w-full">
                            {form.fields?.slice(0, 3).map((field, index) => (
                              <div key={index} className="border border-gray-300 rounded text-xs text-gray-800 w-full px-2 py-1 truncate bg-transparent">
                                {field.label}
                              </div>
                            ))}
                            {form.fields && form.fields.length > 3 && (
                              <div className="text-xs text-gray-500 text-center w-full">
                                +{form.fields.length - 3} više polja
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <div className="text-center">
                        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-500">Nema slike</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2">{form.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{form.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {form.isActive ? 'Aktivna' : 'Neaktivna'}
                    </span>
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <button onClick={() => router.push(`/forms/${form.id}`)} className="btn-icon" title="Popuni formu">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => router.push(`/forms/create?edit=${form.id}`)} className="btn-icon" title="Uredi">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(form.id)} className="btn-icon text-red-500" title="Obriši">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Prikaz za KORISNIKA
  return (
    <>
      {/* Watermark logo u pozadini svih formi */}
      {globalLogo && logoLocations.includes('forms') && (
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
        {globalLogo && logoLocations.includes('forms') && (
          <div className="flex justify-center mb-6">
            <img 
              src={globalLogo} 
              alt="Company Logo" 
              className="h-12 max-w-xs object-contain"
            />
          </div>
        )}
        
        <BackButton toDashboard className="mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">Dostupne forme</h2>
        </div>
        {visibleForms.length === 0 ? (
          <p>Trenutno nemate dostupnih formi.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleForms.map(form => (
              <div key={form.id} className="card p-0 hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden group" onClick={() => router.push(`/forms/${form.id}`)}>
                <div className="relative h-40 w-full">
                  {form.image ? (
                    <>
                      {/* Pozadinska slika */}
                      <img 
                        src={form.image} 
                        alt="Form background" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Overlay sa poljima forme */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white/90 rounded-lg p-3 m-2 max-w-full max-h-full overflow-hidden">
                          <div className="text-xs font-medium text-gray-800 mb-2">
                            {form.name}
                          </div>
                          <div className="space-y-1 w-full">
                            {form.fields?.slice(0, 3).map((field, index) => (
                              <div key={index} className="border border-gray-300 rounded text-xs text-gray-800 w-full px-2 py-1 truncate bg-transparent">
                                {field.label}
                              </div>
                            ))}
                            {form.fields && form.fields.length > 3 && (
                              <div className="text-xs text-gray-500 text-center w-full">
                                +{form.fields.length - 3} više polja
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <div className="text-center">
                        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-500">Nema slike</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-lg mb-2">{form.name}</h3>
                  <p className="text-sm text-gray-600">{form.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 