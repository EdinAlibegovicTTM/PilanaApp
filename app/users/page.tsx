"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from '@/components/BackButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Greška pri dohvatanju korisnika:', error);
        toast.error('Nije uspjelo dohvatanje korisnika.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleToggleActive = async (id: number, isActive: number) => {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: isActive ? 0 : 1 })
    });
    setUsers(users.map(u => u.id === id ? { ...u, isActive: isActive ? 0 : 1 } : u));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Da li ste sigurni da želite obrisati ovog korisnika?")) {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <BackButton className="mb-6" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Upravljanje korisnicima</h2>
          <button
            className="btn-primary"
            onClick={() => router.push("/users/create")}
          >
            + Novi korisnik
          </button>
        </div>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Korisničko ime</th>
              <th className="p-2">Ime</th>
              <th className="p-2">Prezime</th>
              <th className="p-2">Rola</th>
              <th className="p-2">Telefon</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="p-4 text-center text-gray-400">Učitavanje...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-400">Nema korisnika.</td>
              </tr>
            )}
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{user.username}</td>
                <td className="p-2">{user.ime}</td>
                <td className="p-2">{user.prezime}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">{user.telefon}</td>
                <td className="p-2">
                  <span className={
                    user.isActive !== 0
                      ? 'inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700'
                      : 'inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-500'
                  }>
                    {user.isActive !== 0 ? 'Aktivan' : 'Neaktivan'}
                  </span>
                </td>
                <td className="p-2 text-right space-x-2">
                  <button
                    className={
                      user.isActive !== 0
                        ? 'btn-secondary px-3 py-1'
                        : 'btn-success px-3 py-1'
                    }
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                  >
                    {user.isActive !== 0 ? 'Deaktiviraj' : 'Aktiviraj'}
                  </button>
                  <button
                    className="btn-secondary px-3 py-1"
                    onClick={() => router.push(`/users/edit/${user.id}`)}
                  >
                    Uredi
                  </button>
                  <button
                    className="btn-error px-3 py-1"
                    onClick={() => handleDelete(user.id)}
                  >
                    Obriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
} 