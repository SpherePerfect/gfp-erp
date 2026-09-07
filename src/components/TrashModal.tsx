import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  RotateCcw,
  Search,
  X,
  Clock,
  Briefcase,
  Layers,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
} from 'lucide-react';
import { TrashItem, CrmClientRecord, EngagementRecord } from '../types';
import {
  getStoredTrashItems,
  removeFromTrash,
  clearAllTrash,
} from '../utils/trashStorage';
import { dispatchToast } from './NotificationToast';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreLead?: (lead: CrmClientRecord) => void;
  onRestoreEngagement?: (eng: EngagementRecord) => void;
  onTrashUpdated?: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  onRestoreLead,
  onRestoreEngagement,
  onTrashUpdated,
}) => {
  const [items, setItems] = useState<TrashItem[]>(() => getStoredTrashItems() || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'crm_lead' | 'engagement'>('all');
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<TrashItem | null>(null);

  // Refresh items whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setItems(getStoredTrashItems() || []);
      setConfirmEmptyAll(false);
      setInspectingItem(null);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    return (items || []).filter((item) => {
      const matchesType = typeFilter === 'all' || item.itemType === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesType;

      const titleMatch = item.title.toLowerCase().includes(q);
      const subtitleMatch = (item.subtitle || '').toLowerCase().includes(q);
      const timeMatch = item.deletedAtFormatted.toLowerCase().includes(q);
      return matchesType && (titleMatch || subtitleMatch || timeMatch);
    });
  }, [items, typeFilter, searchQuery]);

  const handleRestore = (item: TrashItem) => {
    removeFromTrash(item.id);
    const updated = (items || []).filter((i) => i.id !== item.id);
    setItems(updated);
    if (onTrashUpdated) onTrashUpdated();

    if (item.itemType === 'crm_lead' && item.data) {
      if (onRestoreLead) {
        onRestoreLead(item.data as CrmClientRecord);
      }
    } else if (item.itemType === 'engagement' && item.data) {
      if (onRestoreEngagement) {
        onRestoreEngagement(item.data as EngagementRecord);
      }
    }

    dispatchToast({
      title: 'Restored from Dustbin',
      message: `"${item.title}" was successfully restored to your active pipeline.`,
      type: 'success',
    });

    if (inspectingItem?.id === item.id) {
      setInspectingItem(null);
    }
  };

  const handlePermanentDeleteSingle = (itemId: string) => {
    removeFromTrash(itemId);
    const updated = (items || []).filter((i) => i.id !== itemId);
    setItems(updated);
    if (onTrashUpdated) onTrashUpdated();

    dispatchToast({
      title: 'Permanently Removed',
      message: 'Item has been completely expunged from the dustbin.',
      type: 'info',
    });

    if (inspectingItem?.id === itemId) {
      setInspectingItem(null);
    }
  };

  const handleEmptyAll = () => {
    clearAllTrash();
    setItems([]);
    setConfirmEmptyAll(false);
    setInspectingItem(null);
    if (onTrashUpdated) onTrashUpdated();

    dispatchToast({
      title: 'Dustbin Emptied',
      message: 'All recycled records have been permanently cleared.',
      type: 'info',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-6"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.85,
            }}
            className="relative w-full max-w-4xl bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_0_0_1px_rgba(0,0,0,0.08)] flex flex-col h-[85vh] max-h-[750px] overflow-hidden border border-slate-200/80 font-sans"
          >
            {/* Apple macOS Style Window Title Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200/70 bg-gradient-to-b from-slate-50/90 to-slate-100/60 flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Recycle Bin / Dustbin
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Exact millisecond timestamp tracking with instant 1-click pipeline restoration
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmEmptyAll(true)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Empty Dustbin</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-header Filter & Search Bar */}
            <div className="px-5 py-3 border-b border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    typeFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Items ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('crm_lead')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    typeFilter === 'crm_lead'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Leads & Deals ({(items || []).filter((i) => i.itemType === 'crm_lead').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('engagement')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    typeFilter === 'engagement'
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Engagement Letters ({(items || []).filter((i) => i.itemType === 'engagement').length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title or timestamp..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Empty Confirmation Prompt */}
            {confirmEmptyAll && (
              <div className="bg-rose-50 border-b border-rose-200 px-5 py-3 flex items-center justify-between text-xs text-rose-900 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Are you sure?</strong> This will permanently delete all {items.length} items from the dustbin. This action cannot be reversed.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmEmptyAll(false)}
                    className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEmptyAll}
                    className="px-3 py-1 text-xs font-bold text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors"
                  >
                    Yes, Expunge All
                  </button>
                </div>
              </div>
            )}

            {/* Main Content Area: Split View if Item Inspected */}
            <div className="flex-1 flex overflow-hidden">
              {/* Item List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-1">
                {filteredItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Dustbin is Empty</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {searchQuery
                          ? 'No deleted items matched your filter query.'
                          : 'Any deleted leads or engagement letters will be safely retained here.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isInspecting = inspectingItem?.id === item.id;
                    const isLead = item.itemType === 'crm_lead';

                    return (
                      <div
                        key={item.id}
                        onClick={() => setInspectingItem(item)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                          isInspecting
                            ? 'bg-blue-50/60 border-blue-300 shadow-xs'
                            : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isLead ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {isLead ? <Building className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-slate-900 truncate">
                                {item.title}
                              </span>
                              <span
                                className={`text-[9.5px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                                  isLead
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                }`}
                              >
                                {isLead ? 'Client Lead' : 'Engagement Letter'}
                              </span>
                            </div>

                            {item.subtitle && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}

                            {/* Exact millisecond timestamp display */}
                            <div className="flex items-center gap-3 mt-1.5 text-[10.5px] font-mono text-slate-500">
                              <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{item.deletedAtFormatted}</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Deleted by {item.deletedBy}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1.5"
                            title="Restore this record back into active workspace"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteSingle(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Permanently remove from dustbin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Side Inspector Pane if an item is selected */}
              {inspectingItem && (
                <div className="w-80 border-l border-slate-200/80 bg-slate-50/70 p-4 flex flex-col justify-between overflow-y-auto shrink-0 text-xs font-sans">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900 text-xs">Record Snapshot</span>
                      <button
                        type="button"
                        onClick={() => setInspectingItem(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Item Title
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">{inspectingItem.title}</p>
                    </div>

                    {inspectingItem.subtitle && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Scope / Detail
                        </span>
                        <p className="text-slate-700 mt-0.5">{inspectingItem.subtitle}</p>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Deleted At (Millisecond Precision)
                      </span>
                      <p className="font-mono text-xs font-semibold text-slate-800 bg-white p-2 border border-slate-200 rounded mt-1">
                        {inspectingItem.deletedAtFormatted}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Deleted By
                      </span>
                      <p className="text-slate-700 mt-0.5">{inspectingItem.deletedBy}</p>
                    </div>

                    {/* Snapshot attributes preview */}
                    {inspectingItem.data && (
                      <div className="space-y-2 border-t border-slate-200 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Preserved Data Fields
                        </span>
                        <div className="bg-white border border-slate-200 rounded p-2.5 space-y-1.5 text-[11px]">
                          {inspectingItem.data.clientName && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Client:</span>
                              <span className="font-medium text-slate-800">{inspectingItem.data.clientName}</span>
                            </div>
                          )}
                          {inspectingItem.data.natureOfDeliverable && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Deliverable:</span>
                              <span className="font-medium text-slate-800 truncate max-w-[130px]" title={inspectingItem.data.natureOfDeliverable}>
                                {inspectingItem.data.natureOfDeliverable}
                              </span>
                            </div>
                          )}
                          {inspectingItem.data.totalCommercial !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Commercial:</span>
                              <span className="font-mono font-bold text-slate-900">₹{Number(inspectingItem.data.totalCommercial).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {inspectingItem.data.refNo && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Ref No:</span>
                              <span className="font-mono text-slate-800">{inspectingItem.data.refNo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleRestore(inspectingItem)}
                      className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-md transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore to Active Pipeline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePermanentDeleteSingle(inspectingItem.id)}
                      className="w-full py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors text-xs font-semibold"
                    >
                      Expunge Permanently
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
