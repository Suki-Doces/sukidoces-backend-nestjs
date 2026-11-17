import { Transform } from 'class-transformer';

const stripHtml = (value: string): string =>
  value.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '').trim();

/** Removes HTML tags from free-text input (basic XSS hygiene). */
export function Sanitize() {
  return Transform(({ value }) => (typeof value === 'string' ? stripHtml(value) : value));
}
