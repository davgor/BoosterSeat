import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import AboutPage from './AboutPage';

describe('AboutPage', () => {
  it('explains how to use the template', () => {
    renderWithRouter(<AboutPage />);
    expect(screen.getByRole('heading', { name: /about this booster seat/i })).toBeInTheDocument();
    expect(screen.getByText(/docs\/using-this-template\.md/i)).toBeInTheDocument();
    expect(screen.getByText(/red team review/i)).toBeInTheDocument();
    expect(screen.getByText(/docs\/stacks\/electron\.md/i)).toBeInTheDocument();
  });
});
