/**
 * Username Validation and Reserved Words Filter
 *
 * Prevents users from using inappropriate or reserved usernames.
 */

import { containsBadWords } from './badWordsFilter';

/**
 * Tier 1: Admin/Staff Reserved Words (MUST block)
 */
const ADMIN_RESERVED = [
  // Korean
  '관리자', '운영자', '운영진', '스태프', '모더레이터', '공식', '인증',
  // English
  'admin', 'administrator', 'mod', 'moderator', 'root', 'system', 'sys',
  'staff', 'support', 'official', 'verified', 'owner', 'dev', 'developer',
];

/**
 * Tier 1: Service Reserved Words (MUST block)
 */
const SERVICE_RESERVED = [
  // Korean
  '도움말', '메일', '문의', '서비스', '팀', '테스트', '게스트', '손님',
  // English
  'help', 'api', 'webhook', 'www', 'ftp', 'smtp', 'mail', 'email',
  'info', 'information', 'contact', 'service', 'team',
  'test', 'demo', 'sample', 'guest', 'news', 'blog',
];

/**
 * Tier 1: Brand Reserved Words (MUST block)
 */
const BRAND_RESERVED = [
  'naelum', 'nael',
  // '낼름' is used by the official admin account
];

/**
 * Tier 2: Technical Reserved Words (SHOULD block - prevent confusion)
 */
const TECH_RESERVED = [
  // Korean
  '익명',
  // English
  'null', 'undefined', 'none', 'nil',
  'true', 'false',
  'delete', 'remove', 'banned',
  'error', 'warning',
  'console', 'log',
  'anonymous',
];

/**
 * Tier 2: Generic Role Names (SHOULD block - prevent confusion)
 */
const ROLE_RESERVED = [
  // Korean
  '사용자', '회원', '모두', '전체', '공개',
  // English
  'user', 'member', 'everyone', 'all', 'public',
];

/**
 * Combined list of all reserved usernames
 */
const ALL_RESERVED = [
  ...ADMIN_RESERVED,
  ...SERVICE_RESERVED,
  ...BRAND_RESERVED,
  ...TECH_RESERVED,
  ...ROLE_RESERVED,
];

/**
 * Normalize username for comparison
 * - Convert to lowercase
 * - Remove spaces, hyphens, underscores
 * - Handle common character substitutions (leet speak)
 */
function normalizeUsername(username: string): string {
  return username
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]/g, '')
    // Leet speak substitutions
    .replace(/[@4]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/7/g, 't');
}

/**
 * Check if username is reserved
 */
export function isReservedUsername(username: string): boolean {
  const normalized = normalizeUsername(username);

  // Check exact matches
  for (const reserved of ALL_RESERVED) {
    const normalizedReserved = normalizeUsername(reserved);

    // Exact match
    if (normalized === normalizedReserved) {
      return true;
    }

    // Contains reserved word (for multi-word usernames)
    // e.g., "admin123" contains "admin"
    if (normalized.includes(normalizedReserved) && normalizedReserved.length >= 4) {
      return true;
    }
  }

  return false;
}

/**
 * Validate username format
 */
export function validateUsernameFormat(username: string): {
  valid: boolean;
  error?: string;
} {
  // Length check
  if (username.length < 2 || username.length > 20) {
    return {
      valid: false,
      error: '사용자명은 2-20자여야 합니다.',
    };
  }

  // Character check (Korean, English, numbers, underscore only)
  const regex = /^[a-zA-Z0-9_가-힣ㄱ-ㅎㅏ-ㅣ]+$/;
  if (!regex.test(username)) {
    return {
      valid: false,
      error: '사용자명은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.',
    };
  }

  return { valid: true };
}

/**
 * Complete username validation
 * Checks: format, profanity, reserved words
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  // 1. Format validation
  const formatCheck = validateUsernameFormat(username);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // 2. Profanity check (using existing badWordsFilter)
  if (containsBadWords(username)) {
    return {
      valid: false,
      error: '부적절한 단어가 포함되어 있습니다.',
    };
  }

  // 3. Reserved words check
  if (isReservedUsername(username)) {
    return {
      valid: false,
      error: '사용할 수 없는 사용자명입니다.',
    };
  }

  return { valid: true };
}

/**
 * Get detailed validation errors (for debugging)
 */
export function getValidationDetails(username: string): {
  format: boolean;
  profanity: boolean;
  reserved: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const formatCheck = validateUsernameFormat(username);
  const hasProfanity = containsBadWords(username);
  const isReserved = isReservedUsername(username);

  if (!formatCheck.valid) errors.push(formatCheck.error!);
  if (hasProfanity) errors.push('부적절한 단어 포함');
  if (isReserved) errors.push('예약어 사용');

  return {
    format: formatCheck.valid,
    profanity: !hasProfanity,
    reserved: !isReserved,
    errors,
  };
}

/**
 * Export reserved words lists for reference
 */
export const RESERVED_WORDS = {
  admin: ADMIN_RESERVED,
  service: SERVICE_RESERVED,
  brand: BRAND_RESERVED,
  tech: TECH_RESERVED,
  role: ROLE_RESERVED,
  all: ALL_RESERVED,
};
