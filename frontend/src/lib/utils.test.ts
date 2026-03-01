import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { toLocalDatetimeInput, extractErrorMessage, isCancelError } from './utils';

describe('isCancelError', () => {
  it('returns true for axios cancel errors', () => {
    const cancelError = new axios.CanceledError('Operation canceled');
    expect(isCancelError(cancelError)).toBe(true);
  });

  it('returns false for regular Error objects', () => {
    expect(isCancelError(new Error('Something failed'))).toBe(false);
    expect(isCancelError(new TypeError('Invalid type'))).toBe(false);
  });
});

describe('toLocalDatetimeInput', () => {
  it('converts ISO string to local datetime-local format', () => {
    const iso = '2025-03-15T14:30:00.000Z';
    const result = toLocalDatetimeInput(iso);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('extractErrorMessage', () => {
  it('extracts string message from axios error', () => {
    const err = Object.assign(new Error(), {
      isAxiosError: true,
      response: { data: { message: 'Validation failed' } },
    });
    expect(extractErrorMessage(err)).toBe('Validation failed');
  });

  it('handles string[] message from class-validator', () => {
    const err = Object.assign(new Error(), {
      isAxiosError: true,
      response: { data: { message: ['email must be valid', 'password too short'] } },
    });
    expect(extractErrorMessage(err)).toBe('email must be valid, password too short');
  });

  it('returns fallback when no message', () => {
    expect(extractErrorMessage(new Error(''))).toBe('Something went wrong');
    expect(extractErrorMessage(new Error(''), 'Custom fallback')).toBe('Custom fallback');
  });
});
