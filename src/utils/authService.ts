import { AppUser } from '../types';
import { saveUserDoc } from './firestoreSync';

export const ACTIVE_USER_STORAGE_KEY = 'ca_erp_active_user_uid_v1';

export const DEFAULT_INITIAL_USER: AppUser = {
  uid: 'user-admin-123',
  loginId: '123',
  password: '123',
  email: '123@gfpadvisory.in',
  displayName: 'CA Yogesh Kulkarni',
  jobTitle: 'Managing Partner & Practice Head',
  department: 'Executive Leadership',
  role: 'Admin',
  status: 'Active',
  createdAt: '2026-09-01T00:00:00.000Z',
  isFirstAdmin: true,
  restrictedItems: [],
  photoUrl: '',
};

export function getActiveUserUid(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setActiveUserUid(uid: string): void {
  try {
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, uid);
  } catch (err) {
    console.warn('Could not save active user UID to localStorage:', err);
  }
}

export function clearActiveUserUid(): void {
  try {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  } catch (err) {
    console.warn('Could not clear active user UID from localStorage:', err);
  }
}

export function getActiveSessionUser(users: AppUser[]): AppUser | null {
  const uid = getActiveUserUid();
  if (!uid) return null;
  const user = users.find((u) => u.uid === uid || u.loginId === uid);
  if (user) return user;
  if (uid === DEFAULT_INITIAL_USER.uid || uid === '123') return DEFAULT_INITIAL_USER;
  return null;
}

export function logoutCurrentUser(): void {
  clearActiveUserUid();
}

export function findUserByIdentifier(
  identifier: string,
  users: AppUser[]
): AppUser | undefined {
  const cleanId = identifier.trim().toLowerCase();
  if (!cleanId) return undefined;

  let matched = users.find((u) => {
    return (
      (u.loginId && u.loginId.trim().toLowerCase() === cleanId) ||
      (u.email && u.email.trim().toLowerCase() === cleanId) ||
      u.uid.toLowerCase() === cleanId
    );
  });

  if (!matched && cleanId === '123') {
    return DEFAULT_INITIAL_USER;
  }
  return matched;
}

export function authenticateWithCredentials(
  identifier: string,
  passwordInput: string,
  users: AppUser[]
): { success: boolean; user?: AppUser; error?: string } {
  const cleanId = identifier.trim();
  const cleanPass = passwordInput.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: 'Please provide both User ID and Password.' };
  }

  // Find user matching loginId, email, or uid
  let matched = users.find((u) => {
    const matchId =
      (u.loginId && u.loginId.trim().toLowerCase() === cleanId.toLowerCase()) ||
      (u.email && u.email.trim().toLowerCase() === cleanId.toLowerCase()) ||
      u.uid === cleanId;
    return matchId;
  });

  // If no user found and credentials are 123 / 123, match default user
  if (!matched && cleanId === '123' && cleanPass === '123') {
    matched = DEFAULT_INITIAL_USER;
  }

  if (!matched) {
    return { success: false, error: 'Invalid User ID or Password. (First-time login: User ID: 123, Password: 123)' };
  }

  if (matched.status === 'Suspended') {
    return {
      success: false,
      error: 'This account has been suspended by the Administrator. Please contact firm management.',
    };
  }

  // Check password
  const expectedPassword = matched.password || (matched.loginId === '123' ? '123' : '123');
  if (expectedPassword !== cleanPass) {
    return { success: false, error: 'Incorrect Password. Please verify your credentials and try again.' };
  }

  return { success: true, user: matched };
}
