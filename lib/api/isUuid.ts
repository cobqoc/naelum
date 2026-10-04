const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 문자열이 UUID 형식인지 — 클라이언트가 보낸 FK 후보를 DB(uuid 컬럼)에 넣기 전 거르는 용도. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}
