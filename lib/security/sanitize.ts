/**
 * HTML sanitization to prevent XSS attacks.
 * Strips all HTML tags and dangerous attributes from user input.
 */

const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;
const DATA_URI_REGEX = /data\s*:[^,]*(?:;[^,]*)*,/gi;

/**
 * Sanitize a string by removing HTML tags and dangerous content.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(SCRIPT_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(JAVASCRIPT_URI_REGEX, '')
    .replace(DATA_URI_REGEX, '')
    .replace(HTML_TAG_REGEX, '')
    .trim();
}

/**
 * Sanitize all string fields in an object (shallow).
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeHtml(sanitized[key] as string);
    }
  }
  return sanitized;
}
