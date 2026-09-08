import React, { useState, useMemo, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Camera,
  Check,
  Wifi,
  BatteryCharging,
  SlidersHorizontal,
  Moon,
  RotateCw,
  Power,
  Users,
  KeyRound,
  LogIn,
} from 'lucide-react';
import { AppUser, FirmProfile } from '../types';
import { authenticateWithCredentials, findUserByIdentifier } from '../utils/authService';
import { DEFAULT_WALLPAPER } from '../data/presetWallpapers';

interface LoginScreenProps {
  allUsers: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onGoogleSignIn?: () => void;
  firmName?: string;
  firmProfile?: FirmProfile;
  onOpenAdminSetup?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  allUsers,
  onLoginSuccess,
  onGoogleSignIn,
  firmName = 'GFP Advisory & Corporate Services',
  firmProfile,
  onOpenAdminSetup,
}) => {
  const [identifier, setIdentifier] = useState('123');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Live macOS clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Wallpaper selection: Admin configured wallpaper > default macOS Sonoma wallpaper
  const wallpaperUrl = firmProfile?.loginBackgroundUrl || DEFAULT_WALLPAPER;

  // Dynamic user lookup for avatar display
  const recognizedUser = useMemo(() => {
    return findUserByIdentifier(identifier, allUsers);
  }, [identifier, allUsers]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = authenticateWithCredentials(identifier, password, allUsers);
      setIsSubmitting(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Password incorrect. Please try again.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }, 200);
  };

  const handleSelectUser = (user: AppUser) => {
    setIdentifier(user.loginId || user.email || '123');
    setPassword(user.password || '123');
    setErrorMessage(null);
    setIsSwitchUserOpen(false);
  };

  const handleFillDefault = () => {
    setIdentifier('123');
    setPassword('123');
    setErrorMessage(null);
  };

  const handleTriggerSleep = () => {
    setIsSleeping(true);
    setTimeout(() => {
      setIsSleeping(false);
    }, 2500);
  };

  const handleTriggerRestart = () => {
    setIdentifier('123');
    setPassword('');
    setErrorMessage(null);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-between items-center select-none overflow-hidden font-sans text-white"
      style={{
        backgroundImage: `url("${wallpaperUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background Soft Vignette & Acrylic Frosting */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] pointer-events-none" />

      {/* Screen Dimmer for Simulated Sleep */}
      {isSleeping && (
        <div className="absolute inset-0 bg-black/95 z-50 transition-opacity duration-700 flex items-center justify-center">
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase">
            Click anywhere or press any key to wake display
          </p>
        </div>
      )}

      {/* =========================================================================
          TOP BAR: Authentic macOS Status Bar
         ========================================================================= */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-medium text-white/90 drop-shadow-md">
        {/* Left: Apple Icon & Firm Tagline */}
        <div className="flex items-center gap-3">
          {/* Apple Logo Icon */}
          <svg
            className="w-4 h-4 fill-current text-white/95"
            viewBox="0 0 170 170"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12-14.42-6.52-9.98-11.75-21.2-15.68-33.68-3.93-12.48-5.9-24.36-5.9-35.63 0-15.01 3.82-27.42 11.45-37.23 7.64-9.8 17.18-14.86 28.63-15.17 4.58 0 9.87 1.25 15.86 3.75 5.99 2.5 10.02 3.8 12.09 3.9 1.85-.1 6.04-1.46 12.57-4.08 6.53-2.62 12.18-3.8 16.94-3.56 12.87.63 23.36 5.34 31.47 14.15-11.23 6.82-16.71 16.27-16.44 28.37.27 9.8 4.09 18.06 11.45 24.77 7.36 6.72 16.14 10.42 26.33 11.11-2.28 7.03-5.26 14.54-8.94 22.52zM119.22 31.84c0-7.72 2.76-14.93 8.28-21.64 5.52-6.7 12.43-10.74 20.73-12.12.33 1.05.49 2.14.49 3.27 0 7.7-2.93 15.06-8.79 22.08-5.86 7.02-12.86 10.84-21.01 11.46-.22-1.02-.34-2.05-.34-3.05z" />
          </svg>
          <span className="font-semibold tracking-tight text-[13px] text-white hidden sm:inline drop-shadow">
            {firmName}
          </span>
        </div>

        {/* Center: Live Date & Time */}
        <div className="flex items-center gap-2 text-center text-white/95">
          <span className="font-semibold tracking-tight text-[13px] drop-shadow">
            {currentDate}
          </span>
          <span className="opacity-60">•</span>
          <span className="font-semibold tracking-tight text-[13px] drop-shadow">
            {currentTime}
          </span>
        </div>

        {/* Right: macOS Menu Tray (Wi-Fi, Battery, Control Center) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
            <Wifi className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
            <BatteryCharging className="w-4 h-4 text-emerald-300" />
            <span className="text-[11px] font-medium hidden md:inline">100%</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </header>

      {/* =========================================================================
          CENTER CLUSTER: Authentic macOS Sonoma / Sequoia Centered User Card
         ========================================================================= */}
      <main className="relative z-20 flex flex-col items-center justify-center my-auto px-4 max-w-md w-full">
        {/* User Circular Avatar with macOS Ambient Halo */}
        <div className="relative group cursor-pointer" onClick={() => setIsSwitchUserOpen(true)}>
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/40 ring-4 ring-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden bg-slate-900/60 backdrop-blur-md flex items-center justify-center transition-all duration-300 group-hover:ring-white/40 group-hover:scale-105">
            {recognizedUser?.photoUrl ? (
              <img
                src={recognizedUser.photoUrl}
                alt={recognizedUser.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-800 via-indigo-950 to-slate-800 flex flex-col items-center justify-center text-white p-2">
                <User className="w-10 h-10 text-white/80 mb-1" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-300">
                  {recognizedUser?.loginId || identifier || 'USER'}
                </span>
              </div>
            )}
          </div>

          {/* Role Pill Badge */}
          <div
            className="absolute -bottom-1 inset-x-0 mx-auto w-fit px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9.5px] font-bold uppercase tracking-wider text-amber-300 shadow-md text-center"
            title="Practice Role"
          >
            {recognizedUser?.role || 'Admin'}
          </div>
        </div>

        {/* User Display Name */}
        <div className="mt-4 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {recognizedUser?.displayName || 'CA Yogesh Kulkarni'}
          </h2>
          <p className="text-xs text-white/70 mt-0.5 drop-shadow font-medium">
            {recognizedUser?.jobTitle || 'Managing Partner & Practice Head'}
          </p>
        </div>

        {/* macOS Style Frosted Glass Password Pill */}
        <form
          onSubmit={handleSubmit}
          className={`mt-6 w-full max-w-[280px] transition-transform ${
            isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
        >
          <div className="relative flex items-center bg-white/20 hover:bg-white/25 focus-within:bg-white/30 backdrop-blur-xl border border-white/35 rounded-full py-1.5 pl-3.5 pr-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-white/50">
            <Lock className="w-3.5 h-3.5 text-white/70 shrink-0 mr-2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Enter Password"
              autoFocus
              className="w-full bg-transparent text-white placeholder-white/60 text-xs font-medium focus:outline-hidden py-1"
            />

            {/* Toggle Show Password */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer mr-1"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Circular Enter Arrow Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-7 h-7 rounded-full bg-white/30 hover:bg-white/50 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
              title="Sign in"
            >
              {isSubmitting ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Error Message Toast */}
          {errorMessage && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/80 backdrop-blur-md border border-red-400 text-white text-[11px] font-medium text-center shadow-lg flex items-center justify-center gap-1.5 animate-in fade-in zoom-in-95">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* macOS Helper Prompt Pill: 1-Click Quick Fill */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleFillDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 hover:bg-black/45 border border-white/20 text-white/80 text-[10.5px] font-mono tracking-tight transition-all cursor-pointer backdrop-blur-md shadow-xs hover:text-white"
              title="Click to fill default credentials"
            >
              <span>User ID: 123</span>
              <span className="opacity-50">•</span>
              <span>Pass: 123</span>
              <span className="px-1 py-0.2 bg-amber-400 text-slate-950 font-bold rounded-xs text-[9px]">
                FILL
              </span>
            </button>
          </div>
        </form>

        {/* Switch User Trigger Button */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSwitchUserOpen(!isSwitchUserOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-medium backdrop-blur-md transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-white/80" />
            <span>Switch User ({allUsers.length})</span>
          </button>

          {onGoogleSignIn && (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-medium backdrop-blur-md transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-white/80" />
              <span>Google SSO</span>
            </button>
          )}
        </div>

        {/* Switch User Dropdown Popover */}
        {isSwitchUserOpen && (
          <div className="mt-4 w-full max-w-sm rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-white/20 p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px] font-semibold text-white/80 uppercase tracking-wider">
              <span>Select Practice User</span>
              <button
                type="button"
                onClick={() => setIsSwitchUserOpen(false)}
                className="text-white/50 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto mt-2 space-y-1 pr-1 custom-scrollbar">
              {allUsers.map((u) => {
                const isSelected = u.loginId === identifier || u.email === identifier;
                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/25 border border-white/30 text-white'
                        : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    {u.photoUrl ? (
                      <img
                        src={u.photoUrl}
                        alt={u.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-white/30 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600/80 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {u.displayName
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        <span>{u.displayName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/15 text-amber-200">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/60 font-mono truncate">
                        ID: {u.loginId || u.email}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom User ID Manual Input */}
            <div className="mt-3 pt-2.5 border-t border-white/10">
              <label className="text-[10.5px] text-white/70 block mb-1">
                Or type custom User ID / Email:
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 123 or associate@gfpadvisory.in"
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-xs placeholder-white/40 focus:outline-hidden focus:border-white/50"
              />
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          BOTTOM CONTROLS: Classic macOS Lock Screen System Controls
         ========================================================================= */}
      <footer className="relative z-20 w-full px-6 py-5 flex items-center justify-center gap-8 sm:gap-12 text-white/80 drop-shadow-md">
        {/* Sleep */}
        <button
          type="button"
          onClick={handleTriggerSleep}
          className="flex flex-col items-center gap-1 hover:text-white transition-all cursor-pointer group"
          title="Dim display to sleep"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white/25 border border-white/20 flex items-center justify-center shadow-xs backdrop-blur-md transition-all">
            <Moon className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Sleep</span>
        </button>

        {/* Restart */}
        <button
          type="button"
          onClick={handleTriggerRestart}
          className="flex flex-col items-center gap-1 hover:text-white transition-all cursor-pointer group"
          title="Reset login screen"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white/25 border border-white/20 flex items-center justify-center shadow-xs backdrop-blur-md transition-all">
            <RotateCw className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Restart</span>
        </button>

        {/* Shut Down / Reset */}
        <button
          type="button"
          onClick={() => {
            setPassword('');
            setIdentifier('123');
            setIsSwitchUserOpen(false);
          }}
          className="flex flex-col items-center gap-1 hover:text-white transition-all cursor-pointer group"
          title="Clear login state"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white/25 border border-white/20 flex items-center justify-center shadow-xs backdrop-blur-md transition-all">
            <Power className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Reset</span>
        </button>
      </footer>
    </div>
  );
};
