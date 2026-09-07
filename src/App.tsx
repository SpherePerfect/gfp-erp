import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { EngagementEditor } from './components/EngagementEditor';
import { TemplateManager } from './components/TemplateManager';
import { MarketingCrm } from './components/MarketingCrm';
import { LceCommissionTracker } from './components/LceCommissionTracker';
import { FirmSettingsModal } from './components/FirmSettingsModal';
import { NewEngagementModal } from './components/NewEngagementModal';
import { SpotlightSearchModal } from './components/SpotlightSearchModal';
import { TrashModal } from './components/TrashModal';
import { CustomTaxonomyModal } from './components/CustomTaxonomyModal';
import { AdminUserManagementModal } from './components/AdminUserManagementModal';
import {
  EngagementRecord,
  EngagementStatus,
  FirmProfile,
  ServiceTemplate,
  ClientDetails,
  CrmClientRecord,
  CustomTaxonomyConfig,
  LceRecord,
  AppUser,
  UserRole,
} from './types';
import {
  auth,
  signInWithGoogle,
  logOutUser,
  PRIMARY_ADMIN_EMAIL,
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToUsers,
  subscribeToEngagements,
  subscribeToCrmRecords,
  subscribeToLceRecords,
  subscribeToTemplates,
  subscribeToFirmProfile,
  subscribeToTaxonomy,
  subscribeToTrash,
  saveUserDoc,
  deleteUserDoc,
  saveEngagementDoc,
  deleteEngagementDoc,
  saveCrmRecordDoc,
  deleteCrmRecordDoc,
  saveLceRecordDoc,
  deleteLceRecordDoc,
  saveTemplateDoc,
  deleteTemplateDoc,
  saveFirmProfileDoc,
} from './utils/firestoreSync';
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
import { getStoredLceRecords, saveLceRecords } from './utils/lceStorage';
import { NotificationToast, dispatchToast } from './components/NotificationToast';
import { defaultTemplates } from './data/defaultTemplates';

const DEFAULT_PRIMARY_ADMIN: AppUser = {
  uid: 'admin-yogesh-01',
  email: PRIMARY_ADMIN_EMAIL,
  displayName: 'CA Yogesh Kulkarni',
  jobTitle: 'Managing Partner & Practice Head',
  department: 'Executive Leadership',
  role: 'Admin',
  status: 'Active',
  createdAt: '2026-09-01T00:00:00.000Z',
  isFirstAdmin: true,
};

