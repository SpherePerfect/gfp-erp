import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Save,
  Printer,
  Check,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  Sliders,
  Plus,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Archive,
  QrCode,
  Upload,
  ShieldCheck,
  Tag,
  Percent,
  AlertCircle,
  ListPlus,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  EngagementRecord,
  FirmProfile,
  ServiceTemplate,
  SignatoryProfile,
  ClientPreset,
  TdsConfig,
  DiscountConfig,
  WordDocConfig,
} from '../types';
import { LetterPreview } from './LetterPreview';
import { InvoicePreview } from './InvoicePreview';
import { PrintPreviewModal } from './PrintPreviewModal';
import { WordDocumentViewer } from './WordDocumentViewer';
import { exportLetterDocx, exportInvoiceDocx } from '../utils/docxExport';
import { exportEngagementZip } from '../utils/zipExport';
import { printElementById } from '../utils/printHelper';
import { defaultClientPresets } from '../data/defaultClients';
import { formatIndianCurrency } from '../utils/numberToIndianWords';
import { validateAndParseGstin } from '../utils/gstHelper';
import {
  SUPPORTED_CURRENCIES,
  convertAmount,
  formatCurrencyWithSymbol,
  PRESET_MILESTONE_SCHEDULES,
} from '../utils/currencyAndMilestones';

interface EngagementEditorProps {
  initialRecord?: EngagementRecord;
  record?: EngagementRecord;
  firmProfile: FirmProfile;
  availableTemplates: ServiceTemplate[];
  onSave: (updated: EngagementRecord) => void;
  onBack: () => void;
  onOpenTemplateManager?: () => void;
  onCloneEngagement?: (cloned: EngagementRecord) => void;
}

const INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Delhi',
  'Tamil Nadu',
  'Telangana',
  'Haryana',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Madhya Pradesh',
  'Andhra Pradesh',
  'Kerala',
  'Punjab',
  'Goa',
  'Odisha',
  'Bihar',
  'Jharkhand',
  'Assam',
  'Chandigarh',
];

