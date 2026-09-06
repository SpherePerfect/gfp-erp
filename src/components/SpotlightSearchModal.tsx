import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Briefcase,
  FileText,
  Layers,
  Settings,
  Plus,
  ArrowRight,
  User,
  Building,
  Receipt,
  CornerDownLeft,
  Check,
  Clock,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { EngagementRecord, ServiceTemplate, FirmProfile } from '../types';
import { formatIndianCurrency } from '../utils/numberToIndianWords';

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagements: EngagementRecord[];
  templates: ServiceTemplate[];
  firmProfile: FirmProfile;
  onSelectEngagement: (rec: EngagementRecord) => void;
  onNewEngagement: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onSelectTemplate: (template: ServiceTemplate) => void;
  initialQuery?: string;
}

interface SpotlightItem {
  id: string;
  category: 'engagement' | 'client' | 'service' | 'invoice' | 'action';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  isOpen,
  onClose,
  engagements,
  templates,
  firmProfile,
  onSelectEngagement,
  onNewEngagement,
  onOpenSettings,
  onOpenTemplates,
  onSelectTemplate,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || '');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Global Esc & Arrow keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute searchable items
  const filteredItems = useMemo<SpotlightItem[]>(() => {
    const q = query.trim().toLowerCase();
    const items: SpotlightItem[] = [];

    // 1. Quick System Actions (Always present or filtered)
    const quickActions: SpotlightItem[] = [
      {
        id: 'act-new-eng',
        category: 'action',
        title: 'Create New Engagement Charter',
        subtitle: 'Bundle services, set commercials & generate proposal',
        badge: 'Action',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <Plus className="w-4 h-4 text-indigo-600" />,
        action: () => {
          onClose();
          onNewEngagement();
        },
      },
      {
        id: 'act-templates',
        category: 'action',
        title: 'Services & Conditions Library',
        subtitle: 'Configure deliverables, objectives, and legal covenants',
        badge: 'Library',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Layers className="w-4 h-4 text-blue-600" />,
        action: () => {
          onClose();
          onOpenTemplates();
        },
      },
      {
        id: 'act-settings',
        category: 'action',
        title: 'Firm Profile & Letterhead Settings',
        subtitle: 'Update GSTIN, PAN, bank accounts, UPI, and signatories',
        badge: 'Settings',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: <Settings className="w-4 h-4 text-slate-600" />,
        action: () => {
          onClose();
          onOpenSettings();
        },
      },
    ];

    if (!q) {
      // When empty: show recent engagements & quick actions
      engagements.slice(0, 5).forEach((rec) => {
        const clientName = rec.client.companyName || rec.client.addresseeName;
        const totalFee = (rec.services && rec.services.length > 0)
          ? rec.services.reduce((acc, s) => acc + (s.pricing?.feeAmount || 0), 0)
          : (rec.service.pricing.feeAmount || 0);

        items.push({
          id: `eng-${rec.id}`,
          category: 'engagement',
          title: `${rec.refNo} — ${clientName}`,
          subtitle: `${rec.service.serviceTitle} • ${formatIndianCurrency(totalFee)} • ${rec.date}`,
          badge: rec.status.toUpperCase(),
          badgeColor:
            rec.status === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : rec.status === 'invoiced'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : rec.status === 'letter_sent'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Briefcase className="w-4 h-4 text-slate-500" />,
          action: () => {
            onClose();
            onSelectEngagement(rec);
          },
        });
      });

      items.push(...quickActions);
      return items;
    }

    // Matching Engagements
    engagements.forEach((rec) => {
      const clientName = rec.client.companyName || rec.client.addresseeName;
      const refMatch = rec.refNo.toLowerCase().includes(q);
      const clientMatch = clientName.toLowerCase().includes(q);
      const titleMatch = rec.service.serviceTitle.toLowerCase().includes(q);
      const invMatch = rec.invoiceNo.toLowerCase().includes(q);

      if (refMatch || clientMatch || titleMatch || invMatch) {
        const totalFee = (rec.services && rec.services.length > 0)
          ? rec.services.reduce((acc, s) => acc + (s.pricing?.feeAmount || 0), 0)
          : (rec.service.pricing.feeAmount || 0);

        items.push({
          id: `eng-${rec.id}`,
          category: 'engagement',
          title: `${rec.refNo} — ${clientName}`,
          subtitle: `${rec.service.serviceTitle} • ${formatIndianCurrency(totalFee)} • ${rec.date}`,
          badge: rec.status.toUpperCase(),
          badgeColor:
            rec.status === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : rec.status === 'invoiced'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : rec.status === 'letter_sent'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Briefcase className="w-4 h-4 text-indigo-600" />,
          action: () => {
            onClose();
            onSelectEngagement(rec);
          },
        });
      }
    });

    // Matching Pro-Forma Invoices
    engagements.forEach((rec) => {
      if (rec.invoiceNo && rec.invoiceNo.toLowerCase().includes(q)) {
        items.push({
          id: `inv-${rec.id}`,
          category: 'invoice',
          title: `Invoice ${rec.invoiceNo}`,
          subtitle: `Client: ${rec.client.companyName || rec.client.addresseeName} • Milestone: ${rec.invoiceMilestoneType}`,
          badge: 'Invoice',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Receipt className="w-4 h-4 text-emerald-600" />,
          action: () => {
            onClose();
            onSelectEngagement(rec);
          },
        });
      }
    });

    // Matching Services & Conditions Templates
    (templates || []).forEach((tmpl) => {
      if (!tmpl) return;
      const sCode = tmpl.serviceCode || '';
      const sTitle = tmpl.serviceTitle || '';
      const sSub = tmpl.subjectLine || '';
      const codeMatch = sCode.toLowerCase().includes(q);
      const titleMatch = sTitle.toLowerCase().includes(q);
      const subMatch = sSub.toLowerCase().includes(q);

      if (codeMatch || titleMatch || subMatch) {
        items.push({
          id: `tmpl-${tmpl.id}`,
          category: 'service',
          title: `${sCode || 'SVC'} — ${sTitle}`,
          subtitle: `${formatIndianCurrency(tmpl.pricing?.feeAmount || 0)} • ${tmpl.deliverables?.length || 0} Deliverables • ${tmpl.additionalConditions?.length || 0} Conditions`,
          badge: 'Service',
          badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: <Layers className="w-4 h-4 text-sky-600" />,
          action: () => {
            onClose();
            onSelectTemplate(tmpl);
          },
        });
      }
    });

    // Matching Quick Actions
    quickActions.forEach((act) => {
      if (act.title.toLowerCase().includes(q) || act.subtitle.toLowerCase().includes(q)) {
        items.push(act);
      }
    });

    return items;
  }, [query, engagements, templates, onClose, onSelectEngagement, onNewEngagement, onOpenSettings, onOpenTemplates, onSelectTemplate]);

  // Handle keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="spotlight-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-2xl"
          onClick={onClose}
        >
          <motion.div
            id="spotlight-dialog"
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(20px)', y: -16 }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, scale: 0.94, filter: 'blur(20px)', y: -16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] rounded-2xl overflow-hidden flex flex-col max-h-[82vh] transform -translate-y-4 sm:-translate-y-8"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Spotlight Search Header */}
            <div className="flex items-center gap-3.5 px-4 py-3.5 border-b border-slate-200/80 bg-white/90">
              <Search className="w-5 h-5 text-indigo-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Spotlight Search: Type client, reference, invoice, or service..."
                className="flex-1 bg-transparent text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-600 font-semibold border border-slate-200 shadow-2xs">
                ESC
              </span>
            </div>

        {/* Spotlight Results List */}
        <div
          ref={listRef}
          className="overflow-y-auto divide-y divide-slate-100 flex-1 p-1 max-h-[460px]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching results found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with a different keyword, client name, or invoice number.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-l-3 border-indigo-600'
                      : 'hover:bg-slate-50 border-l-3 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-white border-indigo-200 text-indigo-700 shadow-xs'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-indigo-950 font-bold' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded-none text-[10px] font-bold border shrink-0 ${
                              item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-sans">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-white px-2 py-0.5 border border-indigo-200">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Spotlight Footer Keyboard Hints */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] font-mono shadow-2xs font-bold text-slate-700">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] font-mono shadow-2xs font-bold text-slate-700">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] font-mono shadow-2xs font-bold text-slate-700">
                ↵
              </kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] font-mono shadow-2xs font-bold text-slate-700">
                esc
              </kbd>
              <span>to dismiss</span>
            </span>
          </div>
          <div className="text-slate-400 font-medium hidden sm:block">
            GFP Advisory Spotlight
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
