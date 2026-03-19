import axios, { type AxiosError } from 'axios';

interface ApiErrorData {
  message?: string | string[];
}

type ApiAxiosError = AxiosError<ApiErrorData>;
export type AppError = Error | ApiAxiosError;

/**
 * Returns true if the error is from an aborted/canceled request (e.g. AbortController).
 */
export function isCancelError(err: AppError): boolean {
  return axios.isCancel(err);
}

/**
 * Converts an ISO date string to local datetime-local input format (YYYY-MM-DDTHH:mm).
 * Avoids timezone drift when editing event dates.
 */
export function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Returns tomorrow's date in YYYY-MM-DD format (local timezone) for date input min attribute.
 */
export function getTomorrowDateMin(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  return toLocalDatetimeInput(t.toISOString()).slice(0, 10);
}

/**
 * Extracts error message from API error response.
 * Handles both string and string[] message formats from NestJS/class-validator.
 */
export function extractErrorMessage(
  err: AppError,
  fallback = 'Something went wrong',
): string {
  if (axios.isAxiosError<ApiErrorData>(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }

  if (typeof err.message === 'string' && err.message.length > 0) {
    return err.message;
  }
  return fallback;
}
