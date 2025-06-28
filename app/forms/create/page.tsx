'use client';

import React, { useEffect, useState, Suspense } from 'react';
import FormBuilder from '@/components/FormBuilder/FormBuilder';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import BackButton from '@/components/BackButton';
import { FormConfig } from '@/types';
import { toast } from 'react-hot-toast';

function CreateFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [formConfig, setFormConfig] = useState<FormConfig | undefined>(undefined);
  const [loading, setLoading] = useState(!!editId);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (editId) {
      fetch(`/api/forms/${editId}`)
        .then(res => res.json())
        .then(data => {
          setFormConfig({
            ...data,
            fields: data.fields ? (typeof data.fields === 'string' ? JSON.parse(data.fields) : data.fields) : [],
            allowedUsers: data.allowedUsers ? (typeof data.allowedUsers === 'string' ? JSON.parse(data.allowedUsers) : data.allowedUsers) : [],
            layout: data.layout || { columns: 1, backgroundColor: '#ffffff', gridSize: 20 },
          });
          setLoading(false);
        });
    }
  }, [editId]);

  const handleSave = (config: FormConfig) => {
    const updatedConfig = {
      ...config,
      image: imagePreview || config.image || '',
      layout: {
        ...config.layout,
        backgroundColor: config.layout.backgroundColor,
      },
    };
    if (editId) {
      fetch(`/api/forms/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      }).then(() => router.push('/forms'));
    } else {
      fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      }).then(() => router.push('/forms'));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      // Upload na Firebase Storage
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImagePreview(data.url);
        // Ako editujemo formu, odmah ažuriraj image u formConfig
        if (formConfig) setFormConfig({ ...formConfig, image: data.url });
        toast.success('Slika je uspješno uploadovana!');
      } else {
        toast.error(data.error || 'Greška pri uploadu slike.');
      }
    } else {
      setImagePreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image && !imagePreview) {
      toast.error('Slika je obavezna!');
      return;
    }
    
    // Ako imamo sliku ali nije uploadovana, uploaduj je prvo
    if (image && !imagePreview.includes('firebase')) {
      const formData = new FormData();
      formData.append('file', image);
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImagePreview(data.url);
      } else {
        toast.error(data.error || 'Greška pri uploadu slike.');
        return;
      }
    }
    
    // Zatim kreiraj formu s putanjom slike
    // ... pozovi API za kreiranje forme, proslijedi imagePreview kao image ...
  };

  if (loading) return <div className="p-8 text-center">Učitavanje...</div>;

  return (
    <AuthGuard>
      <div className="min-h-screen w-full bg-gray-100 p-0 m-0">
        <form
          className="bg-white p-0 rounded shadow w-full h-full"
          onSubmit={handleSubmit}
        >
          <div className="px-8 pt-8">
            <BackButton className="mb-6" />
            <h2 className="text-2xl font-bold mb-6">Kreiraj formu</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Slika forme <span className="text-red-500">*</span></label>
              <label className="flex items-center cursor-pointer w-fit bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-4 py-2 transition-colors">
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-2 text-gray-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12' /></svg>
                <span className="text-gray-700">Izaberi sliku</span>
                <input type="file" accept="image/*" onChange={handleImageChange} required className="hidden" />
              </label>
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 max-h-40 rounded-lg border border-gray-200 shadow" />}
            </div>
          </div>
          <FormBuilder
            formConfig={formConfig}
            onSave={handleSave}
            onCancel={() => router.push('/forms')}
            extraAction={
              !editId ? (
                <button type="submit" className="btn-primary">Kreiraj formu</button>
              ) : null
            }
          />
        </form>
      </div>
    </AuthGuard>
  );
}

export default function CreateFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Učitavanje...</div>}>
      <CreateFormContent />
    </Suspense>
  );
} 