import { describe, expect, it } from 'vitest';
import type { Item } from './items';
import { STORAGE_KEY, loadItems, saveItems } from './storage';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('storage', () => {
  it('round-trips items through storage', () => {
    const storage = memoryStorage();
    const items: Item[] = [
      {
        id: '1',
        title: 'Hello',
        notes: 'world',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    saveItems(items, storage);
    expect(storage.getItem(STORAGE_KEY)).toContain('Hello');
    expect(loadItems(storage)).toEqual(items);
  });

  it('returns empty array for missing or corrupt payloads', () => {
    expect(loadItems(memoryStorage())).toEqual([]);
    expect(loadItems(memoryStorage({ [STORAGE_KEY]: '{bad' }))).toEqual([]);
    expect(loadItems(memoryStorage({ [STORAGE_KEY]: '{"no":"array"}' }))).toEqual([]);
  });

  it('filters non-item array entries', () => {
    const payload = JSON.stringify([
      null,
      42,
      'nope',
      { id: 1, title: 'bad-types', notes: '', updatedAt: '' },
      {
        id: 'ok',
        title: 'Valid',
        notes: '',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(loadItems(memoryStorage({ [STORAGE_KEY]: payload }))).toEqual([
      {
        id: 'ok',
        title: 'Valid',
        notes: '',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });
});
