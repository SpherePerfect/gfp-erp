import { AuthLogEntry, UserRole } from '../types';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';

export const AUTH_LOGS_STORAGE_KEY = 'ca_erp_auth_audit_logs_v1';

export function getStoredAuthLogs(): AuthLogEntry[] {
  try {
    const raw = localStorage.getItem(AUTH_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse auth logs from localStorage:', err);
  }
  return [];
}

export function saveStoredAuthLogs(logs: AuthLogEntry[]): void {
  try {
    // Keep the most recent 500 logs locally
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(AUTH_LOGS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save auth logs to localStorage:', err);
  }
}

export async function logAuthEvent(params: {
  userId: string;
  userName: string;
  role: UserRole;
  action: AuthLogEntry['action'];
  details?: string;
  timestamp?: string;
}): Promise<AuthLogEntry> {
  const newEntry: AuthLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    userName: params.userName,
    role: params.role,
    action: params.action,
    timestamp: params.timestamp || new Date().toISOString(),
    details: params.details || '',
    ipAddress: typeof navigator !== 'undefined' ? `${navigator.platform || 'Client'} (${navigator.language || 'en'})` : 'Client Browser',
  };

  // 1. Save to local storage first
  const currentLogs = getStoredAuthLogs();
  const updatedLogs = [newEntry, ...currentLogs];
  saveStoredAuthLogs(updatedLogs);

  // 2. Also persist to Firestore auth_logs collection
  try {
    const docRef = doc(db, 'auth_logs', newEntry.id);
    await setDoc(docRef, newEntry);
  } catch (err) {
    console.warn('Firestore auth log sync skipped or offline:', err);
  }

  return newEntry;
}

export function subscribeToAuthLogs(
  onUpdate: (logs: AuthLogEntry[]) => void,
  maxItems: number = 100
): Unsubscribe {
  // Always emit local stored logs first for immediate display
  onUpdate(getStoredAuthLogs());

  try {
    const q = query(
      collection(db, 'auth_logs'),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudLogs: AuthLogEntry[] = [];
          snapshot.forEach((d) => {
            cloudLogs.push(d.data() as AuthLogEntry);
          });
          // Merge with any local logs not yet in cloud
          const localLogs = getStoredAuthLogs();
          const map = new Map<string, AuthLogEntry>();
          cloudLogs.forEach((l) => map.set(l.id, l));
          localLogs.forEach((l) => {
            if (!map.has(l.id)) map.set(l.id, l);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          saveStoredAuthLogs(merged);
          onUpdate(merged);
        }
      },
      (err) => {
        console.warn('Firestore auth_logs listener error (using local storage):', err);
      }
    );
  } catch (err) {
    console.warn('Could not initialize auth_logs Firestore listener:', err);
    return () => {};
  }
}
