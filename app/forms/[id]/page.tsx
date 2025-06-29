"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FormConfig, FormField } from '@/types';
import FormFieldComponent from '@/components/FormBuilder/FormFieldComponent';
import useAppStore from '@/store/appStore';
import BackButton from '@/components/BackButton';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import useStoreHydrated from '@/hooks/useStoreHydrated';

export default function FormPage() {
  const [form, setForm] = useState<FormConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { currentUser, globalLogo, logoLocations } = useAppStore();
  const isHydrated = useStoreHydrated();

  // State za QR skener
  const [isQrModalOpen, setQrModalOpen] = useState(false);
  const [qrFieldName, setQrFieldName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = new BrowserMultiFormatReader();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Čekamo da currentUser bude dostupan iz store-a
    if (!currentUser) {
        // Možemo prikazati loading ili jednostavno sačekati da se pojavi
        return;
    }
    
    if (id) {
      const fetchForm = async () => {
    setLoading(true);
        try {
          const response = await axios.get(`/api/forms/${id}`);
          const fetchedForm = response.data;
          
          if (currentUser.role !== 'admin' && (!fetchedForm.allowedUsers || !fetchedForm.allowedUsers.includes(currentUser.username))) {
            toast.error('Nemate pristup ovoj formi.');
            router.push('/forms');
            return;
          }

          setForm(fetchedForm);
          
          const initialData: Record<string, any> = {};
          if (fetchedForm.fields && Array.isArray(fetchedForm.fields)) {
            fetchedForm.fields.forEach((field: FormField) => {
              // Postavi default vrijednost ako postoji, inače prazan string
              initialData[field.name] = field.options.defaultValue || '';
            });
          }
          setFormData(initialData);

        } catch (error) {
          console.error("Greška prilikom dohvatanja forme:", error);
          toast.error('Forma nije pronađena ili je došlo do greške.');
          router.push('/forms');
        } finally {
          setLoading(false);
        }
      };
      fetchForm();
    }
  }, [id, router, currentUser]);

  // Novi useEffect za QR skener
  useEffect(() => {
    if (isQrModalOpen && videoRef.current) {
      codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result && qrFieldName) {
          setFormData(prev => ({ ...prev, [qrFieldName]: result.getText() }));
          toast.success(`Skeniran kod: ${result.getText()}`);
          setQrModalOpen(false);
          setQrFieldName(null);
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error(err);
          toast.error('Greška pri skeniranju.');
          setQrModalOpen(false);
          setQrFieldName(null);
        }
      });
    }
    
    return () => {
      codeReader.reset();
    };
  }, [isQrModalOpen, qrFieldName, codeReader]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Provjera za trigger-e
    if (typeof value === 'string' && value.startsWith('trigger_')) {
      const action = value.split('_')[1];
      if (action === 'qr-scanner') {
        setQrFieldName(name);
        setQrModalOpen(true);
      } else if (action === 'geolocation') {
        // Provjeri da li je kod na serveru
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const locationString = `${latitude}, ${longitude}`;
              setFormData(prev => ({ ...prev, [name]: locationString }));
              toast.success('Lokacija učitana.');
            },
            () => {
              toast.error('Nije moguće dohvatiti lokaciju.');
            }
          );
        } else {
          toast.error('Geolokacija nije podržana u ovom browseru.');
        }
      } else if (action === 'user' && currentUser) {
        setFormData(prev => ({ ...prev, [name]: currentUser.username }));
      }
      return;
    }

    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !form || isSubmitting) {
        toast.error("Morate biti prijavljeni ili forma nije učitana.");
        return;
    }

    setIsSubmitting(true);
    console.log('[FormPage] handleSubmit - početak');
    console.log('[FormPage] handleSubmit - currentUser:', currentUser.username);
    console.log('[FormPage] handleSubmit - token postoji:', !!localStorage.getItem('token'));

    try {
      // Dohvati globalna podešavanja
      console.log('[FormPage] handleSubmit - pozivam /api/app-settings');
      const settingsResponse = await axios.get('/api/app-settings');
      console.log('[FormPage] handleSubmit - /api/app-settings uspješan');
      const settings = settingsResponse.data;
      
      if (!settings.exportSheetTab) {
        toast.error('Nije podešen tab za eksport u podešavanjima.');
        setIsSubmitting(false);
        return;
      }

      // Dohvati lokaciju za sva geolocation polja
      const updatedFormData = { ...formData };
      const geolocationFields = form.fields.filter(field => field.type === 'geolocation');
      
      if (geolocationFields.length > 0) {
        // Provjeri da li je kod na serveru
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true
              });
            });
            
            const { latitude, longitude } = position.coords;
            const locationString = `${latitude}, ${longitude}`;
            
            geolocationFields.forEach(field => {
              updatedFormData[field.name] = locationString;
            });
            
            console.log('[FormPage] handleSubmit - lokacija dohvaćena:', locationString);
          } catch (locationError) {
            console.error('[FormPage] handleSubmit - greška pri dohvatanju lokacije:', locationError);
            toast.error('Nije moguće dohvatiti lokaciju. Molimo omogućite pristup lokaciji.');
            setIsSubmitting(false);
            return;
          }
        } else {
          console.warn('[FormPage] handleSubmit - geolokacija nije podržana');
          toast.error('Geolokacija nije podržana u ovom browseru.');
          setIsSubmitting(false);
          return;
        }
      }

      // Transformacija podataka za API
      // API ocekuje objekat `values` gdje je kljuc `field.id`
      const values: Record<string, any> = {};
      form.fields.forEach(field => {
        // formData koristi field.name kao kljuc
        if (updatedFormData[field.name] !== undefined) {
          values[field.id] = updatedFormData[field.name];
        }
      });
      
      const payload = {
          formId: form.id,
          formName: form.name,
          submittedBy: currentUser.username,
          values: values, // Transformisani podaci
          fields: form.fields, // Cijeli niz polja
          sheetTab: settings.exportSheetTab // Koristi globalno podešavanje
      };

      console.log('[FormPage] handleSubmit - pozivam /api/submit-form');
      await axios.post('/api/submit-form', payload);
      console.log('[FormPage] handleSubmit - /api/submit-form uspješan');
      toast.success('Forma je uspješno poslana!');
      
      // Nakon uspješnog slanja, obriši sadržaj polja koja nisu permanent i nisu skrivena
      const newFormData = { ...updatedFormData };
      form.fields.forEach(field => {
        if (!field.options.permanent && !field.options.hidden) {
          // Vrati na default vrijednost ako postoji, inače prazan string
          newFormData[field.name] = field.options.defaultValue || '';
        }
      });
      setFormData(newFormData);
      
      router.push('/forms');
    } catch (error) {
        console.error('[FormPage] handleSubmit - greška:', error);
        const errorMessage = (error as any).response?.data?.error || 'Došlo je do greške prilikom slanja forme.';
        toast.error(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSaveAsPdf = () => {
    if (!form) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(form.name, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    if(form.description) doc.text(form.description, 14, 30);

    const tableColumn = ["Polje", "Vrijednost"];
    const tableRows: any[] = [];

    form.fields.forEach(field => {
      const value = formData[field.name];
      const row = [
        field.label,
        value !== undefined && value !== null ? String(value) : ''
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`${form.name.replace(/\s+/g, '_')}.pdf`);
  };
  
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Čekamo da currentUser bude dostupan
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Provjera autentifikacije...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center">Učitavanje forme...</div>;
  }

  if (!form) {
  return (
        <div className="p-8 text-center">
            <p>Forma nije pronađena ili nemate pristup.</p>
            <BackButton />
        </div>
    );
  }

  // Add a new component for the print view
  const PrintableView = () => (
    <div className="print-only">
      <h1 style={{fontSize: '24px', marginBottom: '8px'}}>{form?.name}</h1>
      <p style={{fontSize: '14px', color: '#555', marginBottom: '24px'}}>{form?.description}</p>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2'}}>Polje</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2'}}>Vrijednost</th>
          </tr>
        </thead>
        <tbody>
          {form?.fields.map(field => (
            <tr key={field.id}>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{field.label}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{String(formData[field.name] || '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header className="no-print" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
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
              <div id="form-to-print" ref={formRef} className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10 no-print-view" style={{ position: 'relative', zIndex: 1 }}>
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
                
                <div className="flex justify-between items-center mb-6 no-print">
                  <div>
                      <h1 className="text-3xl font-bold text-gray-800">{form.name}</h1>
                      <p className="text-gray-600 mt-1">{form.description}</p>
                  </div>
                  <BackButton />
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {form.fields && form.fields.map(field => (
                    <FormFieldComponent
                      key={field.id}
                      field={field}
                      isInputMode={true}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                    />
                  ))}
                  <div className="flex items-center gap-4 pt-4 no-print no-print-pdf">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out ${
                          isSubmitting 
                            ? 'bg-gray-400 cursor-not-allowed text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {isSubmitting ? 'Slanje...' : 'Pošalji'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => window.print()}
                        className="w-full btn-secondary"
                    >
                      Printaj
                    </button>
                    <button 
                        type="button"
                        onClick={handleSaveAsPdf}
                        className="w-full btn-secondary"
                    >
                      Sačuvaj kao PDF
                  </button>
                </div>
                </form>
              </div>

              <PrintableView />

              {isQrModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                    <h3 className="text-lg font-semibold mb-4">Skenirajte QR Kod</h3>
                    <video ref={videoRef} className="w-64 h-64 mx-auto bg-gray-200 rounded"></video>
                    <button
                      onClick={() => {
                        setQrModalOpen(false);
                        setQrFieldName(null);
                        codeReader.reset();
                      }}
                      className="btn-secondary mt-4"
                    >
                      Otkaži
                  </button>
                </div>
                </div>
              )}
            </>
          </main>
        </div>
      </div>
    </AuthGuard>
      );
} 