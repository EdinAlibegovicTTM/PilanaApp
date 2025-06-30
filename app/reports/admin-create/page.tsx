'use client';
import React, { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import AuthGuard from '@/components/AuthGuard';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import FormulaHelper from '@/components/FormulaHelper';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Tooltip, Legend);

const paramTypes = [
  { value: 'text', label: 'Tekst' },
  { value: 'number', label: 'Broj' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'date', label: 'Datum' },
];

const sectionTypes = [
  { value: 'table', label: 'Tabela' },
  { value: 'chart', label: 'Grafikon' },
  { value: 'text', label: 'Tekst' },
  { value: 'field', label: 'Polje' },
];

function SectionPalette({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4">Dodaj sekciju</h3>
      
      {/* Upute za selektovanje */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
        <strong>💡 Kako selektovati sekcije:</strong><br/>
        • Klikni na bilo koju sekciju na platnu da je selektuješ<br/>
        • Selektovana sekcija će imati plavu ivicu i checkmark<br/>
        • Podešavanja će se prikazati u desnom panelu<br/>
        • Klikni ponovo na sekciju da je deselektuješ<br/>
        • Klikni na prazno mjesto za deselektovanje<br/>
        • Možeš selektovati samo jednu sekciju u isto vrijeme
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => onAdd('table')}
          className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
        >
          <div className="font-medium">📊 Tabela</div>
          <div className="text-xs text-gray-600">Prikaz podataka u tabeli</div>
        </button>
        
        <button
          onClick={() => onAdd('chart')}
          className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded border border-green-200 transition"
        >
          <div className="font-medium">📈 Grafikon</div>
          <div className="text-xs text-gray-600">Vizualizacija podataka</div>
        </button>
        
        <button
          onClick={() => onAdd('text')}
          className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition"
        >
          <div className="font-medium">📝 Tekst</div>
          <div className="text-xs text-gray-600">Slobodni tekst, napomene ili sažetak</div>
        </button>
      </div>
    </div>
  );
}

