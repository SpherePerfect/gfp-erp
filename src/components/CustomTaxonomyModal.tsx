import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  X,
  ListFilter,
  Tag,
  Clock,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { CustomTaxonomyConfig } from '../types';
import { DEFAULT_TAXONOMY } from '../utils/taxonomyStorage';

interface CustomTaxonomyModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxonomy: CustomTaxonomyConfig;
  onSaveTaxonomy: (updated: CustomTaxonomyConfig) => void;
}

type TaxonomyKey = keyof CustomTaxonomyConfig;

interface CategoryMeta {
  key: TaxonomyKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'assignmentStatuses',
    label: 'Lead & Assignment Statuses',
    description: 'Pipeline stages for tracking client engagement progression.',
    icon: <Briefcase className="w-4 h-4 text-blue-600" />,
  },
  {
    key: 'priorities',
    label: 'Priority Levels',
    description: 'Urgency classifications used in filtering and notification scoring.',
    icon: <Clock className="w-4 h-4 text-amber-600" />,
  },
  {
    key: 'advanceStatuses',
    label: 'Advance Receipt Statuses',
    description: 'Tracks upfront billing and advance deposit verification.',
    icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: 'postDeliveryStatuses',
    label: 'Post-Delivery Commercial Statuses',
    description: 'Tracks final milestone billings and balance fee collections.',
    icon: <DollarSign className="w-4 h-4 text-indigo-600" />,
  },
  {
    key: 'finalStatuses',
    label: 'Final Lifecycle Statuses',
    description: 'Outcome tracking upon delivery completion or contract conclusion.',
    icon: <Layers className="w-4 h-4 text-purple-600" />,
  },
  {
    key: 'postCompletionStatuses',
    label: 'Post-Completion Engagement Potential',
    description: 'Next-stage upsell and retainer pitch statuses.',
    icon: <Tag className="w-4 h-4 text-rose-600" />,
  },
  {
    key: 'whatsappGroupStatuses',
    label: 'WhatsApp Group Statuses',
    description: 'Coordination channel status options for client communications.',
    icon: <ListFilter className="w-4 h-4 text-teal-600" />,
  },
  {
    key: 'elStatuses',
    label: 'Engagement Letter (EL) Statuses',
    description: 'Document signing lifecycle flags for statutory letters.',
    icon: <Sliders className="w-4 h-4 text-cyan-600" />,
  },
];

export const CustomTaxonomyModal: React.FC<CustomTaxonomyModalProps> = ({
  isOpen,
  onClose,
  taxonomy,
  onSaveTaxonomy,
}) => {
  const [activeCategoryKey, setActiveCategoryKey] = useState<TaxonomyKey>('assignmentStatuses');
  const [newItemText, setNewItemText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCategory = CATEGORIES.find((c) => c.key === activeCategoryKey) || CATEGORIES[0];
  const currentList = taxonomy[activeCategoryKey] || [];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    if (currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setToastMessage('Item already exists in this list');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const updated = {
      ...taxonomy,
      [activeCategoryKey]: [...currentList, trimmed],
    };
    onSaveTaxonomy(updated);
    setNewItemText('');
    setToastMessage(`Added "${trimmed}" to ${activeCategory.label}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDeleteItem = (index: number) => {
    if (currentList.length <= 1) {
      setToastMessage('A list must contain at least one option');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const deleted = currentList[index];
    const updated = {
      ...taxonomy,
      [activeCategoryKey]: currentList.filter((_, idx) => idx !== index),
    };
    onSaveTaxonomy(updated);
    setToastMessage(`Removed "${deleted}"`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setEditingIndex(null);
      return;
    }

    const updatedList = [...currentList];
    updatedList[index] = trimmed;
    const updated = {
      ...taxonomy,
      [activeCategoryKey]: updatedList,
    };
    onSaveTaxonomy(updated);
    setEditingIndex(null);
    setEditingText('');
  };

  const handleResetCurrentToDefault = () => {
    const defaultForCategory = DEFAULT_TAXONOMY[activeCategoryKey];
    const updated = {
      ...taxonomy,
      [activeCategoryKey]: defaultForCategory,
    };
    onSaveTaxonomy(updated);
    setToastMessage(`Reset ${activeCategory.label} to defaults`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleResetAllToDefaults = () => {
    onSaveTaxonomy(JSON.parse(JSON.stringify(DEFAULT_TAXONOMY)));
    setToastMessage('Reset all dropdown lists to system defaults');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Apple macOS Style Preferences Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: 12,
              filter: 'blur(8px)',
              transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
            }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.85,
            }}
            className="relative w-full max-w-4xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_0_0_1px_rgba(0,0,0,0.08)] flex flex-col h-[85vh] max-h-[750px] overflow-hidden border border-slate-200/80"
          >
            {/* Window Title Bar */}
            <div className="px-5 py-4 border-b border-slate-200/70 bg-gradient-to-b from-slate-50/90 to-slate-100/50 flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Lists & Taxonomy Customizer
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Configure options, statuses, and workflow stages across the CRM & ERP
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split macOS Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar: Categories */}
              <div className="w-64 border-r border-slate-200/80 bg-slate-50/70 p-3 overflow-y-auto space-y-1 shrink-0">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Customizable Dropdowns
                </div>
                {CATEGORIES.map((cat) => {
                  const isSelected = cat.key === activeCategoryKey;
                  const count = taxonomy[cat.key]?.length || 0;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategoryKey(cat.key)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-slate-700 hover:bg-slate-200/60 font-medium text-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isSelected ? 'text-white' : ''}>{cat.icon}</span>
                        <span className="text-xs truncate">{cat.label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-700/80 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                <div className="pt-4 px-2">
                  <button
                    type="button"
                    onClick={handleResetAllToDefaults}
                    className="w-full text-left text-[11px] font-medium text-slate-500 hover:text-rose-600 py-2 px-2 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset All to Defaults
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white/70">
                {/* Header for Active Category */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 bg-white/50">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {activeCategory.icon}
                      {activeCategory.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCategory.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCurrentToDefault}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Category
                  </button>
                </div>

                {/* Add New Item Form */}
                <form onSubmit={handleAddItem} className="px-6 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder={`Add new option to ${activeCategory.label}...`}
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newItemText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </form>

                {/* Toast Feedback Notification Banner */}
                <AnimatePresence>
                  {toastMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-blue-50 border-b border-blue-100 px-6 py-2 text-xs font-semibold text-blue-800 flex items-center gap-2 overflow-hidden"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      {toastMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-6 space-y-2">
                  <AnimatePresence initial={false}>
                    {currentList.map((item, index) => {
                      const isEditing = editingIndex === index;
                      return (
                        <motion.div
                          key={`${activeCategoryKey}-${item}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden', transition: { duration: 0.15 } }}
                          transition={{ duration: 0.15 }}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs group transition-[border-color,box-shadow]"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>

                            {isEditing ? (
                              <input
                                type="text"
                                value={editingText}
                                autoFocus
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(index);
                                  if (e.key === 'Escape') setEditingIndex(null);
                                }}
                                className="flex-1 px-2.5 py-1 text-xs border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {item}
                              </span>
                            )}
                          </div>

                          <div className="w-28 flex items-center justify-end gap-1 shrink-0">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(index)}
                                  className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(null)}
                                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingIndex(index);
                                    setEditingText(item);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(index)}
                                  disabled={currentList.length <= 1}
                                  title={currentList.length <= 1 ? 'Cannot delete the only remaining option' : 'Delete option'}
                                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Footer Bar */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                  <span className="text-xs text-slate-500">
                    Total {currentList.length} options configured. Changes apply immediately.
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
