/**
 * Re-export from unified rate limiting module.
 * This file exists for backwards compatibility.
 * Prefer importing directly from '@/lib/ratelimit'.
 */
export {
  RateLimiter,
  rateLimit,
  checkRateLimit,
  ingredientCreationLimiter,
} from '../ratelimit';

export type { RateLimitConfig } from '../ratelimit';