function DraggableSection({ id, x, y, size, width, onWidthChange, isSelected, onSelect, children }: { 
  id: string, 
  x: number, 
  y: number, 
  size: string, 
  width?: number, 
  onWidthChange?: (w: number) => void, 
  isSelected: boolean,
  onSelect: () => void,
  children: React.ReactNode 
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id });
  const defaultWidth = size === 'sm' ? 200 : size === 'md' ? 400 : 600;
  const w = width || defaultWidth;
  
  // Resize logika
  const [resizing, setResizing] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startW, setStartW] = React.useState(w);
  
  React.useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const newW = Math.max(200, Math.min(1200, startW + (e.clientX - startX)));
      onWidthChange && onWidthChange(newW);
    };
    const onUp = () => setResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, startX, startW, onWidthChange]);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`section-hover ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        position: 'absolute',
        left: transform ? x + transform.x : x,
        top: transform ? y + transform.y : y,
        width: w,
        zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
        opacity: 1,
        transition: isDragging ? 'none' : 'all 0.2s ease',
        boxShadow: isSelected ? '0 4px 20px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        background: isSelected ? '#f0f9ff' : '#f9fafb',
        border: isDragging || isSelected ? '3px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: 8,
        cursor: 'pointer',
        userSelect: resizing ? 'none' : undefined,
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
      title={isSelected ? "Sekcija je selektovana - klikni za deselektovanje" : "Klikni za selektovanje sekcije"}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '30px',
          cursor: 'grab',
          zIndex: 10,
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
          }
        }}
      />
      
      {/* Selektovanje indikator */}
      {isSelected && (
        <div 
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 16,
            height: 16,
            background: '#3b82f6',
            borderRadius: '50%',
            border: '2px solid white',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          ✓
        </div>
      )}
      
      {children}
      
      {/* Resize handle */}
      <div
        style={{
          position: 'absolute',
          right: -4,
          top: 0,
          width: 8,
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 200,
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '2px',
        }}
        onMouseDown={e => {
          e.stopPropagation();
          setResizing(true);
          setStartX(e.clientX);
          setStartW(w);
        }}
      />
    </div>
  );
}

function TablePreview({ columns, onColumnResize }: { columns: any[], onColumnResize?: (colIdx: number, newWidth: number) => void }) {
  if (!columns || columns.length === 0) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
        Dodaj kolone u tabelu
      </div>
    );
  }

  const [resizingCol, setResizingCol] = React.useState<number | null>(null);
  const [startX, setStartX] = React.useState(0);
  const [startWidth, setStartWidth] = React.useState(0);

  React.useEffect(() => {
    if (resizingCol === null || !onColumnResize) return;

    const onMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      onColumnResize(resizingCol, newWidth);
    };

    const onUp = () => setResizingCol(null);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingCol, startX, startWidth, onColumnResize]);

  return (
    <div className="bg-white border rounded overflow-hidden">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            {columns.map((col: any, idx: number) => (
              <th 
                key={col.id} 
                className="border px-2 py-1 bg-gray-100 text-left relative"
                style={{ width: col.width || 'auto' }}
              >
                {col.label || col.sheetKey || `Kolona ${idx + 1}`}
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 w-2 h-full cursor-col-resize bg-blue-400 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ zIndex: 50 }}
                  onMouseDown={(e) => {
                    if (onColumnResize) {
                      e.stopPropagation();
                      setResizingCol(idx);
                      setStartX(e.clientX);
                      setStartWidth(col.width || 150);
                    }
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2].map(rowIdx => (
            <tr key={rowIdx}>
              {columns.map((col: any, colIdx: number) => (
                <td 
                  key={col.id} 
                  className="border px-2 py-1 text-gray-400"
                  style={{ width: col.width || 'auto' }}
                >
                  {col.formula ? `Formula: ${col.formula}` : `Demo ${col.sheetKey || colIdx + 1}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartPreview({ type, data, xField, yField, color, compareBy }: { type: string, data: any[], xField: string, yField: string, color: string, compareBy?: string }) {
  if (!data || !xField || !yField) return <div className="text-xs text-gray-400">Odaberi X i Y polje</div>;
  
  // Grupisanje po compareBy ako postoji
  let labels: string[] = [];
  let datasets: any[] = [];
  
  if (compareBy) {
    // Grupisanje po compareBy
    const groups: Record<string, any[]> = {};
    data.forEach(row => {
      const key = row[compareBy] || 'Ostalo';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    labels = Array.from(new Set(data.map(row => row[xField])));
    datasets = Object.entries(groups).map(([group, rows], i) => ({
      label: group,
      data: labels.map(lab => {
        const found = rows.find(r => r[xField] === lab);
        return found ? parseFloat(found[yField] || '0') : 0;
      }),
      backgroundColor: color || `hsl(${i * 60},70%,60%)`,
      borderColor: color || `hsl(${i * 60},70%,40%)`,
      fill: type === 'line' ? false : true,
    }));
  } else {
    labels = data.map(row => row[xField]);
    datasets = [{
      label: yField,
      data: data.map(row => parseFloat(row[yField] || '0')),
      backgroundColor: color || '#3b82f6',
      borderColor: color || '#1d4ed8',
      fill: type === 'line' ? false : true,
    }];
  }
  
  const chartData = { labels, datasets };
  const options = { responsive: true, plugins: { legend: { display: true } } };
  
  switch (type) {
    case 'bar': return <Bar data={chartData} options={options} />;
    case 'line': return <Line data={chartData} options={options} />;
    case 'pie': return <Pie data={chartData} options={options} />;
    case 'doughnut': return <Doughnut data={chartData} options={options} />;
    case 'radar': return <Radar data={chartData} options={options} />;
    default: return <div>Odaberi tip grafikona</div>;
  }
}

function SettingsPanel({ selectedSection, onUpdateSection, onUpdateColumn, parameters }: { 
  selectedSection: any, 
  onUpdateSection: (section: any) => void,
  onUpdateColumn: (colIdx: number, updates: any) => void,
  parameters: any[]
}) {
  if (!selectedSection) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Podešavanja</h3>
        <div className="text-gray-500 text-sm space-y-2">
          <p>Odaberi sekciju za uređivanje</p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
            <strong>💡 Kako selektovati sekcije:</strong><br/>
            • Klikni na bilo koju sekciju na platnu da je selektuješ<br/>
            • Selektovana sekcija će imati plavu ivicu i checkmark<br/>
            • Podešavanja će se prikazati u desnom panelu<br/>
            • Klikni ponovo na sekciju da je deselektuješ<br/>
            • Klikni na prazno mjesto za deselektovanje<br/>
            • Možeš selektovati samo jednu sekciju u isto vrijeme
          </div>
        </div>
      </div>
    );
  }

  const updateSection = (updates: any) => {
    onUpdateSection({ ...selectedSection, ...updates });
  };

  const addColumn = () => {
    const newColumn = {
      id: `col_${Date.now()}`,
      label: '',
      sheetKey: '',
      formula: '',
      width: 150
    };
    updateSection({
      columns: [...(selectedSection.columns || []), newColumn]
    });
  };

  const updateColumn = (colIdx: number, updates: any) => {
    onUpdateColumn(colIdx, updates);
  };

  const removeColumn = (colIdx: number) => {
    const newColumns = (selectedSection.columns || []).filter((_: any, idx: number) => idx !== colIdx);
    updateSection({ columns: newColumns });
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="font-semibold mb-4">Podešavanja sekcije</h3>
      
      {/* Osnovna podešavanja */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tip
            <span className="text-blue-500 ml-1 cursor-help" title="Tip sekcije koji određuje kako će se podaci prikazati">
              ℹ️
            </span>
          </label>
          <select 
            className="input w-full" 
            value={selectedSection.type} 
            onChange={e => updateSection({ type: e.target.value })}
          >
            {sectionTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            <strong>Tipovi sekcija:</strong><br/>
            • <strong>Tabela</strong> - prikaz podataka u tabeli s kolonama<br/>
            • <strong>Grafikon</strong> - vizualizacija podataka kao grafikon<br/>
            • <strong>Tekst</strong> - slobodni tekst, napomene ili sažetak<br/>
            • <strong>Polje</strong> - pojedinačno polje za prikaz podataka
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Naslov
            <span className="text-blue-500 ml-1 cursor-help" title="Naslov sekcije koji će se prikazati u izvještaju">
              ℹ️
            </span>
          </label>
          <input 
            className="input w-full" 
            placeholder="npr. 'Prodaja po mjesecima', 'Grafikon trendova'" 
            value={selectedSection.title || ''} 
            onChange={e => updateSection({ title: e.target.value })}
          />
          <div className="text-xs text-gray-500 mt-1">
            Naslov koji će se prikazati iznad sekcije u izvještaju
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Izvor podataka
            <span className="text-blue-500 ml-1 cursor-help" title="Naziv tab-a (sheet-a) u Google Sheets dokumentu iz kojeg se dohvaćaju podaci">
              ℹ️
            </span>
          </label>
          <input 
            className="input w-full" 
            placeholder="npr. 'Sheet1', 'Podaci', 'Izvještaj2024'" 
            value={selectedSection.dataSource || ''} 
            onChange={e => updateSection({ dataSource: e.target.value })}
          />
          <div className="text-xs text-gray-500 mt-1">
            Naziv tab-a u Google Sheets dokumentu. Možete vidjeti nazive tab-ova na dnu Google Sheets dokumenta.
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Veličina
            <span className="text-blue-500 ml-1 cursor-help" title="Širina sekcije u izvještaju">
              ℹ️
            </span>
          </label>
          <select 
            className="input w-full" 
            value={selectedSection.size || 'md'} 
            onChange={e => updateSection({ size: e.target.value })}
          >
            <option value="sm">Mala (1/3 širine)</option>
            <option value="md">Srednja (1/2 širine)</option>
            <option value="lg">Velika (puna širina)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Širina sekcije u izvještaju. Možete je podesiti i direktno na platnu prevlačenjem.
          </div>
        </div>
      </div>

      {/* Specifična podešavanja za tabelu */}
      {selectedSection.type === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Kolone tabele</h4>
            <button 
              className="btn-secondary text-sm"
              onClick={addColumn}
            >
              + Dodaj kolonu
            </button>
          </div>
          
          <div className="space-y-3">
            {(selectedSection.columns || []).map((col: any, colIdx: number) => (
              <div key={col.id} className="bg-white p-3 rounded border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Kolona {colIdx + 1}</span>
                  <button 
                    className="text-red-500 text-sm"
                    onClick={() => removeColumn(colIdx)}
                  >
                    Obriši
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Prikazani naziv
                      <span className="text-blue-500 ml-1 cursor-help" title="Naziv kolone koji će se prikazati korisniku u izvještaju">
                        ℹ️
                      </span>
                    </label>
                    <input 
                      className="input text-sm" 
                      placeholder="npr. 'Prodaja', 'Količina', 'Datum'" 
                      value={col.label || ''} 
                      onChange={e => updateColumn(colIdx, { label: e.target.value })}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Naziv koji će se prikazati u zaglavlju kolone
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Naziv u sheetu
                      <span className="text-blue-500 ml-1 cursor-help" title="Naziv kolone u Google Sheetu (može biti A, B, C ili naziv kolone)">
                        ℹ️
                      </span>
                    </label>
                    <input 
                      className="input text-sm" 
                      placeholder="npr. 'A', 'B', 'sales', 'quantity'" 
                      value={col.sheetKey || ''} 
                      onChange={e => updateColumn(colIdx, { sheetKey: e.target.value })}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Možete koristiti slova kolona (A, B, C) ili nazive kolona iz Google Sheeta
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Formula 
                    <span className="text-blue-500 ml-1 cursor-help" title="Formule omogućavaju izračunavanje vrijednosti na osnovu drugih kolona. Koristite nazive kolona iz Google Sheeta.">
                      ℹ️
                    </span>
                  </label>
                  <FormulaHelper
                    value={col.formula || ''} 
                    onChange={(value) => updateColumn(colIdx, { formula: value })}
                    placeholder="npr: A + B, SUM(C:D), IF(A > 10, 'DA', 'NE')"
                    className="w-full"
                    availableColumns={['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Primjeri:</strong><br/>
                    • <code>A + B</code> - sabira kolone A i B<br/>
                    • <code>SUM(C:D)</code> - sabira sve vrijednosti od kolone C do D<br/>
                    • <code>IF(A &gt; 10, 'DA', 'NE')</code> - ako je A veće od 10, vraća 'DA', inače 'NE'<br/>
                    • <code>AVERAGE(B:C)</code> - prosjek kolona B i C<br/>
                    • <code>CONCAT(A, ' - ', B)</code> - spaja A i B sa ' - ' između
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Širina (px)
                    <span className="text-blue-500 ml-1 cursor-help" title="Širina kolone u pikselima. Možete je podesiti i direktno u tabeli prevlačenjem.">
                      ℹ️
                    </span>
                  </label>
                  <input 
                    type="number"
                    className="input text-sm" 
                    placeholder="150" 
                    value={col.width || 150} 
                    onChange={e => updateColumn(colIdx, { width: parseInt(e.target.value) || 150 })}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Možete podesiti širinu i direktno u tabeli prevlačenjem desne ivice kolone
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Preview tabele */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Preview</h4>
            <TablePreview columns={selectedSection.columns || []} onColumnResize={(colIdx, newWidth) => updateColumn(colIdx, { width: newWidth })} />
          </div>
        </div>
      )}

      {/* Specifična podešavanja za grafikon */}
      {selectedSection.type === 'chart' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Tip grafikona
              <span className="text-blue-500 ml-1 cursor-help" title="Odaberite tip grafikona koji najbolje prikazuje vaše podatke">
                ℹ️
              </span>
            </label>
            <select className="input text-sm" value={selectedSection.chartType || 'bar'} onChange={(e) => updateSection({ chartType: e.target.value })}>
              <option value="bar">Stupčasti grafikon</option>
              <option value="line">Linijski grafikon</option>
              <option value="pie">Kružni grafikon</option>
              <option value="doughnut">Prstenasti grafikon</option>
              <option value="area">Površinski grafikon</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              <strong>Kada koristiti:</strong><br/>
              • <strong>Stupčasti</strong> - usporedba kategorija<br/>
              • <strong>Linijski</strong> - trendovi kroz vrijeme<br/>
              • <strong>Kružni/Prstenasti</strong> - udjeli i proporcije<br/>
              • <strong>Površinski</strong> - kumulativni trendovi
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Boja
              <span className="text-blue-500 ml-1 cursor-help" title="Odaberite boju za grafikon">
                ℹ️
              </span>
            </label>
            <input 
              type="color" 
              className="w-full h-10 border rounded" 
              value={selectedSection.color || '#3b82f6'} 
              onChange={e => updateSection({ color: e.target.value })}
            />
            <div className="text-xs text-gray-500 mt-1">
              Glavna boja grafikona. Za više boja, koristite "Poredi po" polje za grupisanje.
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              X polje
              <span className="text-blue-500 ml-1 cursor-help" title="Naziv kolone iz Google Sheeta koja će se koristiti za X osu (kategorije)">
                ℹ️
              </span>
            </label>
            <input 
              className="input w-full" 
              placeholder="npr. 'month', 'category', 'employee_name'" 
              value={selectedSection.xField || ''} 
              onChange={e => updateSection({ xField: e.target.value })}
            />
            <div className="text-xs text-gray-500 mt-1">
              Naziv kolone iz Google Sheeta koja sadrži kategorije ili labele
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Y polje
              <span className="text-blue-500 ml-1 cursor-help" title="Naziv kolone iz Google Sheeta koja će se koristiti za Y osu (vrijednosti)">
                ℹ️
              </span>
            </label>
            <input 
              className="input w-full" 
              placeholder="npr. 'sales', 'quantity', 'amount'" 
              value={selectedSection.yField || ''} 
              onChange={e => updateSection({ yField: e.target.value })}
            />
            <div className="text-xs text-gray-500 mt-1">
              Naziv kolone iz Google Sheeta koja sadrži numeričke vrijednosti za prikaz
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Poredi po (opcionalno)
              <span className="text-blue-500 ml-1 cursor-help" title="Naziv kolone za grupisanje podataka (npr. po godini, mjesecu)">
                ℹ️
              </span>
            </label>
            <input 
              className="input w-full" 
              placeholder="npr. 'year', 'department'" 
              value={selectedSection.compareBy || ''} 
              onChange={e => updateSection({ compareBy: e.target.value })}
            />
            <div className="text-xs text-gray-500 mt-1">
              Omogućava grupisanje podataka po dodatnoj kategoriji (npr. usporedba po godinama)
            </div>
          </div>
          
          {/* Preview grafikona */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="bg-white border rounded p-2">
              <ChartPreview
                type={selectedSection.chartType || 'bar'}
                data={[]}
                xField={selectedSection.xField || ''}
                yField={selectedSection.yField || ''}
                color={selectedSection.color || '#3b82f6'}
                compareBy={selectedSection.compareBy || ''}
              />
            </div>
          </div>
        </div>
      )}

      {/* Specifična podešavanja za tekst */}
      {selectedSection.type === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Sadržaj teksta
              <span className="text-blue-500 ml-1 cursor-help" title="Tekst koji će se prikazati u sekciji">
                ℹ️
              </span>
            </label>
            <textarea 
              className="input w-full h-32" 
              placeholder="Unesite tekst koji će se prikazati u ovoj sekciji..."
              value={selectedSection.content || ''} 
              onChange={e => updateSection({ content: e.target.value })}
            />
            <div className="text-xs text-gray-500 mt-1">
              Možete koristiti HTML tagove za formatiranje (npr. &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;)
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Veličina teksta</label>
            <select 
              className="input w-full" 
              value={selectedSection.textSize || 'normal'} 
              onChange={e => updateSection({ textSize: e.target.value })}
            >
              <option value="small">Mali</option>
              <option value="normal">Normalan</option>
              <option value="large">Veliki</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Poravnanje</label>
            <select 
              className="input w-full" 
              value={selectedSection.textAlign || 'left'} 
              onChange={e => updateSection({ textAlign: e.target.value })}
            >
              <option value="left">Lijevo</option>
              <option value="center">Centar</option>
              <option value="right">Desno</option>
              <option value="justify">Obostrano</option>
            </select>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-1">
          Filtriraj po parametrima
          <span className="text-blue-500 ml-1 cursor-help" title="Odaberite parametre koji će filtrirati podatke u ovoj sekciji">
            ℹ️
          </span>
        </label>
        <select 
          className="input w-full" 
          multiple
          value={selectedSection.filterBy || []} 
          onChange={e => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            updateSection({ filterBy: selectedOptions });
          }}
        >
          {parameters.map((param: any) => (
            <option key={param.key} value={param.key}>
              {param.name} ({param.sheetColumn || param.key})
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          <strong>Kako funkcioniše:</strong><br/>
          • Drži Ctrl (Cmd na Mac) za odabir više parametara<br/>
          • Odabrani parametri će se koristiti za filtriranje podataka iz Google Sheeta<br/>
          • Backend će mapirati parametre na odgovarajuće kolone u sheetu<br/>
          • Korisnik će unijeti vrijednosti za odabrane parametre prije prikaza izvještaja
        </div>
      </div>
    </div>
  );
}

function AdminCreateReportTemplate() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [googleSheetName, setGoogleSheetName] = useState('');
  const [parameters, setParameters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetch('/api/users').then(res => res.json()).then(setAllUsers);
    
    // Dohvati Google Sheet podešavanja iz app-settings
    fetch('/api/app-settings')
      .then(res => res.json())
      .then(data => {
        if (data.exportSheetTab) {
          setGoogleSheetName(data.exportSheetTab);
        }
      })
      .catch(err => console.error('Greška pri dohvatu podešavanja:', err));
  }, []);

  const addParam = () => setParameters([...parameters, { name: '', key: '', type: 'text', options: [], description: '' }]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Molimo unesite naziv izvještaja');
      return;
    }
    
    if (!googleSheetName.trim()) {
      alert('Google Sheet tab nije postavljen. Molimo postavite tab u podešavanjima aplikacije.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/report-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          thumbnail,
          googleSheetName,
          parameters,
          sections,
          allowedUsers
        })
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Reset forme
        setName('');
        setDescription('');
        setThumbnail('');
        setParameters([]);
        setSections([]);
        setAllowedUsers([]);
      } else {
        const errorData = await response.json();
        alert('Greška pri čuvanju: ' + (errorData.error || 'Nepoznata greška'));
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Greška pri čuvanju izvještaja');
    }
    setSaving(false);
  };

  const handleAddSectionDnd = (type: string) => {
    const newSection = {
      id: `section_${Date.now()}`,
      type,
      title: `${type} sekcija`,
      x: 20,
      y: sections.length * 120 + 20,
      size: 'md',
      width: 400,
      height: 200,
    };
    setSections([...sections, newSection]);
    handleSelectSection(newSection.id);
  };

  function snapToGrid(x: number, y: number, grid = 20) {
    return { x: Math.round(x / grid) * grid, y: Math.round(y / grid) * grid };
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over) {
      const newSections = sections.map(section => {
        if (section.id === active.id) {
          const snapped = snapToGrid(section.x, section.y);
          return { ...section, x: snapped.x, y: snapped.y };
        }
        return section;
      });
      setSections(newSections);
    }
  };

  const updateSection = (updatedSection: any) => {
    setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
  };

  const updateColumn = (sectionId: string, colIdx: number, updates: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.columns) {
        const newColumns = [...s.columns];
        newColumns[colIdx] = { ...newColumns[colIdx], ...updates };
        return { ...s, columns: newColumns };
      }
      return s;
    }));
  };

  const handleSelectSection = (id: string | null) => {
    setSelectedSectionId(id);
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  // Debug info
  sections.forEach((s, idx) => {
    // Debug info removed
  });

  return (
    <div className="w-full max-w-none mx-0 p-8">
      <Header />
      <button 
        className="btn-secondary mb-6" 
        onClick={() => router.push('/reports')}
      >
        Nazad
      </button>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded text-blue-800">
        <h2 className="text-xl font-bold mb-2">Kreiranje novog izvještaja</h2>
        <p>Ovdje možete kreirati novi predložak izvještaja. Popunite osnovne podatke, dodajte parametre i sekcije izvještaja, te odaberite korisnike koji imaju pristup ovom izvještaju.</p>
        <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded text-blue-900 text-sm">
          <strong>💡 Kako selektovati sekcije:</strong><br/>
          • Klikni na bilo koju sekciju na platnu da je selektuješ<br/>
          • Selektovana sekcija će imati plavu ivicu i checkmark<br/>
          • Podešavanja će se prikazati u desnom panelu<br/>
          • Klikni ponovo na sekciju da je deselektuješ<br/>
          • Klikni na prazno mjesto za deselektovanje<br/>
          • Možeš selektovati samo jednu sekciju u isto vrijeme
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-6">Kreiraj predložak izvještaja</h1>
      
      {/* Osnovni podaci */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Osnovni podaci</h2>
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          <strong>💡 Uputstva za osnovne podatke:</strong><br/>
          • <strong>Naziv izvještaja</strong> - kako će se izvještaj prikazati korisnicima<br/>
          • <strong>Opis</strong> - detaljniji opis šta izvještaj sadrži<br/>
          • <strong>URL slike</strong> - link do slike koja će se prikazati kao thumbnail (opcionalno)<br/>
          • <strong>Google Sheet tab</strong> - automatski se koristi tab iz podešavanja aplikacije<br/>
          • <strong>Napomena:</strong> Koristi se isti Google Sheet kao i za forme
        </div>
        <div className="space-y-4">
          <input className="input w-full" placeholder="Naziv izvještaja" value={name} onChange={e => setName(e.target.value)} />
          <textarea className="input w-full" placeholder="Opis" value={description} onChange={e => setDescription(e.target.value)} />
          <input className="input w-full" placeholder="URL slike (thumbnail)" value={thumbnail} onChange={e => setThumbnail(e.target.value)} />
          
          {/* Prikaz Google Sheet tab-a (read-only) */}
          <div className="bg-gray-50 p-3 rounded border">
            <label className="block text-sm font-medium mb-1">Google Sheet tab (iz podešavanja)</label>
            <input 
              className="input w-full bg-white" 
              value={googleSheetName || 'Nije postavljen'} 
              readOnly 
              disabled
            />
            <div className="text-xs text-gray-500 mt-1">
              Tab se automatski dohvata iz podešavanja aplikacije. 
              {!googleSheetName && ' Molimo postavite tab u podešavanjima.'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Parametri */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Parametri izvještaja</h2>
          <button className="btn-secondary" onClick={addParam}>+ Dodaj parametar</button>
        </div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          <strong>💡 Uputstva za parametre:</strong><br/>
          • <strong>Naziv</strong> - kako će se parametar prikazati korisniku (npr. "Godina", "Korisnik")<br/>
          • <strong>Key</strong> - interni identifikator parametra (npr. "year", "user")<br/>
          • <strong>Sheet kolona</strong> - naziv kolone u Google Sheetu koju će parametar filtrirati (npr. "year", "employee_name")<br/>
          • <strong>Opis</strong> - tooltip koji će se prikazati korisniku<br/>
          • <strong>Tip</strong> - vrsta input polja (tekst, broj, dropdown, datum)
        </div>
        {parameters.map((param, idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
            <div className="flex flex-col gap-1">
              <input className="input" placeholder="Naziv" value={param.name} onChange={e => setParameters(p => p.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
              <div className="text-xs text-gray-500">
                Kako će se prikazati korisniku
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <input className="input" placeholder="Key" value={param.key} onChange={e => setParameters(p => p.map((x, i) => i === idx ? { ...x, key: e.target.value } : x))} />
              <div className="text-xs text-gray-500">
                Interni identifikator
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <input className="input" placeholder="Sheet kolona" value={param.sheetColumn || ''} onChange={e => setParameters(p => p.map((x, i) => i === idx ? { ...x, sheetColumn: e.target.value } : x))} />
              <div className="text-xs text-gray-500">
                Kolona u Google Sheetu
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <input className="input" placeholder="Opis (tooltip)" value={param.description || ''} onChange={e => setParameters(p => p.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
              <div className="text-xs text-gray-500">
                Tooltip za korisnika
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <select className="input" value={param.type} onChange={e => setParameters(p => p.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))}>
                {paramTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <div className="text-xs text-gray-500">
                Vrsta input polja
              </div>
            </div>
            {param.type === 'dropdown' && (
              <div className="flex flex-col gap-1">
                <input className="input" placeholder="Opcije (zarezom)" value={param.options?.join(',') || ''} onChange={e => setParameters(p => p.map((x, i) => i === idx ? { ...x, options: e.target.value.split(',').map(s => s.trim()) } : x))} />
                <div className="text-xs text-gray-500">
                  Unesite opcije odvojene zarezom (npr. "Opcija 1, Opcija 2, Opcija 3")
                </div>
              </div>
            )}
            <button className="text-red-500 ml-2" onClick={() => setParameters(p => p.filter((_, i) => i !== idx))}>Obriši</button>
          </div>
        ))}
      </div>
      
      {/* Sekcije */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Sekcije izvještaja</h2>
        </div>
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          <strong>💡 Uputstva za sekcije:</strong><br/>
          • <strong>Naziv</strong> - naslov sekcije koji će se prikazati u izvještaju<br/>
          • <strong>Tip</strong> - tabela (podaci), grafikon (vizualizacija) ili tekst (napomena)<br/>
          • <strong>Sheet Key</strong> - identifikator Google Sheeta iz kojeg se dohvaćaju podaci<br/>
          • <strong>Filtriraj po parametrima</strong> - odaberite koji parametri će filtrirati podatke u ovoj sekciji<br/>
          • <strong>Veličina</strong> - širina sekcije (mala, srednja, velika)<br/>
          • <strong>Drag & Drop</strong> - prevucite sekcije iz palete na platno za dodavanje<br/>
          • <strong>Selektovanje</strong> - klikni na sekciju da je selektuješ i uređuj podešavanja u desnom panelu
        </div>
      </div>
      
      {/* Builder - 3 kolone */}
      <div className="flex gap-6 mb-8">
        {/* Lijevo - Paleta */}
        <div className="w-64">
          <SectionPalette onAdd={handleAddSectionDnd} />
        </div>
        
        {/* Sredina - Platno */}
        <div className="flex-1">
          <div className="relative w-full min-h-[600px] bg-gray-100 border rounded-lg overflow-auto" style={{ height: '70vh' }}>
            {/* Upute za selektovanje */}
            {sections.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-medium mb-2">Nema sekcija</h3>
                  <p className="text-sm">Prevucite sekcije iz palete na platno da počnete</p>
                </div>
              </div>
            )}
            
            <DndContext
              sensors={sensors}
              onDragStart={e => setActiveSectionId(e.active.id as string)}
              onDragEnd={e => { handleDragEnd(e); setActiveSectionId(null); }}
              onDragCancel={() => setActiveSectionId(null)}
            >
              {/* Klik na prazno mjesto za deselektovanje */}
              <div 
                className="absolute inset-0 z-0"
                onClick={() => handleSelectSection(null)}
                style={{ pointerEvents: sections.length === 0 ? 'none' : 'auto' }}
              />
              
              {sections.map((section, idx) => (
                <DraggableSection
                  key={section.id}
                  id={section.id}
                  x={section.x || 0}
                  y={section.y || 0}
                  size={section.size || 'md'}
                  width={section.width || 400}
                  onWidthChange={(w) => updateSection({ ...section, width: w })}
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => handleSelectSection(section.id)}
                >
                  {section.title || `${section.type} sekcija`}
                </DraggableSection>
              ))}
              
              <DragOverlay>
                {activeSectionId ? (
                  (() => {
                    const section = sections.find(s => s.id === activeSectionId);
                    if (!section) return null;
                    return (
                      <div
                        style={{
                          width: section.width || (section.size === 'sm' ? 200 : section.size === 'md' ? 400 : 600),
                          background: '#f9fafb',
                          border: '2px solid #3b82f6',
                          borderRadius: 8,
                          boxShadow: '0 8px 32px 0 rgba(59,130,246,0.35), 0 0 0 2px #3b82f6',
                          opacity: 0.95,
                          pointerEvents: 'none',
                          padding: 16,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{section.title || `${section.type} sekcija`}</h4>
                          <span className="text-xs text-gray-400">☰</span>
                        </div>
                        {section.type === 'table' && (
                          <TablePreview 
                            columns={section.columns || []} 
                            onColumnResize={(colIdx, newWidth) => updateColumn(section.id, colIdx, { width: newWidth })}
                          />
                        )}
                      </div>
                    );
                  })()
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
        
        {/* Desno - Settings */}
        <div className="w-80">
          <SettingsPanel 
            selectedSection={selectedSection} 
            onUpdateSection={updateSection}
            onUpdateColumn={(colIdx, updates) => {
              if (selectedSection) {
                updateColumn(selectedSection.id, colIdx, updates);
              }
            }}
            parameters={parameters}
          />
        </div>
      </div>
      
      {/* Dozvoljeni korisnici */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Dozvoljeni korisnici</h2>
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded text-purple-800 text-sm">
          <strong>💡 Uputstva za dozvoljene korisnike:</strong><br/>
          • Odaberite korisnike koji će imati pristup ovom izvještaju<br/>
          • Samo odabrani korisnici će moći da vide i koriste ovaj izvještaj<br/>
          • Ako ne odaberete nikoga, samo admin će imati pristup
        </div>
        <div className="flex flex-wrap gap-2">
          {allUsers.map(user => (
            <label key={user.username} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
              <input
                type="checkbox"
                checked={allowedUsers.includes(user.username)}
                onChange={e => {
                  setAllowedUsers(prev =>
                    e.target.checked
                      ? [...prev, user.username]
                      : prev.filter(u => u !== user.username)
                  );
                }}
              />
              {user.username} ({user.role})
            </label>
          ))}
        </div>
      </div>
      
      <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
        {saving ? 'Snima se...' : 'Sačuvaj predložak'}
      </button>
      {success && <div className="text-green-600 mt-4">Predložak uspješno sačuvan!</div>}
    </div>
  );
}

export default function AdminCreateReportTemplateWithAuth() {
  return (
    <AuthGuard>
      <AdminCreateReportTemplate />
    </AuthGuard>
  );
} 