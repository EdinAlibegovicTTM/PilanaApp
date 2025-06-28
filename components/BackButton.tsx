"use client";
import { useRouter } from "next/navigation";
import useAppStore from '@/store/appStore';

export default function BackButton({ className = '', toDashboard = false }: { className?: string, toDashboard?: boolean }) {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const handleClick = () => {
    if (toDashboard) {
      if (currentUser && Array.isArray(currentUser.permissions)) {
        const canForms = currentUser.permissions.includes('forms');
        const canReports = currentUser.permissions.includes('reports');
        if (canForms && !canReports) {
          router.push('/forms');
          return;
        } else if (!canForms && canReports) {
          router.push('/reports');
          return;
        }
      }
      router.push('/dashboard');
    } else {
      router.back();
    }
  };
  return (
    <button
      className={`btn-secondary ${className}`}
      onClick={handleClick}
    >
      {toDashboard ? 'Vrati na dashboard' : 'Nazad'}
    </button>
  );
} 