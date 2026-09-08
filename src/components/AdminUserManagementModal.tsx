import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Users,
  KeyRound,
  EyeOff,
  Eye,
  Ban,
  Filter,
  History,
  Check,
  Clock,
  Download,
  AlertCircle,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AppUser, UserRole, AuthLogEntry } from '../types';
import { dispatchToast } from './NotificationToast';
import {
  RESTRICTION_DEFINITIONS,
  RestrictionDefinition,
  PRESET_RESTRICTION_BUNDLES,
  isRestricted,
} from '../utils/permissions';
import { subscribeToAuthLogs, getStoredAuthLogs, logAuthEvent } from '../utils/authLogService';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AppUser | null;
  currentUserId?: string;
  allUsers?: AppUser[];
  users?: AppUser[];
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (uid: string) => Promise<void>;
}

const PRESET_JOB_TITLES = [
  'Managing Partner & Practice Head',
  'Senior Partner - Advisory & Strategy',
  'Partner - Direct Tax & Litigation',
  'Audit & Assurance Manager',
  'Corporate Finance & Valuation Specialist',
  'Senior Advisory Consultant',
  'Associate - Risk Advisory',
  'Client Engagement Executive',
];

const PRESET_DEPARTMENTS = [
  'Executive Leadership',
  'Corporate Advisory & Strategy',
  'Direct Tax & Corporate Law',
  'Statutory Audit & Assurance',
  'Government Subsidies & PSI Compliance',
  'Transaction Advisory & Valuation',
];

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentUserId,
  allUsers,
  users,
  onSaveUser,
  onDeleteUser,
}) => {
  const usersList = allUsers || users || [];
  const [activeTab, setActiveTab] = useState<'users' | 'audit_logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authLogs, setAuthLogs] = useState<AuthLogEntry[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Load real-time authentication & security audit logs
  useEffect(() => {
    if (!isOpen) return;
    setAuthLogs(getStoredAuthLogs());
    const unsubscribe = subscribeToAuthLogs((logs) => {
      setAuthLogs(logs);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // STRICT ACCESS CONTROL GUARD:
  // If the current user does NOT have the Admin role, completely block access!
  const isActuallyAdmin = currentUser?.role === 'Admin';
  if (!isActuallyAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans select-none">
        <div className="bg-[#F6F6F8] border border-black/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800 animate-in fade-in zoom-in-95">
          {/* macOS Title Bar */}
          <div className="h-10 bg-[#EBEBEF] border-b border-[#D2D2D7]/80 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-slate-700">Security Alert</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-800 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto ring-4 ring-red-50">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Administrator Authorization Required
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Access Denied: Your account role (<strong>{currentUser?.role || 'Associate'}</strong>) does not have system administration privileges. Only practice administrators can manage user accounts, assign roles, or modify security restrictions.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 bg-[#0B2545] hover:bg-[#133863] text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Dismiss & Return
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = (usersList || []).filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.loginId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = authLogs.filter((log) => {
    const matchesAction = logFilterAction === 'ALL' || log.action === logFilterAction;
    const matchesSearch =
      log.userName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingUser({
      uid: `user-${Date.now()}`,
      displayName: '',
      email: '',
      loginId: '',
      password: '123',
      jobTitle: 'Associate Consultant',
      department: 'Corporate Advisory & Strategy',
      role: 'Associate',
      status: 'Active',
      phone: '',
      photoUrl: '',
      restrictedItems: [],
      createdAt: new Date().toISOString(),
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser({
      ...user,
      loginId: user.loginId || user.email || '123',
      password: user.password || '123',
      restrictedItems: user.restrictedItems ? [...user.restrictedItems] : [],
    });
    setIsEditing(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      dispatchToast({ title: 'File Too Large', message: 'Please upload an image smaller than 5MB.', type: 'warning' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 240, 240);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setEditingUser((prev) => (prev ? { ...prev, photoUrl: dataUrl } : null));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleToggleRestriction = (restrictionId: string) => {
    if (!editingUser) return;
    const current = editingUser.restrictedItems || [];
    const next = current.includes(restrictionId)
      ? current.filter((id) => id !== restrictionId)
      : [...current, restrictionId];
    setEditingUser({ ...editingUser, restrictedItems: next });
  };

  // Toggle all items within a category
  const handleToggleCategory = (categoryName: string) => {
    if (!editingUser) return;
    const categoryDefs = RESTRICTION_DEFINITIONS.filter((d) => d.category === categoryName);
    const categoryIds = categoryDefs.map((d) => d.id);
    const current = editingUser.restrictedItems || [];
    const allSelected = categoryIds.every((id) => current.includes(id));

    let next: string[];
    if (allSelected) {
      // Unselect all in this category
      next = current.filter((id) => !categoryIds.includes(id));
    } else {
      // Select all in this category
      next = Array.from(new Set([...current, ...categoryIds]));
    }
    setEditingUser({ ...editingUser, restrictedItems: next });
  };

  // One-click preset applications
  const handleApplyPreset = (presetId: string) => {
    if (!editingUser) return;
    const bundle = PRESET_RESTRICTION_BUNDLES.find((b) => b.id === presetId);
    if (bundle) {
      setEditingUser({ ...editingUser, restrictedItems: [...bundle.restrictedItems] });
      dispatchToast({
        title: 'Preset Applied',
        message: `Applied "${bundle.name}" restrictions (${bundle.restrictedItems.length} items restricted).`,
        type: 'info',
      });
    }
  };

  const handleSelectAllRestrictions = () => {
    if (!editingUser) return;
    const allIds = RESTRICTION_DEFINITIONS.map((d) => d.id);
    setEditingUser({ ...editingUser, restrictedItems: allIds });
  };

  const handleClearAllRestrictions = () => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, restrictedItems: [] });
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.displayName?.trim()) {
      dispatchToast({ title: 'Validation Error', message: 'Please enter Display Name.', type: 'warning' });
      return;
    }

    const cleanLoginId = editingUser.loginId?.trim() || editingUser.email?.trim() || '123';
    const cleanPassword = editingUser.password?.trim() || '123';

    setIsSubmitting(true);
    try {
      const finalUser: AppUser = {
        uid: editingUser.uid || `user-${Date.now()}`,
        displayName: editingUser.displayName.trim(),
        email: editingUser.email?.trim().toLowerCase() || `${cleanLoginId}@gfpadvisory.in`,
        loginId: cleanLoginId,
        password: cleanPassword,
        jobTitle: editingUser.jobTitle?.trim() || 'Associate Consultant',
        department: editingUser.department?.trim() || 'Corporate Advisory & Strategy',
        role: editingUser.role || 'Associate',
        status: editingUser.status || 'Active',
        phone: editingUser.phone?.trim() || '',
        photoUrl: editingUser.photoUrl || '',
        restrictedItems: editingUser.restrictedItems || [],
        createdAt: editingUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveUser(finalUser);

      await logAuthEvent({
        userId: currentUser?.loginId || currentUser?.uid || 'admin',
        userName: currentUser?.displayName || 'Administrator',
        role: currentUser?.role || 'Admin',
        action: 'USER_UPDATED',
        details: `Saved account "${finalUser.displayName}" (${finalUser.role}) with ${finalUser.restrictedItems?.length || 0} active restrictions.`,
      });

      dispatchToast({
        title: 'User Saved Successfully',
        message: `${finalUser.displayName} account and permissions updated.`,
        type: 'success',
      });

      setIsEditing(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to save user:', err);
      dispatchToast({ title: 'Save Failed', message: 'Could not write user to database.', type: 'warning' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUserClick = async (user: AppUser) => {
    if (user.uid === currentUser?.uid) {
      dispatchToast({ title: 'Action Denied', message: 'Cannot delete your own active administrator account.', type: 'warning' });
      return;
    }
    if (confirm(`Are you sure you want to delete user "${user.displayName}"? This action is permanent.`)) {
      try {
        await onDeleteUser(user.uid);
        await logAuthEvent({
          userId: currentUser?.loginId || currentUser?.uid || 'admin',
          userName: currentUser?.displayName || 'Administrator',
          role: currentUser?.role || 'Admin',
          action: 'USER_DELETED',
          details: `Permanently deleted account "${user.displayName}" (ID: ${user.loginId || user.email}).`,
        });
        dispatchToast({ title: 'User Deleted', message: `${user.displayName} has been removed.`, type: 'info' });
      } catch (err) {
        console.error('Failed to delete user:', err);
        dispatchToast({ title: 'Error Deleting User', message: 'Could not delete user document.', type: 'warning' });
      }
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    if (user.uid === currentUser?.uid) {
      dispatchToast({ title: 'Action Denied', message: 'Cannot suspend your own active administrator account.', type: 'warning' });
      return;
    }
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await onSaveUser({ ...user, status: newStatus, updatedAt: new Date().toISOString() });
      await logAuthEvent({
        userId: currentUser?.loginId || currentUser?.uid || 'admin',
        userName: currentUser?.displayName || 'Administrator',
        role: currentUser?.role || 'Admin',
        action: 'USER_UPDATED',
        details: `Changed account status of "${user.displayName}" to ${newStatus}.`,
      });
      dispatchToast({
        title: `Account ${newStatus}`,
        message: `${user.displayName} has been marked as ${newStatus}.`,
        type: 'info',
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Group restrictions by category
  const groupedRestrictions = RESTRICTION_DEFINITIONS.reduce((acc, def) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push(def);
    return acc;
  }, {} as Record<string, RestrictionDefinition[]>);

  const categories = Object.keys(groupedRestrictions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs font-sans select-none overflow-y-auto">
      {/* Apple macOS Window Frame - Notice: NO three corner dots */}
      <div className="bg-[#F6F6F8] border border-black/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* macOS Title Bar */}
        <div className="h-11 bg-[#EBEBEF] border-b border-[#D2D2D7]/80 px-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#0B2545] flex items-center justify-center text-white text-[10px] font-bold shadow-2xs">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Security Governance</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Role-Based Access Control</span>
          </div>

          {/* Centered Title */}
          <div className="text-xs font-bold text-slate-800 tracking-tight text-center truncate max-w-[280px]">
            User Accounts & Security Permissions
          </div>

          {/* Clean macOS Close Button (NO 3 corner dots) */}
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
            title="Close Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* macOS Navigation Bar with Segmented Control Pills */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#F2F2F5] border-b border-[#D2D2D7]/70 shrink-0">
          <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('users');
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Team Members</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] font-mono rounded-full font-bold">
                {usersList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('audit_logs');
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit & Login Logs</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded-full font-bold">
                {authLogs.length}
              </span>
            </button>
          </div>

          {activeTab === 'users' && !isEditing && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] hover:bg-[#133863] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Member</span>
            </button>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
          {activeTab === 'users' && (
            isEditing && editingUser ? (
              /* User Edit / Create Form */
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
                <form onSubmit={handleSaveUserSubmit} className="max-w-4xl mx-auto space-y-6">
                  {/* Form Top Title */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {editingUser.uid && usersList.some((u) => u.uid === editingUser.uid)
                          ? `Edit Account: ${editingUser.displayName || editingUser.loginId}`
                          : 'Create New Team Member'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Configure user credentials, circular avatar, and granular visibility & deletion restrictions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingUser(null);
                      }}
                      className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
                    >
                      Back to Directory
                    </button>
                  </div>

                  {/* Profile Photo & Credentials Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Left: Avatar Column */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full border-2 border-[#0B2545] shadow-md overflow-hidden bg-white flex items-center justify-center mb-3">
                        {editingUser.photoUrl ? (
                          <img
                            src={editingUser.photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#0B2545] text-white flex flex-col items-center justify-center">
                            <User className="w-8 h-8 text-amber-300 mb-0.5" />
                            <span className="text-[8px] font-bold text-slate-300">AVATAR</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900 mb-1">Circular Photo</div>
                      <p className="text-[10px] text-slate-500 mb-3">
                        Appears round on the macOS login screen and audit logs.
                      </p>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Middle & Right: Inputs */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={editingUser.displayName || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                          placeholder="e.g. Adv. Rohit Sharma"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900 font-medium"
                        />
                      </div>

                      {/* Login ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Login ID *</label>
                        <input
                          type="text"
                          required
                          value={editingUser.loginId || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, loginId: e.target.value })}
                          placeholder="e.g. rohit.sharma or 123"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900 font-mono font-medium"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editingUser.email || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          placeholder="e.g. rohit@gfpadvisory.in"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Password *</label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[10px] text-[#0B2545] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showPassword ? 'Hide' : 'Show'}</span>
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={editingUser.password || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                          placeholder="Password (default: 123)"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900 font-mono font-medium"
                        />
                      </div>

                      {/* System Role */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                        <select
                          value={editingUser.role || 'Associate'}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900 font-semibold"
                        >
                          <option value="Admin">Admin (Full System Authority)</option>
                          <option value="Partner">Partner (Commercial Clearance & Execution)</option>
                          <option value="Associate">Associate (Operational Advisory)</option>
                          <option value="Viewer">Viewer (Read-Only Reviewer)</option>
                        </select>
                      </div>

                      {/* Account Status */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                        <select
                          value={editingUser.status || 'Active'}
                          onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'Active' | 'Suspended' })}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900"
                        >
                          <option value="Active">Active (Permit Login)</option>
                          <option value="Suspended">Suspended (Revoke Access)</option>
                        </select>
                      </div>

                      {/* Job Title */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                        <input
                          type="text"
                          list="job-title-suggestions"
                          value={editingUser.jobTitle || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                          placeholder="e.g. Senior Advisory Consultant"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900"
                        />
                        <datalist id="job-title-suggestions">
                          {PRESET_JOB_TITLES.map((t) => (
                            <option key={t} value={t} />
                          ))}
                        </datalist>
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Practice / Department</label>
                        <input
                          type="text"
                          list="department-suggestions"
                          value={editingUser.department || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                          placeholder="e.g. Corporate Advisory"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900"
                        />
                        <datalist id="department-suggestions">
                          {PRESET_DEPARTMENTS.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* =========================================================================
                      GRANULAR PERMISSION & RESTRICTION CONTROLS
                     ========================================================================= */}
                  <div className="pt-5 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <EyeOff className="w-4 h-4 text-red-600" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            Granular Visibility, Creation & Deletion Controls
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Check items that this user <strong>CANNOT</strong> see or perform:
                        </p>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-semibold">Bundles:</span>
                        {PRESET_RESTRICTION_BUNDLES.map((bundle) => (
                          <button
                            key={bundle.id}
                            type="button"
                            onClick={() => handleApplyPreset(bundle.id)}
                            className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-medium cursor-pointer transition-colors"
                            title={bundle.description}
                          >
                            {bundle.name.split(' (')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Restriction Status & Mass Toggles */}
                    <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span>Active Restrictions:</span>
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold font-mono text-[11px]">
                          {(editingUser.restrictedItems || []).length} of {RESTRICTION_DEFINITIONS.length} restricted
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllRestrictions}
                          className="px-2.5 py-1 text-[11px] bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 font-semibold cursor-pointer"
                        >
                          Restrict All Items
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllRestrictions}
                          className="px-2.5 py-1 text-[11px] bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 font-semibold cursor-pointer"
                        >
                          Clear All (Unrestricted)
                        </button>
                      </div>
                    </div>

                    {/* Category-by-Category Granular Checkboxes */}
                    <div className="space-y-4">
                      {Object.entries(groupedRestrictions).map(([category, items]) => {
                        const restrictedInCategory = items.filter((i) =>
                          (editingUser.restrictedItems || []).includes(i.id)
                        ).length;

                        return (
                          <div key={category} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#0B2545]">{category}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-semibold">
                                  {restrictedInCategory} / {items.length} restricted
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleCategory(category)}
                                className="text-[11px] text-[#0B2545] hover:underline font-semibold cursor-pointer"
                              >
                                {restrictedInCategory === items.length ? 'Clear Category' : 'Toggle Category'}
                              </button>
                            </div>

                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {items.map((def) => {
                                const isChecked = (editingUser.restrictedItems || []).includes(def.id);
                                return (
                                  <label
                                    key={def.id}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer select-none ${
                                      isChecked
                                        ? 'bg-red-50/70 border-red-300 text-red-950'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleRestriction(def.id)}
                                      className="mt-0.5 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-xs font-bold ${isChecked ? 'text-red-900' : 'text-slate-800'}`}>
                                        {def.label}
                                      </div>
                                      <div className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                                        {def.description}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action Buttons: Cancel and Save */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingUser(null);
                      }}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-6 py-2 bg-[#0B2545] hover:bg-[#133863] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span>{isSubmitting ? 'Saving User...' : 'Save User & Permissions'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Users Directory Table */
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F8F9FA]">
                {/* Search and Role Filter Bar */}
                <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, ID, title..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-500 font-medium">Role:</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none"
                    >
                      <option value="All">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Partner">Partner</option>
                      <option value="Associate">Associate</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                {/* Users List Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#F6F6F8] text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Team Member</th>
                          <th className="px-4 py-3">Login ID / Email</th>
                          <th className="px-4 py-3">Role & Department</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Restrictions</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredUsers.map((u) => {
                          const isCurrent = u.uid === currentUser?.uid;
                          const restrictionsCount = (u.restrictedItems || []).length;
                          return (
                            <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                              {/* Member */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full border border-slate-300 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                                    {u.photoUrl ? (
                                      <img
                                        src={u.photoUrl}
                                        alt={u.displayName}
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    ) : (
                                      <div className="w-full h-full rounded-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs">
                                        {u.displayName
                                          .split(' ')
                                          .map((w) => w[0])
                                          .slice(0, 2)
                                          .join('')}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{u.displayName}</span>
                                      {isCurrent && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[9px] font-semibold">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500">{u.jobTitle || 'Associate'}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Login ID */}
                              <td className="px-4 py-3">
                                <div className="font-mono text-xs font-bold text-slate-800">
                                  {u.loginId || u.email}
                                </div>
                                <div className="text-[10.5px] text-slate-400 truncate max-w-[180px]">
                                  {u.email}
                                </div>
                              </td>

                              {/* Role */}
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                                  u.role === 'Admin'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : u.role === 'Partner'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}>
                                  {u.role}
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px]">
                                  {u.department}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  disabled={isCurrent}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                    u.status === 'Active'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                  } disabled:cursor-default`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span>{u.status || 'Active'}</span>
                                </button>
                              </td>

                              {/* Restrictions */}
                              <td className="px-4 py-3">
                                {restrictionsCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-mono font-bold text-[10.5px]">
                                    <EyeOff className="w-3 h-3 text-red-600" />
                                    <span>{restrictionsCount} restricted</span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Full Access
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(u)}
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    title="Edit permissions & credentials"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {!isCurrent && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUserClick(u)}
                                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Delete user"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'audit_logs' && (
            /* Audit & Login Logs View */
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F8F9FA]">
              {/* Filter bar */}
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Search logs by user, action, remarks..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 bg-white text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Action:</span>
                  <select
                    value={logFilterAction}
                    onChange={(e) => setLogFilterAction(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="LOGIN">LOGIN</option>
                    <option value="LOGOUT">LOGOUT</option>
                    <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
                    <option value="USER_UPDATED">USER_UPDATED</option>
                    <option value="USER_DELETED">USER_DELETED</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#F6F6F8] text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Event Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {log.userName}
                            <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                              ({log.userId})
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              log.action === 'LOGIN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'LOGOUT'
                                ? 'bg-slate-100 text-slate-700'
                                : log.action.includes('DELETED')
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 text-xs">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            No security audit logs found matching filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
