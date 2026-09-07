import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  EngagementRecord,
  CrmClientRecord,
  LceRecord,
  ServiceTemplate,
  FirmProfile,
  CustomTaxonomyConfig,
  TrashItem,
  AppUser,
} from '../types';
import { defaultFirmProfile } from '../data/defaultFirmProfile';
import { defaultTemplates } from '../data/defaultTemplates';
import { saveEngagements, saveFirmProfile, saveTemplates } from './storage';
import { saveCrmRecords } from './crmStorage';
import { saveLceRecords } from './lceStorage';
import { saveTaxonomy } from './taxonomyStorage';
import { saveTrashItems } from './trashStorage';

// Collection Names
export const COLLECTIONS = {
  ENGAGEMENTS: 'engagements',
  CRM_RECORDS: 'crmRecords',
  LCE_RECORDS: 'lceRecords',
  TEMPLATES: 'templates',
  FIRM_PROFILE: 'firmProfile',
  TAXONOMY: 'taxonomy',
  TRASH: 'trash',
  USERS: 'users',
} as const;

/**
 * 1. REAL-TIME LISTENER: USERS
 */
export function subscribeToUsers(
  onUpdate: (users: AppUser[]) => void,
  initialSeed: AppUser[] = []
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const usersCol = collection(db, COLLECTIONS.USERS);

  return onSnapshot(
    usersCol,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        // Seed initial admin user if collection is completely fresh
        try {
          const batch = writeBatch(db);
          initialSeed.forEach((u) => {
            const ref = doc(db, COLLECTIONS.USERS, u.uid);
            batch.set(ref, u);
          });
          await batch.commit();
        } catch (err) {
          console.warn('Initial users seed failed:', err);
        }
        onUpdate(initialSeed);
        return;
      }

      const users: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as AppUser);
      });
      // Sort users by createdAt descending
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
    }
  );
}

/**
 * 2. REAL-TIME LISTENER: ENGAGEMENTS
 */
export function subscribeToEngagements(
  onUpdate: (engagements: EngagementRecord[]) => void,
  initialSeed: EngagementRecord[] = []
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const colRef = collection(db, COLLECTIONS.ENGAGEMENTS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        // Seed initial engagements if remote collection is empty
        try {
          const batch = writeBatch(db);
          initialSeed.forEach((eng) => {
            const ref = doc(db, COLLECTIONS.ENGAGEMENTS, eng.id);
            batch.set(ref, eng);
          });
          await batch.commit();
        } catch (err) {
          console.warn('Initial engagements seed failed:', err);
        }
        onUpdate(initialSeed);
        return;
      }

      const items: EngagementRecord[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as EngagementRecord);
      });
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      saveEngagements(items); // sync local cache
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ENGAGEMENTS);
    }
  );
}

/**
 * 3. REAL-TIME LISTENER: MARKETING CRM RECORDS
 */
export function subscribeToCrmRecords(
  onUpdate: (records: CrmClientRecord[]) => void,
  initialSeed: CrmClientRecord[] = []
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const colRef = collection(db, COLLECTIONS.CRM_RECORDS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        try {
          const batch = writeBatch(db);
          initialSeed.forEach((rec) => {
            const ref = doc(db, COLLECTIONS.CRM_RECORDS, rec.id);
            batch.set(ref, rec);
          });
          await batch.commit();
        } catch (err) {
          console.warn('Initial CRM seed failed:', err);
        }
        onUpdate(initialSeed);
        return;
      }

      const items: CrmClientRecord[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as CrmClientRecord);
      });
      items.sort((a, b) => (a.srNo || 0) - (b.srNo || 0));
      saveCrmRecords(items);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CRM_RECORDS);
    }
  );
}

/**
 * 4. REAL-TIME LISTENER: LCE COMMISSION RECORDS
 */
export function subscribeToLceRecords(
  onUpdate: (records: LceRecord[]) => void,
  initialSeed: LceRecord[] = []
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const colRef = collection(db, COLLECTIONS.LCE_RECORDS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        try {
          const batch = writeBatch(db);
          initialSeed.forEach((rec) => {
            const ref = doc(db, COLLECTIONS.LCE_RECORDS, rec.id);
            batch.set(ref, rec);
          });
          await batch.commit();
        } catch (err) {
          console.warn('Initial LCE seed failed:', err);
        }
        onUpdate(initialSeed);
        return;
      }

      const items: LceRecord[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as LceRecord);
      });
      items.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
      saveLceRecords(items);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.LCE_RECORDS);
    }
  );
}

/**
 * 5. REAL-TIME LISTENER: SERVICE TEMPLATES
 */
