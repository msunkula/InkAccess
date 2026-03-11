/**
 * © 2026 Mahesh Sunkula
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { 
  Upload, 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileUp,
  ExternalLink,
  Eye,
  Code,
  Eraser,
  Maximize2,
  Minimize2,
  Type,
  Trash2,
  Undo2,
  Redo2,
  RotateCcw,
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Circle,
  Wand2,
  RefreshCw,
  Edit3,
  Copy,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

declare global {
  interface Window {
    MathJax: any;
  }
}

// Initialize PDF.js worker using Vite's worker support for better compatibility in iframes
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  console.error('Failed to set PDF.js worker path:', e);
  // Fallback to CDN if local loading fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
}

interface DiagramData {
  id: string;
  originalBase64: string;
  editedBase64: string;
  alt: string;
  width: number; // percentage 0-100
}

interface ManualSelection {
  id: string;
  points: { x: number; y: number }[]; // Normalized 0-1000
  bounds: { xmin: number; ymin: number; xmax: number; ymax: number }; // Normalized 0-1000
}

interface PagePreview {
  pageNumber: number;
  imageBase64: string;
  width: number;
  height: number;
}

interface PageResult {
  pageNumber: number;
  imageBase64: string;
  htmlContent: string;
  accessibilityIssues: AccessibilityIssue[];
  diagrams: DiagramData[];
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-white/5 rounded-2xl", className)} />
);

const ManualDiagramSelector = ({ 
  pageImage, 
  selections, 
  onUpdate 
}: { 
  pageImage: string; 
  selections: ManualSelection[]; 
  onUpdate: (selections: ManualSelection[]) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [tool, setTool] = useState<'lasso' | 'rect'>('lasso');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'none' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'>('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number; bounds: ManualSelection['bounds'] } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = pageImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw existing selections
      selections.forEach(sel => {
        const isSelected = sel.id === selectedId;
        const { xmin, ymin, xmax, ymax } = sel.bounds;
        
        ctx.beginPath();
        ctx.strokeStyle = isSelected ? '#34d399' : '#10b981'; // emerald-400 vs emerald-500
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.setLineDash(isSelected ? [] : [5, 5]);
        
        if (sel.points.length > 1 && !isSelected) {
          ctx.moveTo(sel.points[0].x * canvas.width / 1000, sel.points[0].y * canvas.height / 1000);
          sel.points.forEach(p => ctx.lineTo(p.x * canvas.width / 1000, p.y * canvas.height / 1000));
          ctx.closePath();
        } else {
          ctx.rect(
            xmin * canvas.width / 1000, 
            ymin * canvas.height / 1000, 
            (xmax - xmin) * canvas.width / 1000, 
            (ymax - ymin) * canvas.height / 1000
          );
        }
        ctx.stroke();
        ctx.fillStyle = isSelected ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)';
        ctx.fill();
        ctx.setLineDash([]);

        if (isSelected) {
          // Draw handles
          const handleSize = 10;
          const handles = [
            { x: xmin, y: ymin, cursor: 'nwse-resize' }, // tl
            { x: xmax, y: ymin, cursor: 'nesw-resize' }, // tr
            { x: xmin, y: ymax, cursor: 'nesw-resize' }, // bl
            { x: xmax, y: ymax, cursor: 'nwse-resize' }, // br
          ];

          handles.forEach(h => {
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.fillRect(
              h.x * canvas.width / 1000 - handleSize / 2,
              h.y * canvas.height / 1000 - handleSize / 2,
              handleSize,
              handleSize
            );
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              h.x * canvas.width / 1000 - handleSize / 2,
              h.y * canvas.height / 1000 - handleSize / 2,
              handleSize,
              handleSize
            );
          });
        }
      });

      // Draw current selection
      if (isDrawing && currentPoints.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#fbbf24'; // amber-400
        ctx.lineWidth = 3;
        ctx.moveTo(currentPoints[0].x * canvas.width / 1000, currentPoints[0].y * canvas.height / 1000);
        if (tool === 'lasso') {
          currentPoints.forEach(p => ctx.lineTo(p.x * canvas.width / 1000, p.y * canvas.height / 1000));
        } else {
          const start = currentPoints[0];
          const end = currentPoints[currentPoints.length - 1];
          ctx.rect(
            start.x * canvas.width / 1000, 
            start.y * canvas.height / 1000, 
            (end.x - start.x) * canvas.width / 1000, 
            (end.y - start.y) * canvas.height / 1000
          );
        }
        ctx.stroke();
      }
    };

    draw();
  }, [pageImage, selections, isDrawing, currentPoints, tool, selectedId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX - rect.left) * scaleX / canvas.width) * 1000;
    const y = ((e.clientY - rect.top) * scaleY / canvas.height) * 1000;

    // Check for handle hits first
    if (selectedId) {
      const sel = selections.find(s => s.id === selectedId);
      if (sel) {
        const handleSize = 15; // Larger hit area
        const { xmin, ymin, xmax, ymax } = sel.bounds;
        
        if (Math.abs(x - xmin) < handleSize && Math.abs(y - ymin) < handleSize) {
          setDragMode('resize-tl');
          setDragStart({ x, y, bounds: { ...sel.bounds } });
          return;
        }
        if (Math.abs(x - xmax) < handleSize && Math.abs(y - ymin) < handleSize) {
          setDragMode('resize-tr');
          setDragStart({ x, y, bounds: { ...sel.bounds } });
          return;
        }
        if (Math.abs(x - xmin) < handleSize && Math.abs(y - ymax) < handleSize) {
          setDragMode('resize-bl');
          setDragStart({ x, y, bounds: { ...sel.bounds } });
          return;
        }
        if (Math.abs(x - xmax) < handleSize && Math.abs(y - ymax) < handleSize) {
          setDragMode('resize-br');
          setDragStart({ x, y, bounds: { ...sel.bounds } });
          return;
        }
        
        // Check for move hit
        if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
          setDragMode('move');
          setDragStart({ x, y, bounds: { ...sel.bounds } });
          return;
        }
      }
    }

    // Check for selection hit
    const hit = selections.find(sel => 
      x >= sel.bounds.xmin && x <= sel.bounds.xmax && 
      y >= sel.bounds.ymin && y <= sel.bounds.ymax
    );

    if (hit) {
      setSelectedId(hit.id);
      setDragMode('move');
      setDragStart({ x, y, bounds: { ...hit.bounds } });
    } else {
      setSelectedId(null);
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX - rect.left) * scaleX / canvas.width) * 1000;
    const y = ((e.clientY - rect.top) * scaleY / canvas.height) * 1000;

    if (dragMode !== 'none' && selectedId && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      const newBounds = { ...dragStart.bounds };

      if (dragMode === 'move') {
        newBounds.xmin += dx;
        newBounds.xmax += dx;
        newBounds.ymin += dy;
        newBounds.ymax += dy;
      } else if (dragMode === 'resize-tl') {
        newBounds.xmin = Math.min(dragStart.bounds.xmax - 10, dragStart.bounds.xmin + dx);
        newBounds.ymin = Math.min(dragStart.bounds.ymax - 10, dragStart.bounds.ymin + dy);
      } else if (dragMode === 'resize-tr') {
        newBounds.xmax = Math.max(dragStart.bounds.xmin + 10, dragStart.bounds.xmax + dx);
        newBounds.ymin = Math.min(dragStart.bounds.ymax - 10, dragStart.bounds.ymin + dy);
      } else if (dragMode === 'resize-bl') {
        newBounds.xmin = Math.min(dragStart.bounds.xmax - 10, dragStart.bounds.xmin + dx);
        newBounds.ymax = Math.max(dragStart.bounds.ymin + 10, dragStart.bounds.ymax + dy);
      } else if (dragMode === 'resize-br') {
        newBounds.xmax = Math.max(dragStart.bounds.xmin + 10, dragStart.bounds.xmax + dx);
        newBounds.ymax = Math.max(dragStart.bounds.ymin + 10, dragStart.bounds.ymax + dy);
      }

      const updatedSelections = selections.map(s => 
        s.id === selectedId ? { ...s, bounds: newBounds, points: [
          { x: newBounds.xmin, y: newBounds.ymin },
          { x: newBounds.xmax, y: newBounds.ymin },
          { x: newBounds.xmax, y: newBounds.ymax },
          { x: newBounds.xmin, y: newBounds.ymax }
        ] } : s
      );
      onUpdate(updatedSelections);
      return;
    }

    if (!isDrawing) {
      // Update cursor
      let cursor = 'crosshair';
      if (selectedId) {
        const sel = selections.find(s => s.id === selectedId);
        if (sel) {
          const handleSize = 15;
          const { xmin, ymin, xmax, ymax } = sel.bounds;
          if (Math.abs(x - xmin) < handleSize && Math.abs(y - ymin) < handleSize) cursor = 'nwse-resize';
          else if (Math.abs(x - xmax) < handleSize && Math.abs(y - ymin) < handleSize) cursor = 'nesw-resize';
          else if (Math.abs(x - xmin) < handleSize && Math.abs(y - ymax) < handleSize) cursor = 'nesw-resize';
          else if (Math.abs(x - xmax) < handleSize && Math.abs(y - ymax) < handleSize) cursor = 'nwse-resize';
          else if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) cursor = 'move';
        }
      }
      if (cursor === 'crosshair') {
        const hit = selections.find(sel => 
          x >= sel.bounds.xmin && x <= sel.bounds.xmax && 
          y >= sel.bounds.ymin && y <= sel.bounds.ymax
        );
        if (hit) cursor = 'pointer';
      }
      if (containerRef.current) containerRef.current.style.cursor = cursor;
      return;
    }

    if (tool === 'lasso') {
      setCurrentPoints(prev => [...prev, { x, y }]);
    } else {
      setCurrentPoints(prev => [prev[0], { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (dragMode !== 'none') {
      setDragMode('none');
      setDragStart(null);
      return;
    }

    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      return;
    }

    const xmin = Math.min(...currentPoints.map(p => p.x));
    const ymin = Math.min(...currentPoints.map(p => p.y));
    const xmax = Math.max(...currentPoints.map(p => p.x));
    const ymax = Math.max(...currentPoints.map(p => p.y));

    const newId = `manual-${Math.random().toString(36).substr(2, 9)}`;
    const newSelection: ManualSelection = {
      id: newId,
      points: tool === 'lasso' ? currentPoints : [
        { x: xmin, y: ymin },
        { x: xmax, y: ymin },
        { x: xmax, y: ymax },
        { x: xmin, y: ymax }
      ],
      bounds: { xmin, ymin, xmax, ymax }
    };

    onUpdate([...selections, newSelection]);
    setSelectedId(newId);
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTool('lasso')}
            className={cn(
              "p-2 rounded-lg transition-all",
              tool === 'lasso' ? "bg-emerald-500 text-black" : "hover:bg-white/10 text-stone-400"
            )}
            title="Lasso Tool"
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setTool('rect')}
            className={cn(
              "p-2 rounded-lg transition-all",
              tool === 'rect' ? "bg-emerald-500 text-black" : "hover:bg-white/10 text-stone-400"
            )}
            title="Rectangle Tool"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button 
            onClick={() => onUpdate([])}
            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
            title="Clear All"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-4">
          <span className="text-emerald-500/60">Click to select • Drag to move/resize</span>
          <span>{selections.length} Diagrams Selected</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="max-w-full h-auto" />
        {selections.map(sel => sel.id === selectedId && (
          <button
            key={sel.id}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(selections.filter(s => s.id !== sel.id));
              setSelectedId(null);
            }}
            style={{
              left: `${sel.bounds.xmax / 10}%`,
              top: `${sel.bounds.ymin / 10}%`,
            }}
            className="absolute p-1.5 bg-red-500 text-white rounded-full shadow-xl hover:bg-red-600 hover:scale-110 transition-all -translate-x-1/2 -translate-y-1/2 z-20 border-2 border-white"
            title="Delete Selection"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
};

const DiagramEditor = ({ 
  diagram, 
  onUpdate 
}: { 
  diagram: DiagramData; 
  onUpdate: (updates: Partial<DiagramData>) => void;
  key?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // History management
  const [history, setHistory] = useState<string[]>([diagram.editedBase64]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[historyIndex];
  }, [historyIndex, history]);

  const addToHistory = (newBase64: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBase64);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onUpdate({ editedBase64: newBase64 });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onUpdate({ editedBase64: history[newIndex] });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onUpdate({ editedBase64: history[newIndex] });
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isErasing) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        addToHistory(canvas.toDataURL('image/png'));
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    setMousePos({ x: clientX - rect.left, y: clientY - rect.top });

    if (!isDrawing || !isErasing) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="group relative bg-stone-50 rounded-2xl p-6 border border-stone-200 my-8 transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsErasing(!isErasing)}
            className={cn(
              "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
              isErasing ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-600 hover:bg-stone-300"
            )}
          >
            <Eraser className="w-4 h-4" />
            {isErasing ? "Eraser Active" : "Eraser"}
          </button>
          
          {isErasing && (
            <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Size</span>
              <input 
                type="range" 
                min="5" 
                max="100" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20 accent-emerald-500"
              />
              <span className="text-[10px] font-bold text-stone-600">{brushSize}px</span>
            </div>
          )}

          <div className="h-4 w-px bg-stone-300 mx-2" />
          
          <div className="flex items-center gap-2">
            <Minimize2 className="w-4 h-4 text-stone-400" />
            <input 
              type="range" 
              min="10" 
              max="300" 
              value={diagram.width} 
              onChange={(e) => onUpdate({ width: parseInt(e.target.value) })}
              className="w-32 accent-emerald-500"
            />
            <Maximize2 className="w-4 h-4 text-stone-400" />
            <span className="text-[10px] font-bold text-stone-400 ml-2">{diagram.width}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 text-stone-400 hover:text-stone-600 disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 text-stone-400 hover:text-stone-600 disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-stone-300 mx-1" />

          <button 
            onClick={() => {
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext('2d');
              if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                addToHistory(canvas.toDataURL('image/png'));
              }
            }}
            className="p-2 text-stone-400 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            title="Clear entire diagram"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          
          <button 
            onClick={() => {
              addToHistory(diagram.originalBase64);
            }}
            className="p-2 text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            title="Reset to original"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-white cursor-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            width: `${diagram.width}%`, 
            height: 'auto',
            display: 'block',
            margin: '0 auto'
          }}
        />
        {isErasing && (
          <div 
            className="absolute pointer-events-none border-2 border-emerald-500 rounded-full bg-emerald-500/20"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: brushSize * (canvasRef.current ? (canvasRef.current.getBoundingClientRect().width / canvasRef.current.width) : 1),
              height: brushSize * (canvasRef.current ? (canvasRef.current.getBoundingClientRect().width / canvasRef.current.width) : 1),
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          />
        )}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 text-stone-400 mb-1">
          <Type className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Alt Text / Description</span>
        </div>
        <textarea
          value={diagram.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Describe this diagram for accessibility..."
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors min-h-[80px] resize-none"
        />
        <p className="text-[10px] text-stone-400 italic">This text will appear directly under the image in the final document.</p>
      </div>
    </div>
  );
};

const RequestChangesSection = ({ onApplyChanges, isProcessing }: { onApplyChanges: (request: string) => void, isProcessing: boolean }) => {
  const [request, setRequest] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (request.trim()) {
      onApplyChanges(request);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[48px] p-12 mt-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
            <Wand2 className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Request AI Changes</h2>
            <p className="text-stone-500 text-sm">Ask the AI to fix or improve the conversion</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-stone-400">What would you like to change?</label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="e.g., 'Correct the formula in the second paragraph', 'Extract the diagram at the bottom more clearly', 'Use a more formal tone'..."
              className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white placeholder:text-stone-600 focus:outline-none focus:border-indigo-500/50 transition-colors min-h-[120px] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!request.trim() || isProcessing}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            Apply Changes to All Pages
          </button>
          
          <p className="text-center text-[10px] text-stone-500 uppercase tracking-widest font-bold">
            This will re-process all pages using your specific instructions.
          </p>
        </form>
      </div>
    </div>
  );
};

const checkAccessibility = (html: string): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Check heading hierarchy
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 3; // Template starts at h3 for page sections, so page content should be h4+
  headings.forEach((h) => {
    const level = parseInt(h.tagName[1]);
    if (level > lastLevel + 1) {
      issues.push({
        type: 'warning',
        message: `Heading level skipped: ${h.tagName} follows a level ${lastLevel} context.`
      });
    }
    lastLevel = level;
  });

  // Check for visual descriptions if diagrams are mentioned
  const text = doc.body.textContent?.toLowerCase() || '';
  const hasDiagramKeywords = ['diagram', 'graph', 'chart', 'figure', 'illustration'].some(kw => text.includes(kw));
  const hasVisualDesc = doc.querySelector('.visual-desc') !== null;
  
  if (hasDiagramKeywords && !hasVisualDesc) {
    issues.push({
      type: 'warning',
      message: 'Diagram keywords detected but no .visual-desc container found for accessibility.'
    });
  }

  // Check for alt text on any images in the content
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.alt) {
      issues.push({
        type: 'error',
        message: 'Image found in content without alt text.'
      });
    }
  });

  // Check for MathJax delimiters
  const hasMath = text.includes('\\(') || text.includes('\\[') || text.includes('$');
  if (hasMath && !text.includes('\\(') && !text.includes('\\[') && text.includes('$')) {
    issues.push({
      type: 'error',
      message: 'Single dollar sign ($) detected for math. Use \\( and \\[ for better accessibility.'
    });
  }

  return issues;
};

const resultCache = new Map<string, PageResult>();

const compressImage = async (base64: string, maxWidth = 1600, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64;
  });
};

const runWcagCleanup = async (html: string, pageNumber: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const prompt = `
    You are an accessibility expert specializing in WCAG 2.2 Level AA compliance.
    
    TASK: Clean up the following HTML transcription of handwritten lecture notes to ensure full WCAG 2.2 AA compliance.
    
    CURRENT HTML (Page ${pageNumber}):
    ${html}
    
    FIX THE FOLLOWING COMMON ISSUES:
    1. Missing or poor alt text for images/diagrams.
    2. Incorrect heading structures (ensure a logical hierarchy, starting from h4 for this page chunk).
    3. Ensure all math is properly wrapped in \\( ... \\) or \\[ ... \\] for MathJax accessibility.
    4. Ensure semantic elements are used correctly (e.g., <strong> for emphasis, <table> for data).
    5. Fix any skipped heading levels.
    
    INSTRUCTIONS:
    - Return ONLY the cleaned HTML.
    - Do not include any markdown code blocks or explanations.
    - Maintain all original content and formatting classes (.definition, .theorem, etc.).
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return (response.text || '').replace(/```html|```/g, '').trim();
  } catch (err) {
    console.error('Cleanup error:', err);
    return html; // Return original if cleanup fails
  }
};

const autoDetectDiagrams = async (imageBase64: string): Promise<ManualSelection[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const prompt = `
    Identify all visual elements on this handwritten lecture notes page that are NOT standard text.
    This includes:
    - Diagrams, sketches, and drawings
    - Mathematical graphs and coordinate systems (include axes and labels)
    - Flowcharts and process diagrams
    - Chemical structures and molecular models
    - Circuit diagrams and logic gates
    - Tables that are drawn by hand
    
    CRITICAL: The bounding box [ymin, xmin, ymax, xmax] must TIGHTLY encompass the entire visual element, including any associated labels, captions, or axis titles that are physically part of the diagram.
    
    Return ONLY a JSON array of objects with 'box_2d' property in normalized coordinates (0-1000).
    Example: [{"box_2d": [100, 200, 300, 400]}]
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: imageBase64.split(',')[1] } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    
    let data = [];
    try {
      data = JSON.parse(response.text || '[]');
    } catch (e) {
      console.error('JSON parse error:', e);
      // Try to extract JSON from markdown if it's there
      const match = response.text?.match(/\[\s*\{.*\}\s*\]/s);
      if (match) {
        try {
          data = JSON.parse(match[0]);
        } catch (e2) {
          console.error('Second attempt JSON parse error:', e2);
        }
      }
    }
    
    if (!Array.isArray(data)) data = [];

    return data.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      bounds: {
        ymin: item.box_2d[0],
        xmin: item.box_2d[1],
        ymax: item.box_2d[2],
        xmax: item.box_2d[3]
      },
      points: []
    }));
  } catch (err) {
    console.error('Auto-detect error:', err);
    return [];
  }
};

const TEMPLATE_CSS = `
    :root {
        --primary-color: #3498db;
        --sidebar-bg: #2c3e50;
        --sidebar-text: #ecf0f1;
        --sidebar-hover: #34495e;
        --content-max-width: 900px;
    }

    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        background-color: #f8f9fa;
        color: #212529;
        display: flex;
        min-height: 100vh;
    }
    
    .sidebar {
        width: 160px;
        background-color: var(--sidebar-bg);
        color: var(--sidebar-text);
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        overflow-y: auto;
        padding: 20px 10px;
        z-index: 100;
        box-shadow: 4px 0 10px rgba(0,0,0,0.1);
    }

    .sidebar h2 {
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        color: var(--primary-color);
    }

    .sidebar nav ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .sidebar nav li {
        margin-bottom: 8px;
    }

    .sidebar nav a {
        color: var(--sidebar-text);
        text-decoration: none;
        display: flex;
        align-items: center;
        padding: 10px 15px;
        border-radius: 8px;
        transition: all 0.2s ease;
        font-size: 0.95rem;
    }

    .sidebar nav a:hover {
        background-color: var(--sidebar-hover);
        transform: translateX(5px);
    }

    .sidebar nav a.active {
        background-color: var(--primary-color);
        color: white;
    }

    .main-wrapper {
        margin-left: 160px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    main {
        max-width: var(--content-max-width);
        margin: 0 auto;
        padding: 60px 40px;
        background-color: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.05);
        min-height: 100vh;
    }

    .doc-header {
        margin-bottom: 50px;
        padding-bottom: 30px;
        border-bottom: 2px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .download-original-btn {
        background-color: var(--primary-color);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: none;
        cursor: pointer;
    }

    .download-original-btn:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }

    .doc-title {
        font-size: 2.5rem;
        color: #2c3e50;
        margin: 0;
        line-height: 1.2;
    }

    @media (max-width: 1024px) {
        body {
            flex-direction: column;
        }
        .sidebar {
            width: 100%;
            position: relative;
            height: auto;
            padding: 20px;
        }
        .main-wrapper {
            margin-left: 0;
        }
        main {
            padding: 30px 20px;
        }
    }
    
    h3 { 
        color: #2c3e50; 
        border-bottom: 3px solid #3498db; 
        padding-bottom: 8px;
        margin-top: 30px;
        font-size: 1.5em;
    }
    h4 { 
        color: #34495e; 
        border-left: 4px solid #3498db;
        padding-left: 15px;
        margin-top: 25px;
        font-size: 1.3em;
    }
    h5 { 
        color: #5a6c7d; 
        font-size: 1.1em;
        margin-top: 20px;
    }
    
    .definition {
        background-color: #e8f5e8;
        padding: 15px;
        border: 1px solid #28a745;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 5px solid #28a745;
    }
    
    .theorem {
        background-color: #fff3cd;
        padding: 15px;
        border: 1px solid #ffc107;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 5px solid #ffc107;
    }
    
    .example {
        background-color: #f8f9fa;
        padding: 15px;
        border: 1px solid #6c757d;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 5px solid #007bff;
    }
    
    .important {
        background-color: #d1ecf1;
        padding: 15px;
        border: 1px solid #17a2b8;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 5px solid #17a2b8;
    }

    .side-by-side-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-bottom: 60px;
        align-items: start;
    }

    .side-by-side-image {
        position: sticky;
        top: 20px;
    }

    .side-by-side-image img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    @media (max-width: 768px) {
        .side-by-side-container {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        .side-by-side-image {
            position: static;
        }
    }
    
    .warning {
        background-color: #f8d7da;
        padding: 15px;
        border: 1px solid #dc3545;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 5px solid #dc3545;
    }
    
    .visual-desc {
        background-color: #e9ecef;
        padding: 12px;
        border-left: 4px solid #6c757d;
        font-style: italic;
        margin: 15px 0;
        border-radius: 0 5px 5px 0;
    }

    .inline-diagram-container { margin: 40px 0; text-align: center; }
    .inline-diagram-container img { display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 100%; height: auto; }
    .inline-diagram-caption { margin-top: 12px; font-size: 0.9em; color: #78716c; font-style: italic; font-weight: 500; }
    
    .steps {
        background-color: #f1f3f4;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
    }
    
    .solution {
        background-color: #f0f8f0;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 4px solid #28a745;
    }
    
    .page-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
    }

    figure {
        margin: 20px 0;
        text-align: center;
    }

    figure img {
        border: 2px solid #dee2e6;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-width: 100%;
        height: auto;
        border-radius: 4px;
    }

    figcaption {
        margin-top: 10px;
        font-size: 0.9em;
        color: #6c757d;
    }

    hr {
        margin: 40px 0;
        border: none;
        border-top: 2px solid #3498db;
    }
    
    table {
        border-collapse: collapse;
        width: 100%;
        margin: 15px 0;
    }
    th, td {
        border: 1px solid #dee2e6;
        padding: 12px;
        text-align: left;
    }
    th {
        background-color: #e9ecef;
        font-weight: bold;
    }
    tr:nth-child(even) {
        background-color: #f8f9fa;
    }
`;

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<'reading' | 'detecting' | 'converting' | 'cleaning'>('reading');
  const [isTypesetting, setIsTypesetting] = useState(false);
  const [step, setStep] = useState<'upload' | 'select' | 'processing' | 'results'>('upload');
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [manualSelections, setManualSelections] = useState<Record<number, ManualSelection[]>>({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<PageResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [mainMode, setMainMode] = useState<'default' | 'customize'>('default');
  const [conversionMode, setConversionMode] = useState<'transcription' | 'inline-diagrams' | 'side-by-side'>('inline-diagrams');
  const [diagramDetectionMode, setDiagramDetectionMode] = useState<'manual' | 'auto'>('auto');
  const [originalFileBase64, setOriginalFileBase64] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('original_notes.pdf');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editingHtml, setEditingHtml] = useState<string>('');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAutoDetectAll = async (targetPreviews?: PagePreview[]) => {
    const activePreviews = targetPreviews || previews;
    if (activePreviews.length === 0) return {};

    setIsProcessing(true);
    setProcessingPhase('detecting');
    setProgress({ current: 0, total: activePreviews.length });
    
    const newManualSelections: Record<number, ManualSelection[]> = { ...manualSelections };
    
    try {
      for (let i = 0; i < activePreviews.length; i++) {
        const preview = activePreviews[i];
        const detections = await autoDetectDiagrams(preview.imageBase64);
        newManualSelections[preview.pageNumber] = detections;
        setProgress({ current: i + 1, total: activePreviews.length });
      }
      setManualSelections(newManualSelections);
      return newManualSelections;
    } catch (err) {
      console.error(err);
      setError('Auto-detection failed. Please try manual selection.');
      return {};
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error || event.message);
      if (event.message === 'Script error.') {
        console.warn('A cross-origin script error occurred. Check CORS headers on external scripts.');
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Load MathJax for the preview
  useEffect(() => {
    // Set configuration BEFORE loading the script
    if (!window.MathJax || !window.MathJax.version) {
      window.MathJax = {
        tex: {
          inlineMath: [['\\(', '\\)']],
          displayMath: [['\\[', '\\]']]
        },
        options: {
          enableAssistiveMml: true
        },
        startup: {
          typeset: false // We'll handle typeset manually
        }
      };
    }

    const scriptId = 'mathjax-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    return () => {
      // We generally don't want to remove MathJax once loaded as it's a heavy library
      // and removing it might leave the window object in a broken state
    };
  }, []);

  // Re-typeset MathJax when results or viewMode changes
  useEffect(() => {
    if (results.length > 0 && viewMode === 'preview') {
      // @ts-ignore
      if (window.MathJax && window.MathJax.typesetPromise) {
        setIsTypesetting(true);
        // @ts-ignore
        window.MathJax.typesetPromise().finally(() => {
          setIsTypesetting(false);
        });
      }
    }
  }, [results, viewMode]);

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setProcessingPhase('reading');
    setError(null);
    setResults([]);
    setManualSelections({});
    setOriginalFileName(file.name);
    setOriginalFile(file);

    // Store original file as base64 for embedding in the final HTML
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setOriginalFileBase64(base64);
    };
    reader.readAsDataURL(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      setProgress({ current: 0, total: totalPages });

      const pagePreviews: PagePreview[] = [];
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        // @ts-ignore - pdfjs-dist types can be tricky between versions
        await page.render({ canvasContext: context!, viewport }).promise;
        
        pagePreviews.push({
          pageNumber: i,
          imageBase64: canvas.toDataURL('image/png'),
          width: viewport.width,
          height: viewport.height
        });
        setProgress({ current: i, total: totalPages });
      }

      setPreviews(pagePreviews);
      
      if (conversionMode === 'inline-diagrams') {
        if (diagramDetectionMode === 'auto') {
          const selections = await handleAutoDetectAll(pagePreviews);
          await startConversion(selections, pagePreviews);
        } else {
          setStep('select');
        }
      } else {
        // Text only - skip review and go straight to conversion
        await startConversion({}, pagePreviews);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while reading the PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startConversion = async (providedSelections?: Record<number, ManualSelection[]>, providedPreviews?: PagePreview[]) => {
    const activePreviews = providedPreviews || previews;
    if (activePreviews.length === 0) return;

    setIsProcessing(true);
    setStep('processing');
    setProcessingPhase('converting');
    setError(null);
    setResults([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      let completedCount = 0;
      const totalPages = activePreviews.length;
      setProgress({ current: 0, total: totalPages });

      const CONCURRENCY_LIMIT = 5;
      const processSinglePage = async (preview: PagePreview) => {
        const i = preview.pageNumber;
        const selections = (providedSelections || manualSelections)[i] || [];
        
        // 4. Intelligent Caching check
        const cacheKey = `${preview.imageBase64.substring(0, 1000)}_${conversionMode}_${selections.length}`;
        if (resultCache.has(cacheKey)) {
          const cached = resultCache.get(cacheKey)!;
          setResults(prev => [...prev, cached].sort((a, b) => a.pageNumber - b.pageNumber));
          completedCount++;
          setProgress({ current: completedCount, total: totalPages });
          return;
        }

        // 1. Client-Side Image Compression
        const compressedBase64Full = await compressImage(preview.imageBase64);
        const imageBase64 = compressedBase64Full.split(',')[1];

        const transcriptionPrompt = `
          Convert the attached handwritten lecture notes page into a WCAG 2.2 Level AA compliant HTML document chunk.
          
          CRITICAL REQUIREMENT: The output HTML must be a PAGE BY PAGE transcription. It should NOT deviate from the original handwritten notes in terms of content, structure, or sequence. Do not summarize, omit, or add information that isn't in the image.
          
          Key Requirements:
          1. Use proper MathJax delimiters: \\(inline math\\) and \\[display math\\]
          2. Maintain semantic HTML structure with proper heading hierarchy (start at h4 for major topics within this page).
          3. Apply appropriate color-coded containers:
             - <div class="definition"> for definitions
             - <div class="theorem"> for theorems/laws
             - <div class="example"> for examples
             - <div class="important"> for key notes
             - <div class="warning"> for warnings
             - <div class="solution"> for example solutions
             - <div class="visual-desc"> for detailed visual descriptions of any diagrams or graphs found on the page.
          4. Preserve all worked examples with step-by-step solutions exactly as written.
          5. Keep natural paragraph flow - avoid excessive bullet points unless they are in the original notes.
          6. Use tables only for structured data.
          7. Bold only for critical terms (Definition:, Theorem:, etc.).
          8. Maintain academic tone and precision.
          9. Return ONLY the HTML content that would go inside a <div class="page-content"> tag. Do not include the <div> tag itself or any markdown code blocks.
        `;

        const inlineDiagramsPrompt = `
          Convert the attached handwritten lecture notes page into a PAGE BY PAGE transcription with INLINE DIAGRAMS.
          
          CRITICAL REQUIREMENT: The output HTML must be a PAGE BY PAGE transcription, identical in content and structure to the original notes. 
          
          DIAGRAM PLACEMENT: 
          I have manually identified ${selections.length} diagrams on this page at the following normalized coordinates [ymin, xmin, ymax, xmax] (0-1000):
          ${selections.map((s, idx) => `diag-${idx}: [${s.bounds.ymin}, ${s.bounds.xmin}, ${s.bounds.ymax}, ${s.bounds.xmax}]`).join('\n')}

          In the HTML output, place a special tag <diagram-placeholder id="diag-N" ymin="Y1" xmin="X1" ymax="Y2" xmax="X2" alt="Detailed description of the diagram"></diagram-placeholder> exactly where each diagram appears in the notes.
          Use the IDs provided (diag-0, diag-1, etc.) and the coordinates I gave you.
          
          ALT TEXT GUIDELINES:
          The 'alt' attribute must provide a comprehensive, accessible description of the diagram.
          - Identify the type of diagram (e.g., "Line graph showing...", "Flowchart of...").
          - Describe the main components and their relationships.
          - For graphs: Mention axes, scales, and key data points or trends.
          - For flowcharts: Describe the sequence of steps and decision points.
          - Include any text, labels, or formulas that are part of the diagram itself.
          - Aim for a description that allows a visually impaired student to fully understand the educational content of the diagram.
          
          Key Requirements:
          1. Use proper MathJax delimiters: \\(inline math\\) and \\[display math\\]
          2. Maintain semantic HTML structure with proper heading hierarchy (start at h4 for major topics within this page).
          3. Apply appropriate color-coded containers:
             - <div class="definition"> for definitions
             - <div class="theorem"> for theorems/laws
             - <div class="example"> for examples
             - <div class="important"> for key notes
             - <div class="warning"> for warnings
             - <div class="solution"> for example solutions
          4. NO VISUAL DESCRIPTION DIV: Do NOT include a separate <div class="visual-desc"> for diagrams that have a <diagram-placeholder>. The detailed description MUST be contained entirely within the 'alt' attribute of the placeholder tag.
          5. Preserve all worked examples with step-by-step solutions exactly as written.
          6. Keep natural paragraph flow - avoid excessive bullet points unless they are in the original notes.
          7. Use tables only for structured data.
          8. Bold only for critical terms (Definition:, Theorem:, etc.).
          9. Maintain academic tone and precision.
          10. Return ONLY the HTML content that would go inside a <div class="page-content"> tag. Do not include the <div> tag itself or any markdown code blocks.
        `;

        const prompt = (conversionMode === 'transcription' || conversionMode === 'side-by-side') ? transcriptionPrompt : inlineDiagramsPrompt;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
              ]
            }
          ]
        });

        let cleanedHtml = (response.text || '').replace(/```html|```/g, '').trim();
        const diagrams: DiagramData[] = [];

        // If in inline-diagrams mode, process placeholders and crop images
        if (conversionMode === 'inline-diagrams') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(cleanedHtml, 'text/html');
          const placeholders = Array.from(doc.querySelectorAll('diagram-placeholder'));

          const mainCanvas = document.createElement('canvas');
          const mainCtx = mainCanvas.getContext('2d');
          const img = new Image();
          img.src = preview.imageBase64;
          await new Promise(resolve => img.onload = resolve);
          mainCanvas.width = img.width;
          mainCanvas.height = img.height;
          mainCtx?.drawImage(img, 0, 0);

          for (const placeholder of placeholders) {
            const placeholderId = placeholder.getAttribute('id') || '';
            const match = placeholderId.match(/diag-(\d+)/);
            const selectionIndex = match ? parseInt(match[1]) : -1;
            const selection = selections[selectionIndex];

            if (selection) {
              const { xmin, ymin, xmax, ymax } = selection.bounds;
              const alt = placeholder.getAttribute('alt') || 'Diagram from notes';
              const id = `diag-${Math.random().toString(36).substr(2, 9)}`;

              const cropCanvas = document.createElement('canvas');
              const cropCtx = cropCanvas.getContext('2d');
              
              const sourceX = (xmin / 1000) * mainCanvas.width;
              const sourceY = (ymin / 1000) * mainCanvas.height;
              const sourceWidth = ((xmax - xmin) / 1000) * mainCanvas.width;
              const sourceHeight = ((ymax - ymin) / 1000) * mainCanvas.height;

              cropCanvas.width = sourceWidth;
              cropCanvas.height = sourceHeight;

              if (cropCtx) {
                cropCtx.drawImage(
                  mainCanvas,
                  sourceX, sourceY, sourceWidth, sourceHeight,
                  0, 0, sourceWidth, sourceHeight
                );
                
                const croppedBase64 = cropCanvas.toDataURL('image/png');
                
                diagrams.push({
                  id,
                  originalBase64: croppedBase64,
                  editedBase64: croppedBase64,
                  alt,
                  width: 100
                });

                placeholder.setAttribute('id', id);
              }
            }
          }
          cleanedHtml = doc.body.innerHTML;
        }

        // 3. Concurrent WCAG Cleanup
        const issues = checkAccessibility(cleanedHtml);
        if (issues.length > 0) {
          cleanedHtml = await runWcagCleanup(cleanedHtml, i);
        }

        const accessibilityIssues = checkAccessibility(cleanedHtml);
        
        const result: PageResult = {
          pageNumber: i,
          imageBase64: preview.imageBase64,
          htmlContent: cleanedHtml,
          accessibilityIssues,
          diagrams
        };

        // 4. Update Cache
        resultCache.set(cacheKey, result);

        // 2. Streaming Results (Incremental UI)
        setResults(prev => [...prev, result].sort((a, b) => a.pageNumber - b.pageNumber));
        completedCount++;
        setProgress({ current: completedCount, total: totalPages });
      };

      for (let i = 0; i < activePreviews.length; i += CONCURRENCY_LIMIT) {
        const batch = activePreviews.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(batch.map(p => processSinglePage(p)));
      }

      setStep('results');
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing the PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyChanges = async (userRequest: string) => {
    if (results.length === 0) return;

    setIsProcessing(true);
    setProcessingPhase('cleaning'); // Re-using cleaning phase for refinement
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const updatedResults = [...results];
      
      // Process each page's HTML content with the user's request
      const processPageEdit = async (index: number) => {
        const currentResult = updatedResults[index];
        
        const prompt = `
          You are an expert academic editor. Below is a page by page HTML transcription of a handwritten lecture notes page.
          
          USER REQUEST: "${userRequest}"
          
          CURRENT HTML CONTENT:
          ${currentResult.htmlContent}
          
          INSTRUCTIONS:
          1. Apply the user's request to the HTML content.
          2. Maintain the existing page by page transcription quality.
          3. DO NOT remove or modify any <diagram-placeholder> tags unless specifically requested.
          4. Preserve all MathJax formatting (\\( ... \\) and \\[ ... \\]).
          5. Keep the semantic structure (headings, color-coded divs like .definition, .theorem, etc.).
          6. Return ONLY the updated HTML content that goes inside the page container. Do not include markdown code blocks.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: prompt }] }]
        });

        const newHtml = response.text || currentResult.htmlContent;
        
        // Update the result in the array
        updatedResults[index] = {
          ...currentResult,
          htmlContent: newHtml
        };
      };

      // Process pages in parallel
      await Promise.all(updatedResults.map((_, idx) => processPageEdit(idx)));
      
      setResults(updatedResults);
    } catch (err) {
      console.error(err);
      setError('An error occurred while applying changes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (autoOpen = false, currentResults?: PageResult[]) => {
    const dataToUse = currentResults || results;
    if (dataToUse.length === 0) return;

    // Extract title from the first line of the first page
    const firstPageHtml = dataToUse[0].htmlContent;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = firstPageHtml;
    const firstLine = tempDiv.innerText.trim().split('\n')[0] || 'Untitled Document';
    const docTitle = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;

    const baseFileName = customFileName.trim() 
      ? (customFileName.endsWith('.html') ? customFileName.replace('.html', '') : customFileName)
      : `Accessible_${originalFileName.replace('.pdf', '')}`;
    
    const htmlFileName = `${baseFileName}.html`;
    const pdfFileName = `${baseFileName}.pdf`;

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle} - Accessible Transcription</title>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['\\\\(', '\\\\)']],
                displayMath: [['\\\\[', '\\\\]']]
            },
            options: {
                enableAssistiveMml: true
            }
        };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js" crossorigin="anonymous"></script>
    <style>
        ${TEMPLATE_CSS}
    </style>
</head>
<body>
    <aside class="sidebar" role="complementary">
        <h2>Table of Contents</h2>
        <nav aria-label="Page navigation">
            <ul>
                ${dataToUse.map(res => `
                    <li><a href="#page-section-${res.pageNumber}">Page ${res.pageNumber}</a></li>
                `).join('')}
            </ul>
        </nav>
    </aside>

    <div class="main-wrapper">
        <main id="main-content" role="main">
            <header class="doc-header">
                <div style="flex: 1;">
                    <h1 class="doc-title">${docTitle}</h1>
                    <p style="color: #6c757d; margin-top: 10px;">Accessible transcription generated on ${new Date().toLocaleDateString()}</p>
                </div>
                ${originalFileBase64 ? `
                <a href="${originalFileBase64}" download="${pdfFileName}" class="download-original-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Original Notes
                </a>
                ` : ''}
            </header>

            ${dataToUse.map(res => {
              let pageHtml = res.htmlContent;
              
              // Replace placeholders with actual edited images for the download
              if (conversionMode === 'inline-diagrams' && res.diagrams) {
                res.diagrams.forEach(diag => {
                  const imgHtml = `
                    <div class="inline-diagram-container" style="width: ${diag.width}%; margin-left: auto; margin-right: auto;">
                      <img src="${diag.editedBase64}" alt="${diag.alt}">
                    </div>
                  `;
                  // Use a more robust replacement that handles both self-closing and separate tags
                  const placeholderRegex = new RegExp(`<diagram-placeholder[^>]*id="${diag.id}"[^>]*>(?:.*?<\/diagram-placeholder>)?`, 'g');
                  pageHtml = pageHtml.replace(placeholderRegex, imgHtml);
                });
              }

              return `
                <section id="page-section-${res.pageNumber}" aria-labelledby="page-title-${res.pageNumber}">
                    <h3 id="page-title-${res.pageNumber}">Page ${res.pageNumber}</h3>
                    ${conversionMode === 'side-by-side' ? `
                    <div class="side-by-side-container">
                        <div class="side-by-side-image">
                            <img src="${res.imageBase64}" alt="Original handwritten page ${res.pageNumber}">
                        </div>
                        <div class="page-content">
                            ${pageHtml}
                        </div>
                    </div>
                    ` : `
                    ${conversionMode === 'transcription' ? `
                    <figure>
                        <img src="${res.imageBase64}" alt="Original handwritten page ${res.pageNumber}">
                        <figcaption><strong>Original handwritten page ${res.pageNumber}</strong></figcaption>
                    </figure>
                    ` : ''}
                    <div class="page-content">
                        ${pageHtml}
                    </div>
                    `}
                    ${res.pageNumber < dataToUse.length ? '<hr style="margin: 60px 0; border: 0; border-top: 1px solid #eee;">' : ''}
                </section>
              `;
            }).join('')}
        </main>
        
        <footer style="text-align: center; padding: 20px; margin-top: auto; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 0.8em; background: white;">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </footer>
    </div>

    <script>
        // Simple scroll spy for the sidebar
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.sidebar nav a');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        });
    </script>
</body>
</html>
    `.trim();

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    if (autoOpen) {
      window.open(url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = htmlFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f4] font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header role="banner" className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                <FileText className="text-black w-7 h-7" />
              </div>
              <div className="absolute -top-1 -right-1 bg-white text-black text-[8px] font-black px-1 rounded border border-black/10 shadow-sm">
                MIT
              </div>
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tighter italic">InkAccess 🖋️</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">Accessible HTML Generator</p>
                <div className="flex items-center gap-1.5 ml-2 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", process.env.GEMINI_API_KEY ? "bg-emerald-500" : "bg-red-500")} />
                  <span className="text-[8px] text-stone-300 font-black uppercase tracking-tighter">
                    {process.env.GEMINI_API_KEY ? "Live" : "Offline"}
                  </span>
                </div>
                <span className="text-[8px] text-stone-500 font-bold uppercase tracking-widest ml-2 border-l border-white/10 pl-2">
                  MIT License • © 2026 Mahesh Sunkula
                </span>
              </div>
            </div>
          </div>

          {step === 'results' && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-4">
                <label htmlFor="filename" className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">File Name</label>
                <input 
                  id="filename"
                  type="text" 
                  placeholder="Enter file name..."
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors w-48"
                />
              </div>
              <button
                onClick={() => {
                  setStep('upload');
                  setResults([]);
                  setPreviews([]);
                  setManualSelections({});
                  setIsProcessing(false);
                  setProgress({ current: 0, total: 0 });
                  setCustomFileName('');
                }}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all border border-white/10"
              >
                Regenerate
              </button>
              <button
                onClick={() => handleDownload(false)}
                aria-label="Download converted HTML document"
                className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download HTML
              </button>
            </div>
          )}
        </div>
      </header>

      <main role="main" aria-busy={isProcessing} className="max-w-[1800px] mx-auto px-8 py-12 space-y-12">
        <div className="flex justify-center -mt-8 mb-4">
          <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.4em] opacity-40">Licensed under MIT • © 2026 Mahesh Sunkula</p>
        </div>
        {/* Top Section: Info & Upload */}
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {step === 'upload' && (
            <>
              <div className="flex flex-col items-center gap-8 mb-12">
                <div className="flex justify-center gap-6">
                  <button
                    onClick={() => {
                      setMainMode('default');
                      setConversionMode('inline-diagrams');
                      setDiagramDetectionMode('manual');
                    }}
                    className={cn(
                      "px-12 py-5 rounded-[32px] text-sm font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-3",
                      mainMode === 'default'
                        ? "bg-emerald-400 text-black border-white shadow-[0_0_40px_rgba(52,211,153,0.3)] scale-105" 
                        : "bg-white/5 text-stone-400 border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {mainMode === 'default' && <CheckCircle2 className="w-5 h-5" />}
                    Default
                  </button>
                  <button
                    onClick={() => setMainMode('customize')}
                    className={cn(
                      "px-12 py-5 rounded-[32px] text-sm font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-3",
                      mainMode === 'customize'
                        ? "bg-emerald-400 text-black border-white shadow-[0_0_40px_rgba(52,211,153,0.3)] scale-105" 
                        : "bg-white/5 text-stone-400 border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {mainMode === 'customize' && <CheckCircle2 className="w-5 h-5" />}
                    Customize
                  </button>
                </div>

                {mainMode === 'customize' ? (
                  <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="text-[10px] text-stone-500 font-black uppercase tracking-[0.2em] mb-2 opacity-60">Select Custom Option</div>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setConversionMode('transcription')}
                        className={cn(
                          "px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-2",
                          conversionMode === 'transcription' 
                            ? "bg-white/20 text-white border-white/40 shadow-lg" 
                            : "bg-white/5 text-stone-500 border-white/10 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        {conversionMode === 'transcription' && <CheckCircle2 className="w-4 h-4" />}
                        Page by Page
                      </button>
                      <button
                        onClick={() => setConversionMode('side-by-side')}
                        className={cn(
                          "px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-2",
                          conversionMode === 'side-by-side' 
                            ? "bg-white/20 text-white border-white/40 shadow-lg" 
                            : "bg-white/5 text-stone-500 border-white/10 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        {conversionMode === 'side-by-side' && <CheckCircle2 className="w-4 h-4" />}
                        Side by Side
                      </button>
                      <button
                        onClick={() => {
                          setConversionMode('inline-diagrams');
                          setDiagramDetectionMode('auto');
                        }}
                        className={cn(
                          "px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-2",
                          conversionMode === 'inline-diagrams' && diagramDetectionMode === 'auto'
                            ? "bg-white/20 text-white border-white/40 shadow-lg" 
                            : "bg-white/5 text-stone-500 border-white/10 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        {(conversionMode === 'inline-diagrams' && diagramDetectionMode === 'auto') && <CheckCircle2 className="w-4 h-4" />}
                        AI Auto Detect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <Edit3 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Manual Diagram Selection</span>
                    </div>
                  </div>
                )}
                
                <p className="text-stone-500 text-sm font-medium text-center max-w-lg italic">
                  {mainMode === 'default' 
                    ? "Manually select areas of your notes that contain diagrams to be extracted and placed inline (Recommended for accuracy)."
                    : conversionMode === 'transcription' 
                      ? "Strictly transcribes every word, formula, and symbol exactly as written in your notes, page by page, with notes followed by html." 
                      : conversionMode === 'side-by-side'
                        ? "Creates a two-column layout with the original handwritten notes on the left and the accessible transcription on the right."
                        : "Uses AI to automatically identify and extract diagrams to place them contextually inline with the text."}
                </p>
              </div>

              <div 
                role="button"
                tabIndex={0}
                aria-label="Upload PDF lecture notes"
                aria-describedby="upload-desc"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) processFile(file);
                }}
                className="group relative border-2 border-dashed border-white/10 hover:border-emerald-500/50 bg-white/5 rounded-[40px] p-16 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.07]"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf"
                  aria-hidden="true"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                  }}
                />
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-white/10">
                  <FileUp className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Drop/Upload pdf here</h3>
                <p id="upload-desc" className="text-stone-500 text-center text-sm font-medium">
                  Max 20 pages for best results.
                </p>
              </div>
              <p className="text-stone-400 text-xl leading-relaxed font-medium text-center max-w-2xl mx-auto">
                Transform your handwritten lectures into semantic, WCAG-compliant HTML with MathJax precision.
              </p>
            </>
          )}

          {step === 'select' && (
            <div className="space-y-8">
              {isProcessing && diagramDetectionMode === 'auto' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">AI is detecting diagrams...</span>
                  </div>
                  <span className="text-xs font-black text-emerald-500">{progress.current} / {progress.total}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    {conversionMode === 'inline-diagrams' ? 'Identify Diagrams' : 'Review Pages'}
                  </h2>
                  <p className="text-stone-500 mt-2">
                    {conversionMode === 'inline-diagrams' 
                      ? (diagramDetectionMode === 'auto' 
                          ? 'AI will automatically detect diagrams. You can review and adjust them below.' 
                          : 'Use the lasso or rectangle tool to select diagrams on each page.')
                      : 'Review the extracted pages before starting the transcription.'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {conversionMode === 'inline-diagrams' && (
                    <button
                      onClick={() => setManualSelections({})}
                      className="p-3 bg-white/5 hover:bg-red-500/20 text-stone-400 hover:text-red-400 rounded-full transition-all border border-white/10"
                      title="Clear All Selections"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  {conversionMode === 'inline-diagrams' && diagramDetectionMode === 'auto' && (
                    <button
                      onClick={async () => {
                        const selections = await handleAutoDetectAll();
                        await startConversion(selections);
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-full font-bold text-sm transition-all border border-white/10"
                    >
                      <Wand2 className={cn("w-4 h-4", isProcessing && "animate-spin")} />
                      Auto-Detect All
                    </button>
                  )}
                  <button
                    onClick={() => startConversion()}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-emerald-500 text-black px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:scale-100"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isProcessing ? 'Processing...' : 'Start Conversion'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-12">
                {isProcessing && previews.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-[32px] p-8 border border-white/10 space-y-6">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <Skeleton className="aspect-[3/4] w-full" />
                    </div>
                  ))
                ) : (
                  previews.map((preview) => (
                  <div key={preview.pageNumber} className="bg-white/5 rounded-[32px] p-8 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Page {preview.pageNumber}</h3>
                      <div className="flex items-center gap-4">
                        {conversionMode === 'inline-diagrams' && diagramDetectionMode === 'auto' && (
                          <button
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                const detections = await autoDetectDiagrams(preview.imageBase64);
                                setManualSelections(prev => ({
                                  ...prev,
                                  [preview.pageNumber]: detections
                                }));
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded-lg border border-white/10 transition-all"
                          >
                            <Wand2 className={cn("w-3 h-3", isProcessing && "animate-spin")} />
                            Auto-Detect Page
                          </button>
                        )}
                        {conversionMode === 'inline-diagrams' && (
                          <div className="text-xs font-black uppercase tracking-widest text-stone-500">
                            {manualSelections[preview.pageNumber]?.length || 0} Selections
                          </div>
                        )}
                      </div>
                    </div>
                    {conversionMode === 'inline-diagrams' ? (
                      <ManualDiagramSelector 
                        pageImage={preview.imageBase64}
                        selections={manualSelections[preview.pageNumber] || []}
                        onUpdate={(newSelections) => {
                          setManualSelections(prev => ({
                            ...prev,
                            [preview.pageNumber]: newSelections
                          }));
                        }}
                      />
                    ) : (
                      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10">
                        <img src={preview.imageBase64} alt={`Page ${preview.pageNumber}`} className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

              <div className="flex justify-center pt-8">
                <button
                  onClick={() => startConversion()}
                  disabled={isProcessing}
                  className="flex items-center gap-3 bg-emerald-500 text-black px-12 py-4 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/40 disabled:opacity-50 disabled:scale-100"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                  {isProcessing ? 'Processing...' : 'Finalize & Convert'}
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="bg-white/5 rounded-[40px] p-16 flex flex-col items-center justify-center border border-white/10" aria-live="polite">
              <div className="relative w-32 h-32 mb-8">
                <Loader2 className={`w-32 h-32 ${isCleaningUp ? 'text-amber-500' : 'text-emerald-500'} animate-spin`} aria-hidden="true" />
                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">
                  {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                </div>
              </div>
              
              <div className="w-full max-w-md h-2 bg-white/5 rounded-full overflow-hidden mb-8">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-out",
                    isCleaningUp ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>

              <h3 className="text-2xl font-bold mb-2">
                {processingPhase === 'reading' && 'Reading PDF Document...'}
                {processingPhase === 'detecting' && 'AI Detecting Diagrams...'}
                {processingPhase === 'converting' && 'Analyzing Ink & Transcribing...'}
                {processingPhase === 'cleaning' && 'Ensuring WCAG Compliance...'}
              </h3>
              <p className="text-stone-500 font-medium text-lg">
                {processingPhase === 'reading' && `Extracting Page ${progress.current} of ${progress.total}`}
                {processingPhase === 'detecting' && `Scanning Page ${progress.current} of ${progress.total}`}
                {processingPhase === 'converting' && `Transcribing Page ${progress.current} of ${progress.total}`}
                {processingPhase === 'cleaning' && `Optimizing Page ${progress.current}`}
              </p>
              {processingPhase === 'cleaning' && (
                <p className="text-amber-500/60 text-xs font-black uppercase tracking-[0.2em] mt-4 animate-pulse">
                  WCAG 2.2 Level AA Audit in Progress
                </p>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-bold text-red-500 uppercase tracking-wider text-xs mb-2">Error</h3>
                <p className="text-red-200/80 text-sm font-medium leading-relaxed">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-4 text-xs font-black text-white uppercase tracking-widest hover:underline"
                >
                  Reset & Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Results */}
        <div className="w-full">
          {step === 'results' && results.length > 0 ? (
            <div className="space-y-12">
              <div className="flex items-center justify-between sticky top-24 z-40 bg-black/80 backdrop-blur-md py-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" aria-hidden="true" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">Output Preview</h2>
                  <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                    {conversionMode === 'transcription' 
                      ? 'Page by Page' 
                      : diagramDetectionMode === 'auto' 
                        ? 'Inline Diagrams (Auto)' 
                        : 'Inline Diagrams (Manual)'}
                  </span>
                </div>
                <div className="flex bg-white/5 p-1.5 rounded-full border border-white/10" role="group" aria-label="View mode">
                  <button
                    aria-pressed={viewMode === 'preview'}
                    onClick={() => setViewMode('preview')}
                    className={cn(
                      "flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all",
                      viewMode === 'preview' ? "bg-white text-black shadow-lg" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    Preview
                  </button>
                  <button
                    aria-pressed={viewMode === 'code'}
                    onClick={() => setViewMode('code')}
                    className={cn(
                      "flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all",
                      viewMode === 'code' ? "bg-white text-black shadow-lg" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    <Code className="w-4 h-4" aria-hidden="true" />
                    Note HTML
                  </button>
                </div>
              </div>

              {/* Math Rendering Status & Export Section */}
              <div className="flex flex-col md:flex-row gap-8 items-start justify-between bg-white/5 rounded-[32px] p-8 border border-white/10">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Math Rendering Status</h3>
                  <div className="flex items-center gap-4">
                    {isTypesetting ? (
                      <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-widest rounded-full border border-amber-500/20 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Typesetting MathJax...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        MathJax Rendered
                      </div>
                    )}
                    <button
                      onClick={() => handleDownload(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-full border border-white/10 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Full View
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-auto space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Export Accessible Document</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Enter filename..."
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all min-w-[240px]"
                    />
                    <button
                      onClick={() => handleDownload(false)}
                      className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4" />
                      Download HTML
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-24">
                {isProcessing && results.length === 0 ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="space-y-12 bg-white/5 rounded-[48px] p-16 border border-white/10">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-4 space-y-6">
                          <Skeleton className="aspect-[3/4] w-full rounded-[32px]" />
                          <Skeleton className="h-24 w-full rounded-3xl" />
                        </div>
                        <div className="lg:col-span-8 space-y-8">
                          <div className="flex justify-between">
                            <Skeleton className="h-8 w-48" />
                            <div className="flex gap-2">
                              <Skeleton className="h-10 w-32 rounded-full" />
                              <Skeleton className="h-10 w-32 rounded-full" />
                            </div>
                          </div>
                          <Skeleton className="h-[800px] w-full rounded-[40px]" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  results.map((res) => (
                    <div key={res.pageNumber} className="relative space-y-12 bg-white/5 rounded-[48px] p-16 border border-white/10">
                      {isProcessing && (
                        <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] rounded-[48px] flex items-center justify-center">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest text-white">Updating Page {res.pageNumber}...</span>
                          </div>
                        </div>
                      )}
                      <div className={cn(
                        "grid grid-cols-1 gap-16 items-start",
                        (conversionMode === 'transcription' || conversionMode === 'side-by-side') ? "lg:grid-cols-12" : "lg:grid-cols-1"
                      )}>
                      {/* Original Thumbnail (Reference) - Only show in transcription or side-by-side mode */}
                      {(conversionMode === 'transcription' || conversionMode === 'side-by-side') && (
                        <div className="lg:col-span-4 space-y-6">
                          <div className="sticky top-48">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-[32px] border-4 border-white/10 shadow-2xl">
                              <img 
                                src={res.imageBase64} 
                                alt={`Original page ${res.pageNumber}`} 
                                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                              />
                              <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                <span className="text-xs font-black uppercase tracking-widest">Original Page {res.pageNumber}</span>
                              </div>
                            </div>
                            <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10">
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-4">Accessibility Status</h4>
                              <div className="flex items-center gap-3">
                                {res.accessibilityIssues.length === 0 ? (
                                  <span className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                    <CheckCircle2 className="w-4 h-4" />
                                    WCAG AA Pass
                                  </span>
                                ) : (
                                  <span className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full border",
                                    res.accessibilityIssues.some(i => i.type === 'error') 
                                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  )}>
                                    <AlertCircle className="w-4 h-4" />
                                    {res.accessibilityIssues.length} Alerts
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview (Full Width Content) */}
                      <div className={cn(
                        "space-y-8",
                        (conversionMode === 'transcription' || conversionMode === 'side-by-side') ? "lg:col-span-8" : "lg:col-span-12 max-w-4xl mx-auto w-full"
                      )}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">Page {res.pageNumber}</h3>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setEditingPage(res.pageNumber);
                                setEditingHtml(res.htmlContent);
                                setIsEditingModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-full border border-white/10 transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit HTML
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(res.htmlContent);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-full border border-white/10 transition-all"
                            >
                              <Copy className="w-4 h-4" />
                              Copy HTML
                            </button>
                          </div>
                        </div>
                        <div className="bg-white rounded-[40px] overflow-hidden text-black min-h-[1000px] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                          {viewMode === 'preview' ? (
                            <div className="p-16">
                              <style>{TEMPLATE_CSS}</style>
                              {conversionMode === 'inline-diagrams' ? (
                                // Render content with interactive diagram editors
                                res.htmlContent.split(/(<diagram-placeholder[^>]*>.*?<\/diagram-placeholder>|<diagram-placeholder[^>]*\/>)/g).map((part, idx) => {
                                  const match = part.match(/id="([^"]+)"/);
                                  if (match) {
                                    const diagId = match[1];
                                    const diagram = res.diagrams.find(d => d.id === diagId);
                                    if (diagram) {
                                      return (
                                        <DiagramEditor 
                                          key={diagId} 
                                          diagram={diagram} 
                                          onUpdate={(updates) => {
                                            setResults(prev => prev.map(p => 
                                              p.pageNumber === res.pageNumber 
                                                ? { 
                                                    ...p, 
                                                    diagrams: p.diagrams.map(d => d.id === diagId ? { ...d, ...updates } : d) 
                                                  } 
                                                : p
                                            ));
                                          }}
                                        />
                                      );
                                    }
                                  }
                                  return <div key={idx} className="prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: part }} />;
                                })
                              ) : (
                                <div 
                                  className="prose prose-stone max-w-none"
                                  dangerouslySetInnerHTML={{ __html: res.htmlContent }} 
                                />
                              )}
                            </div>
                          ) : (
                            <div className="bg-stone-950 p-12 h-full min-h-[1000px] overflow-auto">
                              <pre className="text-emerald-500 text-base font-mono leading-relaxed">
                                <code>{res.htmlContent}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

              <RequestChangesSection 
                isProcessing={isProcessing} 
                onApplyChanges={(request) => handleApplyChanges(request)} 
              />
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-[48px] text-center">
              <div className="space-y-4 opacity-20">
                <FileText className="w-20 h-20 mx-auto" />
                <p className="text-2xl font-bold uppercase tracking-widest">Awaiting Input</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* HTML Editing Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm">
          <div className="bg-stone-900 w-full max-w-6xl h-full max-h-[90vh] rounded-[48px] border border-white/10 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Edit3 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Edit Page {editingPage} HTML</h2>
                  <p className="text-xs font-black uppercase tracking-widest text-stone-500 mt-1">Manual HTML Editor</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingModalOpen(false)}
                className="p-3 hover:bg-white/10 rounded-full transition-all text-stone-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 p-8 overflow-hidden flex flex-col gap-6">
              <div className="flex-1 bg-black/40 rounded-3xl border border-white/10 overflow-hidden">
                <textarea
                  value={editingHtml}
                  onChange={(e) => setEditingHtml(e.target.value)}
                  className="w-full h-full p-8 bg-transparent text-emerald-500 font-mono text-sm focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                      onClick={async () => {
                        setIsProcessing(true);
                        try {
                          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                          const prompt = `
                            You are an expert academic editor. Below is a page by page HTML transcription of a handwritten lecture notes page.
                            
                            TASK: Clean up and refine the HTML structure while maintaining all content and formatting.
                            
                            CURRENT HTML:
                            ${editingHtml}
                            
                            INSTRUCTIONS:
                            1. Fix any structural issues or inconsistencies.
                            2. Ensure proper semantic HTML.
                            3. Preserve all MathJax and diagram placeholders.
                            4. Return ONLY the cleaned HTML.
                          `;
                          const response = await ai.models.generateContent({
                            model: "gemini-3-flash-preview",
                            contents: [{ parts: [{ text: prompt }] }]
                          });
                          if (response.text) {
                            setEditingHtml(response.text.replace(/```html|```/g, '').trim());
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-widest rounded-2xl border border-white/10 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {isProcessing ? 'Refining...' : 'Refine with AI'}
                    </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-8 py-3 text-stone-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingPage !== null) {
                        setResults(prev => prev.map(p => 
                          p.pageNumber === editingPage ? { ...p, htmlContent: editingHtml } : p
                        ));
                      }
                      setIsEditingModalOpen(false);
                    }}
                    className="flex items-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
