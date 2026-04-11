/**
 * CSRF protection via Origin header validation.
 *
 * Works reliably in serverless environments — no in-memory state required.
 *
 * Why this is sufficient:
 * - Supabase Auth uses SameSite=Lax cookies, which browsers refuse to send
 *   on cross-site non-safe (POST/PUT/DELETE/PATCH) requests. This already
 *   prevents CSRF for all authenticated endpoints.
 * - Origin validation adds defense-in-depth for public mutation endpoints
 *   (e.g. /api/contact) where no auth cookie is required.
 *
 * Usage:
 *   import { validateOrigin } from '@/lib/security/csrf';
 *
 *   export async function POST(request: NextRequest) {
 *     if (!validateOrigin(request)) {
 *       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 *     }
 *     // ...
 *   }
 */

function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    origins.push(process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''));
  }

  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:3001');
  }

  return origins;
}

/**
 * Validates the Origin header to prevent CSRF attacks on public endpoints.
 *
 * Returns true when:
 * - No Origin header is present (same-origin browser navigation, server-to-server, curl)
 * - The Origin matches one of the configured allowed origins
 *
 * Returns false when an untrusted cross-origin request is detected.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');

  // No Origin header → same-origin or non-browser request; allow
  if (!origin) return true;

  const allowed = getAllowedOrigins();

  if (allowed.length === 0) {
    // NEXT_PUBLIC_SITE_URL not set — warn but don't block (avoids locking out in misconfigured envs)
    console.warn('[csrf] No allowed origins configured. Set NEXT_PUBLIC_SITE_URL to enable origin validation.');
    return true;
  }

  return allowed.includes(origin);
}
