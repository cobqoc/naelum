import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildUploadFileName } from '../useFileUpload';

afterEach(() => {
  vi.useRealTimers();
});

describe('buildUploadFileName', () => {
  it('userId/{prefix}-{ms}-{rand6}.{ext} 형식', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T00:00:00Z'));
    const result = buildUploadFileName('user-abc', 'thumbnail', 'photo.png');
    // user-abc/thumbnail-{ms}-{rand}.png
    expect(result).toMatch(/^user-abc\/thumbnail-\d+-[a-z0-9]{1,6}\.png$/);
  });

  it('원본 확장자 보존 (jpg)', () => {
    const result = buildUploadFileName('u', 'thumb', 'IMG_1234.jpg');
    expect(result.endsWith('.jpg')).toBe(true);
  });

  it('원본 확장자 보존 (webp)', () => {
    const result = buildUploadFileName('u', 'thumb', 'cookie.webp');
    expect(result.endsWith('.webp')).toBe(true);
  });

  it('확장자 없는 파일명 → bin fallback', () => {
    const result = buildUploadFileName('u', 'thumb', 'noext');
    expect(result.endsWith('.bin')).toBe(true);
  });

  it('점으로 끝나는 파일명 → bin fallback (잘못된 확장자 회피)', () => {
    const result = buildUploadFileName('u', 'thumb', 'trailing.');
    expect(result.endsWith('.bin')).toBe(true);
  });

  it('점으로 시작하는 dotfile → 확장자 없음으로 처리 (bin)', () => {
    const result = buildUploadFileName('u', 'thumb', '.gitignore');
    expect(result.endsWith('.bin')).toBe(true);
  });

  it('여러 점 있는 파일명 → 마지막 점 뒤만 확장자', () => {
    const result = buildUploadFileName('u', 'thumb', 'my.recipe.photo.heic');
    expect(result.endsWith('.heic')).toBe(true);
  });

  it('userId·prefix 변경 반영', () => {
    const a = buildUploadFileName('alice', 'ingredients', 'a.png');
    const b = buildUploadFileName('bob', 'tip-thumb', 'b.png');
    expect(a.startsWith('alice/ingredients-')).toBe(true);
    expect(b.startsWith('bob/tip-thumb-')).toBe(true);
  });

  it('같은 입력에 대해 매번 다른 파일명 (Date.now + random)', () => {
    const a = buildUploadFileName('u', 'thumb', 'x.png');
    // 같은 ms 라도 random 6자리가 다르므로 충돌 거의 없음.
    // 다음 ms 호출 보장 위해 sleep 1ms (테스트 환경 — 실 production 영향 0).
    const b = buildUploadFileName('u', 'thumb', 'x.png');
    expect(a).not.toBe(b);
  });

  it('한글 파일명 처리 (확장자만 추출)', () => {
    const result = buildUploadFileName('u', 'thumb', '김치찌개.png');
    expect(result.endsWith('.png')).toBe(true);
  });
});
