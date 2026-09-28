/**
 * iceberg-js 대체 shim.
 *
 * @supabase/storage-js 가 `storage.analytics`(Iceberg 카탈로그) 용으로 `IcebergRestCatalog` 를
 * 모듈 상단에서 import 하지만, 우리 앱은 analytics 버킷을 쓰지 않는다(lib/storage 는 upload/getPublicUrl 만).
 * realtime-js/functions-js 와 같은 방식으로 surface 만 유지해 [lang] 레이아웃 청크에서 iceberg-js 를 제거한다.
 * (perf 2026-09-27) 필요해지면 next.config.ts 의 alias 만 제거하면 원본이 다시 포함된다.
 */
export class IcebergRestCatalog {
  constructor(_options?: unknown) {}
}
