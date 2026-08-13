import { FormEvent, useState } from 'react';
import type { Item, ItemDraft } from '../lib/items';

type ItemFormProps = {
  initial?: Item | null;
  onSubmit: (draft: ItemDraft) => void;
  onCancel?: () => void;
};

export default function ItemForm({ initial = null, onSubmit, onCancel }: ItemFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = { title, notes };
    if (!draft.title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    onSubmit(draft);
    if (!initial) {
      setTitle('');
      setNotes('');
    }
  }

  return (
    <form
      className="item-form"
      onSubmit={handleSubmit}
      aria-label={initial ? 'Edit item' : 'Create item'}
    >
      <label>
        Title
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs tracking?"
          autoComplete="off"
        />
      </label>
      <label>
        Notes
        <textarea
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Optional details"
        />
      </label>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initial ? 'Save changes' : 'Add item'}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
