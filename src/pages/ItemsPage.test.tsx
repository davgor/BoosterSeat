import { describe, expect, it, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STORAGE_KEY } from '../lib/storage';
import { renderWithRouter } from '../test/renderWithRouter';
import ItemsPage from './ItemsPage';

describe('ItemsPage', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('creates, edits, and deletes an item', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ItemsPage />);

    await user.type(screen.getByLabelText(/title/i), 'Write README');
    await user.type(screen.getByLabelText(/notes/i), 'Keep it short');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    const list = screen.getByRole('list', { name: /items/i });
    expect(within(list).getByText('Write README')).toBeInTheDocument();

    await user.click(within(list).getByRole('button', { name: /edit/i }));
    const editForm = screen.getByRole('form', { name: /edit item/i });
    await user.clear(within(editForm).getByLabelText(/title/i));
    await user.type(within(editForm).getByLabelText(/title/i), 'Ship README');
    await user.click(within(editForm).getByRole('button', { name: /save changes/i }));

    expect(within(list).getByText('Ship README')).toBeInTheDocument();

    await user.click(within(list).getByRole('button', { name: /delete/i }));
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });
});
