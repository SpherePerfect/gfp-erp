import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  RefreshCcw,
  Search,
  X,
  Clock,
  User,
  Layers,
  FileText,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { TrashItem } from '../types';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: TrashItem[];
  onRestoreItem: (item: TrashItem) => void;
  onPermanentlyDeleteItem: (trashId: string) => void;
  onClearAllTrash: () => void;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  trashItems,
  onRestoreItem,
  onPermanentlyDeleteItem,
  onClearAllTrash,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'crm_lead' | 'engagement' | 'template'>('all');
  const [inspectingItem, setInspectingItem] = useState<TrashItem | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const filteredItems = useMemo(() => {
    return trashItems.filter((item) => {
      const matchesType = filterType === 'all' || item.itemType === filterType;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query)) ||
        item.deletedAtFormatted.toLowerCase().includes(query) ||
        item.deletedBy.toLowerCase().includes(query);
      return matchesType && matchesQuery;
    });
  }, [trashItems, filterType, searchQuery]);

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

          {/* Apple macOS Style Window Container */}
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
            className="relative w-full max-w-5xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_0_0_1px_rgba(0,0,0,0.08)] flex flex-col max-h-[90vh] overflow-hidden border border-slate-200/80"
          >
            {/* Window Title Bar */}
            <div className="px-5 py-4 border-b border-slate-200/70 bg-gradient-to-b from-slate-50/90 to-slate-100/50 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    title="Close"
                    className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] border border-[#E0443E] hover:brightness-90 transition-all flex items-center justify-center group"
                  >
                    <X className="w-2 h-2 text-[#4c0000] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] border border-[#D89E24]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#28C840] border border-[#1AAB29]" />
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      Trash Bin
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-medium">
                        {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      All deleted records are preserved with exact millisecond timestamps and can be restored at any time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action right */}
              <div className="flex items-center gap-2">
                {trashItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowEmptyConfirm(true)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Empty Trash
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

            {/* Toolbar: Search & Segmented Filter Control */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
              {/* Apple Segmented Control */}
              <div className="flex items-center bg-slate-200/60 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Items ({trashItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('crm_lead')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === 'crm_lead'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Marketing Leads ({trashItems.filter((i) => i.itemType === 'crm_lead').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('engagement')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === 'engagement'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Engagement Letters ({trashItems.filter((i) => i.itemType === 'engagement').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('template')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === 'template'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Templates ({trashItems.filter((i) => i.itemType === 'template').length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search deleted records..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/90 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-inner">
                    <Trash2 className="w-8 h-8 opacity-40" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Trash is empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No deleted items matched your search query.'
                      : 'Deleted leads, engagement letters, and templates will safely appear here with millisecond timestamps.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => {
                      const isLead = item.itemType === 'crm_lead';
                      const isEngagement = item.itemType === 'engagement';
                      const isTemplate = item.itemType === 'template';

                      let badgeText = 'CRM Lead';
                      let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      let icon = <User className="w-4 h-4 text-blue-600" />;

                      if (isEngagement) {
                        badgeText = 'Engagement Letter';
                        badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                        icon = <FileText className="w-4 h-4 text-indigo-600" />;
                      } else if (isTemplate) {
                        badgeText = 'Service Template';
                        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        icon = <Layers className="w-4 h-4 text-emerald-600" />;
                      }

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.97, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            scale: 0.94,
                            y: -10,
                            transition: { duration: 0.18 },
                          }}
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                          className="bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="p-2 bg-slate-100 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                                  {badgeText}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                  {item.title}
                                </h4>
                              </div>

                              {item.subtitle && (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                                  {item.subtitle}
                                </p>
                              )}

                              {/* Exact Millisecond Timestamp Badge */}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Deleted: {item.deletedAtFormatted}
                                </span>
                                <span className="text-slate-400">by {item.deletedBy}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setInspectingItem(item)}
                              title="Inspect deleted record details"
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Snapshot
                            </button>
                            <button
                              type="button"
                              onClick={() => onRestoreItem(item)}
                              title="Restore back to active database"
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                              Put Back
                            </button>
                            <button
                              type="button"
                              onClick={() => onPermanentlyDeleteItem(item.id)}
                              title="Delete permanently"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
              <span>
                Tip: Items in the Trash can be restored anytime without losing linked engagements or deliverable progress.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </motion.div>

          {/* Inspect Record Modal */}
          <AnimatePresence>
            {inspectingItem && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setInspectingItem(null)}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {inspectingItem.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Timestamp: {inspectingItem.deletedAtFormatted}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectingItem(null)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto my-4 bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto select-text">
                    <pre>{JSON.stringify(inspectingItem.data, null, 2)}</pre>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        onPermanentlyDeleteItem(inspectingItem.id);
                        setInspectingItem(null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl"
                    >
                      Delete Forever
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingItem(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreItem(inspectingItem);
                          setInspectingItem(null);
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Put Back (Restore)
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Empty Trash Confirmation Modal */}
          <AnimatePresence>
            {showEmptyConfirm && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowEmptyConfirm(false)}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Permanently Empty Trash?
                  </h3>
                  <p className="text-xs text-slate-600 mt-2">
                    Are you sure you want to permanently delete all {trashItems.length} items? This action cannot be undone.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEmptyConfirm(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllTrash();
                        setShowEmptyConfirm(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
                    >
                      Empty All Items
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
