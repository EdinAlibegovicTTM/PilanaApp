'use client';

import React, { useState, useEffect } from 'react';
import { FormConfig, FormField } from '@/types';
import FormFieldComponent from './FormFieldComponent';
import { TrashIcon, CogIcon } from '@heroicons/react/24/outline';
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { motion } from 'framer-motion';

interface FormCanvasProps {
  config: FormConfig;
  selectedField: FormField | null;
  onFieldSelect: (field: FormField) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldsReorder?: (newOrder: FormField[]) => void;
  showGrid: boolean;
  gridSnap: boolean;
  zoom: number;
  fixedLayout: boolean;
}

function magnetSnap(x: number, y: number, grid: number, threshold = 8) {
  const snapX = Math.round(x / grid) * grid;
  const snapY = Math.round(y / grid) * grid;
  return {
    x: Math.abs(x - snapX) < threshold ? snapX : x,
    y: Math.abs(y - snapY) < threshold ? snapY : y,
  };
}

function edgeMagnetSnap(x: number, y: number, width: number, height: number, fields: FormField[], activeId: string, grid: number, threshold = 12) {
  // Magnet efekt po najbližoj ivici drugih polja
  let snapX = x;
  let snapY = y;
  let minDist = Infinity;
  let snapType = null;
  for (const f of fields) {
    if (f.id === activeId) continue;
    const fx = f.position?.x || 0;
    const fy = f.position?.y || 0;
    const fw = f.position?.width || 300;
    const fh = f.position?.height || 60;
    // Svi mogući snapovi
    const candidates = [
      { type: 'right', val: fx + fw, dist: Math.abs(x - (fx + fw)), set: () => { snapX = fx + fw; } },
      { type: 'left', val: fx, dist: Math.abs(x + width - fx), set: () => { snapX = fx - width; } },
      { type: 'bottom', val: fy + fh, dist: Math.abs(y - (fy + fh)), set: () => { snapY = fy + fh; } },
      { type: 'top', val: fy, dist: Math.abs(y + height - fy), set: () => { snapY = fy - height; } },
      { type: 'alignY', val: fy, dist: Math.abs(y - fy), set: () => { snapY = fy; } },
      { type: 'alignX', val: fx, dist: Math.abs(x - fx), set: () => { snapX = fx; } },
    ];
    for (const c of candidates) {
      if (c.dist < threshold && c.dist < minDist) {
        minDist = c.dist;
        snapType = c;
      }
    }
  }
  if (snapType) snapType.set();
  // Snap na grid kao fallback
  const gridSnap = magnetSnap(snapX, snapY, grid, 8);
  return { x: gridSnap.x, y: gridSnap.y };
}

