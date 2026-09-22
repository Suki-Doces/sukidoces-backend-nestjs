import { Transform } from 'class-transformer';

function stripHtml(value: string): string {
  return value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function Sanitize() {
  return Transform(({ value }) => (typeof value === 'string' ? stripHtml(value) : value));
}
