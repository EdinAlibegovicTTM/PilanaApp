'use client';

import React, { useState, useEffect } from 'react';
import { FormConfig, FormField, FieldType } from '@/types';
import FieldPalette from './FieldPalette';
import FormCanvas from './FormCanvas';
import FieldProperties from './FieldProperties';
import { 
  CogIcon, 
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface FormBuilderProps {
  formConfig?: FormConfig;
  onSave: (config: FormConfig) => void;
  onCancel: () => void;
  extraAction?: React.ReactNode;
}

const defaultFormConfig: FormConfig = {
  id: '',
  name: 'Nova forma',
  description: '',
  fields: [],
  layout: {
    columns: 1,
    backgroundColor: '#ffffff',
    gridSize: 20,
  },
  googleSheetId: '',
  googleSheetName: '',
  requiresConfirmation: false,
  confirmationRoles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: '',
  isActive: true,
};

export default function FormBuilder({ formConfig, onSave, extraAction }: FormBuilderProps) {
  const [config, setConfig] = useState<FormConfig>(formConfig || defaultFormConfig);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSnap, setGridSnap] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [showProperties, setShowProperties] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [fixedLayout, setFixedLayout] = useState(config.fixedLayout || false);

  useEffect(() => {
    // Dohvati sve korisnike (za admina)
    fetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error('Greška u API-ju');
        return res.json();
      })
      .then(data => setAllUsers(data))
      .catch(err => {
        setAllUsers([]);
        alert('Greška pri dohvatu korisnika: ' + err.message);
      });
  }, []);

  const createFieldFromType = (type: FieldType, index: number): FormField => {
    const fieldId = `field_${Date.now()}_${index}`;
    const y = config.fields.length > 0
      ? (config.fields[config.fields.length - 1].position?.y || 0) + (config.fields[config.fields.length - 1].position?.height || 60) + 30
      : 20;

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

    return {
      id: fieldId,
      type,
      label: `Polje ${index + 1}`,
      name: `field_${index + 1}`,
      options: {
        permanent: false,
        mandatory: false,
        readOnly: false,
        hidden: false,
        googleSheetColumn: `A${index + 1}`,
        defaultValue: type === 'date' ? new Date().toLocaleDateString('bs-BA') : 
                    type === 'datetime' ? getLocalDateTime() : '',
        placeholder: `Unesite ${getFieldTypeLabel(type)}`,
      },
      position: {
        x: 20,
        y,
        width: 300,
        height: 60,
      },
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#d1d5db',
        fontSize: 14,
        fontWeight: 'normal',
      },
    };
  };

  const getFieldTypeLabel = (type: FieldType): string => {
    const labels = {
      text: 'tekst',
      number: 'broj',
      date: 'datum',
      dropdown: 'padajuća lista',
      'qr-scanner': 'QR skener',
      geolocation: 'lokaciju',
      datetime: 'datum i vrijeme',
      user: 'korisnika',
      formula: 'formulu',
      'smart-dropdown': 'pametnu listu',
      textarea: 'tekstualno polje',
      checkbox: 'checkbox',
    };
    return labels[type] || 'vrijednost';
  };

  const handleFieldSelect = (field: FormField) => {
    setSelectedField(field);
    setShowProperties(true);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
    
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleFieldDelete = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
      setShowProperties(false);
    }
  };

  const handleFieldsReorder = (newFields: FormField[]) => {
    setConfig(prev => ({
      ...prev,
      fields: newFields
    }));
  };

  const handleAddField = (fieldType: FieldType) => {
    const newField = createFieldFromType(fieldType, config.fields.length);
    
    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField);
    setShowProperties(true);
  };

  const handleSave = () => {
    const updatedConfig = {
      ...config,
      backgroundColor: config.layout.backgroundColor, // eksplicitno šaljemo na root
      fixedLayout,
      allowedUsers: config.allowedUsers || [],
      updatedAt: new Date(),
    };
    onSave(updatedConfig);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-xs text-gray-500">Naziv forme:</label>
                <input
                  type="text"
                  className="text-lg font-semibold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none px-1"
                  value={config.name}
                  onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Naziv forme"
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-xs text-gray-500">Pozadina:</label>
                <input
                  type="color"
                  value={config.layout.backgroundColor}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    layout: { ...prev.layout, backgroundColor: e.target.value }
                  }))}
                  className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                  title="Izaberi boju pozadine"
                />
                <span className="text-xs text-gray-400">{config.layout.backgroundColor}</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-xs text-gray-500">Status:</label>
                <select
                  className="text-xs border rounded px-2 py-1"
                  value={config.isActive ? 'active' : 'inactive'}
                  onChange={e => setConfig(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                >
                  <option value="active">Aktivna</option>
                  <option value="inactive">Neaktivna</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-xs text-gray-500">Pristup formi imaju:</label>
                <div className="flex flex-wrap gap-2">
                  {allUsers.map(user => (
                    <label key={user.username} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={config.allowedUsers?.includes(user.username)}
                        onChange={e => {
                          setConfig(prev => ({
                            ...prev,
                            allowedUsers: e.target.checked
                              ? [...(prev.allowedUsers || []), user.username]
                              : (prev.allowedUsers || []).filter((u: string) => u !== user.username)
                          }));
                        }}
                      />
                      {user.username} ({user.role})
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-xs text-gray-500">Prikaz forme:</label>
                <select
                  className="text-xs border rounded px-2 py-1"
                  value={fixedLayout ? 'fixed' : 'responsive'}
                  onChange={e => setFixedLayout(e.target.value === 'fixed')}
                >
                  <option value="responsive">Responsive</option>
                  <option value="fixed">Kao u builderu</option>
                </select>
              </div>
              <p className="text-sm text-gray-500">Kreirajte i uređujte forme</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-lg ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showGrid ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setGridSnap(!gridSnap)}
                className={`p-2 rounded-lg ${gridSnap ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <CogIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                -
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                +
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="btn-primary"
              >
                Sačuvaj formu
              </button>
              {extraAction}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-row min-w-0">
        {/* Field Palette */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Polja</h2>
            <p className="text-sm text-gray-500">Kliknite na polje da ga dodate</p>
          </div>
          <FieldPalette onAddField={handleAddField} />
        </div>

        {/* Form Canvas */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          <FormCanvas
            config={config}
            selectedField={selectedField}
            onFieldSelect={handleFieldSelect}
            onFieldUpdate={handleFieldUpdate}
            onFieldDelete={handleFieldDelete}
            onFieldsReorder={handleFieldsReorder}
            showGrid={showGrid}
            gridSnap={gridSnap}
            zoom={zoom}
            fixedLayout={fixedLayout}
          />
        </div>

        {/* Field Properties */}
        {showProperties && selectedField && (
          <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0">
            <FieldProperties
              field={selectedField}
              onUpdate={(updates) => handleFieldUpdate(selectedField.id, updates)}
              onDelete={() => handleFieldDelete(selectedField.id)}
              onClose={() => {
                setShowProperties(false);
                setSelectedField(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 