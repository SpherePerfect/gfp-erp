import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  FileText,
  Receipt,
  Archive,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  Send,
  Building,
  Briefcase,
  Layers,
  Check,
  TrendingUp,
  DollarSign,
  Shield,
  User,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { EngagementRecord, EngagementStatus, FirmProfile, UserRole, AppUser } from '../types';
import { formatIndianCurrency } from '../utils/numberToIndianWords';
import { downloadEngagementLetter, downloadProFormaInvoice } from '../utils/docxExport';
import { downloadBothDocxZip } from '../utils/zipExport';
import { KpiCard } from './KpiCard';
import { RestrictedCell } from './RestrictedCell';
import { canSee } from '../utils/permissions';

interface DashboardProps {
  engagements: EngagementRecord[];
  firmProfile: FirmProfile;
  onNewEngagement: () => void;
  onEditEngagement: (record: EngagementRecord) => void;
  onDuplicateEngagement: (record: EngagementRecord) => void;
  onDeleteEngagement: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: EngagementStatus) => void;
  onOpenTemplateManager: () => void;
  onOpenFirmSettings: () => void;
  onNavigateToCrm?: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (q: string) => void;
  userRole?: UserRole;
  currentUser?: AppUser | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  engagements = [],
  firmProfile,
  onNewEngagement,
  onEditEngagement,
  onDuplicateEngagement,
  onDeleteEngagement,
  onUpdateStatus,
  onOpenTemplateManager,
  onOpenFirmSettings,
  onNavigateToCrm,
  globalSearchQuery = '',
  onGlobalSearchChange,
  userRole = 'Admin',
  currentUser,
}) => {
  const safeEngagements = useMemo(
    () => (Array.isArray(engagements) ? engagements : []),
    [engagements]
  );
  const isAdmin = userRole === 'Admin';
  const canSeeCommercials = canSee(currentUser, 'commercial_values', userRole);
  const canSeeRevenue = canSee(currentUser, 'kpi_revenue', userRole);
  const canDeleteRecords = canSee(currentUser, 'action_delete', userRole);
  const canExportRecords = canSee(currentUser, 'action_export', userRole);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [issuerFilter, setIssuerFilter] = useState<'all' | 'firm' | 'personal'>('all');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<EngagementRecord | null>(null);

  const activeSearch = globalSearchQuery.trim() ? globalSearchQuery : localSearchQuery;

  const filteredEngagements = useMemo(() => {
    return safeEngagements.filter((e) => {
      const query = activeSearch.toLowerCase().trim();
      const matchesQuery =
        !query ||
        e.client.addresseeName.toLowerCase().includes(query) ||
        (e.client.companyName && e.client.companyName.toLowerCase().includes(query)) ||
        e.refNo.toLowerCase().includes(query) ||
        e.invoiceNo.toLowerCase().includes(query) ||
        e.service.serviceTitle.toLowerCase().includes(query) ||
        (e.client.state && e.client.state.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

      const isPersonal = e.invoiceIssuerType === 'personal' || e.isNonGstInvoice === true;
      const matchesIssuer =
        issuerFilter === 'all' ||
        (issuerFilter === 'personal' && isPersonal) ||
        (issuerFilter === 'firm' && !isPersonal);

      return matchesQuery && matchesStatus && matchesIssuer;
    });
  }, [engagements, activeSearch, statusFilter, issuerFilter]);

  // Safe record date parser supporting DD/MM/YYYY and ISO timestamps
  const parseRecordDate = (rec: EngagementRecord): Date => {
    if (rec.date) {
      const parts = rec.date.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD/MM/YYYY
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else if (parts[0].length === 4) {
          // YYYY-MM-DD
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
      }
    }
    if (rec.createdAt) {
      return new Date(rec.createdAt);
    }
    return new Date();
  };

  // Month-by-month comparative metrics computation
  const monthMetrics = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    const prevDate = new Date(currYear, currMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const currentMonthLabel = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const prevMonthLabel = prevDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    let thisMonthEngs = safeEngagements.filter((e) => {
      const d = parseRecordDate(e);
      return d.getMonth() === currMonth && d.getFullYear() === currYear;
    });

    let prevMonthEngs = safeEngagements.filter((e) => {
      const d = parseRecordDate(e);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const calcValues = (list: EngagementRecord[] = []) => {
      const safeList = Array.isArray(list) ? list : [];
      const count = safeList.length;
      const value = safeList.reduce((sum, e) => sum + (e.service?.pricing?.feeAmount || 0), 0);
      const advance = safeList.reduce((sum, e) => {
        const advPercent =
          e.customAdvancePercent && e.customAdvancePercent > 0
            ? e.customAdvancePercent
            : e.service?.pricing?.customAdvancePercent ||
              e.service?.pricing?.paymentSplit?.[0]?.percent ||
              50;
        return sum + ((e.service?.pricing?.feeAmount || 0) * advPercent) / 100;
      }, 0);
      const approved = safeList.filter((e) => e.status === 'approved' || e.status === 'invoiced').length;
      const draft = safeList.filter((e) => e.status === 'draft').length;
      const sent = safeList.filter((e) => e.status === 'letter_sent').length;
      const personalNonGst = safeList.filter(
        (e) => e.invoiceIssuerType === 'personal' || e.isNonGstInvoice === true
      ).length;

      return { count, value, advance, approved, draft, sent, personalNonGst };
    };

    // Calculate strictly genuine metrics from records without synthetic fallbacks
    const currentStats = calcValues(thisMonthEngs);
    const prevStats = calcValues(prevMonthEngs);

    return {
      currentMonthLabel,
      prevMonthLabel,
      current: currentStats,
      prev: prevStats,
    };
  }, [safeEngagements]);

  // Aggregate Metrics for clean cards
  const totalValue = useMemo(() => {
    return safeEngagements.reduce((sum, e) => sum + (e.service.pricing.feeAmount || 0), 0);
  }, [safeEngagements]);

  const totalAdvanceReceivable = useMemo(() => {
    return safeEngagements.reduce((sum, e) => {
      const advPercent =
        e.customAdvancePercent && e.customAdvancePercent > 0
          ? e.customAdvancePercent
          : e.service.pricing.customAdvancePercent ||
            e.service.pricing.paymentSplit?.[0]?.percent ||
            50;
      return sum + (e.service.pricing.feeAmount * advPercent) / 100;
    }, 0);
  }, [safeEngagements]);

  const statusCounts = useMemo(() => {
    return {
      all: safeEngagements.length,
      draft: safeEngagements.filter((e) => e.status === 'draft').length,
      letter_sent: safeEngagements.filter((e) => e.status === 'letter_sent').length,
      approved: safeEngagements.filter((e) => e.status === 'approved').length,
      invoiced: safeEngagements.filter((e) => e.status === 'invoiced').length,
      personalNonGst: safeEngagements.filter(
        (e) => e.invoiceIssuerType === 'personal' || e.isNonGstInvoice === true
      ).length,
    };
  }, [safeEngagements]);

  const handleDownloadLetter = async (rec: EngagementRecord) => {
    try {
      setDownloadingId(`${rec.id}-letter`);
      await downloadEngagementLetter(rec, firmProfile);
    } catch (err) {
      console.error(err);
      alert('Failed to download Word letter');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadInvoice = async (rec: EngagementRecord) => {
    try {
      setDownloadingId(`${rec.id}-inv`);
      await downloadProFormaInvoice(rec, firmProfile);
    } catch (err) {
      console.error(err);
      alert('Failed to download Word invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadZip = async (rec: EngagementRecord) => {
    try {
      setDownloadingId(`${rec.id}-zip`);
      await downloadBothDocxZip(rec, firmProfile);
    } catch (err) {
      console.error(err);
      alert('Failed to download Word documents zip');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: EngagementStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-semibold tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
      case 'invoiced':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-semibold tracking-tight bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Invoiced
          </span>
        );
      case 'letter_sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-semibold tracking-tight bg-amber-50 text-amber-700 border border-amber-200">
            <Send className="w-3 h-3 text-amber-600" /> Sent
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-semibold tracking-tight bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-16">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E9ECEF] py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Client Engagements & Invoices
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create and manage client engagement letters, custom advance milestone terms, and GST/Non-GST pro-forma invoices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToCrm && (
              <button
                onClick={onNavigateToCrm}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0B2545] hover:bg-[#133E6D] text-white rounded-none text-xs font-semibold shadow-2xs btn-interactive"
                title="Open 34-column Marketing CRM & ERP"
              >
                <TrendingUp className="w-3.5 h-3.5 text-blue-300 btn-icon-hover" />
                <span>Marketing CRM / ERP</span>
              </button>
            )}
            <button
              onClick={onOpenTemplateManager}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-none text-xs font-semibold shadow-2xs btn-interactive"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500 btn-icon-hover" />
              <span>Service Templates</span>
            </button>
            <button
              onClick={onOpenFirmSettings}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-none text-xs font-semibold shadow-2xs btn-interactive"
            >
              <Building className="w-3.5 h-3.5 text-slate-500 btn-icon-hover" />
              <span>Firm Settings</span>
            </button>
            <button
              onClick={onNewEngagement}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none text-xs font-semibold shadow-xs btn-interactive"
            >
              <Plus className="w-4 h-4 btn-icon-hover" />
              <span>New Engagement</span>
            </button>
          </div>
        </div>

        {/* Interactive KPI Cards Strip with Hover Previous Month Toggle and Blurry Animation */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#E9ECEF]">
          <KpiCard
            id="kpi-card-engagements"
            title="Active Engagements"
            icon={Briefcase}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            currentMonthLabel={monthMetrics.currentMonthLabel}
            prevMonthLabel={monthMetrics.prevMonthLabel}
            currentValue={monthMetrics.current.count}
            prevValue={monthMetrics.prev.count}
            currentSubtitle={`${monthMetrics.current.approved} approved • ${monthMetrics.current.draft} draft`}
            prevSubtitle={
              monthMetrics.prev.count === 0
                ? 'No prior mandates recorded'
                : `${monthMetrics.prev.approved} approved • ${monthMetrics.prev.sent} sent`
            }
            deltaText={`${monthMetrics.current.count - monthMetrics.prev.count >= 0 ? '+' : ''}${
              monthMetrics.current.count - monthMetrics.prev.count
            } vs prev mo`}
            deltaType={monthMetrics.current.count >= monthMetrics.prev.count ? 'positive' : 'neutral'}
            interactiveTooltip={`${monthMetrics.currentMonthLabel}: ${monthMetrics.current.count} active client charters`}
          />

          <KpiCard
            id="kpi-card-portfolio"
            title="Contract Portfolio"
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            currentMonthLabel={monthMetrics.currentMonthLabel}
            prevMonthLabel={monthMetrics.prevMonthLabel}
            currentValue={canSeeRevenue ? formatIndianCurrency(monthMetrics.current.value) : '🚫 Restricted'}
            prevValue={canSeeRevenue ? formatIndianCurrency(monthMetrics.prev.value) : '🚫 Restricted'}
            currentSubtitle={canSeeRevenue ? "Aggregate fee value across mandates" : "Restricted: Admin clearance required"}
            prevSubtitle={
              !canSeeRevenue
                ? "Restricted: Admin clearance required"
                : monthMetrics.prev.value === 0
                ? 'No prior billings recorded'
                : 'Prior month closed contract volume'
            }
            deltaText={canSeeRevenue ? (monthMetrics.current.value >= monthMetrics.prev.value ? '+ Growth' : 'Baseline') : 'Restricted'}
            deltaType={monthMetrics.current.value >= monthMetrics.prev.value ? 'positive' : 'neutral'}
            interactiveTooltip={canSeeRevenue ? `Total portfolio volume for ${monthMetrics.currentMonthLabel}` : 'Restricted: Financial commercials require Admin clearance'}
          />

          <KpiCard
            id="kpi-card-advance"
            title="Mobilization Advance"
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            currentMonthLabel={monthMetrics.currentMonthLabel}
            prevMonthLabel={monthMetrics.prevMonthLabel}
            currentValue={canSeeCommercials ? formatIndianCurrency(monthMetrics.current.advance) : '🚫 Restricted'}
            prevValue={canSeeCommercials ? formatIndianCurrency(monthMetrics.prev.advance) : '🚫 Restricted'}
            currentSubtitle={canSeeCommercials ? "Target 50% milestone billing" : "Restricted: Admin clearance required"}
            prevSubtitle={
              !canSeeCommercials
                ? "Restricted: Admin clearance required"
                : monthMetrics.prev.advance === 0
                ? 'No advance billing recorded'
                : 'Past month advance billing'
            }
            deltaText={canSeeCommercials ? "50% Target" : "Restricted"}
            deltaType="positive"
            interactiveTooltip={canSeeCommercials ? `Mobilization cashflow receivable: ${formatIndianCurrency(monthMetrics.current.advance)}` : 'Restricted: Financial commercials require Admin clearance'}
          />

          <KpiCard
            id="kpi-card-nongst"
            title="Personal / Non-GST"
            icon={User}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            currentMonthLabel={monthMetrics.currentMonthLabel}
            prevMonthLabel={monthMetrics.prevMonthLabel}
            currentValue={monthMetrics.current.personalNonGst}
            prevValue={monthMetrics.prev.personalNonGst}
            currentSubtitle="Bill of Supply exempt mandates"
            prevSubtitle={
              monthMetrics.prev.personalNonGst === 0
                ? 'No exempt mandates'
                : 'Exempt advisory in prior period'
            }
            deltaText="Exempt"
            deltaType="neutral"
            interactiveTooltip={`${monthMetrics.current.personalNonGst} individual mandates under exemption`}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#E9ECEF] rounded-none p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          {/* Search Input */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => {
                setLocalSearchQuery(e.target.value);
                onGlobalSearchChange?.(e.target.value);
              }}
              placeholder="Filter by client, reference number, invoice number, or service..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-none text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {/* Status Filter Tabs with Shift Animations */}
          <div className="flex items-center gap-1 text-xs bg-slate-100/70 p-1 border border-slate-200/80 rounded-none">
            {[
              { key: 'all', label: 'All' },
              { key: 'draft', label: 'Draft' },
              { key: 'letter_sent', label: 'Sent' },
              { key: 'approved', label: 'Approved' },
              { key: 'invoiced', label: 'Invoiced' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={`relative px-3 py-1.5 rounded-none text-xs font-semibold transition-all duration-200 btn-interactive ${
                  statusFilter === st.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Issuer Mode Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-xs font-medium text-slate-500">Issuer:</span>
            <select
              value={issuerFilter}
              onChange={(e) => setIssuerFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Issuers</option>
              <option value="firm">Firm GST (18%)</option>
              <option value="personal">Personal / Non-GST</option>
            </select>
          </div>

          {/* Density Control (Compact vs Comfortable) */}
          <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-none bg-slate-50">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-none btn-interactive transition ${
                density === 'comfortable'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Comfortable spacing"
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-none btn-interactive transition ${
                density === 'compact'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Compact spacing"
            >
              Compact
            </button>
          </div>
        </div>

        {/* Engagements Table Container */}
        <div className="bg-white border-x border-b border-slate-200 rounded-none shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-xs">
                <tr className="text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'}`}>Reference & Date</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'}`}>Invoice No</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'}`}>Client / Organization</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'}`}>Service Scope & Terms</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'}`}>Issuer</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'} text-right`}>Fee & Advance</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'} text-center`}>Status</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-4'} text-center w-44 min-w-[176px] max-w-[176px]`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEngagements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm text-slate-700">No engagements found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Try adjusting your search criteria or create a new engagement.
                      </p>
                      <button
                        type="button"
                        onClick={onNewEngagement}
                        className="mt-4 px-3.5 py-1.5 bg-[#0B2545] text-white rounded-none text-xs font-semibold shadow-xs hover:bg-slate-800 transition"
                      >
                        + Create Engagement
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEngagements.map((rec) => {
                    const isPersonal =
                      rec.invoiceIssuerType === 'personal' || rec.isNonGstInvoice === true;
                    const adv =
                      rec.customAdvancePercent && rec.customAdvancePercent > 0
                        ? rec.customAdvancePercent
                        : rec.service.pricing.customAdvancePercent ||
                          rec.service.pricing.paymentSplit?.[0]?.percent ||
                          50;
                    const advAmount = (rec.service.pricing.feeAmount * adv) / 100;
                    const cellPadding = density === 'compact' ? 'py-2 px-3' : 'py-3 px-4';

                    if (density === 'compact') {
                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-indigo-50/40 transition-colors border-b border-slate-100 text-xs h-8"
                        >
                          {/* Ref No & Date (Crisp single-line line item) */}
                          <td className="py-0.5 px-2.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900 font-mono text-[11px]">
                              {rec.refNo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans ml-1 font-normal">
                              ({rec.date})
                            </span>
                          </td>

                          {/* Invoice No */}
                          <td className="py-0.5 px-2.5 whitespace-nowrap font-mono text-slate-700">
                            <span className="font-semibold text-[10.5px]">{rec.invoiceNo}</span>
                          </td>

                          {/* Client / Organization */}
                          <td className="py-0.5 px-2.5 whitespace-nowrap max-w-[190px]">
                            <span
                              className="font-semibold text-slate-900 truncate block text-[11px]"
                              title={`${rec.client.companyName || rec.client.addresseeName} (${rec.client.state})`}
                            >
                              {rec.client.companyName || rec.client.addresseeName}
                            </span>
                          </td>

                          {/* Service Scope & Terms */}
                          <td className="py-0.5 px-2.5 whitespace-nowrap max-w-[210px]">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-medium text-slate-800 truncate text-[11px]"
                                title={rec.service.serviceTitle}
                              >
                                {rec.service.serviceTitle}
                              </span>
                              <span className="text-[9px] font-bold px-1 py-0.2 bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                                {adv}% Adv
                              </span>
                            </div>
                          </td>

                          {/* Issuer */}
                          <td className="py-0.5 px-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 text-[9.5px] font-semibold border ${
                                isPersonal
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isPersonal ? 'Personal' : 'Firm GST'}
                            </span>
                          </td>

                          {/* Fee & Advance */}
                          <td className="py-0.5 px-2.5 text-right whitespace-nowrap font-mono">
                            {canSeeCommercials ? (
                              <>
                                <span className="font-bold text-slate-900 text-[11.5px]">
                                  {formatIndianCurrency(rec.service.pricing.feeAmount)}
                                </span>
                                <span className="text-slate-400 font-sans text-[9.5px] ml-1">
                                  ({formatIndianCurrency(advAmount)})
                                </span>
                              </>
                            ) : (
                              <RestrictedCell compact />
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-0.5 px-2.5 text-center whitespace-nowrap">
                            {getStatusBadge(rec.status)}
                          </td>

                          {/* Actions */}
                          <td className="py-0.5 px-2 text-center whitespace-nowrap w-44 min-w-[176px] max-w-[176px]">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => onEditEngagement(rec)}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-none btn-interactive"
                                title="Edit Engagement"
                              >
                                <Edit2 className="w-3.5 h-3.5 btn-icon-edit" />
                              </button>
                              {canExportRecords && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadLetter(rec)}
                                    disabled={downloadingId === `${rec.id}-letter`}
                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-none btn-interactive disabled:opacity-40"
                                    title="Download Word Letter (.docx)"
                                  >
                                    <FileText className="w-3.5 h-3.5 btn-icon-hover" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(rec)}
                                    disabled={downloadingId === `${rec.id}-inv`}
                                    className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-none btn-interactive disabled:opacity-40"
                                    title="Download Word Invoice (.docx)"
                                  >
                                    <Receipt className="w-3.5 h-3.5 btn-icon-hover" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadZip(rec)}
                                    disabled={downloadingId === `${rec.id}-zip`}
                                    className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-none btn-interactive disabled:opacity-40"
                                    title="Download Both (ZIP)"
                                  >
                                    <Archive className="w-3.5 h-3.5 btn-icon-hover" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => onDuplicateEngagement(rec)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-none btn-interactive"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5 btn-icon-hover" />
                              </button>
                              {canDeleteRecords && (
                                <button
                                  type="button"
                                  onClick={() => setRecordToDelete(rec)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none btn-interactive"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 btn-icon-trash" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50/80 transition group"
                      >
                        {/* Ref No & Date */}
                        <td className={`${cellPadding} whitespace-nowrap`}>
                          <span className="font-bold text-slate-900 block font-mono">
                            {rec.refNo}
                          </span>
                          <span className="text-[11px] text-slate-500 font-sans">
                            {rec.date}
                          </span>
                        </td>

                        {/* Invoice No */}
                        <td className={`${cellPadding} whitespace-nowrap font-mono text-slate-700`}>
                          <span className="font-semibold">{rec.invoiceNo}</span>
                          <span className="text-[10px] text-slate-500 font-sans block capitalize">
                            {rec.invoiceMilestoneType} milestone
                          </span>
                        </td>

                        {/* Client */}
                        <td className={cellPadding}>
                          <div className="font-semibold text-slate-900">
                            {rec.client.companyName || rec.client.addresseeName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {rec.client.addresseeName}{' '}
                            {rec.client.designation ? `• ${rec.client.designation}` : ''} •{' '}
                            <span>{rec.client.state}</span>
                          </div>
                        </td>

                        {/* Service Scope & Advance Terms */}
                        <td className={`${cellPadding} max-w-xs`}>
                          <div className="font-semibold text-slate-900 truncate">
                            {rec.service.serviceTitle}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded-none text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              {adv}% Advance ({formatIndianCurrency(advAmount)})
                            </span>
                            {rec.advanceBillingMode === 'per_service' && (
                              <span className="px-1.5 py-0.5 rounded-none text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                Per-Service
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Issuer */}
                        <td className={`${cellPadding} whitespace-nowrap`}>
                          {isPersonal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <User className="w-3 h-3" /> Personal Non-GST
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <Building className="w-3 h-3" /> Firm (18% GST)
                            </span>
                          )}
                        </td>

                        {/* Fee Value */}
                        <td className={`${cellPadding} text-right whitespace-nowrap font-mono`}>
                          {canSeeCommercials ? (
                            <>
                              <div className="font-bold text-slate-900">
                                {formatIndianCurrency(rec.service.pricing.feeAmount)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-sans">
                                Adv: {formatIndianCurrency(advAmount)}
                              </div>
                            </>
                          ) : (
                            <RestrictedCell />
                          )}
                        </td>

                        {/* Status */}
                        <td className={`${cellPadding} text-center whitespace-nowrap`}>
                          {getStatusBadge(rec.status)}
                        </td>

                        {/* Actions with icons and tooltips */}
                        <td className={`${cellPadding} text-center whitespace-nowrap w-44 min-w-[176px] max-w-[176px]`}>
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => onEditEngagement(rec)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-none btn-interactive"
                              title="Edit Engagement Charter"
                            >
                              <Edit2 className="w-3.5 h-3.5 btn-icon-edit" />
                            </button>

                            {/* Export Actions (Word Letter, Invoice, ZIP) */}
                            {canExportRecords && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadLetter(rec)}
                                  disabled={downloadingId === `${rec.id}-letter`}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-none btn-interactive disabled:opacity-40"
                                  title="Download Word Engagement Letter (.docx)"
                                >
                                  <FileText className="w-3.5 h-3.5 btn-icon-hover" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoice(rec)}
                                  disabled={downloadingId === `${rec.id}-inv`}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/80 rounded-none btn-interactive disabled:opacity-40"
                                  title="Download Word Pro-Forma Invoice (.docx)"
                                >
                                  <Receipt className="w-3.5 h-3.5 btn-icon-hover" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadZip(rec)}
                                  disabled={downloadingId === `${rec.id}-zip`}
                                  className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50/80 rounded-none btn-interactive disabled:opacity-40"
                                  title="Download Both Documents (ZIP)"
                                >
                                  <Archive className="w-3.5 h-3.5 btn-icon-hover" />
                                </button>
                              </>
                            )}

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => onDuplicateEngagement(rec)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-none btn-interactive"
                              title="Duplicate Engagement Charter"
                            >
                              <Copy className="w-3.5 h-3.5 btn-icon-hover" />
                            </button>

                            {/* Delete (Opens dedicated confirmation dialog, completely removing window.confirm block) */}
                            {canDeleteRecords && (
                              <button
                                type="button"
                                onClick={() => setRecordToDelete(rec)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none btn-interactive"
                                title="Delete Engagement Charter"
                              >
                                <Trash2 className="w-3.5 h-3.5 btn-icon-trash" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredEngagements.length} of {engagements.length} engagement records
            </span>
            <span className="font-medium text-slate-400">
              GFP Advisory Consulting Platform
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Animated In-App Delete Confirmation Modal with Apple iOS Frosted Backdrop */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-2xl animate-backdrop-in">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] max-w-md w-full p-6 space-y-4 animate-modal-in">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Engagement Charter?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Are you sure you want to permanently delete engagement{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {recordToDelete.refNo}
                  </span>{' '}
                  for{' '}
                  <span className="font-semibold text-slate-900">
                    {recordToDelete.client.companyName || recordToDelete.client.addresseeName}
                  </span>
                  ? This will remove the letter, invoice records, and service deliverables.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/80 rounded-xl text-xs font-semibold shadow-2xs active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = recordToDelete.id;
                  setRecordToDelete(null);
                  onDeleteEngagement(id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
