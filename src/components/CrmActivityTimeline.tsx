import React, { useState } from 'react';
import {
  Phone,
  Users,
  MessageSquare,
  Mail,
  FileText,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { CrmActivity } from '../types';

interface CrmActivityTimelineProps {
  activities: CrmActivity[];
  onAddActivity: (activity: CrmActivity) => void;
  onDeleteActivity?: (activityId: string) => void;
  currentUser?: string;
}

export const CrmActivityTimeline: React.FC<CrmActivityTimelineProps> = ({
  activities = [],
  onAddActivity,
  onDeleteActivity,
  currentUser = 'Advisor',
}) => {
  const [activeTab, setActiveTab] = useState<'call' | 'meeting' | 'whatsapp' | 'note'>('call');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('Discussion Completed');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !notes.trim()) return;

    const newAct: CrmActivity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: activeTab,
      title: title.trim() || `${activeTab.toUpperCase()} Logged`,
      notes: notes.trim(),
      outcome: activeTab === 'call' || activeTab === 'meeting' ? outcome : undefined,
      followUpDate: followUpDate || undefined,
      timestamp: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      user: currentUser,
    };

    onAddActivity(newAct);
    setTitle('');
    setNotes('');
    setFollowUpDate('');
    setIsLogging(false);
  };

  const getActivityIcon = (type: CrmActivity['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'meeting':
        return <Users className="w-3.5 h-3.5 text-purple-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-amber-600" />;
      case 'task':
        return <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const sortedActivities = [...activities].reverse();

  return (
    <div className="space-y-3.5">
      {/* Header & Quick Log Trigger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Activity & Touchpoints ({activities.length})
          </h4>
        </div>
        {!isLogging && (
          <button
            type="button"
            onClick={() => setIsLogging(true)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#0B2545] hover:bg-blue-900 text-white font-bold text-[10.5px] transition"
          >
            <Plus className="w-3 h-3" />
            Log Touchpoint
          </button>
        )}
      </div>

      {/* Log Activity Form */}
      {isLogging && (
        <form onSubmit={handleLog} className="p-3 bg-slate-50 border border-slate-300 space-y-2.5">
          {/* Activity Type Selector */}
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'call', label: 'Call', icon: Phone },
              { id: 'meeting', label: 'Meeting', icon: Users },
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
              { id: 'note', label: 'Note', icon: FileText },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-1.5 text-[10.5px] font-bold border flex items-center justify-center gap-1 transition ${
                    activeTab === tab.id
                      ? 'bg-[#0B2545] text-white border-[#0B2545]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <IconComp className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === 'call'
                  ? 'Call summary (e.g. Discussed valuation scope)'
                  : activeTab === 'meeting'
                  ? 'Meeting title (e.g. Discovery session on zoom)'
                  : activeTab === 'whatsapp'
                  ? 'WhatsApp conversation topic'
                  : 'Internal advisory note heading'
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key talking points, client feedback, or required follow-up..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {(activeTab === 'call' || activeTab === 'meeting') && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 text-xs font-medium"
                >
                  <option value="Discussion Completed">Discussion Completed</option>
                  <option value="Interested - Send EL">Interested - Send EL</option>
                  <option value="Commercials in Negotiation">Commercials in Negotiation</option>
                  <option value="Waiting for Financials">Waiting for Financials</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Left Voicemail / No Answer">Left Voicemail / No Answer</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Next Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsLogging(false)}
              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-[#0B2545] hover:bg-blue-900 text-white font-bold text-xs transition"
            >
              Save Touchpoint
            </button>
          </div>
        </form>
      )}

      {/* Chronological Timeline List */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {sortedActivities.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No client touchpoints recorded yet. Click &ldquo;Log Touchpoint&rdquo; to track calls, meetings, or notes.
          </div>
        ) : (
          sortedActivities.map((act) => (
            <div
              key={act.id}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 transition text-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-slate-50 border border-slate-200">
                    {getActivityIcon(act.type)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {act.timestamp} • by {act.user}
                    </span>
                  </div>
                </div>
                {onDeleteActivity && (
                  <button
                    type="button"
                    onClick={() => onDeleteActivity(act.id)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                    title="Delete activity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {act.notes && (
                <p className="text-slate-700 text-[11px] bg-slate-50/60 p-1.5 border-l-2 border-slate-300">
                  {act.notes}
                </p>
              )}

              {(act.outcome || act.followUpDate) && (
                <div className="flex flex-wrap items-center gap-2 text-[10px] pt-0.5">
                  {act.outcome && (
                    <span className="font-semibold text-[#0B2545] bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                      {act.outcome}
                    </span>
                  )}
                  {act.followUpDate && (
                    <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-200">
                      Follow-up: {act.followUpDate}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
