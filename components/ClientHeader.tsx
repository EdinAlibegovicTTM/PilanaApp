"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientHeader({ className }: { className?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    function syncUser() {
      setUser(localStorage.getItem("currentUser"));
      setRole(localStorage.getItem("currentUserRole"));
    }
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserRole");
    router.push("/login");
  };

  return (
    <header className={`w-full bg-gray-900 text-white py-2 px-4 flex items-center justify-between ${className || ''}`}>
      <span className="font-bold text-lg">Pilana App</span>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Prijavljen: <b>{user}</b> ({role})
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Odjava
          </button>
        </div>
      )}
    </header>
  );
} 