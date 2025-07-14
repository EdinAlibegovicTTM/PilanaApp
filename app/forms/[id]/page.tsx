"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { saveAs } from 'file-saver';

export default function FormPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<FormConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [isQrScanned, setIsQrScanned] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]); // Novo: stanje za tabelu
  const [isLoadingData, setIsLoadingData] = useState(false); // Novo: loading indikator
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set()); // Novo: highlight automatski popunjenih polja

  // Novo: formule za tabelu (možeš kasnije učitati iz konfiguracije forme)
  const [tableFormulas, setTableFormulas] = useState<string[]>(["=SUM(kolicina)", "=AVERAGE(cijena)", "=COUNT(proizvod)", "=CONCAT(napomena)"]);

  // Evaluacija formula nad tabelom
  const evaluateTableFormula = (formula: string) => {
    if (!tableData || tableData.length === 0) return '';
    if (formula.startsWith('=SUM(')) {
      const col = formula.replace('=SUM(', '').replace(')', '').trim();
      const sum = tableData.reduce((acc, row) => acc + (parseFloat(row[col]) || 0), 0);
      return sum;
    }
    if (formula.startsWith('=AVERAGE(')) {
      const col = formula.replace('=AVERAGE(', '').replace(')', '').trim();
      const nums = tableData.map(row => parseFloat(row[col])).filter(n => !isNaN(n));
      if (nums.length === 0) return 0;
      return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    }
    if (formula.startsWith('=COUNT(')) {
      const col = formula.replace('=COUNT(', '').replace(')', '').trim();
      return tableData.filter(row => row[col] !== undefined && row[col] !== '').length;
    }
    if (formula.startsWith('=CONCAT(')) {
      const col = formula.replace('=CONCAT(', '').replace(')', '').trim();
      return tableData.map(row => row[col] || '').join(', ');
    }
    return '';
  };

  // Funkcija za dobijanje lokalnog datuma i vremena
  const getLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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
              let defaultValue = field.options.defaultValue || '';
              
              // Za datetime polja, automatski postavi trenutni datum i vrijeme
              if (field.type === 'datetime' && !defaultValue) {
                defaultValue = getLocalDateTime();
              }
              
              initialData[field.name] = defaultValue;
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

  // Automatsko popunjavanje datetime polja kada se forma učitava
  useEffect(() => {
    if (form && formData && Object.keys(formData).length > 0) {
      const updatedFormData = { ...formData };
      let hasChanges = false;

      form.fields.forEach((field: FormField) => {
        if (field.type === 'datetime' && (!formData[field.name] || formData[field.name] === '')) {
          updatedFormData[field.name] = getLocalDateTime();
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setFormData(updatedFormData);
      }
    }
  }, [form, formData]);

  // Automatsko ažuriranje QR generator polja (params mode) na osnovu promjena formData
  useEffect(() => {
    if (!form) return;
    let updated = false;
    const newFormData = { ...formData };
    form.fields.forEach(field => {
      if (field.type === 'qr-generator' && field.options.qrGeneratorConfig?.mode === 'params') {
        const params = field.options.qrGeneratorConfig.params || [];
        const qrValue = params.map(paramName => newFormData[paramName] || '').join('-');
        if (newFormData[field.name] !== qrValue) {
          newFormData[field.name] = qrValue;
          updated = true;
        }
      }
    });
    if (updated) setFormData(newFormData);
  }, [form, formData]);

  // Novi useEffect za QR skener
  useEffect(() => {
    if (isQrModalOpen) setIsQrScanned(false); // Resetuj flag svaki put kad se modal otvori
    if (isQrModalOpen && videoRef.current) {
      codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (!isQrScanned && result && qrFieldName) {
          setIsQrScanned(true);
          setFormData(prev => ({ ...prev, [qrFieldName]: result.getText() }));
          toast.success(`Skeniran kod: ${result.getText()}`);
          setQrModalOpen(false);
          setQrFieldName(null);
        }
        if (err && !(err instanceof NotFoundException)) {
          if (!isQrScanned) {
            setIsQrScanned(true);
            console.error(err);
            toast.error('Greška pri skeniranju.');
            setQrModalOpen(false);
            setQrFieldName(null);
          }
        }
      });
    }
    return () => {
      codeReader.reset();
    };
  }, [isQrModalOpen, qrFieldName, codeReader, isQrScanned]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Provjera za trigger-e
    if (typeof value === 'string' && value.startsWith('trigger_')) {
      const action = value.split('_')[1];
      if (action === 'qr-scanner') {
        setQrFieldName(name);
        setQrModalOpen(true);
      } else if (action === 'geolocation') {
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

    // --- NOVO: automatsko popunjavanje na osnovu dinamičkog polja ---
    if (!form) return;
    // Pronađi polje koje je promijenjeno
    const changedField = form.fields.find(f => f.name === name);
    if (
      changedField &&
      changedField.type === 'dinamicko-polje' &&
      changedField.options.dynamicSource?.sourceType &&
      (changedField.options.dynamicSource.sourceType === 'ponuda' || changedField.options.dynamicSource.sourceType === 'radni-nalog' || changedField.options.dynamicSource.sourceType === 'custom') &&
      changedField.options.qrLookupConfig
    ) {
      setIsLoadingData(true); // NOVO: loading indikator
      const lookupConfig = changedField.options.qrLookupConfig;
      try {
        const res = await axios.post('/api/qr-lookup', {
          qrCode: value,
          tableName: lookupConfig.tableName,
          searchColumn: lookupConfig.searchColumn,
          returnColumns: lookupConfig.returnColumns,
        });
        if (res.data && res.data.data && res.data.data.length > 0) {
          // Ako ima više redova, popuni tableData
          if (res.data.data.length > 1) {
            setTableData(res.data.data);
            toast.success('Više redova je automatski popunjeno u tabelu!');
          }
          const row = res.data.data[0];
          // Mapiraj podatke iz odgovora na polja forme
          if (lookupConfig.targetFields && Array.isArray(lookupConfig.targetFields)) {
            const updates: Record<string, any> = {};
            const newAutoFilled = new Set<string>(); // NOVO: praćenje automatski popunjenih polja
            lookupConfig.targetFields.forEach(map => {
              if (map.fieldId && map.columnName && row[map.columnName] !== undefined) {
                // Pronađi polje po id-u i upiši vrijednost
                const targetField = form.fields.find(f => f.id === map.fieldId);
                if (targetField) {
                  updates[targetField.name] = row[map.columnName];
                  newAutoFilled.add(targetField.name); // NOVO: označi kao automatski popunjeno
                }
              }
            });
            // --- NOVO: evaluacija unique i sumifs formula ---
            form.fields.forEach(f => {
              if (f.type === 'dinamicko-polje' && f.options.dynamicSource) {
                const dyn = f.options.dynamicSource;
                // UNIQUE formula: npr. =UNIQUE(kolicina, proizvod)
                if (dyn.uniqueFormula && dyn.uniqueFormula.startsWith('=UNIQUE(')) {
                  const params = dyn.uniqueFormula.replace('=UNIQUE(', '').replace(')', '').split(',').map(s => s.trim());
                  const values = params.map(p => updates[p] || formData[p] || '').filter(Boolean);
                  updates[f.name] = Array.from(new Set(values)).join(', ');
                  newAutoFilled.add(f.name); // NOVO: označi kao automatski popunjeno
                }
                // SUMIFS formula: npr. =SUMIFS(kolicina, proizvod, "Drvo")
                if (dyn.sumifsFormula && dyn.sumifsFormula.startsWith('=SUMIFS(')) {
                  // Format: =SUMIFS(kolicina, proizvod, "Drvo")
                  const parts = dyn.sumifsFormula.replace('=SUMIFS(', '').replace(')', '').split(',').map(s => s.trim());
                  const [sumField, criteriaField, criteriaValue] = parts;
                  if (sumField && criteriaField && criteriaValue) {
                    const sumVal = Number(updates[sumField] || formData[sumField] || 0);
                    const critVal = updates[criteriaField] || formData[criteriaField] || '';
                    if (String(critVal) === criteriaValue.replace(/['"]/g, '')) {
                      updates[f.name] = sumVal;
                    } else {
                      updates[f.name] = 0;
                    }
                    newAutoFilled.add(f.name); // NOVO: označi kao automatski popunjeno
                  }
                }
              }
            });
            // --- KRAJ evaluacije formula ---
            if (Object.keys(updates).length > 0) {
              setFormData(prev => ({ ...prev, ...updates }));
              setAutoFilledFields(newAutoFilled); // NOVO: postavi automatski popunjena polja
              toast.success('Podaci iz baze su automatski popunjeni!');
            }
          }
        } else {
          toast.error('Nema podataka za uneseni kod.');
        }
      } catch (err) {
        toast.error('Greška pri dohvatu podataka iz baze.');
      } finally {
        setIsLoadingData(false); // NOVO: ukloni loading indikator
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !form || isSubmitting) {
        toast.error("Morate biti prijavljeni ili forma nije učitana.");
        return;
    }

    setIsSubmitting(true);

    try {
      // Dohvati globalna podešavanja
      const settingsResponse = await axios.get('/api/app-settings');
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
        } catch (locationError) {
          toast.error('Nije moguće dohvatiti lokaciju. Molimo omogućite pristup lokaciji.');
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

      await axios.post('/api/submit-form', payload);
      toast.success('Forma je uspješno poslana!');
      
      // Nakon uspješnog slanja, obriši sadržaj polja koja nisu permanent i nisu skrivena
      const newFormData = { ...updatedFormData };
      form.fields.forEach(field => {
        if (!field.options.permanent && !field.options.hidden) {
          // Vrati na default vrijednost ako postoji, inače prazan string
          let defaultValue = field.options.defaultValue || '';
          
          // Za datetime polja, automatski postavi trenutni datum i vrijeme
          if (field.type === 'datetime' && !defaultValue) {
            defaultValue = getLocalDateTime();
          }
          
          newFormData[field.name] = defaultValue;
        }
      });
      setFormData(newFormData);
      
      router.push('/forms');
    } catch (error) {
        toast.error('Došlo je do greške prilikom slanja forme.');
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
  
  // Export tabele u CSV
  const exportTableToCSV = () => {
    if (!tableData || tableData.length === 0) return;
    const cols = Object.keys(tableData[0]);
    const csvRows = [cols.join(',')];
    tableData.forEach(row => {
      csvRows.push(cols.map(col => JSON.stringify(row[col] ?? '')).join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'tabela.csv');
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
              <div id="form-to-print" ref={formRef} className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10 no-print-view" style={{ 
                position: 'relative', 
                zIndex: 1,
                backgroundColor: form.backgroundColor || '#ffffff'
              }}>
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
                  {form.fields && form.fields.filter(field => !field.options.hidden).map(field => (
                    <FormFieldComponent
                      key={field.id}
                      field={field}
                      isInputMode={true}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      isAutoFilled={autoFilledFields.has(field.name)} // NOVO: proslijedi flag za highlight
                    />
                  ))}
                  {/* NOVO: loading indikator */}
                  {isLoadingData && (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Učitavanje podataka...</span>
                    </div>
                  )}
                  {/* NOVO: prikaz tabele ako ima više redova */}
                  {tableData.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-bold mb-2">Stavke iz baze</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 rounded-lg">
                          <thead>
                            <tr>
                              {Object.keys(tableData[0]).map((col, idx) => (
                                <th key={idx} className="px-4 py-2 border-b bg-gray-100 text-xs font-semibold text-gray-700">{col}</th>
                              ))}
                              <th className="px-4 py-2 border-b bg-gray-100"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-blue-50">
                                {Object.keys(row).map((col, colIdx) => (
                                  <td key={colIdx} className="px-4 py-2 border-b">
                                    <input
                                      type="text"
                                      value={row[col] ?? ''}
                                      onChange={e => {
                                        const newTable = [...tableData];
                                        newTable[rowIdx][col] = e.target.value;
                                        setTableData(newTable);
                                      }}
                                      className="w-full p-1 border border-gray-200 rounded"
                                    />
                                  </td>
                                ))}
                                <td className="px-2 py-2 border-b">
                                  <button
                                    type="button"
                                    className="text-red-500 hover:text-red-700 text-xs"
                                    onClick={() => {
                                      const newTable = tableData.filter((_, i) => i !== rowIdx);
                                      setTableData(newTable);
                                    }}
                                  >Obriši</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button
                          type="button"
                          className="mt-2 btn-secondary"
                          onClick={() => {
                            if (tableData.length > 0) {
                              const emptyRow = Object.fromEntries(Object.keys(tableData[0]).map(k => [k, '']));
                              setTableData([...tableData, emptyRow]);
                            }
                          }}
                        >Dodaj red</button>
                        <button
                          type="button"
                          className="mt-2 ml-2 btn-secondary"
                          onClick={exportTableToCSV}
                        >Export u Excel (CSV)</button>
                      </div>
                      {/* NOVO: unos i prikaz formula */}
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold">Rezultati formula:</h4>
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded mb-2 text-xs font-mono"
                          rows={tableFormulas.length + 1}
                          value={tableFormulas.join('\n')}
                          onChange={e => setTableFormulas(e.target.value.split('\n').map(f => f.trim()).filter(Boolean))}
                          placeholder={"Unesite formule, npr. =SUM(kolicina)\n=AVERAGE(cijena)"}
                        />
                        {tableFormulas.map((f, idx) => (
                          <div key={idx} className="text-xs bg-gray-100 rounded px-2 py-1">
                            <span className="font-mono text-blue-700">{f}</span>: <span className="font-bold text-gray-800">{evaluateTableFormula(f)}</span>
                          </div>
                        ))}
                      </div>
                      {/* KRAJ formula */}
                    </div>
                  )}
                  {/* KRAJ tabele */}
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