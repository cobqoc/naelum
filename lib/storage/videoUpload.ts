/**
 * 레시피 영상 업로드 규칙 단일 출처 — POST /api/upload-video(multipart) 와 /api/upload-video/sign(직접 업로드) 공용.
 *
 * 2026-10-20 AG2-10: 한도를 100MB 로 안내했지만 multipart 경로는 Vercel 함수 본문 한도(4.5MB)에 막혀 도달 불가였다.
 * 큰 영상은 sign 경로로 스토리지에 직접 올린다. 한도는 Supabase 무료 플랜의 파일당 최대치(50MB)에 맞춘다 —
 * 그보다 크면 스토리지가 어차피 거부한다. 같은 값이 recipe-videos 버킷 file_size_limit 에도 걸려 있다
 * (supabase/migrations/20261020_recipe_videos_bucket_limits.sql). 플랜을 올리면 둘 다 함께 올릴 것.
 */

export const VIDEO_ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const VIDEO_MAX_SIZE = 50 * 1024 * 1024; // 50MB

export type VideoMetaCheck =
  | { ok: true; ext: 'mp4' | 'mov' | 'webm' }
  | { ok: false; error: string };

/** 형식·크기 검증 + 확장자 산출. 문구는 API 라우트 관례대로 한국어(클라이언트가 번역 메시지로 치환). */
export function checkVideoMeta(contentType: unknown, size: unknown): VideoMetaCheck {
  if (typeof contentType !== 'string' || !(VIDEO_ALLOWED_TYPES as readonly string[]).includes(contentType)) {
    return { ok: false, error: '지원하지 않는 파일 형식입니다. (MP4, MOV, WebM만 허용)' };
  }
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return { ok: false, error: '파일 크기가 올바르지 않습니다.' };
  }
  if (size > VIDEO_MAX_SIZE) {
    return { ok: false, error: '파일 크기는 50MB를 초과할 수 없습니다.' };
  }
  const ext = contentType === 'video/quicktime' ? 'mov' : contentType === 'video/webm' ? 'webm' : 'mp4';
  return { ok: true, ext };
}
