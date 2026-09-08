import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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
  SYSTEM: '_system',
} as const;

/**
 * Recursively strips out keys with `undefined` values from an object,
 * preventing Firestore's "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * System Initialization Guard:
 * Ensures default sample records are only seeded ONCE during initial database setup,
 * and prevents deleted documents from being accidentally resurrected when collections are emptied.
 */
export async function checkIsDbInitialized(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SYSTEM, 'init'));
    return snap.exists();
  } catch (err) {
    console.warn('Could not check DB initialization marker:', err);
    return false;
  }
}

export async function markDbInitialized(): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.SYSTEM, 'init'), {
      initializedAt: new Date().toISOString(),
      version: '1.0',
    });
  } catch (err) {
    console.warn('Could not mark DB initialization marker:', err);
  }
}

/**
 * 1. REAL-TIME LISTENER: USERS
 */
export function subscribeToUsers(
  onUpdate: (users: AppUser[]) => void,
  initialSeed: AppUser[] = []
): Unsubscribe {
  const usersCol = collection(db, COLLECTIONS.USERS);

  return onSnapshot(
    usersCol,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        const isInit = await checkIsDbInitialized();
        if (!isInit) {
          try {
            const batch = writeBatch(db);
            initialSeed.forEach((u) => {
              const ref = doc(db, COLLECTIONS.USERS, u.uid);
              batch.set(ref, sanitizeForFirestore(u));
            });
            await batch.commit();
          } catch (err) {
            console.warn('Initial users seed failed:', err);
          }
          onUpdate(initialSeed);
          return;
        }
      }

      const users: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as AppUser);
      });
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(users);
    },
    (error) => {
      console.warn('Firestore users listen error:', error);
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
  const colRef = collection(db, COLLECTIONS.ENGAGEMENTS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        const isInit = await checkIsDbInitialized();
        if (!isInit) {
          try {
            const batch = writeBatch(db);
            initialSeed.forEach((eng) => {
              const ref = doc(db, COLLECTIONS.ENGAGEMENTS, eng.id);
              batch.set(ref, eng);
            });
            await batch.commit();
            await markDbInitialized();
          } catch (err) {
            console.warn('Initial engagements seed failed:', err);
          }
          onUpdate(initialSeed);
          return;
        }
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
      console.warn('Firestore engagements listen error:', error);
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
  const colRef = collection(db, COLLECTIONS.CRM_RECORDS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        const isInit = await checkIsDbInitialized();
        if (!isInit) {
          try {
            const batch = writeBatch(db);
            initialSeed.forEach((rec) => {
              const ref = doc(db, COLLECTIONS.CRM_RECORDS, rec.id);
              batch.set(ref, rec);
            });
            await batch.commit();
            await markDbInitialized();
          } catch (err) {
            console.warn('Initial CRM seed failed:', err);
          }
          onUpdate(initialSeed);
          return;
        }
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
      console.warn('Firestore CRM listen error:', error);
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
  const colRef = collection(db, COLLECTIONS.LCE_RECORDS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialSeed.length > 0) {
        const isInit = await checkIsDbInitialized();
        if (!isInit) {
          try {
            const batch = writeBatch(db);
            initialSeed.forEach((rec) => {
              const ref = doc(db, COLLECTIONS.LCE_RECORDS, rec.id);
              batch.set(ref, rec);
            });
            await batch.commit();
            await markDbInitialized();
          } catch (err) {
            console.warn('Initial LCE seed failed:', err);
          }
          onUpdate(initialSeed);
          return;
        }
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
      console.warn('Firestore LCE listen error:', error);
    }
  );
}

/**
 * 5. REAL-TIME LISTENER: SERVICE MASTER TEMPLATES
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
        const isInit = await checkIsDbInitialized();
        if (!isInit) {
          try {
            const batch = writeBatch(db);
            initialSeed.forEach((tmpl) => {
              const ref = doc(db, COLLECTIONS.TEMPLATES, tmpl.id);
              batch.set(ref, tmpl);
            });
            await batch.commit();
            await markDbInitialized();
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
      console.warn('Firestore templates listen error:', error);
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
        try {
          await setDoc(docRef, { ...initialSeed, id: 'default' });
        } catch (err) {
          console.warn('Initial firm profile seed failed:', err);
        }
        onUpdate(initialSeed);
        return;
      }

      const profile = snapshot.data() as FirmProfile;
      saveFirmProfile(profile);
      onUpdate(profile);
    },
    (error) => {
      console.warn('Firestore firm profile listen error:', error);
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
      console.warn('Firestore taxonomy listen error:', error);
    }
  );
}

/**
 * 8. REAL-TIME LISTENER: RECYCLE BIN / TRASH
 */
export function subscribeToTrash(
  onUpdate: (trashItems: TrashItem[]) => void
): Unsubscribe {
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
      console.warn('Firestore trash listen error:', error);
    }
  );
}

