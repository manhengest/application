/**
 * Normalizes a tag name for case-insensitive comparison and uniqueness.
 * Trims, lowercases, and collapses multiple spaces to one.
 */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
