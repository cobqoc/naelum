import { describe, it, expect } from 'vitest';
import { checkVideoMeta, VIDEO_MAX_SIZE } from '../videoUpload';

describe('checkVideoMeta', () => {
  it('허용 형식 → 확장자', () => {
    expect(checkVideoMeta('video/mp4', 1000)).toEqual({ ok: true, ext: 'mp4' });
    expect(checkVideoMeta('video/quicktime', 1000)).toEqual({ ok: true, ext: 'mov' });
    expect(checkVideoMeta('video/webm', 1000)).toEqual({ ok: true, ext: 'webm' });
  });

  it('형식 거부', () => {
    expect(checkVideoMeta('image/png', 1000).ok).toBe(false);
    expect(checkVideoMeta(undefined, 1000).ok).toBe(false);
  });

  it('크기 — 50MB 까지 허용, 초과·0·비숫자 거부', () => {
    expect(checkVideoMeta('video/mp4', VIDEO_MAX_SIZE).ok).toBe(true);
    expect(checkVideoMeta('video/mp4', VIDEO_MAX_SIZE + 1)).toEqual({ ok: false, error: '파일 크기는 50MB를 초과할 수 없습니다.' });
    expect(checkVideoMeta('video/mp4', 0).ok).toBe(false);
    expect(checkVideoMeta('video/mp4', '10').ok).toBe(false);
  });
});