// -------------------------------------------------------------
// FIRESTORE MUTATION HELPERS: LIVE ACROSS ALL BROWSERS
// -------------------------------------------------------------

export async function saveEngagementDoc(engagement: EngagementRecord): Promise<void> {
  const path = `${COLLECTIONS.ENGAGEMENTS}/${engagement.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ENGAGEMENTS, engagement.id), sanitizeForFirestore(engagement));
  } catch (error) {
    console.error('saveEngagementDoc error:', error);
  }
}

export async function deleteEngagementDoc(engagementId: string): Promise<void> {
  const path = `${COLLECTIONS.ENGAGEMENTS}/${engagementId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ENGAGEMENTS, engagementId));
  } catch (error) {
    console.error('deleteEngagementDoc error:', error);
  }
}

export async function saveCrmRecordDoc(record: CrmClientRecord): Promise<void> {
  const path = `${COLLECTIONS.CRM_RECORDS}/${record.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CRM_RECORDS, record.id), sanitizeForFirestore(record));
  } catch (error) {
    console.error('saveCrmRecordDoc error:', error);
  }
}

export async function deleteCrmRecordDoc(recordId: string): Promise<void> {
  const path = `${COLLECTIONS.CRM_RECORDS}/${recordId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CRM_RECORDS, recordId));
  } catch (error) {
    console.error('deleteCrmRecordDoc error:', error);
  }
}

export async function saveLceRecordDoc(record: LceRecord): Promise<void> {
  const path = `${COLLECTIONS.LCE_RECORDS}/${record.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.LCE_RECORDS, record.id), sanitizeForFirestore(record));
  } catch (error) {
    console.error('saveLceRecordDoc error:', error);
  }
}

export async function deleteLceRecordDoc(recordId: string): Promise<void> {
  const path = `${COLLECTIONS.LCE_RECORDS}/${recordId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.LCE_RECORDS, recordId));
  } catch (error) {
    console.error('deleteLceRecordDoc error:', error);
  }
}

export async function saveTemplateDoc(template: ServiceTemplate): Promise<void> {
  const path = `${COLLECTIONS.TEMPLATES}/${template.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.TEMPLATES, template.id), sanitizeForFirestore(template));
  } catch (error) {
    console.error('saveTemplateDoc error:', error);
  }
}

export async function deleteTemplateDoc(templateId: string): Promise<void> {
  const path = `${COLLECTIONS.TEMPLATES}/${templateId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.TEMPLATES, templateId));
  } catch (error) {
    console.error('deleteTemplateDoc error:', error);
  }
}

export async function saveFirmProfileDoc(profile: FirmProfile): Promise<void> {
  const path = `${COLLECTIONS.FIRM_PROFILE}/default`;
  try {
    await setDoc(doc(db, COLLECTIONS.FIRM_PROFILE, 'default'), sanitizeForFirestore(profile));
  } catch (error) {
    console.error('saveFirmProfileDoc error:', error);
  }
}

export async function saveTaxonomyDoc(taxonomy: CustomTaxonomyConfig): Promise<void> {
  const path = `${COLLECTIONS.TAXONOMY}/default`;
  try {
    await setDoc(doc(db, COLLECTIONS.TAXONOMY, 'default'), sanitizeForFirestore(taxonomy));
  } catch (error) {
    console.error('saveTaxonomyDoc error:', error);
  }
}

export async function saveTrashDoc(item: TrashItem): Promise<void> {
  const path = `${COLLECTIONS.TRASH}/${item.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.TRASH, item.id), sanitizeForFirestore(item));
  } catch (error) {
    console.error('saveTrashDoc error:', error);
  }
}

export async function deleteTrashDoc(itemId: string): Promise<void> {
  const path = `${COLLECTIONS.TRASH}/${itemId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.TRASH, itemId));
  } catch (error) {
    console.error('deleteTrashDoc error:', error);
  }
}

export async function saveUserDoc(user: AppUser): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${user.uid}`;
  try {
    const cleanedUser = sanitizeForFirestore(user);
    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), cleanedUser);
    if (user.role === 'Admin') {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email || '',
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
    console.error('saveUserDoc error:', error);
  }
}

export async function deleteUserDoc(uid: string): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
    try {
      await deleteDoc(doc(db, 'admins', uid));
    } catch {
      // safe ignore
    }
  } catch (error) {
    console.error('deleteUserDoc error:', error);
  }
}
