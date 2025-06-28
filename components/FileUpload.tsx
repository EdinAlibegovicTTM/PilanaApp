'use client';

import { useState } from 'react';

interface FileUploadProps {
  onFileUpload: (content: string, filename: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // u MB
}

export default function FileUpload({ 
  onFileUpload, 
  acceptedTypes = ['.md', '.txt', '.json'], 
  maxSize = 5 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (file: File) => {
    setError('');
    
    // Provjeri veličinu
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fajl je prevelik. Maksimalna veličina je ${maxSize}MB.`);
      return;
    }

    // Provjeri tip
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setError(`Nepodržan tip fajla. Dozvoljeni tipovi: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Čitaj fajl
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(content, file.name);
    };
    reader.onerror = () => {
      setError('Greška pri čitanju fajla.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          <div className="text-lg font-medium text-gray-700">
            Prevucite fajl ovdje ili kliknite za odabir
          </div>
          <div className="text-sm text-gray-500">
            Podržani tipovi: {acceptedTypes.join(', ')}
          </div>
          <div className="text-xs text-gray-400">
            Maksimalna veličina: {maxSize}MB
          </div>
        </div>
        
        <input
          id="file-input"
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 