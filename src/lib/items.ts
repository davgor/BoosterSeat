export type Item = {
  id: string;
  title: string;
  notes: string;
  updatedAt: string;
};

export type ItemDraft = {
  title: string;
  notes: string;
};

function createItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createItem(draft: ItemDraft, now = new Date()): Item {
  const title = draft.title.trim();
  if (!title) {
    throw new Error('Title is required');
  }
  return {
    id: createItemId(),
    title,
    notes: draft.notes.trim(),
    updatedAt: now.toISOString(),
  };
}

export function updateItem(item: Item, draft: ItemDraft, now = new Date()): Item {
  const title = draft.title.trim();
  if (!title) {
    throw new Error('Title is required');
  }
  return {
    ...item,
    title,
    notes: draft.notes.trim(),
    updatedAt: now.toISOString(),
  };
}

export function upsertItem(items: Item[], next: Item): Item[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [next, ...items];
  }
  const copy = items.slice();
  copy[index] = next;
  return copy;
}

export function removeItem(items: Item[], id: string): Item[] {
  return items.filter((item) => item.id !== id);
}
