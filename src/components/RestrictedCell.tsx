import React from 'react';
import { Lock } from 'lucide-react';

interface RestrictedCellProps {
  tooltip?: string;
  className?: string;
  compact?: boolean;
}

export const RestrictedCell: React.FC<RestrictedCellProps> = ({
  tooltip = 'Restricted: Requires Admin role clearance to view confidential financial data',
  className = '',
  compact = false,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100/90 border border-slate-200 text-slate-500 font-mono text-[10.5px] rounded-none select-none cursor-not-allowed group transition-colors hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 ${className}`}
      title={tooltip}
    >
      <span className="text-xs" role="img" aria-label="Restricted">
        🚫
      </span>
      <span className="font-semibold uppercase tracking-wider text-[9.5px]">
        {compact ? 'Restr.' : 'Restricted'}
      </span>
      <Lock className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
    </div>
  );
};
