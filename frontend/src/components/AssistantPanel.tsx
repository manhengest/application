import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { extractErrorMessage, type AppError } from '../lib/utils';
import { Sparkles } from 'lucide-react';

interface AskAssistantResponse {
  answer: string;
  usedScope: string;
  intent: string;
  referencedEventIds: string[];
  disclaimer?: string;
}

const SAMPLE_PROMPTS = [
  'How many events do I have?',
  'What events am I attending this week?',
  'Show my events from last week',
  'Show my tech events',
  "Who's attending the Tech Conference 2025?",
];

interface AssistantPanelProps {
  page?: 'events' | 'my-events' | 'event-details';
  eventId?: string;
}

export function AssistantPanel({ page = 'my-events', eventId }: AssistantPanelProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [disclaimer, setDisclaimer] = useState('');

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setError('');
      setDisclaimer('');
      setAnswer('');
      setLoading(true);
      try {
        const payload: { question: string; page?: string; eventId?: string } = {
          question: trimmed,
          page,
        };
        if (eventId) payload.eventId = eventId;
        const { data } = await api.post<AskAssistantResponse>('/assistant/ask', payload);
        setAnswer(data.answer);
        if (data.disclaimer) setDisclaimer(data.disclaimer);
      } catch (err) {
        setError(extractErrorMessage(err as AppError, 'Failed to get answer'));
      } finally {
        setLoading(false);
      }
    },
    [page, eventId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(question);
  };

  const handleChipClick = (prompt: string) => {
    setQuestion(prompt);
    void ask(prompt);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden />
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Ask questions about your events. Try counting events, listing upcoming or past events, filtering by tag, or viewing participants.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What events am I attending this week?"
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Ask a question about your events"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleChipClick(prompt)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>
      </form>
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {disclaimer && !error && (
        <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
          {disclaimer}
        </div>
      )}
      {answer && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
