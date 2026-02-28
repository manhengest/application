import { describe, it, expect } from 'vitest';
import { toLocalDatetimeInput, extractErrorMessage } from './utils';

describe('toLocalDatetimeInput', () => {
  it('converts ISO string to local datetime-local format', () => {
    const iso = '2025-03-15T14:30:00.000Z';
    const result = toLocalDatetimeInput(iso);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('extractErrorMessage', () => {
  it('extracts string message from axios error', () => {
    const err = { response: { data: { message: 'Validation failed' } } };
    expect(extractErrorMessage(err)).toBe('Validation failed');
  });

  it('handles string[] message from class-validator', () => {
    const err = { response: { data: { message: ['email must be valid', 'password too short'] } } };
    expect(extractErrorMessage(err)).toBe('email must be valid, password too short');
  });

  it('returns fallback when no message', () => {
    expect(extractErrorMessage({})).toBe('Something went wrong');
    expect(extractErrorMessage({}, 'Custom fallback')).toBe('Custom fallback');
  });
});
