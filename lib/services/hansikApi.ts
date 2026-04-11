/**
 * 한식진흥원 아카이브 레시피 OpenAPI 클라이언트
 * data.go.kr 데이터ID: 15136607
 *
 * API는 215개 레시피에 대한 2,033건의 재료 데이터를 제공한다.
 * 출처: 한식진흥원 (https://www.data.go.kr/data/15136607/fileData.do)
 */

// ============================================================
// 타입 정의
// ============================================================

export interface HansikApiResponse {
  currentCount: number;
  data: HansikIngredientRecord[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export interface HansikIngredientRecord {
  내용: string;      // "300g", "18g(1큰술)", "약간"
  레시피ID: number;  // 레시피 ID (717~1239)
  명칭: string;      // 재료명
  분류: number;      // 레시피 내 순서
  재료ID: number;    // 고유 재료 레코드 ID
}

export interface ParsedAmount {
  quantity: number | null;
  unit: string;
  notes: string | null;
}

// ============================================================
// 상수
// ============================================================

const HANSIK_API_BASE = 'https://api.odcloud.kr/api/15136607/v1/uddi:307127d7-e398-458e-a0e8-d805edd6ef76';
const API_KEY = process.env.DATA_GO_KR_API_KEY || '247ca382f15800a03ccd5740039731c9dd339ef88b0d26414bfc6d09cb4fb3ec';
const PAGE_SIZE = 500;
const DELAY_MS = 500;

// 단위 정규식 (숫자 + 단위 패턴)
const AMOUNT_REGEX = /^(\d+\.?\d*(?:\/\d+)?)\s*(kg|g|ml|L|l|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|근|되|홉|스푼|알|T|t|ts|cc|oz|리터|그램|인분)\s*(.*)$/;

// 정성적 표현
const QUALITATIVE_UNITS = ['약간', '적당량', '조금', '소량', '적당히', '충분히', '넉넉히'];

// ============================================================
// API 호출 함수
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchHansikIngredients(
  page: number,
  perPage: number = PAGE_SIZE,
): Promise<HansikApiResponse> {
  const url = `${HANSIK_API_BASE}?page=${page}&perPage=${perPage}&serviceKey=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`한식진흥원 API 호출 실패 (${res.status}): ${text}`);
  }

  return res.json() as Promise<HansikApiResponse>;
}

export async function fetchAllHansikIngredients(): Promise<HansikIngredientRecord[]> {
  const all: HansikIngredientRecord[] = [];
  let page = 1;

  while (true) {
    const res = await fetchHansikIngredients(page, PAGE_SIZE);
    all.push(...res.data);

    console.log(`  [API] 페이지 ${page}: ${res.currentCount}건 (${all.length}/${res.totalCount})`);

    if (all.length >= res.totalCount) break;
    page++;
    await sleep(DELAY_MS);
  }

  return all;
}

// ============================================================
// 용량 파싱
// ============================================================

function evalFraction(s: string): number {
  if (s.includes('/')) {
    const [num, den] = s.split('/');
    return parseFloat(num) / parseFloat(den);
  }
  return parseFloat(s);
}

export function parseHansikAmount(content: string): ParsedAmount {
  const trimmed = content.trim();

  // 정성적 표현 체크
  for (const q of QUALITATIVE_UNITS) {
    if (trimmed === q || trimmed.endsWith(q)) {
      return { quantity: null, unit: q, notes: null };
    }
  }

  // 괄호 안 내용 분리: "18g(1큰술)" → raw="18g", parenNote="1큰술"
  let raw = trimmed;
  let parenNote: string | null = null;
  const parenMatch = trimmed.match(/^([^(]+)\(([^)]+)\)(.*)$/);
  if (parenMatch) {
    raw = (parenMatch[1] + parenMatch[3]).trim();
    parenNote = parenMatch[2].trim();
  }

  // 숫자+단위 매칭
  const m = AMOUNT_REGEX.exec(raw);
  if (m) {
    const quantity = evalFraction(m[1]);
    const unit = m[2];
    const extra = m[3]?.trim() || null;
    const notes = [parenNote, extra].filter(Boolean).join(', ') || null;
    return { quantity, unit, notes };
  }

  // 숫자만 있는 경우 (단위 없음)
  const numOnly = raw.match(/^(\d+\.?\d*(?:\/\d+)?)\s*$/);
  if (numOnly) {
    return { quantity: evalFraction(numOnly[1]), unit: '', notes: parenNote };
  }

  // 매칭 실패 - 원본 그대로 반환
  return { quantity: null, unit: trimmed, notes: null };
}
