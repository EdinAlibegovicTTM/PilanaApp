'use client';

import React, { useState } from 'react';
import { FormConfig, FormField } from '@/types';
import FormFieldComponent from './FormFieldComponent';
import { TrashIcon, CogIcon } from '@heroicons/react/24/outline';
import {
  DndContext,
  useDraggable,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface FormCanvasProps {
  config: FormConfig;
  selectedField: FormField | null;
  onFieldSelect: (field: FormField) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  onFieldDelete: (fieldId: string) => void;
  showGrid: boolean;
  gridSnap: boolean;
  zoom: number;
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
  showGrid,
  gridSnap,
  zoom
}: FormCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: any) {
    const { active, delta } = event;
    if (!active.id) return;
    const field = config.fields.find(f => f.id === active.id);
    if (!field) return;
    let { x, y } = field.position || { x: 0, y: 0 };
    x += delta.x;
    y += delta.y;
    const width = field.position?.width || 300;
    const height = field.position?.height || 60;
    if (gridSnap) {
      // Prvo magnet na ivice drugih polja, pa onda na grid
      const snapped = edgeMagnetSnap(x, y, width, height, config.fields, active.id, config.layout.gridSize || 20, 16);
      x = snapped.x;
      y = snapped.y;
    }
    onFieldUpdate(active.id, { position: { ...field.position, x, y } });
    setActiveId(null);
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Canvas Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
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
      <div className="flex-1 overflow-auto bg-gray-100">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div
            className={`relative min-h-full p-8 select-none ${showGrid ? 'bg-grid-pattern' : ''}`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              backgroundColor: config.layout.backgroundColor,
              minHeight: '1600px',
            }}
          >
            {/* Grid lines */}
            {showGrid && (
              <GridLines gridSize={config.layout.gridSize || 20} />
            )}
            <div
              className="relative w-full"
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
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
                  <GridLines gridSize={config.layout.gridSize || 20} />
                </div>
              )}
              {/* Polja (zIndex: 2) */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                {config.fields.map((field) => (
                  <DraggableField
                    key={field.id}
                    id={field.id}
                    field={field}
                    isSelected={selectedField?.id === field.id}
                    onClick={() => onFieldSelect(field)}
                    onDelete={() => onFieldDelete(field.id)}
                    showControls={selectedField?.id === field.id}
                  >
                    <FormFieldComponent
                      field={field}
                      isSelected={selectedField?.id === field.id}
                      isDragging={activeId === field.id}
                    />
                  </DraggableField>
                ))}
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}

function DraggableField({ id, field, isSelected, onClick, onDelete, showControls, children }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  // Izračunaj poziciju tokom draganja
  const style = {
    left: (field.position?.x || 0) + (transform?.x || 0),
    top: (field.position?.y || 0) + (transform?.y || 0),
    width: field.position?.width || 300,
    height: field.position?.height || 60,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : 10,
    transform: isDragging ? 'rotate(2deg)' : 'none',
    transition: isDragging ? 'none' : 'all 0.2s',
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      className={`absolute select-none transition-all duration-200 hover:shadow-lg ${isDragging ? 'z-50 cursor-grabbing' : 'z-10 cursor-pointer'} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Grip handle za drag & drop - sada desno i poluprovidan */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-gray-200 bg-opacity-50 rounded cursor-grab active:cursor-grabbing z-30 shadow border border-gray-300 hover:bg-blue-200 transition-colors duration-150"
        style={{ userSelect: 'none', margin: 0 }}
        title="Povuci za pomicanje"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
          <circle cx="6" cy="6" r="1.5" fill="#888" />
          <circle cx="14" cy="6" r="1.5" fill="#888" />
          <circle cx="6" cy="14" r="1.5" fill="#888" />
          <circle cx="14" cy="14" r="1.5" fill="#888" />
        </svg>
      </div>
      {children}
      {showControls && (
        <div className="absolute -top-8 -right-8 flex items-center space-x-1 z-30">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50"
          >
            <CogIcon className="h-3 w-3 text-gray-600" />
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 bg-red-50 border border-red-300 rounded shadow-sm hover:bg-red-100"
          >
            <TrashIcon className="h-3 w-3 text-red-600" />
          </button>
        </div>
      )}
    </div>
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