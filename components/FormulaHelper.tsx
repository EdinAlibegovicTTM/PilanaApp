"use client";

import { useState, useEffect, useRef } from 'react';

interface FormulaHelperProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  availableColumns?: string[];
}

interface FormulaFunction {
  name: string;
  description: string;
  syntax: string;
  examples: string[];
  category: 'math' | 'text' | 'logical' | 'date' | 'lookup';
}

const formulaFunctions: FormulaFunction[] = [
  // Matematičke funkcije
  {
    name: 'SUM',
    description: 'Sabira sve brojeve u rasponu',
    syntax: 'SUM(range)',
    examples: ['SUM(A1:A10)', 'SUM(B1, B3, B5)', 'SUM(C:C)'],
    category: 'math'
  },
  {
    name: 'AVERAGE',
    description: 'Računa prosjek brojeva u rasponu',
    syntax: 'AVERAGE(range)',
    examples: ['AVERAGE(A1:A10)', 'AVERAGE(B1:B5)'],
    category: 'math'
  },
  {
    name: 'COUNT',
    description: 'Broji broj ćelija sa brojevima',
    syntax: 'COUNT(range)',
    examples: ['COUNT(A1:A10)', 'COUNT(B:B)'],
    category: 'math'
  },
  {
    name: 'MAX',
    description: 'Vraća najveći broj u rasponu',
    syntax: 'MAX(range)',
    examples: ['MAX(A1:A10)', 'MAX(B1, B5, B10)'],
    category: 'math'
  },
  {
    name: 'MIN',
    description: 'Vraća najmanji broj u rasponu',
    syntax: 'MIN(range)',
    examples: ['MIN(A1:A10)', 'MIN(B1, B5, B10)'],
    category: 'math'
  },
  {
    name: 'ROUND',
    description: 'Zaokružuje broj na određeni broj decimala',
    syntax: 'ROUND(number, decimals)',
    examples: ['ROUND(A1, 2)', 'ROUND(3.14159, 2)'],
    category: 'math'
  },
  
  // Tekstualne funkcije
  {
    name: 'CONCAT',
    description: 'Spaja više tekstualnih vrijednosti',
    syntax: 'CONCAT(text1, text2, ...)',
    examples: ['CONCAT(A1, " - ", B1)', 'CONCAT("Hello", " ", "World")'],
    category: 'text'
  },
  {
    name: 'LEFT',
    description: 'Vraća određeni broj karaktera s lijeve strane',
    syntax: 'LEFT(text, num_chars)',
    examples: ['LEFT(A1, 3)', 'LEFT("Hello", 2)'],
    category: 'text'
  },
  {
    name: 'RIGHT',
    description: 'Vraća određeni broj karaktera s desne strane',
    syntax: 'RIGHT(text, num_chars)',
    examples: ['RIGHT(A1, 3)', 'RIGHT("Hello", 2)'],
    category: 'text'
  },
  {
    name: 'LEN',
    description: 'Vraća dužinu teksta',
    syntax: 'LEN(text)',
    examples: ['LEN(A1)', 'LEN("Hello")'],
    category: 'text'
  },
  
  // Logičke funkcije
  {
    name: 'IF',
    description: 'Vraća jednu vrijednost ako je uvjet tačan, drugu ako nije',
    syntax: 'IF(condition, value_if_true, value_if_false)',
    examples: ['IF(A1 > 10, "DA", "NE")', 'IF(B1 = "test", "OK", "GREŠKA")'],
    category: 'logical'
  },
  {
    name: 'AND',
    description: 'Vraća TRUE ako su svi uvjeti tačni',
    syntax: 'AND(condition1, condition2, ...)',
    examples: ['AND(A1 > 0, A1 < 100)', 'AND(B1 = "test", C1 > 5)'],
    category: 'logical'
  },
  {
    name: 'OR',
    description: 'Vraća TRUE ako je bilo koji uvjet tačan',
    syntax: 'OR(condition1, condition2, ...)',
    examples: ['OR(A1 = "test", A1 = "demo")', 'OR(B1 > 10, C1 < 5)'],
    category: 'logical'
  },
  
  // Datum funkcije
  {
    name: 'TODAY',
    description: 'Vraća današnji datum',
    syntax: 'TODAY()',
    examples: ['TODAY()', 'TODAY() + 7'],
    category: 'date'
  },
  {
    name: 'DATE',
    description: 'Kreira datum iz godina, mjeseca i dana',
    syntax: 'DATE(year, month, day)',
    examples: ['DATE(2024, 1, 15)', 'DATE(A1, B1, C1)'],
    category: 'date'
  },
  
  // Lookup funkcije
  {
    name: 'VLOOKUP',
    description: 'Traži vrijednost u prvoj koloni i vraća vrijednost iz druge kolone',
    syntax: 'VLOOKUP(search_key, range, index, is_sorted)',
    examples: ['VLOOKUP(A1, B1:D10, 2, FALSE)', 'VLOOKUP("test", A1:C10, 3, TRUE)'],
    category: 'lookup'
  }
];

