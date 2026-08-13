import type { Item } from './items';

export const STORAGE_KEY = 'booster-seat.items.v1';

export function loadItems(storage: Storage = localStorage): Item[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isItem);
  } catch {
    return [];
  }
}

export function saveItems(items: Item[], storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isItem(value: unknown): value is Item {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.notes === 'string' &&
    typeof record.updatedAt === 'string'
  );
}
