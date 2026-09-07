import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceTemplate, ClientDetails, EngagementRecord } from '../types';
import { formatIndianCurrency } from '../utils/numberToIndianWords';
import {
  Layers,
  CheckSquare,
  Square,
  Search,
  Building2,
  User,
  MapPin,
  X,
  FileCheck,
  Briefcase,
  Users,
} from 'lucide-react';

interface NewEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ServiceTemplate[];
  existingEngagements: EngagementRecord[];
  onCreateEngagement: (
    selectedTemplates: ServiceTemplate[],
    clientData: Partial<ClientDetails>
  ) => void;
}

export const NewEngagementModal: React.FC<NewEngagementModalProps> = ({
  isOpen,
  onClose,
  templates = [],
  existingEngagements = [],
  onCreateEngagement,
}) => {
  // Multiselect state: initialize with the first template selected
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    templates && templates.length > 0 ? [templates[0].id] : []
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize selection when templates load
  useEffect(() => {
    if (selectedTemplateIds.length === 0 && templates && templates.length > 0) {
      setSelectedTemplateIds([templates[0].id]);
    }
  }, [templates]);

  // Client Details state
  const [companyName, setCompanyName] = useState('');
  const [addresseeName, setAddresseeName] = useState('');
  const [designation, setDesignation] = useState('');
  const [salutation, setSalutation] = useState('Dear Sir');
  const [businessEntityType, setBusinessEntityType] = useState('Private Limited');
  const [state, setState] = useState('Maharashtra');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Extract unique clients from existing engagements for quick autofill
  const savedClients = useMemo(() => {
    const map = new Map<string, ClientDetails>();
    (existingEngagements || []).forEach((eng) => {
      if (!eng || !eng.client) return;
      const name = eng.client.companyName || eng.client.addresseeName;
      if (name && !map.has(name.toLowerCase().trim())) {
        map.set(name.toLowerCase().trim(), eng.client);
      }
    });
    return Array.from(map.values());
  }, [existingEngagements]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return (templates || []).filter((t) => {
      if (!t) return false;
      const title = t.serviceTitle || '';
      const code = t.serviceCode || '';
      const q = searchQuery.toLowerCase();
      return title.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    });
  }, [templates, searchQuery]);

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      if (prev.includes(id)) {
        // Keep at least one selected
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAll = () => {
    setSelectedTemplateIds((templates || []).map((t) => t.id));
  };

  const selectFirstOnly = () => {
    if (templates && templates.length > 0) {
      setSelectedTemplateIds([templates[0].id]);
    }
  };

  // Selected templates list & aggregate fee
  const selectedTemplates = (templates || []).filter((t) => selectedTemplateIds.includes(t.id));
  const aggregateFee = selectedTemplates.reduce(
    (sum, t) => sum + (t.pricing?.feeAmount || 0),
    0
  );

  const handleAutofillClient = (client: ClientDetails) => {
    setCompanyName(client.companyName || '');
    setAddresseeName(client.addresseeName || '');
    setDesignation(client.designation || '');
    setSalutation(client.salutation || 'Dear Sir');
    setBusinessEntityType(client.businessEntityType || 'Private Limited');
    setState(client.state || 'Maharashtra');
    setGstin(client.gstin || '');
    setPan(client.pan || '');
    setBillingAddress(client.billingAddress || '');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplates.length === 0) return;

    onCreateEngagement(selectedTemplates, {
      companyName,
      addresseeName: addresseeName || companyName || 'Client Signatory',
      designation: designation || 'Director',
      salutation,
      businessEntityType,
      state,
      gstin,
      pan,
      billingAddress,
    });

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="bg-white border border-slate-300 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl rounded-lg text-slate-900 overflow-hidden font-sans"
          >
            {/* Header with Apple-like polish */}
            <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-blue-900/60 flex items-center justify-center text-blue-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base tracking-tight">Create Engagement Letter</h2>
                  <p className="text-xs text-blue-200">
                    Select one or multiple service offerings to bundle in this advisory mandate
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-blue-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Close Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Service Offerings Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#0B2545]" />
                  Select Service Offerings ({selectedTemplates.length} Selected)
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Check the services you wish to include in this engagement letter charter
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-none transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={selectFirstOnly}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-none transition"
                >
                  Select Primary Only
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search service offerings by code or title..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Services Grid / List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-200 bg-slate-50/50">
              {filteredTemplates.map((t) => {
                const isSelected = selectedTemplateIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTemplate(t.id)}
                    className={`p-2.5 border cursor-pointer select-none transition flex items-start gap-2.5 rounded-none ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#0B2545] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="pt-0.5 text-[#0B2545]">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-none">
                          {t.serviceCode || 'SVC'}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {formatIndianCurrency(t.pricing?.feeAmount || 0)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">
                        {t.serviceTitle || 'Untitled Service'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(t.deliverables || []).filter((d) => d.include).length} deliverables • {t.projectTimeline || '3 to 4 Weeks'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aggregate Fee Banner */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-none flex items-center justify-between">
              <div>
                <span className="font-bold text-[#0B2545]">Combined Base Professional Fee:</span>
                <span className="text-slate-600 ml-2 text-[11px]">
                  ({selectedTemplates.length} {selectedTemplates.length === 1 ? 'service' : 'services'} bundled)
                </span>
              </div>
              <span className="font-mono font-black text-sm text-[#0B2545]">
                {formatIndianCurrency(aggregateFee)}
              </span>
            </div>
          </div>

          {/* Section 2: Client Details */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0B2545]" />
                Client & Recipient Information
              </h3>

              {savedClients.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    onChange={(e) => {
                      const found = savedClients.find(
                        (c) => (c.companyName || c.addresseeName) === e.target.value
                      );
                      if (found) handleAutofillClient(found);
                    }}
                    className="text-[11px] bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-none font-medium text-slate-700"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Autofill from saved clients...
                    </option>
                    {savedClients.map((c, i) => (
                      <option key={i} value={c.companyName || c.addresseeName}>
                        {c.companyName || c.addresseeName} ({c.state})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Technologies Private Limited"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Addressee / Signatory Name
                </label>
                <input
                  type="text"
                  value={addresseeName}
                  onChange={(e) => setAddresseeName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Salutation
                </label>
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Dear Sir">Dear Sir</option>
                  <option value="Dear Madam">Dear Madam</option>
                  <option value="Dear Sir/Madam">Dear Sir/Madam</option>
                  <option value="Dear Dr.">Dear Dr.</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Managing Director / CEO"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Business Entity Type
                </label>
                <select
                  value={businessEntityType}
                  onChange={(e) => setBusinessEntityType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="Limited Liability Partnership (LLP)">LLP</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Trust / Society / Section 8">Trust / NGO</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  State (for GST determination)
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  PAN (Optional)
                </label>
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="AAAAA0000A"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Billing Address (Optional)
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Registered corporate address..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-none text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-none transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={selectedTemplates.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B2545] hover:bg-[#133863] text-white text-xs font-bold rounded-none shadow-sm transition disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4 text-blue-300" />
              <span>
                Create Engagement Letter ({selectedTemplates.length}{' '}
                {selectedTemplates.length === 1 ? 'Service' : 'Services'})
              </span>
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
