import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  Upload,
  Trash2,
  Building2,
  Landmark,
  UserCheck,
  Palette,
  Plus,
  AlignLeft,
  AlignRight,
  Sparkles,
  Check,
  Mail,
  Phone,
  QrCode,
  Image as ImageIcon,
  Sliders,
  BookOpen,
  Search,
  HelpCircle,
  ChevronRight,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  ArrowLeft,
  Filter,
  Database,
} from 'lucide-react';
import { FirmProfile, SignatoryDetails, ThemeSettings } from '../types';
import { INDIAN_STATES } from '../data/defaultFirmProfile';
import { LoginWallpaperSettingsTab } from './LoginWallpaperSettingsTab';
import { FirebaseTelemetryTab } from './FirebaseTelemetryTab';
import { DEFAULT_WALLPAPER } from '../data/presetWallpapers';

interface FirmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmProfile: FirmProfile;
  onSave: (updated: FirmProfile) => void;
  onOpenTaxonomy?: () => void;
  initialTab?: 'firm' | 'theme' | 'signatories' | 'bank' | 'login_wallpaper' | 'firebase_telemetry' | 'guide';
}

export const FirmSettingsModal: React.FC<FirmSettingsModalProps> = ({
  isOpen,
  onClose,
  firmProfile,
  onSave,
  onOpenTaxonomy,
  initialTab = 'theme',
}) => {
  const [profile, setProfile] = useState<FirmProfile>(() => ({
    ...firmProfile,
    signatories:
      firmProfile.signatories && firmProfile.signatories.length > 0
        ? firmProfile.signatories
        : [
            {
              id: 'sig-default',
              name: firmProfile.signatoryName || 'CA Yogesh Kulkarni',
              designation: firmProfile.signatoryDesignation || 'Director / Authorised Signatory',
              email: firmProfile.signatoryEmail || firmProfile.firmEmail || 'audit@gfpconsulting.in',
              phone: firmProfile.signatoryPhone || '+91 93708 88819',
              isDefault: true,
            },
          ],
    themeSettings: firmProfile.themeSettings || {
      colorTheme: 'royal_navy',
      fontFamily: 'sans',
      logoPosition: firmProfile.logoPosition || 'left',
      letterheadStyle: 'two_column',
    },
    logoPosition: firmProfile.logoPosition || 'left',
    logoWidthPx: firmProfile.logoWidthPx || 180,
  }));

  const [activeTab, setActiveTab] = useState<'firm' | 'theme' | 'signatories' | 'bank' | 'login_wallpaper' | 'firebase_telemetry' | 'guide'>(initialTab);
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [guideCategory, setGuideCategory] = useState<string>('all');

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          setProfile((prev) => ({
            ...prev,
            logoDataUrl: result,
            logoDimensions: { width: img.naturalWidth, height: img.naturalHeight },
          }));
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logoDataUrl: undefined }));
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('QR code image file size must be less than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setProfile((prev) => ({
        ...prev,
        qrCodeDataUrl: result,
        bankDetails: {
          ...prev.bankDetails,
          qrCodeDataUrl: result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setProfile((prev) => ({
      ...prev,
      qrCodeDataUrl: undefined,
      bankDetails: {
        ...prev.bankDetails,
        qrCodeDataUrl: undefined,
      },
    }));
  };

  // Signatory CRUD
  const handleAddSignatory = () => {
    const newSig: SignatoryDetails = {
      id: `sig-${Date.now()}`,
      name: '',
      designation: 'Authorised Signatory',
      email: '',
      phone: '',
      isDefault: (profile.signatories || []).length === 0,
    };
    setProfile((prev) => ({
      ...prev,
      signatories: [...(prev.signatories || []), newSig],
    }));
  };

  const handleUpdateSignatory = (id: string, updates: Partial<SignatoryDetails>) => {
    setProfile((prev) => {
      const updated = (prev.signatories || []).map((sig) => {
        if (sig.id === id) {
          return { ...sig, ...updates };
        }
        if (updates.isDefault) {
          return { ...sig, isDefault: false };
        }
        return sig;
      });

      // Also sync top-level if this is the default
      const def = updated.find((s) => s.isDefault) || updated[0];
      return {
        ...prev,
        signatories: updated,
        signatoryName: def ? def.name : prev.signatoryName,
        signatoryDesignation: def ? def.designation : prev.signatoryDesignation,
        signatoryEmail: def ? def.email : prev.signatoryEmail,
        signatoryPhone: def ? def.phone : prev.signatoryPhone,
      };
    });
  };

  const handleDeleteSignatory = (id: string) => {
    if ((profile.signatories || []).length <= 1) {
      alert('At least one authorised signatory must be maintained.');
      return;
    }
    setProfile((prev) => {
      const filtered = (prev.signatories || []).filter((s) => s.id !== id);
      if (!filtered.some((s) => s.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      const def = filtered.find((s) => s.isDefault) || filtered[0];
      return {
        ...prev,
        signatories: filtered,
        signatoryName: def ? def.name : prev.signatoryName,
        signatoryDesignation: def ? def.designation : prev.signatoryDesignation,
        signatoryEmail: def ? def.email : prev.signatoryEmail,
        signatoryPhone: def ? def.phone : prev.signatoryPhone,
      };
    });
  };

  // Theme & Layout Settings
  const handleUpdateTheme = (key: keyof ThemeSettings, val: any) => {
    setProfile((prev) => {
      const currentTheme = prev.themeSettings || {
        colorTheme: 'royal_navy',
        fontFamily: 'sans',
        logoPosition: 'left',
        letterheadStyle: 'two_column',
      };
      const updatedTheme = { ...currentTheme, [key]: val };
      return {
        ...prev,
        themeSettings: updatedTheme,
        ...(key === 'logoPosition' ? { logoPosition: val } : {}),
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profile);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="bg-[#F5F5F7] rounded-2xl shadow-2xl max-w-5xl w-full h-[88vh] min-h-[640px] max-h-[820px] border border-black/10 overflow-hidden flex flex-col font-sans text-slate-900 select-none"
          >
            {/* Apple macOS Window Title Bar (Notice: NO three dots on top as requested) */}
            <div className="h-12 bg-[#EBEBEF] border-b border-[#D2D2D7]/80 px-4 flex items-center justify-between select-none relative shrink-0">
              {/* Left: Window System Label */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#0B2545] flex items-center justify-center text-white text-[10px] font-bold shadow-2xs">
                  G
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                  System Settings
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-[180px]">
                  {profile.firmName || 'GFP Advisory'}
                </span>
              </div>

              {/* Center: Apple Window Title */}
              <div className="text-xs font-bold text-slate-800 tracking-tight text-center">
                Firm & Letterhead Settings
              </div>

              {/* Right: macOS Style Window Close Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-lg transition-colors"
                  title="Close Window (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Apple macOS Two-Column Split View */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
              {/* Left macOS Sidebar */}
              <div className="w-full md:w-64 bg-[#F2F2F6] border-b md:border-b-0 md:border-r border-[#D2D2D7]/70 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Preferences
                  </div>
                  {[
                    { id: 'theme', label: 'Appearance & Logo', sublabel: 'Letterhead styling', icon: Palette, grad: 'from-purple-500 to-indigo-600' },
                    { id: 'signatories', label: `Signatories (${profile.signatories?.length || 1})`, sublabel: 'Partners & Authorities', icon: UserCheck, grad: 'from-emerald-500 to-teal-600' },
                    { id: 'firm', label: 'Firm & Tax Information', sublabel: 'PAN, GSTIN & MSME', icon: Building2, grad: 'from-blue-500 to-sky-600' },
                    { id: 'bank', label: 'Banking & Contacts', sublabel: 'Bank A/C, UPI & Offices', icon: Landmark, grad: 'from-amber-500 to-orange-600' },
                    { id: 'login_wallpaper', label: 'Login Screen Wallpaper', sublabel: 'macOS Lockscreen Background', icon: ImageIcon, grad: 'from-pink-500 to-rose-600' },
                    { id: 'firebase_telemetry', label: 'Firebase Cloud Telemetry', sublabel: 'Usage, quotas & latency', icon: Database, grad: 'from-amber-500 to-red-500' },
                    { id: 'guide', label: 'Button & Feature Guide', sublabel: 'User manual & operations', icon: BookOpen, grad: 'from-indigo-600 to-blue-700' },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-all text-xs ${
                          active
                            ? 'bg-white text-slate-900 shadow-sm font-semibold border border-black/5'
                            : 'text-slate-600 hover:bg-black/5 hover:text-slate-900'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${tab.grad} flex items-center justify-center text-white shrink-0 shadow-xs`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold leading-tight">
                            {tab.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                            {tab.sublabel}
                          </div>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${active ? 'opacity-70 text-slate-400' : 'opacity-0'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Sidebar Bottom: Quick Links & Build Stamp */}
                <div className="mt-4 pt-3 border-t border-[#D2D2D7]/60 space-y-2">
                  {onOpenTaxonomy && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTaxonomy();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg text-xs font-medium border border-black/5 shadow-2xs transition"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-slate-500" />
                        <span>Customize Lists</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                  <div className="px-2 text-[10px] text-slate-400 text-center select-none font-mono">
                    macOS Native UI • 2026.4
                  </div>
                </div>
              </div>

              {/* Right macOS Main Content Pane */}
              <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-6 space-y-6">
                    {/* TAB 1: THEME & LOGO LAYOUT */}
                    {activeTab === 'theme' && (
                      <div className="space-y-5">
                        {/* Logo Position Selector */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Logo Position on Letterhead
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Choose whether the firm logo appears on the left or right header side of the document.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setProfile((p) => ({ ...p, logoPosition: 'left' }));
                                handleUpdateTheme('logoPosition', 'left');
                              }}
                              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                                profile.logoPosition === 'left'
                                  ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  profile.logoPosition === 'left' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <AlignLeft className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900">Left-Aligned Logo</div>
                                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  Logo on left side, firm name & coordinates on right
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProfile((p) => ({ ...p, logoPosition: 'right' }));
                                handleUpdateTheme('logoPosition', 'right');
                              }}
                              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                                profile.logoPosition === 'right'
                                  ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  profile.logoPosition === 'right' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <AlignRight className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900">Right-Aligned Logo</div>
                                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  Firm details on left side, logo emblem on right
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Logo Upload Section */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-32 h-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2.5 overflow-hidden shrink-0 shadow-2xs">
                              {profile.logoDataUrl ? (
                                <img
                                  src={profile.logoDataUrl}
                                  alt="Logo Preview"
                                  className="max-h-full max-w-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="text-center">
                                  <div className="w-9 h-9 mx-auto rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold flex items-center justify-center text-xs">
                                    GFP
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">Default Crest</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-center sm:text-left space-y-1.5">
                              <h4 className="text-xs font-bold text-slate-900">Firm Logo File</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Upload PNG, JPG, or SVG vector graphic (under 2MB). Automatically embedded into letterhead headers and Word (.docx) documents.
                              </p>
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs transition">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Custom Logo</span>
                                  <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/svg+xml"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                  />
                                </label>
                                {profile.logoDataUrl && (
                                  <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Use Default GFP Logo</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Logo Size Control Slider */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Logo Display Size on Documents
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Controls the constant width of your logo across Engagement Letters and Pro-Forma Invoices.
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                              <span className="text-xs font-mono font-bold text-[#0B2545]">{profile.logoWidthPx || 180}</span>
                              <span className="text-[10px] text-slate-400 font-sans">px</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="70"
                              max="380"
                              step="5"
                              value={profile.logoWidthPx || 180}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setProfile((prev) => ({ ...prev, logoWidthPx: val }));
                              }}
                              className="flex-1 h-2 bg-slate-200 accent-[#0B2545] cursor-pointer rounded-full"
                            />
                            <input
                              type="number"
                              min="50"
                              max="500"
                              value={profile.logoWidthPx || 180}
                              onChange={(e) => {
                                const val = Math.max(40, Math.min(600, parseInt(e.target.value, 10) || 180));
                                setProfile((prev) => ({ ...prev, logoWidthPx: val }));
                              }}
                              className="w-20 px-2.5 py-1 text-xs border border-slate-300 font-mono text-center rounded-lg bg-white"
                            />
                          </div>

                          {/* Quick Presets */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">Presets:</span>
                            {[
                              { label: 'Compact', px: 130 },
                              { label: 'Standard', px: 180 },
                              { label: 'Prominent', px: 240 },
                              { label: 'Hero', px: 320 },
                            ].map((preset) => (
                              <button
                                key={preset.px}
                                type="button"
                                onClick={() => setProfile((prev) => ({ ...prev, logoWidthPx: preset.px }))}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                                  (profile.logoWidthPx || 180) === preset.px
                                    ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {preset.label} ({preset.px}px)
                              </button>
                            ))}
                          </div>

                          {/* Proportion Preview Box */}
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-4">
                            <span className="text-xs font-medium text-slate-500">Letterhead Proportion Preview:</span>
                            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 h-14 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs min-w-[200px]">
                              {profile.logoDataUrl ? (
                                <img
                                  src={profile.logoDataUrl}
                                  alt="Preview"
                                  style={{ width: `${(profile.logoWidthPx || 180) * 0.45}px` }}
                                  className="object-contain max-h-10"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div
                                  style={{ width: `${(profile.logoWidthPx || 180) * 0.45}px` }}
                                  className="h-8 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-[10px] font-bold text-blue-900"
                                >
                                  GFP Crest
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Color Theme Options */}
                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                            Document Theme Palette (Big-3 Professional)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              {
                                id: 'royal_navy',
                                name: 'Royal Navy Blue',
                                sub: 'McKinsey / BCG Navy',
                                primary: '#1e3a8a',
                                accent: '#3b82f6',
                              },
                              {
                                id: 'sapphire',
                                name: 'Sapphire & Light Blue',
                                sub: 'Modern Executive Blue',
                                primary: '#1d4ed8',
                                accent: '#60a5fa',
                              },
                              {
                                id: 'slate_navy',
                                name: 'Deep Slate Navy',
                                sub: 'Corporate Clean',
                                primary: '#0f172a',
                                accent: '#0284c7',
                              },
                              {
                                id: 'oxford',
                                name: 'Oxford Blue',
                                sub: 'High-contrast Advisory',
                                primary: '#172554',
                                accent: '#38bdf8',
                              },
                            ].map((thm) => {
                              const isSelected = profile.themeSettings?.colorTheme === thm.id;
                              return (
                                <button
                                  key={thm.id}
                                  type="button"
                                  onClick={() => handleUpdateTheme('colorTheme', thm.id)}
                                  className={`p-3 rounded-xl border text-left transition relative ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500'
                                      : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className="w-4 h-4 rounded-full shadow-2xs border border-white"
                                        style={{ backgroundColor: thm.primary }}
                                      />
                                      <div
                                        className="w-4 h-4 rounded-full shadow-2xs border border-white"
                                        style={{ backgroundColor: thm.accent }}
                                      />
                                    </div>
                                    {isSelected && (
                                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-bold text-slate-900">{thm.name}</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">{thm.sub}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Typography Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Document Font Family
                            </label>
                            <select
                              value={profile.themeSettings?.fontFamily || 'sans'}
                              onChange={(e) => handleUpdateTheme('fontFamily', e.target.value)}
                              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                            >
                              <option value="sans">Modern Corporate Sans (Calibri / Segoe UI Clean)</option>
                              <option value="serif">Executive Advisory Serif (Cambria / Georgia)</option>
                              <option value="garamond">Classic Professional (EB Garamond / Times)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Letterhead Header Style
                            </label>
                            <select
                              value={profile.themeSettings?.letterheadStyle || 'two_column'}
                              onChange={(e) => handleUpdateTheme('letterheadStyle', e.target.value)}
                              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                            >
                              <option value="two_column">Two-Column Executive Split (Clean Border Accent)</option>
                              <option value="band">Royal Navy Top Accent Band</option>
                              <option value="classic">Classic Monogram & Locations</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

          {/* TAB 2: SIGNATORIES & AUTHORISED PERSONS */}
          {activeTab === 'signatories' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Authorised Signatories Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add partners, directors, or authorized signatories. Select who signs each engagement letter.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B2545] hover:bg-[#133863] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Signatory</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {(profile.signatories || []).map((sig, index) => (
                  <div
                    key={sig.id || index}
                    className={`p-4 rounded-xl border transition ${
                      sig.isDefault ? 'border-blue-300 bg-blue-50/40 shadow-2xs' : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-blue-900 bg-blue-100/80 border border-blue-200 px-2.5 py-0.5 rounded-md">
                          #{index + 1}
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={!!sig.isDefault}
                            onChange={(e) => handleUpdateSignatory(sig.id, { isDefault: e.target.checked })}
                            className="rounded text-blue-700 focus:ring-blue-600"
                          />
                          <span>Default for New Engagements</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSignatory(sig.id)}
                        disabled={(profile.signatories || []).length <= 1}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
                          (profile.signatories || []).length <= 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Delete signatory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Full Legal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={sig.name}
                          onChange={(e) => handleUpdateSignatory(sig.id, { name: e.target.value })}
                          placeholder="e.g. CA Yogesh Kulkarni"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={sig.designation}
                          onChange={(e) => handleUpdateSignatory(sig.id, { designation: e.target.value })}
                          placeholder="e.g. Director / Authorised Signatory"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>Signatory Official Email</span>
                        </label>
                        <input
                          type="email"
                          value={sig.email || ''}
                          onChange={(e) => handleUpdateSignatory(sig.id, { email: e.target.value })}
                          placeholder="e.g. yogesh@gfpconsulting.in"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Signatory Phone / Mobile</span>
                        </label>
                        <input
                          type="text"
                          value={sig.phone || ''}
                          onChange={(e) => handleUpdateSignatory(sig.id, { phone: e.target.value })}
                          placeholder="e.g. +91 93708 88819"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:ring-1 focus:ring-blue-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FIRM & TAX */}
          {activeTab === 'firm' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Firm Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.firmName}
                  onChange={(e) => setProfile({ ...profile, firmName: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered State (for GST calculation)
                  </label>
                  <select
                    value={profile.registeredState}
                    onChange={(e) => setProfile({ ...profile, registeredState: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Office Locations Line (Letterhead)
                </label>
                <input
                  type="text"
                  value={profile.officeLocations}
                  onChange={(e) => setProfile({ ...profile, officeLocations: e.target.value })}
                  placeholder="Mumbai | Pune | Kolhapur | Belgaum | Mapusa"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company CIN</label>
                  <input
                    type="text"
                    value={profile.cin || ''}
                    onChange={(e) => setProfile({ ...profile, cin: e.target.value.toUpperCase() })}
                    placeholder="U74140MH2015PTC268912"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Firm GSTIN</label>
                  <input
                    type="text"
                    value={profile.gstin}
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AABCG1234F1Z5"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Firm PAN</label>
                  <input
                    type="text"
                    value={profile.pan}
                    onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                    placeholder="AABCG1234F"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SAC Code (Advisory)
                  </label>
                  <input
                    type="text"
                    value={profile.sacCode}
                    onChange={(e) => setProfile({ ...profile, sacCode: e.target.value })}
                    placeholder="998311"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">General Firm Email</label>
                  <input
                    type="email"
                    value={profile.firmEmail || ''}
                    onChange={(e) => setProfile({ ...profile, firmEmail: e.target.value })}
                    placeholder="info@gfpconsulting.in"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Firm Website</label>
                  <input
                    type="text"
                    value={profile.firmWebsite || ''}
                    onChange={(e) => setProfile({ ...profile, firmWebsite: e.target.value })}
                    placeholder="www.gfpconsulting.in"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANKING & CONTACTS */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.bankDetails.accountHolderName}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bankDetails: { ...profile.bankDetails, accountHolderName: e.target.value },
                    })
                  }
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Name & Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.bankDetails.bankNameBranch}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bankDetails: { ...profile.bankDetails, bankNameBranch: e.target.value },
                    })
                  }
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.bankDetails.accountNumber}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        bankDetails: { ...profile.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.bankDetails.ifscCode}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        bankDetails: { ...profile.bankDetails, ifscCode: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID for Payment</label>
                <input
                  type="text"
                  value={profile.bankDetails.upiId}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bankDetails: { ...profile.bankDetails, upiId: e.target.value },
                    })
                  }
                  placeholder="e.g. boim-102988190340@boi"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 font-bold focus:ring-1 focus:ring-blue-800 bg-white"
                />
              </div>

              {/* Payment QR Code Photo Upload */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#0B2545]" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Payment QR Code Photo</h4>
                      <p className="text-[11px] text-slate-500">
                        Upload custom QR image to embed in Pro-Forma Invoices & Engagement Letters
                      </p>
                    </div>
                  </div>
                  {(profile.qrCodeDataUrl || profile.bankDetails.qrCodeDataUrl) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md">
                      Custom QR Active
                    </span>
                  )}
                </div>

                {profile.qrCodeDataUrl || profile.bankDetails.qrCodeDataUrl ? (
                  <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl">
                    <img
                      src={profile.qrCodeDataUrl || profile.bankDetails.qrCodeDataUrl}
                      alt="Uploaded Payment QR"
                      className="w-20 h-20 object-contain border border-slate-200 p-1 bg-slate-50 rounded-lg"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-800">Custom Payment QR Image</p>
                      <p className="text-[11px] text-slate-500">
                        This image will be rendered on the invoice and Word exports.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition shadow-2xs">
                          <Upload className="w-3 h-3 text-slate-500" />
                          <span>Replace Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveQr}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-blue-600 bg-white hover:bg-blue-50/20 rounded-xl cursor-pointer transition">
                    <QrCode className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">
                      Click to upload QR Code photo
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Supports PNG, JPG, WEBP (Max 3MB). If blank, auto-generates UPI QR from your UPI ID.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Contact Persons (Section 10 of Engagement Letter)
                </label>
                <div className="space-y-3">
                  {profile.contactPersons.map((contact, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => {
                            const updated = [...profile.contactPersons];
                            updated[idx].name = e.target.value;
                            setProfile({ ...profile, contactPersons: updated });
                          }}
                          className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phone</label>
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) => {
                            const updated = [...profile.contactPersons];
                            updated[idx].phone = e.target.value;
                            setProfile({ ...profile, contactPersons: updated });
                          }}
                          className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={contact.email || ''}
                          onChange={(e) => {
                            const updated = [...profile.contactPersons];
                            updated[idx].email = e.target.value;
                            setProfile({ ...profile, contactPersons: updated });
                          }}
                          className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-blue-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FEATURE & BUTTON ENCYCLOPEDIA (PLAIN WORDS WITH EXAMPLES) */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-[#0B2545] to-[#173F6E] text-white rounded-xl space-y-1 shadow-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-300" />
                  <h3 className="text-sm font-bold tracking-tight">GFP System Button & Feature Encyclopedia</h3>
                </div>
                <p className="text-xs text-blue-100">
                  Every button, slider, and functionality explained in plain, simple language with real-life chartered advisory examples.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={guideSearchQuery}
                    onChange={(e) => setGuideSearchQuery(e.target.value)}
                    placeholder="Search any button, setting, or term (e.g. Advance, GST, Logo, Kanban, Commission, Breakup)..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  />
                  {guideSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGuideSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All Topics' },
                    { id: 'el', label: 'Engagement Letter' },
                    { id: 'financials', label: 'Advance & GST' },
                    { id: 'kanban', label: 'CRM & Kanban' },
                    { id: 'commission', label: 'Commission Tracker' },
                    { id: 'firm', label: 'Logo & Settings' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setGuideCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        guideCategory === cat.id
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guide Encyclopedia Cards List */}
              <div className="space-y-3.5">
                {[
                  {
                    category: 'financials',
                    categoryName: 'Advance & GST Commercials',
                    buttonName: 'Collect Full Payment at Project End',
                    location: 'Engagement Editor -> Step 4: Fees & Payment Terms',
                    whatItDoes:
                      'Waives the initial mobilization advance payment so the client pays ₹0 upfront. The entire 100% professional fee plus statutory GST is collected only when the final report or deliverable is handed over.',
                    example:
                      'Example: For a ₹1,00,000 MSME subsidy report, instead of asking ₹50,000 advance today, you check this box. The engagement letter and milestone schedule will show ₹0 Advance due on signing, and the full ₹1,00,000 + 18% GST (₹1,18,000) due on final report handover.',
                    tips: 'Useful for institutional clients, government tender projects, or trusted long-term corporate clients who only release payment on delivery.',
                  },
                  {
                    category: 'financials',
                    categoryName: 'Advance & GST Commercials',
                    buttonName: 'Exempt Advance from GST (0% on Advance)',
                    location: 'Engagement Editor -> Step 4: Fees & Payment Terms',
                    whatItDoes:
                      'Charges 0% GST on the mobilization advance proforma invoice, postponing the full 18% statutory GST charge to be settled with the balance payment upon project completion.',
                    example:
                      'Example: Advisory fee is ₹1,00,000 with 50% advance (₹50,000). With this enabled, your Advance Proforma Invoice asks for flat ₹50,000 with 0% GST. Later, when issuing the final tax invoice, the full ₹18,000 GST (18% of ₹1,00,000) is billed alongside the remaining ₹50,000 balance (Total ₹68,000).',
                    tips: 'Essential when clients have internal finance policies refusing to pay GST on non-delivered advance stages, or when billing under special commercial terms.',
                  },
                  {
                    category: 'el',
                    categoryName: 'Engagement Letter & Pricing',
                    buttonName: 'Itemized Price Breakdown & Deliverable Costing',
                    location: 'Templates Manager -> Pricing Tab & Engagement Editor',
                    whatItDoes:
                      'Allows you to split a total lump-sum service fee into clear, individual line items (phases, diagnostic components, sovereign filings) with specific rupee amounts.',
                    example:
                      'Example: Instead of just "Industrial Advisory: ₹1,50,000", you add 3 breakdown rows: 1) Phase 1: Site Inspection & Verification (₹30,000), 2) Phase 2: Financial Modeling & DPR (₹70,000), 3) Phase 3: Directorate Filing (₹50,000). In the Engagement Letter, these appear as clean indented sub-rows directly under the service title.',
                    tips: 'Click "Sync Fee to Sum of Breakup" to automatically set the main advisory fee to match the total of all your breakdown items.',
                  },
                  {
                    category: 'kanban',
                    categoryName: 'CRM & Pipeline Kanban',
                    buttonName: 'Back: {Previous Stage} (Push Activity Back)',
                    location: 'Marketing CRM -> Pipeline Kanban View (on every deal card)',
                    whatItDoes:
                      'Reverses a deal or activity back to the preceding pipeline stage in 1 click if a client needs revisions, delays data submission, or if a step was advanced prematurely.',
                    example:
                      'Example: If a client deal is in "Execution & Modeling" but their accounts team informs you they sent incomplete audited balance sheets, click "← Back: Data Collection". The card instantly moves back to the data collection column and logs the rollback in the deal timeline.',
                    tips: 'You can also use the inline "Stage" dropdown on any card to jump backward directly to any specific stage.',
                  },
                  {
                    category: 'kanban',
                    categoryName: 'CRM & Pipeline Kanban',
                    buttonName: 'Customize Kanban Columns & Colors',
                    location: 'Marketing CRM -> Pipeline Kanban View (top right button)',
                    whatItDoes:
                      'Lets you add custom columns to your Kanban board, name them whatever fits your firm workflow, assign which statuses appear in them, and choose distinct color accents (Navy, Indigo, Amber, Emerald, Purple, Rose, Slate).',
                    example:
                      'Example: You want a dedicated column called "Urgent Sovereign Submissions" colored Crimson Rose. You click "Customize Columns", add a column, select the Rose theme, and assign "Execution & Modeling" to it.',
                    tips: 'Your custom columns and color choices are automatically saved and remembered across sessions.',
                  },
                  {
                    category: 'commission',
                    categoryName: 'Commission & Referral Tracker',
                    buttonName: 'Manage Partners / Beneficiaries',
                    location: 'Commissions Tab -> "Manage Partners" Button',
                    whatItDoes:
                      'Opens the partner management register where you can add multiple associate partners, chartered accountants, advocates, or business introducers with their phone, PAN, bank account number, IFSC code, and default commission percentage.',
                    example:
                      'Example: Add "Adv. Rohit Sharma" (Legal Associate, 15% rate, ICICI Bank A/C) and "CA Sneha Deshmukh" (10% rate, SBI A/C). When logging client deals, assign them to either partner.',
                    tips: 'Use the Partner Filter dropdown to view deals belonging solely to one person, or view the consolidated register.',
                  },
                  {
                    category: 'commission',
                    categoryName: 'Commission & Referral Tracker',
                    buttonName: 'Download Well-Formatted Excel Report',
                    location: 'Commissions Tab -> "Export Master Excel" & "Download Partner Report"',
                    whatItDoes:
                      'Generates an executive, styled Microsoft Excel spreadsheet (.xlsx) with professional blue headers, bold currency formatting, calculated GST, bank coordinates, and dedicated worksheet tabs for each individual partner.',
                    example:
                      'Example: Click "Download Partner Report" while filtering for Dr. Ajay. You get a clean Excel sheet containing only Dr. Ajay’s assignments, his bank account & UPI details on top, total taxable fee received, and exact commission payable of ₹10,000 ready for bank payout.',
                    tips: 'Ready to email directly to associates as formal monthly commission settlement statements.',
                  },
                  {
                    category: 'firm',
                    categoryName: 'Firm Branding & Layout',
                    buttonName: 'Logo Size Slider (Width in Pixels)',
                    location: 'Settings -> Theme & Logo Layout',
                    whatItDoes:
                      'Controls the exact display width of your firm logo from 100px up to 360px. Whatever size you set remains locked and constant across both Engagement Letters and Proforma Invoices.',
                    example:
                      'Example: If your firm logo has detailed sub-text like "Chartered Accountants & Strategic Advisors", drag the slider to 220px or 260px so it is crisp and bold. It will appear at that exact width on all printed PDFs.',
                    tips: 'Preset buttons (140px Compact, 180px Standard, 240px Prominent, 300px Banner) let you snap to recommended sizes in 1 click.',
                  },
                  {
                    category: 'el',
                    categoryName: 'Engagement Letter & Terms',
                    buttonName: 'Specific Conditions Checklist',
                    location: 'Engagement Editor -> Step 3: Specific Conditions',
                    whatItDoes:
                      'Ensures service-specific terms (such as sovereign discretion disclaimers, client milestone enablers, and executive discussion schedules) are cleanly included in the letter without generic placeholder text.',
                    example:
                      'Example: For PSI Subsidy filings, check the condition "Subsidies are subject to state sovereign discretion and budgetary appropriations". This clause is rendered in bold bullet format right in the Scope & Conditions section of the EL.',
                    tips: 'You can type any custom condition clause into the text box and press "+ Add Condition" to insert project-specific terms.',
                  },
                ]
                  .filter((item) => {
                    const matchesCategory = guideCategory === 'all' || item.category === guideCategory;
                    const matchesSearch =
                      !guideSearchQuery.trim() ||
                      item.buttonName.toLowerCase().includes(guideSearchQuery.toLowerCase()) ||
                      item.whatItDoes.toLowerCase().includes(guideSearchQuery.toLowerCase()) ||
                      item.example.toLowerCase().includes(guideSearchQuery.toLowerCase()) ||
                      item.categoryName.toLowerCase().includes(guideSearchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  })
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs space-y-2.5 hover:border-blue-300 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.buttonName}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-md">
                            {item.categoryName}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{item.location}</span>
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed">
                        <strong className="text-slate-900">What It Does: </strong>
                        {item.whatItDoes}
                      </div>

                      <div className="text-xs bg-slate-50 p-3 border border-slate-200/80 rounded-lg text-slate-800 leading-relaxed font-sans">
                        <strong className="text-[#0B2545] font-semibold block mb-0.5">Real-Life Example:</strong>
                        {item.example}
                      </div>

                      {item.tips && (
                        <div className="text-[11px] text-amber-800 flex items-start gap-1.5 pt-0.5">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Chartered Tip:</strong> {item.tips}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

                    {/* TAB: LOGIN SCREEN WALLPAPER */}
                    {activeTab === 'login_wallpaper' && (
                      <LoginWallpaperSettingsTab
                        currentWallpaperUrl={profile.loginBackgroundUrl || DEFAULT_WALLPAPER}
                        currentWallpaperType={profile.loginBackgroundType || 'preset'}
                        onSelectWallpaper={(url, type) => {
                          setProfile((prev) => ({
                            ...prev,
                            loginBackgroundUrl: url,
                            loginBackgroundType: type,
                          }));
                        }}
                        onResetToDefault={() => {
                          setProfile((prev) => ({
                            ...prev,
                            loginBackgroundUrl: DEFAULT_WALLPAPER,
                            loginBackgroundType: 'preset',
                          }));
                        }}
                      />
                    )}

                    {/* TAB: FIREBASE TELEMETRY */}
                    {activeTab === 'firebase_telemetry' && (
                      <FirebaseTelemetryTab />
                    )}
                  </div>

                  {/* macOS Window Bottom Action Bar */}
                  <div className="px-6 py-3 bg-[#F9F9FB] border-t border-[#E5E5EA] flex items-center justify-between gap-3 shrink-0">
                    <div className="text-[11px] text-slate-500 hidden sm:block">
                      <span>Firm changes sync automatically across all letterhead exports.</span>
                    </div>
                    <div className="flex items-center gap-2.5 ml-auto">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 border border-[#D2D2D7] rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-1.5 bg-[#0B2545] hover:bg-[#133863] active:bg-[#0B2545] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
