/**
 * API 응답 계약(contract) 타입.
 *
 * 왜 이 파일이 있는가 (영상 「2차 소프트웨어 위기」 처방 — "명확한 인터페이스"):
 *   route.ts 들이 반환하는 JSON 형태가 코드에 흩어져 있어 클라이언트/AI가
 *   응답 구조를 추론하기 어려웠다. 이 파일이 **응답 형태의 단일 진실원**이다.
 *   "잘 쓴 타입은 그 자체로 AI 컨텍스트(1차 자료)가 된다."
 *
 * 범위/원칙:
 *   - 여기 정의는 **순수 타입**이다. 런타임 코드 변경 없음 → 회귀 위험 0.
 *   - route.ts 가 *실제로 반환하는* envelope 만 모델링한다 (추정 금지 —
 *     CLAUDE.md 데이터 무결성 원칙과 동일 정신).
 *   - 내부 Supabase 조인 결과의 광범위 재타이핑은 하지 않는다
 *     (ARCHITECTURE.md anti-goal: "타입 완벽주의를 위한 리팩터 ❌").
 *   - 새 route 작성 시 응답을 이 타입으로 annotate 하면 계약이 강제된다.
 */

/** 모든 API 에러 응답 공통 envelope. */
export interface ApiError {
  error: string;
}

/** 성공/에러 union 헬퍼. */
export type ApiResult<T> = T | ApiError;

// ───────────────────────────── 추천 (/api/recommendations) ──────────────────

/**
 * 추천 결과 1건.
 * route.ts:277~ 의 recipesWithMatch.map() 가 레시피 row 를 spread 한 뒤
 * 아래 매칭 필드를 덧붙여 반환한다. DB row 부분은 환경(select)에 따라
 * 달라질 수 있어 열린 형태로 둔다 (확인되지 않은 컬럼을 단언하지 않음).
 */
export interface RecipeRecommendation {
  id: string;
  title: string;
  /** 매칭률 0~100 (보유 재료 / 레시피 재료). */
  matchRate: number;
  /** 부족한 재료 개수. */
  missingCount: number;
  /** 부족한 재료명 목록. */
  missingIngredientNames: string[];
  /** 부족 재료 → 대체 가능 보유 재료. */
  substitutes: Record<string, string[]>;
  /** recipes select 로 함께 내려오는 나머지 컬럼 (title 외). */
  [extra: string]: unknown;
}

/** GET /api/recommendations 성공 응답. */
export interface RecommendationsResponse {
  recommendations: RecipeRecommendation[];
  /** 재료 미등록 등 안내 메시지 (recommendations 가 빈 배열일 때). */
  message?: string;
  /** 요청 type 에코 (예: 'ingredients'). */
  type?: string;
  /** resolve 된 모드 (ready | almost | all). */
  mode?: string;
}

// ───────────────────────────── 검색 (/api/search) ───────────────────────────

/** 검색 결과 섹션 하나 (recipes / users / ingredients 각각). */
export interface SearchSection<T = unknown> {
  data: T[];
  total: number;
}

/** type 파라미터에 따라 일부 섹션만 채워질 수 있다. */
export interface SearchResults {
  recipes?: SearchSection;
  users?: SearchSection;
  ingredients?: SearchSection;
}

/** GET /api/search 성공 응답. */
export interface SearchResponse {
  results: SearchResults;
  query: string;
  pagination: { page: number; limit: number };
}
