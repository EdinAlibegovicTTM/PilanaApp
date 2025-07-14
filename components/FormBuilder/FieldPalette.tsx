'use client';

import React from 'react';
import { FieldType } from '@/types';
import { 
  DocumentTextIcon,
  HashtagIcon,
  CalendarIcon,
  ChevronDownIcon,
  QrCodeIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  CalculatorIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface FieldPaletteProps {
  onAddField: (fieldType: FieldType) => void;
}

const fieldTypes: Array<{ type: FieldType; label: string; icon: React.ComponentType<any>; description: string }> = [
  {
    type: 'text',
    label: 'Tekst',
    icon: DocumentTextIcon,
    description: 'Polje za unos teksta'
  },
  {
    type: 'number',
    label: 'Broj',
    icon: HashtagIcon,
    description: 'Polje za unos brojeva'
  },
  {
    type: 'date',
    label: 'Datum',
    icon: CalendarIcon,
    description: 'Polje za odabir datuma'
  },
  {
    type: 'dropdown',
    label: 'Padajuća lista',
    icon: ChevronDownIcon,
    description: 'Lista opcija za odabir'
  },
  {
    type: 'qr-scanner',
    label: 'QR skener',
    icon: QrCodeIcon,
    description: 'Skeniranje QR kodova'
  },
  {
    type: 'qr-generator',
    label: 'Generator QR koda',
    icon: QrCodeIcon,
    description: 'Polje za automatsko ili ručno generisanje QR koda'
  },
  {
    type: 'geolocation',
    label: 'Lokacija',
    icon: MapPinIcon,
    description: 'Automatsko određivanje lokacije'
  },
  {
    type: 'datetime',
    label: 'Datum i vrijeme',
    icon: ClockIcon,
    description: 'Polje za datum i vrijeme'
  },
  {
    type: 'user',
    label: 'Korisnik',
    icon: UserIcon,
    description: 'Automatsko popunjavanje korisnika'
  },
  {
    type: 'formula',
    label: 'Formula',
    icon: CalculatorIcon,
    description: 'Polje sa Excel formulom'
  },
  {
    type: 'smart-dropdown',
    label: 'Zavisni dropdown',
    icon: SparklesIcon,
    description: 'Lista koja zavisi od drugog polja'
  },
  {
    type: 'dinamicko-polje',
    label: 'Dinamičko polje',
    icon: QrCodeIcon,
    description: 'Polje sa skeniranjem, unosom i dinamičkim dohvatom podataka'
  }
];

export default function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {fieldTypes.map((fieldType) => (
          <div
            key={fieldType.type}
            onClick={() => onAddField(fieldType.type)}
            className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50
              transition-colors duration-200
              select-none
              active:scale-95
            "
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <fieldType.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {fieldType.label}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {fieldType.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 