export function subscribeToTemplates(
  onUpdate: (templates: ServiceTemplate[]) => void,
  initialSeed: ServiceTemplate[] = defaultTemplates
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.TEMPLATES);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        if (auth.currentUser) {
          try {
            const batch = writeBatch(db);
            initialSeed.forEach((tmpl) => {
              const ref = doc(db, COLLECTIONS.TEMPLATES, tmpl.id);
              batch.set(ref, tmpl);
            });
            await batch.commit();
          } catch (err) {
            console.warn('Initial templates seed failed:', err);
          }
        }
        onUpdate(initialSeed);
        return;
      }

      const items: ServiceTemplate[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as ServiceTemplate);
      });
      saveTemplates(items);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TEMPLATES);
    }
  );
}

/**
 * 6. REAL-TIME LISTENER: FIRM PROFILE
 */
export function subscribeToFirmProfile(
  onUpdate: (profile: FirmProfile) => void,
  initialSeed: FirmProfile = defaultFirmProfile
): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.FIRM_PROFILE, 'default');

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        if (auth.currentUser) {
          try {
            await setDoc(docRef, { ...initialSeed, id: 'default' });
          } catch (err) {
            console.warn('Initial firm profile seed failed:', err);
          }
        }
        onUpdate(initialSeed);
        return;
      }

      const profile = snapshot.data() as FirmProfile;
      saveFirmProfile(profile);
      onUpdate(profile);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.FIRM_PROFILE}/default`);
    }
  );
}

/**
 * 7. REAL-TIME LISTENER: TAXONOMY
 */
export function subscribeToTaxonomy(
  onUpdate: (taxonomy: CustomTaxonomyConfig) => void
): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.TAXONOMY, 'default');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CustomTaxonomyConfig;
        saveTaxonomy(data);
        onUpdate(data);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.TAXONOMY}/default`);
    }
  );
}

/**
 * 8. REAL-TIME LISTENER: RECYCLE BIN / TRASH
 */
export function subscribeToTrash(
  onUpdate: (trashItems: TrashItem[]) => void
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const colRef = collection(db, COLLECTIONS.TRASH);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: TrashItem[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as TrashItem);
      });
      items.sort(
        (a, b) =>
          new Date(b.deletedAtIso || 0).getTime() -
          new Date(a.deletedAtIso || 0).getTime()
      );
      saveTrashItems(items);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TRASH);
    }
  );
}

// -------------------------------------------------------------
// FIRESTORE MUTATION HELPERS WITH ZERO-TRUST ERROR HANDLING
// -------------------------------------------------------------

export async function saveEngagementDoc(engagement: EngagementRecord): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.ENGAGEMENTS}/${engagement.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ENGAGEMENTS, engagement.id), engagement);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEngagementDoc(engagementId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.ENGAGEMENTS}/${engagementId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ENGAGEMENTS, engagementId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCrmRecordDoc(record: CrmClientRecord): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.CRM_RECORDS}/${record.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CRM_RECORDS, record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCrmRecordDoc(recordId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.CRM_RECORDS}/${recordId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CRM_RECORDS, recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveLceRecordDoc(record: LceRecord): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.LCE_RECORDS}/${record.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.LCE_RECORDS, record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLceRecordDoc(recordId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.LCE_RECORDS}/${recordId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.LCE_RECORDS, recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTemplateDoc(template: ServiceTemplate): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.TEMPLATES}/${template.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.TEMPLATES, template.id), template);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTemplateDoc(templateId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.TEMPLATES}/${templateId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.TEMPLATES, templateId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveFirmProfileDoc(profile: FirmProfile): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.FIRM_PROFILE}/default`;
  try {
    await setDoc(doc(db, COLLECTIONS.FIRM_PROFILE, 'default'), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveTaxonomyDoc(taxonomy: CustomTaxonomyConfig): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.TAXONOMY}/default`;
  try {
    await setDoc(doc(db, COLLECTIONS.TAXONOMY, 'default'), taxonomy);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveTrashDoc(item: TrashItem): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.TRASH}/${item.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.TRASH, item.id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTrashDoc(itemId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.TRASH}/${itemId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.TRASH, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveUserDoc(user: AppUser): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.USERS}/${user.uid}`;
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), user);
    // If role is Admin, maintain /admins/{uid} marker
    if (user.role === 'Admin') {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email,
        assignedAt: new Date().toISOString(),
      });
    } else {
      try {
        await deleteDoc(doc(db, 'admins', user.uid));
      } catch {
        // safe ignore
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserDoc(uid: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
    try {
      await deleteDoc(doc(db, 'admins', uid));
    } catch {
      // safe ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
