import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, Trash2, X, RefreshCw } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'trash';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  timestamp?: string;
}

export const dispatchToast = (toast: Omit<ToastMessage, 'id'>) => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const fullToast: ToastMessage = { ...toast, id };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ca_crm_toast_event', { detail: fullToast }));
  }
  return id;
};

interface NotificationToastProps {
  toasts?: ToastMessage[];
  onDismiss?: (id: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastProps> = ({
  toasts: controlledToasts,
  onDismiss: controlledOnDismiss,
}) => {
  const [internalToasts, setInternalToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setInternalToasts((prev) => [...prev, newToast]);

        // Auto dismiss after 4.2 seconds
        setTimeout(() => {
          setInternalToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 4200);
      }
    };

    window.addEventListener('ca_crm_toast_event', handleToastEvent);
    return () => window.removeEventListener('ca_crm_toast_event', handleToastEvent);
  }, []);

  const activeToasts = controlledToasts !== undefined ? controlledToasts : internalToasts;
  const handleDismiss = (id: string) => {
    if (controlledOnDismiss) {
      controlledOnDismiss(id);
    } else {
      setInternalToasts((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[99999] flex flex-col items-end gap-2.5 pointer-events-none max-w-sm w-full"
    >
      <AnimatePresence mode="sync">
        {activeToasts.map((toast) => {
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
          let accentBorder = 'border-emerald-200/80';
          let bgDot = 'bg-emerald-500';

          if (toast.type === 'warning') {
            icon = <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />;
            accentBorder = 'border-amber-200/80';
            bgDot = 'bg-amber-500';
          } else if (toast.type === 'info') {
            icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;
            accentBorder = 'border-blue-200/80';
            bgDot = 'bg-blue-500';
          } else if (toast.type === 'trash') {
            icon = <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />;
            accentBorder = 'border-rose-200/80';
            bgDot = 'bg-rose-500';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.92, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                scale: 0.88,
                y: -12,
                filter: 'blur(4px)',
                transition: { duration: 0.18, ease: 'easeInOut' },
              }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 30,
                mass: 0.8,
              }}
              className={`pointer-events-auto w-full bg-white/95 backdrop-blur-xl border ${accentBorder} shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] rounded-2xl p-3.5 flex items-start gap-3 transition-shadow hover:shadow-[0_16px_40px_-4px_rgba(0,0,0,0.18)]`}
            >
              <div className="pt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${bgDot}`} />
                    {toast.title}
                  </h4>
                  {toast.timestamp && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {toast.timestamp}
                    </span>
                  )}
                </div>
                {toast.message && (
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug break-words">
                    {toast.message}
                  </p>
                )}
                {toast.actionLabel && toast.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction?.();
                      handleDismiss(toast.id);
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {toast.actionLabel}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDismiss(toast.id)}
                aria-label="Close notification"
                className="text-slate-400 hover:text-slate-700 p-1 -mr-1 -mt-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const NotificationToast = NotificationToastContainer;
