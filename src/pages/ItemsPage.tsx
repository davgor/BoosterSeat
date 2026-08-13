import { useEffect, useState } from 'react';
import ItemForm from '../components/ItemForm';
import ItemList from '../components/ItemList';
import {
  createItem,
  removeItem,
  updateItem,
  upsertItem,
  type Item,
  type ItemDraft,
} from '../lib/items';
import { loadItems, saveItems } from '../lib/storage';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>(() => loadItems());
  const [editing, setEditing] = useState<Item | null>(null);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  function handleCreate(draft: ItemDraft) {
    setItems((current) => upsertItem(current, createItem(draft)));
  }

  function handleUpdate(draft: ItemDraft) {
    if (!editing) {
      return;
    }
    setItems((current) => upsertItem(current, updateItem(editing, draft)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    setItems((current) => removeItem(current, id));
    if (editing?.id === id) {
      setEditing(null);
    }
  }

  return (
    <section>
      <p className="hero-copy">
        A tiny localStorage CRUD loop you can delete and replace. Keep the process layer — CI,
        board, skills, fireguard — and grow your own product on top.
      </p>
      <div className="panel">
        {editing ? (
          <ItemForm
            key={editing.id}
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <ItemForm onSubmit={handleCreate} />
        )}
        <ItemList items={items} onEdit={setEditing} onDelete={handleDelete} />
      </div>
    </section>
  );
}