export const EngagementEditor: React.FC<EngagementEditorProps> = ({
  initialRecord,
  record: propRecord,
  firmProfile,
  availableTemplates,
  onSave,
  onBack,
  onOpenTemplateManager,
  onCloneEngagement,
}) => {
  // Normalize record ensuring services array exists
  const [record, setRecord] = useState<EngagementRecord>(() => {
    const rawRecord = initialRecord || propRecord!;
    const services =
      rawRecord.services && rawRecord.services.length > 0
        ? rawRecord.services
        : [rawRecord.service];
    return {
      ...rawRecord,
      services,
      currency: rawRecord.currency || 'INR',
      discountConfig: rawRecord.discountConfig || {
        enabled: false,
        type: 'percent',
        value: 0,
        reason: '',
      },
      tdsConfig: rawRecord.tdsConfig || {
        enabled: false,
        section: '194J',
        ratePercent: 10,
      },
      includeStamp: rawRecord.includeStamp ?? true,
      includeDigitalSign: rawRecord.includeDigitalSign ?? true,
      watermarkConfig: rawRecord.watermarkConfig || {
        enabled: false,
        text: 'CONFIDENTIAL',
        opacity: 0.12,
        diagonal: true,
      },
      digitalSealConfig: rawRecord.digitalSealConfig || {
        enabled: true,
        sealTitle: 'GFP ADVISORY',
        membershipNumber: '142890',
        firmFrn: '138920W',
      },
      billingScheduleMilestones: rawRecord.billingScheduleMilestones || [],
    };
  });

  const [activeTab, setActiveTab] = useState<'services' | 'details' | 'scope' | 'pricing' | 'invoice'>('services');
  const [previewTab, setPreviewTab] = useState<'letter' | 'invoice'>('letter');
  const [activeScopeServiceIndex, setActiveScopeServiceIndex] = useState<number>(0);
  const [saveToast, setSaveToast] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [clientPresets, setClientPresets] = useState<ClientPreset[]>(() => {
    try {
      const saved = localStorage.getItem('gfp_custom_client_presets');
      if (saved) {
        return [...defaultClientPresets, ...JSON.parse(saved)];
      }
    } catch (e) {
      console.warn('Could not load custom presets', e);
    }
    return defaultClientPresets;
  });

  const activeServices = record.services && record.services.length > 0 ? record.services : [record.service];
  const primaryService = activeServices[0] || record.service;

  // Commercial totals calculation
  const totalBaseFee = useMemo(() => {
    return activeServices.reduce((sum, s) => sum + (s.pricing?.feeAmount || 0), 0);
  }, [activeServices]);

  let discountAmount = 0;
  if (record.discountConfig?.enabled && record.discountConfig.value > 0) {
    if (record.discountConfig.type === 'percent') {
      discountAmount = Math.round((totalBaseFee * record.discountConfig.value) / 100);
    } else {
      discountAmount = Math.min(record.discountConfig.value, totalBaseFee);
    }
  }
  const taxableBase = Math.max(0, totalBaseFee - discountAmount);

  const isPersonalNonGst =
    record.invoiceIssuerType === 'personal' || record.isNonGstInvoice === true;
  const isInterState =
    record.client.state &&
    firmProfile.registeredState &&
    record.client.state.trim().toLowerCase() !== firmProfile.registeredState.trim().toLowerCase();

  const gstRate = isPersonalNonGst ? 0 : 18;
  const gstAmount = isPersonalNonGst ? 0 : Math.round((taxableBase * gstRate) / 100);
  const grossTotal = taxableBase + gstAmount;

  let tdsAmount = 0;
  if (record.tdsConfig?.enabled && record.tdsConfig.ratePercent > 0) {
    tdsAmount = Math.round((taxableBase * record.tdsConfig.ratePercent) / 100);
  }
  const netPayable = grossTotal - tdsAmount;

  const gstinAnalysis = useMemo(() => {
    return validateAndParseGstin(record.client?.gstin || '');
  }, [record.client?.gstin]);

  // Save handler
  const handleSave = () => {
    onSave(record);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Robust Print & PDF Handler
  const handlePrint = () => {
    // Opens dedicated Print & PDF Preview Center with full document view and printer trigger
    setShowPrintModal(true);
  };

  // DOCX Export Handlers
  const handleDownloadLetterDocx = async () => {
    setIsExporting(true);
    try {
      await exportLetterDocx(record, firmProfile);
    } catch (err) {
      console.error('Word Letter export error', err);
      alert('Failed to generate Word document. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadInvoiceDocx = async () => {
    setIsExporting(true);
    try {
      await exportInvoiceDocx(record, firmProfile);
    } catch (err) {
      console.error('Word Invoice export error', err);
      alert('Failed to generate Word invoice. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBoth = async () => {
    setIsExporting(true);
    try {
      await exportEngagementZip(record, firmProfile);
    } catch (err) {
      console.error('ZIP export error', err);
      alert('Failed to bundle documents into ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  // Duplicate Engagement Feature
  const handleClone = () => {
    const nextRefSuffix = String(Math.floor(Math.random() * 900) + 100);
    const clonedRecord: EngagementRecord = {
      ...record,
      id: `eng-${Date.now()}`,
      refNo: `GFP/PUN/ADV/${new Date().getFullYear()}/${nextRefSuffix}`,
      invoiceNo: `PI/26-27/${nextRefSuffix}`,
      date: new Date().toLocaleDateString('en-GB'),
      status: 'draft',
    };
    if (onCloneEngagement) {
      onCloneEngagement(clonedRecord);
    } else {
      setRecord(clonedRecord);
      alert(`Created duplicate engagement with Ref No: ${clonedRecord.refNo}`);
    }
  };

  const handleInvoiceQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('QR code photo file size must be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setRecord((prev) => ({
        ...prev,
        qrCodeDataUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleInvoiceQrRemove = () => {
    setRecord((prev) => ({
      ...prev,
      qrCodeDataUrl: undefined,
    }));
  };

  // Client Preset loader
  const handleApplyClientPreset = (presetId: string) => {
    const preset = clientPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setRecord((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        companyName: preset.companyName,
        addresseeName: preset.addresseeName,
        salutation: preset.salutation || 'Dear Sir',
        designation: preset.designation,
        businessEntityType: preset.businessEntityType || 'Private Limited',
        billingAddress: preset.billingAddress,
        state: preset.state,
        gstin: preset.gstin,
        pan: preset.pan,
        email: preset.email,
        phone: preset.phone,
      },
    }));
  };

  const handleSaveCurrentAsPreset = () => {
    if (!record.client.companyName && !record.client.addresseeName) {
      alert('Please fill at least the client company or contact name before saving as a preset.');
      return;
    }
    const newPreset: ClientPreset = {
      id: `custom-${Date.now()}`,
      companyName: record.client.companyName || 'Untitled Client',
      addresseeName: record.client.addresseeName || 'Authorized Signatory',
      salutation: record.client.salutation || 'Dear Sir',
      designation: record.client.designation || 'Director',
      businessEntityType: record.client.businessEntityType || 'Private Limited',
      billingAddress: record.client.billingAddress || '',
      state: record.client.state || 'Maharashtra',
      gstin: record.client.gstin || '',
      pan: record.client.pan || '',
      email: record.client.email || '',
      phone: record.client.phone || '',
    };
    const updated = [newPreset, ...clientPresets];
    setClientPresets(updated);
    try {
      const customOnly = updated.filter((p) => p.id.startsWith('custom-'));
      localStorage.setItem('gfp_custom_client_presets', JSON.stringify(customOnly));
      alert(`Saved "${newPreset.companyName}" to client presets!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Multi-Service Operations
  const handleAddService = (templateId: string) => {
    const tmpl = availableTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;
    // Deep clone template
    const clonedService: ServiceTemplate = JSON.parse(JSON.stringify(tmpl));
    const newServices = [...activeServices, clonedService];
    setRecord((prev) => ({
      ...prev,
      services: newServices,
      service: newServices[0],
    }));
  };

  const handleRemoveService = (serviceIndex: number) => {
    if (activeServices.length <= 1) {
      alert('An engagement letter must include at least one service offering.');
      return;
    }
    const newServices = activeServices.filter((_, idx) => idx !== serviceIndex);
    setRecord((prev) => ({
      ...prev,
      services: newServices,
      service: newServices[0],
    }));
    if (activeScopeServiceIndex >= newServices.length) {
      setActiveScopeServiceIndex(0);
    }
  };

  const handleUpdateServiceFee = (serviceIndex: number, newFee: number) => {
    const newServices = activeServices.map((srv, idx) => {
      if (idx !== serviceIndex) return srv;
      return {
        ...srv,
        pricing: {
          ...srv.pricing,
          feeAmount: Math.max(0, newFee),
        },
      };
    });
    setRecord((prev) => ({
      ...prev,
      services: newServices,
      service: newServices[0],
    }));
  };

  // Deliverable toggle for active scope service
  const currentScopeService = activeServices[activeScopeServiceIndex] || activeServices[0];

  const handleToggleDeliverable = (delivId: string) => {
    const updatedServices = activeServices.map((srv, idx) => {
      if (idx !== activeScopeServiceIndex) return srv;
      return {
        ...srv,
        deliverables: srv.deliverables.map((d) =>
          d.id === delivId ? { ...d, include: !d.include } : d
        ),
      };
    });
    setRecord((prev) => ({
      ...prev,
      services: updatedServices,
      service: updatedServices[0],
    }));
  };

  const [newSubTitles, setNewSubTitles] = useState<Record<string, string>>({});
  const [expandedSubDeliverables, setExpandedSubDeliverables] = useState<Record<string, boolean>>({});

  const handleAddSubDeliverable = (delivId: string) => {
    const text = (newSubTitles[delivId] || '').trim();
    if (!text) return;

    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: text,
      completed: false,
    };

    const updatedServices = activeServices.map((srv, idx) => {
      if (idx !== activeScopeServiceIndex) return srv;
      return {
        ...srv,
        deliverables: srv.deliverables.map((d) => {
          if (d.id !== delivId) return d;
          return {
            ...d,
            subDeliverables: [...(d.subDeliverables || []), newSub],
          };
        }),
      };
    });

    setRecord((prev) => ({
      ...prev,
      services: updatedServices,
      service: updatedServices[0],
    }));

    setNewSubTitles((prev) => ({ ...prev, [delivId]: '' }));
    setExpandedSubDeliverables((prev) => ({ ...prev, [delivId]: true }));
  };

  const handleDeleteSubDeliverable = (delivId: string, subId: string) => {
    const updatedServices = activeServices.map((srv, idx) => {
      if (idx !== activeScopeServiceIndex) return srv;
      return {
        ...srv,
        deliverables: srv.deliverables.map((d) => {
          if (d.id !== delivId) return d;
          return {
            ...d,
            subDeliverables: (d.subDeliverables || []).filter((s) => s.id !== subId),
          };
        }),
      };
    });

    setRecord((prev) => ({
      ...prev,
      services: updatedServices,
      service: updatedServices[0],
    }));
  };

  const handleToggleSubDeliverable = (delivId: string, subId: string) => {
    const updatedServices = activeServices.map((srv, idx) => {
      if (idx !== activeScopeServiceIndex) return srv;
      return {
        ...srv,
        deliverables: srv.deliverables.map((d) => {
          if (d.id !== delivId) return d;
          return {
            ...d,
            subDeliverables: (d.subDeliverables || []).map((s) =>
              s.id === subId ? { ...s, completed: !s.completed } : s
            ),
          };
        }),
      };
    });

    setRecord((prev) => ({
      ...prev,
      services: updatedServices,
      service: updatedServices[0],
    }));
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans pb-16">
      {/* Top Professional Action Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 sticky top-14 z-40 print:hidden shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back & Title info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-none transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {record.refNo}
                </h1>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-700">
                  {record.client.companyName || record.client.addresseeName || 'Unassigned Client'}
                </span>
                {activeServices.length > 1 && (
                  <span className="bg-blue-100 text-[#0B2545] text-[10px] font-bold px-2 py-0.5 rounded-none font-mono">
                    {activeServices.length} Services Bundled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Invoice: <strong className="font-mono text-slate-700">{record.invoiceNo}</strong> • Date: {record.date} • Total: <strong className="text-[#0B2545] font-mono">{formatIndianCurrency(grossTotal)}</strong>
              </p>
            </div>
          </div>

          {/* Right: Export & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Clone Button */}
            <button
              type="button"
              onClick={handleClone}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-none text-xs font-semibold shadow-xs transition"
              title="Duplicate this engagement as a new record"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            {/* Print Directly / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-none text-xs font-bold shadow-xs transition active:scale-95"
              title="Print page or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-blue-700" />
              <span>Print Page</span>
            </button>

            {/* Word Letter Export */}
            <button
              type="button"
              onClick={handleDownloadLetterDocx}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-none text-xs font-semibold shadow-xs transition"
              title="Export polished Word (.docx) engagement letter without underscores"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Word Letter</span>
            </button>

            {/* Word Invoice Export */}
            <button
              type="button"
              onClick={handleDownloadInvoiceDocx}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-none text-xs font-semibold shadow-xs transition"
              title="Export Word (.docx) pro-forma invoice"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Word Invoice</span>
            </button>

            {/* ZIP Both */}
            <button
              type="button"
              onClick={handleDownloadBoth}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 rounded-none text-xs font-semibold shadow-xs transition"
              title="Download clean ZIP of Letter + Invoice"
            >
              <Archive className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden md:inline">ZIP Both</span>
            </button>

            {/* Save Changes */}
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0B2545] hover:bg-[#133863] text-white rounded-none font-bold text-xs shadow-xs transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-blue-200" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#0B2545] text-white px-4 py-2.5 rounded-none shadow-xl flex items-center gap-2 text-xs font-medium border border-blue-900 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          <span>Engagement {record.refNo} saved successfully.</span>
        </div>
      )}

      {/* Main Grid: Form Controls (Left) & Live Document Preview (Right) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Controls & Subtabs (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3.5 print:hidden">
          {/* Multi-Stage Progress Stepper Header */}
          <div className="bg-white border border-slate-200 rounded-none p-2 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Workflow Stages</span>
              <span className="font-mono text-slate-400">Step {
                activeTab === 'services' ? '1' :
                activeTab === 'details' ? '2' :
                activeTab === 'scope' ? '3' :
                activeTab === 'pricing' ? '4' : '5'
              } of 5</span>
            </div>
            <nav className="grid grid-cols-5 gap-1 text-xs" aria-label="Editor workflow stages">
              {[
                { key: 'services', step: '1', label: 'Services', hasError: activeServices.length === 0 },
                { key: 'details', step: '2', label: 'Client', hasError: !record.client.addresseeName?.trim() && !record.client.companyName?.trim() },
                { key: 'scope', step: '3', label: 'Scope', hasError: false },
                { key: 'pricing', step: '4', label: 'Fees & TDS', hasError: totalBaseFee <= 0 },
                { key: 'invoice', step: '5', label: 'Execution', hasError: false },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 rounded-none text-center transition flex flex-col items-center justify-center gap-0.5 border ${
                    activeTab === tab.key
                      ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs'
                      : 'bg-slate-50/70 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold rounded-none ${
                      activeTab === tab.key ? 'bg-blue-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.step}
                    </span>
                    {tab.hasError && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Missing required info" />
                    )}
                  </div>
                  <span className="font-bold text-[10px] sm:text-[11px] truncate max-w-full">
                    {tab.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* TAB 1: Multi-Service Offerings Bundling */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-none border border-slate-200 p-4 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-xs">
                    Engaged Service Offerings & Bundles
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select one or multiple advisory services in this single charter
                  </p>
                </div>
                {onOpenTemplateManager && (
                  <button
                    type="button"
                    onClick={onOpenTemplateManager}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Template Library →
                  </button>
                )}
              </div>

              {/* List of currently active services */}
              <div className="space-y-2.5">
                {activeServices.map((srv, idx) => (
                  <div
                    key={srv.id || idx}
                    className="p-3 bg-slate-50/80 rounded-none border border-slate-200 hover:border-blue-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#0B2545] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none">
                            {srv?.serviceCode || `S-${idx + 1}`}
                          </span>
                          <h3 className="font-bold text-slate-900 text-xs">{srv?.serviceTitle || 'Service'}</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {(srv?.deliverables || []).filter((d) => d.include).length} deliverables included • Timeline: {srv?.projectTimeline || '3 to 4 Weeks'}
                        </p>
                      </div>

                      {/* Remove service button container with fixed footprint */}
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        {activeServices.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition"
                            title="Remove this service from engagement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-7 h-7" />
                        )}
                      </div>
                    </div>

                    {/* Fee Allocation */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">
                        Professional Fee (INR):
                      </span>
                      <div className="relative w-36">
                        <span className="absolute left-2 top-1.5 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={srv.pricing.feeAmount}
                          onChange={(e) =>
                            handleUpdateServiceFee(idx, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full pl-6 pr-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-900 text-right focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add another service dropdown with robust layout */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  + Add Additional Service Offering to this Charter:
                </label>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                  <div className="relative flex-1 min-w-0">
                    <select
                      id="add-service-select"
                      className="w-full truncate px-3 py-2 bg-white border-2 border-slate-300 rounded-none text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-700 shadow-inner"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select advisory service to add...
                      </option>
                      {availableTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.serviceTitle} — {formatIndianCurrency(t.pricing.feeAmount)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('add-service-select') as HTMLSelectElement;
                      if (sel && sel.value) {
                        handleAddService(sel.value);
                        sel.value = '';
                      }
                    }}
                    className="shrink-0 px-4 py-2 bg-[#0B2545] hover:bg-[#133863] text-white rounded-none text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-200" />
                    <span>+ Add Service to Charter</span>
                  </button>
                </div>
              </div>

              {/* Aggregated Fee Summary */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-none flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0B2545]">Aggregate Base Investment:</span>
                  <p className="text-[11px] text-slate-500">Across all {activeServices.length} selected service lines</p>
                </div>
                <span className="font-mono font-black text-sm text-[#0B2545]">
                  {formatIndianCurrency(totalBaseFee)}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Client & Document Information */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-none border border-slate-200 p-4 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-xs">Client & Entity Information</h2>
                  <p className="text-[11px] text-slate-500">Billing addressee and legal credentials</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveCurrentAsPreset}
                  className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-none border border-blue-200 hover:bg-blue-100 transition"
                  title="Save current client details as a reusable preset"
                >
                  + Save as Preset
                </button>
              </div>

              {/* Preset Selector Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Quick Load from Client Presets:
                </label>
                <select
                  onChange={(e) => handleApplyClientPreset(e.target.value)}
                  className="w-full px-3 py-1.5 bg-blue-50/40 border border-blue-200 rounded-none text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a client preset to autofill...
                  </option>
                  {clientPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.companyName} ({p.addresseeName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Engagement Ref No
                  </label>
                  <input
                    type="text"
                    value={record.refNo}
                    onChange={(e) => setRecord({ ...record, refNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Invoice No
                  </label>
                  <input
                    type="text"
                    value={record.invoiceNo}
                    onChange={(e) => setRecord({ ...record, invoiceNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Document Date
                  </label>
                  <input
                    type="text"
                    value={record.date}
                    onChange={(e) => setRecord({ ...record, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Offer Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={record.validityDays}
                    onChange={(e) =>
                      setRecord({ ...record, validityDays: parseInt(e.target.value, 10) || 7 })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Salutation
                  </label>
                  <select
                    value={record.client.salutation}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, salutation: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Dear Sir">Dear Sir</option>
                    <option value="Dear Madam">Dear Madam</option>
                    <option value="Dear Sir/Madam">Dear Sir/Madam</option>
                    <option value="Dear Dr.">Dear Dr.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Contact Addressee *
                  </label>
                  <input
                    type="text"
                    value={record.client.addresseeName}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, addresseeName: e.target.value },
                      })
                    }
                    placeholder="e.g. Mr. Rajeshwar Sharma"
                    className={`w-full px-2.5 py-1.5 rounded-none font-semibold text-slate-900 focus:bg-white focus:outline-none ${
                      !record.client.addresseeName?.trim()
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-600'
                        : 'bg-slate-50 border border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {!record.client.addresseeName?.trim() && (
                    <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      Addressee contact name is required for recipient block
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Company / Entity Name *
                  </label>
                  <input
                    type="text"
                    value={record.client.companyName}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, companyName: e.target.value },
                      })
                    }
                    placeholder="e.g. Apex Precision Technologies Pvt Ltd"
                    className={`w-full px-2.5 py-1.5 rounded-none font-semibold text-slate-900 focus:bg-white focus:outline-none ${
                      !record.client.companyName?.trim()
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-600'
                        : 'bg-slate-50 border border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {!record.client.companyName?.trim() && (
                    <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      Company or legal entity name is required
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={record.client.designation || ''}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, designation: e.target.value },
                      })
                    }
                    placeholder="e.g. Managing Director"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={record.client.billingAddress}
                  onChange={(e) =>
                    setRecord({
                      ...record,
                      client: { ...record.client, billingAddress: e.target.value },
                    })
                  }
                  placeholder="Plot/Street, Industrial Area, City - Pincode"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    State (Place of Supply)
                  </label>
                  <select
                    value={record.client.state}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, state: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Client GSTIN
                    </label>
                    {gstinAnalysis.isValid && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-300">
                        Valid GSTIN
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={record.client.gstin || ''}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, gstin: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="27AABCA1234F1Z8"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 uppercase"
                  />
                  {/* GSTIN Analysis & 1-Click Auto-Fill */}
                  {record.client.gstin && (
                    <div className="mt-1.5 p-2 bg-blue-50/70 border border-blue-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span>
                          <strong className="text-[#0B2545]">State:</strong> {gstinAnalysis.stateName} ({gstinAnalysis.stateCode})
                        </span>
                        {gstinAnalysis.entityType && (
                          <span className="font-semibold text-blue-900 text-[10px] truncate max-w-[150px]">{gstinAnalysis.entityType}</span>
                        )}
                      </div>
                      {gstinAnalysis.pan && (
                        <div className="text-slate-600 font-mono text-[10.5px]">
                          <strong>PAN:</strong> {gstinAnalysis.pan}
                        </div>
                      )}
                      {gstinAnalysis.isValid && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecord({
                              ...record,
                              client: {
                                ...record.client,
                                state: gstinAnalysis.stateName || record.client.state,
                                pan: gstinAnalysis.pan || record.client.pan,
                                businessEntityType: gstinAnalysis.entityType || record.client.businessEntityType,
                              },
                            });
                          }}
                          className="w-full mt-1 py-1 px-2 bg-[#0B2545] hover:bg-blue-900 text-white font-bold text-[10px] rounded-none transition"
                        >
                          Auto-Fill State, PAN & Entity Type
                        </button>
                      )}
                      {!gstinAnalysis.isValid && record.client.gstin.length > 3 && (
                        <p className="text-[10px] text-amber-700 italic">
                          {gstinAnalysis.errorMessage || '15-character GSTIN format'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    PAN
                  </label>
                  <input
                    type="text"
                    value={record.client.pan || ''}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, pan: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="AABCA1234F"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={record.client.email || ''}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        client: { ...record.client, email: e.target.value },
                      })
                    }
                    placeholder="client@company.com"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Scope & Deliverables */}
          {activeTab === 'scope' && (
            <div className="bg-white rounded-none border border-slate-200 p-4 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-xs">Scope & Deliverables</h2>
                  <p className="text-[11px] text-slate-500">Toggle and customize deliverables</p>
                </div>
              </div>

              {/* If multi-service, tabs to switch which service's deliverables to edit */}
              {activeServices.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {activeServices.map((srv, idx) => (
                    <button
                      key={srv.id || idx}
                      type="button"
                      onClick={() => setActiveScopeServiceIndex(idx)}
                      className={`px-2.5 py-1 rounded-none text-xs font-bold transition whitespace-nowrap ${
                        activeScopeServiceIndex === idx
                          ? 'bg-[#0B2545] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {srv?.serviceCode || `Service ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Active scope service deliverables */}
              {currentScopeService && (
                <div className="space-y-2">
                  <div className="font-bold text-[#0B2545] pb-1 border-b border-slate-100">
                    {currentScopeService.serviceTitle || 'Service Scope'}
                  </div>
                  {(currentScopeService.deliverables || []).map((del) => {
                    const subList = del.subDeliverables || [];
                    const isExpanded = expandedSubDeliverables[del.id] ?? (subList.length > 0);

                    return (
                      <div
                        key={del.id}
                        className={`p-2.5 border transition rounded-none ${
                          del.include
                            ? 'bg-blue-50/40 border-blue-200 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={del.include}
                            onChange={() => handleToggleDeliverable(del.id)}
                            className="mt-0.5 rounded-none text-[#0B2545] focus:ring-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-xs text-slate-900">{del.heading}</p>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSubDeliverables((prev) => ({
                                    ...prev,
                                    [del.id]: !isExpanded,
                                  }))
                                }
                                className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded-none shrink-0"
                              >
                                {subList.length} Sub-Deliverables {isExpanded ? '▲' : '▼'}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{del.body}</p>
                          </div>
                        </div>

                        {/* Nested Sub-Deliverables Section */}
                        {isExpanded && del.include && (
                          <div className="mt-2.5 pt-2 border-t border-blue-200/60 pl-6 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              <span>Milestone Sub-Deliverables:</span>
                              <span className="font-mono text-blue-800">
                                {subList.filter((s) => s.completed).length}/{subList.length} Done
                              </span>
                            </div>

                            {/* Sub items list */}
                            {subList.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between gap-2 py-1 px-2 bg-white border border-slate-200 text-xs rounded-none"
                              >
                                <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!sub.completed}
                                    onChange={() => handleToggleSubDeliverable(del.id, sub.id)}
                                    className="rounded-none text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                                  />
                                  <span
                                    className={`text-[11px] font-medium truncate ${
                                      sub.completed ? 'line-through text-slate-400' : 'text-slate-800'
                                    }`}
                                  >
                                    {sub.title}
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubDeliverable(del.id, sub.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Delete sub-deliverable"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* Add sub-deliverable input */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                value={newSubTitles[del.id] || ''}
                                onChange={(e) =>
                                  setNewSubTitles((prev) => ({
                                    ...prev,
                                    [del.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSubDeliverable(del.id);
                                  }
                                }}
                                placeholder="Add sub-deliverable (e.g. Due diligence draft)..."
                                className="flex-1 px-2 py-1 text-[11px] bg-white border border-slate-300 rounded-none focus:outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSubDeliverable(del.id)}
                                disabled={!(newSubTitles[del.id] || '').trim()}
                                className="px-2.5 py-1 bg-[#0B2545] hover:bg-blue-900 disabled:opacity-40 text-white text-[10px] font-bold rounded-none shrink-0"
                              >
                                + Add Sub
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Timeline & Enablers */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Estimated Project Delivery Timeline
                  </label>
                  <input
                    type="text"
                    value={record.projectTimeline || currentScopeService.projectTimeline || '3 to 4 Weeks'}
                    onChange={(e) => setRecord({ ...record, projectTimeline: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Client Dependencies / Enablers Clause
                  </label>
                  <textarea
                    rows={2}
                    value={record.clientEnablersClause || currentScopeService.clientEnablersClause || ''}
                    onChange={(e) => setRecord({ ...record, clientEnablersClause: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Fees, TDS & Concessions */}
          {activeTab === 'pricing' && (
            <div className="bg-white rounded-none border border-slate-200 p-4 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-xs">Commercial Terms & Taxation</h2>
                  <p className="text-[11px] text-slate-500">Advance, TDS under Sec 194J, and Concessions</p>
                </div>
              </div>

              {/* Currency Selector & Live Conversion Calculator */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Billing Currency & Foreign Exchange
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {record.currency !== 'INR' ? `1 ${record.currency} = ₹ ${SUPPORTED_CURRENCIES[record.currency || 'INR']?.exchangeRateToInr || 1}` : 'Base: INR'}
                  </span>
                </div>
                <select
                  value={record.currency || 'INR'}
                  onChange={(e) => setRecord({ ...record, currency: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-none font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-xs"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                </select>

                {/* Conversion Preview */}
                <div className="p-2 bg-blue-50/70 border border-blue-200 text-[11px] flex items-center justify-between">
                  <span className="text-slate-700">Base Equivalent:</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#0B2545]">
                      {record.currency !== 'INR'
                        ? `${formatCurrencyWithSymbol(totalBaseFee, record.currency)} (₹ ${Math.round(totalBaseFee * (SUPPORTED_CURRENCIES[record.currency || 'INR']?.exchangeRateToInr || 1)).toLocaleString('en-IN')})`
                        : `₹ ${totalBaseFee.toLocaleString('en-IN')} (~ $ ${Math.round(totalBaseFee / 86.85).toLocaleString()} USD)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestone Billing Schedule Generator */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0B2545] text-xs">Milestone Billing Schedule</span>
                    <p className="text-[10px] text-slate-500">Generate structured tranches for engagement clause</p>
                  </div>
                  {record.billingScheduleMilestones && record.billingScheduleMilestones.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRecord({ ...record, billingScheduleMilestones: [] })}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Clear Schedule
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_MILESTONE_SCHEDULES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const calculatedSplits = preset.splits.map((s) => ({
                          name: s.name,
                          percent: s.percent,
                          amount: Math.round((totalBaseFee * s.percent) / 100),
                          trigger: s.trigger,
                        }));
                        const firstPercent = Math.round(preset.splits[0]?.percent || 50);
                        setRecord({
                          ...record,
                          billingScheduleMilestones: calculatedSplits,
                          customAdvancePercent: firstPercent,
                        });
                      }}
                      className="p-1.5 text-left border border-slate-200 bg-white hover:bg-blue-50/70 hover:border-blue-300 transition text-[10.5px]"
                    >
                      <div className="font-bold text-slate-800 truncate">{preset.name}</div>
                      <div className="text-[9.5px] text-slate-500 truncate">{preset.splits.length} Milestones</div>
                    </button>
                  ))}
                </div>

                {/* Render current milestones breakdown */}
                {record.billingScheduleMilestones && record.billingScheduleMilestones.length > 0 ? (
                  <div className="border border-blue-200 bg-white divide-y divide-slate-100 text-[11px]">
                    {record.billingScheduleMilestones.map((m, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[9.5px] text-slate-500 italic">{m.trigger}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-blue-900">{m.percent}%</span>
                          <p className="font-mono text-[10px] text-slate-600">{formatIndianCurrency(m.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">
                    Select a preset above to insert an executive milestone table into the engagement terms.
                  </p>
                )}
              </div>

              {/* Advance Mobilization Slider */}
              <div className="p-3 bg-slate-50 rounded-none border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Mobilization Advance %:</span>
                  <span className="font-mono font-bold text-[#0B2545] text-sm">
                    {record.collectFullAtEnd ? '0% (Waived)' : `${record.customAdvancePercent || 50}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  disabled={record.collectFullAtEnd}
                  value={record.customAdvancePercent || 50}
                  onChange={(e) =>
                    setRecord({ ...record, customAdvancePercent: parseInt(e.target.value, 10) })
                  }
                  className={`w-full accent-[#0B2545] ${record.collectFullAtEnd ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>10% Minimum</span>
                  <span>50% Standard</span>
                  <span>100% Upfront</span>
                </div>
              </div>

              {/* Advance & Balance Commercial Settlement Options */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-none space-y-2.5">
                <div className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-700" />
                  <span>Advance & GST Terms Customization</span>
                </div>

                {/* Toggle 1: Collect Full Payment at End */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs p-2 bg-white border border-blue-100 hover:bg-blue-50/30 transition">
                  <input
                    type="checkbox"
                    checked={record.collectFullAtEnd || false}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        collectFullAtEnd: e.target.checked,
                      })
                    }
                    className="mt-0.5 accent-[#0B2545]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Collect Full Payment at Project End</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Waives mobilization advance (₹0 upfront). 100% of the advisory fee + GST is collected together upon final deliverable completion.
                    </span>
                  </div>
                </label>

                {/* Toggle 2: Exempt GST on Advance */}
                {!record.collectFullAtEnd && (
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs p-2 bg-white border border-blue-100 hover:bg-blue-50/30 transition">
                    <input
                      type="checkbox"
                      checked={record.advanceExemptGst || false}
                      onChange={(e) =>
                        setRecord({
                          ...record,
                          advanceExemptGst: e.target.checked,
                        })
                      }
                      className="mt-0.5 accent-[#0B2545]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Exempt Advance from GST (0% on Advance)</span>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Advance proforma is issued without GST. Entire 18% GST liability is deferred and collected along with the balance payment at the end.
                      </span>
                    </div>
                  </label>
                )}
              </div>

              {/* Professional Fee Concession / Discount */}
              <div className="p-3 bg-slate-50 rounded-none border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={record.discountConfig?.enabled || false}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        discountConfig: {
                          ...(record.discountConfig || { type: 'percent', value: 0 }),
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-[#0B2545]"
                  />
                  <span>Apply Professional Fee Concession / Discount</span>
                </label>

                {record.discountConfig?.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Discount Type
                      </label>
                      <select
                        value={record.discountConfig.type}
                        onChange={(e) =>
                          setRecord({
                            ...record,
                            discountConfig: {
                              ...record.discountConfig!,
                              type: e.target.value as 'percent' | 'fixed',
                            },
                          })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-none font-medium text-slate-900"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Value
                      </label>
                      <input
                        type="number"
                        value={record.discountConfig.value}
                        onChange={(e) =>
                          setRecord({
                            ...record,
                            discountConfig: {
                              ...record.discountConfig!,
                              value: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TDS under Section 194J */}
              <div className="p-3 bg-amber-50/50 rounded-none border border-amber-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={record.tdsConfig?.enabled || false}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        tdsConfig: {
                          ...(record.tdsConfig || { section: '194J', ratePercent: 10 }),
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-amber-700"
                  />
                  <span>Deduct TDS under Section 194J (Income Tax Act)</span>
                </label>

                {record.tdsConfig?.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-amber-800 mb-0.5">
                        Applicable Rate
                      </label>
                      <select
                        value={record.tdsConfig.ratePercent}
                        onChange={(e) =>
                          setRecord({
                            ...record,
                            tdsConfig: {
                              ...record.tdsConfig!,
                              ratePercent: parseInt(e.target.value, 10) || 10,
                            },
                          })
                        }
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded-none font-medium text-slate-900"
                      >
                        <option value={10}>10% - Professional Services</option>
                        <option value={2}>2% - Technical / Call Center</option>
                      </select>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                      <span className="text-[10px] text-amber-800">TDS Amount:</span>
                      <span className="font-mono font-bold text-amber-950 text-xs">
                        - {formatIndianCurrency(tdsAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Complete Live Summary Breakdown */}
              <div className="p-3.5 bg-slate-900 text-white rounded-none space-y-1.5 font-mono text-xs shadow-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Gross Base Fee:</span>
                  <span>{formatIndianCurrency(totalBaseFee)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-300">
                    <span>Less Concession:</span>
                    <span>- {formatIndianCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-200 font-bold border-t border-slate-700 pt-1">
                  <span>Taxable Investment:</span>
                  <span>{formatIndianCurrency(taxableBase)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GST ({gstRate}%):</span>
                  <span>{formatIndianCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold border-t border-slate-700 pt-1">
                  <span>Total Commercials:</span>
                  <span>{formatIndianCurrency(grossTotal)}</span>
                </div>
                {tdsAmount > 0 && (
                  <div className="flex justify-between text-amber-200">
                    <span>Less TDS (194J):</span>
                    <span>- {formatIndianCurrency(tdsAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400 font-black text-sm border-t-2 border-emerald-500 pt-1">
                  <span>Net Receivable:</span>
                  <span>{formatIndianCurrency(netPayable)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Invoice, Signatory & Stamp */}
          {activeTab === 'invoice' && (
            <div className="bg-white rounded-none border border-slate-200 p-4 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-xs">Invoice & Execution Options</h2>
                  <p className="text-[11px] text-slate-500">Signatory, stamps, and issuer mode</p>
                </div>
              </div>

              {/* Invoice Issuer Mode */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Invoice Issuer Entity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecord({ ...record, invoiceIssuerType: 'firm', isNonGstInvoice: false })}
                    className={`p-2.5 rounded-none border text-left font-sans transition ${
                      !isPersonalNonGst
                        ? 'bg-blue-50 border-[#0B2545] text-[#0B2545] font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <p className="text-xs">Corporate Practice (GST)</p>
                    <p className="text-[10px] text-slate-500 font-normal">GFP Consulting Pvt Ltd</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecord({ ...record, invoiceIssuerType: 'personal', isNonGstInvoice: true })}
                    className={`p-2.5 rounded-none border text-left font-sans transition ${
                      isPersonalNonGst
                        ? 'bg-blue-50 border-[#0B2545] text-[#0B2545] font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <p className="text-xs">Personal (Non-GST)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Individual Consultant Bill</p>
                  </button>
                </div>
              </div>

              {/* Payment QR Code Photo for this Invoice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-[#0B2545]" />
                    <span className="font-bold text-[#0B2545] uppercase text-[10px] tracking-wider">
                      Pro-Forma Invoice QR Code Photo:
                    </span>
                  </div>
                  {record.qrCodeDataUrl ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Invoice QR Set
                    </span>
                  ) : firmProfile.qrCodeDataUrl || firmProfile.bankDetails.qrCodeDataUrl ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-[#0B2545] border border-blue-300">
                      Firm Default QR Active
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-medium">
                      Auto-generated UPI QR
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-white p-2.5 border border-slate-200">
                  {record.qrCodeDataUrl || firmProfile.qrCodeDataUrl || firmProfile.bankDetails.qrCodeDataUrl ? (
                    <img
                      src={record.qrCodeDataUrl || firmProfile.qrCodeDataUrl || firmProfile.bankDetails.qrCodeDataUrl}
                      alt="Invoice QR Code"
                      className="w-16 h-16 object-contain border border-slate-200 p-0.5 bg-slate-50 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <QrCode className="w-6 h-6" />
                      <span className="text-[8px] mt-0.5">UPI QR</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-800">
                      {record.qrCodeDataUrl
                        ? 'Custom QR uploaded for this invoice'
                        : firmProfile.qrCodeDataUrl || firmProfile.bankDetails.qrCodeDataUrl
                        ? 'Using firm master QR code'
                        : 'Using dynamic UPI payment QR'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Printed on the pro-forma invoice and embedded in Word (.docx) export.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>{record.qrCodeDataUrl ? 'Replace Photo' : 'Upload QR Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleInvoiceQrUpload}
                          className="hidden"
                        />
                      </label>
                      {record.qrCodeDataUrl && (
                        <button
                          type="button"
                          onClick={handleInvoiceQrRemove}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatory Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Authorised Signatory
                </label>
                <select
                  value={record.signatory?.id || 'default'}
                  onChange={(e) => {
                    const sel = firmProfile.signatories?.find((s) => s.id === e.target.value);
                    if (sel) {
                      setRecord({ ...record, signatory: sel });
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  {(firmProfile.signatories || []).map((sig) => (
                    <option key={sig.id} value={sig.id}>
                      {sig.name} ({sig.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Security: Watermark Customizer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B2545] text-xs">Engagement Letter Watermark</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={record.watermarkConfig?.enabled || false}
                      onChange={(e) =>
                        setRecord({
                          ...record,
                          watermarkConfig: {
                            ...(record.watermarkConfig || { text: 'CONFIDENTIAL', opacity: 0.12, diagonal: true }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#0B2545]"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Enable</span>
                  </label>
                </div>

                {record.watermarkConfig?.enabled && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Watermark Text
                      </label>
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        {['CONFIDENTIAL', 'DRAFT', 'ORIGINAL'].map((textOpt) => (
                          <button
                            key={textOpt}
                            type="button"
                            onClick={() =>
                              setRecord({
                                ...record,
                                watermarkConfig: {
                                  ...record.watermarkConfig!,
                                  text: textOpt,
                                },
                              })
                            }
                            className={`py-1 text-[10px] font-bold border ${
                              record.watermarkConfig?.text === textOpt
                                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {textOpt}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={record.watermarkConfig.text}
                        onChange={(e) =>
                          setRecord({
                            ...record,
                            watermarkConfig: {
                              ...record.watermarkConfig!,
                              text: e.target.value.toUpperCase(),
                            },
                          })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-none font-bold text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="text-[10px] font-semibold text-slate-600">
                        Opacity: {Math.round((record.watermarkConfig.opacity || 0.12) * 100)}%
                      </label>
                      <input
                        type="range"
                        min={0.05}
                        max={0.35}
                        step={0.02}
                        value={record.watermarkConfig.opacity || 0.12}
                        onChange={(e) =>
                          setRecord({
                            ...record,
                            watermarkConfig: {
                              ...record.watermarkConfig!,
                              opacity: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-32 accent-[#0B2545]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Digital CA Seal / Stamp */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B2545] text-xs">Digital Official Seal / CA Stamp</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={record.digitalSealConfig?.enabled ?? true}
                      onChange={(e) =>
                        setRecord({
                          ...record,
                          digitalSealConfig: {
                            ...(record.digitalSealConfig || { firmFrn: '138920W', membershipNumber: '142890' }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#0B2545]"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Include</span>
                  </label>
                </div>

                {record.digitalSealConfig?.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Firm FRN
                      </label>
                      <input
                        type="text"
                        value={record.digitalSealConfig.firmFrn || ''}
                        onChange={(e) =>
                          setRecord({
                            ...record,
                            digitalSealConfig: {
                              ...record.digitalSealConfig!,
                              firmFrn: e.target.value,
                            },
                          })
                        }
                        placeholder="138920W"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-none font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        CA Membership No
                      </label>
                      <input
                        type="text"
                        value={record.digitalSealConfig.membershipNumber || ''}
                        onChange={(e) =>
                          setRecord({
                            ...record,
                            digitalSealConfig: {
                              ...record.digitalSealConfig!,
                              membershipNumber: e.target.value,
                            },
                          })
                        }
                        placeholder="142890"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-none font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Interactive Document Canvas (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col min-h-[750px] border border-slate-200 bg-white shadow-xs">
          {/* Document Type Switcher Header */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                id="tab-engagement-letter"
                type="button"
                onClick={() => setPreviewTab('letter')}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all ${
                  previewTab === 'letter'
                    ? 'bg-white text-[#0B2545] shadow-xs border-b-2 border-[#0B2545]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Engagement Letter
              </button>
              <button
                id="tab-proforma-invoice"
                type="button"
                onClick={() => setPreviewTab('invoice')}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all ${
                  previewTab === 'invoice'
                    ? 'bg-white text-[#0B2545] shadow-xs border-b-2 border-[#0B2545]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pro-Forma Invoice
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              title="Expand to Fullscreen Print Dialog"
            >
              <Maximize2 className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">Fullscreen Print</span>
            </button>
          </div>

          {/* WordDocumentViewer Component */}
          <div className="flex-1 flex flex-col">
            <WordDocumentViewer
              record={record}
              firm={firmProfile}
              documentType={previewTab}
              onConfigChange={(newCfg) => setRecord((prev) => ({ ...prev, wordDocConfig: newCfg }))}
              onPrint={() => setShowPrintModal(true)}
            />
          </div>
        </div>
      </main>

      {/* Print & PDF Preview Modal Dialog */}
      <PrintPreviewModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        documentType={previewTab}
        targetElementId={previewTab === 'letter' ? 'printable-engagement-letter' : 'printable-proforma-invoice'}
        documentTitle={
          previewTab === 'letter'
            ? `Engagement Letter - ${record.client.companyName || record.client.addresseeName} - ${record.refNo}`
            : `Pro-Forma Invoice - ${record.client.companyName || record.client.addresseeName} - ${record.invoiceNo}`
        }
      >
        {previewTab === 'letter' ? (
          <LetterPreview record={record} firm={firmProfile} />
        ) : (
          <InvoicePreview record={record} firm={firmProfile} />
        )}
      </PrintPreviewModal>
    </div>
  );
};