export default function FormCanvas({
  config,
  selectedField,
  onFieldSelect,
  onFieldUpdate,
  onFieldDelete,
  onFieldsReorder,
  showGrid,
  gridSnap,
  zoom,
  fixedLayout
}: FormCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [liveFields, setLiveFields] = useState<FormField[]>(config.fields);
  const sensors = useSensors(useSensor(PointerSensor));

  // Ažuriraj liveFields kada se config.fields promijeni
  useEffect(() => {
    setLiveFields(config.fields);
  }, [config.fields]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    if (!fixedLayout && event.active && event.over && event.active.id !== event.over?.id) {
      const oldIndex = liveFields.findIndex(f => f.id === String(event.active.id));
      const newIndex = liveFields.findIndex(f => f.id === String(event.over!.id));
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Dodaj throttling za glađe animacije
        const newFields = [...liveFields];
        const [movedField] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, movedField);
        
        // Koristi requestAnimationFrame za glađe tranzicije
        requestAnimationFrame(() => {
          setLiveFields(newFields);
        });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active.id) return;
    
    const field = config.fields.find(f => f.id === String(active.id));
    if (!field) return;
    
    if (fixedLayout) {
      // U fixed layout modu, ažuriraj x,y pozicije
      const delta = event.delta;
      let { x, y } = field.position || { x: 0, y: 0 };
      x += delta.x;
      y += delta.y;
      const width = field.position?.width || 300;
      const height = field.position?.height || 60;
      if (gridSnap) {
        // Prvo magnet na ivice drugih polja, pa onda na grid
        const snapped = edgeMagnetSnap(x, y, width, height, config.fields, String(active.id), config.layout.gridSize || 20, 16);
        x = snapped.x;
        y = snapped.y;
      }
      onFieldUpdate(String(active.id), { position: { ...field.position, x, y } });
    } else {
      // U responsive modu, implementiraj reordering
      if (over && over.id !== active.id) {
        const oldIndex = config.fields.findIndex(f => f.id === String(active.id));
        const newIndex = config.fields.findIndex(f => f.id === String(over.id));
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newFields = [...config.fields];
          const [movedField] = newFields.splice(oldIndex, 1);
          newFields.splice(newIndex, 0, movedField);
          
          // Pozovi callback za reordering ako postoji
          if (onFieldsReorder) {
            onFieldsReorder(newFields);
          }
        }
      }
    }
    
    // Resetuj liveFields na originalni redoslijed
    setLiveFields(config.fields);
    setActiveId(null);
  }

  return (
    <div className="flex-1 flex flex-col transition-all duration-300 ease-out">
      {/* Canvas Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 transition-all duration-300 ease-out">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{config.name}</h2>
            <p className="text-sm text-gray-500">
              {config.fields.length} polja • {config.layout.columns} kolona
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Zoom: {zoom}%</span>
            {showGrid && <span>• Grid: {config.layout.gridSize}px</span>}
            {gridSnap && <span>• Grid Snap: ON</span>}
          </div>
        </div>
      </div>
      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 transition-all duration-300 ease-out">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div
            className={`relative min-h-full p-8 select-none transition-all duration-300 ease-out ${showGrid ? 'bg-grid-pattern' : ''}`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              backgroundColor: config.layout.backgroundColor,
              minHeight: '1600px',
            }}
          >
            {/* Grid lines */}
            {showGrid && (
              <div className="transition-opacity duration-300 ease-out">
                <GridLines gridSize={config.layout.gridSize || 20} />
              </div>
            )}
            <div
              className="relative w-full transition-all duration-300 ease-out"
              style={{
                backgroundColor: config.layout.backgroundColor,
                minHeight: '800px',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Grid lines unutar forme */}
              {showGrid && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} className="transition-opacity duration-300 ease-out">
                  <GridLines gridSize={config.layout.gridSize || 20} />
                </div>
              )}
              {/* Polja (zIndex: 2) */}
              <div 
                style={{ 
                  position: 'relative', 
                  zIndex: 2, 
                  display: fixedLayout ? 'block' : 'flex', 
                  flexDirection: fixedLayout ? undefined : 'column', 
                  flexWrap: fixedLayout ? undefined : 'wrap', 
                  gap: fixedLayout ? undefined : '1rem' 
                }}
                className="transition-all duration-300 ease-out"
              >
                {liveFields.map((field) => {
                  let value;
                  // Ako je qr-generator i mode params, generiši vrijednost iz parametara
                  if (field.type === 'qr-generator' && field.options.qrGeneratorConfig?.mode === 'params') {
                    const params = field.options.qrGeneratorConfig.params || [];
                    value = params.map(paramName => {
                      const paramField = liveFields.find(f => f.name === paramName);
                      return paramField && paramField.options.defaultValue ? paramField.options.defaultValue : '';
                    }).join('-');
                  }
                  return (
                    <DraggableField
                      key={field.id}
                      id={field.id}
                      field={field}
                      isSelected={selectedField?.id === field.id}
                      onClick={() => onFieldSelect(field)}
                      onDelete={() => onFieldDelete(field.id)}
                      showControls={selectedField?.id === field.id}
                      fixedLayout={fixedLayout}
                    >
                      <FormFieldComponent
                        field={field}
                        isSelected={selectedField?.id === field.id}
                        isDragging={activeId === field.id}
                        value={value}
                      />
                    </DraggableField>
                  );
                })}
                {/* Placeholder za drop zone */}
                {activeId && !fixedLayout && (
                  <div className="w-full h-16 border-2 border-dashed border-blue-400/60 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-lg flex items-center justify-center transition-all duration-300 ease-out hover:border-blue-500/80 hover:bg-gradient-to-r hover:from-blue-100/90 hover:to-indigo-100/90">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-600 text-sm font-medium">Ovdje će se polje premjestiti</span>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}

function DraggableField({ id, field, isSelected, onClick, onDelete, showControls, fixedLayout, children }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });
  
  // Izračunaj poziciju tokom draganja
  const style = fixedLayout ? {
    left: (field.position?.x || 0) + (transform?.x || 0),
    top: (field.position?.y || 0) + (transform?.y || 0),
    width: field.position?.width || 300,
    height: field.position?.height || 60,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 50 : 10,
    transform: isDragging ? 'rotate(1deg) scale(1.02)' : 'none',
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } : {
    width: '100%',
    opacity: isDragging ? 0.95 : 1,
    zIndex: isDragging ? 50 : 10,
    transform: isDragging ? 'scale(1.02) translateY(-2px)' : 'none',
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)' : 'none',
    filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' : 'none',
  } as React.CSSProperties;
  return (
    <motion.div
      layout
      ref={fixedLayout ? setNodeRef : (node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      className={`${fixedLayout ? 'absolute' : 'relative'} select-none transition-all duration-300 ease-out hover:shadow-lg hover:scale-[1.01] ${isDragging ? 'z-50 cursor-grabbing' : 'z-10 cursor-pointer'} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${isOver && !fixedLayout && !isDragging ? 'bg-blue-50/80 border-2 border-blue-300/60 shadow-lg' : ''} ${isOver && !fixedLayout && isDragging ? 'bg-green-50/90 border-2 border-green-400/80 shadow-xl' : ''}`}
      style={style}
    >
      {/* Responsive: klik na polje selektuje, grip desno za drag */}
      {!fixedLayout && (
        <div
          className="absolute inset-0 z-10"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{ cursor: 'pointer' }}
        />
      )}
      {/* Grip handle za drag & drop */}
      {!fixedLayout && (
        <div
          {...listeners}
          {...attributes}
          className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing z-30 shadow-lg border border-gray-200/60 hover:bg-blue-50 hover:border-blue-300/60 hover:shadow-xl transition-all duration-200 ease-out group"
          style={{ userSelect: 'none', margin: 0 }}
          title="Povuci za promjenu redoslijeda"
          onClick={e => e.stopPropagation()}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="transition-colors duration-200 group-hover:fill-blue-600">
            <circle cx="6" cy="6" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
            <circle cx="14" cy="6" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
            <circle cx="6" cy="14" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
            <circle cx="14" cy="14" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
          </svg>
        </div>
      )}
      {/* Fixed layout: cijelo polje je draggable, klik otvara podešavanja */}
      {fixedLayout && (
        <div
          {...listeners}
          {...attributes}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing z-30 shadow-lg border border-gray-200/60 hover:bg-blue-50 hover:border-blue-300/60 hover:shadow-xl transition-all duration-200 ease-out group"
          style={{ userSelect: 'none', margin: 0 }}
          title="Povuci za pomicanje"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="transition-colors duration-200 group-hover:fill-blue-600">
            <circle cx="6" cy="6" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
            <circle cx="14" cy="6" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
            <circle cx="6" cy="14" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
            <circle cx="14" cy="14" r="1.5" fill="#6b7280" className="group-hover:fill-blue-600" />
          </svg>
        </div>
      )}
      {/* Sadržaj polja */}
      <div className={`relative ${!isSelected && !fixedLayout ? 'pointer-events-none' : ''}`}>
        {children}
      </div>
      {showControls && (
        <div className={`${fixedLayout ? 'absolute -top-8 -right-8' : 'absolute top-2 right-10'} flex items-center space-x-1 z-30`}>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-1.5 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-lg shadow-lg hover:bg-blue-50 hover:border-blue-300/60 hover:shadow-xl transition-all duration-200 ease-out group"
          >
            <CogIcon className="h-3.5 w-3.5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-lg shadow-lg hover:bg-red-50 hover:border-red-300/60 hover:shadow-xl transition-all duration-200 ease-out group"
          >
            <TrashIcon className="h-3.5 w-3.5 text-gray-600 group-hover:text-red-600 transition-colors duration-200" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function GridLines({ gridSize }: { gridSize: number }) {
  const lines = [];
  // Standardne tanke linije
  for (let i = 0; i < 100; i++) {
    lines.push(
      <div key={`v${i}`} style={{ left: i * gridSize, top: 0, bottom: 0, position: 'absolute' }} className="w-px bg-gray-200 opacity-30 h-full pointer-events-none" />
    );
    lines.push(
      <div key={`h${i}`} style={{ top: i * gridSize, left: 0, right: 0, position: 'absolute' }} className="h-px bg-gray-200 opacity-30 w-full pointer-events-none" />
    );
  }
  // Deblje linije za kolone (svakih 200px)
  for (let i = 1; i < 10; i++) {
    lines.push(
      <div key={`col${i}`} style={{ left: i * 200, top: 0, bottom: 0, position: 'absolute' }} className="w-1 bg-blue-300 opacity-40 h-full pointer-events-none" />
    );
  }
  return <>{lines}</>;
} 