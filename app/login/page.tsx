"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppStore from "@/store/appStore";
import useStoreHydrated from "@/hooks/useStoreHydrated";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setCurrentUser, currentUser } = useAppStore();
  const isHydrated = useStoreHydrated();

  useEffect(() => {
    // Ako je već prijavljen, idi na dashboard
    if (isHydrated && currentUser) {
      router.push("/dashboard");
    }
  }, [isHydrated, currentUser, router]);

  // Automatska validacija tokena ako postoji
  useEffect(() => {
    if (!isHydrated) return;
    
    const token = localStorage.getItem("token");
    if (token && !currentUser) {
      // Pokušaj validirati postojeći token
      axios.post("/api/auth/verify", {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data && res.data.user) {
          setCurrentUser(res.data.user);
          router.push("/dashboard");
        } else {
          localStorage.removeItem("token");
        }
      }).catch(() => {
        localStorage.removeItem("token");
      });
    }
  }, [isHydrated, currentUser, setCurrentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post("/api/auth/login", { username, password });
      const { user, token } = response.data;
      
      // Spremi token
      localStorage.setItem("token", token);
      
      // Postavi korisnika u store
      setCurrentUser(user);
      
      toast.success("Uspješna prijava!");
      router.push("/dashboard");
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Greška pri prijavi");
    } finally {
      setLoading(false);
    }
  };

  // Ako nije hydrated, prikaži loading
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Ako je već prijavljen, ne prikazuj login formu
  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 rounded shadow max-w-sm w-full"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Prijava</h2>
        <div className="mb-4">
          <label className="block text-sm mb-1">Korisničko ime</label>
          <input
            type="text"
            className="input-field w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Lozinka</label>
          <input
            type="password"
            className="input-field w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Prijava..." : "Prijavi se"}
        </button>
      </form>
    </div>
  );
} 