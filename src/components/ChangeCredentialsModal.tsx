import React, { useState, useRef } from 'react';
import {
  X,
  KeyRound,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  Trash2,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { AppUser } from '../types';
import { dispatchToast } from './NotificationToast';
import { logAuthEvent } from '../utils/authLogService';

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onSaveUser: (user: AppUser) => Promise<void>;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
}) => {
  if (!isOpen || !currentUser) return null;

  const [loginId, setLoginId] = useState(currentUser.loginId || currentUser.email || '123');
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [password, setPassword] = useState(currentUser.password || '123');
  const [confirmPassword, setConfirmPassword] = useState(currentUser.password || '123');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentUser.photoUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

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
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoUrl(compressedUrl);
        setErrorMessage(null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
  };

  const handleResetToCurrent = () => {
    setLoginId(currentUser.loginId || currentUser.email || '123');
    setDisplayName(currentUser.displayName || '');
    setPassword(currentUser.password || '123');
    setConfirmPassword(currentUser.password || '123');
    setPhotoUrl(currentUser.photoUrl);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanLoginId = loginId.trim();
    const cleanDisplayName = displayName.trim();
    const cleanPassword = password.trim();

    if (!cleanLoginId) {
      setErrorMessage('Please enter a valid User ID / Login Name.');
      return;
    }

    if (!cleanDisplayName) {
      setErrorMessage('Please enter your Display Name.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Password cannot be empty.');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser: AppUser = {
        ...currentUser,
        loginId: cleanLoginId,
        displayName: cleanDisplayName,
        password: cleanPassword,
        photoUrl: photoUrl || '',
        updatedAt: new Date().toISOString(),
      };

      await onSaveUser(updatedUser);

      await logAuthEvent({
        userId: cleanLoginId,
        userName: cleanDisplayName,
        role: currentUser.role,
        action: 'PASSWORD_CHANGED',
        details: `Credentials updated: User ID set to "${cleanLoginId}", round profile photo ${photoUrl ? 'updated' : 'removed'}.`,
      });

      dispatchToast({
        title: 'Credentials & Profile Updated',
        message: `Your login ID is now "${cleanLoginId}". Your round photo and password have been saved.`,
        type: 'success',
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to update credentials:', err);
      setErrorMessage(err.message || 'Failed to update credentials in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDefaultCredentials =
    (currentUser.loginId === '123' || !currentUser.loginId) &&
    (currentUser.password === '123' || !currentUser.password);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs font-sans select-none overflow-y-auto">
      {/* Apple macOS Window Frame - Notice: NO 3 dots on top corner */}
      <div className="bg-[#F6F6F8] border border-black/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] w-full max-w-lg flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* macOS Title Bar */}
        <div className="h-11 bg-[#EBEBEF] border-b border-[#D2D2D7]/80 px-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#0B2545] flex items-center justify-center text-white text-[10px] font-bold shadow-2xs">
              <KeyRound className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Account Settings</span>
          </div>

          {/* Centered Title */}
          <div className="text-xs font-bold text-slate-800 tracking-tight text-center truncate max-w-[200px]">
            {displayName || currentUser.displayName || 'Profile & Credentials'}
          </div>

          {/* Clean macOS Close Button (NO three corner dots) */}
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
            title="Cancel / Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white">
          <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
            {isDefaultCredentials && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">First-Time Setup Notice:</span>
                    You are currently using default credentials (<span className="font-mono font-bold">123</span> / <span className="font-mono font-bold">123</span>). Please customize your User ID and password below.
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Round Profile Photo Showcase Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center ring-2 ring-[#0B2545]/20">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName || 'User'}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0B2545] text-white flex flex-col items-center justify-center">
                      <User className="w-6 h-6 text-amber-300 mb-0.5" />
                      <span className="text-[8px] font-bold text-slate-300">PHOTO</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 mb-0.5">Circular Profile Photo</div>
                <div className="text-[10.5px] text-slate-500 leading-tight mb-2">
                  Appears round on the Login screen, Top Navbar, and audit logs.
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#0B2545] hover:bg-[#133863] text-white rounded-lg shadow-2xs cursor-pointer transition-colors"
                  >
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Upload Photo</span>
                  </button>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Name (Full Name)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. CA Yogesh Kulkarni"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900"
                />
              </div>
            </div>

            {/* User ID / Login Identifier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                User ID / Login ID
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. 123 or yogesh.k"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                This is what you enter to sign into the system.
              </p>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#0B2545] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] bg-white text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* macOS Action Bar with Cancel and Save Buttons */}
          <div className="px-6 py-3 bg-[#F9F9FB] border-t border-[#E5E5EA] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetToCurrent}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              title="Reset fields to current values"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-[#D2D2D7] rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-1.5 bg-[#0B2545] hover:bg-[#133863] active:bg-[#0B2545] text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
