'use client';

import { useRouter } from 'next/navigation';
import useAppStore from '@/store/appStore';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Header({ className }: { className?: string }) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAppStore();

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!currentUser) {
    return null; // Ne prikazuj header ako niko nije prijavljen
  }

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 cursor-pointer" onClick={() => router.push('/')}>
              Pilana App
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{currentUser.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-gray-700"
              title="Odjavi se"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 