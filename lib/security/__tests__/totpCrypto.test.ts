import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { encryptSecret, decryptSecret, base32Encode } from '../totp';

// 2026-10-04 AG2-32: setup 라우트의 인라인 AES → encryptSecret. decryptSecret 과 짝이 맞는지(형식·알고리즘) 고정.
const KEY = 'a'.repeat(64);

beforeAll(() => {
  process.env.TOTP_ENCRYPTION_KEY = KEY;
});

// 옛 setup 라우트 인라인 코드 그대로(IV 만 주입 가능하게) — 출력 형식 동등성 비교용
function legacyInlineEncrypt(secret: string, iv: Buffer): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(KEY.slice(0, 64), 'hex'), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

describe('encryptSecret ↔ decryptSecret', () => {
  it('왕복: 암호화한 시크릿을 그대로 복호화', () => {
    const secret = base32Encode(crypto.randomBytes(20));
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it('형식 `ivHex(32자):cipherHex` — 옛 인라인 출력과 같은 IV 면 바이트 동일', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const out = encryptSecret(secret);
    const [ivHex, body] = out.split(':');
    expect(ivHex).toMatch(/^[0-9a-f]{32}$/);
    expect(body).toMatch(/^[0-9a-f]+$/);
    expect(legacyInlineEncrypt(secret, Buffer.from(ivHex, 'hex'))).toBe(out);
  });

  it('키 미설정이면 throw (라우트는 그 전에 500 안내)', () => {
    const saved = process.env.TOTP_ENCRYPTION_KEY;
    delete process.env.TOTP_ENCRYPTION_KEY;
    expect(() => encryptSecret('x')).toThrow();
    process.env.TOTP_ENCRYPTION_KEY = saved;
  });
});