export default function App() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'templates' | 'crm' | 'commission'>('dashboard');
  const [lceRecords, setLceRecords] = useState<LceRecord[]>(() => getStoredLceRecords());
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

  // RBAC & Authentication State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(DEFAULT_PRIMARY_ADMIN);
  const [allUsers, setAllUsers] = useState<AppUser[]>([DEFAULT_PRIMARY_ADMIN]);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | undefined>(undefined);
  const [isAdminUserModalOpen, setIsAdminUserModalOpen] = useState(false);

  const effectiveRole: UserRole = simulatedRole || currentUser?.role || 'Admin';

  const refreshTrashCount = () => {
    setTrashCount(getStoredTrashItems().length);
  };

  // Real-time Firestore Listeners:
  // Active continuously across all sessions and browsers for instant real-time live sync
  useEffect(() => {
    const unsubFirm = subscribeToFirmProfile((firm) => {
      if (firm) {
        setFirmProfile(firm);
      }
    });

    const unsubTax = subscribeToTaxonomy((tax) => {
      if (tax) {
        setCustomTaxonomy(tax);
      }
    });

    const unsubTmpl = subscribeToTemplates((tmpls) => {
      if (Array.isArray(tmpls)) {
        setTemplates(tmpls);
      }
    }, defaultTemplates);

    const unsubUsers = subscribeToUsers((users) => {
      if (Array.isArray(users)) {
        setAllUsers(users);
        if (currentUser) {
          const matched = users.find((u) => u.uid === currentUser.uid);
          if (matched) setCurrentUser(matched);
        }
      }
    }, [DEFAULT_PRIMARY_ADMIN]);

    const unsubEng = subscribeToEngagements((engs) => {
      if (Array.isArray(engs)) {
        setEngagements(engs);
      }
    }, getStoredEngagements());

    const unsubCrm = subscribeToCrmRecords((crms) => {
      if (Array.isArray(crms)) {
        setCrmRecords(crms);
      }
    }, getStoredCrmRecords());

    const unsubLce = subscribeToLceRecords((lces) => {
      if (Array.isArray(lces)) {
        setLceRecords(lces);
      }
    }, getStoredLceRecords());

    const unsubTrash = subscribeToTrash((items) => {
      if (Array.isArray(items)) {
        setTrashCount(items.length);
      }
    });

    return () => {
      unsubFirm();
      unsubTax();
      unsubTmpl();
      unsubUsers();
      unsubEng();
      unsubCrm();
      unsubLce();
      unsubTrash();
    };
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const existing = allUsers.find(
          (u) =>
            u.uid === fbUser.uid ||
            u.email.toLowerCase() === (fbUser.email || '').toLowerCase()
        );
        if (existing) {
          setCurrentUser(existing);
        } else {
          // If first user or matches PRIMARY_ADMIN_EMAIL, make Admin
          const isFirst =
            allUsers.length === 0 ||
            allUsers.every((u) => u.uid === 'admin-yogesh-01') ||
            (fbUser.email &&
              fbUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase());

          const newUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Authorized Team Member',
            photoUrl: fbUser.photoURL || undefined,
            jobTitle: isFirst ? 'Managing Partner & Practice Head' : 'Associate Consultant',
            department: 'Corporate Advisory',
            role: isFirst ? 'Admin' : 'Associate',
            status: 'Active',
            createdAt: new Date().toISOString(),
            isFirstAdmin: isFirst,
          };
          await saveUserDoc(newUser);
          setCurrentUser(newUser);
        }
      } else {
        // Retain default primary admin profile when unauthenticated in preview
        if (!currentUser) {
          setCurrentUser(DEFAULT_PRIMARY_ADMIN);
        }
      }
    });

    return () => unsubAuth();
  }, [allUsers]);

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

  // Auth Action Handlers
  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        dispatchToast({
          title: 'Authenticated Successfully',
          message: `Signed in as ${user.displayName || user.email}. Live Firestore sync enabled.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      dispatchToast({
        title: 'Sign In Information',
        message: err.message || 'Popups may be blocked in iframe preview. Using Admin session.',
        type: 'info',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutUser();
      setCurrentUser(DEFAULT_PRIMARY_ADMIN);
      dispatchToast({
        title: 'Signed Out',
        message: 'Reverted to primary administrator profile.',
        type: 'info',
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleToggleRoleSimulator = () => {
    setSimulatedRole((prev) => {
      const next = prev === 'Associate' ? 'Admin' : 'Associate';
      dispatchToast({
        title: 'Role-Based Access Control',
        message: `Now viewing as ${next} (${next === 'Admin' ? 'All financial columns visible' : 'Sensitive commercials masked with Zero-Trust'})`,
        type: 'info',
      });
      return next;
    });
  };

  // User Management Actions
  const handleSaveUser = async (user: AppUser) => {
    await saveUserDoc(user);
    setAllUsers((prev) => {
      const idx = prev.findIndex((u) => u.uid === user.uid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = user;
        return next;
      }
      return [...prev, user];
    });
    if (currentUser?.uid === user.uid) {
      setCurrentUser(user);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    await deleteUserDoc(uid);
    setAllUsers((prev) => prev.filter((u) => u.uid !== uid));
  };

  // Save changes to storage & real-time Firestore with proactive deletion sync
  const handleSaveEngagementsList = (updated: EngagementRecord[]) => {
    const updatedIds = new Set(updated.map((e) => e.id));
    engagements.forEach((prev) => {
      if (!updatedIds.has(prev.id)) {
        deleteEngagementDoc(prev.id).catch((err) => console.error('Firestore engagement delete error:', err));
      }
    });

    setEngagements(updated);
    saveEngagements(updated);

    // Sync newly added or modified to firestore
    updated.forEach((rec) => {
      saveEngagementDoc(rec).catch((err) => console.error('Firestore engagement sync error:', err));
    });

    // Update CRM records sync
    const synced = syncEngagementsWithCrm(updated, crmRecords);
    setCrmRecords(synced);
    saveCrmRecords(synced);
  };

  const handleSaveCrmRecordsList = (updated: CrmClientRecord[]) => {
    const updatedIds = new Set(updated.map((r) => r.id));
    crmRecords.forEach((prev) => {
      if (!updatedIds.has(prev.id)) {
        deleteCrmRecordDoc(prev.id).catch((err) => console.error('Firestore CRM delete error:', err));
      }
    });

    setCrmRecords(updated);
    saveCrmRecords(updated);
    updated.forEach((rec) => {
      saveCrmRecordDoc(rec).catch((err) => console.error('Firestore crm sync error:', err));
    });
  };

  const handleSaveTemplatesList = (updated: ServiceTemplate[]) => {
    const updatedIds = new Set(updated.map((t) => t.id));
    templates.forEach((prev) => {
      if (!updatedIds.has(prev.id)) {
        deleteTemplateDoc(prev.id).catch((err) => console.error('Firestore template delete error:', err));
      }
    });

    setTemplates(updated);
    saveTemplates(updated);
    updated.forEach((tmpl) => {
      saveTemplateDoc(tmpl).catch((err) => console.error('Firestore template sync error:', err));
    });
  };

  const handleSaveLceRecordsList = (updated: LceRecord[]) => {
    const updatedIds = new Set(updated.map((l) => l.id));
    lceRecords.forEach((prev) => {
      if (!updatedIds.has(prev.id)) {
        deleteLceRecordDoc(prev.id).catch((err) => console.error('Firestore LCE delete error:', err));
      }
    });

    setLceRecords(updated);
    saveLceRecords(updated);
    updated.forEach((lce) => {
      saveLceRecordDoc(lce).catch((err) => console.error('Firestore lce sync error:', err));
    });
  };

  const handleSaveFirmProfileData = (updated: FirmProfile) => {
    setFirmProfile(updated);
    saveFirmProfile(updated);
    saveFirmProfileDoc(updated).catch((err) => console.error('Firestore firm profile sync error:', err));
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
    deleteEngagementDoc(id).catch((err) => console.error('Direct delete error:', err));
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
        onNavigate={(v) => {
          setView(v);
          setSelectedEngagement(null);
        }}
        currentUser={currentUser}
        userRole={effectiveRole}
        onSignInWithGoogle={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onOpenAdminUserManagement={() => setIsAdminUserModalOpen(true)}
        onToggleRoleSimulator={handleToggleRoleSimulator}
        isRoleSimulated={!!simulatedRole}
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
        commissionCount={lceRecords.length}
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
              userRole={effectiveRole}
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
              userRole={effectiveRole}
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
              engagements={engagements}
              onSaveTemplates={handleSaveTemplatesList}
              onSelectTemplateForNewEngagement={(t) => {
                handleStartNewEngagement(t);
              }}
              onOpenEngagement={(rec) => {
                setSelectedEngagement(rec);
                setView('editor');
              }}
              onBackToDashboard={() => setView('dashboard')}
            />
          </div>
        )}

        {/* VIEW 5: Partner Referral Commission Tracker (Excel-like Sheet) */}
        {view === 'commission' && (
          <div key="commission-view" className="animate-view-in">
            <LceCommissionTracker
              records={lceRecords}
              onSaveRecords={handleSaveLceRecordsList}
              crmRecords={crmRecords}
              onCreateEngagementFromLce={(lce) => {
                // Pre-fill a new engagement proposal letter from the referral partner deal
                const allTemplates = templates && templates.length > 0 ? templates : defaultTemplates;
                const tmpl = allTemplates[0];
                const safeCode = tmpl?.serviceCode || 'ADV';
                const { refNo, invoiceNo } = generateNextReference(safeCode, engagements);
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
                  validityDays: tmpl?.pricing?.validityDays || 14,
                  client: {
                    companyName: lce.businessName || 'Referred Business Enterprise',
                    addresseeName: lce.ownerName || 'Director / Managing Partner',
                    salutation: 'Dear Sir/Madam',
                    designation: 'Managing Director / Proprietor',
                    businessEntityType: 'Private Limited',
                    billingAddress: lce.city ? `${lce.city}, India` : 'Corporate Office Address',
                    state: 'Maharashtra',
                    gstin: '',
                    pan: '',
                    email: '',
                    phone: '',
                  },
                  signatory: firmProfile.signatories?.[0] || {
                    id: 'sig-default',
                    name: firmProfile.signatoryName || 'CA Yogesh Kulkarni',
                    designation: firmProfile.signatoryDesignation || 'Director / Authorised Signatory',
                    email: firmProfile.signatoryEmail || firmProfile.firmEmail,
                    phone: firmProfile.signatoryPhone || firmProfile.firmPhone,
                    isDefault: true,
                  },
                  service: {
                    ...tmpl,
                    pricing: {
                      ...tmpl.pricing,
                      feeAmount: lce.taxableFee || tmpl.pricing.feeAmount,
                      isGstApplicable: lce.gstApplicable ?? true,
                    },
                  },
                  services: [
                    {
                      ...tmpl,
                      pricing: {
                        ...tmpl.pricing,
                        feeAmount: lce.taxableFee || tmpl.pricing.feeAmount,
                        isGstApplicable: lce.gstApplicable ?? true,
                      },
                    },
                  ],
                  invoiceMilestoneType: 'advance',
                  status: 'draft',
                  createdBy: firmProfile?.signatoryName || 'CA Yogesh Kulkarni',
                  createdAt: now.toISOString(),
                  lastEditedAt: now.toISOString(),
                  actionLog: [
                    {
                      timestamp: now.toISOString(),
                      user: firmProfile?.signatoryName || 'CA Yogesh Kulkarni',
                      action: `Created via Partner Commission Tracker deal: ${lce.businessName}`,
                    },
                  ],
                };
                const updated = [newRec, ...engagements];
                setEngagements(updated);
                saveEngagements(updated);
                setSelectedEngagement(newRec);
                setView('editor');
              }}
              onBackToDashboard={() => setView('dashboard')}
              userRole={effectiveRole}
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

      {/* Admin User Management & Granular RBAC Modal */}
      <AdminUserManagementModal
        isOpen={isAdminUserModalOpen}
        onClose={() => setIsAdminUserModalOpen(false)}
        allUsers={allUsers}
        users={allUsers}
        currentUser={currentUser}
        currentUserId={currentUser?.uid || ''}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Global Apple-style Spring Animated Notification Toasts */}
      <NotificationToast />
    </div>
  );
}
