import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MessageSquare,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Columns,
  BarChart3,
  Calendar,
  User,
  Building,
  Phone,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Zap,
  Trash2,
  Edit3,
  X,
  Check,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Mail,
  MapPin,
  Briefcase,
  AlertCircle,
  Eye,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CrmClientRecord,
  CrmAssignmentStatus,
  CrmPriority,
  CrmActivity,
  EngagementRecord,
  FirmProfile,
  ServiceTemplate,
  CustomTaxonomyConfig,
  UserRole,
} from '../types';
import { CrmRecordModal } from './CrmRecordModal';
import { CrmActivityTimeline } from './CrmActivityTimeline';
import { RestrictedCell } from './RestrictedCell';
import {
  exportCrmRecordsToCsv,
  syncEngagementsWithCrm,
  getFormattedNow,
  autoCalculatePostDelivery,
} from '../utils/crmStorage';
import { addToTrash, removeFromTrash } from '../utils/trashStorage';
import { dispatchToast } from './NotificationToast';

interface MarketingCrmProps {
  crmRecords: CrmClientRecord[];
  onSaveCrmRecords: (records: CrmClientRecord[]) => void;
  engagements: EngagementRecord[];
  firmProfile: FirmProfile;
  availableTemplates: ServiceTemplate[];
  onOpenEngagementEditor: (record: EngagementRecord) => void;
  onCreateEngagementFromCrm: (crmRecord: CrmClientRecord) => void;
  onNavigateToDashboard: () => void;
  customTaxonomy?: CustomTaxonomyConfig;
  onOpenTaxonomy?: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  userRole?: UserRole;
}

const ALL_STAGES: CrmAssignmentStatus[] = [
  'Lead Identified',
  'In Discussion',
  'Proposal / EL Sent',
  'EL Signed & Active',
  'Data Collection',
  'Execution & Modeling',
  'Draft Delivered',
  'Final Report Delivered',
  'Closed / Billed',
  'On Hold',
  'Dropped / Lost',
];

const STAGE_PROGRESSION: CrmAssignmentStatus[] = [
  'Lead Identified',
  'In Discussion',
  'Proposal / EL Sent',
  'EL Signed & Active',
  'Data Collection',
  'Execution & Modeling',
  'Draft Delivered',
  'Final Report Delivered',
  'Closed / Billed',
];

