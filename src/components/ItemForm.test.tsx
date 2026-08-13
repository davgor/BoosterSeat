import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/renderWithRouter';
import ItemForm from './ItemForm';

describe('ItemForm', () => {
  it('submits a trimmed draft and clears create fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithRouter(<ItemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), '  Ship it  ');
    await user.type(screen.getByLabelText(/notes/i), 'tonight');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    expect(onSubmit).toHaveBeenCalledWith({ title: '  Ship it  ', notes: 'tonight' });
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
  });

  it('shows an alert when title is blank', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithRouter(<ItemForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /add item/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/title is required/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
