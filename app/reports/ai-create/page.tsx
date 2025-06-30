'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import Header from '@/components/Header';

export default function AICreateReport() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSettings, setAdminSettings] = useState({ sheetName: '' });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [autoReport, setAutoReport] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Prvo pokušaj izvući admin status iz localStorage
    let role = localStorage.getItem('role');
    // Ako postoji globalni store ili token, koristi i to za provjeru admina
    if (!role && typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role === 'admin') role = 'admin';
        }
      } catch {}
    }
    setIsAdmin(role === 'admin');
    const savedSettings = localStorage.getItem('aiReportSettings');
    if (savedSettings) setAdminSettings(JSON.parse(savedSettings));
    const savedAllowedUsers = localStorage.getItem('aiAllowedUsers');
    if (savedAllowedUsers) {
      try { setAllowedUsers(JSON.parse(savedAllowedUsers)); } catch { setAllowedUsers([]); }
    }
    if (role === 'admin') fetch('/api/users').then(res => res.json()).then(setAllUsers);
  }, []);

  const handleSaveAdmin = () => {
    localStorage.setItem('aiReportSettings', JSON.stringify(adminSettings));
    localStorage.setItem('aiAllowedUsers', JSON.stringify(allowedUsers));
    alert('Podešavanja su sačuvana!');
  };

  const handleGenerate = async () => {
    if (!prompt) { setError('Molimo unesite opis šta želite da vidite u izvještaju'); return; }
    if (!adminSettings.sheetName) { setError('Admin treba da postavi Google Sheet podešavanja'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/ai-reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' },
        body: JSON.stringify({ prompt, sheetName: adminSettings.sheetName, allowedUsers }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Greška pri generisanju izvještaja'); }
      const data = await response.json(); setGeneratedReport(data.report);
    } catch (err) { setError(err instanceof Error ? err.message : 'Greška pri generisanju'); }
    finally { setLoading(false); }
  };

  const sendMessage = async (message: string) => {
    setChat(prev => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);
    try {
      const response = await fetch('/api/ai-reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' },
        body: JSON.stringify({ prompt: message, sheetName: adminSettings.sheetName, chat: [...chat, { role: 'user', content: message }], allowedUsers }),
      });
      const data = await response.json();
      if (data.report && (message.toLowerCase().includes('generiši') || message.toLowerCase().includes('napravi izvještaj') || message.toLowerCase().includes('izvještaj') || message.toLowerCase().includes('analiza'))) {
        setAutoReport(data.report);
      }
      setChat(prev => [...prev, { role: 'assistant', content: data.report?.sections?.find((s: any) => s.type === 'text')?.content || data.report?.description || 'AI nije vratio odgovor.' }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'assistant', content: 'Greška u komunikaciji sa AI-jem.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <Header />
      <BackButton className="mb-6" />
      {/* ADMIN PODEŠAVANJA */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">⚙️ Admin podešavanja AI izvještaja</h2>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
            <strong>💡 Admin podešavanja:</strong><br />
            • Postavite naziv tab-a koji će se koristiti za sve AI izvještaje<br />
            • Odaberite korisnike koji imaju pristup AI izvještajima<br />
            • Samo odabrani korisnici i admin mogu koristiti AI generator
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Naziv tab-a (Google Sheets)</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Sheet1, Podaci, Izvještaj2024"
              value={adminSettings.sheetName}
              onChange={e => setAdminSettings(prev => ({ ...prev, sheetName: e.target.value }))}
            />
            <div className="text-xs text-gray-500 mt-1">Naziv tab-a koji vidite na dnu Google Sheets dokumenta</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Korisnici sa pristupom AI izvještajima</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {allUsers.map(user => (
                <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={allowedUsers.includes(user.id)}
                    onChange={e => setAllowedUsers(prev => e.target.checked ? [...prev, user.id] : prev.filter(id => id !== user.id))}
                  />
                  <span className="text-sm">{user.username} ({user.role})</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">Odabrano korisnika: {allowedUsers.length}</div>
          </div>
          <button onClick={handleSaveAdmin} className="btn-secondary">💾 Sačuvaj podešavanja</button>
        </div>
      )}
      {/* AI GENERATOR */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">🤖 AI Generator izvještaja</h1>
        <p className="text-gray-600">Opisite šta želite da vidite u izvještaju na prirodnom jeziku, a AI će automatski generisati predložak izvještaja.</p>
      </div>
      {/* AI Chat interfejs */}
      <h2 className="text-lg font-semibold mb-4">AI Chat za izvještaje</h2>
      <div className="max-h-80 overflow-y-auto mb-4 space-y-2">
        {chat.map((msg, idx) => (
          <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'}`}>{msg.content}</div>
        ))}
        {chatLoading && <div className="p-2 text-gray-400">AI odgovara...</div>}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const input = form.elements.namedItem('chatInput') as HTMLInputElement;
          if (input.value.trim()) {
            sendMessage(input.value.trim());
            input.value = '';
          }
        }}
        className="flex gap-2 mb-8"
      >
        <input name="chatInput" className="input w-full" placeholder="Pitaj AI za analizu, izvještaj, preporuku..." />
        <button type="submit" className="btn-primary">Pošalji</button>
      </form>
      {/* Forma za unos prompta za AI izvještaj */}
      <h2 className="text-lg font-semibold mb-4">Unesite opis izvještaja</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Opis</label>
          <textarea
            className="input w-full h-32"
            placeholder="Npr: Napravi izvještaj prodaje po mjesecima sa grafikonom trendova..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">Opisite detaljno šta želite da vidite u izvještaju</div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="btn-primary w-full mt-6"
        >
          {loading ? 'Generiše se...' : '🤖 Generiši izvještaj'}
        </button>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">{error}</div>
        )}
        {generatedReport && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="text-lg font-semibold mb-2">AI Izvještaj</h3>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(generatedReport, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 