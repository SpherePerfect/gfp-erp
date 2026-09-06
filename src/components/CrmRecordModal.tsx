import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  Trash2,
  Save,
  Zap,
  Plus,
  CheckSquare,
  Square,
  ListPlus,
} from 'lucide-react';
import {
  CrmClientRecord,
  CrmAssignmentStatus,
  CrmPriority,
  CrmElStatus,
  CrmAdvanceStatus,
  CrmPostDeliveryStatus,
  CrmPostCompletionStatus,
  CrmFinalStatus,
  CrmWhatsappGroupStatus,
  SubDeliverable,
  CustomTaxonomyConfig,
} from '../types';
import { DEFAULT_TAXONOMY } from '../utils/taxonomyStorage';
import {
  autoCalculateTatDays,
  autoCalculatePostDelivery,
  getFormattedNow,
  formatCleanWhatsAppLink,
} from '../utils/crmStorage';

interface CrmRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CrmClientRecord | null;
  onSave: (record: CrmClientRecord) => void;
  onDelete?: (id: string) => void;
  onCreateEngagementLetter?: (record: CrmClientRecord) => void;
  nextSrNo: number;
  customTaxonomy?: CustomTaxonomyConfig;
}

const DELIVERABLE_PRESETS = [
  'Business Valuation (DCF / Relative / 11UA)',
  'Financial Modeling & Forecasting',
  'Virtual CFO Advisory Retainer',
  'M&A Buy-Side / Sell-Side Due Diligence',
  'Direct Tax Scrutiny & Appellate Representation',
  'GST Health Check & Advisory',
  'Investor Pitch Deck & Information Memorandum',
  'Internal Financial Controls & SOPs',
  'Corporate Debt Syndication & CMA',
  'Strategic Advisory & Board Pack',
];

const LEAD_SOURCE_PRESETS = [
  'Referral - CA Kulkarni',
  'Website Inbound Lead',
  'LinkedIn Founder Outreach',
  'Direct Partner Pitch',
  'Banking / Investor Partner',
  'Existing Client Retainer Expansion',
  'Conference / Industry Event',
];

