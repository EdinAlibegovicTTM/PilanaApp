'use client';

import React, { useState, useEffect } from 'react';
import { FormField } from '@/types';
import FormulaHelper from '@/components/FormulaHelper';

interface FieldPropertiesProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function FieldProperties({ field, onUpdate, onDelete, onClose }: FieldPropertiesProps) {
  const [localField, setLocalField] = useState<FormField>(field);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalField(field);
  }, [field]);

  const handleChange = (key: keyof FormField, value: any) => {
    const updated = { ...localField, [key]: value };
    setLocalField(updated);
    onUpdate(updated);
  };

  const handleOptionChange = (key: keyof FormField['options'], value: any) => {
    const updated = {
      ...localField,
      options: {
        ...localField.options,
        [key]: value,
      },
    };
    setLocalField(updated);
    onUpdate(updated);
  };

  const handleFormulaChange = (value: string) => {
    onUpdate({ options: { ...field.options, formula: value } });
  };

  // Dropdown opcije kao tekst, svaka linija je opcija
  const dropdownOptionsText = (localField.options.dropdownOptions || []).join('\n');

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Svojstva polja</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Labela */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Labela</label>
          <input
            type="text"
            className="input-field"
            value={localField.label}
            onChange={e => handleChange('label', e.target.value)}
          />
        </div>
        {/* Placeholder */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
          <input
            type="text"
            className="input-field"
            value={localField.options.placeholder || ''}
            onChange={e => handleOptionChange('placeholder', e.target.value)}
          />
        </div>
        {/* Obavezno, Skriveno, ReadOnly, Permanent */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={localField.options.mandatory}
              onChange={e => handleOptionChange('mandatory', e.target.checked)}
            /> Obavezno
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={localField.options.hidden}
              onChange={e => handleOptionChange('hidden', e.target.checked)}
            /> Skriveno
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={localField.options.readOnly}
              onChange={e => handleOptionChange('readOnly', e.target.checked)}
            /> Read only
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={localField.options.permanent}
              onChange={e => handleOptionChange('permanent', e.target.checked)}
            /> Permanent
          </label>
        </div>
        {/* Formula */}
        {localField.type === 'formula' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Formula (Excel)</label>
            <FormulaHelper
              value={localField.options.formula || ''}
              onChange={handleFormulaChange}
              placeholder="Unesite Excel formulu..."
              className="w-full"
              availableColumns={['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1']}
            />
            <div className="text-xs text-gray-500 mt-1">
              <strong>Podržane funkcije:</strong> SUM, AVERAGE, COUNT, MAX, MIN, IF, CONCAT, LEFT, RIGHT, LEN, AND, OR, TODAY, DATE, VLOOKUP
            </div>
          </div>
        )}
        {/* Dropdown opcije */}
        {localField.type === 'dropdown' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Opcije (svaka linija nova opcija)</label>
            <textarea
              className="input-field"
              rows={4}
              value={dropdownOptionsText}
              onChange={e => handleOptionChange('dropdownOptions', e.target.value.split('\n'))}
            />
          </div>
        )}
        {/* Google Sheets povezivanje */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Google Sheets kolona <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="input-field"
            value={localField.options.googleSheetColumn}
            onChange={e => handleOptionChange('googleSheetColumn', e.target.value)}
          />
        </div>
        {/* Import cell (nije obavezno) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Import iz ćelije (nije obavezno)</label>
          <input
            type="text"
            className="input-field"
            value={localField.options.importCell || ''}
            onChange={e => handleOptionChange('importCell', e.target.value)}
          />
        </div>

        {/* Smart Dropdown konfiguracija */}
        {localField.type === 'smart-dropdown' && (
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Smart Dropdown konfiguracija</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sheet tab</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.catalogTab || 'Import'}
                  onChange={e => handleOptionChange('catalogTab', e.target.value)}
                  placeholder="Import"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Naziv taba u Google Sheet-u (npr. "Proizvodi", "Katalozi")
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sheet kolona</label>
                <select
                  className="input-field"
                  value={localField.options.catalogColumn || 'F'}
                  onChange={e => handleOptionChange('catalogColumn', e.target.value)}
                >
                  <option value="A">A - Kolona A</option>
                  <option value="B">B - Kolona B</option>
                  <option value="C">C - Kolona C</option>
                  <option value="D">D - Kolona D</option>
                  <option value="E">E - Kolona E</option>
                  <option value="F">F - Šifra_proizvoda</option>
                  <option value="G">G - Naziv_proizvoda</option>
                  <option value="H">H - Dimenzije</option>
                  <option value="I">I - j/m</option>
                  <option value="J">J - Visina</option>
                  <option value="K">K - Širina</option>
                  <option value="L">L - Dužina</option>
                  <option value="M">M - m3</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Odaberite kolonu iz Sheet-a (A, B, C...)
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Linked grupa</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.linkedGroup || ''}
                  onChange={e => handleOptionChange('linkedGroup', e.target.value)}
                  placeholder="proizvod"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Naziv grupe za povezivanje dropdown-ova (npr. "proizvod" - svi dropdown-ovi sa istom grupom se povezuju)
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Zavisno polje (naziv)</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.dependencyField || ''}
                  onChange={e => handleOptionChange('dependencyField', e.target.value)}
                  placeholder="sumarija"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Naziv polja od kojeg zavisi ovaj dropdown (ostavite prazno ako nema zavisnosti)
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Zavisna kolona</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.dependencyColumn || ''}
                  onChange={e => handleOptionChange('dependencyColumn', e.target.value)}
                  placeholder="A"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kolona u katalogu koja se koristi za filtriranje (A, B, C...) - ostavite prazno ako nema zavisnosti
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* QR Lookup konfiguracija */}
        {localField.type === 'qr-scanner' && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">QR Lookup konfiguracija</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Naziv tabele</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.qrLookupConfig?.tableName || ''}
                  onChange={e => handleOptionChange('qrLookupConfig', {
                    ...localField.options.qrLookupConfig,
                    tableName: e.target.value
                  })}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kolona za pretragu</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.qrLookupConfig?.searchColumn || ''}
                  onChange={e => handleOptionChange('qrLookupConfig', {
                    ...localField.options.qrLookupConfig,
                    searchColumn: e.target.value
                  })}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kolone za vraćanje (odvojene zarezom)</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.qrLookupConfig?.returnColumns?.join(', ') || ''}
                  onChange={e => handleOptionChange('qrLookupConfig', {
                    ...localField.options.qrLookupConfig,
                    returnColumns: e.target.value.split(',').map(col => col.trim()).filter(col => col)
                  })}
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={localField.options.qrLookupConfig?.autoAddRows || false}
                    onChange={e => handleOptionChange('qrLookupConfig', {
                      ...localField.options.qrLookupConfig,
                      autoAddRows: e.target.checked
                    })}
                  /> Automatski dodaj redove za više rezultata
                </label>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mapiranje polja (JSON format)</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={JSON.stringify(localField.options.qrLookupConfig?.targetFields || [], null, 2)}
                  onChange={e => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleOptionChange('qrLookupConfig', {
                        ...localField.options.qrLookupConfig,
                        targetFields: parsed
                      });
                    } catch (err) {
                      // Ignoriši greške parsiranja
                    }
                  }}
                  placeholder='[{"fieldId": "field_1", "columnName": "naziv"}, {"fieldId": "field_2", "columnName": "cijena", "isUserInput": true}]'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dodajte "isUserInput": true za polja koja korisnik treba da popuni
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Google Sheets formule (JSON format)</label>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    Format:
                    <pre className="bg-gray-100 rounded p-2 mt-1 overflow-x-auto text-xs">{`[{"columnName": "ukupno", "formula": "A1 + B1", "description": "Sabiranje kolona A i B"}]`}</pre>
                  </div>
                  <textarea
                    className="input-field"
                    rows={4}
                    value={JSON.stringify(localField.options.qrLookupConfig?.googleSheetFormulas || [], null, 2)}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleOptionChange('qrLookupConfig', {
                          ...localField.options.qrLookupConfig,
                          googleSheetFormulas: parsed
                        });
                      } catch (err) {
                        // Ignoriši greške parsiranja
                      }
                    }}
                    placeholder='[{"columnName": "ukupno", "formula": "A1 + B1", "description": "Sabiranje kolona A i B"}]'
                  />
                  <div className="text-xs text-gray-500">
                    <strong>Formula helper:</strong> Koristite FormulaHelper komponentu za lakše pisanje formula
                  </div>
                  <div className="p-2 bg-blue-50 rounded border">
                    <div className="text-xs font-medium text-blue-700 mb-1">Primjer formule:</div>
                    <FormulaHelper
                      value=""
                      onChange={(value) => {
                        // Ovdje bi se mogla dodati logika za automatsko dodavanje u JSON
                      }}
                      placeholder="Testirajte formulu ovdje..."
                      className="w-full"
                      availableColumns={['cijena', 'kolicina', 'popust', 'ukupno']}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formule podržavaju reference na kolone (A1, B1) ili imena kolona
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* QR Generator konfiguracija */}
        {localField.type === 'qr-generator' && (
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Generator QR koda</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Način generisanja</label>
                <select
                  className="input-field"
                  value={localField.options.qrGeneratorConfig?.mode || 'random'}
                  onChange={e => handleOptionChange('qrGeneratorConfig', {
                    ...localField.options.qrGeneratorConfig,
                    mode: e.target.value
                  })}
                >
                  <option value="random">Random (UUID)</option>
                  <option value="params">Na osnovu parametara</option>
                  <option value="manual">Ručno</option>
                </select>
              </div>
              {localField.options.qrGeneratorConfig?.mode === 'params' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parametri (nazivi polja, odvojeni zarezom)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={localField.options.qrGeneratorConfig?.params?.join(',') || ''}
                    onChange={e => handleOptionChange('qrGeneratorConfig', {
                      ...localField.options.qrGeneratorConfig,
                      params: e.target.value.split(',').map(s => s.trim())
                    })}
                    placeholder="npr. broj_ponude, datum, korisnik"
                  />
                </div>
              )}
              {localField.options.qrGeneratorConfig?.mode === 'manual' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vrijednost QR koda</label>
                  <input
                    type="text"
                    className="input-field"
                    value={localField.options.qrGeneratorConfig?.value || ''}
                    onChange={e => handleOptionChange('qrGeneratorConfig', {
                      ...localField.options.qrGeneratorConfig,
                      value: e.target.value
                    })}
                    placeholder="Unesite vrijednost za QR kod"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Dinamičko polje konfiguracija */}
        {localField.type === 'dinamicko-polje' && (
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Dinamičko polje konfiguracija</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Naziv polja</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.dynamicSource?.label || ''}
                  onChange={e => handleOptionChange('dynamicSource', {
                    ...localField.options.dynamicSource,
                    label: e.target.value
                  })}
                  placeholder="Naziv za prikaz (opcionalno)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Izvor podataka</label>
                <select
                  className="input-field"
                  value={localField.options.dynamicSource?.sourceType || 'ponuda'}
                  onChange={e => handleOptionChange('dynamicSource', {
                    ...localField.options.dynamicSource,
                    sourceType: e.target.value
                  })}
                >
                  <option value="ponuda">Ponuda</option>
                  <option value="radni-nalog">Radni nalog</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!localField.options.dynamicSource?.scanEnabled}
                    onChange={e => handleOptionChange('dynamicSource', {
                      ...localField.options.dynamicSource,
                      scanEnabled: e.target.checked
                    })}
                  /> Prikaži dugme skeniraj
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!localField.options.dynamicSource?.inputEnabled}
                    onChange={e => handleOptionChange('dynamicSource', {
                      ...localField.options.dynamicSource,
                      inputEnabled: e.target.checked
                    })}
                  /> Prikaži polje za upis
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unique formula</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.dynamicSource?.uniqueFormula || ''}
                  onChange={e => handleOptionChange('dynamicSource', {
                    ...localField.options.dynamicSource,
                    uniqueFormula: e.target.value
                  })}
                  placeholder="=UNIQUE(...)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SUMIFS formula</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.dynamicSource?.sumifsFormula || ''}
                  onChange={e => handleOptionChange('dynamicSource', {
                    ...localField.options.dynamicSource,
                    sumifsFormula: e.target.value
                  })}
                  placeholder="=SUMIFS(...)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ciljna kolona (za formulu)</label>
                <input
                  type="text"
                  className="input-field"
                  value={localField.options.dynamicSource?.targetColumn || ''}
                  onChange={e => handleOptionChange('dynamicSource', {
                    ...localField.options.dynamicSource,
                    targetColumn: e.target.value
                  })}
                  placeholder="npr. kolicina"
                />
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Mapiranje kolona (napredno)</label>
                <div className="space-y-2">
                  {(() => {
                    const columnsMap = localField.options.dynamicSource?.columnsMap || [];
                    return columnsMap.map((col, idx) => (
                      <div key={idx} className="flex flex-wrap gap-2 items-center border-b pb-2 mb-2">
                        <input
                          type="text"
                          className="input-field w-24"
                          value={col.column || ''}
                          onChange={e => {
                            const newMap = [...columnsMap];
                            newMap[idx].column = e.target.value;
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }}
                          placeholder="Kolona (npr. B)"
                        />
                        <input
                          type="text"
                          className="input-field w-32"
                          value={col.label || ''}
                          onChange={e => {
                            const newMap = [...columnsMap];
                            newMap[idx].label = e.target.value;
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }}
                          placeholder="Naziv za prikaz"
                        />
                        <label className="flex items-center gap-1 text-xs">
                          <input type="radio" name={`searchCol${localField.id}`} checked={!!col.isSearch} onChange={() => {
                            const newMap = columnsMap.map((c, i) => ({ ...c, isSearch: i === idx }));
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }} /> Pretraga
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input type="radio" name={`uniqueCol${localField.id}`} checked={!!col.isUnique} onChange={() => {
                            const newMap = columnsMap.map((c, i) => ({ ...c, isUnique: i === idx }));
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }} /> Unique
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={!!col.show} onChange={e => {
                            const newMap = [...columnsMap];
                            newMap[idx].show = e.target.checked;
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }} /> Prikaz
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={!!col.editable} onChange={e => {
                            const newMap = [...columnsMap];
                            newMap[idx].editable = e.target.checked;
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }} /> Editable
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={!!col.readOnly} onChange={e => {
                            const newMap = [...columnsMap];
                            newMap[idx].readOnly = e.target.checked;
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }} /> ReadOnly
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={!!col.send} onChange={e => {
                            const newMap = [...columnsMap];
                            newMap[idx].send = e.target.checked;
                            handleOptionChange('dynamicSource', {
                              ...localField.options.dynamicSource,
                              columnsMap: newMap
                            });
                          }} /> Šalji
                        </label>
                        <button type="button" className="text-red-500 ml-2" onClick={() => {
                          const newMap = columnsMap.filter((_, i) => i !== idx);
                          handleOptionChange('dynamicSource', {
                            ...localField.options.dynamicSource,
                            columnsMap: newMap
                          });
                        }}>Obriši</button>
                      </div>
                    ));
                  })()}
                  <button type="button" className="btn-secondary mt-2" onClick={() => {
                    const columnsMap = localField.options.dynamicSource?.columnsMap || [];
                    const newMap = [...columnsMap, { column: '', label: '', show: true, editable: false, readOnly: false, send: false }];
                    handleOptionChange('dynamicSource', {
                      ...localField.options.dynamicSource,
                      columnsMap: newMap
                    });
                  }}>Dodaj kolonu</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Veličina polja */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Veličina polja (trenutna: {localField.position.width}px)</label>
          <select
            className="input-field"
            value={(() => {
              const { width } = localField.position;
              if (width <= 130) return 'xsmall';
              if (width <= 180) return 'small';
              if (width >= 420) return 'large';
              return 'medium';
            })()}
            onChange={e => {
              let width = 300;
              if (e.target.value === 'xsmall') { width = 80; }
              if (e.target.value === 'small') { width = 180; }
              if (e.target.value === 'medium') { width = 300; }
              if (e.target.value === 'large') { width = 420; }
              console.log('Mijenjam veličinu na:', width);
              handleChange('position', { ...localField.position, width });
            }}
          >
            <option value="xsmall">Uže (80px)</option>
            <option value="small">Malo (180px)</option>
            <option value="medium">Srednje (300px)</option>
            <option value="large">Veliko (420px)</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onDelete}
          className="btn-error"
        >
          Obriši polje
        </button>
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Zatvori
        </button>
      </div>
    </div>
  );
} 