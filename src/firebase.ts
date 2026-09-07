import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AppUser, UserRole } from './types';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Firestore with custom databaseId if specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

// Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Operation Types for error handler per Firebase Skill instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper per Firebase Skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently operating offline.');
    }
    return false;
  }
}

// Default initial primary admin email as hardcoded safeguard
export const PRIMARY_ADMIN_EMAIL = 'pratikyogeshkulkarni@gmail.com';

/**
 * Handle user registration / login:
 * The very first user to log in or register automatically gets assigned the 'Admin' role!
 */
export async function syncUserOnLogin(fbUser: FirebaseUser): Promise<AppUser> {
  const userRef = doc(db, 'users', fbUser.uid);
  const path = `users/${fbUser.uid}`;

  try {
    const existingSnap = await getDoc(userRef);

    if (existingSnap.exists()) {
      const data = existingSnap.data() as AppUser;
      const updated: Partial<AppUser> = {
        lastLoginAt: new Date().toISOString(),
        email: fbUser.email || data.email,
        displayName: data.displayName || fbUser.displayName || 'Team Member',
        photoUrl: data.photoUrl || fbUser.photoURL || undefined,
      };

      // Ensure primary admin email always retains Admin role
      if (fbUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() && data.role !== 'Admin') {
        updated.role = 'Admin';
        try {
          await setDoc(doc(db, 'admins', fbUser.uid), {
            uid: fbUser.uid,
            email: fbUser.email,
            assignedAt: new Date().toISOString(),
          });
        } catch {
          // ignore admin doc write failure if offline
        }
      }

      await updateDoc(userRef, updated);
      return { ...data, ...updated } as AppUser;
    }

    // Check if this is the very first user in the users collection
    let isFirstUser = false;
    try {
      const allUsersSnap = await getDocs(collection(db, 'users'));
      isFirstUser = allUsersSnap.empty;
    } catch {
      // If collection read failed or empty, check if email matches primary admin
      isFirstUser = true;
    }

    const isPrimaryAdmin = fbUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
    const assignedRole: UserRole = (isFirstUser || isPrimaryAdmin) ? 'Admin' : 'Associate';

    const newUser: AppUser = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || (assignedRole === 'Admin' ? 'Managing Partner (Admin)' : 'Team Member'),
      photoUrl: fbUser.photoURL || undefined,
      jobTitle: assignedRole === 'Admin' ? 'Managing Partner & Practice Head' : 'Associate Consultant',
      role: assignedRole,
      department: assignedRole === 'Admin' ? 'Executive Leadership' : 'Advisory & Assurance',
      phone: fbUser.phoneNumber || '',
      status: 'Active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isFirstAdmin: isFirstUser || isPrimaryAdmin,
    };

    await setDoc(userRef, newUser);

    // If Admin, also store marker in /admins/ for Zero-Trust Firestore Security verification
    if (assignedRole === 'Admin') {
      try {
        await setDoc(doc(db, 'admins', fbUser.uid), {
          uid: fbUser.uid,
          email: fbUser.email,
          assignedAt: new Date().toISOString(),
        });
      } catch {
        // safe ignore
      }
    }

    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<AppUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      return await syncUserOnLogin(result.user);
    }
    return null;
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function logOutUser(): Promise<void> {
  await fbSignOut(auth);
}
