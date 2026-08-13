import type { Item } from '../lib/items';

type ItemListProps = {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
};

export default function ItemList({ items, onEdit, onDelete }: ItemListProps) {
  if (items.length === 0) {
    return <p className="empty">No items yet. Add one above to start the CRUD loop.</p>;
  }

  return (
    <ul className="item-list" aria-label="Items">
      {items.map((item) => (
        <li key={item.id} className="item-row" data-testid={`item-${item.id}`}>
          <div>
            <h3>{item.title}</h3>
            {item.notes ? <p>{item.notes}</p> : null}
          </div>
          <div className="item-actions">
            <button type="button" className="btn btn-ghost" onClick={() => onEdit(item)}>
              Edit
            </button>
            <button type="button" className="btn btn-danger" onClick={() => onDelete(item.id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
