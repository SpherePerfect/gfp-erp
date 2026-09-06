import React, { useState } from 'react';
import { Printer, X, ZoomIn, ZoomOut, RotateCcw, Check, Sparkles, Download, FileText } from 'lucide-react';
import { printElementById } from '../utils/printHelper';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'letter' | 'invoice';
  targetElementId: string;
  documentTitle: string;
  children: React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documentType,
  targetElementId,
  documentTitle,
  children,
}) => {
  const [zoom, setZoom] = useState(100);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    setPrintFeedback('Launching print engine...');
    const ok = printElementById(targetElementId, {
      documentTitle,
      onBeforePrint: () => setPrintFeedback('Sending to printer...'),
      onAfterPrint: () => {
        setPrintFeedback('Print job dispatched.');
        setTimeout(() => setPrintFeedback(null), 2500);
      },
    });

    if (!ok) {
      setPrintFeedback('Using direct window print...');
      try {
        window.print();
      } catch (err) {
        console.error('Print trigger error', err);
      }
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 140));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 60));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-sm animate-backdrop-in">
      {/* Top Floating Control Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2545]">
            <Printer className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Print & PDF Generation Center
            </h3>
            <p className="text-xs text-slate-500">
              {documentType === 'letter' ? 'Engagement Letter Document' : 'Pro-Forma Invoice Document'} • Select "Save as PDF" in destination printer
            </p>
          </div>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-none border border-slate-200 text-xs">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-white rounded-none text-slate-600 hover:text-slate-900 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center font-mono font-bold text-slate-700 select-none">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-white rounded-none text-slate-600 hover:text-slate-900 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 hover:bg-white rounded-none text-slate-500 hover:text-slate-800 transition border-l border-slate-200 ml-1"
            title="Reset Zoom to 100%"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {printFeedback && (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-none border border-blue-200 animate-pulse">
              {printFeedback}
            </span>
          )}

          {/* Instant Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B2545] hover:bg-[#133863] text-white rounded-none font-bold text-xs shadow-sm transition active:scale-95"
            title="Open browser print dialog / Save as PDF"
          >
            <Printer className="w-4 h-4 text-blue-300" />
            <span>Print / Save as PDF</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-none transition"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Viewer Canvas */}
      <div className="flex-1 overflow-auto p-6 sm:p-12 flex justify-center bg-slate-900/60">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-[860px]"
        >
          {children}
        </div>
      </div>

      {/* Bottom Hint Footer */}
      <div className="bg-slate-900 text-slate-400 text-xs px-6 py-2.5 flex items-center justify-between border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tip: When the printer dialog appears, choose <strong>"Save as PDF"</strong> with Paper Size <strong>A4</strong> and Margins set to <strong>Default</strong>.</span>
        </div>
        <div>
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded-none text-[11px] font-mono border border-slate-700">ESC</kbd> to exit preview</span>
        </div>
      </div>
    </div>
  );
};
