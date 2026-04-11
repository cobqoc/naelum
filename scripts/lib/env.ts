/**
 * 스크립트용 .env.local 환경변수 로더
 *
 * 사용법:
 *   import { loadEnvLocal } from './lib/env';
 *   loadEnvLocal();
 *
 *   const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

export function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* .env.local 없으면 무시 */ }
}
