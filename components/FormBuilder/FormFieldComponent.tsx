'use client';

import React, { useEffect } from 'react';
import { FormField } from '@/types';
import useAppStore from '@/store/appStore';
import { toast } from 'react-hot-toast';

interface FormFieldComponentProps {
  field: FormField;
  // Props for form builder
  isSelected?: boolean;
  isDragging?: boolean;
  // Props for form filling
  isInputMode?: boolean;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function FormFieldComponent({
  field,
  isSelected = false,
  isDragging = false,
  isInputMode = false,
  value,
  onChange,
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
  if (field.options.hidden) {
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
        className: "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
  };

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
        // Dodati ostale tipove po potrebi
        default:
            return <div>{field.label}</div>
    }
  };

  return (
    <div style={builderStyle} className="form-field select-none">
      <label className="block text-xs font-medium mb-1" style={{color: field.styling.textColor}}>
        {field.label}
        {field.options.mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderBuilderField()}
    </div>
  );
} 