export const CrmRecordModal: React.FC<CrmRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
  onDelete,
  onCreateEngagementLetter,
  nextSrNo,
  customTaxonomy,
}) => {
  const activeTaxonomy = customTaxonomy || DEFAULT_TAXONOMY;
  const [activeTab, setActiveTab] = useState<'profile' | 'scope' | 'commercials' | 'timeline' | 'growth'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientNameError, setClientNameError] = useState(false);

  // Form State initialized from record or defaults
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [cellNumber, setCellNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('Pune, Maharashtra');
  const [businessDetails, setBusinessDetails] = useState('');

  const [leadGeneratedBy, setLeadGeneratedBy] = useState('Referral - CA Kulkarni');
  const [leadGenerationDate, setLeadGenerationDate] = useState('');
  const [natureOfDeliverable, setNatureOfDeliverable] = useState(DELIVERABLE_PRESETS[0]);
  const [natureOfSubDeliverable, setNatureOfSubDeliverable] = useState('');
  const [subDeliverablesList, setSubDeliverablesList] = useState<SubDeliverable[]>([]);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState<CrmAssignmentStatus>('Lead Identified');
  const [priority, setPriority] = useState<CrmPriority>('Medium');
  const [owner, setOwner] = useState('CA Yogesh Kulkarni');
  const [whatsappGroupCreated, setWhatsappGroupCreated] = useState<CrmWhatsappGroupStatus>('Pending');

  const [elNumber, setElNumber] = useState('');
  const [elStatus, setElStatus] = useState<CrmElStatus>('Draft');
  const [elStartDate, setElStartDate] = useState('');
  const [reportDeliveryDate, setReportDeliveryDate] = useState('');
  const [consultingDate, setConsultingDate] = useState('');
  const [manualTatOverride, setManualTatOverride] = useState(false);
  const [tatDays, setTatDays] = useState(14);
  const [nextAction, setNextAction] = useState('');

  const [totalCommercial, setTotalCommercial] = useState<number>(100000);
  const [advanceAmount, setAdvanceAmount] = useState<number>(50000);
  const [advanceReceiptStatus, setAdvanceReceiptStatus] = useState<CrmAdvanceStatus>('Pending');
  const [postDeliveryReceiptStatus, setPostDeliveryReceiptStatus] = useState<CrmPostDeliveryStatus>('Not Due Yet');
  const [invoiceValue, setInvoiceValue] = useState<number>(0);
  const [invoiceDate, setInvoiceDate] = useState('');

  const [postCompletionPotential, setPostCompletionPotential] = useState('Virtual CFO Retainer');
  const [postCompletionStatus, setPostCompletionStatus] = useState<CrmPostCompletionStatus>('Pending Completion');
  const [remarks, setRemarks] = useState('');
  const [finalStatus, setFinalStatus] = useState<CrmFinalStatus>('Active / In Progress');

  // Populate data when record changes
  useEffect(() => {
    if (record) {
      setClientName(record.clientName || '');
      setContactPerson(record.contactPerson || '');
      setCellNumber(record.cellNumber || '');
      setEmail(record.email || '');
      setLocation(record.location || 'Pune, Maharashtra');
      setBusinessDetails(record.businessDetails || '');

      setLeadGeneratedBy(record.leadGeneratedBy || 'Referral - CA Kulkarni');
      setLeadGenerationDate(record.leadGenerationDate || '');
      setNatureOfDeliverable(record.natureOfDeliverable || DELIVERABLE_PRESETS[0]);
      setNatureOfSubDeliverable(record.natureOfSubDeliverable || '');
      setSubDeliverablesList(
        record.subDeliverablesList && record.subDeliverablesList.length > 0
          ? record.subDeliverablesList
          : record.natureOfSubDeliverable
          ? record.natureOfSubDeliverable
              .split(/[,;\n]/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((t, idx) => ({
                id: `sub-${idx}-${Date.now()}`,
                title: t,
                completed: false,
              }))
          : []
      );
      setAssignmentStatus(record.assignmentStatus || 'Lead Identified');
      setPriority(record.priority || 'Medium');
      setOwner(record.owner || 'CA Yogesh Kulkarni');
      setWhatsappGroupCreated(record.whatsappGroupCreated || 'Pending');

      setElNumber(record.elNumber || '');
      setElStatus(record.elStatus || 'Draft');
      setElStartDate(record.elStartDate || '');
      setReportDeliveryDate(record.reportDeliveryDate || '');
      setConsultingDate(record.consultingDate || '');
      setTatDays(record.tatDays || 0);
      setNextAction(record.nextAction || '');

      setTotalCommercial(record.totalCommercial || 0);
      setAdvanceAmount(record.advanceAmount || 0);
      setAdvanceReceiptStatus(record.advanceReceiptStatus || 'Pending');
      setPostDeliveryReceiptStatus(record.postDeliveryReceiptStatus || 'Not Due Yet');
      setInvoiceValue(record.invoiceValue || 0);
      setInvoiceDate(record.invoiceDate || '');

      setPostCompletionPotential(record.postCompletionPotential || 'Virtual CFO Retainer');
      setPostCompletionStatus(record.postCompletionStatus || 'Pending Completion');
      setRemarks(record.remarks || '');
      setFinalStatus(record.finalStatus || 'Active / In Progress');
      setManualTatOverride(false);
    } else {
      // New record defaults
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const todayFormatted = `${dd}/${mm}/${yyyy}`;

      setClientName('');
      setContactPerson('');
      setCellNumber('');
      setEmail('');
      setLocation('Pune, Maharashtra');
      setBusinessDetails('');

      setLeadGeneratedBy('Referral - CA Kulkarni');
      setLeadGenerationDate(todayFormatted);
      setNatureOfDeliverable(DELIVERABLE_PRESETS[0]);
      setNatureOfSubDeliverable('');
      setAssignmentStatus('Lead Identified');
      setPriority('High');
      setOwner('CA Yogesh Kulkarni');
      setWhatsappGroupCreated('Pending');

      setElNumber('');
      setElStatus('Draft');
      setElStartDate(todayFormatted);
      setReportDeliveryDate('');
      setConsultingDate('');
      setTatDays(14);
      setNextAction('Schedule introductory scoping call');

      setTotalCommercial(100000);
      setAdvanceAmount(50000);
      setAdvanceReceiptStatus('Pending');
      setPostDeliveryReceiptStatus('Not Due Yet');
      setInvoiceValue(0);
      setInvoiceDate('');

      setPostCompletionPotential('Virtual CFO Retainer (₹1.25L / mo)');
      setPostCompletionStatus('Pending Completion');
      setRemarks('');
      setFinalStatus('Active / In Progress');
      setManualTatOverride(false);
      setSubDeliverablesList([]);
      setNewSubTitle('');
      setActiveTab('profile');
    }
  }, [record, isOpen]);

  const handleAddSubDeliverable = () => {
    const text = newSubTitle.trim();
    if (!text) return;
    const newSub: SubDeliverable = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: text,
      completed: false,
    };
    const updated = [...subDeliverablesList, newSub];
    setSubDeliverablesList(updated);
    setNatureOfSubDeliverable(updated.map((s) => s.title).join(', '));
    setNewSubTitle('');
  };

  const handleToggleSubDeliverable = (id: string) => {
    const updated = subDeliverablesList.map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    setSubDeliverablesList(updated);
  };

  const handleDeleteSubDeliverable = (id: string) => {
    const updated = subDeliverablesList.filter((s) => s.id !== id);
    setSubDeliverablesList(updated);
    setNatureOfSubDeliverable(updated.map((s) => s.title).join(', '));
  };

  // Automated Post-Delivery Commercial calculation
  const calculatedPostDeliveryCommercial = autoCalculatePostDelivery(totalCommercial, advanceAmount);

  // Automated Turnaround Time (TAT Days) calculation when dates change
  useEffect(() => {
    if (!manualTatOverride && elStartDate && reportDeliveryDate) {
      const calculated = autoCalculateTatDays(elStartDate, reportDeliveryDate);
      if (calculated > 0) {
        setTatDays(calculated);
      }
    }
  }, [elStartDate, reportDeliveryDate, manualTatOverride]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setClientNameError(true);
      setActiveTab('profile');
      return;
    }
    setClientNameError(false);

    const savedRecord: CrmClientRecord = {
      id: record ? record.id : `crm-${Date.now()}`,
      srNo: record ? record.srNo : nextSrNo,
      clientName: clientName.trim(),
      contactPerson: contactPerson.trim(),
      cellNumber: cellNumber.trim(),
      email: email.trim(),
      location: location.trim(),
      businessDetails: businessDetails.trim(),
      leadGeneratedBy: leadGeneratedBy.trim(),
      leadGenerationDate: leadGenerationDate.trim(),
      natureOfDeliverable: natureOfDeliverable.trim(),
      natureOfSubDeliverable: subDeliverablesList.length > 0
        ? subDeliverablesList.map((s) => s.title).join(', ')
        : natureOfSubDeliverable.trim(),
      subDeliverablesList,
      assignmentStatus,
      priority,
      owner: owner.trim(),
      whatsappGroupCreated,
      elNumber: elNumber.trim(),
      elStatus,
      elStartDate: elStartDate.trim(),
      reportDeliveryDate: reportDeliveryDate.trim(),
      consultingDate: consultingDate.trim(),
      tatDays: Number(tatDays) || 0,
      nextAction: nextAction.trim(),
      totalCommercial: Number(totalCommercial) || 0,
      advanceAmount: Number(advanceAmount) || 0,
      advanceReceiptStatus,
      postDeliveryCommercial: calculatedPostDeliveryCommercial,
      postDeliveryReceiptStatus,
      invoiceValue: Number(invoiceValue) || 0,
      invoiceDate: invoiceDate.trim(),
      postCompletionPotential: postCompletionPotential.trim(),
      postCompletionStatus,
      remarks: remarks.trim(),
      finalStatus,
      updatedAt: getFormattedNow(),
      engagementId: record?.engagementId,
      whatsappLink: formatCleanWhatsAppLink(cellNumber, clientName),
    };

    onSave(savedRecord);
    onClose();
  };

  const currentWhatsAppLink = formatCleanWhatsAppLink(cellNumber, clientName);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Apple Spring Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: 14,
              filter: 'blur(6px)',
              transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
            }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.85,
            }}
            className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col font-sans overflow-hidden"
          >
        {/* Header Strip */}
        <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600/60 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono">
                {record ? `Sr. #${record.srNo}` : `Sr. #${nextSrNo} • New Lead`}
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {record ? record.clientName : 'New Client & Marketing Assignment'}
              </h2>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Comprehensive 34-column CRM / ERP tracking with live TAT and commercial automation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            1. Client & Contact Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scope')}
            className={`py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'scope'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            2. Scope & Acquisition
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commercials')}
            className={`py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'commercials'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            3. Commercials & Receivables
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            4. Execution, EL & TAT
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('growth')}
            className={`py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'growth'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            5. Growth & Retention
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CLIENT & CONTACT INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-view-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lead / Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (clientNameError) setClientNameError(false);
                    }}
                    placeholder="e.g. TechVision AI Solutions Pvt Ltd"
                    className={`w-full px-3 py-2 border rounded-none text-sm font-medium focus:ring-1 ${
                      clientNameError
                        ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                    }`}
                  />
                  {clientNameError && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">
                      Please enter a valid Lead or Client Name before saving.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Mr. Rajesh Mehta (CFO)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      Cell Number
                    </span>
                    {currentWhatsAppLink && (
                      <a
                        href={currentWhatsAppLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Test WhatsApp
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={cellNumber}
                    onChange={(e) => setCellNumber(e.target.value)}
                    placeholder="e.g. +91 98230 45678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh.mehta@techvisionai.in"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    Client Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune, Maharashtra / Mumbai / Bangalore"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Details (Industry, Turnover, Model, Round)
                  </label>
                  <textarea
                    rows={3}
                    value={businessDetails}
                    onChange={(e) => setBusinessDetails(e.target.value)}
                    placeholder="e.g. B2B Enterprise AI Workflow SaaS (Seed funded, raising $3M Series A; 14 enterprise clients; ARR ₹3.5 Cr)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCOPE & ACQUISITION */}
          {activeTab === 'scope' && (
            <div className="space-y-4 animate-view-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Generated By
                  </label>
                  <input
                    type="text"
                    list="lead-sources-list"
                    value={leadGeneratedBy}
                    onChange={(e) => setLeadGeneratedBy(e.target.value)}
                    placeholder="e.g. Referral - CA Kulkarni"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <datalist id="lead-sources-list">
                    {LEAD_SOURCE_PRESETS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Generation Date
                  </label>
                  <input
                    type="text"
                    value={leadGenerationDate}
                    onChange={(e) => setLeadGenerationDate(e.target.value)}
                    placeholder="e.g. 15/08/2026 or 2026-08-15"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nature of Deliverable (Primary Scope)
                  </label>
                  <input
                    type="text"
                    list="deliverables-presets-list"
                    value={natureOfDeliverable}
                    onChange={(e) => setNatureOfDeliverable(e.target.value)}
                    placeholder="e.g. Financial Modeling & Valuation"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <datalist id="deliverables-presets-list">
                    {DELIVERABLE_PRESETS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nature of Sub-Deliverable (Granular Scope)
                  </label>
                  <input
                    type="text"
                    value={natureOfSubDeliverable}
                    onChange={(e) => setNatureOfSubDeliverable(e.target.value)}
                    placeholder="e.g. 5-Year Projections, DCF & Cap Table Sensitivity"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Granular Sub-Deliverables & Milestones List */}
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListPlus className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Itemized Sub-Deliverables & Milestones
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono font-bold">
                        {subDeliverablesList.filter((s) => s.completed).length}/{subDeliverablesList.length} Done
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Syncs automatically with Engagement Letter scope
                    </span>
                  </div>

                  {subDeliverablesList.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {subDeliverablesList.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs hover:border-slate-300 transition-colors"
                        >
                          <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!sub.completed}
                              onChange={() => handleToggleSubDeliverable(sub.id)}
                              className="rounded text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                            />
                            <span
                              className={`truncate font-medium ${
                                sub.completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {sub.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubDeliverable(sub.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                            title="Remove sub-deliverable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-1">
                      No itemized sub-deliverables added yet. Add specific milestones below or enter them in Nature of Sub-Deliverable.
                    </p>
                  )}

                  {/* Add Sub-deliverable input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubDeliverable();
                        }
                      }}
                      placeholder="Add specific sub-deliverable milestone (e.g. 5-Year DCF, Sensitivity Matrix, Board Pitch)..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubDeliverable}
                      disabled={!newSubTitle.trim()}
                      className="px-3 py-1.5 bg-[#0B2545] hover:bg-[#133E6D] disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Milestone
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Status of Assignment
                  </label>
                  <select
                    value={assignmentStatus}
                    onChange={(e) => setAssignmentStatus(e.target.value as CrmAssignmentStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    {activeTaxonomy.assignmentStatuses.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as CrmPriority)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                    >
                      {activeTaxonomy.priorities.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WhatsApp Group
                    </label>
                    <select
                      value={whatsappGroupCreated}
                      onChange={(e) => setWhatsappGroupCreated(e.target.value as CrmWhatsappGroupStatus)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                    >
                      {activeTaxonomy.whatsappGroupStatuses.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner (Responsible Consultant / Partner)
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. CA Yogesh Kulkarni / Pratik Kulkarni"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMERCIALS & RECEIVABLES */}
          {activeTab === 'commercials' && (
            <div className="space-y-4 animate-view-in">
              {/* Automation Highlight Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Automated Balance Split:</strong> Post-Delivery Commercial automatically equals{' '}
                    <code>Total Commercial - Advance Amount</code>.
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(Math.round(totalCommercial * 0.3))}
                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold"
                  >
                    30% Adv
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(Math.round(totalCommercial * 0.5))}
                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold"
                  >
                    50% Adv
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(totalCommercial)}
                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold"
                  >
                    100% Adv
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Commercial Value (₹, excl. taxes)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={totalCommercial}
                      onChange={(e) => setTotalCommercial(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-none text-sm font-mono font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Advance Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-none text-sm font-mono font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Receipt Status
                  </label>
                  <select
                    value={advanceReceiptStatus}
                    onChange={(e) => setAdvanceReceiptStatus(e.target.value as CrmAdvanceStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    {activeTaxonomy.advanceStatuses.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-Calculated Post Delivery */}
                <div className="bg-slate-50 border border-slate-200 p-2.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Post-Delivery Commercial (₹, Automated)
                  </div>
                  <div className="text-base font-bold font-mono text-indigo-900 mt-1">
                    ₹ {calculatedPostDeliveryCommercial.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Post-Delivery Receipt Status
                  </label>
                  <select
                    value={postDeliveryReceiptStatus}
                    onChange={(e) => setPostDeliveryReceiptStatus(e.target.value as CrmPostDeliveryStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    {activeTaxonomy.postDeliveryStatuses.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Invoice Value (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={invoiceValue}
                      onChange={(e) => setInvoiceValue(Number(e.target.value))}
                      placeholder="e.g. 62500"
                      className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="text"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      placeholder="e.g. 02/09/2026"
                      className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE, EL & TAT */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 animate-view-in">
              <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Automated Turnaround Time (TAT):</strong> Calculated automatically as difference
                    between <strong>EL Start Date</strong> and <strong>Report Delivery Date</strong>.
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold bg-white px-2 py-1 border border-amber-300">
                  <span>TAT: {tatDays} Days</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>EL Number (Engagement Letter Ref)</span>
                    {onCreateEngagementLetter && !elNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentTemp: CrmClientRecord = {
                            id: record ? record.id : `crm-${Date.now()}`,
                            srNo: record ? record.srNo : nextSrNo,
                            clientName,
                            contactPerson,
                            cellNumber,
                            email,
                            location,
                            businessDetails,
                            leadGeneratedBy,
                            leadGenerationDate,
                            natureOfDeliverable,
                            natureOfSubDeliverable,
                            assignmentStatus,
                            priority,
                            owner,
                            whatsappGroupCreated,
                            elNumber,
                            elStatus,
                            elStartDate,
                            reportDeliveryDate,
                            consultingDate,
                            tatDays,
                            nextAction,
                            totalCommercial,
                            advanceAmount,
                            advanceReceiptStatus,
                            postDeliveryCommercial: calculatedPostDeliveryCommercial,
                            postDeliveryReceiptStatus,
                            invoiceValue,
                            invoiceDate,
                            postCompletionPotential,
                            postCompletionStatus,
                            remarks,
                            finalStatus,
                            updatedAt: getFormattedNow(),
                          };
                          onCreateEngagementLetter(currentTemp);
                        }}
                        className="text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Zap className="w-3 h-3 text-amber-500" />
                        1-Click Generate EL
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={elNumber}
                    onChange={(e) => setElNumber(e.target.value)}
                    placeholder="e.g. GFP/FM-EL/816/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    EL Status
                  </label>
                  <select
                    value={elStatus}
                    onChange={(e) => setElStatus(e.target.value as CrmElStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    {activeTaxonomy.elStatuses.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    EL Date (Start Date)
                  </label>
                  <input
                    type="text"
                    value={elStartDate}
                    onChange={(e) => setElStartDate(e.target.value)}
                    placeholder="e.g. 02/09/2026 or 2026-09-02"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Report Delivery Date
                  </label>
                  <input
                    type="text"
                    value={reportDeliveryDate}
                    onChange={(e) => setReportDeliveryDate(e.target.value)}
                    placeholder="e.g. 23/09/2026 or 2026-09-23"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Consulting Date (Presentation / Meeting)
                  </label>
                  <input
                    type="text"
                    value={consultingDate}
                    onChange={(e) => setConsultingDate(e.target.value)}
                    placeholder="e.g. 25/09/2026 or 2026-09-25"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>TAT (Days)</span>
                    <button
                      type="button"
                      onClick={() => setManualTatOverride(!manualTatOverride)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                    >
                      {manualTatOverride ? 'Re-enable Auto TAT' : 'Override Manually'}
                    </button>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tatDays}
                    onChange={(e) => {
                      setTatDays(Number(e.target.value));
                      setManualTatOverride(true);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-mono font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1 text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    Next Action (Immediate Task / Follow-up)
                  </label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="e.g. Follow up for audited FY25 provisional PL by Monday 11:00 AM"
                    className="w-full px-3 py-2 border border-red-200 bg-red-50/30 rounded-none text-xs focus:border-red-600 focus:ring-1 focus:ring-red-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Final Status
                  </label>
                  <select
                    value={finalStatus}
                    onChange={(e) => setFinalStatus(e.target.value as CrmFinalStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    {activeTaxonomy.finalStatuses.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GROWTH & RETENTION */}
          {activeTab === 'growth' && (
            <div className="space-y-4 animate-view-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Post-Completion Engagement Potential (Upsell / Expansion)
                  </label>
                  <input
                    type="text"
                    value={postCompletionPotential}
                    onChange={(e) => setPostCompletionPotential(e.target.value)}
                    placeholder="e.g. Virtual CFO Retainer (₹1.5L/mo) / Annual Audit"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Post-Completion Engagement Status
                  </label>
                  <select
                    value={postCompletionStatus}
                    onChange={(e) => setPostCompletionStatus(e.target.value as CrmPostCompletionStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    {activeTaxonomy.postCompletionStatuses.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remarks & Internal Advisory Notes
                  </label>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. High quality founder team ex-IIT/IIM; term sheet expected in Q3; requested introduction to venture capital network."
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {record && (
                  <div className="md:col-span-2 text-right text-[11px] text-slate-400 font-mono">
                    Last Updated: {record.updatedAt}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              {record && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 animate-view-in">
                    <span className="text-xs text-rose-900 font-semibold">Confirm permanent delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(record.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Lead
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-none transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E6D] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {record ? 'Update Client Record' : 'Save New Lead / Assignment'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  );
};
