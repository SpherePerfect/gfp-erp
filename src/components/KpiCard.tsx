import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KpiCardProps {
  id?: string;
  title: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  currentMonthLabel: string;
  prevMonthLabel: string;
  currentValue: string | number;
  prevValue: string | number;
  currentSubtitle: string;
  prevSubtitle: string;
  deltaText?: string;
  deltaType?: 'positive' | 'neutral' | 'negative';
  interactiveTooltip?: string;
  onNumberClick?: () => void;
}

export function KpiCard({
  id,
  title,
  icon: Icon,
  iconColor,
  iconBg,
  currentMonthLabel,
  prevMonthLabel,
  currentValue,
  prevValue,
  currentSubtitle,
  prevSubtitle,
  deltaText,
  deltaType = 'positive',
  interactiveTooltip,
  onNumberClick,
}: KpiCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinnedPrev, setIsPinnedPrev] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Active view: pinned if user clicked toggle, or automatically previous month on card hover
  const isShowingPrev = isPinnedPrev ? true : isHovered;

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinnedPrev((prev) => !prev);
  };

  return (
    <div
      id={id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-400 select-none backdrop-blur-xl border ${
        isShowingPrev
          ? 'bg-gradient-to-b from-indigo-50/70 via-white to-white border-indigo-300/90 shadow-[0_8px_30px_rgba(99,102,241,0.12)] ring-2 ring-indigo-200/50'
          : 'bg-white/90 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-[0_2px_14px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_-4px_rgba(15,23,42,0.1)]'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 tracking-tight">{title}</span>
          {/* Active Period Indicator iOS Pill Badge */}
          <span
            className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full transition-all duration-300 backdrop-blur-md shadow-2xs ${
              isShowingPrev
                ? 'bg-amber-100/90 text-amber-900 border border-amber-300'
                : 'bg-slate-100/90 text-slate-600 border border-slate-200'
            }`}
          >
            {isShowingPrev ? 'Prev Mo' : 'This Mo'}
          </span>
        </div>

        {/* Top Right Symbol with Continuous Animation in Loop on Card Hover */}
        <motion.div
          animate={
            isHovered
              ? {
                  rotate: [0, -9, 9, -5, 0],
                  scale: [1, 1.15, 1.03, 1.12, 1],
                  y: [0, -3.5, 0, -2, 0],
                }
              : { rotate: 0, scale: 1, y: 0 }
          }
          transition={
            isHovered
              ? {
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : { duration: 0.3, ease: 'easeOut' }
          }
          className={`p-2 rounded-xl ${iconBg} ${iconColor} border border-slate-200/70 shadow-2xs shrink-0`}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Metric Value with Apple iOS Deep Frosted Blur Animation on Hover/Unhover */}
      <div className="mt-3 min-h-[42px] flex items-baseline justify-between relative">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={isShowingPrev ? 'prev' : 'current'}
              initial={{
                opacity: 0,
                filter: 'blur(32px)',
                scale: 0.92,
                y: isShowingPrev ? 8 : -8,
              }}
              animate={{
                opacity: 1,
                filter: 'blur(0px)',
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                filter: 'blur(32px)',
                scale: 0.92,
                y: isShowingPrev ? -8 : 8,
              }}
              transition={{
                duration: 0.52,
                ease: [0.16, 1, 0.3, 1], // iOS standard fluid curve
              }}
              className="flex items-baseline gap-2"
            >
              {/* Interactive Number on direct hover */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => {
                  if (onNumberClick) onNumberClick();
                  setIsPinnedPrev((prev) => !prev);
                }}
                className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-left focus:outline-none"
                title="Click to lock toggle or inspect details"
              >
                {isShowingPrev ? prevValue : currentValue}
              </motion.button>

              {/* Delta comparison badge */}
              {deltaText && (
                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                    deltaType === 'positive'
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : deltaType === 'negative'
                      ? 'text-rose-700 bg-rose-50 border border-rose-200'
                      : 'text-slate-600 bg-slate-100 border border-slate-200'
                  }`}
                >
                  {deltaText}
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* iOS Dynamic Island / Tooltip Popover when hovering directly over the number */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.92, filter: 'blur(14px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 6, scale: 0.92, filter: 'blur(14px)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute z-30 left-0 top-full mt-1.5 bg-slate-900/90 backdrop-blur-2xl text-white text-[10.5px] font-medium py-1.5 px-3 rounded-xl shadow-2xl border border-white/15 whitespace-nowrap pointer-events-none"
              >
                <div className="font-semibold">
                  {interactiveTooltip ||
                    (isShowingPrev
                      ? `${prevMonthLabel}: ${prevValue}`
                      : `${currentMonthLabel}: ${currentValue}`)}
                </div>
                <div className="text-[9px] text-slate-300 font-sans mt-0.5">Click number to toggle month view</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Click-Toggle Pill for Accessibility */}
        <button
          type="button"
          onClick={togglePin}
          className="text-[9.5px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-slate-100/80 px-2 py-1 rounded-full border border-slate-200/60 transition active:scale-95"
          title="Toggle between This Month and Previous Month"
        >
          {isShowingPrev ? '↺ Reset' : '⇄ Prev'}
        </button>
      </div>

      {/* Subtitle / Context with Deep Blur Transition */}
      <div className="mt-2 pt-2 border-t border-slate-100/90 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <AnimatePresence mode="wait">
          <motion.span
            key={isShowingPrev ? 'sub-prev' : 'sub-curr'}
            initial={{ opacity: 0, filter: 'blur(18px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(18px)', y: -4 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="truncate"
          >
            {isShowingPrev ? prevSubtitle : currentSubtitle}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
          {isShowingPrev ? prevMonthLabel : currentMonthLabel}
        </span>
      </div>
    </div>
  );
}