export default function FormulaHelper({ 
  value, 
  onChange, 
  placeholder = "Unesite formulu...", 
  className = "",
  availableColumns = []
}: FormulaHelperProps) {
  const [showHelper, setShowHelper] = useState(false);
  const [filteredFunctions, setFilteredFunctions] = useState<FormulaFunction[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const helperRef = useRef<HTMLDivElement>(null);

  // Filtriraj funkcije na osnovu unosa
  useEffect(() => {
    if (!value || !showHelper) {
      setFilteredFunctions([]);
      return;
    }

    const lastWord = value.slice(0, cursorPosition).split(/[\s(,]/).pop() || '';
    
    if (lastWord.length < 2) {
      setFilteredFunctions([]);
      return;
    }

    const filtered = formulaFunctions.filter(func => 
      func.name.toLowerCase().includes(lastWord.toLowerCase())
    );
    
    setFilteredFunctions(filtered);
    setSelectedIndex(0);
  }, [value, cursorPosition, showHelper]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showHelper || filteredFunctions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredFunctions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredFunctions.length) % filteredFunctions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFunctions.length > 0) {
          insertFunction(filteredFunctions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowHelper(false);
        break;
    }
  };

  // Ubaci funkciju u input
  const insertFunction = (func: FormulaFunction) => {
    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    
    // Pronađi zadnju riječ prije kursora
    const words = beforeCursor.split(/[\s(,]/);
    const lastWord = words[words.length - 1];
    
    const newValue = beforeCursor.slice(0, -lastWord.length) + func.syntax + afterCursor;
    onChange(newValue);
    
    // Postavi kursor na kraj funkcije
    const newCursorPos = beforeCursor.length - lastWord.length + func.syntax.length;
    setCursorPosition(newCursorPos);
    
    // Fokusiraj input i postavi kursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
    
    setShowHelper(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart || 0);
    
    // Prikaži helper ako korisnik počinje pisati
    if (newValue.length > 0) {
      setShowHelper(true);
    } else {
      setShowHelper(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value.length > 0) {
      setShowHelper(true);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helperRef.current && !helperRef.current.contains(event.target as Node)) {
        setShowHelper(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={helperRef}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`input-field ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          title="Formula helper"
        >
          📝
        </button>
      </div>

      {/* Helper panel */}
      {showHelper && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Autocomplete suggestions */}
          {filteredFunctions.length > 0 && (
            <div className="p-2 border-b">
              <div className="text-xs font-medium text-gray-600 mb-2">Funkcije:</div>
              {filteredFunctions.map((func, index) => (
                <div
                  key={func.name}
                  className={`p-2 cursor-pointer rounded text-sm ${
                    index === selectedIndex ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => insertFunction(func)}
                >
                  <div className="font-medium">{func.name}</div>
                  <div className="text-xs text-gray-500">{func.description}</div>
                  <div className="text-xs text-blue-600 font-mono">{func.syntax}</div>
                </div>
              ))}
            </div>
          )}

          {/* Available columns */}
          {availableColumns.length > 0 && (
            <div className="p-2 border-b">
              <div className="text-xs font-medium text-gray-600 mb-2">Dostupne kolone:</div>
              <div className="flex flex-wrap gap-1">
                {availableColumns.map(col => (
                  <button
                    key={col}
                    onClick={() => {
                      const newValue = value + col;
                      onChange(newValue);
                      setCursorPosition(newValue.length);
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick examples */}
          <div className="p-2">
            <div className="text-xs font-medium text-gray-600 mb-2">Brzi primjeri:</div>
            <div className="space-y-1">
              <button
                onClick={() => onChange('SUM(A1:A10)')}
                className="block w-full text-left text-xs text-blue-600 hover:bg-blue-50 p-1 rounded"
              >
                SUM(A1:A10) - Sabiranje raspona
              </button>
              <button
                onClick={() => onChange('IF(A1 > 10, "DA", "NE")')}
                className="block w-full text-left text-xs text-blue-600 hover:bg-blue-50 p-1 rounded"
              >
                IF(A1 &gt; 10, "DA", "NE") - Uvjetna logika
              </button>
              <button
                onClick={() => onChange('CONCAT(A1, " - ", B1)')}
                className="block w-full text-left text-xs text-blue-600 hover:bg-blue-50 p-1 rounded"
              >
                CONCAT(A1, " - ", B1) - Spajanje teksta
              </button>
              <button
                onClick={() => onChange('AVERAGE(B1:B5)')}
                className="block w-full text-left text-xs text-blue-600 hover:bg-blue-50 p-1 rounded"
              >
                AVERAGE(B1:B5) - Prosjek
              </button>
            </div>
          </div>

          {/* Help text */}
          <div className="p-2 bg-gray-50 text-xs text-gray-600">
            <div className="font-medium mb-1">Kako koristiti:</div>
            <div>• Počnite pisati ime funkcije za autocomplete</div>
            <div>• Koristite strelice za navigaciju, Enter za odabir</div>
            <div>• Kliknite na kolone za brzo dodavanje</div>
            <div>• Koristite brze primjere za uobičajene formule</div>
          </div>
        </div>
      )}
    </div>
  );
} 