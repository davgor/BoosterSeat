import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import App from './App';
import { renderWithRouter } from './test/renderWithRouter';

describe('App', () => {
  it('renders the brand and primary navigation', () => {
    renderWithRouter(<App />);
    expect(screen.getByRole('heading', { name: /booster/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /items/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /items/i })).toHaveAttribute('href', '/');
  });
});
