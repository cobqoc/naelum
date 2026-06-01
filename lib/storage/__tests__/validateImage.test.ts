import { describe, it, expect } from 'vitest';
import { validateImageFile, MAX_IMAGE_SIZE } from '../validateImage';

// 유효 PNG: 매직바이트 89 50 4E 47 로 시작
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

function fileOf(bytes: Uint8Array, type: string, name = 'x') {
  return new File([bytes], name, { type });
}

describe('validateImageFile (H2 업로드 검증)', () => {
  it('유효한 PNG 통과', async () => {
    const r = await validateImageFile(fileOf(pngBytes, 'image/png'));
    expect(r.ok).toBe(true);
    expect(r.bytes).toBeInstanceOf(ArrayBuffer);
  });

  it('허용되지 않는 타입 거부', async () => {
    const r = await validateImageFile(fileOf(pngBytes, 'application/pdf'));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('형식');
  });

  it('크기 초과 거부', async () => {
    const big = new File([new Uint8Array(MAX_IMAGE_SIZE + 1)], 'big.jpg', { type: 'image/jpeg' });
    const r = await validateImageFile(big);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('5MB');
  });

  it('타입 위조(매직바이트 불일치) 거부 — PNG 선언인데 JPEG 바이트', async () => {
    const r = await validateImageFile(fileOf(jpegBytes, 'image/png'));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('일치');
  });
});
