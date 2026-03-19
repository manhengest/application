import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventTagChip } from './EventTagChip';

describe('EventTagChip', () => {
  it('renders tag name', () => {
    render(<EventTagChip tag={{ id: '1', name: 'Tech' }} />);
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('applies compact class when compact prop is true', () => {
    render(<EventTagChip tag={{ id: '1', name: 'Art' }} compact />);
    const chip = screen.getByText('Art');
    expect(chip).toHaveClass('text-xs');
  });
});
