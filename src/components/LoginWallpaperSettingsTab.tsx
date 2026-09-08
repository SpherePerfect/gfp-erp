import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  Link,
  Lock,
  User,
  Eye,
} from 'lucide-react';
import { PRESET_WALLPAPERS, DEFAULT_WALLPAPER, WallpaperPreset } from '../data/presetWallpapers';
import { dispatchToast } from './NotificationToast';

interface LoginWallpaperSettingsTabProps {
  currentWallpaperUrl?: string;
  currentWallpaperType?: 'preset' | 'custom' | 'none';
  onSelectWallpaper: (url: string, type: 'preset' | 'custom') => void;
  onResetToDefault: () => void;
}

export const LoginWallpaperSettingsTab: React.FC<LoginWallpaperSettingsTabProps> = ({
  currentWallpaperUrl = DEFAULT_WALLPAPER,
  currentWallpaperType = 'preset',
  onSelectWallpaper,
  onResetToDefault,
}) => {
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUrl = currentWallpaperUrl || DEFAULT_WALLPAPER;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      dispatchToast({
        title: 'File Too Large',
        message: 'Wallpaper image should be under 8MB.',
        type: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Compress large desktop wallpaper to high-quality 1920x1080 JPEG
        const canvas = document.createElement('canvas');
        const maxW = 1920;
        const maxH = 1080;
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        onSelectWallpaper(dataUrl, 'custom');
        dispatchToast({
          title: 'Custom Wallpaper Applied',
          message: 'Your custom image will now appear on the macOS login screen.',
          type: 'success',
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    const clean = customUrlInput.trim();
    if (!clean || !clean.startsWith('http')) {
      dispatchToast({
        title: 'Invalid Image URL',
        message: 'Please provide a valid https:// image link.',
        type: 'warning',
      });
      return;
    }
    onSelectWallpaper(clean, 'custom');
    setCustomUrlInput('');
    dispatchToast({
      title: 'Wallpaper Updated',
      message: 'Custom wallpaper URL saved.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-pink-600" />
            <span>macOS Lock Screen Wallpaper Management</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize the ambient background wallpaper displayed on the Apple macOS-style login interface.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetToDefault}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          title="Reset to default Sonoma wallpaper"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* Mini macOS Login Screen Interactive Preview */}
      <div className="bg-slate-900 rounded-2xl p-4 shadow-md overflow-hidden relative border border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
          <span>Live macOS Login Screen Mockup Preview</span>
          <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">
            16:9 Ambient Canvas
          </span>
        </div>

        <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-inner flex items-center justify-center select-none">
          {/* Background Wallpaper */}
          <img
            src={activeUrl}
            alt="Lock Screen Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />

          {/* Mini Simulated macOS Login Widget */}
          <div className="relative z-10 flex flex-col items-center text-white scale-90">
            {/* Live Clock Preview */}
            <div className="text-2xl font-bold tracking-tight drop-shadow-md">
              09:41
            </div>
            <div className="text-[10px] font-medium text-white/90 drop-shadow-sm mb-3">
              Tuesday, September 8
            </div>

            {/* Circular Avatar */}
            <div className="w-12 h-12 rounded-full border-2 border-white/80 shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center mb-1.5">
              <User className="w-6 h-6 text-amber-300" />
            </div>

            {/* User Name */}
            <div className="text-xs font-bold text-white drop-shadow-md mb-2">
              CA Yogesh Kulkarni
            </div>

            {/* Password Pill */}
            <div className="w-40 h-6 rounded-full bg-white/25 border border-white/40 backdrop-blur-md px-3 flex items-center justify-between text-[10px] text-white/90">
              <span className="tracking-widest">••••••••</span>
              <Lock className="w-2.5 h-2.5 text-white/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Custom Wallpaper or URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload File */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Custom Image</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Upload your firm's custom branded backdrop, office photograph, or executive graphic (PNG, JPG, WebP up to 8MB).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B2545] hover:bg-[#133863] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Select File from Disk</span>
            </button>
          </div>
        </div>

        {/* Custom Image URL */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Link className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Wallpaper URL</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              Paste an external Unsplash, CDN, or Cloud Storage image URL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 bg-white"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Curated macOS High-Res Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Curated Apple macOS Dynamic Wallpapers</span>
          </div>
          <span className="text-[10px] text-slate-400">Click any card to apply instantly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {PRESET_WALLPAPERS.map((preset) => {
            const isSelected = activeUrl === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectWallpaper(preset.url, 'preset')}
                className={`group relative text-left rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0B2545] shadow-md ring-2 ring-[#0B2545]/30'
                    : 'border-slate-200 hover:border-slate-400 shadow-2xs'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-28 w-full bg-slate-800 overflow-hidden">
                  <img
                    src={preset.thumbnail}
                    alt={preset.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0B2545] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                    </div>
                  )}

                  {/* Category Pill */}
                  <span className="absolute bottom-2 left-2 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-xs">
                    {preset.category}
                  </span>
                </div>

                {/* Card Footer */}
                <div className="p-2.5 bg-white">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                    {preset.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
