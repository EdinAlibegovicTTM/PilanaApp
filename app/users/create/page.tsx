"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from '@/components/BackButton';

export default function CreateUserPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [telefon, setTelefon] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const email = username ? `${username}@dummy.local` : `user${Date.now()}@dummy.local`;
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role, ime, prezime, telefon }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Greška pri dodavanju korisnika.");
        setLoading(false);
        return;
      }
      setSuccess("Korisnik uspješno dodan!");
      setUsername(""); setPassword(""); setIme(""); setPrezime(""); setTelefon("");
      setRole("user");
      setLoading(false);
      setTimeout(() => router.push('/users'), 1000);
    } catch (err) {
      setError("Greška pri dodavanju korisnika.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 rounded shadow max-w-md w-full"
        onSubmit={handleSubmit}
      >
        <BackButton className="mb-6" />
        <h2 className="text-2xl font-bold mb-6 text-center">Dodaj korisnika</h2>
        <div className="mb-4">
          <label className="block text-sm mb-1">Korisničko ime</label>
          <input type="text" className="input-field w-full" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Lozinka</label>
          <input type="password" className="input-field w-full" value={password} onChange={e => setPassword(e.target.value)} required />
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
          {loading ? "Dodavanje..." : "Dodaj korisnika"}
        </button>
      </form>
    </div>
  );
} 