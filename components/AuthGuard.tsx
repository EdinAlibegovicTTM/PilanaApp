"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAppStore from "@/store/appStore";
import useStoreHydrated from "@/hooks/useStoreHydrated";

const AUTH_ROUTES = ['/login'];
const PUBLIC_ROUTES = ['/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAppStore();
  const isHydrated = useStoreHydrated();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isHydrated || hasCheckedAuth) return;

      const token = localStorage.getItem('token');
      
      if (!token) {
        setHasCheckedAuth(true);
        setIsLoading(false);
        router.push('/login');
        return;
      }

      if (currentUser) {
        setHasCheckedAuth(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });
        
        if (response.ok) {
          const { user } = await response.json();
          setCurrentUser(user);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setHasCheckedAuth(true);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isHydrated, currentUser, router, setCurrentUser, hasCheckedAuth]);

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
} 