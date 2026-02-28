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
 * Extracts error message from API error response.
 * Handles both string and string[] message formats from NestJS/class-validator.
 */
export function extractErrorMessage(
  err: unknown,
  fallback = 'Something went wrong',
): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg || fallback;
}
