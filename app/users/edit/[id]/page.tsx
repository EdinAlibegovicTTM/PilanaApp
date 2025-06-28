"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import BackButton from '@/components/BackButton';
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [telefon, setTelefon] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    console.log('[EditUserPage] Učitavanje korisnika, ID:', id);
    fetch(`/api/users/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log('[EditUserPage] Korisnik učitán:', data);
        setUser(data);
        setUsername(data.username || "");
        setRole(data.role || "user");
        setIme(data.ime || "");
        setPrezime(data.prezime || "");
        setTelefon(data.telefon || "");
      })
      .catch(error => {
        console.error('[EditUserPage] Greška pri učitavanju korisnika:', error);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    console.log('[EditUserPage] Slanje zahtjeva za ažuriranje, ID:', id);
    
    try {
      const body: any = { username, role, ime, prezime, telefon };
      if (password) body.password = password;
      
      console.log('[EditUserPage] Podaci za slanje:', body);
      
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      console.log('[EditUserPage] Response status:', res.status, 'data:', data);
      
      if (!res.ok) {
        setError(data.error || "Greška pri izmjeni korisnika.");
        setLoading(false);
        return;
      }
      setSuccess("Korisnik uspješno izmijenjen!");
      setLoading(false);
      setTimeout(() => router.push('/users'), 1000);
    } catch (err) {
      console.error('[EditUserPage] Greška pri slanju zahtjeva:', err);
      setError("Greška pri izmjeni korisnika.");
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-gray-400">Učitavanje...</div>;

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header className="no-print" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <form
                className="bg-white p-8 rounded shadow max-w-md w-full"
                onSubmit={handleSubmit}
              >
                <BackButton className="mb-6" />
                <h2 className="text-2xl font-bold mb-6 text-center">Uredi korisnika</h2>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Korisničko ime</label>
                  <input type="text" className="input-field w-full" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Nova lozinka (ostavi prazno za bez promjene)</label>
                  <input type="password" className="input-field w-full" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Rola</label>
                  <select className="input-field w-full" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="user">Korisnik</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Ime</label>
                  <input type="text" className="input-field w-full" value={ime} onChange={e => setIme(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Prezime</label>
                  <input type="text" className="input-field w-full" value={prezime} onChange={e => setPrezime(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Telefon</label>
                  <input type="text" className="input-field w-full" value={telefon} onChange={e => setTelefon(e.target.value)} />
                </div>
                {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
                {success && <div className="text-green-600 mb-4 text-sm">{success}</div>}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? "Snima se..." : "Sačuvaj izmjene"}
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
} 