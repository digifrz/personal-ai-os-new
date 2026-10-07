/**
 * Service for tracking and persisting user recently accessed workspace items
 * (Notes, Tasks, Files) for quick re-entry on the Dashboard.
 */

export interface RecentlyAccessedItem {
  id: string;
  type: 'note' | 'task' | 'file';
  title: string;
  subtitle?: string;
  category?: string;
  accessedAt: string;
  priority?: 'high' | 'medium' | 'low';
  sizeBytes?: number;
  mimeType?: string;
  color?: string;
}

const STORAGE_PREFIX = 'paio_recent_accessed_';
const MAX_RECENT_ITEMS = 5;

function getStorageKey(userId?: string): string {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

export function getRecentlyAccessed(userId?: string): RecentlyAccessedItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_RECENT_ITEMS);
    }
  } catch (err) {
    console.warn('Failed to parse recently accessed items:', err);
  }
  return [];
}

export function recordRecentAccess(
  item: Omit<RecentlyAccessedItem, 'accessedAt'>,
  userId?: string
): RecentlyAccessedItem[] {
  try {
    const existing = getRecentlyAccessed(userId);
    // Remove if already present (deduplicate)
    const filtered = existing.filter((e) => !(e.id === item.id && e.type === item.type));

    const newItem: RecentlyAccessedItem = {
      ...item,
      accessedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));

    // Dispatch custom event for real-time listener updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('paio:recent-access-updated', { detail: updated })
      );
    }

    return updated;
  } catch (err) {
    console.warn('Failed to record recent access:', err);
    return [];
  }
}

export function clearRecentlyAccessed(userId?: string): void {
  try {
    localStorage.removeItem(getStorageKey(userId));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('paio:recent-access-updated', { detail: [] })
      );
    }
  } catch (err) {
    console.warn('Failed to clear recently accessed:', err);
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffSec) || diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}
