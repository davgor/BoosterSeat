import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/renderWithRouter';
import ItemList from './ItemList';

const sample = [
  {
    id: 'a',
    title: 'Alpha',
    notes: 'first',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('ItemList', () => {
  it('renders empty state', () => {
    renderWithRouter(<ItemList items={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it('wires edit and delete actions', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithRouter(<ItemList items={sample} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(sample[0]);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('a');
  });
});
