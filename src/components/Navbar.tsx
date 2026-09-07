import React from 'react';
import {
  FileText,
  Layers,
  Settings,
  Plus,
  Briefcase,
  Building,
  Search,
  X,
  TrendingUp,
  Trash2,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { FirmProfile } from '../types';

interface NavbarProps {
  currentView: 'dashboard' | 'editor' | 'templates' | 'crm' | 'commission';
  onNavigate: (view: 'dashboard' | 'editor' | 'templates' | 'crm' | 'commission') => void;
  onOpenSettings: () => void;
  onNewEngagement: () => void;
  onOpenSpotlight: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onOpenTaxonomy?: () => void;
  firmProfile: FirmProfile;
  crmCount?: number;
  globalSearch?: string;
  onGlobalSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onNewEngagement,
  onOpenSpotlight,
  onOpenTrash,
  trashCount = 0,
  onOpenTaxonomy,
  firmProfile,
  crmCount = 0,
  globalSearch,
  onGlobalSearchChange,
}) => {
  const signatoryName = firmProfile.signatoryName || 'CA Yogesh Kulkarni';
  const initials = signatoryName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'YK';

  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200 sticky top-0 z-40 print:hidden font-sans w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 h-14 flex items-center justify-between gap-2 w-full min-w-0">
        {/* Left: Brand / Firm Identity */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0 btn-interactive"
        >
          {firmProfile.logoDataUrl ? (
            <img
              src={firmProfile.logoDataUrl}
              alt={firmProfile.firmName}
              className="h-8 w-auto max-w-[120px] object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-none bg-indigo-950 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs transition-transform group-hover:scale-105">
              GFP
            </div>
          )}
          <div className="leading-tight hidden sm:block">
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-slate-900 block group-hover:text-[#0B2545] transition-colors truncate max-w-[160px]">
              {firmProfile.firmName || 'GFP Advisory'}
            </span>
            <span className="text-[9.5px] text-slate-500 font-medium hidden md:block">
              Advisory CRM & ERP
            </span>
          </div>
        </div>

        {/* Center: Spotlight Search (Adaptive: full on large screens, compact trigger on smaller) */}
        <div className="flex-1 max-w-xs xl:max-w-sm mx-1 min-w-0">
          {/* Full Search Bar on >= xl */}
          <div
            onClick={onOpenSpotlight}
            className="hidden xl:block relative w-full cursor-pointer group"
            title="Click or press ⌘K to open Spotlight Search"
          >
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B2545] transition-colors" />
            </div>
            <input
              id="navbar-spotlight-input"
              type="text"
              readOnly={false}
              value={globalSearch || ''}
              onFocus={(e) => {
                e.target.blur();
                onOpenSpotlight();
              }}
              onClick={() => onOpenSpotlight()}
              onChange={(e) => {
                onGlobalSearchChange?.(e.target.value);
                onOpenSpotlight();
              }}
              placeholder="Search clients, ref, invoice... (⌘K)"
              className="w-full pl-8 pr-12 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#0B2545] rounded-none text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs cursor-pointer focus:outline-none"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1 pointer-events-none">
              <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white border border-slate-200 text-slate-500 shadow-2xs font-semibold">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Compact Spotlight Button on < xl */}
          <button
            type="button"
            onClick={onOpenSpotlight}
            className="xl:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-none text-xs w-full max-w-[170px]"
            title="Search clients, ref, invoice... (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-[11px] text-slate-500">Search...</span>
            <kbd className="ml-auto px-1 py-0.2 text-[9px] font-mono bg-white border border-slate-200 text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Navigation Links & Actions (Uniform color scheme & styling) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
          {/* Engagements Dashboard */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-semibold btn-interactive transition-colors ${
              currentView === 'dashboard'
                ? 'bg-[#0B2545] text-white border border-[#0B2545] shadow-xs'
                : 'text-slate-700 hover:text-[#0B2545] hover:bg-slate-100 border border-transparent hover:border-slate-200'
            }`}
            title="Charter Engagements Dashboard"
          >
            <Briefcase className={`w-3.5 h-3.5 ${currentView === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-[#0B2545]'}`} />
            <span className="hidden sm:inline">Engagements</span>
          </button>

          {/* Marketing CRM / ERP Navigation */}
          <button
            onClick={() => onNavigate('crm')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-semibold btn-interactive transition-colors ${
              currentView === 'crm'
                ? 'bg-[#0B2545] text-white border border-[#0B2545] shadow-xs'
                : 'text-slate-700 hover:text-[#0B2545] hover:bg-slate-100 border border-transparent hover:border-slate-200'
            }`}
            title="Marketing CRM & Pipeline ERP"
          >
            <TrendingUp className={`w-3.5 h-3.5 ${currentView === 'crm' ? 'text-white' : 'text-slate-500 group-hover:text-[#0B2545]'}`} />
            <span>CRM</span>
            {crmCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[9.5px] font-bold font-mono ${
                currentView === 'crm' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {crmCount}
              </span>
            )}
          </button>

          {/* Commission Tracker */}
          <button
            onClick={() => onNavigate('commission')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-semibold btn-interactive transition-colors ${
              currentView === 'commission'
                ? 'bg-[#0B2545] text-white border border-[#0B2545] shadow-xs'
                : 'text-slate-700 hover:text-[#0B2545] hover:bg-slate-100 border border-transparent hover:border-slate-200'
            }`}
            title="Commission Tracker & Multi-Beneficiary Settlement Register"
          >
            <DollarSign className={`w-3.5 h-3.5 ${currentView === 'commission' ? 'text-white' : 'text-slate-500 group-hover:text-[#0B2545]'}`} />
            <span>Commissions</span>
          </button>

          {/* Service Master Templates */}
          <button
            onClick={() => onNavigate('templates')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-semibold btn-interactive transition-colors ${
              currentView === 'templates'
                ? 'bg-[#0B2545] text-white border border-[#0B2545] shadow-xs'
                : 'text-slate-700 hover:text-[#0B2545] hover:bg-slate-100 border border-transparent hover:border-slate-200'
            }`}
            title="Service Master Templates"
          >
            <Layers className={`w-3.5 h-3.5 ${currentView === 'templates' ? 'text-white' : 'text-slate-500 group-hover:text-[#0B2545]'}`} />
            <span className="hidden md:inline">Templates</span>
          </button>

          {/* Customize Taxonomy / Lists */}
          {onOpenTaxonomy && (
            <button
              onClick={onOpenTaxonomy}
              className="flex items-center gap-1 px-2 py-1.5 rounded-none text-xs font-semibold text-slate-700 hover:text-[#0B2545] hover:bg-slate-100 border border-transparent hover:border-slate-200 btn-interactive transition-colors"
              title="Customize CRM Lists, Lead Statuses & Taxonomies"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Lists</span>
            </button>
          )}

          {/* Dustbin / Recycle Bin */}
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="flex items-center gap-1 px-2 py-1.5 rounded-none text-xs font-semibold text-slate-700 hover:text-[#0B2545] hover:bg-slate-100 border border-transparent hover:border-slate-200 btn-interactive transition-colors relative"
              title="Dustbin / Recycle Bin (View deleted records accurate to milliseconds)"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">Dustbin</span>
              {trashCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono bg-slate-200 text-slate-700 border border-slate-300">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          {/* Firm Settings (Guides live inside Settings only) */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2 py-1.5 rounded-none text-xs font-semibold text-slate-700 hover:text-[#0B2545] hover:bg-slate-100 border border-transparent hover:border-slate-200 btn-interactive transition-colors"
            title="Firm & Letterhead Settings (including Button & Feature Guide)"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Create New Engagement Primary Action */}
          <button
            onClick={onNewEngagement}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] hover:bg-[#133863] active:bg-[#0B2545] text-white rounded-none text-xs font-semibold shadow-xs btn-interactive transition-colors border border-[#0B2545] whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">New</span> Engagement
          </button>

          {/* User Signatory Avatar */}
          <div
            onClick={onOpenSettings}
            className="cursor-pointer hidden xl:flex items-center gap-2 pl-1 text-slate-700 hover:text-[#0B2545] transition-colors btn-interactive"
            title={`Active Signatory: ${signatoryName}`}
          >
            <div className="w-7 h-7 rounded-none bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-800 text-[10.5px] transition-colors">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
