import { describe, expect, it } from 'vitest';
import { createItem, removeItem, updateItem, upsertItem } from './items';

describe('items', () => {
  it('creates an item with trimmed fields', () => {
    const item = createItem(
      { title: '  Buy milk  ', notes: '  2%' },
      new Date('2026-01-01T00:00:00Z')
    );
    expect(item.title).toBe('Buy milk');
    expect(item.notes).toBe('2%');
    expect(item.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(item.id.length).toBeGreaterThan(0);
  });

  it('rejects blank titles on create', () => {
    expect(() => createItem({ title: '   ', notes: '' })).toThrow(/title/i);
  });

  it('updates an existing item', () => {
    const original = createItem({ title: 'Old', notes: '' }, new Date('2026-01-01T00:00:00Z'));
    const updated = updateItem(
      original,
      { title: 'New', notes: 'done' },
      new Date('2026-01-02T00:00:00Z')
    );
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe('New');
    expect(updated.notes).toBe('done');
    expect(updated.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('upserts by id and removes by id', () => {
    const a = createItem({ title: 'A', notes: '' });
    const b = createItem({ title: 'B', notes: '' });
    let list = upsertItem([], a);
    list = upsertItem(list, b);
    expect(list).toHaveLength(2);

    const a2 = updateItem(a, { title: 'A2', notes: 'x' });
    list = upsertItem(list, a2);
    expect(list.find((item) => item.id === a.id)?.title).toBe('A2');
    expect(list).toHaveLength(2);

    list = removeItem(list, b.id);
    expect(list.map((item) => item.id)).toEqual([a.id]);
  });
});
