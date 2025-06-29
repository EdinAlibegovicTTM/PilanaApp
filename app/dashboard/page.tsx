'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import useAppStore from '@/store/appStore';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import React from 'react';

// Mapiranje ikona po ID-ju
const iconMap = {
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ArrowsUpDownIcon
};

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, globalLogo, logoLocations } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const canForms = currentUser?.permissions?.includes('forms') || isAdmin;
  const canReports = currentUser?.permissions?.includes('reports') || isAdmin;
  const canUsers = currentUser?.permissions?.includes('users') || isAdmin;
  const canSettings = currentUser?.permissions?.includes('settings') || isAdmin;

  // Funkcija za kreiranje default kartica
  const createDefaultCards = () => [
    {
      id: 'forms',
      title: 'Forme',
      description: 'Kreirajte i upravljajte formama za prikupljanje podataka',
      iconName: 'DocumentTextIcon',
      actionIconName: 'PlusIcon',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      hoverGradient: 'from-blue-100 to-cyan-100',
      textColor: 'text-blue-900',
      descriptionColor: 'text-blue-700',
      route: '/forms',
      canAccess: canForms,
      features: ['Kreiraj forme', 'Upravljaj poljima', 'Pregledaj odgovore']
    },
    {
      id: 'reports',
      title: 'Izvještaji',
      description: 'Pregledajte i generišite izvještaje iz prikupljenih podataka',
      iconName: 'ChartBarIcon',
      actionIconName: 'EyeIcon',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      hoverGradient: 'from-emerald-100 to-teal-100',
      textColor: 'text-emerald-900',
      descriptionColor: 'text-emerald-700',
      route: '/reports',
      canAccess: canReports,
      features: ['AI izvještaji', 'Custom izvještaji', 'Eksport podataka']
    },
    {
      id: 'users',
      title: 'Korisnici',
      description: 'Upravljajte korisnicima i dozvolama',
      iconName: 'UsersIcon',
      actionIconName: 'UserGroupIcon',
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-50 to-purple-50',
      borderColor: 'border-violet-200',
      hoverGradient: 'from-violet-100 to-purple-100',
      textColor: 'text-violet-900',
      descriptionColor: 'text-violet-700',
      route: '/users',
      canAccess: canUsers,
      features: ['Dodaj korisnike', 'Upravljaj dozvolama', 'Pregled aktivnosti']
    },
    {
      id: 'settings',
      title: 'Postavke',
      description: 'Konfigurišite aplikaciju i korisničke postavke',
      iconName: 'Cog6ToothIcon',
      actionIconName: 'WrenchScrewdriverIcon',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      hoverGradient: 'from-orange-100 to-red-100',
      textColor: 'text-orange-900',
      descriptionColor: 'text-orange-700',
      route: '/settings',
      canAccess: canSettings,
      features: ['Teme aplikacije', 'Logo postavke', 'Sistemske opcije']
    }
  ];

  // Učitaj poredak tabova iz localStorage
  const [dashboardCards, setDashboardCards] = useState<Array<{
    id: string;
    title: string;
    description: string;
    iconName: string;
    actionIconName: string;
    gradient: string;
    bgGradient: string;
    borderColor: string;
    hoverGradient: string;
    textColor: string;
    descriptionColor: string;
    route: string;
    canAccess: boolean;
    features: string[];
  }>>(() => {
    if (typeof window === 'undefined') return createDefaultCards();
    
    const savedOrder = localStorage.getItem('dashboardCardOrder');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        // Osiguraj da sve kartice imaju potrebne polja
        return parsed.map((card: any) => ({
          ...card,
          iconName: card.iconName || 'DocumentTextIcon',
          actionIconName: card.actionIconName || 'PlusIcon',
        }));
      } catch (e) {
        console.error('Greška pri učitavanju poretka tabova:', e);
      }
    }
    
    return createDefaultCards();
  });

  // Sačuvaj poredak u localStorage kada se promijeni
  useEffect(() => {
    if (typeof window !== 'undefined' && dashboardCards.length > 0) {
      localStorage.setItem('dashboardCardOrder', JSON.stringify(dashboardCards));
    }
  }, [dashboardCards]);

  // Drag & Drop funkcije
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setIsDragging(false);
    setDraggedIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newCards = [...dashboardCards];
    const draggedCard = newCards[draggedIndex];
    newCards.splice(draggedIndex, 1);
    newCards.splice(dropIndex, 0, draggedCard);
    
    setDashboardCards(newCards);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedIndex(null);
  };

  return (
    <>
      {/* Watermark logo u pozadini */}
      {globalLogo && logoLocations.includes('dashboard') && (
        <img
          src={globalLogo}
          alt="Watermark Logo"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'contain',
            opacity: 0.08,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Logo ako je omogućen */}
          {globalLogo && logoLocations.includes('dashboard') && (
            <div className="flex justify-center mb-8">
              <img 
                src={globalLogo} 
                alt="Company Logo" 
                className="h-16 max-w-xs object-contain drop-shadow-lg"
              />
            </div>
          )}
          
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dobrodošli, {currentUser?.username || 'Korisnik'}!
              </h1>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Izaberite sekciju koju želite da koristite. Možete poredati tabove prema vašim preferencama.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <ArrowsUpDownIcon className="h-4 w-4" />
              <span>Prevucite tabove da ih poredate</span>
            </div>
          </div>
          
          {/* Modern Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {dashboardCards.map((card, index) => (
              card.canAccess && (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative overflow-hidden bg-gradient-to-br ${card.bgGradient} rounded-2xl border ${card.borderColor} hover:border-opacity-50 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-gray-200/50 ${
                    isDragging && draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  onClick={() => router.push(card.route)}
                >
                  {/* Drag handle */}
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ArrowsUpDownIcon className="h-3 w-3 text-gray-600" />
                  </div>

                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* Card content */}
                  <div className="relative p-8">
                    {/* Header with icons */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                        {iconMap[card.iconName as keyof typeof iconMap] && 
                          React.createElement(iconMap[card.iconName as keyof typeof iconMap], { className: "h-8 w-8 text-white" })
                        }
                      </div>
                      <div className={`p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm group-hover:bg-white transition-colors duration-300`}>
                        {iconMap[card.actionIconName as keyof typeof iconMap] && 
                          React.createElement(iconMap[card.actionIconName as keyof typeof iconMap], { className: `h-5 w-5 ${card.descriptionColor} group-hover:scale-110 transition-transform duration-300` })
                        }
                      </div>
                    </div>
                    
                    {/* Title and description */}
                    <h3 className={`text-xl font-bold ${card.textColor} mb-3 group-hover:scale-105 transition-transform duration-300`}>
                      {card.title}
                    </h3>
                    <p className={`${card.descriptionColor} text-sm leading-relaxed mb-6`}>
                      {card.description}
                    </p>
                    
                    {/* Features list */}
                    <div className="space-y-2 mb-6">
                      {card.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${card.gradient}`}></div>
                          <span className={`text-xs ${card.descriptionColor} font-medium`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Action button */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${card.textColor}`}>
                        Otvori sekciju
                      </span>
                      <div className={`p-2 rounded-full bg-gradient-to-r ${card.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <ArrowRightIcon className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-lg"></div>
                </div>
              )
            ))}
          </div>

          {/* Quick Stats Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Brzi pregled</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">∞</div>
                <div className="text-sm text-blue-700 font-medium">Dostupne funkcionalnosti</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="text-3xl font-bold text-emerald-600 mb-2">24/7</div>
                <div className="text-sm text-emerald-700 font-medium">Dostupnost sistema</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
                <div className="text-3xl font-bold text-violet-600 mb-2">100%</div>
                <div className="text-sm text-violet-700 font-medium">Sigurnost podataka</div>
              </div>
            </div>
          </div>

          {/* Ako korisnik nema pristup ničemu */}
          {!canForms && !canReports && !canUsers && !canSettings && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Cog6ToothIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Nema pristupa</h3>
                <p className="text-gray-600 mb-4">
                  Trenutno nemate pristup nijednoj funkcionalnosti aplikacije.
                </p>
                <p className="text-gray-500 text-sm">
                  Kontaktirajte administratora za dodjeljivanje dozvola.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 