/**
 * Profanity Filter for Ingredient Names
 *
 * Prevents users from submitting ingredients with inappropriate names.
 * This is a basic implementation - in production, consider using a more comprehensive
 * profanity detection library.
 */

/**
 * List of banned words (Korean and English)
 * NOTE: This is a minimal list for demonstration.
 * In production, expand this list or use a dedicated profanity filter library.
 */
const BAD_WORDS: string[] = [
  // Korean profanity (common offensive words)
  '욕설',
  '비속어',
  '개새끼',
  '새끼',
  '시발',
  '씨발',
  '병신',
  '염병',
  '지랄',
  '좆',
  '좃',
  'dick',
  '쓰레기',
  '미친',
  '또라이',
  '븅신',
  '애미',
  '애비',
  '년',
  '놈',

  // English profanity (common offensive words)
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'damn',
  'crap',
  'dick',
  'cock',
  'pussy',
  'slut',
  'whore',

  // Common spam patterns
  'viagra',
  'casino',
  'porn',
  'xxx',
  'sex',
];

/**
 * Normalize text to catch obfuscated profanity
 *
 * @param text - Text to normalize
 * @returns Normalized text with common substitutions replaced
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  // Replace common obfuscations
  normalized = normalized
    .replace(/[@4]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/7/g, 't');

  // Remove spaces, hyphens, underscores
  normalized = normalized.replace(/[\s\-_]/g, '');

  return normalized;
}

/**
 * Check if text contains banned words
 *
 * @param text - Text to check
 * @returns True if text contains profanity, false otherwise
 *
 * @example
 * ```typescript
 * containsBadWords('토마토'); // false
 * containsBadWords('욕설단어'); // true
 * containsBadWords('b@dword'); // true (catches obfuscation)
 * ```
 */
export function containsBadWords(text: string): boolean {
  const normalized = normalizeText(text);

  // Check exact matches
  for (const word of BAD_WORDS) {
    const normalizedWord = normalizeText(word);

    // Check if normalized text contains the bad word
    if (normalized.includes(normalizedWord)) {
      return true;
    }
  }

  return false;
}

/**
 * Get list of detected bad words in text (for debugging/logging)
 *
 * @param text - Text to check
 * @returns Array of detected bad words
 */
export function getDetectedBadWords(text: string): string[] {
  const normalized = normalizeText(text);
  const detected: string[] = [];

  for (const word of BAD_WORDS) {
    const normalizedWord = normalizeText(word);

    if (normalized.includes(normalizedWord)) {
      detected.push(word);
    }
  }

  return detected;
}

/**
 * Sanitize text by replacing bad words with asterisks
 *
 * @param text - Text to sanitize
 * @returns Sanitized text with bad words replaced
 *
 * @example
 * ```typescript
 * sanitizeText('토마토'); // '토마토'
 * sanitizeText('욕설단어'); // '***'
 * ```
 */
export function sanitizeText(text: string): string {
  let sanitized = text;

  for (const word of BAD_WORDS) {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '***');
  }

  return sanitized;
}

/**
 * Validate ingredient name for profanity and inappropriate content
 *
 * @param name - Ingredient name to validate
 * @returns Validation result with error message if invalid
 */
export function validateIngredientName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (containsBadWords(name)) {
    return {
      valid: false,
      error: '부적절한 단어가 포함되어 있습니다. 다른 이름을 사용해주세요.',
    };
  }

  return { valid: true };
}
