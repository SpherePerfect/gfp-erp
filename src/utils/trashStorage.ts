import { TrashItem } from '../types';

const TRASH_STORAGE_KEY = 'ca_erp_dustbin_items_v1';

export function formatExactTimestampWithMs(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${day}/${month}/${year} ${hoursStr}:${minutes}:${seconds}.${milliseconds} ${ampm}`;
}

export function getStoredTrashItems(): TrashItem[] {
  try {
    const raw = localStorage.getItem(TRASH_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading trash items from localStorage:', err);
    return [];
  }
}

export function saveTrashItems(items: TrashItem[]): void {
  try {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving trash items to localStorage:', err);
  }
}

export function addToTrash(
  itemType: 'crm_lead' | 'engagement' | 'template',
  title: string,
  subtitle: string,
  data: any,
  deletedBy: string = 'Authorized Signatory'
): TrashItem {
  const now = new Date();
  const trashItem: TrashItem = {
    id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    itemType,
    title,
    subtitle,
    deletedAtIso: now.toISOString(),
    deletedAtFormatted: formatExactTimestampWithMs(now),
    deletedBy,
    data: JSON.parse(JSON.stringify(data)),
  };

  const existing = getStoredTrashItems();
  const updated = [trashItem, ...existing];
  saveTrashItems(updated);
  return trashItem;
}

export function removeFromTrash(trashId: string): TrashItem | null {
  const existing = getStoredTrashItems();
  const item = existing.find((i) => i.id === trashId) || null;
  if (item) {
    const updated = existing.filter((i) => i.id !== trashId);
    saveTrashItems(updated);
  }
  return item;
}

export function clearAllTrash(): void {
  saveTrashItems([]);
}
