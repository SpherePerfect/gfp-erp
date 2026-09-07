import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Layers,
  Plus,
  Search,
  Settings,
  Sliders,
  Trash2,
  ShieldCheck,
  ChevronDown,
  User,
  LogOut,
  LogIn,
  Eye,
  Check,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { FirmProfile, AppUser, UserRole } from '../types';

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
  // Auth & Admin additions
  currentUser: AppUser | null;
  onOpenAdminUserManagement: () => void;
  onSimulateRoleChange?: (role: UserRole) => void;
  simulatedRole?: UserRole;
  onSignIn?: () => void;
  onSignOut?: () => void;
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
  currentUser,
  onOpenAdminUserManagement,
  onSimulateRoleChange,
  simulatedRole,
  onSignIn,
  onSignOut,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeRole = simulatedRole || currentUser?.role || 'Admin';
  const isAdmin = activeRole === 'Admin';

  const userDisplayName = currentUser?.displayName || firmProfile.signatoryName || 'CA Yogesh Kulkarni';
  const initials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'AD';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden font-sans w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* =========================================================================
            LEFT CLUSTER: Brand Identity & Real-Time Sync Indicator
           ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="GFP Advisory & Consulting"
          >
            {firmProfile.logoDataUrl ? (
              <img
                src={firmProfile.logoDataUrl}
                alt={firmProfile.firmName}
                className="h-8 w-auto max-w-[110px] object-contain transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs transition-transform group-hover:scale-105">
                GFP
              </div>
            )}
            <div className="leading-tight hidden sm:block">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 block group-hover:text-[#0B2545] transition-colors truncate max-w-[150px]">
                {firmProfile.firmName || 'GFP Advisory'}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium">Advisory Suite</span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          {/* Real-time sync status indicator */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-medium"
            title="Real-Time Firestore Sync Active — changes sync instantly across all active screens"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Live Cloud</span>
          </div>
        </div>

        {/* =========================================================================
            CENTER CLUSTER: Logical Segmented Primary Navigation & Spotlight Search
           ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center max-w-2xl min-w-0">
          {/* Main Segmented Navigation Bar */}
          <nav className="flex items-center bg-slate-100/90 p-1 border border-slate-200 text-xs font-semibold">
            {/* 1. Engagements */}
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Engagement Proposals & Invoices"
            >
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Engagements</span>
            </button>

            {/* 2. Marketing CRM */}
            <button
              type="button"
              onClick={() => onNavigate('crm')}
              className={`flex items-center gap-1.5 px-2.5 py-1 transition-all ${
                currentView === 'crm'
                  ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Marketing CRM & Pipeline ERP"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>CRM</span>
              {crmCount > 0 && (
                <span
                  className={`px-1 py-0.2 text-[9px] font-bold font-mono ${
                    currentView === 'crm' ? 'bg-[#0B2545] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {crmCount}
                </span>
              )}
            </button>

            {/* 3. Partner Commissions */}
            <button
              type="button"
              onClick={() => onNavigate('commission')}
              className={`flex items-center gap-1.5 px-2.5 py-1 transition-all ${
                currentView === 'commission'
                  ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Partner Referral Commission Tracker"
            >
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Commissions</span>
            </button>

            {/* 4. Templates */}
            <button
              type="button"
              onClick={() => onNavigate('templates')}
              className={`flex items-center gap-1.5 px-2.5 py-1 transition-all ${
                currentView === 'templates'
                  ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Service Master Scope Templates"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">Templates</span>
            </button>
          </nav>

          {/* Spotlight Search Shortcut Button */}
          <button
            type="button"
            onClick={onOpenSpotlight}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs transition-colors shrink-0"
            title="Spotlight Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500 hidden xl:inline">Search...</span>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white border border-slate-200 text-slate-500 font-bold shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* =========================================================================
            RIGHT CLUSTER: Primary Action, Secondary Tools Menu & Account Profile
           ========================================================================= */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Cloud Multi-Session Sync Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[10px] font-medium tracking-tight rounded-xs select-none"
            title="Real-time multi-browser synchronization active. All additions, edits, and deletions sync instantly across all devices."
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
            </span>
            <span className="font-semibold">Live Synced</span>
          </div>

          {/* Primary CTA: New Engagement */}
          <button
            type="button"
            onClick={onNewEngagement}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] hover:bg-[#133863] text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
            title="Create New Charter Engagement"
          >
            <Plus className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="hidden md:inline">New</span> Engagement
          </button>

          {/* Secondary Tools & Settings Dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => setIsToolsOpen((prev) => !prev)}
              className={`p-1.5 border transition-colors flex items-center gap-1 text-xs font-semibold ${
                isToolsOpen
                  ? 'bg-slate-200 border-slate-300 text-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="System Tools: Lists, Dustbin, and Firm Settings"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Firm & System Tools
                </div>

                {/* Firm & Letterhead Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#0B2545] text-left transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <div className="flex-1">
                    <div className="font-semibold">Firm Settings</div>
                    <div className="text-[10px] text-slate-400">Letterhead, logo, tax & banking</div>
                  </div>
                </button>

                {/* Custom Lists & Taxonomies */}
                {onOpenTaxonomy && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenTaxonomy();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#0B2545] text-left transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Custom Taxonomies</div>
                      <div className="text-[10px] text-slate-400">Lead stages, statuses & categories</div>
                    </div>
                  </button>
                )}

                {/* Dustbin / Recycle Bin */}
                {onOpenTrash && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenTrash();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#0B2545] text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Recycle Dustbin</div>
                        <div className="text-[10px] text-slate-400">Restore deleted records</div>
                      </div>
                      {trashCount > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          {trashCount}
                        </span>
                      )}
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Account & Role Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={`flex items-center gap-2 pl-1.5 pr-2 py-1 border transition-colors ${
                isUserMenuOpen
                  ? 'bg-slate-100 border-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title={`Logged in as ${userDisplayName} (${activeRole})`}
            >
              {currentUser?.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={userDisplayName}
                  className="w-6 h-6 object-cover border border-slate-300 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 bg-[#0B2545] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {initials}
                </div>
              )}

              <div className="text-left hidden lg:block leading-none">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[110px]">
                  {userDisplayName.split(' ')[0]}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    isAdmin ? 'text-indigo-700' : 'text-slate-500'
                  }`}
                >
                  {activeRole}
                </span>
              </div>

              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* User Summary Card */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-3">
                    {currentUser?.photoUrl ? (
                      <img
                        src={currentUser.photoUrl}
                        alt={userDisplayName}
                        className="w-10 h-10 object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#0B2545] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs truncate">{userDisplayName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'admin@gfpadvisory.in'}</div>
                      <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
                        {currentUser?.jobTitle || 'Managing Partner & Practice Head'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        isAdmin
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-indigo-700" />
                      Role: {activeRole}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Admin Management Dashboard Link (Strictly available or prominent for Admin) */}
                <div className="py-1 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAdminUserManagement();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#0B2545] text-left transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>Admin User Management</span>
                        <span className="px-1 py-0.2 text-[8.5px] font-bold bg-amber-100 text-amber-900 uppercase">
                          Admin
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Create accounts, customize job titles, assign roles
                      </div>
                    </div>
                  </button>
                </div>

                {/* Role Preview Simulator: Test column-level access control live! */}
                {onSimulateRoleChange && (
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-700 mb-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Role View Simulator (Test UI Restrictions)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => onSimulateRoleChange('Admin')}
                        className={`px-2 py-1 text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                          activeRole === 'Admin'
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {activeRole === 'Admin' && <Check className="w-2.5 h-2.5" />}
                        Admin (Full)
                      </button>
                      <button
                        type="button"
                        onClick={() => onSimulateRoleChange('Associate')}
                        className={`px-2 py-1 text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                          activeRole === 'Associate'
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {activeRole === 'Associate' && <Check className="w-2.5 h-2.5" />}
                        Associate (🚫 Restricted)
                      </button>
                    </div>
                    <p className="text-[9.5px] text-slate-400 mt-1">
                      Switching to Associate masks sensitive commercial & private note columns with 🚫 Restricted.
                    </p>
                  </div>
                )}

                {/* Sign In / Sign Out */}
                <div className="pt-1">
                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut?.();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Switch Account</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignIn?.();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 font-semibold text-left transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign in with Google / Firebase</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
