import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { EngagementEditor } from './components/EngagementEditor';
import { TemplateManager } from './components/TemplateManager';
import { MarketingCrm } from './components/MarketingCrm';
import { FirmSettingsModal } from './components/FirmSettingsModal';
import { NewEngagementModal } from './components/NewEngagementModal';
import { SpotlightSearchModal } from './components/SpotlightSearchModal';
import { TrashModal } from './components/TrashModal';
import { CustomTaxonomyModal } from './components/CustomTaxonomyModal';
import {
  EngagementRecord,
  EngagementStatus,
  FirmProfile,
  ServiceTemplate,
  ClientDetails,
  CrmClientRecord,
  CustomTaxonomyConfig,
} from './types';
import {
  getStoredEngagements,
  getStoredFirmProfile,
  getStoredTemplates,
  saveEngagements,
  saveFirmProfile,
  saveTemplates,
  generateNextReference,
} from './utils/storage';
import {
  getStoredCrmRecords,
  saveCrmRecords,
  syncEngagementsWithCrm,
  getFormattedNow,
} from './utils/crmStorage';
import { getStoredTaxonomy, saveTaxonomy } from './utils/taxonomyStorage';
import { getStoredTrashItems, addToTrash } from './utils/trashStorage';
import { NotificationToast, dispatchToast } from './components/NotificationToast';
import { defaultTemplates } from './data/defaultTemplates';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'templates' | 'crm'>('dashboard');
  const [engagements, setEngagements] = useState<EngagementRecord[]>(() => getStoredEngagements());
  const [crmRecords, setCrmRecords] = useState<CrmClientRecord[]>(() => {
    const loadedEngs = getStoredEngagements();
    const loadedCrm = getStoredCrmRecords();
    return syncEngagementsWithCrm(loadedEngs, loadedCrm);
  });
  const [templates, setTemplates] = useState<ServiceTemplate[]>(() => {
    const loaded = getStoredTemplates();
    return loaded && loaded.length > 0 ? loaded : defaultTemplates;
  });
  const [firmProfile, setFirmProfile] = useState<FirmProfile>(() => getStoredFirmProfile());
  const [customTaxonomy, setCustomTaxonomy] = useState<CustomTaxonomyConfig>(() => getStoredTaxonomy());
  const [selectedEngagement, setSelectedEngagement] = useState<EngagementRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'firm' | 'theme' | 'signatories' | 'bank' | 'guide'>('theme');
  const [isNewEngagementModalOpen, setIsNewEngagementModalOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(false);
  const [trashCount, setTrashCount] = useState(() => getStoredTrashItems().length);
  const [globalSearch, setGlobalSearch] = useState('');
  const [editorReturnView, setEditorReturnView] = useState<'dashboard' | 'crm'>('dashboard');

  const refreshTrashCount = () => {
    setTrashCount(getStoredTrashItems().length);
  };

  // Load from local storage on mount (reconcile if any new updates)
  useEffect(() => {
    const loadedEngs = getStoredEngagements();
    const loadedTemps = getStoredTemplates();
    const loadedProfile = getStoredFirmProfile();
    const loadedCrm = getStoredCrmRecords();

    setEngagements(loadedEngs);
    setTemplates(loadedTemps && loadedTemps.length > 0 ? loadedTemps : defaultTemplates);
    setFirmProfile(loadedProfile);

    // Auto-sync engagements with CRM leads on startup so everything is connected
    const syncedCrm = syncEngagementsWithCrm(loadedEngs, loadedCrm);
    setCrmRecords(syncedCrm);
  }, []);

  // Global Command+K or Ctrl+K shortcut to toggle Apple Spotlight modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save changes to storage
  const handleSaveEngagementsList = (updated: EngagementRecord[]) => {
    setEngagements(updated);
    saveEngagements(updated);

    // Update CRM records sync
    const synced = syncEngagementsWithCrm(updated, crmRecords);
    setCrmRecords(synced);
    saveCrmRecords(synced);
  };

  const handleSaveCrmRecordsList = (updated: CrmClientRecord[]) => {
    setCrmRecords(updated);
    saveCrmRecords(updated);
  };

  const handleSaveTemplatesList = (updated: ServiceTemplate[]) => {
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleSaveFirmProfileData = (updated: FirmProfile) => {
    setFirmProfile(updated);
    saveFirmProfile(updated);
  };

  // Create new engagement from CRM Lead in 1 click
  const handleCreateEngagementFromCrm = (crmRecord: CrmClientRecord) => {
    const allTemplates = templates && templates.length > 0 ? templates : defaultTemplates;
    const deliverableTerm = (crmRecord?.natureOfDeliverable || '').toLowerCase().trim();

    // Find matching template based on deliverable keyword or default
    let matchedTemplate = allTemplates.find((t) => {
      if (!t || !t.serviceTitle) return false;
      const title = t.serviceTitle.toLowerCase();
      return deliverableTerm && (deliverableTerm.includes(title) || title.includes(deliverableTerm));
    });
    if (!matchedTemplate) {
      matchedTemplate = allTemplates[0] || defaultTemplates[0];
    }

    const safeServiceCode = matchedTemplate?.serviceCode || 'GEN';
    const { refNo, invoiceNo } = generateNextReference(safeServiceCode, engagements);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const defaultFee = matchedTemplate?.pricing?.feeAmount || 100000;
    const feeAmount = (crmRecord?.totalCommercial && crmRecord.totalCommercial > 0)
      ? crmRecord.totalCommercial
      : defaultFee;
    const advancePercent = (crmRecord?.totalCommercial && crmRecord.totalCommercial > 0 && crmRecord.advanceAmount)
      ? Math.round((crmRecord.advanceAmount / crmRecord.totalCommercial) * 100)
      : (matchedTemplate?.pricing?.customAdvancePercent || 50);

    const clonedService: ServiceTemplate = {
      ...JSON.parse(JSON.stringify(matchedTemplate)),
      pricing: {
        ...(matchedTemplate.pricing || {}),
        feeAmount,
        customAdvancePercent: advancePercent,
      },
    };

    const newEngagement: EngagementRecord = {
      id: `eng-${Date.now()}`,
      refNo,
      invoiceNo,
      date: crmRecord?.elStartDate || formattedDate,
      validityDays: matchedTemplate?.pricing?.validityDays || 14,
      projectTimeline: crmRecord?.tatDays ? `${crmRecord.tatDays} Days` : '3 to 4 Weeks',
      client: {
        addresseeName: crmRecord?.contactPerson || crmRecord?.clientName || 'Client Signatory',
        salutation: 'Dear Sir',
        companyName: crmRecord?.clientName || 'Valued Client',
        designation: 'Managing Director / Authorized Representative',
        businessEntityType: 'Private Limited',
        billingAddress: crmRecord?.location || '',
        state: (crmRecord?.location || '').includes('Maharashtra') ? 'Maharashtra' : (crmRecord?.location || 'Maharashtra'),
        email: crmRecord?.email || '',
        phone: crmRecord?.cellNumber || '',
      },
      service: clonedService,
      services: [clonedService],
      invoiceMilestoneType: 'advance',
      notes: `${crmRecord?.businessDetails ? crmRecord.businessDetails + '\n' : ''}${crmRecord?.remarks || ''}`,
      status: 'draft',
      createdBy: crmRecord?.owner || firmProfile?.signatoryName || 'CA Yogesh Kulkarni',
      createdAt: now.toISOString(),
      lastEditedAt: now.toISOString(),
      actionLog: [
        {
          timestamp: now.toISOString(),
          user: firmProfile?.signatoryName || 'CA Yogesh Kulkarni',
          action: `Generated from Marketing CRM lead #${crmRecord?.srNo || ''} (${crmRecord?.clientName || 'Client'})`,
        },
      ],
    };

    // Update CRM record with EL Number and linked engagement ID
    const updatedCrmRecords = crmRecords.map((r) =>
      r.id === crmRecord.id
        ? {
            ...r,
            elNumber: refNo,
            elStatus: 'Draft' as const,
            engagementId: newEngagement.id,
            updatedAt: getFormattedNow(),
          }
        : r
    );
    handleSaveCrmRecordsList(updatedCrmRecords);

    // Save and open in editor
    const updatedEngagements = [newEngagement, ...engagements];
    setEngagements(updatedEngagements);
    saveEngagements(updatedEngagements);

    setEditorReturnView('crm');
    setSelectedEngagement(newEngagement);
    setView('editor');
  };

  // Create new engagement with one or multiple service offerings
  const handleCreateEngagementWithServices = (
    selectedTemplates: ServiceTemplate[],
    clientData: Partial<ClientDetails>
  ) => {
    const allTemplates = templates && templates.length > 0 ? templates : defaultTemplates;
    const primaryTemplate = (selectedTemplates && selectedTemplates.length > 0 ? selectedTemplates[0] : null) || allTemplates[0] || defaultTemplates[0];
    const safeServiceCode = primaryTemplate?.serviceCode || 'GEN';
    const { refNo, invoiceNo } = generateNextReference(safeServiceCode, engagements);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const newRec: EngagementRecord = {
      id: `eng-${Date.now()}`,
      refNo,
      invoiceNo,
      date: formattedDate,
      validityDays: primaryTemplate?.pricing?.validityDays || 7,
      client: {
        addresseeName: clientData.addresseeName || '',
        salutation: clientData.salutation || 'Dear Sir',
        companyName: clientData.companyName || '',
        designation: clientData.designation || '',
        businessEntityType: clientData.businessEntityType || 'Private Limited',
        billingAddress: clientData.billingAddress || '',
        state: clientData.state || firmProfile.registeredState || 'Maharashtra',
        gstin: clientData.gstin || '',
        pan: clientData.pan || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
      },
      service: JSON.parse(JSON.stringify(primaryTemplate)),
      services: JSON.parse(JSON.stringify(selectedTemplates)),
      invoiceMilestoneType: 'advance',
      notes: '',
      status: 'draft',
      createdBy: firmProfile.signatoryName || 'CA Yogesh Kulkarni',
      createdAt: now.toISOString(),
      lastEditedAt: now.toISOString(),
      actionLog: [
        {
          timestamp: now.toISOString(),
          user: firmProfile.signatoryName || 'CA Yogesh Kulkarni',
          action: `Created engagement draft bundling ${selectedTemplates.length} service offerings`,
        },
      ],
    };

    setSelectedEngagement(newRec);
    setView('editor');
  };

  const handleStartNewEngagement = (templateOverride?: ServiceTemplate) => {
    if (templateOverride) {
      handleCreateEngagementWithServices([templateOverride], {});
    } else {
      setIsNewEngagementModalOpen(true);
    }
  };

  const handleEditEngagement = (record: EngagementRecord) => {
    setEditorReturnView('dashboard');
    setSelectedEngagement(record);
    setView('editor');
  };

  const handleEditEngagementFromCrm = (record: EngagementRecord) => {
    setEditorReturnView('crm');
    setSelectedEngagement(record);
    setView('editor');
  };

  const handleSaveEngagementInEditor = (record: EngagementRecord) => {
    const exists = engagements.some((e) => e.id === record.id);
    let updated: EngagementRecord[];
    if (exists) {
      updated = engagements.map((e) => (e.id === record.id ? record : e));
    } else {
      updated = [record, ...engagements];
    }
    handleSaveEngagementsList(updated);
    setSelectedEngagement(record);
  };

  const handleDuplicateEngagement = (record: EngagementRecord) => {
    const primaryService = record?.service || (record?.services && record.services[0]) || defaultTemplates[0];
    const safeServiceCode = primaryService?.serviceCode || 'GEN';
    const { refNo, invoiceNo } = generateNextReference(safeServiceCode, engagements);
    const clone: EngagementRecord = {
      ...JSON.parse(JSON.stringify(record)),
      id: `eng-clone-${Date.now()}`,
      refNo,
      invoiceNo,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      actionLog: [
        {
          timestamp: new Date().toISOString(),
          user: firmProfile?.signatoryName || 'CA Yogesh Kulkarni',
          action: `Duplicated from ${record?.refNo || 'original'}`,
        },
      ],
    };
    const updated = [clone, ...engagements];
    handleSaveEngagementsList(updated);
  };

  const handleDeleteEngagement = (id: string) => {
    const target = engagements.find((e) => e.id === id);
    if (target) {
      addToTrash(
        'engagement',
        `Engagement #${target.refNo} - ${target.client?.companyName || target.client?.addresseeName || 'Client'}`,
        target.service?.serviceTitle || 'Advisory Charter',
        target,
        firmProfile.signatoryName || 'Authorized Signatory'
      );
      refreshTrashCount();
      dispatchToast({
        title: 'Moved to Dustbin',
        message: `Engagement #${target.refNo} was recycled and can be restored with millisecond accuracy.`,
        type: 'info',
        actionLabel: 'Undo',
        onAction: () => {
          const updated = [target, ...engagements.filter((e) => e.id !== id)];
          handleSaveEngagementsList(updated);
        },
      });
    }

    const updated = engagements.filter((e) => e.id !== id);
    handleSaveEngagementsList(updated);
    if (selectedEngagement?.id === id) {
      setSelectedEngagement(null);
      setView('dashboard');
    }
  };

  const handleRestoreLeadFromTrash = (lead: CrmClientRecord) => {
    const updated = [lead, ...crmRecords.filter((r) => r.id !== lead.id)];
    handleSaveCrmRecordsList(updated);
    refreshTrashCount();
  };

  const handleRestoreEngagementFromTrash = (eng: EngagementRecord) => {
    const updated = [eng, ...engagements.filter((e) => e.id !== eng.id)];
    handleSaveEngagementsList(updated);
    refreshTrashCount();
  };

  const handleSaveTaxonomy = (updated: CustomTaxonomyConfig) => {
    setCustomTaxonomy(updated);
    saveTaxonomy(updated);
    dispatchToast({
      title: 'Lists Updated',
      message: 'Custom statuses, stages, and options have been successfully saved.',
      type: 'success',
    });
  };

  const handleUpdateStatus = (id: string, newStatus: EngagementStatus) => {
    const updated = engagements.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          status: newStatus,
          lastEditedAt: new Date().toISOString(),
          actionLog: [
            ...e.actionLog,
            {
              timestamp: new Date().toISOString(),
              user: firmProfile.signatoryName || 'CA Yogesh Kulkarni',
              action: `Status changed to ${newStatus}`,
            },
          ],
        };
      }
      return e;
    });
    handleSaveEngagementsList(updated);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Navigation */}
      <Navbar
        currentView={view}
        onNavigate={(v) => setView(v)}
        onOpenSettings={() => {
          setSettingsInitialTab('theme');
          setIsSettingsOpen(true);
        }}
        onOpenHelpGuide={() => {
          setSettingsInitialTab('guide');
          setIsSettingsOpen(true);
        }}
        onNewEngagement={() => handleStartNewEngagement()}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onOpenTrash={() => setIsTrashOpen(true)}
        trashCount={trashCount}
        onOpenTaxonomy={() => setIsTaxonomyOpen(true)}
        firmProfile={firmProfile}
        crmCount={crmRecords.length}
        globalSearch={globalSearch}
        onGlobalSearchChange={(q) => {
          setGlobalSearch(q);
          if (view !== 'dashboard' && view !== 'crm' && q.trim()) {
            setView('dashboard');
          }
        }}
      />

      {/* Main View Container with smooth transition */}
      <main className="flex-1">
        {/* VIEW 1: Engagements Dashboard */}
        {view === 'dashboard' && (
          <div key="dashboard-view" className="animate-view-in">
            <Dashboard
              engagements={engagements}
              firmProfile={firmProfile}
              onNewEngagement={() => handleStartNewEngagement()}
              onEditEngagement={handleEditEngagement}
              onDuplicateEngagement={handleDuplicateEngagement}
              onDeleteEngagement={handleDeleteEngagement}
              onUpdateStatus={handleUpdateStatus}
              onOpenTemplateManager={() => setView('templates')}
              onOpenFirmSettings={() => setIsSettingsOpen(true)}
              onNavigateToCrm={() => setView('crm')}
              globalSearchQuery={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
            />
          </div>
        )}

        {/* VIEW 2: Full-Fledged Marketing CRM / ERP */}
        {view === 'crm' && (
          <div key="crm-view" className="animate-view-in">
            <MarketingCrm
              crmRecords={crmRecords}
              onSaveCrmRecords={handleSaveCrmRecordsList}
              engagements={engagements}
              firmProfile={firmProfile}
              availableTemplates={templates}
              onOpenEngagementEditor={handleEditEngagementFromCrm}
              onCreateEngagementFromCrm={handleCreateEngagementFromCrm}
              onNavigateToDashboard={() => setView('dashboard')}
              customTaxonomy={customTaxonomy}
              onOpenTaxonomy={() => setIsTaxonomyOpen(true)}
              onOpenTrash={() => setIsTrashOpen(true)}
              trashCount={trashCount}
            />
          </div>
        )}

        {/* VIEW 3: Engagement Document & Invoice Editor */}
        {view === 'editor' && selectedEngagement && (
          <div key={`editor-${selectedEngagement.id}`} className="animate-view-in">
            <EngagementEditor
              initialRecord={selectedEngagement}
              firmProfile={firmProfile}
              availableTemplates={templates}
              onSave={handleSaveEngagementInEditor}
              onBack={() => setView(editorReturnView)}
              onOpenTemplateManager={() => setView('templates')}
              onCloneEngagement={handleDuplicateEngagement}
            />
          </div>
        )}

        {/* VIEW 4: Service Master Templates */}
        {view === 'templates' && (
          <div key="templates-view" className="animate-view-in">
            <TemplateManager
              templates={templates}
              onSaveTemplates={handleSaveTemplatesList}
              onSelectTemplateForNewEngagement={(t) => {
                handleStartNewEngagement(t);
              }}
              onBackToDashboard={() => setView('dashboard')}
            />
          </div>
        )}
      </main>

      {/* Apple Spotlight Search Modal */}
      <SpotlightSearchModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        initialQuery={globalSearch}
        engagements={engagements}
        templates={templates}
        firmProfile={firmProfile}
        onSelectEngagement={(rec) => {
          setSelectedEngagement(rec);
          setView('editor');
        }}
        onNewEngagement={() => handleStartNewEngagement()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setView('templates')}
        onSelectTemplate={(tmpl) => {
          handleStartNewEngagement(tmpl);
        }}
      />

      {/* Settings Modal */}
      <FirmSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        firmProfile={firmProfile}
        onSave={handleSaveFirmProfileData}
        onOpenTaxonomy={() => setIsTaxonomyOpen(true)}
        initialTab={settingsInitialTab}
      />

      {/* New Engagement Multi-Service Selection Modal */}
      <NewEngagementModal
        isOpen={isNewEngagementModalOpen}
        onClose={() => setIsNewEngagementModalOpen(false)}
        templates={templates}
        existingEngagements={engagements}
        onCreateEngagement={handleCreateEngagementWithServices}
      />

      {/* Recycle Bin / Dustbin Modal with Millisecond Precision */}
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onRestoreLead={handleRestoreLeadFromTrash}
        onRestoreEngagement={handleRestoreEngagementFromTrash}
        onTrashUpdated={refreshTrashCount}
      />

      {/* Custom Lists & Taxonomy Configurator */}
      <CustomTaxonomyModal
        isOpen={isTaxonomyOpen}
        onClose={() => setIsTaxonomyOpen(false)}
        taxonomy={customTaxonomy}
        onSaveTaxonomy={handleSaveTaxonomy}
      />

      {/* Global Apple-style Spring Animated Notification Toasts */}
      <NotificationToast />
    </div>
  );
}
