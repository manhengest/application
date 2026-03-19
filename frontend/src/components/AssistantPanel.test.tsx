import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssistantPanel } from './AssistantPanel';

const mockPost = vi.fn();

vi.mock('../lib/api', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe('AssistantPanel', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('renders input and submit button', () => {
    render(<AssistantPanel />);
    expect(screen.getByPlaceholderText(/e.g., What events am I attending/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask/i })).toBeInTheDocument();
  });

  it('displays sample prompt chips', () => {
    render(<AssistantPanel />);
    expect(screen.getByText('How many events do I have?')).toBeInTheDocument();
    expect(screen.getByText("Who's attending the Tech Conference 2025?")).toBeInTheDocument();
  });

  it('submits question and displays answer', async () => {
    mockPost.mockResolvedValue({
      data: {
        answer: 'You have 3 events.',
        usedScope: 'personal',
        intent: 'count',
        referencedEventIds: [],
      },
    });

    render(<AssistantPanel />);
    const input = screen.getByPlaceholderText(/e.g., What events am I attending/);
    fireEvent.change(input, { target: { value: 'How many events?' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/assistant/ask', {
        question: 'How many events?',
        page: 'my-events',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('You have 3 events.')).toBeInTheDocument();
    });
  });

  it('displays error when API fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    render(<AssistantPanel />);
    fireEvent.click(screen.getByText('How many events do I have?'));

    await waitFor(() => {
      expect(screen.getByText(/Network error|Failed to get answer/)).toBeInTheDocument();
    });
  });

  it('passes eventId when provided', async () => {
    mockPost.mockResolvedValue({
      data: {
        answer: 'Alice and Bob are attending.',
        usedScope: 'event-details',
        intent: 'participants',
        referencedEventIds: ['ev-1'],
      },
    });

    render(<AssistantPanel page="event-details" eventId="ev-1" />);
    fireEvent.click(screen.getByText('How many events do I have?'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/assistant/ask', {
        question: 'How many events do I have?',
        page: 'event-details',
        eventId: 'ev-1',
      });
    });
  });
});
