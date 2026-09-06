import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  FileCheck,
  Save,
  HelpCircle,
  RotateCcw,
  AlertTriangle,
  X,
} from 'lucide-react';
import { ServiceTemplate, PaymentMilestone } from '../types';
import { defaultTemplates } from '../data/defaultTemplates';
import { formatIndianCurrency } from '../utils/numberToIndianWords';

interface TemplateManagerProps {
  templates: ServiceTemplate[];
  onSaveTemplates: (updated: ServiceTemplate[]) => void;
  onSelectTemplateForNewEngagement: (template: ServiceTemplate) => void;
  onBackToDashboard: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onSaveTemplates,
  onSelectTemplateForNewEngagement,
  onBackToDashboard,
}) => {
  const [editingTemplate, setEditingTemplate] = useState<ServiceTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'objectives' | 'deliverables' | 'info' | 'pricing' | 'conditions'>('basics');

  // Deletion and restoration modal states
  const [templateToDelete, setTemplateToDelete] = useState<ServiceTemplate | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isRestoreDefaultsModalOpen, setIsRestoreDefaultsModalOpen] = useState(false);

  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [newDelHeading, setNewDelHeading] = useState('');
  const [newDelBody, setNewDelBody] = useState('');
  const [newInfoText, setNewInfoText] = useState('');
  const [newConditionText, setNewConditionText] = useState('');

  // Handle opening editor for new template
  const handleStartCreate = () => {
    const freshTemplate: ServiceTemplate = {
      id: `custom-template-${Date.now()}`,
      serviceCode: 'ADV',
      serviceTitle: 'Custom Strategic Advisory Engagement',
      subjectLine: 'Engagement for Strategic Advisory Services',
      openingParagraphs: [
        'Thank you for the opportunity to assist your esteemed enterprise in evaluating strategic opportunities, government incentives, and operational optimization.',
        'Our approach is structured to align regulatory, financial, and strategic assistance with your long-term growth roadmaps.',
      ],
      objectives: [
        { id: `obj-${Date.now()}-1`, text: 'Conduct comprehensive evaluation of applicable incentives and compliances', include: true },
        { id: `obj-${Date.now()}-2`, text: 'Formulate an actionable implementation roadmap with defined timelines', include: true },
      ],
      deliverables: [
        {
          id: `del-${Date.now()}-1`,
          heading: '2.1  Strategic Implementation Matrix & Action Plan',
          body: 'A dedicated advisory matrix covering statutory compliances, incentive mapping, and actionable milestones.',
          include: true,
        },
      ],
      informationRequired: [
        { id: `inf-${Date.now()}-1`, text: 'Certificate of Incorporation / Registration documents', include: true },
        { id: `inf-${Date.now()}-2`, text: 'Audited Financial Statements for the last three financial years', include: true },
      ],
      pricing: {
        feeLabel: 'Professional Investment for Advisory Services',
        feeAmount: 20000,
        currency: 'INR',
        gstPercent: 18,
        paymentSplit: [
          { id: 'p1', milestone: 'Upon acceptance and prior to kickoff (mobilization advance)', percent: 50 },
          { id: 'p2', milestone: 'Upon completion and report submission', percent: 50 },
        ],
        validityDays: 7,
      },
      additionalConditions: [
        'Our reports reflect professional assessment only; sovereign approvals and disbursements rest solely with the concerned government departments.',
      ],
      isCustom: true,
    };
    setEditingTemplate(freshTemplate);
    setIsCreatingNew(true);
    setActiveTab('basics');
  };

  const handleStartEdit = (template: ServiceTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setIsCreatingNew(false);
    setActiveTab('basics');
  };

  const handleDuplicate = (template: ServiceTemplate) => {
    const clone: ServiceTemplate = JSON.parse(JSON.stringify(template));
    clone.id = `template-clone-${Date.now()}`;
    clone.serviceCode = `${clone.serviceCode || 'SVC'}-COPY`;
    clone.serviceTitle = `${clone.serviceTitle || 'Service'} (Copy)`;
    clone.isCustom = true;
    const updated = [...templates, clone];
    onSaveTemplates(updated);
  };

  // Delete single template (confirmed via in-app modal)
  const handleConfirmDeleteOne = () => {
    if (!templateToDelete) return;
    const updated = templates.filter((t) => t.id !== templateToDelete.id);
    onSaveTemplates(updated);
    setTemplateToDelete(null);
  };

  // Delete all templates (confirmed via in-app modal)
  const handleConfirmDeleteAll = () => {
    onSaveTemplates([]);
    setIsDeleteAllModalOpen(false);
  };

  // Restore default templates catalog
  const handleConfirmRestoreDefaults = () => {
    const freshDefaults = JSON.parse(JSON.stringify(defaultTemplates));
    onSaveTemplates(freshDefaults);
    setIsRestoreDefaultsModalOpen(false);
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (!editingTemplate.serviceTitle.trim() || !editingTemplate.serviceCode.trim()) {
      alert('Service Title and Code are required.');
      return;
    }

    let updated: ServiceTemplate[];
    if (isCreatingNew) {
      updated = [...templates, editingTemplate];
    } else {
      updated = templates.map((t) => (t.id === editingTemplate.id ? editingTemplate : t));
    }

    onSaveTemplates(updated);
    setEditingTemplate(null);
    setIsCreatingNew(false);
  };

  // Sub-item add helpers
  const handleAddObjective = () => {
    if (!newObjectiveText.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      objectives: [
        ...editingTemplate.objectives,
        { id: `obj-${Date.now()}`, text: newObjectiveText.trim(), include: true },
      ],
    });
    setNewObjectiveText('');
  };

  const handleAddDeliverable = () => {
    if (!newDelHeading.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      deliverables: [
        ...editingTemplate.deliverables,
        {
          id: `del-${Date.now()}`,
          heading: newDelHeading.trim(),
          body: newDelBody.trim() || 'Detailed advisory deliverable as agreed.',
          include: true,
        },
      ],
    });
    setNewDelHeading('');
    setNewDelBody('');
  };

  const handleAddInfoRequired = () => {
    if (!newInfoText.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      informationRequired: [
        ...editingTemplate.informationRequired,
        { id: `inf-${Date.now()}`, text: newInfoText.trim(), include: true },
      ],
    });
    setNewInfoText('');
  };

  const handleAddCondition = () => {
    if (!newConditionText.trim() || !editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      additionalConditions: [
        ...(editingTemplate.additionalConditions || []),
        newConditionText.trim(),
      ],
    });
    setNewConditionText('');
  };

  if (editingTemplate) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingTemplate(null)}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-none transition"
              title="Back to Templates"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-zinc-950">
                {isCreatingNew ? 'Create New Service & Conditions' : `Edit: ${editingTemplate.serviceTitle}`}
              </h1>
              <p className="text-xs text-zinc-500">
                Define the service scope, objectives, deliverables, pricing, and specific legal conditions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingTemplate(null)}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-none text-sm font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEditor}
              className="flex items-center gap-2 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-none text-sm font-bold shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              Save Service Template
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 border-b border-blue-100 mb-6 pb-1">
          {[
            { id: 'basics', label: '1. Basic Details & Intro' },
            { id: 'objectives', label: `2. Objectives (${editingTemplate.objectives.length})` },
            { id: 'deliverables', label: `3. Deliverables (${editingTemplate.deliverables.length})` },
            { id: 'info', label: `4. Documents Required (${editingTemplate.informationRequired.length})` },
            { id: 'pricing', label: '5. Commercial Proposal & Fee' },
            { id: 'conditions', label: `6. Specific Conditions (${editingTemplate.additionalConditions?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-none text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveEditor} className="space-y-6 bg-white p-6 rounded-none border border-zinc-300 shadow-sm">
          {/* TAB: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Code (Short) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.serviceCode}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        serviceCode: e.target.value.toUpperCase().replace(/\s+/g, ''),
                      })
                    }
                    placeholder="e.g. MSME, STARTUP, SUBSIDY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm font-mono focus:ring-2 focus:ring-blue-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Used in Ref & Invoice No.</p>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Service Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.serviceTitle}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, serviceTitle: e.target.value })
                    }
                    placeholder="e.g. MSME Benefits Assessment & Strategic Advisory Engagement"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm font-semibold focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Line for Engagement Letter <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingTemplate.subjectLine}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subjectLine: e.target.value })
                  }
                  placeholder="e.g. Engagement for MSME Benefits Assessment & Strategic Advisory Services"
                  className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Paragraphs
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Enter each introductory paragraph on a new line or separate by empty lines.
                </p>
                <textarea
                  rows={5}
                  value={editingTemplate.openingParagraphs.join('\n\n')}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      openingParagraphs: e.target.value
                        .split('\n\n')
                        .map((p) => p.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Project Timeline
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.projectTimeline || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, projectTimeline: e.target.value })
                    }
                    placeholder="e.g. 3 to 4 Weeks"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800 font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Duration range entered for this service (e.g. 3 to 4 Weeks, 4 to 6 Weeks).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Enablers / Dependency Clause
                  </label>
                  <textarea
                    rows={2}
                    value={editingTemplate.clientEnablersClause || ''}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        clientEnablersClause: e.target.value,
                      })
                    }
                    placeholder="e.g. Adherence to delivery timelines is strictly subject to the timely provision of requisite documentation..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs focus:ring-2 focus:ring-blue-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Specifies that turnaround time depends on receiving client inputs on time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OBJECTIVES */}
          {activeTab === 'objectives' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjectiveText}
                  onChange={(e) => setNewObjectiveText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddObjective();
                    }
                  }}
                  placeholder="Type an objective and press Add or Enter..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                />
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-none text-sm font-semibold hover:bg-blue-800"
                >
                  <Plus className="w-4 h-4" /> Add Objective
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {editingTemplate.objectives.map((obj, index) => (
                  <div
                    key={obj.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none"
                  >
                    <span className="text-xs font-bold text-slate-400 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={obj.text}
                      onChange={(e) => {
                        const updated = [...editingTemplate.objectives];
                        updated[index].text = e.target.value;
                        setEditingTemplate({ ...editingTemplate, objectives: updated });
                      }}
                      className="flex-1 bg-transparent text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 px-2 py-1 rounded-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingTemplate.objectives.filter((_, i) => i !== index);
                        setEditingTemplate({ ...editingTemplate, objectives: updated });
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-none"
                      title="Delete objective"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DELIVERABLES */}
          {activeTab === 'deliverables' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-none space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                  Add New Deliverable
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deliverable Heading (e.g., 2.1 MSME Implementation Register)
                  </label>
                  <input
                    type="text"
                    value={newDelHeading}
                    onChange={(e) => setNewDelHeading(e.target.value)}
                    placeholder="e.g. 2.1  MSME Implementation Register & Action Tracker (Excel)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deliverable Description
                  </label>
                  <textarea
                    rows={3}
                    value={newDelBody}
                    onChange={(e) => setNewDelBody(e.target.value)}
                    placeholder="Provide a comprehensive technical description of this deliverable..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-none text-sm font-semibold hover:bg-blue-800"
                >
                  <Plus className="w-4 h-4" /> Add Deliverable
                </button>
              </div>

              <div className="space-y-3">
                {editingTemplate.deliverables.map((del, index) => (
                  <div
                    key={del.id}
                    className="p-4 bg-white border border-slate-200 rounded-none space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={del.heading}
                        onChange={(e) => {
                          const updated = [...editingTemplate.deliverables];
                          updated[index].heading = e.target.value;
                          setEditingTemplate({ ...editingTemplate, deliverables: updated });
                        }}
                        className="flex-1 font-bold text-sm text-slate-900 border-b border-slate-200 focus:outline-none focus:border-blue-900 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingTemplate.deliverables.filter((_, i) => i !== index);
                          setEditingTemplate({ ...editingTemplate, deliverables: updated });
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Delete deliverable"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={del.body}
                      onChange={(e) => {
                        const updated = [...editingTemplate.deliverables];
                        updated[index].body = e.target.value;
                        setEditingTemplate({ ...editingTemplate, deliverables: updated });
                      }}
                      className="w-full text-xs sm:text-sm text-slate-700 border border-slate-200 rounded-none p-2 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: INFO REQUIRED */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Documents and records requested from the client for this service assessment.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInfoText}
                  onChange={(e) => setNewInfoText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInfoRequired();
                    }
                  }}
                  placeholder="e.g. Udyam Registration Certificate, GST Returns..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                />
                <button
                  type="button"
                  onClick={handleAddInfoRequired}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-none text-sm font-semibold hover:bg-blue-800"
                >
                  <Plus className="w-4 h-4" /> Add Document
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {editingTemplate.informationRequired.map((info, index) => (
                  <div
                    key={info.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none"
                  >
                    <span className="text-xs font-bold text-slate-400 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={info.text}
                      onChange={(e) => {
                        const updated = [...editingTemplate.informationRequired];
                        updated[index].text = e.target.value;
                        setEditingTemplate({ ...editingTemplate, informationRequired: updated });
                      }}
                      className="flex-1 bg-transparent text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 px-2 py-1 rounded-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingTemplate.informationRequired.filter((_, i) => i !== index);
                        setEditingTemplate({ ...editingTemplate, informationRequired: updated });
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-none"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PRICING & COMMERCIALS */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee Label
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.pricing.feeLabel}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        pricing: { ...editingTemplate.pricing, feeLabel: e.target.value },
                      })
                    }
                    placeholder="e.g. Professional Investment for MSME Benefits Assessment"
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={editingTemplate.pricing.feeAmount}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        pricing: {
                          ...editingTemplate.pricing,
                          feeAmount: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm font-semibold focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={editingTemplate.pricing.gstPercent}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        pricing: {
                          ...editingTemplate.pricing,
                          gstPercent: parseFloat(e.target.value) || 18,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposal Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={editingTemplate.pricing.validityDays}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        pricing: {
                          ...editingTemplate.pricing,
                          validityDays: parseInt(e.target.value, 10) || 7,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              {/* Payment Split Milestones */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-2">
                  Payment Split Milestones
                </label>
                <div className="space-y-3">
                  {editingTemplate.pricing.paymentSplit.map((split, idx) => (
                    <div
                      key={split.id || idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none items-center"
                    >
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Percent (%)
                        </label>
                        <input
                          type="number"
                          value={split.percent}
                          onChange={(e) => {
                            const updated = [...editingTemplate.pricing.paymentSplit];
                            updated[idx].percent = parseFloat(e.target.value) || 0;
                            setEditingTemplate({
                              ...editingTemplate,
                              pricing: { ...editingTemplate.pricing, paymentSplit: updated },
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-none text-sm font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-9">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Milestone Trigger & Description
                        </label>
                        <input
                          type="text"
                          value={split.milestone}
                          onChange={(e) => {
                            const updated = [...editingTemplate.pricing.paymentSplit];
                            updated[idx].milestone = e.target.value;
                            setEditingTemplate({
                              ...editingTemplate,
                              pricing: { ...editingTemplate.pricing, paymentSplit: updated },
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-none text-sm"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center pt-5 sm:pt-0">
                        {editingTemplate.pricing.paymentSplit.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editingTemplate.pricing.paymentSplit.filter((_, i) => i !== idx);
                              setEditingTemplate({
                                ...editingTemplate,
                                pricing: { ...editingTemplate.pricing, paymentSplit: updated },
                              });
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newSplit: PaymentMilestone = {
                        id: `p-${Date.now()}`,
                        milestone: 'Upon intermediate milestone deliverable',
                        percent: 25,
                      };
                      setEditingTemplate({
                        ...editingTemplate,
                        pricing: {
                          ...editingTemplate.pricing,
                          paymentSplit: [...editingTemplate.pricing.paymentSplit, newSplit],
                        },
                      });
                    }}
                    className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Payment Milestone
                  </button>
                </div>
              </div>

              {/* Price Breakdown / Itemized Fee Structure */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-950">
                      Itemized Price Breakdown & Deliverable Costing
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Add granular price components (e.g. Phase 1 Discovery: ₹15,000, Sovereign Filing: ₹35,000). These itemized rows will automatically appear directly underneath the service in the Engagement Letter.
                    </p>
                  </div>
                  {((editingTemplate.lineItems || editingTemplate.pricing?.lineItems || []).length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = editingTemplate.lineItems || editingTemplate.pricing?.lineItems || [];
                        const sum = items.reduce((acc, it) => acc + (it.amount || 0), 0);
                        if (sum > 0) {
                          setEditingTemplate({
                            ...editingTemplate,
                            pricing: {
                              ...editingTemplate.pricing,
                              feeAmount: sum,
                            },
                          });
                        }
                      }}
                      className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-1 border border-blue-200 hover:bg-blue-100 transition"
                      title="Set default fee equal to sum of itemized breakup"
                    >
                      Sync Fee to Sum of Breakup
                    </button>
                  )}
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  {((editingTemplate.lineItems || editingTemplate.pricing?.lineItems || [])).map((item, lIdx) => (
                    <div
                      key={item.id || lIdx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-none items-center"
                    >
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Breakdown Item Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const current = [...(editingTemplate.lineItems || editingTemplate.pricing?.lineItems || [])];
                            current[lIdx] = { ...current[lIdx], description: e.target.value };
                            setEditingTemplate({
                              ...editingTemplate,
                              lineItems: current,
                              pricing: { ...editingTemplate.pricing, lineItems: current },
                            });
                          }}
                          placeholder="e.g. Phase 1: Diagnostic Assessment & Verification"
                          className="w-full px-2 py-1 border border-slate-300 rounded-none text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => {
                            const current = [...(editingTemplate.lineItems || editingTemplate.pricing?.lineItems || [])];
                            current[lIdx] = { ...current[lIdx], amount: parseFloat(e.target.value) || 0 };
                            setEditingTemplate({
                              ...editingTemplate,
                              lineItems: current,
                              pricing: { ...editingTemplate.pricing, lineItems: current },
                            });
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded-none text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Unit / Tag
                        </label>
                        <input
                          type="text"
                          value={item.unit || ''}
                          onChange={(e) => {
                            const current = [...(editingTemplate.lineItems || editingTemplate.pricing?.lineItems || [])];
                            current[lIdx] = { ...current[lIdx], unit: e.target.value };
                            setEditingTemplate({
                              ...editingTemplate,
                              lineItems: current,
                              pricing: { ...editingTemplate.pricing, lineItems: current },
                            });
                          }}
                          placeholder="Lumpsum"
                          className="w-full px-2 py-1 border border-slate-300 rounded-none text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => {
                            const current = (editingTemplate.lineItems || editingTemplate.pricing?.lineItems || []).filter((_, i) => i !== lIdx);
                            setEditingTemplate({
                              ...editingTemplate,
                              lineItems: current,
                              pricing: { ...editingTemplate.pricing, lineItems: current },
                            });
                          }}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newItem = {
                        id: `li-${Date.now()}`,
                        description: '',
                        amount: 0,
                        unit: 'Lumpsum',
                      };
                      const current = [...(editingTemplate.lineItems || editingTemplate.pricing?.lineItems || []), newItem];
                      setEditingTemplate({
                        ...editingTemplate,
                        lineItems: current,
                        pricing: { ...editingTemplate.pricing, lineItems: current },
                      });
                    }}
                    className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Price Breakdown Component
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONDITIONS & SPECIAL TERMS */}
          {activeTab === 'conditions' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-none text-xs text-amber-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Custom Service Conditions & Disclaimers</p>
                  <p className="mt-0.5 text-amber-800">
                    Add specific conditions (e.g., Executive Strategy Discussion scheduling terms, inspection requirements, sovereign discretion disclaimer). These will be saved for this service so you can reuse them every time!
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConditionText}
                  onChange={(e) => setNewConditionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCondition();
                    }
                  }}
                  placeholder="Type specific condition clause and press Add..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-none text-sm focus:ring-2 focus:ring-blue-800"
                />
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-none text-sm font-semibold hover:bg-blue-800"
                >
                  <Plus className="w-4 h-4" /> Add Condition
                </button>
              </div>

              <div className="space-y-2.5 mt-4">
                {(editingTemplate.additionalConditions || []).map((cond, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none"
                  >
                    <span className="text-xs font-bold text-slate-400 mt-1">{index + 1}.</span>
                    <textarea
                      rows={2}
                      value={cond}
                      onChange={(e) => {
                        const updated = [...(editingTemplate.additionalConditions || [])];
                        updated[index] = e.target.value;
                        setEditingTemplate({
                          ...editingTemplate,
                          additionalConditions: updated,
                        });
                      }}
                      className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 p-1.5 rounded-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (editingTemplate.additionalConditions || []).filter((_, i) => i !== index);
                        setEditingTemplate({
                          ...editingTemplate,
                          additionalConditions: updated,
                        });
                      }}
                      className="text-slate-400 hover:text-red-600 p-1.5 mt-1"
                      title="Delete condition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingTemplate(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-none text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-none text-sm font-bold shadow transition"
            >
              <Save className="w-4 h-4" />
              Save Service Template
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Templates List View
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Services & Conditions Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Create, customize, and manage advisory service offerings with pre-configured deliverables, pricing, and terms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Restore Defaults Button */}
          <button
            type="button"
            onClick={() => setIsRestoreDefaultsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-none text-xs font-semibold shadow-2xs btn-interactive"
            title="Reload default advisory catalog (MSME, Project Finance, Startup, etc.)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 btn-icon-hover" />
            <span>Restore Defaults</span>
          </button>

          {/* Delete All Services Button */}
          {templates.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-none text-xs font-semibold shadow-2xs btn-interactive"
              title="Delete all service templates from the library"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 btn-icon-trash" />
              <span>Delete All Services</span>
            </button>
          )}

          {/* Add New Service Button */}
          <button
            type="button"
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none text-xs font-semibold shadow-xs btn-interactive"
          >
            <Plus className="w-4 h-4 btn-icon-hover" />
            <span>+ Add New Service</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {templates.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Services & Conditions Library is Empty
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            You currently have no service templates configured. You can either build a custom advisory offering from scratch or restore the standard advisory catalog.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleConfirmRestoreDefaults}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs btn-interactive"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Restore Default Advisory Catalog
            </button>
            <button
              type="button"
              onClick={handleStartCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs btn-interactive"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Service
            </button>
          </div>
        </div>
      ) : (
        /* Grid of Templates */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-none shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs font-semibold rounded-none">
                    {template.serviceCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-none">
                    {formatIndianCurrency(template.pricing.feeAmount)}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1.5 group-hover:text-indigo-900 transition-colors">
                  {template.serviceTitle}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3.5">
                  {template.subjectLine}
                </p>

                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-center text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{template.objectives.length}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Objectives</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{template.deliverables.length}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Deliverables</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {template.additionalConditions?.length || 0}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Conditions</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTemplateForNewEngagement(template)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 btn-interactive"
                >
                  <FileCheck className="w-3.5 h-3.5 btn-icon-hover" />
                  <span>Use in Letter</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(template)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-none border border-transparent hover:border-slate-200 btn-interactive"
                    title="Edit Service & Conditions"
                  >
                    <Edit2 className="w-3.5 h-3.5 btn-icon-edit" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(template)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-none border border-transparent hover:border-slate-200 btn-interactive"
                    title="Duplicate Template"
                  >
                    <Copy className="w-3.5 h-3.5 btn-icon-hover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateToDelete(template)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none border border-transparent hover:border-rose-200 btn-interactive"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5 btn-icon-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Modal: Single Template Deletion Confirmation */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-backdrop-in">
          <div className="bg-white border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-modal-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Service Template?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{templateToDelete?.serviceTitle || 'Template'}"</span> ({templateToDelete?.serviceCode || 'SVC'})? Existing signed engagement charters will retain their stored copy.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold btn-interactive"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOne}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs btn-interactive flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Service</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Delete All Templates Confirmation */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-backdrop-in">
          <div className="bg-white border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-modal-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete ALL Services & Conditions?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  This will remove all {templates.length} service templates from your library. You can restore the default standard advisory offerings at any time.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold btn-interactive"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs btn-interactive flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Restore Default Catalog Confirmation */}
      {isRestoreDefaultsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-backdrop-in">
          <div className="bg-white border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-modal-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Restore Default Advisory Catalog?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  This will reset your service catalog to the standard advisory packages (MSME Benefits Assessment, Project Finance & Subsidies, Virtual CFO & Treasury, Startup Advisory, Due Diligence, etc.).
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRestoreDefaultsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold btn-interactive"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreDefaults}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs btn-interactive flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
