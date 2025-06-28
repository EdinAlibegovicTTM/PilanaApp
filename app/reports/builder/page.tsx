'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

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

function ReportBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selected, setSelected] = useState<ReportTemplate | null>(null);
  const [paramValues, setParamValues] = useState<any>({});
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/report-templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTemplates(data);
          // Ako je ID proslijeđen kroz URL, automatski odaberi taj template
          const templateId = searchParams.get('id');
          if (templateId) {
            const template = data.find((t: ReportTemplate) => t.id.toString() === templateId);
            if (template) {
              setSelected(template);
            }
          }
        } else {
          setTemplates([]);
        }
      })
      .catch(() => setTemplates([]));
  }, [searchParams]);

  const renderParamField = (param: any, value: any, onChange: (v: any) => void) => {
    switch (param.type) {
      case 'text':
        return (
          <input 
            type="text" 
            className="input w-full" 
            value={value || ''} 
            onChange={e => onChange(e.target.value)} 
            title={param.description || param.name} 
          />
        );
      case 'date':
        return (
          <input 
            type="date" 
            className="input w-full" 
            value={value || ''} 
            onChange={e => onChange(e.target.value)} 
          />
        );
      case 'dropdown':
        return (
          <select 
            className="input w-full" 
            value={value || ''} 
            onChange={e => onChange(e.target.value)} 
            title={param.description || param.name}
          >
            <option value="">Izaberi...</option>
            {param.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const generateReport = async () => {
    if (!selected) {
      toast.error('Molimo izaberite šablon izvještaja');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports-google-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: selected.id,
          parameters: paramValues
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri generisanju izvještaja');
      }

      const data = await response.json();
      setReportData(data);
      toast.success('Izvještaj je uspješno generisan!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">Izveštaj Builder</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista šablona */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Dostupni šabloni</h2>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selected?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelected(template)}
              >
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Google Sheet: {template.googleSheetName}
                </p>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Nema dostupnih šablona izvještaja
              </p>
            )}
          </div>
        </div>

        {/* Parametri i generisanje */}
        <div>
          {selected ? (
            <>
              <h2 className="text-lg font-semibold mb-4">
                Parametri za: {selected.name}
              </h2>
              
              <div className="space-y-4 mb-6">
                {(() => {
                  try {
                    const params = JSON.parse(selected.parameters);
                    return params.map((param: any) => (
                      <div key={param.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {param.name}
                          {param.required && <span className="text-red-500"> *</span>}
                        </label>
                        {renderParamField(
                          param,
                          paramValues[param.name],
                          (value) => setParamValues((prev: any) => ({ ...prev, [param.name]: value }))
                        )}
                        {param.description && (
                          <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                        )}
                      </div>
                    ));
                  } catch (e) {
                    return <p className="text-red-500">Greška pri parsiranju parametara</p>;
                  }
                })()}
              </div>

              <button
                onClick={generateReport}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Generisanje...' : 'Generiši izveštaj'}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Izaberite šablon izvještaja da vidite parametre
              </p>
            </div>
          )}
        </div>
      </div>

      {reportData && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Rezultat</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Učitavanje...</div>}>
      <ReportBuilderContent />
    </Suspense>
  );
} 