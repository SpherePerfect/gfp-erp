import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  MapPin,
  ArrowUpDown,
  FileText,
  Percent,
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  Download,
} from 'lucide-react';
import { LceRecord, CrmClientRecord, CommissionBeneficiary } from '../types';
import {
  calculateLceFields,
  saveLceRecords,
  defaultLceRecords,
  getStoredBeneficiaries,
  saveBeneficiaries,
  defaultBeneficiaries,
} from '../utils/lceStorage';
import { exportLceRecordsToExcel } from '../utils/lceExcelExport';
import { formatIndianCurrency } from '../utils/numberToIndianWords';
import { dispatchToast } from './NotificationToast';

interface LceCommissionTrackerProps {
  records: LceRecord[];
  onSaveRecords: (updated: LceRecord[]) => void;
  crmRecords?: CrmClientRecord[];
  onCreateEngagementFromLce?: (record: LceRecord) => void;
  onBackToDashboard?: () => void;
}

export const LceCommissionTracker: React.FC<LceCommissionTrackerProps> = ({
  records,
  onSaveRecords,
  crmRecords = [],
  onCreateEngagementFromLce,
  onBackToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('ALL');

  // Beneficiaries State
  const [beneficiaries, setBeneficiaries] = useState<CommissionBeneficiary[]>(() =>
    getStoredBeneficiaries()
  );
  const [isManageBeneficiariesOpen, setIsManageBeneficiariesOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<CommissionBeneficiary | null>(null);
  const [newBenData, setNewBenData] = useState<Partial<CommissionBeneficiary>>({
    name: '',
    role: 'Referral Partner',
    phone: '',
    pan: '',
    defaultCommissionRate: 20,
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifsc: '',
      upiId: '',
    },
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<LceRecord | null>(null);
  const [isImportCrmOpen, setIsImportCrmOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<LceRecord>>({
    month: 'September 2026',
    businessName: '',
    ownerName: '',
    city: '',
    gstApplicable: true,
    taxableFee: 100000,
    paymentStatus: 'Pending',
    totalAmountReceived: 0,
    commissionRatePercent: 20,
    beneficiaryId: 'ben-ajay',
    beneficiaryName: 'Dr. Ajay',
    beneficiaryRole: 'Lead Business Referral Partner',
    remarks: '',
  });

  // Unique lists for filters
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set);
  }, [records]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.city) set.add(r.city.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [records]);

  // Currently active selected beneficiary object
  const activeBeneficiary = useMemo(() => {
    if (selectedBeneficiaryId === 'ALL') return null;
    return beneficiaries.find((b) => b.id === selectedBeneficiaryId) || null;
  }, [selectedBeneficiaryId, beneficiaries]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedMonth !== 'ALL' && r.month !== selectedMonth) return false;
      if (selectedStatus !== 'ALL' && r.paymentStatus !== selectedStatus) return false;
      if (selectedCity !== 'ALL' && r.city.trim() !== selectedCity) return false;

      // Filter by beneficiary
      if (selectedBeneficiaryId !== 'ALL') {
        const matchesId = r.beneficiaryId === selectedBeneficiaryId;
        const matchesName = activeBeneficiary && (r.beneficiaryName || '').toLowerCase() === activeBeneficiary.name.toLowerCase();
        const fallbackDrAjay = selectedBeneficiaryId === 'ben-ajay' && !r.beneficiaryId && (!r.beneficiaryName || r.beneficiaryName.toLowerCase().includes('ajay'));
        if (!matchesId && !matchesName && !fallbackDrAjay) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchBusiness = r.businessName.toLowerCase().includes(q);
        const matchOwner = r.ownerName.toLowerCase().includes(q);
        const matchCity = r.city.toLowerCase().includes(q);
        const matchBen = (r.beneficiaryName || '').toLowerCase().includes(q);
        const matchRemarks = (r.remarks || '').toLowerCase().includes(q);
        if (!matchBusiness && !matchOwner && !matchCity && !matchRemarks && !matchBen) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedMonth, selectedStatus, selectedCity, selectedBeneficiaryId, activeBeneficiary, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalDeals = filteredRecords.length;
    const totalTaxable = filteredRecords.reduce((acc, r) => acc + (r.taxableFee || 0), 0);
    const totalGst = filteredRecords.reduce((acc, r) => acc + (r.gstAmount || 0), 0);
    const totalInvoiced = filteredRecords.reduce((acc, r) => acc + (r.totalInvoiceAmount || 0), 0);
    const totalReceived = filteredRecords.reduce((acc, r) => acc + (r.totalAmountReceived || 0), 0);
    const taxableReceivedBasis = filteredRecords.reduce((acc, r) => acc + (r.taxableAmountReceived || 0), 0);
    const gstReceived = filteredRecords.reduce((acc, r) => acc + (r.gstAmountReceived || 0), 0);
    const totalCommissionPayable = filteredRecords.reduce((acc, r) => acc + (r.commissionPayable || 0), 0);

    return {
      totalDeals,
      totalTaxable,
      totalGst,
      totalInvoiced,
      totalReceived,
      taxableReceivedBasis,
      gstReceived,
      totalCommissionPayable,
    };
  }, [filteredRecords]);

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setEditingRecord(null);
    const nextSNo = records.length + 1;
    const defaultBen = activeBeneficiary || beneficiaries[0] || {
      id: 'ben-ajay',
      name: 'Dr. Ajay',
      role: 'Lead Business Referral Partner',
      defaultCommissionRate: 20,
    };

    setFormData({
      month: selectedMonth !== 'ALL' ? selectedMonth : 'September 2026',
      sNo: nextSNo,
      businessName: '',
      ownerName: '',
      city: '',
      gstApplicable: true,
      taxableFee: 100000,
      paymentStatus: 'Pending',
      totalAmountReceived: 0,
      commissionRatePercent: defaultBen.defaultCommissionRate || 20,
      beneficiaryId: defaultBen.id,
      beneficiaryName: defaultBen.name,
      beneficiaryRole: defaultBen.role,
      remarks: '',
    });
    setIsModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (rec: LceRecord) => {
    setEditingRecord(rec);
    setFormData({
      ...rec,
      beneficiaryName: rec.beneficiaryName || 'Dr. Ajay',
      commissionRatePercent: rec.commissionRatePercent || 20,
    });
    setIsModalOpen(true);
  };

  // Live computed fields for modal preview
  const liveComputed = useMemo(() => {
    return calculateLceFields(formData);
  }, [formData]);

  // Save record (Add / Edit)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName?.trim()) {
      dispatchToast({ title: 'Please provide the Business Name', type: 'warning' });
      return;
    }

    const calculated = calculateLceFields(formData);

    if (editingRecord) {
      const updatedList = records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              ...calculated,
              beneficiaryId: formData.beneficiaryId,
              beneficiaryName: formData.beneficiaryName || 'Dr. Ajay',
              beneficiaryRole: formData.beneficiaryRole,
              updatedAt: new Date().toISOString(),
            } as LceRecord
          : r
      );
      onSaveRecords(updatedList);
      saveLceRecords(updatedList);
      dispatchToast({ title: `Updated record for ${formData.businessName}`, type: 'success' });
    } else {
      const newRec: LceRecord = {
        id: `lce-${Date.now()}`,
        sNo: formData.sNo || records.length + 1,
        month: formData.month || 'September 2026',
        businessName: formData.businessName.trim(),
        ownerName: formData.ownerName?.trim() || '',
        city: formData.city?.trim() || '',
        gstApplicable: calculated.gstApplicable ?? true,
        taxableFee: calculated.taxableFee || 0,
        gstAmount: calculated.gstAmount || 0,
        totalInvoiceAmount: calculated.totalInvoiceAmount || 0,
        paymentStatus: calculated.paymentStatus || 'Pending',
        totalAmountReceived: calculated.totalAmountReceived || 0,
        taxableAmountReceived: calculated.taxableAmountReceived || 0,
        gstAmountReceived: calculated.gstAmountReceived || 0,
        commissionRatePercent: calculated.commissionRatePercent ?? 20,
        commissionPayable: calculated.commissionPayable || 0,
        beneficiaryId: formData.beneficiaryId || 'ben-ajay',
        beneficiaryName: formData.beneficiaryName || 'Dr. Ajay',
        beneficiaryRole: formData.beneficiaryRole,
        remarks: formData.remarks || '',
        crmRecordId: formData.crmRecordId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedList = [newRec, ...records];
      onSaveRecords(updatedList);
      saveLceRecords(updatedList);
      dispatchToast({ title: `Added referral record for ${newRec.businessName}`, type: 'success' });
    }
    setIsModalOpen(false);
  };

  // Delete record
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    const updated = records.filter((r) => r.id !== recordToDelete.id);
    onSaveRecords(updated);
    saveLceRecords(updated);
    dispatchToast({ title: `Deleted record for ${recordToDelete.businessName}`, type: 'info' });
    setRecordToDelete(null);
  };

  // Beneficiary Management Handlers
  const handleSaveBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBenData.name?.trim()) {
      dispatchToast({ title: 'Beneficiary Name is required', type: 'warning' });
      return;
    }

    if (editingBeneficiary) {
      const updated = beneficiaries.map((b) =>
        b.id === editingBeneficiary.id ? ({ ...b, ...newBenData } as CommissionBeneficiary) : b
      );
      setBeneficiaries(updated);
      saveBeneficiaries(updated);
      dispatchToast({ title: `Updated partner ${newBenData.name}`, type: 'success' });
    } else {
      const created: CommissionBeneficiary = {
        id: `ben-${Date.now()}`,
        name: newBenData.name.trim(),
        role: newBenData.role || 'Referral Partner',
        phone: newBenData.phone || '',
        pan: newBenData.pan || '',
        defaultCommissionRate: newBenData.defaultCommissionRate || 20,
        bankDetails: newBenData.bankDetails,
      };
      const updated = [...beneficiaries, created];
      setBeneficiaries(updated);
      saveBeneficiaries(updated);
      dispatchToast({ title: `Added partner ${created.name}`, type: 'success' });
    }

    setEditingBeneficiary(null);
    setNewBenData({
      name: '',
      role: 'Referral Partner',
      phone: '',
      pan: '',
      defaultCommissionRate: 20,
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifsc: '',
        upiId: '',
      },
    });
  };

  const handleDeleteBeneficiary = (id: string) => {
    if (beneficiaries.length <= 1) {
      dispatchToast({ title: 'Must keep at least one beneficiary', type: 'warning' });
      return;
    }
    const updated = beneficiaries.filter((b) => b.id !== id);
    setBeneficiaries(updated);
    saveBeneficiaries(updated);
    if (selectedBeneficiaryId === id) {
      setSelectedBeneficiaryId('ALL');
    }
    dispatchToast({ title: 'Beneficiary removed', type: 'info' });
  };

  // Import from CRM
  const handleSelectCrmLead = (lead: CrmClientRecord) => {
    const nextSNo = records.length + 1;
    const defaultBen = activeBeneficiary || beneficiaries[0] || {
      id: 'ben-ajay',
      name: 'Dr. Ajay',
      defaultCommissionRate: 20,
    };
    setFormData({
      month: selectedMonth !== 'ALL' ? selectedMonth : 'September 2026',
      sNo: nextSNo,
      businessName: lead.clientName,
      ownerName: lead.contactPerson || '',
      city: lead.location || '',
      gstApplicable: true,
      taxableFee: lead.totalCommercial || 100000,
      paymentStatus: lead.advanceReceiptStatus === 'Received' || lead.advanceReceiptStatus === 'Partially Received' ? 'Partially Received' : 'Pending',
      totalAmountReceived: lead.advanceAmount || 0,
      commissionRatePercent: defaultBen.defaultCommissionRate || 20,
      beneficiaryId: defaultBen.id,
      beneficiaryName: defaultBen.name,
      beneficiaryRole: defaultBen.role,
      remarks: `Imported from CRM Lead (${lead.elNumber || lead.srNo ? `#${lead.srNo}` : lead.id}) - ${lead.natureOfDeliverable || 'Advisory'}`,
      crmRecordId: lead.id,
    });
    setIsImportCrmOpen(false);
    setIsModalOpen(true);
  };

  // Excel Downloads
  const handleExportCurrent = () => {
    exportLceRecordsToExcel(
      filteredRecords,
      selectedMonth,
      activeBeneficiary,
      beneficiaries,
      'GFP Advisory'
    );
    const label = activeBeneficiary ? activeBeneficiary.name : 'Consolidated';
    dispatchToast({ title: `Exported ${label} Commission Register to Excel`, type: 'success' });
  };

  const handleExportConsolidatedMaster = () => {
    exportLceRecordsToExcel(
      records,
      selectedMonth,
      null,
      beneficiaries,
      'GFP Advisory'
    );
    dispatchToast({
      title: 'Exported Master Commission Register (All Tabs)',
      message: 'Generated consolidated multi-sheet Excel with individual partner tabs.',
      type: 'success',
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-black bg-[#0B2545] text-white tracking-wider">
              COMMISSION REGISTER
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Partner Referral & Commission Tracker
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tracking sales to referred clients and chapter networks. Current view:{' '}
            <strong className="text-[#0B2545] font-bold">
              {activeBeneficiary ? activeBeneficiary.name : 'All Beneficiaries & Partners'}
            </strong>{' '}
            — Commission calculated on <strong className="text-emerald-700 font-semibold">Taxable Amount Received</strong> (Col K basis).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsManageBeneficiariesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#0B2545] border border-blue-900/30 rounded-none text-xs font-bold shadow-2xs transition"
            title="Add or manage partners receiving commissions"
          >
            <Users className="w-3.5 h-3.5 text-blue-900" />
            <span>Manage Partners ({beneficiaries.length})</span>
          </button>

          {crmRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setIsImportCrmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-none text-xs font-bold shadow-2xs transition"
              title="Import a client or lead from CRM"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Import from CRM</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCurrent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-none text-xs font-bold shadow-xs transition"
            title="Download detailed Excel for the currently selected view"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {activeBeneficiary ? `Export ${activeBeneficiary.name} Excel` : 'Export Filtered Excel'}
            </span>
          </button>

          {beneficiaries.length > 1 && (
            <button
              type="button"
              onClick={handleExportConsolidatedMaster}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-black text-white rounded-none text-xs font-bold shadow-xs transition"
              title="Download consolidated Excel workbook with individual partner sheets"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Master Excel (All Tabs)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B2545] hover:bg-blue-900 text-white rounded-none text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Referral Record</span>
          </button>
        </div>
      </div>

      {/* Partner Quick-Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pb-2 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-500 mr-1">Partner Tab:</span>
        <button
          type="button"
          onClick={() => setSelectedBeneficiaryId('ALL')}
          className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
            selectedBeneficiaryId === 'ALL'
              ? 'bg-[#0B2545] text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>All Partners</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedBeneficiaryId === 'ALL' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {records.length}
          </span>
        </button>

        {beneficiaries.map((b) => {
          const count = records.filter(
            (r) => r.beneficiaryId === b.id || (!r.beneficiaryId && b.id === 'ben-ajay')
          ).length;
          const isSelected = selectedBeneficiaryId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBeneficiaryId(b.id)}
              className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              <span>{b.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 ${
                isSelected ? 'bg-blue-950 text-blue-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {b.defaultCommissionRate}% • {count} deals
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setIsManageBeneficiariesOpen(true)}
          className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-dashed border-indigo-300 transition flex items-center gap-1 ml-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add Partner</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-none shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Invoiced</span>
            <Building2 className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {formatIndianCurrency(stats.totalInvoiced)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{stats.totalDeals} deals</span>
            <span>•</span>
            <span>Taxable: {formatIndianCurrency(stats.totalTaxable)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-none shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Realized (Gross)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            {formatIndianCurrency(stats.totalReceived)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Basic + Tax collections to date
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-none shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Taxable Received Basis</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-[#0B2545]">
            {formatIndianCurrency(stats.taxableReceivedBasis)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Col K: Basis for commission calculations
          </div>
        </div>

        <div className="bg-blue-50/70 border-2 border-[#0B2545] p-4 rounded-none shadow-2xs">
          <div className="flex items-center justify-between text-[#0B2545] text-xs font-black uppercase tracking-wider mb-1">
            <span>
              {activeBeneficiary ? `${activeBeneficiary.name} Comm.` : 'Total Commission'}
            </span>
            <span className="px-1.5 py-0.2 bg-[#0B2545] text-white text-[10px] font-bold">
              {activeBeneficiary ? `${activeBeneficiary.defaultCommissionRate}%` : 'Col M'}
            </span>
          </div>
          <div className="text-xl font-black text-[#0B2545]">
            {formatIndianCurrency(stats.totalCommissionPayable)}
          </div>
          <div className="text-[11px] text-blue-900 font-medium mt-1">
            Payable on realized fees [Col M]
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 p-3 rounded-none mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search business, owner, city, partner, remarks..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-none text-xs focus:ring-1 focus:ring-blue-900"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-semibold">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-none text-xs font-medium text-slate-800 bg-white"
            >
              <option value="ALL">All Months ({records.length})</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Partner Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-semibold">Partner:</span>
            <select
              value={selectedBeneficiaryId}
              onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-none text-xs font-medium text-slate-800 bg-white"
            >
              <option value="ALL">All Partners ({beneficiaries.length})</option>
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.defaultCommissionRate}%)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-none text-xs font-medium text-slate-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* City Filter */}
          {uniqueCities.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-semibold">City:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 rounded-none text-xs font-medium text-slate-800 bg-white"
              >
                <option value="ALL">All Cities</option>
                {uniqueCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{filteredRecords.length}</strong> of {records.length} records
        </div>
      </div>

      {/* Main Table Matching Exact Image Columns + Beneficiary Tag */}
      <div className="bg-white border border-slate-200 rounded-none overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0B2545] text-white font-bold text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 border-r border-blue-900 whitespace-nowrap text-center">Month</th>
              <th className="py-2.5 px-2 border-r border-blue-900 whitespace-nowrap text-center">S. No.</th>
              <th className="py-2.5 px-3 border-r border-blue-900 min-w-[190px]">Business Name</th>
              <th className="py-2.5 px-3 border-r border-blue-900 min-w-[130px]">Owner Name</th>
              <th className="py-2.5 px-2.5 border-r border-blue-900 whitespace-nowrap">City</th>
              <th className="py-2.5 px-2.5 border-r border-blue-900 whitespace-nowrap bg-blue-950">Partner</th>
              <th className="py-2.5 px-2 border-r border-blue-900 text-center whitespace-nowrap">GST Applic.</th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-right whitespace-nowrap">
                Taxable Fee (₹)<br />
                <span className="text-[9px] font-normal text-blue-200">[col F]</span>
              </th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-right whitespace-nowrap">
                GST @18% (₹)<br />
                <span className="text-[9px] font-normal text-blue-200">[col G]</span>
              </th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-right whitespace-nowrap">
                Total Invoice (₹)<br />
                <span className="text-[9px] font-normal text-blue-200">[F + G]</span>
              </th>
              <th className="py-2.5 px-2.5 border-r border-blue-900 text-center whitespace-nowrap">Payment Status</th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-right whitespace-nowrap">
                Total Received (₹)<br />
                <span className="text-[9px] font-normal text-blue-200">[col J]</span>
              </th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-right whitespace-nowrap bg-blue-900/60">
                Taxable Recd (₹)<br />
                <span className="text-[9px] font-normal text-amber-200">← Partner Basis [col K]</span>
              </th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-right whitespace-nowrap">
                GST Recd (₹)<br />
                <span className="text-[9px] font-normal text-blue-200">[col L]</span>
              </th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-right whitespace-nowrap bg-blue-900">
                Comm. Payable (₹)<br />
                <span className="text-[9px] font-normal text-amber-200">Rate % of col K [col M]</span>
              </th>
              <th className="py-2.5 px-3 border-r border-blue-900 min-w-[160px]">Remarks</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-8 text-center text-slate-500 font-medium">
                  No referral records match the selected partner and filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec, index) => {
                const isPaid = rec.paymentStatus === 'Received';
                const isPartial = rec.paymentStatus === 'Partially Received';
                const benName = rec.beneficiaryName || 'Dr. Ajay';

                return (
                  <tr key={rec.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap font-medium text-center">
                      {rec.month}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 text-center font-mono font-bold text-slate-600">
                      {rec.sNo || index + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                      <div>{rec.businessName}</div>
                      {onCreateEngagementFromLce && (
                        <button
                          type="button"
                          onClick={() => onCreateEngagementFromLce(rec)}
                          className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold underline mt-0.5"
                        >
                          Generate Proposal Letter →
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 font-medium">
                      {rec.ownerName || '—'}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                      {rec.city || '—'}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-200 whitespace-nowrap font-semibold text-slate-800">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-800 border border-slate-300">
                        {benName}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 text-center">
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold ${
                          rec.gstApplicable
                            ? 'bg-blue-50 text-blue-900 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {rec.gstApplicable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-semibold text-slate-900">
                      {formatIndianCurrency(rec.taxableFee)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-600">
                      {formatIndianCurrency(rec.gstAmount)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-[#0B2545]">
                      {formatIndianCurrency(rec.totalInvoiceAmount)}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-200 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : isPartial
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {isPaid && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />}
                        {isPartial && <Clock className="w-2.5 h-2.5 text-amber-700" />}
                        {rec.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-semibold text-slate-900">
                      {formatIndianCurrency(rec.totalAmountReceived)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-blue-950 bg-blue-50/40">
                      {formatIndianCurrency(rec.taxableAmountReceived)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-600">
                      {formatIndianCurrency(rec.gstAmountReceived)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-black text-emerald-800 bg-emerald-50/50">
                      <div>{formatIndianCurrency(rec.commissionPayable)}</div>
                      <span className="text-[9px] font-normal text-slate-500">
                        @{rec.commissionRatePercent ?? 20}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 text-[11px] leading-snug">
                      {rec.remarks || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-none transition"
                          title="Edit Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(rec)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {/* Summary Row */}
          {filteredRecords.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300 text-xs">
                <td className="py-3 px-3 border-r border-slate-300 text-center font-bold">TOTALS</td>
                <td className="py-3 px-2 border-r border-slate-300 text-center font-mono">{filteredRecords.length}</td>
                <td colSpan={5} className="py-3 px-3 border-r border-slate-300 text-slate-700">
                  {filteredRecords.length} Accounts Listed ({activeBeneficiary ? activeBeneficiary.name : 'All Partners'})
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-right font-mono">
                  {formatIndianCurrency(stats.totalTaxable)}
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-slate-700">
                  {formatIndianCurrency(stats.totalGst)}
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-[#0B2545]">
                  {formatIndianCurrency(stats.totalInvoiced)}
                </td>
                <td className="py-3 px-2.5 border-r border-slate-300 text-center text-[11px] text-slate-600">—</td>
                <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-emerald-800">
                  {formatIndianCurrency(stats.totalReceived)}
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-blue-950 bg-blue-100/50">
                  {formatIndianCurrency(stats.taxableReceivedBasis)}
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-slate-700">
                  {formatIndianCurrency(stats.gstReceived)}
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-emerald-900 bg-emerald-100/60">
                  {formatIndianCurrency(stats.totalCommissionPayable)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-[11px] text-slate-600 font-medium">
                  Total Commission: {formatIndianCurrency(stats.totalCommissionPayable)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add / Edit Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none shadow-2xl max-w-xl w-full my-8 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-black text-[#0B2545]">
                  {editingRecord ? 'Edit Referral Record' : 'Add New Partner Referral Record'}
                </h3>
                <p className="text-xs text-slate-500">
                  Select partner to whom commission is payable. Auto-calculates tax and commission live.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Partner Beneficiary Selector */}
              <div className="p-3 bg-blue-50/60 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Commission Beneficiary / Partner:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManageBeneficiariesOpen(true)}
                    className="text-[11px] text-indigo-700 hover:underline font-semibold"
                  >
                    + Manage Partners
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={formData.beneficiaryId || 'ben-ajay'}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const found = beneficiaries.find((b) => b.id === selectedId);
                      setFormData({
                        ...formData,
                        beneficiaryId: selectedId,
                        beneficiaryName: found?.name || 'Dr. Ajay',
                        beneficiaryRole: found?.role,
                        commissionRatePercent: found?.defaultCommissionRate ?? 20,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-bold bg-white"
                  >
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.role} - {b.defaultCommissionRate}%)
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-semibold whitespace-nowrap">Rate %:</span>
                    <input
                      type="number"
                      value={formData.commissionRatePercent ?? 20}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commissionRatePercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold bg-white"
                    />
                    <span className="text-slate-500 text-[11px]">% of Col K</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Month / Cycle</label>
                  <input
                    type="text"
                    value={formData.month || ''}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    placeholder="e.g. September 2026"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Pune, Mumbai, Panaji"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Business / Company Name</label>
                <input
                  type="text"
                  value={formData.businessName || ''}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Apex Precision Engineering Pvt Ltd"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner / Contact Name</label>
                <input
                  type="text"
                  value={formData.ownerName || ''}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="e.g. Mr. Rajeshwar Shinde"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium"
                />
              </div>

              {/* Commercials & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Taxable / Consultation Fee (₹) [Col F]
                  </label>
                  <input
                    type="number"
                    value={formData.taxableFee ?? 0}
                    onChange={(e) => setFormData({ ...formData, taxableFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Applicable?</label>
                  <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gstApplicable ?? true}
                      onChange={(e) => setFormData({ ...formData, gstApplicable: e.target.checked })}
                      className="w-4 h-4 text-blue-900 rounded-none focus:ring-blue-900"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      {formData.gstApplicable ? 'Yes (@18% GST)' : 'No (Non-GST / Exempt)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Payment Status & Realization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus || 'Pending'}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      let newReceived = formData.totalAmountReceived || 0;
                      if (newStatus === 'Received') {
                        newReceived = liveComputed.totalInvoiceAmount || 0;
                      } else if (newStatus === 'Pending' || newStatus === 'Overdue') {
                        newReceived = 0;
                      }
                      setFormData({
                        ...formData,
                        paymentStatus: newStatus,
                        totalAmountReceived: newReceived,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium"
                  >
                    <option value="Received">Received (Fully Realized)</option>
                    <option value="Partially Received">Partially Received (Advance)</option>
                    <option value="Pending">Pending (Invoice Sent)</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Total Amount Received (₹) (Basic + Tax) [Col J]
                  </label>
                  <input
                    type="number"
                    value={formData.totalAmountReceived ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmountReceived: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Live Calculations Preview */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Invoice Amount [F + G]:</span>
                  <span className="font-mono font-bold text-[#0B2545]">
                    {formatIndianCurrency(liveComputed.totalInvoiceAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Taxable Amount Received (Basis) [Col K]:</span>
                  <span className="font-mono font-bold text-indigo-900">
                    {formatIndianCurrency(liveComputed.taxableAmountReceived || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="font-bold text-[#0B2545]">
                    Commission Payable to {formData.beneficiaryName || 'Partner'} ({liveComputed.commissionRatePercent}% of Col K) [Col M]:
                  </span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    {formatIndianCurrency(liveComputed.commissionPayable || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks & Notes</label>
                <textarea
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Lead referred at chapter meet. 50% mobilization advance received."
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-none text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B2545] hover:bg-blue-900 text-white rounded-none text-xs font-bold shadow-xs"
                >
                  {editingRecord ? 'Save Changes' : 'Add to Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Commission Beneficiaries Modal */}
      {isManageBeneficiariesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none shadow-2xl max-w-3xl w-full my-8 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-black text-[#0B2545] flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-900" />
                  <span>Manage Commission Partners & Beneficiaries</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Add multiple people receiving commissions, specify their commission rates and bank details, and export formatted individual Excel reports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageBeneficiariesOpen(false);
                  setEditingBeneficiary(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* List of Beneficiaries */}
            <div className="mb-6 border border-slate-200 divide-y divide-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>Active Commission Partners ({beneficiaries.length})</span>
                <span className="text-[11px] text-slate-500 font-normal">Each partner gets a dedicated Excel sheet in Master export</span>
              </div>
              {beneficiaries.map((b) => {
                const count = records.filter(
                  (r) => r.beneficiaryId === b.id || (!r.beneficiaryId && b.id === 'ben-ajay')
                ).length;
                const partnerRecords = records.filter(
                  (r) => r.beneficiaryId === b.id || (!r.beneficiaryId && b.id === 'ben-ajay')
                );
                const totalCommission = partnerRecords.reduce((acc, r) => acc + (r.commissionPayable || 0), 0);

                return (
                  <div key={b.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-900">
                          {b.defaultCommissionRate}% Commission
                        </span>
                        {b.role && (
                          <span className="text-xs text-slate-500 font-medium">({b.role})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                        {b.phone && <span>Phone: {b.phone}</span>}
                        {b.pan && <span>PAN: {b.pan}</span>}
                        {b.bankDetails?.bankName && (
                          <span>Bank: {b.bankDetails.bankName} (A/c: {b.bankDetails.accountNumber || '—'})</span>
                        )}
                        {b.bankDetails?.upiId && <span>UPI: {b.bankDetails.upiId}</span>}
                      </div>
                      <div className="text-xs text-emerald-800 font-bold mt-1">
                        {count} Referred Deals • Total Payable: {formatIndianCurrency(totalCommission)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Individual Excel Export */}
                      <button
                        type="button"
                        onClick={() => {
                          exportLceRecordsToExcel(
                            partnerRecords,
                            'ALL',
                            b,
                            [b],
                            'GFP Advisory'
                          );
                          dispatchToast({
                            title: `Exported ${b.name}'s Detailed Excel`,
                            message: `Generated well-formatted report with payment summaries and bank details.`,
                            type: 'success',
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition"
                        title={`Download Excel report specifically formatted for ${b.name}`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Export Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBeneficiary(b);
                          setNewBenData({
                            name: b.name,
                            role: b.role,
                            phone: b.phone || '',
                            pan: b.pan || '',
                            defaultCommissionRate: b.defaultCommissionRate || 20,
                            bankDetails: {
                              bankName: b.bankDetails?.bankName || '',
                              accountNumber: b.bankDetails?.accountNumber || '',
                              ifsc: b.bankDetails?.ifsc || '',
                              upiId: b.bankDetails?.upiId || '',
                            },
                          });
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-none transition"
                        title="Edit Partner"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {beneficiaries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBeneficiary(b.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition"
                          title="Remove Partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add / Edit Beneficiary Form */}
            <form onSubmit={handleSaveBeneficiary} className="p-4 bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                <span>{editingBeneficiary ? `Edit Partner: ${editingBeneficiary.name}` : '+ Add New Commission Partner / Beneficiary'}</span>
                {editingBeneficiary && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBeneficiary(null);
                      setNewBenData({
                        name: '',
                        role: 'Referral Partner',
                        phone: '',
                        pan: '',
                        defaultCommissionRate: 20,
                        bankDetails: { bankName: '', accountNumber: '', ifsc: '', upiId: '' },
                      });
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-normal"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Partner / Person Full Name *</label>
                  <input
                    type="text"
                    value={newBenData.name}
                    onChange={(e) => setNewBenData({ ...newBenData, name: e.target.value })}
                    placeholder="e.g. Dr. Ajay, Rajesh Sharma, CA Mehta"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Commission Rate %</label>
                  <input
                    type="number"
                    value={newBenData.defaultCommissionRate}
                    onChange={(e) => setNewBenData({ ...newBenData, defaultCommissionRate: parseFloat(e.target.value) || 0 })}
                    placeholder="20"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Affiliation</label>
                  <input
                    type="text"
                    value={newBenData.role}
                    onChange={(e) => setNewBenData({ ...newBenData, role: e.target.value })}
                    placeholder="e.g. Chapter President, Referral Agent"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    value={newBenData.phone}
                    onChange={(e) => setNewBenData({ ...newBenData, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Number (for TDS)</label>
                  <input
                    type="text"
                    value={newBenData.pan}
                    onChange={(e) => setNewBenData({ ...newBenData, pan: e.target.value })}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-mono uppercase bg-white"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-slate-200 pt-2">
                <span className="block font-bold text-slate-700 mb-1.5 text-[11px] uppercase tracking-wider">
                  Bank Account & Payout Details (Included in Excel Report)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newBenData.bankDetails?.bankName || ''}
                    onChange={(e) => setNewBenData({
                      ...newBenData,
                      bankDetails: { ...newBenData.bankDetails, bankName: e.target.value }
                    })}
                    placeholder="Bank Name (e.g. HDFC)"
                    className="px-2.5 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 bg-white"
                  />
                  <input
                    type="text"
                    value={newBenData.bankDetails?.accountNumber || ''}
                    onChange={(e) => setNewBenData({
                      ...newBenData,
                      bankDetails: { ...newBenData.bankDetails, accountNumber: e.target.value }
                    })}
                    placeholder="Account Number"
                    className="px-2.5 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-mono bg-white"
                  />
                  <input
                    type="text"
                    value={newBenData.bankDetails?.ifsc || ''}
                    onChange={(e) => setNewBenData({
                      ...newBenData,
                      bankDetails: { ...newBenData.bankDetails, ifsc: e.target.value }
                    })}
                    placeholder="IFSC Code"
                    className="px-2.5 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 font-mono uppercase bg-white"
                  />
                  <input
                    type="text"
                    value={newBenData.bankDetails?.upiId || ''}
                    onChange={(e) => setNewBenData({
                      ...newBenData,
                      bankDetails: { ...newBenData.bankDetails, upiId: e.target.value }
                    })}
                    placeholder="UPI ID (e.g. name@okaxis)"
                    className="px-2.5 py-1.5 border border-slate-300 rounded-none text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B2545] hover:bg-blue-900 text-white rounded-none text-xs font-bold shadow-xs"
                >
                  {editingBeneficiary ? 'Update Partner' : '+ Add Partner'}
                </button>
              </div>
            </form>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsManageBeneficiariesOpen(false);
                  setEditingBeneficiary(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-none text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from CRM Modal */}
      {isImportCrmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-none shadow-2xl max-w-xl w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-black text-[#0B2545]">Import from Marketing CRM</h3>
                <p className="text-xs text-slate-500">
                  Select an active CRM lead or client to auto-fill business and fee details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportCrmOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 mb-4">
              {crmRecords.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleSelectCrmLead(lead)}
                  className="p-3 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{lead.clientName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Contact: {lead.contactPerson || '—'} | City: {lead.location || '—'}
                    </p>
                    <span className="text-[10px] text-indigo-700 font-medium">
                      Commercial: {formatIndianCurrency(lead.totalCommercial || 0)}
                    </span>
                  </div>
                  <span className="text-xs text-blue-900 font-bold hover:underline">Select →</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsImportCrmOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-none text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-none shadow-2xl max-w-md w-full p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-950 mb-1">
              Delete Referral Record?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to remove the record for{' '}
              <strong className="text-slate-900">{recordToDelete.businessName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-none text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-xs font-bold shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
