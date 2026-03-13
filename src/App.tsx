/**
 * © 2026 Mahesh Sunkula
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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
  X,
  Sigma,
  BookOpen,
  Accessibility,
  Image as ImageIcon,
  HelpCircle,
  AlertTriangle
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

interface StylingOptions {
  primaryColor: string;
  fontFamily: string;
  contentMaxWidth: string;
  lineHeight: string;
  fontSize: string;
  sidebarBg: string;
  sidebarText: string;
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
  alt?: string;
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

const Documentation = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/95 backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <BookOpen className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">InkAccess Documentation</h2>
            <p className="text-xs text-stone-500">v2.5.0 • Learn how to create accessible lecture notes</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Introduction */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold text-white tracking-tight">Welcome to InkAccess v2.5.0</h3>
            <p className="text-stone-400 text-lg leading-relaxed">
              InkAccess is a specialized tool designed for students and educators to transform handwritten lecture notes into semantic, WCAG 2.2 Level AA compliant HTML documents. It uses advanced AI to recognize handwriting, complex mathematical formulas (MathJax), and diagrams.
            </p>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-red-400 text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Important Note on Accuracy
              </p>
              <p className="text-red-400/80 text-xs mt-1">
                The "Default" mode is optimized for extreme speed and uses a lighter AI model. While fast, it has the **highest chance of making mistakes** in transcription or diagram placement. For critical academic work, always choose a **Customize** option for significantly higher accuracy.
              </p>
            </div>
          </section>

          {/* Core Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                <Wand2 className="w-6 h-6 text-indigo-500" />
              </div>
              <h4 className="text-xl font-bold">AI Transcription</h4>
              <p className="text-stone-400 text-sm leading-relaxed">
                Automatically converts handwriting into clean text while preserving academic structure like definitions, theorems, and examples.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <Sigma className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="text-xl font-bold">MathJax Support</h4>
              <p className="text-stone-400 text-sm leading-relaxed">
                Recognizes complex LaTeX-style math formulas and renders them using MathJax for perfect accessibility and visual quality.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                <ImageIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="text-xl font-bold">Diagram Extraction</h4>
              <p className="text-stone-400 text-sm leading-relaxed">
                Extracts diagrams from your notes and generates detailed AI-powered visual descriptions for screen readers.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <Accessibility className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="text-xl font-bold">WCAG Compliance</h4>
              <p className="text-stone-400 text-sm leading-relaxed">
                Every document undergoes an automated accessibility audit to ensure it meets modern web standards.
              </p>
            </div>
          </div>

          {/* Detailed Mode Breakdown */}
          <section className="space-y-12">
            <h3 className="text-2xl font-bold text-white">Detailed Mode Breakdown</h3>
            
            <div className="grid grid-cols-1 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Default</span>
                  <h4 className="text-xl font-bold text-white">Speed-First Conversion</h4>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed">
                  Optimized for quick previews. It uses the <code className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">gemini-3.1-flash-lite</code> model with low reasoning levels. 
                  <br /><br />
                  <strong className="text-red-400">Trade-off:</strong> This mode skips deep accessibility audits and uses aggressive image compression. It is prone to "hallucinations" in complex handwriting or dense diagrams.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">Customize</span>
                  <h4 className="text-xl font-bold text-white">Accuracy-First Options</h4>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed">
                  Uses the full <code className="text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">gemini-3-flash</code> model with high reasoning. This is the recommended way for final submissions or study materials.
                </p>
                
                <div className="space-y-8 mt-6">
                  {/* Category 1: In-line Diagrams */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-widest text-stone-500 border-b border-white/5 pb-2">Category: In-line Diagrams</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Wand2 className="w-4 h-4 text-emerald-400" />
                          <h6 className="font-bold text-white">Auto Detection</h6>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Uses AI vision to scan your notes for visual elements. It automatically creates bounding boxes and extracts them, placing them contextually within the transcribed text. 
                          <br /><br />
                          <span className="text-emerald-400/80">Best for:</span> Standard diagrams and quick high-quality notes.
                        </p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-indigo-400" />
                          <h6 className="font-bold text-white">Manual Selection</h6>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Gives you full control. You draw boxes around the diagrams you want to extract. This ensures that only the relevant parts are captured and prevents AI from misidentifying text as diagrams.
                          <br /><br />
                          <span className="text-indigo-400/80">Best for:</span> Complex, dense, or overlapping notes where AI might struggle.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Notes-Html */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-widest text-stone-500 border-b border-white/5 pb-2">Category: Notes-Html</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <h6 className="font-bold text-white">Page by Page</h6>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          A linear, accessible flow. Each page of your original notes is displayed, followed immediately by its full HTML conversion. 
                          <br /><br />
                          <span className="text-amber-400/80">Best for:</span> Screen readers and mobile reading where a single column is preferred.
                        </p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-purple-400" />
                          <h6 className="font-bold text-white">Side by Side</h6>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          A professional verification layout. Displays the original notes and the converted HTML in a split-view. 
                          <br /><br />
                          <span className="text-purple-400/80">Best for:</span> Cross-referencing formulas and ensuring that the AI captured every detail correctly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips for Best Results */}
          <section className="bg-emerald-500/5 border border-emerald-500/10 p-12 rounded-[48px] space-y-8">
            <h3 className="text-2xl font-bold text-emerald-400">Tips for Best Results</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <li className="flex gap-3 text-stone-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Use high-contrast ink (black or dark blue) on white paper.
              </li>
              <li className="flex gap-3 text-stone-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Ensure the scan or photo is well-lit and not blurry.
              </li>
              <li className="flex gap-3 text-stone-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Keep formulas on their own lines for better recognition.
              </li>
              <li className="flex gap-3 text-stone-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                For complex diagrams, use "Manual Selection" in Customize mode.
              </li>
              <li className="flex gap-3 text-stone-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Avoid overlapping text and diagrams if possible.
              </li>
            </ul>
          </section>
          
          <footer className="py-12 text-center border-t border-white/10">
            <p className="text-stone-500 text-xs font-black uppercase tracking-[0.3em]">InkAccess v2.5.0 • Built for Accessibility</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

