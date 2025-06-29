"use client";

import useAppStore from '@/store/appStore';
import { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import toast from 'react-hot-toast';

type ThemeName = 'facebook-light' | 'facebook-dark' | 'whatsapp-dark' | 'whatsapp-light' | 'slack' | 'discord';

const themeOptions: { value: ThemeName; label: string; preview: string }[] = [
  { value: 'facebook-light', label: 'Facebook Light', preview: '🌞' },
  { value: 'facebook-dark', label: 'Facebook Dark', preview: '🌚' },
  { value: 'whatsapp-dark', label: 'WhatsApp Dark', preview: '🟢' },
  { value: 'whatsapp-light', label: 'WhatsApp Light', preview: '⚪' },
  { value: 'slack', label: 'Slack', preview: '💜' },
  { value: 'discord', label: 'Discord', preview: '💙' },
];

export default function SettingsPage() {
  const { 
    setGlobalLogo,
    setLogoLocations,
    globalLogo,
    logoLocations,
    theme,
    setTheme,
  } = useAppStore();

  const [exportTab, setLocalExportTab] = useState('');
  const [importTab, setLocalImportTab] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [appIcon, setAppIcon] = useState<File | null>(null);
  const [appIconUrl, setAppIconUrl] = useState<string>('/icons/icon-192x192.png');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Niste prijavljeni. Molimo prijavite se ponovo.');
          return;
        }

        const res = await fetch('/api/app-settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        const parsedLocations = data.logoLocations ? JSON.parse(data.logoLocations) : [];
        setLocalExportTab(data.exportSheetTab || '');
        setLocalImportTab(data.importSheetTab || '');
        setLogoPreview(data.globalLogo || '');
        setGlobalLogo(data.globalLogo || '');
        setLogoLocations(parsedLocations);
        setAppIconUrl((data.appIcon && data.appIcon.length > 0 ? data.appIcon : '/icons/icon-192x192.png') + '?' + Date.now());
        
        // Postavi temu iz baze podataka
        if (data.theme) {
          setTheme(data.theme);
        }
      } catch (error) {
        console.error('Greška pri učitavanju podešavanja:', error);
        toast.error((error as Error).message || 'Neuspješno učitavanje podešavanja');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [setGlobalLogo, setLogoLocations]);

  // Automatsko čuvanje teme kada se promijeni
  useEffect(() => {
    const saveTheme = async () => {
      if (!theme) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch('/api/app-settings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            exportSheetTab: exportTab || 'Export',
            importSheetTab: importTab || 'Import',
            theme: theme 
          }),
        });
      } catch (error) {
        console.error('Greška pri čuvanju teme:', error);
      }
    };

    saveTheme();
  }, [theme, exportTab, importTab]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview('');
    }
  };

  const handleAppIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAppIcon(file);
    if (file) {
      // Upload na backend (ikona za prečac)
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload-app-icon', { 
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData 
      });
      const data = await res.json();
      if (res.ok) {
        setAppIconUrl(data.url + '?' + Date.now());
        // Odmah upiši u appSettings
        await fetch('/api/app-settings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ appIcon: '/icons/icon-192x192.png' }),
        });
        toast.success('Ikonica je uspješno postavljena!');
      } else {
        toast.error(data.error || 'Greška pri uploadu ikonice.');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Čuvanje podešavanja...');

    try {
      let logoPath = logoPreview;

      if (logo) {
        const formData = new FormData();
        formData.append('file', logo);
        const token = localStorage.getItem('token');
        const uploadRes = await fetch('/api/upload-image', { 
          method: 'POST', 
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData 
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Greška pri uploadu logo-a.');
        logoPath = uploadData.url;
      }

      // Uvijek koristi appIconUrl (ako je promijenjen, to je Firebase URL, inače default)
      const iconUrl = appIconUrl.includes('firebase') ? appIconUrl.split('?')[0] : '';

      const settingsToSave = {
        globalLogo: logoPath,
        appIcon: iconUrl,
        exportSheetTab: exportTab,
        importSheetTab: importTab,
        logoLocations: JSON.stringify(logoLocations), // Sačuvaj kao JSON string
        theme: theme, // Dodaj temu
      };

      const token = localStorage.getItem('token');
      const saveRes = await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsToSave),
      });

      if (!saveRes.ok) throw new Error('Greška pri čuvanju podešavanja.');
      const savedData = await saveRes.json();

      const parsedLocations = savedData.logoLocations ? JSON.parse(savedData.logoLocations) : [];
      setGlobalLogo(savedData.globalLogo || '');
      setLogoLocations(parsedLocations);

      if (savedData.appIcon) setAppIconUrl(savedData.appIcon + '?' + Date.now());

      toast.success('Podešavanja su uspješno sačuvana!', { id: toastId });

    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };
  
  if (loading) return <div className="p-8 text-center">Učitavanje...</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <BackButton className="mb-6" />
      <h2 className="text-lg font-bold mb-4">Podešavanja aplikacije</h2>
      <div className="mb-6">
        <label className="block mb-1 font-medium">Tema aplikacije</label>
        <div className="flex flex-col gap-2">
          {themeOptions.map(opt => (
            <label key={opt.value} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${theme === opt.value ? 'ring-2 ring-primary' : ''}`}>
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={theme === opt.value}
                onChange={() => setTheme(opt.value)}
              />
              <span className="text-xl">{opt.preview}</span>
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <form onSubmit={handleSave} className="mt-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Logo firme</label>
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-2 max-h-32" />}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Gdje prikazati logo?</label>
          <div className="flex flex-col gap-2">
            <label>
              <input
                type="checkbox"
                checked={logoLocations.includes('dashboard')}
                onChange={e => {
                  if (e.target.checked) {
                    setLogoLocations([...logoLocations, 'dashboard']);
                  } else {
                    setLogoLocations(logoLocations.filter(loc => loc !== 'dashboard'));
                  }
                }}
              /> Dashboard
            </label>
            <label>
              <input
                type="checkbox"
                checked={logoLocations.includes('forms')}
                onChange={e => {
                  if (e.target.checked) {
                    setLogoLocations([...logoLocations, 'forms']);
                  } else {
                    setLogoLocations(logoLocations.filter(loc => loc !== 'forms'));
                  }
                }}
              /> Sve forme
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Ikonica aplikacije (za prečac na ekranu)</label>
          <input type="file" accept="image/*" onChange={handleAppIconUpload} />
          <div className="mt-2">
            <img src={appIconUrl} alt="App Icon Preview" className="w-16 h-16 rounded border" />
            <div className="text-xs text-gray-500 mt-1">
              Preporučeno: PNG 192x192px ili veće. Podržani formati: PNG, JPG, GIF
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Ikonica će se automatski koristiti za favicon, PWA i Apple touch icon.
            </div>
          </div>
        </div>
        
        <h2 className="text-lg font-bold mb-4 mt-8">Google Sheets podešavanja</h2>
        <div className="mb-4">
          <label className="block mb-1">Tab za export</label>
          <input
            className="input-field"
            value={exportTab}
            onChange={e => setLocalExportTab(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Tab za import</label>
          <input
            className="input-field"
            value={importTab}
            onChange={e => setLocalImportTab(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary w-full">Sačuvaj podešavanja</button>
      </form>
    </div>
  );
} 