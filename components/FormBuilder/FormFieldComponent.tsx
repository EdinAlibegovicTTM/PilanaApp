'use client';

import React, { useEffect, useState } from 'react';
import { FormField } from '@/types';
import useAppStore from '@/store/appStore';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { EyeSlashIcon, StarIcon, LockClosedIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { QRCodeCanvas } from 'qrcode.react';

interface FormFieldComponentProps {
  field: FormField;
  // Props for form builder
  isSelected?: boolean;
  isDragging?: boolean;
  // Props for form filling
  isInputMode?: boolean;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isAutoFilled?: boolean; // Novo: flag za highlight automatski popunjenih polja
}

export default function FormFieldComponent({
  field,
  isSelected = false,
  isDragging = false,
  isInputMode = false,
  value,
  onChange,
  isAutoFilled = false, // Novo: flag za highlight
}: FormFieldComponentProps) {
  const { currentUser } = useAppStore();

  const displayValue = isInputMode ? value : field.options.defaultValue || '';

  // Automatsko popunjavanje korisnika
  useEffect(() => {
    if (isInputMode && field.type === 'user' && currentUser && onChange) {
      onChange({ target: { name: field.name, value: currentUser.username } } as any);
    }
  }, [isInputMode, field.type, field.name, currentUser, onChange]);

  // Automatsko popunjavanje datetime polja
  useEffect(() => {
    if (isInputMode && field.type === 'datetime' && onChange && (!value || value === '')) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      onChange({ target: { name: field.name, value: localDateTime } } as any);
    }
  }, [isInputMode, field.type, field.name, onChange, value]);

  // Prikaži toast obavijest prvi put kad korisnik koristi geolokaciju
  useEffect(() => {
    if (isInputMode && typeof window !== 'undefined') {
      const shown = localStorage.getItem('geo_permission_info');
      if (!shown) {
        toast('Dozvolite pristup lokaciji za automatsko popunjavanje ovog polja. Ako želite da vas više ne pita, označite "Always allow" u postavkama browsera.', { duration: 8000 });
        localStorage.setItem('geo_permission_info', '1');
      }
    }
  }, []);

  // Sakrivanje polja ako je opcija hidden
  if (field.options.hidden && isInputMode) {
    return null;
  }

  if (isInputMode) {
    // Render polja za unos podataka
    const renderInputField = () => {
      const commonProps = {
        name: field.name,
        placeholder: field.options.placeholder,
        value: value || '',
        onChange: onChange,
        required: field.options.mandatory,
        className: `w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          isAutoFilled ? 'bg-blue-50 border-blue-300' : ''
        }` // Novo: vizualni highlight za automatski popunjena polja
      };

      switch (field.type) {
        case 'text':
          return <input type="text" {...commonProps} />;
        case 'number':
          return <input type="number" {...commonProps} />;
        case 'date':
          return <input type="date" {...commonProps} />;
        case 'datetime':
            return <input type="datetime-local" {...commonProps} />;
        case 'textarea':
          return <textarea {...commonProps} rows={4} />;
        case 'dropdown':
          return (
            <select {...commonProps}>
              <option value="">{field.options.placeholder || 'Odaberite...'}</option>
              {field.options.dropdownOptions?.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          );
        case 'smart-dropdown':
          return <SmartDropdown field={field} {...commonProps} />;
        case 'checkbox':
          return (
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id={field.id}
                name={field.name}
                checked={!!value}
                onChange={onChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={field.id} className="ml-2 block text-sm text-gray-900">
                {field.label}
              </label>
            </div>
          );
        case 'user':
          // Automatski popunjeno polje korisnika
          return <input type="text" {...commonProps} value={currentUser?.username || ''} readOnly />;
        case 'geolocation':
        case 'qr-scanner': {
          let buttonLabel = 'Popuni';
          if (field.type === 'geolocation') buttonLabel = 'Lokacija';
          if (field.type === 'qr-scanner') buttonLabel = 'Skeniraj';

          return (
            <div className="flex gap-2">
              <input 
                type="text" 
                {...commonProps} 
                placeholder={field.type === 'geolocation' ? 'Lokacija će biti automatski popunjena pri slanju' : commonProps.placeholder}
              />
              {field.type === 'qr-scanner' && (
                <button 
                  type="button" 
                  onClick={() => onChange && onChange({ target: { name: field.name, value: `trigger_${field.type}` } } as any)}
                  className="btn-secondary whitespace-nowrap"
                >
                  {buttonLabel}
                </button>
              )}
            </div>
          )
        }
        case 'formula':
            return <input type="text" {...commonProps} value={value || 'Formula'} readOnly />;
        case 'dinamicko-polje': {
          const dynamic = field.options.dynamicSource as Partial<{
            label: string;
            sourceType: string;
            scanEnabled: boolean;
            inputEnabled: boolean;
            uniqueFormula: string;
            sumifsFormula: string;
            targetColumn: string;
          }> || {};
          return (
            <div className="flex flex-col gap-2">
              {dynamic.label && <label className="text-xs font-medium text-gray-700">{dynamic.label}</label>}
              <div className="flex gap-2">
                {dynamic.inputEnabled && (
                  <input
                    type="text"
                    name={field.name}
                    placeholder={field.options.placeholder || 'Unesite vrijednost ili skenirajte...'}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
                {dynamic.scanEnabled && (
                  <button
                    type="button"
                    className="btn-secondary whitespace-nowrap"
                    onClick={() => {
                      // Ovdje možeš integrisati QR/Barcode skener logiku
                      if (onChange) {
                        onChange({ target: { name: field.name, value: 'SKENIRANO' } } as any);
                      }
                    }}
                  >
                    Skeniraj
                  </button>
                )}
              </div>
              {/* Prikaz rezultata/formula po potrebi */}
              {dynamic.uniqueFormula && (
                <div className="text-xs text-blue-600 mt-1">Unique formula: {dynamic.uniqueFormula}</div>
              )}
              {dynamic.sumifsFormula && (
                <div className="text-xs text-green-600 mt-1">SUMIFS formula: {dynamic.sumifsFormula}</div>
              )}
            </div>
          );
        }
        case 'qr-generator': {
          const qrConfig = field.options.qrGeneratorConfig as Partial<{
            mode: 'random' | 'params' | 'manual';
            params?: string[];
            value?: string;
          }> || {};
          const qrValue =
            qrConfig.mode === 'manual'
              ? value || ''
              : qrConfig.mode === 'random'
              ? value || ''
              : qrConfig.mode === 'params'
              ? value || ''
              : '';
          return (
            <div className="flex flex-col gap-2">
              {qrConfig.mode === 'manual' && (
                <input
                  type="text"
                  name={field.name}
                  placeholder={field.options.placeholder || 'Unesite vrijednost za QR kod'}
                  value={value || ''}
                  onChange={onChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              )}
              {qrConfig.mode === 'random' && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                    if (onChange) {
                      onChange({ target: { name: field.name, value: uuid } } as any);
                    }
                  }}
                >
                  Generiši random QR kod
                </button>
              )}
              {qrConfig.mode === 'params' && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    // Kombinuj vrijednosti parametara iz formData (nije implementirano ovdje, placeholder)
                    if (onChange) {
                      onChange({ target: { name: field.name, value: 'PARAMS_KOD' } } as any);
                    }
                  }}
                >
                  Generiši QR kod iz parametara
                </button>
              )}
              {/* Prikaz QR koda */}
              {qrValue && (
                <div className="flex flex-col items-center mt-2">
                  <QRCodeCanvas value={qrValue} size={128} />
                  <div className="text-xs text-gray-500 mt-1">{qrValue}</div>
                </div>
              )}
            </div>
          );
        }
        default:
          return <input type="text" {...commonProps} />;
      }
    };

    if (field.type === 'checkbox') return renderInputField();

    return (
      <div className="w-full">
        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.options.mandatory && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInputField()}
      </div>
    );
  }

  // Originalni kod za prikaz u Form Builder-u
  const builderStyle: React.CSSProperties = {
    backgroundColor: field.styling.backgroundColor,
    color: field.styling.textColor,
    borderColor: field.styling.borderColor,
    fontSize: field.styling.fontSize,
    fontWeight: field.styling.fontWeight as any,
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    padding: 8,
    boxSizing: 'border-box',
    opacity: isDragging ? 0.7 : 1,
    transition: 'box-shadow 0.2s',
    boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
    position: 'relative',
  };

  // Badge prikaz za opcije (moderni dizajn s ikonama)
  const optionBadges = (
    <div className="absolute top-2 right-20 flex gap-1 z-40">
      {field.options.permanent && (
        <span title="Permanentno polje" className="group relative">
          <LockClosedIcon className="w-4 h-4 text-blue-500 bg-white rounded-full shadow p-0.5 group-hover:scale-110 transition" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none transition">Permanentno</span>
        </span>
      )}
      {field.options.hidden && (
        <span title="Skriveno polje" className="group relative">
          <EyeSlashIcon className="w-4 h-4 text-gray-500 bg-white rounded-full shadow p-0.5 group-hover:scale-110 transition" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none transition">Skriveno</span>
        </span>
      )}
      {field.options.readOnly && (
        <span title="Samo za čitanje" className="group relative">
          <DocumentMagnifyingGlassIcon className="w-4 h-4 text-gray-400 bg-white rounded-full shadow p-0.5 group-hover:scale-110 transition" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-500 text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none transition">Samo za čitanje</span>
        </span>
      )}
      {field.options.mandatory && (
        <span title="Obavezno polje" className="group relative">
          <StarIcon className="w-4 h-4 text-red-500 bg-white rounded-full shadow p-0.5 group-hover:scale-110 transition" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none transition">Obavezno</span>
        </span>
      )}
    </div>
  );

  const renderBuilderField = () => {
    switch (field.type) {
        case 'text':
          return (
            <input type="text" className="input-field" placeholder={field.options.placeholder} value={displayValue} readOnly />
          );
        case 'number':
          return (
            <input type="number" className="input-field" placeholder={field.options.placeholder} value={displayValue} readOnly />
          );
        case 'date':
            return <input type="date" className="input-field" value={displayValue} readOnly />;
        case 'datetime':
            return <input type="datetime-local" className="input-field" value={displayValue} readOnly />;
        case 'textarea':
            return <textarea className="input-field" value={displayValue} readOnly />;
        case 'dropdown':
          return (
            <select className="input-field" disabled>
              <option>{field.options.placeholder || 'Odaberite opciju'}</option>
              {field.options.dropdownOptions?.map((opt, idx) => (
                <option key={idx}>{opt}</option>
              ))}
            </select>
          );
        case 'smart-dropdown':
          return (
            <div className="input-field bg-gray-100 text-gray-500">
              Smart Dropdown - {field.options.catalogTab || 'Tab'} / {field.options.catalogColumn || 'Kolona'}
            </div>
          );
        // Dodati ostale tipove po potrebi
        default:
            return <div>{field.label}</div>
    }
  };

  return (
    <div style={builderStyle}>
      {optionBadges}
      <label className="block text-xs font-medium mb-1" style={{color: field.styling.textColor}}>
        {field.label}
        {field.options.mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderBuilderField()}
    </div>
  );
}

