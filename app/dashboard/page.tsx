"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAppStore from "@/store/appStore";
import useStoreHydrated from "@/hooks/useStoreHydrated";

export default function Dashboard() {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const isHydrated = useStoreHydrated();

  // Ako nije hydrated, prikaži loading
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Ako nema korisnika, redirect na login
  if (!currentUser) {
    router.push('/login');
    return null;
  }

  // TEST: Jednostavan dashboard bez komponenti
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Dobrodošli, {currentUser.username}!
      </h1>
      <p className="text-gray-600 mb-4">
        Dashboard radi!
      </p>
      <button 
        onClick={() => router.push('/login')} 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Nazad
      </button>
    </div>
  );
} 