export const MarketingCrm: React.FC<MarketingCrmProps> = ({
  crmRecords,
  onSaveCrmRecords,
  engagements,
  firmProfile,
  availableTemplates,
  onOpenEngagementEditor,
  onCreateEngagementFromCrm,
  onNavigateToDashboard,
  customTaxonomy,
  onOpenTaxonomy,
  onOpenTrash,
  trashCount = 0,
  userRole = 'Admin',
}) => {
  const isAdmin = userRole === 'Admin';
  // Navigation & Views
  const [activeView, setActiveView] = useState<'table' | 'kanban' | 'analytics'>('table');
  const [quickViewPill, setQuickViewPill] = useState<
    'all' | 'advance_pending' | 'active_work' | 'urgent_high' | 'el_active' | 'closed_won'
  >('all');

  const availableStages = useMemo(() => {
    if (customTaxonomy?.assignmentStatuses && customTaxonomy.assignmentStatuses.length > 0) {
      return customTaxonomy.assignmentStatuses;
    }
    return ALL_STAGES;
  }, [customTaxonomy]);

  const availablePriorities = useMemo(() => {
    if (customTaxonomy?.priorities && customTaxonomy.priorities.length > 0) {
      return customTaxonomy.priorities;
    }
    return ['Urgent', 'High', 'Medium', 'Low'];
  }, [customTaxonomy]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
  const [selectedAdvanceFilter, setSelectedAdvanceFilter] = useState<string>('all');
  const [columnViewMode, setColumnViewMode] = useState<'standard' | 'full'>('standard');

  // Selection & Bulk Actions
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  // Slide-over Inspector Drawer & Modals
  const [inspectingRecord, setInspectingRecord] = useState<CrmClientRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CrmClientRecord | null>(null);

  // Dedicated In-App Confirmation Modal for Deletion
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    | { type: 'single'; record: CrmClientRecord }
    | { type: 'bulk'; count: number }
    | null
  >(null);

  // In-App Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3800);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
  };

  // Sorting
  const [sortField, setSortField] = useState<keyof CrmClientRecord>('srNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Format Indian Currency
  const formatINR = (amount: number) => {
    return '₹ ' + (amount || 0).toLocaleString('en-IN');
  };

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return crmRecords
      .filter((rec) => {
        // Quick Saved Views Logic
        if (quickViewPill === 'advance_pending') {
          if (rec.advanceReceiptStatus !== 'Pending' && rec.advanceReceiptStatus !== 'Overdue') {
            return false;
          }
        } else if (quickViewPill === 'active_work') {
          if (
            rec.assignmentStatus !== 'Execution & Modeling' &&
            rec.assignmentStatus !== 'Data Collection' &&
            rec.assignmentStatus !== 'Draft Delivered'
          ) {
            return false;
          }
        } else if (quickViewPill === 'urgent_high') {
          if (rec.priority !== 'Urgent' && rec.priority !== 'High') {
            return false;
          }
        } else if (quickViewPill === 'el_active') {
          if (rec.assignmentStatus !== 'EL Signed & Active' && rec.elStatus !== 'Signed') {
            return false;
          }
        } else if (quickViewPill === 'closed_won') {
          if (
            rec.assignmentStatus !== 'Closed / Billed' &&
            rec.postCompletionStatus !== 'Closed Won' &&
            rec.finalStatus !== 'Converted to Retainer'
          ) {
            return false;
          }
        }

        // Search Bar Query
        const matchesSearch =
          !searchQuery.trim() ||
          rec.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.cellNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.elNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.natureOfDeliverable.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.businessDetails.toLowerCase().includes(searchQuery.toLowerCase());

        // Dropdown Filters
        const matchesStatus =
          selectedStatusFilter === 'all' || rec.assignmentStatus === selectedStatusFilter;

        const matchesPriority =
          selectedPriorityFilter === 'all' || rec.priority === selectedPriorityFilter;

        const matchesOwner =
          selectedOwnerFilter === 'all' ||
          rec.owner.toLowerCase().includes(selectedOwnerFilter.toLowerCase());

        const matchesAdvance =
          selectedAdvanceFilter === 'all' || rec.advanceReceiptStatus === selectedAdvanceFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesOwner && matchesAdvance;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    crmRecords,
    quickViewPill,
    searchQuery,
    selectedStatusFilter,
    selectedPriorityFilter,
    selectedOwnerFilter,
    selectedAdvanceFilter,
    sortField,
    sortDirection,
  ]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalPipelineValue = 0;
    let totalAdvanceCollected = 0;
    let totalAdvancePending = 0;
    let totalPostDeliveryCommercial = 0;
    let totalPostDeliveryPending = 0;
    let totalTatDays = 0;
    let tatCount = 0;
    let urgentDeals = 0;
    let retainerExpansions = 0;

    crmRecords.forEach((rec) => {
      totalPipelineValue += rec.totalCommercial || 0;
      if (rec.advanceReceiptStatus === 'Received') {
        totalAdvanceCollected += rec.advanceAmount || 0;
      } else if (rec.advanceReceiptStatus === 'Pending' || rec.advanceReceiptStatus === 'Overdue') {
        totalAdvancePending += rec.advanceAmount || 0;
      }

      const postDel =
        rec.postDeliveryCommercial ||
        autoCalculatePostDelivery(rec.totalCommercial, rec.advanceAmount);
      totalPostDeliveryCommercial += postDel;
      if (rec.postDeliveryReceiptStatus === 'Pending' || rec.postDeliveryReceiptStatus === 'Invoiced') {
        totalPostDeliveryPending += postDel;
      }

      if (rec.tatDays > 0) {
        totalTatDays += rec.tatDays;
        tatCount++;
      }

      if (rec.priority === 'Urgent' || rec.priority === 'High') {
        urgentDeals++;
      }

      if (
        rec.postCompletionStatus === 'Closed Won' ||
        rec.finalStatus === 'Converted to Retainer'
      ) {
        retainerExpansions++;
      }
    });

    const avgTat = tatCount > 0 ? Math.round(totalTatDays / tatCount) : 0;

    return {
      totalPipelineValue,
      totalAdvanceCollected,
      totalAdvancePending,
      totalPostDeliveryCommercial,
      totalPostDeliveryPending,
      avgTat,
      urgentDeals,
      retainerExpansions,
      totalLeads: crmRecords.length,
    };
  }, [crmRecords]);

  // Record CRUD Handlers
  const handleSaveRecord = (record: CrmClientRecord) => {
    const exists = crmRecords.some((r) => r.id === record.id);
    let updated: CrmClientRecord[];
    if (exists) {
      updated = crmRecords.map((r) => (r.id === record.id ? record : r));
      showToast(`Lead "${record.clientName}" updated successfully.`);
    } else {
      updated = [record, ...crmRecords];
      showToast(`New Lead "${record.clientName}" registered in pipeline.`);
    }
    onSaveCrmRecords(updated);
    if (inspectingRecord && inspectingRecord.id === record.id) {
      setInspectingRecord(record);
    }
  };

  const handleInlineStatusChange = (recordId: string, newStatus: CrmAssignmentStatus) => {
    const updated = crmRecords.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          assignmentStatus: newStatus,
          updatedAt: getFormattedNow(),
        };
      }
      return r;
    });
    onSaveCrmRecords(updated);
    if (inspectingRecord && inspectingRecord.id === recordId) {
      setInspectingRecord({ ...inspectingRecord, assignmentStatus: newStatus });
    }
    showToast(`Stage updated to ${newStatus}`);
  };

  const handleInlineAdvanceChange = (
    recordId: string,
    newAdvance: CrmClientRecord['advanceReceiptStatus']
  ) => {
    const updated = crmRecords.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          advanceReceiptStatus: newAdvance,
          updatedAt: getFormattedNow(),
        };
      }
      return r;
    });
    onSaveCrmRecords(updated);
    if (inspectingRecord && inspectingRecord.id === recordId) {
      setInspectingRecord({ ...inspectingRecord, advanceReceiptStatus: newAdvance });
    }
    showToast(`Advance status marked as ${newAdvance}`);
  };

  const handleAddActivity = (recordId: string, activity: CrmActivity) => {
    const updated = crmRecords.map((r) => {
      if (r.id === recordId) {
        const activities = [...(r.activities || []), activity];
        return {
          ...r,
          activities,
          updatedAt: getFormattedNow(),
        };
      }
      return r;
    });
    onSaveCrmRecords(updated);
    if (inspectingRecord && inspectingRecord.id === recordId) {
      setInspectingRecord({
        ...inspectingRecord,
        activities: [...(inspectingRecord.activities || []), activity],
        updatedAt: getFormattedNow(),
      });
    }
    showToast(`Touchpoint logged: ${activity.title}`);
  };

  const handleDeleteActivity = (recordId: string, activityId: string) => {
    const updated = crmRecords.map((r) => {
      if (r.id === recordId) {
        const activities = (r.activities || []).filter((a) => a.id !== activityId);
        return {
          ...r,
          activities,
          updatedAt: getFormattedNow(),
        };
      }
      return r;
    });
    onSaveCrmRecords(updated);
    if (inspectingRecord && inspectingRecord.id === recordId) {
      setInspectingRecord({
        ...inspectingRecord,
        activities: (inspectingRecord.activities || []).filter((a) => a.id !== activityId),
        updatedAt: getFormattedNow(),
      });
    }
    showToast(`Touchpoint removed`);
  };

  // Safe In-App Delete Handlers with Millisecond Trash Preservation
  const executeSingleDelete = (id: string) => {
    const recordToDelete = crmRecords.find((r) => r.id === id);
    if (recordToDelete) {
      addToTrash(
        'crm_lead',
        recordToDelete.clientName,
        `${recordToDelete.natureOfDeliverable || 'Advisory'} • ₹${(recordToDelete.totalCommercial || 0).toLocaleString('en-IN')}`,
        recordToDelete,
        recordToDelete.owner || firmProfile?.signatoryName || 'Advisor'
      );
    }
    const updated = crmRecords.filter((r) => r.id !== id);
    onSaveCrmRecords(updated);
    if (inspectingRecord && inspectingRecord.id === id) {
      setInspectingRecord(null);
    }
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeleteConfirmTarget(null);

    if (recordToDelete) {
      dispatchToast({
        type: 'trash',
        title: 'Lead Moved to Dustbin',
        message: `"${recordToDelete.clientName}" saved to dustbin with millisecond timestamp.`,
        actionLabel: 'Undo',
        onAction: () => {
          const restored = [recordToDelete, ...updated];
          onSaveCrmRecords(restored);
          removeFromTrash(recordToDelete.id);
          dispatchToast({
            type: 'success',
            title: 'Lead Restored',
            message: `"${recordToDelete.clientName}" successfully restored back to pipeline.`,
          });
        },
      });
    }
  };

  const executeBulkDelete = () => {
    const count = selectedRecordIds.size;
    const recordsToDelete = crmRecords.filter((r) => selectedRecordIds.has(r.id));
    recordsToDelete.forEach((rec) => {
      addToTrash(
        'crm_lead',
        rec.clientName,
        `${rec.natureOfDeliverable || 'Advisory'} • ₹${(rec.totalCommercial || 0).toLocaleString('en-IN')}`,
        rec,
        rec.owner || firmProfile?.signatoryName || 'Advisor'
      );
    });

    const updated = crmRecords.filter((r) => !selectedRecordIds.has(r.id));
    onSaveCrmRecords(updated);
    if (inspectingRecord && selectedRecordIds.has(inspectingRecord.id)) {
      setInspectingRecord(null);
    }
    setSelectedRecordIds(new Set());
    setDeleteConfirmTarget(null);

    dispatchToast({
      type: 'trash',
      title: `${count} Leads Moved to Dustbin`,
      message: `Preserved in Recycle Bin with exact millisecond timestamps.`,
      actionLabel: 'Undo',
      onAction: () => {
        const restored = [...recordsToDelete, ...updated];
        onSaveCrmRecords(restored);
        recordsToDelete.forEach((r) => removeFromTrash(r.id));
        dispatchToast({
          type: 'success',
          title: 'Leads Restored',
          message: `Restored ${count} client records to pipeline.`,
        });
      },
    });
  };

  // Bulk Stage & Advance Updates
  const handleBulkStageChange = (status: CrmAssignmentStatus) => {
    if (selectedRecordIds.size === 0) return;
    const updated = crmRecords.map((r) => {
      if (selectedRecordIds.has(r.id)) {
        return {
          ...r,
          assignmentStatus: status,
          updatedAt: getFormattedNow(),
        };
      }
      return r;
    });
    onSaveCrmRecords(updated);
    showToast(`Updated ${selectedRecordIds.size} leads to "${status}".`);
    setSelectedRecordIds(new Set());
  };

  const handleBulkMarkAdvanceReceived = () => {
    if (selectedRecordIds.size === 0) return;
    const updated = crmRecords.map((r) => {
      if (selectedRecordIds.has(r.id)) {
        return {
          ...r,
          advanceReceiptStatus: 'Received' as const,
          updatedAt: getFormattedNow(),
        };
      }
      return r;
    });
    onSaveCrmRecords(updated);
    showToast(`Marked advance as Received for ${selectedRecordIds.size} leads.`);
    setSelectedRecordIds(new Set());
  };

  // Sync Engagements
  const handleSyncEngagements = () => {
    const synced = syncEngagementsWithCrm(engagements, crmRecords);
    onSaveCrmRecords(synced);
    showToast(`Synced ${engagements.length} engagement records into Marketing CRM.`);
  };

  // 1-Click Open or Draft Engagement Letter
  const handleOpenOrDraftEngagement = (record: CrmClientRecord) => {
    let matched = engagements.find((e) => e.id === record.engagementId);
    if (!matched && record.elNumber) {
      matched = engagements.find((e) => e.refNo === record.elNumber);
    }
    if (matched) {
      onOpenEngagementEditor(matched);
      showToast(`Opened Engagement Letter: ${matched.refNo}`);
    } else {
      onCreateEngagementFromCrm(record);
      showToast(`Created draft Engagement Letter for ${record.clientName}`);
    }
  };

  // Sorting
  const toggleSort = (field: keyof CrmClientRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection Checkbox Helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRecordIds(new Set(filteredRecords.map((r) => r.id)));
    } else {
      setSelectedRecordIds(new Set());
    }
  };

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Badges (Anti-slop: zero emojis, clear color dots & high contrast text)
  const getAssignmentBadge = (status: CrmAssignmentStatus) => {
    switch (status) {
      case 'Lead Identified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
            Lead Identified
          </span>
        );
      case 'In Discussion':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
            In Discussion
          </span>
        );
      case 'Proposal / EL Sent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />
            Proposal Sent
          </span>
        );
      case 'EL Signed & Active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
            EL Signed
          </span>
        );
      case 'Data Collection':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold bg-cyan-50 text-cyan-900 border border-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 mr-1.5" />
            Data Kickoff
          </span>
        );
      case 'Execution & Modeling':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold bg-amber-50 text-amber-950 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />
            Modeling & DCF
          </span>
        );
      case 'Draft Delivered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold bg-purple-50 text-purple-900 border border-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-1.5" />
            Draft Delivered
          </span>
        );
      case 'Final Report Delivered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold bg-teal-50 text-teal-900 border border-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-1.5" />
            Report Delivered
          </span>
        );
      case 'Closed / Billed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mr-1.5" />
            Closed & Billed
          </span>
        );
      case 'On Hold':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
            On Hold
          </span>
        );
      case 'Dropped / Lost':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold bg-rose-50 text-rose-900 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
            Lost / Inactive
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-[10.5px] bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: CrmPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-950 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1 animate-pulse" />
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1" />
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-normal bg-slate-50 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1" />
            Low
          </span>
        );
    }
  };

  const getAdvanceBadge = (status: CrmClientRecord['advanceReceiptStatus']) => {
    switch (status) {
      case 'Received':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1" />
            Received
          </span>
        );
      case 'Partially Received':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-950 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
            Partial
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-950 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" />
            Pending
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-950 border border-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1" />
            Overdue
          </span>
        );
      case 'Waived':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-slate-600 bg-slate-100 border border-slate-200">
            Waived
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-view-in ${
            toastMessage.type === 'success'
              ? 'bg-[#0B2545] text-white border-blue-500'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-white text-slate-800 border-slate-300'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
          {toastMessage.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* HubSpot Top Navigation Bar */}
      <div className="bg-white border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0B2545] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              Advisory CRM & ERP
            </span>
            <span className="text-xs text-slate-500 font-medium">Pipeline & Mandate Deals</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Marketing CRM & Engagements
            </h1>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-200">
              {crmRecords.length} Deals
            </span>
          </div>
        </div>

        {/* Primary Action Button Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenTrash && (
            <button
              type="button"
              onClick={onOpenTrash}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 group"
              title="View all deleted records in Dustbin (millisecond-accurate timestamp & 1-click restore)"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 transition-colors" />
              <span>Dustbin</span>
              {trashCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200 rounded-full">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          {onOpenTaxonomy && (
            <button
              type="button"
              onClick={onOpenTaxonomy}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5"
              title="Customize dropdown lists (Lead Status, Priority, Channels, etc.)"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Customize Lists</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSyncEngagements}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5"
            title="Synchronize engagement numbers and fee milestones from engagement database"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Sync Engagements
          </button>

          <button
            type="button"
            onClick={() => exportCrmRecordsToCsv(crmRecords)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5"
            title="Download full 34-column spreadsheet in CSV format"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E6D] shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Create Deal / Lead
          </button>
        </div>
      </div>

      {/* HubSpot KPI Executive Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 shadow-2xs">
          <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
            Total Pipeline
          </div>
          <div className="text-lg font-black font-mono text-slate-900 mt-0.5 truncate">
            {isAdmin ? formatINR(metrics.totalPipelineValue) : '🚫 Restricted'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Across all active mandates</div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 shadow-2xs">
          <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider">
            Advance Realized
          </div>
          <div className="text-lg font-black font-mono text-emerald-700 mt-0.5 truncate">
            {isAdmin ? formatINR(metrics.totalAdvanceCollected) : '🚫 Restricted'}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">Collected in bank</div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 shadow-2xs">
          <div className="text-[10.5px] font-bold text-rose-800 uppercase tracking-wider">
            Advance Pending
          </div>
          <div className="text-lg font-black font-mono text-rose-700 mt-0.5 truncate">
            {isAdmin ? formatINR(metrics.totalAdvancePending) : '🚫 Restricted'}
          </div>
          <div className="text-[10px] text-rose-700 mt-1 font-medium">Follow-up needed</div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 shadow-2xs">
          <div className="text-[10.5px] font-bold text-indigo-900 uppercase tracking-wider">
            Post-Delivery Due
          </div>
          <div className="text-lg font-black font-mono text-indigo-950 mt-0.5 truncate">
            {isAdmin ? formatINR(metrics.totalPostDeliveryCommercial) : '🚫 Restricted'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Payable on report delivery</div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 shadow-2xs">
          <div className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
            Average Turnaround
          </div>
          <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
            {metrics.avgTat} <span className="text-xs font-normal">Days</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">EL Start to Delivery</div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 shadow-2xs">
          <div className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider">
            High / Urgent
          </div>
          <div className="text-lg font-black font-mono text-amber-900 mt-0.5">
            {metrics.urgentDeals} <span className="text-xs font-normal">Deals</span>
          </div>
          <div className="text-[10px] text-amber-700 mt-1 font-medium">Critical focus accounts</div>
        </div>
      </div>

      {/* HubSpot View Switching Tabs & Saved Views */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          {/* Main View Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'table'
                  ? 'bg-white text-[#0B2545] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Spreadsheet View
            </button>

            <button
              type="button"
              onClick={() => setActiveView('kanban')}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'kanban'
                  ? 'bg-white text-[#0B2545] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Pipeline Kanban
            </button>

            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'analytics'
                  ? 'bg-white text-[#0B2545] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Deal Analytics
            </button>
          </div>

          {/* Quick Saved Filter Pills (HubSpot Deals Style) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Views:</span>
            {[
              { id: 'all', label: 'All Deals' },
              { id: 'advance_pending', label: 'Advance Pending' },
              { id: 'active_work', label: 'Active Execution' },
              { id: 'urgent_high', label: 'Urgent & High' },
              { id: 'el_active', label: 'EL Signed' },
              { id: 'closed_won', label: 'Retainers Won' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setQuickViewPill(pill.id as any)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors border ${
                  quickViewPill === pill.id
                    ? 'bg-[#0B2545] text-white border-[#0B2545]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Secondary Filter Bar & Columns Toggle */}
        <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Global Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, contact person, phone, EL number, deliverable, or owner..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Column Mode Toggle (Only in Table View) */}
            {activeView === 'table' && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-slate-500">Columns:</span>
                <button
                  type="button"
                  onClick={() => setColumnViewMode(columnViewMode === 'standard' ? 'full' : 'standard')}
                  className={`px-2.5 py-1.5 text-xs font-bold border transition-colors ${
                    columnViewMode === 'full'
                      ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {columnViewMode === 'full' ? 'Showing All 34 Columns' : 'Executive Compact (12 Cols)'}
                </button>
              </div>
            )}
          </div>

          {/* Filter Dropdowns Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter by:</span>
              </div>

              {/* Stage Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 text-xs text-slate-800"
              >
                <option value="all">All Stages ({crmRecords.length})</option>
                {ALL_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 text-xs text-slate-800"
              >
                <option value="all">All Priorities</option>
                <option value="Urgent">Urgent Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              {/* Advance Status Filter */}
              <select
                value={selectedAdvanceFilter}
                onChange={(e) => setSelectedAdvanceFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 text-xs text-slate-800"
              >
                <option value="all">All Advance Status</option>
                <option value="Pending">Advance Pending</option>
                <option value="Received">Advance Received</option>
                <option value="Partially Received">Advance Partial</option>
                <option value="Overdue">Advance Overdue</option>
              </select>

              {/* Owner Filter */}
              <select
                value={selectedOwnerFilter}
                onChange={(e) => setSelectedOwnerFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 text-xs text-slate-800"
              >
                <option value="all">All Owners</option>
                {Array.from(new Set(crmRecords.map((r) => r.owner))).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              {/* Clear All Filters */}
              {(selectedStatusFilter !== 'all' ||
                selectedPriorityFilter !== 'all' ||
                selectedAdvanceFilter !== 'all' ||
                selectedOwnerFilter !== 'all' ||
                quickViewPill !== 'all' ||
                searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatusFilter('all');
                    setSelectedPriorityFilter('all');
                    setSelectedAdvanceFilter('all');
                    setSelectedOwnerFilter('all');
                    setQuickViewPill('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold ml-1 hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Showing <strong>{filteredRecords.length}</strong> of <strong>{crmRecords.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* BULK ACTIONS TOOLBAR (Appears when 1 or more rows selected) */}
      {selectedRecordIds.size > 0 && (
        <div className="bg-[#0B2545] text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 animate-view-in">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600 px-2 py-0.5 text-xs font-bold font-mono">
              {selectedRecordIds.size} Selected
            </span>
            <span className="text-xs font-medium text-blue-100">Bulk Operations:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Stage Mover */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-blue-200">Move Stage:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStageChange(e.target.value as CrmAssignmentStatus);
                    e.target.value = '';
                  }
                }}
                className="bg-blue-950 text-white border border-blue-800 text-xs px-2 py-1 font-medium"
                defaultValue=""
              >
                <option value="" disabled>
                  Select Stage...
                </option>
                {STAGE_PROGRESSION.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleBulkMarkAdvanceReceived}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              Mark Advance Received
            </button>

            <button
              type="button"
              onClick={() => {
                const selectedList = crmRecords.filter((r) => selectedRecordIds.has(r.id));
                exportCrmRecordsToCsv(selectedList);
              }}
              className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium transition-colors"
            >
              Export Selected
            </button>

            <button
              type="button"
              onClick={() =>
                setDeleteConfirmTarget({ type: 'bulk', count: selectedRecordIds.size })
              }
              className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete Selected
            </button>

            <button
              type="button"
              onClick={() => setSelectedRecordIds(new Set())}
              className="text-xs text-blue-300 hover:text-white ml-2 underline"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: ENTERPRISE SPREADSHEET (Smooth Scrolling, Non-Freezing Layout) */}
      {activeView === 'table' && (
        <div className="bg-white border border-slate-200 shadow-xs">
          {/* Scrollable Container with sticky header, NO brittle column freezes */}
          <div className="overflow-x-auto max-h-[640px] relative">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#0B2545] text-white z-10 font-sans shadow-xs select-none">
                <tr className="text-[10.5px] uppercase tracking-wider font-semibold divide-x divide-blue-900/40">
                  {/* Selection Checkbox */}
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredRecords.length > 0 &&
                        selectedRecordIds.size === filteredRecords.length
                      }
                      onChange={handleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>

                  {/* Sr. No */}
                  <th className="py-2.5 px-2.5 w-12 text-center">#</th>

                  {/* Client Name */}
                  <th
                    className="py-2.5 px-3 min-w-[220px] cursor-pointer hover:bg-blue-900 transition-colors"
                    onClick={() => toggleSort('clientName')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Lead / Client Name</span>
                      <ArrowUpDown className="w-3 h-3 text-blue-300" />
                    </div>
                  </th>

                  {/* Contact & WhatsApp */}
                  <th className="py-2.5 px-3 min-w-[170px]">Contact Person & WhatsApp</th>

                  {/* Scope / Deliverable */}
                  <th className="py-2.5 px-3 min-w-[190px]">Deliverable & Scope</th>

                  {/* Stage with Inline Selector */}
                  <th className="py-2.5 px-3 min-w-[170px]">Current Stage</th>

                  {/* Priority */}
                  <th className="py-2.5 px-2.5 min-w-[95px] text-center">Priority</th>

                  {/* Owner */}
                  <th className="py-2.5 px-3 min-w-[120px]">Owner</th>

                  {/* Commercials */}
                  <th
                    className="py-2.5 px-3 min-w-[120px] text-right cursor-pointer hover:bg-blue-900 transition-colors"
                    onClick={() => toggleSort('totalCommercial')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Fee (₹)</span>
                      <ArrowUpDown className="w-3 h-3 text-blue-300" />
                    </div>
                  </th>

                  <th className="py-2.5 px-3 min-w-[110px] text-right">Advance (₹)</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Advance Status</th>
                  <th className="py-2.5 px-3 min-w-[120px] text-right">Post-Deliv (₹)</th>

                  {/* Engagement Letter Link */}
                  <th className="py-2.5 px-3 min-w-[160px]">Engagement Letter</th>

                  {/* TAT */}
                  <th
                    className="py-2.5 px-2.5 min-w-[90px] text-center cursor-pointer hover:bg-blue-900 transition-colors"
                    onClick={() => toggleSort('tatDays')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>TAT (Days)</span>
                      <ArrowUpDown className="w-3 h-3 text-blue-300" />
                    </div>
                  </th>

                  <th className="py-2.5 px-3 min-w-[200px]">Next Action</th>

                  {/* Extended Columns in Full Mode */}
                  {columnViewMode === 'full' && (
                    <>
                      <th className="py-2.5 px-3 min-w-[140px]">Acquisition Source</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Email Address</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Start Date</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Delivery Date</th>
                      <th className="py-2.5 px-3 min-w-[120px] text-right">Invoice Value</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Upsell Potential</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Final Status</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Last Updated</th>
                    </>
                  )}

                  {/* Actions Column */}
                  <th className="py-2.5 px-3 text-center min-w-[160px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={columnViewMode === 'full' ? 24 : 16} className="py-12 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-2">
                        <Building className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-800">No client assignments match your filters.</p>
                        <p className="text-xs text-slate-400">
                          Try clearing filters or click &quot;+ Create Deal / Lead&quot; to register an opportunity.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const postDeliv =
                      rec.postDeliveryCommercial ||
                      autoCalculatePostDelivery(rec.totalCommercial, rec.advanceAmount);
                    const isSelected = selectedRecordIds.has(rec.id);

                    return (
                      <tr
                        key={rec.id}
                        className={`hover:bg-indigo-50/40 transition-colors divide-x divide-slate-100 text-xs ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRecord(rec.id)}
                            className="cursor-pointer"
                          />
                        </td>

                        {/* Sr. No */}
                        <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-500">
                          {rec.srNo}
                        </td>

                        {/* Client Name & Business - Opens Drawer */}
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => setInspectingRecord(rec)}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left block truncate max-w-[210px] group-hover:underline"
                            title={rec.clientName}
                          >
                            {rec.clientName}
                          </button>
                          <span className="text-[10.5px] text-slate-500 truncate block max-w-[210px]">
                            {rec.businessDetails || rec.location}
                          </span>
                        </td>

                        {/* Contact Person & Direct WhatsApp Link */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-slate-800 truncate" title={rec.contactPerson}>
                              {rec.contactPerson || '-'}
                            </span>
                            {rec.whatsappLink && (
                              <a
                                href={rec.whatsappLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors shrink-0"
                                title="Chat with client on WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {rec.cellNumber || '-'}
                          </span>
                        </td>

                        {/* Scope & Deliverable */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 truncate block text-[11px]" title={rec.natureOfDeliverable}>
                            {rec.natureOfDeliverable}
                          </span>
                          {rec.subDeliverablesList && rec.subDeliverablesList.length > 0 ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-800 border border-blue-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                                {rec.subDeliverablesList.filter((s) => s.completed).length}/{rec.subDeliverablesList.length} Milestones
                              </span>
                              <span className="text-[10px] text-slate-500 truncate" title={rec.natureOfSubDeliverable || rec.subDeliverablesList.map((s) => s.title).join(', ')}>
                                {rec.natureOfSubDeliverable || rec.subDeliverablesList.map((s) => s.title).join(', ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 truncate block" title={rec.natureOfSubDeliverable}>
                              {rec.natureOfSubDeliverable || '-'}
                            </span>
                          )}
                        </td>

                        {/* Current Stage with 1-Click Dropdown Switcher */}
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1">
                            <select
                              value={rec.assignmentStatus}
                              onChange={(e) =>
                                handleInlineStatusChange(rec.id, e.target.value as CrmAssignmentStatus)
                              }
                              className="w-full text-[11px] font-semibold bg-white border border-slate-200 py-1 px-1.5 focus:border-indigo-600 cursor-pointer"
                            >
                              {availableStages.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Priority Badge */}
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          {getPriorityBadge(rec.priority)}
                        </td>

                        {/* Owner */}
                        <td className="py-2.5 px-3 text-slate-700 text-[11px] font-medium whitespace-nowrap">
                          {rec.owner}
                        </td>

                        {/* Commercials: Total */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {isAdmin ? formatINR(rec.totalCommercial) : <RestrictedCell compact />}
                        </td>

                        {/* Advance Amount */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                          {isAdmin ? formatINR(rec.advanceAmount) : <RestrictedCell compact />}
                        </td>

                        {/* Advance Status with 1-Click Dropdown */}
                        <td className="py-2.5 px-2">
                          <select
                            value={rec.advanceReceiptStatus}
                            onChange={(e) =>
                              handleInlineAdvanceChange(
                                rec.id,
                                e.target.value as CrmClientRecord['advanceReceiptStatus']
                              )
                            }
                            className="w-full text-[10.5px] font-semibold bg-white border border-slate-200 py-1 px-1.5 focus:border-indigo-600 cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Received">Received</option>
                            <option value="Partially Received">Partial</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Waived">Waived</option>
                          </select>
                        </td>

                        {/* Post-Delivery Balance (Automated) */}
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-950 font-bold whitespace-nowrap bg-indigo-50/20">
                          {isAdmin ? formatINR(postDeliv) : <RestrictedCell compact />}
                        </td>

                        {/* Engagement Letter Reference / 1-Click Draft */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {rec.elNumber ? (
                            <button
                              type="button"
                              onClick={() => handleOpenOrDraftEngagement(rec)}
                              className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 font-mono text-[11px]"
                              title="Open Engagement Letter in Document Editor"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{rec.elNumber}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenOrDraftEngagement(rec)}
                              className="text-[10px] text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 font-bold flex items-center gap-1 transition-colors"
                            >
                              <Zap className="w-3 h-3 text-amber-600" />
                              + Draft EL
                            </button>
                          )}
                        </td>

                        {/* TAT (Days) */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono font-bold">
                          {rec.tatDays > 0 ? (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] ${
                                rec.tatDays <= 14
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : rec.tatDays <= 25
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'bg-amber-50 text-amber-900'
                              }`}
                            >
                              {rec.tatDays} d
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Next Action */}
                        <td className="py-2.5 px-3 max-w-[200px] text-[11px]">
                          <span className="text-slate-800 font-medium truncate block" title={rec.nextAction}>
                            {rec.nextAction || '-'}
                          </span>
                        </td>

                        {/* Extended Columns */}
                        {columnViewMode === 'full' && (
                          <>
                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]">{rec.leadGeneratedBy}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono text-[10.5px] truncate max-w-[150px]">{rec.email || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{rec.elStartDate || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{rec.reportDeliveryDate || '-'}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-right whitespace-nowrap">
                              {isAdmin ? formatINR(rec.invoiceValue) : <RestrictedCell compact />}
                            </td>
                            <td className="py-2.5 px-3 text-indigo-900 font-medium truncate max-w-[160px]">{rec.postCompletionPotential}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{rec.finalStatus}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">{rec.updatedAt}</td>
                          </>
                        )}

                        {/* Actions Column: Inspect, Edit, Delete */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setInspectingRecord(rec)}
                              className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="Inspect Deal Drawer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(rec);
                                setIsModalOpen(true);
                              }}
                              className="px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:text-white hover:bg-indigo-600 border border-indigo-200 transition-colors"
                              title="Edit All 34 Columns"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget({ type: 'single', record: rec })}
                              className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                              title="Delete Lead Record"
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
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <div>
              Showing <strong>{filteredRecords.length}</strong> of <strong>{crmRecords.length}</strong> client assignments
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>
                Filtered Pipeline: <strong className="text-slate-900">{formatINR(filteredRecords.reduce((acc, r) => acc + (r.totalCommercial || 0), 0))}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN PIPELINE BOARD */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-view-in">
          {[
            {
              title: '1. Discovery & Discussion',
              statuses: ['Lead Identified', 'In Discussion'] as CrmAssignmentStatus[],
              bg: 'bg-blue-50/50',
              border: 'border-blue-200',
              badge: 'bg-blue-100 text-blue-900',
            },
            {
              title: '2. Proposal & EL Active',
              statuses: ['Proposal / EL Sent', 'EL Signed & Active'] as CrmAssignmentStatus[],
              bg: 'bg-indigo-50/50',
              border: 'border-indigo-200',
              badge: 'bg-indigo-100 text-indigo-900',
            },
            {
              title: '3. Data & Financial Modeling',
              statuses: ['Data Collection', 'Execution & Modeling', 'Draft Delivered'] as CrmAssignmentStatus[],
              bg: 'bg-amber-50/50',
              border: 'border-amber-200',
              badge: 'bg-amber-100 text-amber-950',
            },
            {
              title: '4. Delivery & Retained',
              statuses: ['Final Report Delivered', 'Closed / Billed'] as CrmAssignmentStatus[],
              bg: 'bg-emerald-50/50',
              border: 'border-emerald-200',
              badge: 'bg-emerald-100 text-emerald-950',
            },
          ].map((col) => {
            const colRecords = filteredRecords.filter((r) => col.statuses.includes(r.assignmentStatus));
            const colValue = colRecords.reduce((acc, r) => acc + (r.totalCommercial || 0), 0);

            return (
              <div key={col.title} className={`${col.bg} border ${col.border} p-3 flex flex-col min-h-[520px]`}>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{col.title}</h3>
                    <div className="text-[11px] font-mono font-bold text-slate-600 mt-0.5">
                      {formatINR(colValue)}
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colRecords.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 mt-3 flex-1 overflow-y-auto pr-0.5">
                  {colRecords.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      No deals currently in this stage
                    </div>
                  ) : (
                    colRecords.map((r) => {
                      const currStageIdx = STAGE_PROGRESSION.indexOf(r.assignmentStatus);
                      const prevStage = currStageIdx > 0
                        ? STAGE_PROGRESSION[currStageIdx - 1]
                        : null;
                      const nextStage = currStageIdx >= 0 && currStageIdx < STAGE_PROGRESSION.length - 1
                        ? STAGE_PROGRESSION[currStageIdx + 1]
                        : null;

                      return (
                        <div
                          key={r.id}
                          className="bg-white border border-slate-200 p-3 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setInspectingRecord(r)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left text-xs line-clamp-1 group-hover:underline"
                            >
                              {r.clientName}
                            </button>
                            {getPriorityBadge(r.priority)}
                          </div>

                          <div className="text-[11px] text-slate-600 line-clamp-1">
                            {r.natureOfDeliverable}
                          </div>

                          {/* Sub-deliverables milestone progress pill */}
                          {r.subDeliverablesList && r.subDeliverablesList.length > 0 && (
                            <div className="flex items-center gap-1 text-[9.5px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                              <span>
                                {r.subDeliverablesList.filter((s) => s.completed).length}/{r.subDeliverablesList.length} Sub-deliverables
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            {isAdmin ? (
                              <>
                                <span className="font-mono font-bold text-slate-900">
                                  {formatINR(r.totalCommercial)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Adv: {formatINR(r.advanceAmount)}
                                </span>
                              </>
                            ) : (
                              <RestrictedCell compact />
                            )}
                          </div>

                          {/* 1-Click Quick Stage Movement (Forward & Back) */}
                          {(prevStage || nextStage) && (
                            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                              {prevStage ? (
                                <button
                                  type="button"
                                  onClick={() => handleInlineStatusChange(r.id, prevStage)}
                                  className="py-1 px-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-bold text-[9.5px] transition-colors flex items-center justify-start gap-1 border border-slate-200"
                                  title={`Roll back activity to ${prevStage}`}
                                >
                                  <ArrowLeft className="w-2.5 h-2.5 shrink-0 text-amber-700" />
                                  <span className="truncate">Back: {prevStage}</span>
                                </button>
                              ) : (
                                <div />
                              )}
                              {nextStage ? (
                                <button
                                  type="button"
                                  onClick={() => handleInlineStatusChange(r.id, nextStage)}
                                  className={`py-1 px-1.5 bg-slate-100 hover:bg-[#0B2545] text-slate-700 hover:text-white font-bold text-[9.5px] transition-colors flex items-center justify-between group border border-slate-200 ${
                                    !prevStage ? 'col-span-2' : ''
                                  }`}
                                  title={`Advance activity to ${nextStage}`}
                                >
                                  <span className="truncate">Move: {nextStage}</span>
                                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                </button>
                              ) : null}
                            </div>
                          )}

                          {/* Quick action bar */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenOrDraftEngagement(r)}
                                className="text-indigo-700 hover:underline font-bold flex items-center gap-0.5 text-[10.5px]"
                              >
                                {r.elNumber ? (
                                  <>
                                    <FileText className="w-3 h-3 text-indigo-500" />
                                    {r.elNumber}
                                  </>
                                ) : (
                                  '+ Draft EL'
                                )}
                              </button>

                              {r.whatsappLink && (
                                <a
                                  href={r.whatsappLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-800"
                                  title="Open WhatsApp chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => setInspectingRecord(r)}
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 text-[10px] font-medium"
                                title="View Touchpoints & History"
                              >
                                <Clock className="w-3 h-3" />
                                <span>{(r.activities || []).length}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRecord(r);
                                  setIsModalOpen(true);
                                }}
                                className="text-slate-500 hover:text-indigo-600 font-medium text-[10.5px]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmTarget({ type: 'single', record: r })}
                                className="text-slate-400 hover:text-rose-600"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: MARKETING & DEAL ANALYTICS */}
      {activeView === 'analytics' && (
        <div className="space-y-4 animate-view-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chart 1: Revenue by Deliverable */}
            <div className="bg-white border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Pipeline by Deliverable Scope
              </h3>
              <div className="space-y-2.5 text-xs">
                {Array.from(new Set(crmRecords.map((r) => r.natureOfDeliverable))).map((d) => {
                  const items = crmRecords.filter((r) => r.natureOfDeliverable === d);
                  const val = items.reduce((acc, r) => acc + (r.totalCommercial || 0), 0);
                  const pct =
                    metrics.totalPipelineValue > 0
                      ? Math.round((val / metrics.totalPipelineValue) * 100)
                      : 0;
                  return (
                    <div key={d} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">{d}</span>
                        <span className="font-mono text-slate-600">{formatINR(val)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Lead Acquisition Source */}
            <div className="bg-white border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Acquisition Sources Performance
              </h3>
              <div className="space-y-2.5 text-xs">
                {Array.from(new Set(crmRecords.map((r) => r.leadGeneratedBy))).map((src) => {
                  const items = crmRecords.filter((r) => r.leadGeneratedBy === src);
                  const val = items.reduce((acc, r) => acc + (r.totalCommercial || 0), 0);
                  const pct =
                    metrics.totalPipelineValue > 0
                      ? Math.round((val / metrics.totalPipelineValue) * 100)
                      : 0;
                  return (
                    <div key={src} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">{src}</span>
                        <span className="font-mono text-slate-600">{items.length} leads • {formatINR(val)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 3: Collection Efficiency */}
            <div className="bg-white border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Receivables & Cash Flow Split
              </h3>
              <div className="space-y-3 text-xs pt-2">
                <div className="bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-[11px] font-bold text-emerald-900 uppercase">Advance Realized</div>
                  <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">
                    {formatINR(metrics.totalAdvanceCollected)}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">Deposited into firm / personal account</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3">
                  <div className="text-[11px] font-bold text-amber-900 uppercase">Advance Pending Collection</div>
                  <div className="text-base font-bold font-mono text-amber-800 mt-0.5">
                    {formatINR(metrics.totalAdvancePending)}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">Follow-up needed before initiating draft work</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">Post-Delivery Balance Receivable</div>
                  <div className="text-base font-bold font-mono text-indigo-950 mt-0.5">
                    {formatINR(metrics.totalPostDeliveryCommercial)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Payable on delivery of valuation/model report</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HUBSPOT SLIDE-OVER RECORD INSPECTOR DRAWER */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-view-in">
            {/* Drawer Header */}
            <div className="bg-[#0B2545] text-white p-5 shrink-0 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600/70 text-white text-[10px] font-mono font-bold px-2 py-0.5">
                    Sr. #{inspectingRecord.srNo}
                  </span>
                  {getPriorityBadge(inspectingRecord.priority)}
                </div>
                <h2 className="text-lg font-bold mt-1 text-white tracking-tight">
                  {inspectingRecord.clientName}
                </h2>
                <p className="text-xs text-blue-200 mt-0.5">
                  {inspectingRecord.location} • {inspectingRecord.natureOfDeliverable}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="text-white/70 hover:text-white p-1 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Stage Progression Stepper */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Deal Pipeline Stage (Click to advance)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STAGE_PROGRESSION.map((st) => {
                  const isCurrent = inspectingRecord.assignmentStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleInlineStatusChange(inspectingRecord.id, st)}
                      className={`text-[10px] font-semibold px-2 py-1 border transition-colors ${
                        isCurrent
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Button Strip */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenOrDraftEngagement(inspectingRecord)}
                className="px-3 py-1.5 bg-[#0B2545] hover:bg-[#133E6D] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                {inspectingRecord.elNumber ? 'Open Engagement Letter' : 'Draft Engagement Letter'}
              </button>

              {inspectingRecord.whatsappLink && (
                <a
                  href={inspectingRecord.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat WhatsApp
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditingRecord(inspectingRecord);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Full Record
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteConfirmTarget({ type: 'single', record: inspectingRecord })
                }
                className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-medium transition-colors flex items-center gap-1"
                title="Delete Lead Record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>

            {/* Drawer Body Properties */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Financials & Milestones */}
              <div className="bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Commercials & Billing Split
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-500 text-[10px]">Total Commercial</div>
                    <div className="text-base font-black font-mono text-slate-900">
                      {formatINR(inspectingRecord.totalCommercial)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Advance Agreed</div>
                    <div className="text-base font-bold font-mono text-slate-800">
                      {formatINR(inspectingRecord.advanceAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Advance Status</div>
                    <div className="mt-0.5">{getAdvanceBadge(inspectingRecord.advanceReceiptStatus)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Post-Delivery Due</div>
                    <div className="text-base font-bold font-mono text-indigo-950">
                      {formatINR(
                        inspectingRecord.postDeliveryCommercial ||
                          autoCalculatePostDelivery(
                            inspectingRecord.totalCommercial,
                            inspectingRecord.advanceAmount
                          )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 border border-slate-200 p-4">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Contact & Organization
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Contact Person</span>
                    <span className="font-semibold text-slate-900">{inspectingRecord.contactPerson || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Phone / WhatsApp</span>
                    <span className="font-mono text-slate-800">{inspectingRecord.cellNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Email</span>
                    <span className="font-mono text-slate-800">{inspectingRecord.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Location</span>
                    <span className="text-slate-800">{inspectingRecord.location}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 text-[10px] block">Business Details</span>
                    <p className="text-slate-700 mt-0.5">{inspectingRecord.businessDetails || 'No business details provided.'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Scope & Turnaround */}
              <div className="space-y-2 border border-slate-200 p-4">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  Scope & Timelines
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Deliverable</span>
                    <span className="font-semibold text-slate-900">{inspectingRecord.natureOfDeliverable}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Sub-Deliverable</span>
                    <span className="text-slate-800">{inspectingRecord.natureOfSubDeliverable || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Start Date</span>
                    <span className="font-mono text-slate-800">{inspectingRecord.elStartDate || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Report Delivery Date</span>
                    <span className="font-mono text-slate-800">{inspectingRecord.reportDeliveryDate || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Turnaround Time (TAT)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {inspectingRecord.tatDays ? `${inspectingRecord.tatDays} Days` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Owner (Consultant)</span>
                    <span className="font-semibold text-slate-800">{inspectingRecord.owner}</span>
                  </div>
                </div>

                {/* Granular Sub-Deliverables Checklist */}
                {inspectingRecord.subDeliverablesList && inspectingRecord.subDeliverablesList.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Itemized Milestones & Sub-deliverables ({inspectingRecord.subDeliverablesList.filter((s) => s.completed).length}/{inspectingRecord.subDeliverablesList.length})
                      </span>
                    </div>
                    <div className="space-y-1.5 bg-slate-50 p-2.5 border border-slate-200">
                      {inspectingRecord.subDeliverablesList.map((sub) => (
                        <label
                          key={sub.id}
                          className="flex items-start gap-2 text-[11px] text-slate-800 cursor-pointer hover:bg-white p-1 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={!!sub.completed}
                            onChange={() => {
                              const recordId = inspectingRecord.id;
                              const updated = crmRecords.map((r) => {
                                if (r.id !== recordId) return r;
                                const subs = (r.subDeliverablesList || []).map((s) =>
                                  s.id === sub.id ? { ...s, completed: !s.completed } : s
                                );
                                return {
                                  ...r,
                                  subDeliverablesList: subs,
                                  updatedAt: getFormattedNow(),
                                };
                              });
                              onSaveCrmRecords(updated);
                              setInspectingRecord({
                                ...inspectingRecord,
                                subDeliverablesList: (inspectingRecord.subDeliverablesList || []).map((s) =>
                                  s.id === sub.id ? { ...s, completed: !s.completed } : s
                                ),
                                updatedAt: getFormattedNow(),
                              });
                            }}
                            className="mt-0.5 rounded text-[#0B2545] focus:ring-0"
                          />
                          <span className={sub.completed ? 'line-through text-slate-400 font-normal' : 'font-medium text-slate-900'}>
                            {sub.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action & Notes */}
              <div className="space-y-2 border border-slate-200 p-4">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Next Action & Advisory Notes
                </div>
                <div className="bg-amber-50/70 border border-amber-200 p-3 mt-1">
                  <div className="text-[10px] font-bold text-amber-900 uppercase">Immediate Next Step</div>
                  <p className="text-slate-800 font-semibold mt-0.5">{inspectingRecord.nextAction || 'None specified'}</p>
                </div>
                {inspectingRecord.remarks && (
                  <div className="pt-2 text-slate-600">
                    <span className="text-slate-500 text-[10px] block font-bold">Internal Remarks</span>
                    <p className="mt-0.5">{inspectingRecord.remarks}</p>
                  </div>
                )}
              </div>

              {/* Client Touchpoints & Activity Timeline (HubSpot Style) */}
              <div className="border border-slate-200 p-4 bg-white">
                <CrmActivityTimeline
                  activities={inspectingRecord.activities || []}
                  onAddActivity={(activity) => handleAddActivity(inspectingRecord.id, activity)}
                  onDeleteActivity={(activityId) => handleDeleteActivity(inspectingRecord.id, activityId)}
                  currentUser={inspectingRecord.owner || 'Advisor'}
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Last Updated: {inspectingRecord.updatedAt}</span>
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED IN-APP DELETE CONFIRMATION MODAL (Apple spring animation & Dustbin preservation) */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="bg-white border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center rounded-full shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {deleteConfirmTarget.type === 'single'
                      ? 'Move Lead to Dustbin'
                      : `Move ${deleteConfirmTarget.count} Leads to Dustbin`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {deleteConfirmTarget.type === 'single'
                      ? `"${deleteConfirmTarget.record.clientName}" will be recycled and stored with exact millisecond timestamp.`
                      : `${deleteConfirmTarget.count} client leads will be safely preserved in your Dustbin.`}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Full Restoration Guaranteed
                </div>
                <p className="text-[11px] text-slate-500">
                  This record will be saved in your Dustbin with millisecond accuracy. You can restore it anytime with 1-click.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmTarget.type === 'single') {
                      executeSingleDelete(deleteConfirmTarget.record.id);
                    } else {
                      executeBulkDelete();
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs"
                >
                  Yes, Move to Dustbin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 34-Column Full Record Modal for Add / Edit */}
      <CrmRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        onSave={handleSaveRecord}
        onDelete={(id) => {
          const rec = crmRecords.find((r) => r.id === id);
          if (rec) {
            executeSingleDelete(id);
          }
        }}
        onCreateEngagementLetter={onCreateEngagementFromCrm}
        nextSrNo={crmRecords.length + 1}
        customTaxonomy={customTaxonomy}
      />
    </div>
  );
};
