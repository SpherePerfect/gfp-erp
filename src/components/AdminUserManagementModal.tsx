import React, { useState, useRef } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
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
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { dispatchToast } from './NotificationToast';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  allUsers: AppUser[];
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
  'Transaction Advisory & Valuations',
  'Statutory Audit & Assurance',
  'Taxation & Regulatory Affairs',
  'Client Relations & Marketing',
];

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSaveUser,
  onDeleteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<AppUser> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'Admin';

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenCreate = () => {
    setEditingUser({
      uid: `user-${Date.now()}`,
      displayName: '',
      email: '',
      jobTitle: 'Associate Consultant',
      department: 'Corporate Advisory & Strategy',
      role: 'Associate',
      status: 'Active',
      phone: '',
      photoUrl: '',
      createdAt: new Date().toISOString(),
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser({ ...user });
    setIsEditing(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatchToast({ title: 'Invalid File', message: 'Please select an image file (PNG, JPG, WebP).', type: 'warning' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      dispatchToast({ title: 'File Too Large', message: 'Please upload an image smaller than 2MB.', type: 'warning' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditingUser((prev) => (prev ? { ...prev, photoUrl: dataUrl } : null));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.displayName?.trim() || !editingUser?.email?.trim()) {
      dispatchToast({ title: 'Validation Error', message: 'Please enter both Display Name and Email Address.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalUser: AppUser = {
        uid: editingUser.uid || `user-${Date.now()}`,
        displayName: editingUser.displayName.trim(),
        email: editingUser.email.trim().toLowerCase(),
        jobTitle: editingUser.jobTitle?.trim() || 'Associate Consultant',
        department: editingUser.department?.trim() || 'General Advisory',
        role: editingUser.role || 'Associate',
        status: editingUser.status || 'Active',
        phone: editingUser.phone?.trim() || '',
        photoUrl: editingUser.photoUrl || '',
        createdAt: editingUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveUser(finalUser);
      dispatchToast({
        title: 'User Profile Saved',
        message: `Account for ${finalUser.displayName} (${finalUser.role}) has been saved to Firestore.`,
        type: 'success',
      });
      setIsEditing(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to save user account:', err);
      dispatchToast({ title: 'Error Saving User', message: 'Could not write user profile to database.', type: 'warning' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUserClick = async (user: AppUser) => {
    if (user.uid === currentUser?.uid) {
      dispatchToast({ title: 'Operation Forbidden', message: 'You cannot delete your own active Admin account.', type: 'warning' });
      return;
    }

    if (confirm(`Are you sure you want to delete user account "${user.displayName}" (${user.email})? This action will remove access immediately.`)) {
      try {
        await onDeleteUser(user.uid);
        dispatchToast({ title: 'User Account Deleted', message: `${user.displayName} has been removed from database.`, type: 'info' });
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
      dispatchToast({
        title: `Account ${newStatus}`,
        message: `${user.displayName}'s access status has been updated to ${newStatus}.`,
        type: newStatus === 'Active' ? 'success' : 'info',
      });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-5xl h-[88vh] min-h-[600px] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0B2545] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Admin User & Role Management</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                  Admin Strict Access
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Provision new team members, configure custom job titles, upload avatars, and manage access roles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && !isEditing && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] hover:bg-[#133863] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New User</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Access Restricted to Administrators</h3>
            <p className="text-sm text-slate-600 max-w-md mb-4">
              Your current logged-in role is <strong>{currentUser?.role || 'Associate'}</strong>. Only primary firm Administrators
              are authorized to create users, assign roles, or manage system permissions.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        ) : isEditing && editingUser ? (
          /* User Edit / Create Form */
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <form onSubmit={handleSaveUserSubmit} className="max-w-2xl mx-auto bg-white border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {allUsers.some((u) => u.uid === editingUser.uid) ? 'Edit User Profile' : 'Create New User Account'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure profile identity, custom job titles, and permissions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingUser(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {/* Profile Photo Upload Section */}
              <div className="mb-6 flex items-center gap-5 p-4 bg-slate-50 border border-slate-200">
                <div className="relative group shrink-0">
                  {editingUser.photoUrl ? (
                    <img
                      src={editingUser.photoUrl}
                      alt={editingUser.displayName || 'Avatar'}
                      className="w-16 h-16 object-cover border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#0B2545] text-white flex items-center justify-center font-bold text-lg">
                      {editingUser.displayName
                        ? editingUser.displayName
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Profile Photo</span>
                    </button>
                    {editingUser.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingUser((prev) => (prev ? { ...prev, photoUrl: '' } : null))}
                        className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, WebP up to 2MB. Square aspect recommended.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={editingUser.displayName || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                      placeholder="e.g. CA Rahul Sharma"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-[#0B2545] bg-white text-slate-900"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      required
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      placeholder="e.g. rahul.sharma@gfpadvisory.in"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-[#0B2545] bg-white text-slate-900"
                    />
                  </div>
                </div>

                {/* Custom Job Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Job Title <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      list="job-title-suggestions"
                      value={editingUser.jobTitle || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                      placeholder="Enter or pick job title..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-[#0B2545] bg-white text-slate-900"
                    />
                    <datalist id="job-title-suggestions">
                      {PRESET_JOB_TITLES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Practice / Department</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      list="department-suggestions"
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      placeholder="e.g. Corporate Advisory"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-[#0B2545] bg-white text-slate-900"
                    />
                    <datalist id="department-suggestions">
                      {PRESET_DEPARTMENTS.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Assigned Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    System Role & Column Privileges <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={editingUser.role || 'Associate'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-[#0B2545] bg-white text-slate-900 font-semibold"
                  >
                    <option value="Admin">Admin (Full Access + Financial Columns + User Admin)</option>
                    <option value="Partner">Partner (Commercial Clearance + Approvals)</option>
                    <option value="Associate">Associate (Operational Only — 🚫 Financial Columns Restricted)</option>
                    <option value="Viewer">Viewer (Read-Only Operational View)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Non-admin users will see <strong>🚫 Restricted</strong> on confidential columns like commercials, private notes, and partner margins.
                  </p>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editingUser.status || 'Active'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'Active' | 'Suspended' })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-[#0B2545] bg-white text-slate-900"
                  >
                    <option value="Active">Active (Permit Login)</option>
                    <option value="Suspended">Suspended (Revoke Access)</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone / Direct Extension</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="e.g. +91 98230 11223"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-[#0B2545] bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0B2545] hover:bg-[#133863] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save User Account'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* User Directory Table View */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, job title..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 focus:outline-none focus:border-[#0B2545] bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Role:</span>
                {(['All', 'Admin', 'Partner', 'Associate', 'Viewer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`px-2 py-1 text-[11px] font-semibold transition-colors ${
                      roleFilter === r
                        ? 'bg-[#0B2545] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-white border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Team Member</th>
                      <th className="py-2.5 px-3">Custom Job Title & Dept</th>
                      <th className="py-2.5 px-3">Access Role</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Created</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p>No team members found matching search filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelf = user.uid === currentUser?.uid;
                        const roleColor =
                          user.role === 'Admin'
                            ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                            : user.role === 'Partner'
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : user.role === 'Associate'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-amber-100 text-amber-900 border-amber-200';

                        return (
                          <tr key={user.uid} className="hover:bg-slate-50/80 transition-colors">
                            {/* Member info */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                {user.photoUrl ? (
                                  <img
                                    src={user.photoUrl}
                                    alt={user.displayName}
                                    className="w-9 h-9 object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {user.displayName
                                      .split(' ')
                                      .map((w) => w[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{user.displayName}</span>
                                    {isSelf && (
                                      <span className="text-[9px] px-1 bg-amber-100 text-amber-800 font-semibold uppercase">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px]">{user.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Job Title & Dept */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{user.jobTitle || 'Associate'}</div>
                              <div className="text-[10.5px] text-slate-500">{user.department || 'General Practice'}</div>
                            </td>

                            {/* Access Role */}
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${roleColor}`}
                              >
                                {user.role === 'Admin' && <Shield className="w-3 h-3 text-indigo-700" />}
                                {user.role}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                disabled={isSelf}
                                className={`px-2 py-0.5 text-[10.5px] font-semibold border transition-colors ${
                                  user.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                } ${isSelf ? 'cursor-default' : 'cursor-pointer'}`}
                                title={isSelf ? 'Active session' : 'Click to toggle status'}
                              >
                                {user.status}
                              </button>
                            </td>

                            {/* Created Date */}
                            <td className="py-3 px-3 text-slate-500 text-[11px]">
                              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(user)}
                                  className="p-1 text-slate-500 hover:text-[#0B2545] hover:bg-slate-100"
                                  title="Edit User Profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUserClick(user)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Real-time Firestore user sync active</span>
          </div>
          <div>Total Accounts: {allUsers.length}</div>
        </div>
      </div>
    </div>
  );
};
