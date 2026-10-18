import { describe, it, expect } from 'vitest';
import { validateImageFile, MAX_IMAGE_SIZE } from '../validateImage';

// 유효 PNG: 매직바이트 89 50 4E 47 로 시작
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

// TS 5.9: 맨 `Uint8Array` 는 Uint8Array<ArrayBufferLike> 라 BlobPart(ArrayBufferView<ArrayBuffer>) 에 안 맞음 → 버퍼 타입 명시.
function fileOf(bytes: Uint8Array<ArrayBuffer>, type: string, name = 'x') {
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

  // 2026-10-04 AG2-11: 8바이트 미만 파일이 RangeError(→500) 대신 불일치(→400) 결과로.
  it('8바이트 미만 파일은 throw 하지 않고 불일치로 거부 (0·3·7바이트)', async () => {
    for (const len of [0, 3, 7]) {
      const r = await validateImageFile(fileOf(new Uint8Array(len), 'image/png'));
      expect(r.ok).toBe(false);
      expect(r.error).toContain('일치');
    }
  });

  it('시그니처가 맞아도 8바이트 미만이면 거부 — 이전에도 통과한 적 없는(throw) 입력이라 허용 범위 불변', async () => {
    const r = await validateImageFile(fileOf(new Uint8Array([0xff, 0xd8, 0xff]), 'image/jpeg'));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('일치');
  });

  it('정확히 8바이트 유효 JPEG 은 통과 (경계)', async () => {
    const r = await validateImageFile(fileOf(jpegBytes, 'image/jpeg'));
    expect(r.ok).toBe(true);
  });
});
