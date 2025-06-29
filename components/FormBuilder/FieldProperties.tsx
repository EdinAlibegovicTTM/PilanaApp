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
        
        {/* Veličina polja */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Veličina polja</label>
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
              handleChange('position', { ...localField.position, width });
            }}
          >
            <option value="xsmall">Uže</option>
            <option value="small">Malo</option>
            <option value="medium">Srednje</option>
            <option value="large">Veliko</option>
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