const StylingPanel = ({ 
  options, 
  onUpdate 
}: { 
  options: StylingOptions; 
  onUpdate: (updates: Partial<StylingOptions>) => void;
}) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <Edit3 className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-black uppercase tracking-widest text-white">Customize Document Styling</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Primary Accent Color</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={options.primaryColor}
              onChange={(e) => onUpdate({ primaryColor: e.target.value })}
              className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
            />
            <input 
              type="text" 
              value={options.primaryColor}
              onChange={(e) => onUpdate({ primaryColor: e.target.value })}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Font Family</label>
          <select 
            value={options.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50"
          >
            <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Modern Sans (Segoe UI)</option>
            <option value="'Inter', sans-serif">Inter (Clean)</option>
            <option value="Georgia, serif">Classic Serif (Georgia)</option>
            <option value="'Courier New', Courier, monospace">Monospace (Courier)</option>
            <option value="'Playfair Display', serif">Editorial (Playfair)</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Content Max Width</label>
          <select 
            value={options.contentMaxWidth}
            onChange={(e) => onUpdate({ contentMaxWidth: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50"
          >
            <option value="700px">Narrow (700px)</option>
            <option value="900px">Standard (900px)</option>
            <option value="1100px">Wide (1100px)</option>
            <option value="100%">Full Width</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Base Font Size</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={parseInt(options.fontSize)}
              onChange={(e) => onUpdate({ fontSize: `${e.target.value}px` })}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xs font-mono text-stone-400 w-8">{options.fontSize}</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Line Height</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="2" 
              step="0.1"
              value={parseFloat(options.lineHeight)}
              onChange={(e) => onUpdate({ lineHeight: e.target.value })}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xs font-mono text-stone-400 w-8">{options.lineHeight}</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Sidebar Background</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={options.sidebarBg}
              onChange={(e) => onUpdate({ sidebarBg: e.target.value })}
              className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
            />
            <input 
              type="text" 
              value={options.sidebarBg}
              onChange={(e) => onUpdate({ sidebarBg: e.target.value })}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FullDocumentPreview = ({ 
  results, 
  stylingOptions, 
  conversionMode,
  onClose
}: { 
  results: PageResult[]; 
  stylingOptions: StylingOptions;
  conversionMode: string;
  onClose: () => void;
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // @ts-ignore
    if (window.MathJax && window.MathJax.typesetPromise && previewRef.current) {
      // @ts-ignore
      window.MathJax.typesetPromise([previewRef.current]);
    }
  }, [results]);

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/95 backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <Eye className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Full Document Preview</h2>
            <p className="text-xs text-stone-500">Viewing all {results.length} pages sequentially</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-12 bg-stone-100" ref={previewRef}>
        <div className="max-w-[900px] mx-auto space-y-12">
          <style>{getTemplateCss(stylingOptions)}</style>
          <style>{`
            .visual-desc {
              background-color: #f8f9fa !important;
              border-left: 4px solid #6c757d !important;
              padding: 1rem !important;
              margin: 1.5rem 0 !important;
              font-style: italic !important;
              color: #4a5568 !important;
            }
            .page-separator {
              border: 0;
              border-top: 1px dashed #cbd5e0;
              margin: 4rem 0;
              position: relative;
            }
            .page-separator::after {
              content: 'Page Break';
              position: absolute;
              top: -10px;
              left: 50%;
              transform: translateX(-50%);
              background: #f1f5f9;
              padding: 0 1rem;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.2em;
              color: #94a3b8;
            }
          `}</style>
          
          {results.map((res, idx) => {
            let pageHtml = res.htmlContent;
            
            // Replace placeholders for preview
            if (conversionMode === 'inline-diagrams' && res.diagrams && res.diagrams.length > 0) {
              res.diagrams.forEach(diag => {
                const escapedAlt = diag.alt.replace(/"/g, '&quot;');
                const imgHtml = `
                  <div class="inline-diagram-container" style="width: ${diag.width}%; margin: 30px auto;">
                    <img src="${diag.editedBase64}" alt="${escapedAlt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    ${diag.alt ? `
                    <div class="visual-desc">
                      <strong>Visual Description:</strong>
                      <span>${diag.alt}</span>
                    </div>` : ''}
                  </div>
                `;
                const placeholderRegex = new RegExp(`<diagram-placeholder[^>]*id="${diag.id}"[^>]*>(?:.*?<\/diagram-placeholder>)?`, 'g');
                pageHtml = pageHtml.replace(placeholderRegex, imgHtml);
              });
            }

            return (
              <div key={res.pageNumber} className="relative">
                <div className="bg-white p-12 rounded-2xl shadow-xl border border-stone-200">
                  <div className="mb-8 pb-4 border-b border-stone-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-stone-400">Page {res.pageNumber}</span>
                  </div>
                  <div className="page-content" dangerouslySetInnerHTML={{ __html: pageHtml }} />
                </div>
                {idx < results.length - 1 && <hr className="page-separator" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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

      {selectedId && (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Diagram Alt Text</span>
            </div>
            <button 
              onClick={() => setSelectedId(null)}
              className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
          <textarea
            value={selections.find(s => s.id === selectedId)?.alt || ''}
            onChange={(e) => {
              const updated = selections.map(s => 
                s.id === selectedId ? { ...s, alt: e.target.value } : s
              );
              onUpdate(updated);
            }}
            placeholder="Describe this diagram (optional - AI will generate if left blank)..."
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50 transition-colors min-h-[80px] resize-none"
          />
        </div>
      )}
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

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-500">
            <Type className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Accessibility Description</span>
          </div>
          {diagram.alt && (
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Description Active
            </span>
          )}
        </div>
        
        <textarea
          value={diagram.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Describe this diagram in detail (axes, labels, trends, etc.) for someone who cannot see it..."
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all min-h-[100px] shadow-inner"
        />
        
        {diagram.alt && (
          <div className="bg-stone-50 rounded-xl p-5 border border-stone-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400">Final Document Preview</span>
            </div>
            <div className="text-xs text-stone-600 leading-relaxed italic border-l-2 border-stone-300 pl-4">
              <strong className="not-italic text-stone-800 uppercase text-[10px] tracking-wider block mb-1">Visual Description:</strong>
              {diagram.alt}
            </div>
          </div>
        )}
        <p className="text-[10px] text-stone-400 leading-relaxed">
          This description is mandatory for WCAG compliance. It will be rendered as a styled box directly below the image in your exported document.
        </p>
      </div>
    </div>
  );
};

const RequestChangesSection = ({ 
  onApplyChanges, 
  isProcessing, 
  totalPages,
  initialPage = 'all',
  compact = false
}: { 
  onApplyChanges: (request: string, pageNumber: number | 'all') => void, 
  isProcessing: boolean, 
  totalPages: number,
  initialPage?: number | 'all',
  compact?: boolean
}) => {
  const [request, setRequest] = useState('');
  const [targetPage, setTargetPage] = useState<number | 'all'>(initialPage);

  useEffect(() => {
    setTargetPage(initialPage);
  }, [initialPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (request.trim()) {
      onApplyChanges(request, targetPage);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="What would you like to change on this page?"
          className="w-full bg-white border border-white/10 rounded-2xl p-4 text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-indigo-500/50 transition-colors min-h-[100px] resize-none text-sm"
        />
        <button
          type="submit"
          disabled={!request.trim() || isProcessing}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-3 transition-all text-xs"
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Apply Changes to Page {targetPage}
        </button>
      </form>
    );
  }

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
          <div className="flex flex-col gap-4">
            <label className="text-xs font-black uppercase tracking-widest text-stone-400">Apply to:</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTargetPage('all')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
                  targetPage === 'all' 
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20" 
                    : "bg-white/5 text-stone-500 border-white/10 hover:bg-white/10"
                )}
              >
                All Pages
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTargetPage(i + 1)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
                    targetPage === i + 1 
                      ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20" 
                      : "bg-white/5 text-stone-500 border-white/10 hover:bg-white/10"
                  )}
                >
                  Page {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-stone-400">What would you like to change?</label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="e.g., 'Correct the formula in the second paragraph', 'Extract the diagram at the bottom more clearly', 'Use a more formal tone'..."
              className="w-full bg-white border border-white/10 rounded-3xl p-6 text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-indigo-500/50 transition-colors min-h-[120px] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!request.trim() || isProcessing}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {targetPage === 'all' ? 'Apply Changes to All Pages' : `Apply Changes to Page ${targetPage}`}
          </button>
          
          <p className="text-center text-[10px] text-stone-500 uppercase tracking-widest font-bold">
            {targetPage === 'all' 
              ? "This will re-process all pages using your specific instructions."
              : `This will re-process only Page ${targetPage} using your specific instructions.`}
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
  const hasDiagramKeywords = ['diagram', 'graph', 'chart', 'figure', 'illustration', 'sketch', 'drawing'].some(kw => text.includes(kw));
  const hasVisualDesc = doc.querySelector('.visual-desc') !== null;
  const hasPlaceholders = doc.querySelector('diagram-placeholder') !== null;
  
  if (hasDiagramKeywords && !hasVisualDesc && !hasPlaceholders) {
    issues.push({
      type: 'warning',
      message: 'Diagram keywords detected but no .visual-desc container or diagram placeholder found for accessibility.'
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
    1. Missing or poor alt text for images/diagrams. If you see a diagram, graph, or sketch, you MUST provide a detailed visual description in a <div class="visual-desc"> container immediately following it. This is MANDATORY.
    2. Incorrect heading structures (ensure a logical hierarchy, starting from h4 for this page chunk).
    3. Ensure all math is properly wrapped in \\( ... \\) or \\[ ... \\] for MathJax accessibility.
    4. Ensure semantic elements are used correctly (e.g., <strong> for emphasis, <table> for data).
    5. Fix any skipped heading levels.
    
    INSTRUCTIONS:
    - Return ONLY the cleaned HTML.
    - Do not include any markdown code blocks or explanations.
    - Maintain all original content, diagram placeholders, and formatting classes (.definition, .theorem, .visual-desc, .example, .important, .warning, .solution).
    - CRITICAL: Do NOT remove or modify <diagram-placeholder> tags. Ensure their 'id' and 'alt' attributes remain EXACTLY as they are. If a placeholder is missing a detailed 'alt' attribute, fill it with a comprehensive description.
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

const autoDetectDiagrams = async (imageBase64: string, mainMode: 'fast' | 'customize' = 'fast'): Promise<ManualSelection[]> => {
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
    
    CRITICAL: The bounding box [ymin, xmin, ymax, xmax] must TIGHTLY encompass the entire visual element. 
    - This MUST include all associated labels, axis titles, legends, and captions that are physically part of the diagram.
    - If a diagram has a title above or a caption below, include it in the box.
    - Be extremely precise. Do not cut off any part of the drawing or its labels.
    - If multiple small diagrams are grouped together with a single label, treat them as one visual element.
    
    Return ONLY a JSON array of objects with 'box_2d' property in normalized coordinates (0-1000).
    Example: [{"box_2d": [100, 200, 300, 400]}]
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: mainMode === 'fast' ? "gemini-3.1-flash-lite-preview" : "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
          ]
        }
      ],
      config: mainMode === 'fast' ? {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        },
        responseMimeType: "application/json"
      } : {
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

const getTemplateCss = (options: StylingOptions) => `
    :root {
        --primary-color: ${options.primaryColor};
        --sidebar-bg: ${options.sidebarBg};
        --sidebar-text: ${options.sidebarText};
        --sidebar-hover: #34495e;
        --content-max-width: ${options.contentMaxWidth};
    }

    body {
        font-family: ${options.fontFamily};
        line-height: ${options.lineHeight};
        font-size: ${options.fontSize};
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
        border-bottom: 3px solid var(--primary-color); 
        padding-bottom: 8px;
        margin-top: 30px;
        font-size: 1.5em;
    }
    h4 { 
        color: #34495e; 
        border-left: 4px solid var(--primary-color);
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
        border-left: 5px solid var(--primary-color);
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
        border-top: 2px solid var(--primary-color);
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
  const [mainMode, setMainMode] = useState<'customize' | 'fast'>('fast');
  const [conversionMode, setConversionMode] = useState<'transcription' | 'inline-diagrams' | 'side-by-side'>('inline-diagrams');
  const [diagramDetectionMode, setDiagramDetectionMode] = useState<'manual' | 'auto'>('auto');
  const [customizeSubMode, setCustomizeSubMode] = useState<'inline' | 'notes'>('inline');
  const [originalFileBase64, setOriginalFileBase64] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('original_notes.pdf');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [pageRequestingChanges, setPageRequestingChanges] = useState<number | null>(null);
  const [editingHtml, setEditingHtml] = useState<string>('');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);
  const [showStylingPanel, setShowStylingPanel] = useState<boolean>(false);
  const [showDocumentation, setShowDocumentation] = useState<boolean>(false);
  const [stylingOptions, setStylingOptions] = useState<StylingOptions>({
    primaryColor: '#0c0d0d',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    contentMaxWidth: '1100px',
    lineHeight: '1.6',
    fontSize: '16px',
    sidebarBg: '#0c0d0d',
    sidebarText: '#ecf0f1',
  });
  const [modalViewMode, setModalViewMode] = useState<'editor' | 'preview' | 'split'>('split');
  const modalPreviewRef = useRef<HTMLDivElement>(null);

  const renderMathInModal = () => {
    // @ts-ignore
    if (window.MathJax && window.MathJax.typesetPromise && modalPreviewRef.current) {
      setIsTypesetting(true);
      // @ts-ignore
      window.MathJax.typesetPromise([modalPreviewRef.current]).finally(() => {
        setIsTypesetting(false);
      });
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAutoDetectAll = async (targetPreviews?: PagePreview[]) => {
    const activePreviews = targetPreviews || previews;
    if (activePreviews.length === 0) return {};

    setIsProcessing(true);
    setProcessingPhase('detecting');
    setProgress({ current: 0, total: activePreviews.length });
    
    const newManualSelections: Record<number, ManualSelection[]> = { ...manualSelections };
    
    try {
      const CONCURRENCY_LIMIT = mainMode === 'fast' ? 10 : 5;
      let completedCount = 0;

      const detectSinglePage = async (preview: PagePreview) => {
        // Compress image for detection to speed up upload
        const compressed = await compressImage(
          preview.imageBase64, 
          mainMode === 'fast' ? 1024 : 1600, 
          0.5
        );
        const imageBase64 = compressed.split(',')[1];
        
        const detections = await autoDetectDiagrams(imageBase64, mainMode);
        newManualSelections[preview.pageNumber] = detections;
        completedCount++;
        setProgress({ current: completedCount, total: activePreviews.length });
      };

      for (let i = 0; i < activePreviews.length; i += CONCURRENCY_LIMIT) {
        const batch = activePreviews.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(batch.map(preview => detectSinglePage(preview)));
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

      const CONCURRENCY_LIMIT = mainMode === 'fast' ? 10 : 5;
      const processSinglePage = async (preview: PagePreview) => {
        const i = preview.pageNumber;
        const selections = (providedSelections || manualSelections)[i] || [];
        
        // 4. Intelligent Caching check
        const cacheKey = `${preview.imageBase64.substring(0, 1000)}_${conversionMode}_${selections.length}_${mainMode}`;
        if (resultCache.has(cacheKey)) {
          const cached = resultCache.get(cacheKey)!;
          setResults(prev => [...prev, cached].sort((a, b) => a.pageNumber - b.pageNumber));
          completedCount++;
          setProgress({ current: completedCount, total: totalPages });
          return;
        }

        // 1. Client-Side Image Compression
        const compressedBase64Full = await compressImage(
          preview.imageBase64, 
          mainMode === 'fast' ? 1024 : 1600, 
          mainMode === 'fast' ? 0.5 : 0.75
        );
        const imageBase64 = compressedBase64Full.split(',')[1];

        const transcriptionPrompt = `
          Convert the attached handwritten lecture notes page into a WCAG 2.2 Level AA compliant HTML document chunk.
          
          CRITICAL REQUIREMENT: The output HTML must be a PAGE BY PAGE transcription. It should NOT deviate from the original handwritten notes in terms of content, structure, or sequence. Do not summarize, omit, or add information that isn't in the image.
          
          Key Requirements:
          1. VISUAL DESCRIPTIONS (MANDATORY): For EVERY diagram, graph, sketch, or visual element found on the page, you MUST provide a detailed visual description inside a <div class="visual-desc"> container. 
             - Start the description with a bold header: <strong>Visual Description:</strong>
             - Be extremely detailed. Explain axes, trends, labels, and relationships.
             - This is CRITICAL for accessibility. Every visual element MUST have a corresponding description.
          2. Use proper MathJax delimiters: \\(inline math\\) and \\[display math\\]
          3. Maintain semantic HTML structure with proper heading hierarchy (start at h4 for major topics within this page).
          4. Apply appropriate color-coded containers:
             - <div class="definition"> for definitions
             - <div class="theorem"> for theorems/laws
             - <div class="example"> for examples
             - <div class="important"> for key notes
             - <div class="warning"> for warnings
             - <div class="solution"> for example solutions
             - <div class="visual-desc"> for detailed visual descriptions (as mentioned in point 1).
          5. Preserve all worked examples with step-by-step solutions exactly as written.
          6. Keep natural paragraph flow - avoid excessive bullet points unless they are in the original notes.
          7. Use tables only for structured data.
          8. Bold only for critical terms (Definition:, Theorem:, etc.).
          9. Maintain academic tone and precision.
          10. Return ONLY the HTML content that would go inside a <div class="page-content"> tag. Do not include the <div> tag itself or any markdown code blocks.
        `;

        const inlineDiagramsPrompt = `
          Convert the attached handwritten lecture notes page into a PAGE BY PAGE transcription with INLINE DIAGRAMS.
          
          CRITICAL REQUIREMENT: The output HTML must be a PAGE BY PAGE transcription, identical in content and structure to the original notes. 
          
          DIAGRAM PLACEMENT (MANDATORY): 
          I have manually identified ${selections.length} diagrams on this page at the following normalized coordinates [ymin, xmin, ymax, xmax] (0-1000):
          ${selections.map((s, idx) => `diag-${idx}: [${s.bounds.ymin}, ${s.bounds.xmin}, ${s.bounds.ymax}, ${s.bounds.xmax}] ${s.alt ? `(User Provided Alt: ${s.alt})` : ''}`).join('\n')}

          In the HTML output, you MUST place a special tag <diagram-placeholder id="diag-N" ymin="Y1" xmin="X1" ymax="Y2" xmax="X2" alt="Detailed description of the diagram"></diagram-placeholder> exactly where each diagram appears in the notes.
          Use the IDs provided (diag-0, diag-1, etc.) and the coordinates I gave you.
          
          ALT TEXT GUIDELINES (CRITICAL FOR ACCESSIBILITY):
          - MANDATORY: The 'alt' attribute MUST NOT be empty. You MUST provide a comprehensive, high-fidelity description for every diagram.
          - If a 'User Provided Alt' is given, use it as a starting point but expand it into a full technical description.
          - If NO 'User Provided Alt' is given, you MUST generate a complete description from scratch based on the visual content.
          - Identify the type of diagram (e.g., "Line graph showing...", "Flowchart of...").
          - Describe the main components, their spatial relationships, and their significance.
          - For graphs: Explicitly state the X and Y axis labels, the units, the range of data, and describe the specific trend or key data points (e.g., "The curve peaks at x=5, y=10").
          - For flowcharts: Describe every node and every connecting arrow/path in sequence.
          - For chemical/circuit diagrams: List every element and how they are connected.
          - Include ALL text, labels, or formulas that are part of the diagram itself.
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
          4. NO VISUAL DESCRIPTION DIV: Do NOT include a separate <div class="visual-desc"> for diagrams that have a <diagram-placeholder>. The detailed description MUST be contained entirely within the 'alt' attribute of the placeholder tag. This text will be automatically rendered as a visible, styled description below the image in the final document.
          5. Preserve all worked examples with step-by-step solutions exactly as written.
          6. Keep natural paragraph flow - avoid excessive bullet points unless they are in the original notes.
          7. Use tables only for structured data.
          8. Bold only for critical terms (Definition:, Theorem:, etc.).
          9. Maintain academic tone and precision.
          10. Return ONLY the HTML content that would go inside a <div class="page-content"> tag. Do not include the <div> tag itself or any markdown code blocks.
          11. IMPORTANT: Ensure EVERY diagram identified above has a corresponding <diagram-placeholder> in your output. Do not skip any.
        `;

        const fastPrompt = `
          Convert the attached handwritten lecture notes page into a simple, accessible HTML transcription.
          
          DIAGRAM PLACEMENT: 
          I have identified ${selections.length} diagrams at these coordinates:
          ${selections.map((s, idx) => `diag-${idx}: [${s.bounds.ymin}, ${s.bounds.xmin}, ${s.bounds.ymax}, ${s.bounds.xmax}]`).join('\n')}

          In the HTML, place <diagram-placeholder id="diag-N" ymin="Y1" xmin="X1" ymax="Y2" xmax="X2" alt="Detailed description"></diagram-placeholder> where they appear.
          
          REQUIREMENTS:
          1. Direct transcription: Transcribe text exactly as written.
          2. Minimal styling: Use basic tags (h4, p, ul, ol, table). Do NOT use complex color-coded containers.
          3. MathJax: Use \\(inline\\) and \\[display\\] math.
          4. Visual Descriptions: Provide a detailed 'alt' attribute for every <diagram-placeholder>.
          5. Return ONLY the HTML content. No markdown blocks.
        `;

        const prompt = mainMode === 'fast' ? fastPrompt : ((conversionMode === 'transcription' || conversionMode === 'side-by-side') ? transcriptionPrompt : inlineDiagramsPrompt);

        const response = await ai.models.generateContent({
          model: mainMode === 'fast' ? "gemini-3.1-flash-lite-preview" : "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
              ]
            }
          ],
          config: mainMode === 'fast' ? {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW
            }
          } : undefined
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
              // Check both alt attribute and inner text for the description
              const altAttr = placeholder.getAttribute('alt');
              const innerText = placeholder.textContent?.trim();
              const alt = altAttr || innerText || selection.alt || 'Diagram from notes';
              
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

        // 3. Concurrent WCAG Cleanup (Skip in Fast Mode for speed)
        if (mainMode !== 'fast') {
          const issues = checkAccessibility(cleanedHtml);
          if (issues.length > 0) {
            cleanedHtml = await runWcagCleanup(cleanedHtml, i);
          }
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

  const handleApplyChanges = async (userRequest: string, pageNumber: number | 'all' = 'all') => {
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
        
        // Skip if we are targeting a specific page and this isn't it
        if (pageNumber !== 'all' && currentResult.pageNumber !== pageNumber) {
          return;
        }

        const prompt = `
          You are an expert academic editor. Below is a page by page HTML transcription of a handwritten lecture notes page.
          
          USER REQUEST: "${userRequest}"
          
          CURRENT HTML CONTENT:
          ${currentResult.htmlContent}
          
          INSTRUCTIONS:
          1. Apply the user's request to the HTML content.
          2. Maintain the existing page by page transcription quality.
          3. DO NOT remove or modify any <diagram-placeholder> tags unless specifically requested.
          4. Ensure every diagram has a detailed visual description. If missing, add one in a <div class="visual-desc"> or update the 'alt' attribute of the placeholder.
          5. Preserve all MathJax formatting (\\( ... \\) and \\[ ... \\]).
          6. Keep the semantic structure (headings, color-coded divs like .definition, .theorem, etc.).
          7. Return ONLY the updated HTML content that goes inside the page container. Do not include markdown code blocks.
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
        ${getTemplateCss(stylingOptions)}
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
              if (conversionMode === 'inline-diagrams' && res.diagrams && res.diagrams.length > 0) {
                res.diagrams.forEach(diag => {
                  const escapedAlt = diag.alt.replace(/"/g, '&quot;');
                  const imgHtml = `
                    <div class="inline-diagram-container" style="width: ${diag.width}%; margin-left: auto; margin-right: auto; margin-top: 30px; margin-bottom: 30px;">
                      <img src="${diag.editedBase64}" alt="${escapedAlt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                      ${diag.alt ? `
                      <div class="visual-desc" style="text-align: left; font-size: 0.9em; margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-left: 5px solid #6c757d; border-radius: 4px;">
                        <strong style="display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 0.75em; letter-spacing: 0.05em; color: #4a5568;">Visual Description:</strong>
                        <span style="color: #2d3748; line-height: 1.5;">${diag.alt}</span>
                      </div>` : ''}
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
                <span className="text-[8px] text-emerald-500 font-black px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 ml-1">v2.5.0</span>
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

          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowDocumentation(true)}
              className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
            >
              <HelpCircle className="w-4 h-4" />
              Documentation
            </button>
            
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
                      setMainMode('fast');
                      setConversionMode('inline-diagrams');
                      setDiagramDetectionMode('auto');
                    }}
                    className={cn(
                      "px-12 py-5 rounded-[32px] text-sm font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-3",
                      mainMode === 'fast'
                        ? "bg-emerald-400 text-black border-white shadow-[0_0_40px_rgba(52,211,153,0.3)] scale-105" 
                        : "bg-white/5 text-stone-400 border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {mainMode === 'fast' && <CheckCircle2 className="w-5 h-5" />}
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
                  <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500 w-full">
                    {/* Sub-mode Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                      <button
                        onClick={() => setCustomizeSubMode('inline')}
                        className={cn(
                          "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          customizeSubMode === 'inline' ? "bg-white text-black shadow-lg" : "text-stone-500 hover:text-stone-300"
                        )}
                      >
                        In-line Diagrams
                      </button>
                      <button
                        onClick={() => setCustomizeSubMode('notes')}
                        className={cn(
                          "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          customizeSubMode === 'notes' ? "bg-white text-black shadow-lg" : "text-stone-500 hover:text-stone-300"
                        )}
                      >
                        Notes-Html
                      </button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                      {customizeSubMode === 'inline' ? (
                        <>
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
                            Auto Detection
                          </button>
                          <button
                            onClick={() => {
                              setConversionMode('inline-diagrams');
                              setDiagramDetectionMode('manual');
                            }}
                            className={cn(
                              "px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-2",
                              conversionMode === 'inline-diagrams' && diagramDetectionMode === 'manual'
                                ? "bg-white/20 text-white border-white/40 shadow-lg" 
                                : "bg-white/5 text-stone-500 border-white/10 hover:bg-white/10 hover:border-white/20"
                            )}
                          >
                            {(conversionMode === 'inline-diagrams' && diagramDetectionMode === 'manual') && <CheckCircle2 className="w-4 h-4" />}
                            Manual Selection
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setConversionMode('transcription');
                            }}
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
                            onClick={() => {
                              setConversionMode('side-by-side');
                            }}
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
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <Wand2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Optimized Fast Conversion</span>
                    </div>
                  </div>
                )}
                
                <p className="text-stone-500 text-sm font-medium text-center max-w-lg italic">
                  {mainMode === 'fast'
                    ? "Prioritizes speed using the fastest AI model. WARNING: This mode has the highest chance of making mistakes! (Default)."
                    : conversionMode === 'transcription' 
                      ? "Strictly transcribes every word, formula, and symbol exactly as written in your notes, page by page, with notes followed by html. (High Accuracy)" 
                      : conversionMode === 'side-by-side'
                        ? "Creates a two-column layout with the original handwritten notes on the left and the accessible transcription on the right. (High Accuracy)"
                        : diagramDetectionMode === 'auto'
                          ? "Uses AI to automatically identify and extract diagrams to place them contextually inline with the text. (High Accuracy)"
                          : "Manually select areas of your notes that contain diagrams to be extracted and placed inline. (Highest Accuracy)"}
                </p>
                {mainMode === 'fast' && (
                  <p className="text-red-400/60 text-[10px] uppercase font-black tracking-widest mt-2 animate-pulse">
                    Choose a customize option for accuracy!
                  </p>
                )}

                <button
                  onClick={() => setShowDocumentation(true)}
                  className="text-emerald-500 hover:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors mt-2"
                >
                  <HelpCircle className="w-3 h-3" />
                  How it works & Best Practices
                </button>
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
                                const compressed = await compressImage(
                                  preview.imageBase64, 
                                  mainMode === 'fast' ? 1024 : 1600, 
                                  0.5
                                );
                                const imageBase64 = compressed.split(',')[1];
                                const detections = await autoDetectDiagrams(imageBase64, mainMode);
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
                  <div className="w-px h-8 bg-white/10 mx-2" />
                  <button
                    onClick={() => setShowFullPreview(true)}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all text-stone-500 hover:text-stone-300 hover:bg-white/5"
                  >
                    <Maximize2 className="w-4 h-4" aria-hidden="true" />
                    Preview All
                  </button>
                </div>
              </div>

              {/* Styling Options Toggle */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowStylingPanel(!showStylingPanel)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                    showStylingPanel 
                      ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20" 
                      : "bg-white/5 text-stone-500 border-white/10 hover:bg-white/10"
                  )}
                >
                  <Edit3 className="w-3 h-3" />
                  {showStylingPanel ? 'Hide Styling' : 'Customize Styling'}
                </button>
              </div>

              {showStylingPanel && (
                <StylingPanel 
                  options={stylingOptions} 
                  onUpdate={(updates) => setStylingOptions(prev => ({ ...prev, ...updates }))} 
                />
              )}

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
                                if (pageRequestingChanges === res.pageNumber) {
                                  setPageRequestingChanges(null);
                                } else {
                                  setPageRequestingChanges(res.pageNumber);
                                }
                              }}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full border transition-all",
                                pageRequestingChanges === res.pageNumber
                                  ? "bg-indigo-500 text-white border-indigo-400"
                                  : "bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border-white/10"
                              )}
                            >
                              <Wand2 className="w-4 h-4" />
                              Ask AI
                            </button>
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
                                let pageHtml = res.htmlContent;
                                if (conversionMode === 'inline-diagrams' && res.diagrams && res.diagrams.length > 0) {
                                  res.diagrams.forEach(diag => {
                                    const escapedAlt = diag.alt.replace(/"/g, '&quot;');
                                    const imgHtml = `
                                      <div class="inline-diagram-container" style="width: ${diag.width}%; margin-left: auto; margin-right: auto; margin-top: 30px; margin-bottom: 30px;">
                                        <img src="${diag.editedBase64}" alt="${escapedAlt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                        ${diag.alt ? `
                                        <div class="visual-desc" style="text-align: left; font-size: 0.9em; margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-left: 5px solid #6c757d; border-radius: 4px;">
                                          <strong style="display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 0.75em; letter-spacing: 0.05em; color: #4a5568;">Visual Description:</strong>
                                          <span style="color: #2d3748; line-height: 1.5;">${diag.alt}</span>
                                        </div>` : ''}
                                      </div>
                                    `;
                                    const placeholderRegex = new RegExp(`<diagram-placeholder[^>]*id="${diag.id}"[^>]*>(?:.*?<\/diagram-placeholder>)?`, 'g');
                                    pageHtml = pageHtml.replace(placeholderRegex, imgHtml);
                                  });
                                }
                                navigator.clipboard.writeText(pageHtml);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-full border border-white/10 transition-all"
                            >
                              <Copy className="w-4 h-4" />
                              Copy HTML
                            </button>
                          </div>
                        </div>

                        {pageRequestingChanges === res.pageNumber && (
                          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[32px] p-8 mb-8">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <Wand2 className="w-5 h-5 text-indigo-500" />
                                  <h4 className="text-lg font-bold text-white">Refine Page {res.pageNumber}</h4>
                                </div>
                                <button 
                                  onClick={() => setPageRequestingChanges(null)}
                                  className="text-stone-500 hover:text-white transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              <RequestChangesSection 
                                isProcessing={isProcessing} 
                                totalPages={results.length}
                                initialPage={res.pageNumber}
                                compact={true}
                                onApplyChanges={(request, pageNumber) => {
                                  handleApplyChanges(request, pageNumber);
                                  setPageRequestingChanges(null);
                                }} 
                              />
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-[40px] overflow-hidden text-black min-h-[1000px] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                          {viewMode === 'preview' ? (
                            <div className="p-16">
                              <style>{getTemplateCss(stylingOptions)}</style>
                              <style>{`
                                .visual-desc {
                                  background-color: #f8f9fa !important;
                                  border-left: 4px solid #6c757d !important;
                                  padding: 1rem !important;
                                  margin: 1.5rem 0 !important;
                                  font-style: italic !important;
                                  color: #4a5568 !important;
                                }
                              `}</style>
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
                totalPages={results.length}
                onApplyChanges={(request, pageNumber) => handleApplyChanges(request, pageNumber)} 
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

      {showFullPreview && (
        <FullDocumentPreview 
          results={results} 
          stylingOptions={stylingOptions} 
          conversionMode={conversionMode}
          onClose={() => setShowFullPreview(false)} 
        />
      )}

      {showDocumentation && (
        <Documentation onClose={() => setShowDocumentation(false)} />
      )}

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
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl self-start">
                <button
                  onClick={() => setModalViewMode('editor')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    modalViewMode === 'editor' ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                  )}
                >
                  Editor
                </button>
                <button
                  onClick={() => setModalViewMode('split')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    modalViewMode === 'split' ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                  )}
                >
                  Split
                </button>
                <button
                  onClick={() => setModalViewMode('preview')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    modalViewMode === 'preview' ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                  )}
                >
                  Preview
                </button>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(modalViewMode === 'editor' || modalViewMode === 'split') && (
                  <div className={cn(
                    "bg-black/40 rounded-3xl border border-white/10 overflow-hidden flex flex-col",
                    modalViewMode === 'editor' ? "lg:col-span-2" : ""
                  )}>
                    <textarea
                      value={editingHtml}
                      onChange={(e) => setEditingHtml(e.target.value)}
                      className="w-full h-full p-8 bg-transparent text-white font-mono text-sm focus:outline-none resize-none leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                )}
                
                {(modalViewMode === 'preview' || modalViewMode === 'split') && (
                  <div className={cn(
                    "bg-white rounded-3xl overflow-hidden flex flex-col",
                    modalViewMode === 'preview' ? "lg:col-span-2" : ""
                  )}>
                    <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Live Preview</span>
                      <button
                        onClick={renderMathInModal}
                        disabled={isTypesetting}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                      >
                        {isTypesetting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sigma className="w-3 h-3" />}
                        Render MathJax
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-8 text-black" ref={modalPreviewRef}>
                      <style>{getTemplateCss(stylingOptions)}</style>
                      <div 
                        className="prose prose-stone max-w-none"
                        dangerouslySetInnerHTML={{ __html: editingHtml }} 
                      />
                    </div>
                  </div>
                )}
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
