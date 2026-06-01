/**
 * 이미지 업로드 검증 — 타입 화이트리스트 + 크기 상한 + 매직바이트(파일 내용) 검증.
 *
 * `/api/upload` 와 `/api/recipes/[id]/complete` 가 동일 규칙을 쓰도록 단일 출처로 추출(H2).
 * 매직바이트 검증은 확장자·Content-Type 위조(.jpg 로 위장한 실행파일 등)를 차단한다.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const FILE_SIGNATURES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

export interface ImageValidationResult {
  ok: boolean;
  /** 실패 시 사용자에게 표시할 메시지 */
  error?: string;
  /** 성공 시 업로드에 재사용할 파일 바이트(중복 read 방지) */
  bytes?: ArrayBuffer;
}

/** File 의 타입·크기·매직바이트를 검증하고 바이트를 반환. */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 허용)' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' };
  }

  const bytes = await file.arrayBuffer();
  const header = new Uint8Array(bytes, 0, 8);
  const expectedSig = FILE_SIGNATURES[file.type];
  if (expectedSig && !expectedSig.every((b, i) => header[i] === b)) {
    return { ok: false, error: '파일 내용이 선언된 형식과 일치하지 않습니다.' };
  }

  return { ok: true, bytes };
}