// SmartDropdown komponenta za zavisne dropdown-ove
interface SmartDropdownProps {
  field: FormField;
  name: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
}

function SmartDropdown({ field, name, placeholder, value, onChange, required, className }: SmartDropdownProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { currentUser } = useAppStore();

  // Dohvati opcije iz kataloga
  const fetchOptions = async (dependencyValue?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tab: field.options.catalogTab || 'Import',
        column: field.options.catalogColumn || 'F'
      });

      // Ako ima zavisnost, dodaj parametre
      if (field.options.dependencyField && dependencyValue) {
        params.append('dependencyColumn', field.options.dependencyColumn || 'A');
        params.append('dependencyValue', dependencyValue);
      }

      const response = await axios.get(`/api/catalogs?${params}`);
      setOptions(response.data.options || []);
    } catch (error) {
      console.error('Greška pri dohvatanju opcija:', error);
      toast.error('Greška pri učitavanju opcija');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Učitaj opcije pri mount-u
  useEffect(() => {
    fetchOptions();
  }, [field.options.catalogTab, field.options.catalogColumn]);

  // T9 pretraga
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    if (onChange) {
      const event = {
        target: { value: selectedValue }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        placeholder={loading ? 'Učitavanje...' : (placeholder || 'Pretražite i odaberite...')}
        className={className || "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"}
        disabled={loading}
      />
      
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">Nema rezultata</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Sakrij dropdown kad klikneš van njega */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 