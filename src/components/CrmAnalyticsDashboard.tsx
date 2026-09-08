import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart as PieIcon,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Briefcase,
  Users,
  Target,
  Sparkles,
} from 'lucide-react';
import { CrmClientRecord } from '../types';
import { RestrictedCell } from './RestrictedCell';

interface CrmAnalyticsDashboardProps {
  crmRecords: CrmClientRecord[];
  canSeeCommercials: boolean;
  formatINR: (amount: number) => string;
  onSelectRecord?: (record: CrmClientRecord) => void;
}

const PALETTE = [
  '#0B2545',
  '#1E3A8A',
  '#0284C7',
  '#0D9488',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#EC4899',
];

export const CrmAnalyticsDashboard: React.FC<CrmAnalyticsDashboardProps> = ({
  crmRecords,
  canSeeCommercials,
  formatINR,
  onSelectRecord,
}) => {
  // Aggregate Metrics & Indices
  const metrics = useMemo(() => {
    const totalLeads = crmRecords.length;
    const totalPipelineValue = crmRecords.reduce((acc, r) => acc + (r.totalCommercial || 0), 0);
    const totalAdvanceCollected = crmRecords.reduce((acc, r) => {
      return r.advanceReceiptStatus === 'Received' ? acc + (r.advanceAmount || 0) : acc;
    }, 0);
    const totalAdvancePending = crmRecords.reduce((acc, r) => {
      return r.advanceReceiptStatus !== 'Received' ? acc + (r.advanceAmount || 0) : acc;
    }, 0);
    const totalBalanceCommercial = crmRecords.reduce(
      (acc, r) => acc + (r.postDeliveryCommercial || 0),
      0
    );

    // Indices
    const realizationRatio =
      totalPipelineValue > 0 ? Math.round((totalAdvanceCollected / totalPipelineValue) * 100) : 0;
    const avgDealSize = totalLeads > 0 ? Math.round(totalPipelineValue / totalLeads) : 0;
    const activeDeals = crmRecords.filter(
      (r) =>
        r.assignmentStatus !== 'Closed / Billed' &&
        r.assignmentStatus !== 'Dropped / Lost' &&
        r.assignmentStatus !== 'On Hold'
    ).length;
    const conversionRate =
      totalLeads > 0
        ? Math.round(
            (crmRecords.filter(
              (r) =>
                r.assignmentStatus === 'EL Signed & Active' ||
                r.assignmentStatus === 'Final Report Delivered' ||
                r.assignmentStatus === 'Closed / Billed'
            ).length /
              totalLeads) *
              100
          )
        : 0;

    return {
      totalLeads,
      totalPipelineValue,
      totalAdvanceCollected,
      totalAdvancePending,
      totalBalanceCommercial,
      realizationRatio,
      avgDealSize,
      activeDeals,
      conversionRate,
    };
  }, [crmRecords]);

  // Data: Pipeline by Deliverable Scope
  const deliverableData = useMemo(() => {
    const map = new Map<string, { total: number; advance: number; count: number }>();
    crmRecords.forEach((r) => {
      const scope = r.natureOfDeliverable || 'Advisory';
      const curr = map.get(scope) || { total: 0, advance: 0, count: 0 };
      curr.total += r.totalCommercial || 0;
      curr.advance += r.advanceReceiptStatus === 'Received' ? r.advanceAmount || 0 : 0;
      curr.count += 1;
      map.set(scope, curr);
    });

    return Array.from(map.entries())
      .map(([name, val]) => ({
        name: name.length > 20 ? name.slice(0, 18) + '…' : name,
        fullName: name,
        commercial: val.total,
        advance: val.advance,
        leads: val.count,
      }))
      .sort((a, b) => b.commercial - a.commercial)
      .slice(0, 6);
  }, [crmRecords]);

  // Data: Stage Distribution (Donut Chart)
  const stageData = useMemo(() => {
    const map = new Map<string, number>();
    crmRecords.forEach((r) => {
      const stage = r.assignmentStatus || 'Lead Identified';
      map.set(stage, (map.get(stage) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [crmRecords]);

  // Data: Sourcing Channel Performance
  const sourceData = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    crmRecords.forEach((r) => {
      const src = r.leadGeneratedBy || 'Direct Outreach';
      const curr = map.get(src) || { count: 0, value: 0 };
      curr.count += 1;
      curr.value += r.totalCommercial || 0;
      map.set(src, curr);
    });

    return Array.from(map.entries())
      .map(([name, val]) => ({
        name: name.length > 18 ? name.slice(0, 16) + '…' : name,
        fullName: name,
        leads: val.count,
        value: val.value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [crmRecords]);

  // Custom Currency Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</div>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between gap-4">
              <span style={{ color: item.color }}>{item.name}:</span>
              <span className="font-mono font-bold">
                {canSeeCommercials ? formatINR(item.value) : '••••••'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Level Strategic Indices */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Index 1: Realization Efficiency */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cash Realization Index
            </span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            {metrics.realizationRatio}%
          </div>
          <p className="text-[11px] text-slate-500">Advance collected vs. pipeline volume</p>
        </div>

        {/* Index 2: Average Deal Ticket Size */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Average Deal Ticket
            </span>
            <span className="p-1 rounded-md bg-blue-50 text-blue-700">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 truncate">
            {canSeeCommercials ? formatINR(metrics.avgDealSize) : <RestrictedCell compact />}
          </div>
          <p className="text-[11px] text-slate-500">Across {metrics.totalLeads} portfolio records</p>
        </div>

        {/* Index 3: Active Engagements */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active In-Flight Work
            </span>
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-700">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-900">
            {metrics.activeDeals} Deals
          </div>
          <p className="text-[11px] text-slate-500">Execution, modeling & draft stages</p>
        </div>

        {/* Index 4: Commercial Conversion Funnel */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Conversion Win Rate
            </span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-700">
              <Target className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics.conversionRate}%
          </div>
          <p className="text-[11px] text-slate-500">EL Signed / delivered ratio</p>
        </div>
      </div>

      {/* Row 2: Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Practice Domain Revenue Split */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Pipeline Commercials by Practice Area</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total commercial value vs. advance realized per deliverable category
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deliverableData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="commercial" fill="#0B2545" radius={[4, 4, 0, 0]} name="Total Commercial" />
                <Bar dataKey="advance" fill="#10B981" radius={[4, 4, 0, 0]} name="Advance Realized" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pipeline Stage Distribution Donut */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-amber-500" />
                <span>Assignment Stage Breakdown</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distribution of client mandates across workflow lifecycle
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {stageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Leads`, `${name}`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconSize={8}
                  layout="horizontal"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Cash Flow Exposure & Sourcing Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cash Flow Distribution Cards */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Receivables & Balance Exposure</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cash flow position across bank deposits & receivables
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/90">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 uppercase">
                <span>Advance Realized</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
                {canSeeCommercials ? formatINR(metrics.totalAdvanceCollected) : <RestrictedCell compact />}
              </div>
              <div className="text-[10.5px] text-emerald-700 mt-0.5">
                Bank realized funds in firm account
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase">
                <span>Advance Pending</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                {canSeeCommercials ? formatINR(metrics.totalAdvancePending) : <RestrictedCell compact />}
              </div>
              <div className="text-[10.5px] text-amber-700 mt-0.5">
                Awaiting client wire transfer / cheque
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase">
                <span>Post-Delivery Balance</span>
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {canSeeCommercials ? formatINR(metrics.totalBalanceCommercial) : <RestrictedCell compact />}
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">
                Invoiced upon report / model sign-off
              </div>
            </div>
          </div>
        </div>

        {/* Lead Sourcing Channels Horizontal Bars */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Acquisition Channels & Partner Referrals</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Performance of marketing touchpoints and business development sourcing
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sourceData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => (canSeeCommercials ? `₹${(v / 1000).toFixed(0)}k` : '•••')}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" fill="#1E3A8A" radius={[0, 4, 4, 0]} name="Commercial Sourced" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
