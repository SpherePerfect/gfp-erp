import React, { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import {
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Type,
  Palette,
  Layout,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { EngagementRecord, FirmProfile, WordDocConfig } from '../types';
import {
  exportEngagementLetterDocx,
  exportProFormaInvoiceDocx,
  downloadEngagementLetter,
  downloadProFormaInvoice,
  resolveWordDocConfig,
} from '../utils/docxExport';
import { LetterPreview } from './LetterPreview';
import { InvoicePreview } from './InvoicePreview';

interface WordDocumentViewerProps {
  record: EngagementRecord;
  firm: FirmProfile;
  documentType: 'letter' | 'invoice';
  onConfigChange?: (newConfig: WordDocConfig) => void;
  onPrint?: () => void;
}

const FONT_OPTIONS: { label: string; value: WordDocConfig['fontFamily'] }[] = [
  { label: 'Segoe UI (Executive Modern)', value: 'Segoe UI' },
  { label: 'Calibri (Corporate Standard)', value: 'Calibri' },
  { label: 'Aptos (Next-Gen Microsoft)', value: 'Aptos' },
  { label: 'Georgia (Distinguished Serif)', value: 'Georgia' },
  { label: 'Arial (Clean Neutral)', value: 'Arial' },
  { label: 'Times New Roman (Formal Legal)', value: 'Times New Roman' },
];

const THEME_OPTIONS: {
  label: string;
  value: WordDocConfig['colorTheme'];
  primaryColor: string;
  accentColor: string;
}[] = [
  { label: 'Oxford Navy', value: 'navy', primaryColor: '#0B2545', accentColor: '#1E40AF' },
  { label: 'Royal Indigo', value: 'indigo', primaryColor: '#3730A3', accentColor: '#4F46E5' },
  { label: 'Corporate Cobalt', value: 'cobalt', primaryColor: '#1E40AF', accentColor: '#2563EB' },
  { label: 'Slate Charcoal', value: 'charcoal', primaryColor: '#1E293B', accentColor: '#475569' },
  { label: 'Prestige Emerald', value: 'emerald', primaryColor: '#065F46', accentColor: '#059669' },
  { label: 'Royal Burgundy', value: 'burgundy', primaryColor: '#701A75', accentColor: '#86198F' },
];

export const WordDocumentViewer: React.FC<WordDocumentViewerProps> = ({
  record,
  firm,
  documentType,
  onConfigChange,
  onPrint,
}) => {
  // Current active word config (merged from record / firm / defaults)
  const [config, setConfig] = useState<WordDocConfig>(() =>
    resolveWordDocConfig(record, firm, record.wordDocConfig)
  );

  const [viewMode, setViewMode] = useState<'docx' | 'formatted'>('docx');
  const [zoom, setZoom] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'style' | 'layout' | 'clauses'>('style');
  const [showCustomizePanel, setShowCustomizePanel] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<any>(null);

  // Sync state if record's config changes from outside
  useEffect(() => {
    if (record.wordDocConfig) {
      setConfig((prev) => ({ ...prev, ...record.wordDocConfig }));
    }
  }, [record.wordDocConfig]);

  const updateConfig = (updates: Partial<WordDocConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    if (onConfigChange) {
      onConfigChange(updated);
    }
  };

  // Trigger docx binary render
  useEffect(() => {
    if (viewMode !== 'docx') return;

    let isCancelled = false;

    const runRender = async () => {
      if (!containerRef.current) return;
      setIsRendering(true);
      setRenderError(null);

      try {
        const blob =
          documentType === 'letter'
            ? await exportEngagementLetterDocx(record, firm, config)
            : await exportProFormaInvoiceDocx(record, firm, config);

        if (isCancelled || !containerRef.current) return;

        containerRef.current.innerHTML = '';
        await renderAsync(blob, containerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          breakPages: true,
          experimental: true,
          useBase64URL: true,
        });
      } catch (err: any) {
        console.error('Error rendering true Word document preview:', err);
        if (!isCancelled) {
          setRenderError(err?.message || 'Failed to render Word document preview');
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    // Debounce slightly to maintain 60fps responsiveness when sliding controls
    clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(runRender, 80);

    return () => {
      isCancelled = true;
      clearTimeout(renderTimeoutRef.current);
    };
  }, [record, firm, documentType, config, viewMode]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (documentType === 'letter') {
        await downloadEngagementLetter(record, firm, config);
      } else {
        await downloadProFormaInvoice(record, firm, config);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(1.6, Math.round((prev + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, Math.round((prev - 0.1) * 10) / 10));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] select-text">
      {/* Top Floating Liquid Glass Toolbar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Switcher & Status */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200">
            <button
              id="viewmode-docx-btn"
              type="button"
              onClick={() => setViewMode('docx')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                viewMode === 'docx'
                  ? 'bg-white text-[#0B2545] shadow-xs border-b-2 border-[#0B2545]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>True Word DOCX Preview</span>
            </button>
            <button
              id="viewmode-formatted-btn"
              type="button"
              onClick={() => setViewMode('formatted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                viewMode === 'formatted'
                  ? 'bg-white text-[#0B2545] shadow-xs border-b-2 border-[#0B2545]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Formatted View</span>
            </button>
          </div>

          {/* Rendering status badge */}
          {isRendering && viewMode === 'docx' ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 border border-indigo-100">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Rendering 1:1 DOCX...</span>
            </div>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-100">
              <Check className="w-3 h-3" />
              <span>Exact Download Representation</span>
            </span>
          )}
        </div>

        {/* Center/Right: Customization & Actions */}
        <div className="flex items-center gap-2">
          {/* Customize Drawer Toggle Button */}
          <button
            id="toggle-customization-btn"
            type="button"
            onClick={() => setShowCustomizePanel((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-all ${
              showCustomizePanel
                ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-[#0B2545]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Document Options</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1 bg-indigo-100 text-indigo-800 ml-1">
              Customizer
            </span>
          </button>

          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-white border border-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6}
              title="Zoom out"
              className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              title="Reset 100% zoom"
              className="px-2 py-1 text-[11px] font-mono font-medium text-slate-700 hover:bg-slate-100 min-w-[42px] text-center"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.6}
              title="Zoom in"
              className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print button */}
          {onPrint && (
            <button
              id="preview-print-btn"
              type="button"
              onClick={onPrint}
              title="Print / Save PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}

          {/* Direct Word (.docx) Download Button */}
          <button
            id="download-docx-now-btn"
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold bg-[#0B2545] text-white hover:bg-[#1E40AF] active:scale-[0.97] transition-all shadow-xs disabled:opacity-50"
          >
            {isDownloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-sky-300" />
            )}
            <span>Download .docx</span>
          </button>
        </div>
      </div>

      {/* Document Customizer Accordion Panel */}
      {showCustomizePanel && (
        <div className="bg-white border-b border-slate-300 px-6 py-4 shadow-md animate-spotlight-in">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Tab navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('style')}
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${
                    activeTab === 'style'
                      ? 'text-[#0B2545] border-b-2 border-[#0B2545]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Typography & Palette</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('layout')}
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${
                    activeTab === 'layout'
                      ? 'text-[#0B2545] border-b-2 border-[#0B2545]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Margins & Header</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clauses')}
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${
                    activeTab === 'clauses'
                      ? 'text-[#0B2545] border-b-2 border-[#0B2545]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Clauses & Security</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                Changes update the preview instantly in real-time
              </span>
            </div>

            {/* Tab 1: Typography & Palette */}
            {activeTab === 'style' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Font Selector */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-slate-500" />
                    <span>Document Font Family</span>
                  </label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => updateConfig({ fontFamily: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#0B2545]"
                  >
                    {FONT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Applied uniformly across headings, table contents, and legal clauses.
                  </p>
                </div>

                {/* Color Palette Selector */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    <span>Executive Color Accent</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = config.colorTheme === theme.value;
                      return (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => updateConfig({ colorTheme: theme.value })}
                          className={`flex items-center gap-2 p-1.5 border text-left transition-all ${
                            isSelected
                              ? 'border-[#0B2545] bg-indigo-50/50 font-bold'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 shrink-0 border border-black/10"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                          <span className="text-[11px] truncate">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Margins & Header */}
            {activeTab === 'layout' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Margins */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Page Margins</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Compact', value: 'compact', desc: '0.5 in' },
                      { label: 'Standard', value: 'standard', desc: '0.75 in' },
                      { label: 'Spacious', value: 'spacious', desc: '1.0 in' },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => updateConfig({ margins: m.value as any })}
                        className={`p-2 border text-center transition-all ${
                          config.margins === m.value
                            ? 'border-[#0B2545] bg-[#0B2545] text-white font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{m.label}</div>
                        <div className={`text-[10px] ${config.margins === m.value ? 'text-sky-200' : 'text-slate-500'}`}>
                          {m.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Header Layout */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Letterhead Layout</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Logo Left / Two-Column', value: 'two_column' },
                      { label: 'Logo Right / Executive', value: 'logo_right' },
                    ].map((h) => (
                      <button
                        key={h.value}
                        type="button"
                        onClick={() => updateConfig({ headerLayout: h.value as any })}
                        className={`p-2 border text-center transition-all ${
                          config.headerLayout === h.value
                            ? 'border-[#0B2545] bg-[#0B2545] text-white font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-[11px]">{h.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stamp Box */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Stamp & Seal</label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white">
                    <input
                      type="checkbox"
                      checked={config.showStampBox}
                      onChange={(e) => updateConfig({ showStampBox: e.target.checked })}
                      className="rounded-none text-[#0B2545] focus:ring-0"
                    />
                    <span className="text-xs text-slate-800">Show Formal Stamp / Seal Box</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab 3: Clauses & Security */}
            {activeTab === 'clauses' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <label className="flex items-start gap-2 p-2.5 border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeConfidentiality}
                    onChange={(e) => updateConfig({ includeConfidentiality: e.target.checked })}
                    className="mt-0.5 rounded-none text-[#0B2545] focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">Confidentiality Clause</div>
                    <div className="text-[10px] text-slate-500">Mutual non-disclosure terms</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeNonSolicitation}
                    onChange={(e) => updateConfig({ includeNonSolicitation: e.target.checked })}
                    className="mt-0.5 rounded-none text-[#0B2545] focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">Non-Solicitation Clause</div>
                    <div className="text-[10px] text-slate-500">Protects consulting resources</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeClientEnablers}
                    onChange={(e) => updateConfig({ includeClientEnablers: e.target.checked })}
                    className="mt-0.5 rounded-none text-[#0B2545] focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">Client Enablers Notice</div>
                    <div className="text-[10px] text-slate-500">Timeline depends on documentation</div>
                  </div>
                </label>

                <div className="p-2.5 border border-slate-200 bg-slate-50">
                  <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input
                      type="checkbox"
                      checked={config.includeWatermark}
                      onChange={(e) => updateConfig({ includeWatermark: e.target.checked })}
                      className="rounded-none text-[#0B2545] focus:ring-0"
                    />
                    <span className="font-semibold text-slate-900">Watermark / Classification</span>
                  </label>
                  {config.includeWatermark && (
                    <input
                      type="text"
                      value={config.watermarkText || 'CONFIDENTIAL'}
                      onChange={(e) => updateConfig({ watermarkText: e.target.value })}
                      placeholder="e.g. CONFIDENTIAL / DRAFT"
                      className="w-full bg-white border border-slate-300 px-2 py-1 text-[11px] font-mono uppercase"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
        {viewMode === 'docx' ? (
          <div className="relative w-full max-w-4xl">
            {/* Loading overlay with subtle Apple glass blur */}
            {isRendering && (
              <div className="absolute inset-0 z-20 bg-slate-100/60 backdrop-blur-xs flex items-center justify-center min-h-[400px]">
                <div className="bg-white px-5 py-3 shadow-lg border border-slate-200 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" />
                  <span className="text-xs font-semibold text-slate-800">
                    Generating True Word Document Pages...
                  </span>
                </div>
              </div>
            )}

            {renderError ? (
              <div className="p-8 text-center bg-white border border-amber-200 shadow-sm max-w-lg mx-auto">
                <FileText className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Preview Generation Note
                </h3>
                <p className="text-xs text-slate-600 mb-4">{renderError}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('formatted')}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700"
                  >
                    Switch to Formatted View
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 text-xs font-bold bg-[#0B2545] text-white"
                  >
                    Download .docx Directly
                  </button>
                </div>
              </div>
            ) : null}

            {/* The Actual Rendered DOCX Container with Zoom transform */}
            <div
              className="origin-top transition-transform duration-150"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
              }}
            >
              <div
                ref={containerRef}
                id="docx-preview-output-container"
                className="docx-viewer-root"
              />
            </div>
          </div>
        ) : (
          /* Synchronized Formatted View */
          <div
            className="w-full max-w-4xl origin-top transition-transform duration-150"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            {documentType === 'letter' ? (
              <LetterPreview record={record} firm={firm} />
            ) : (
              <InvoicePreview record={record} firm={firm} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
