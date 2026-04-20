/**
 * 한국 영수증 OCR 텍스트 파서
 *
 * Tesseract.js 등 OCR 결과(텍스트 라인 배열)를 받아 구조화된 항목으로 변환.
 * 매장명·날짜 추출 + 합계·할인·카드 같은 결제 라인 제거 + 상품명·수량·가격 추출.
 */

export interface ParsedItem {
  rawText: string;
  itemName: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
}

export interface ParsedReceipt {
  store: string | null;
  date: string | null;
  items: ParsedItem[];
}

// 제외할 키워드 (합계·결제·세금 관련 라인)
const EXCLUDE_KEYWORDS = [
  '합계', '소계', '부가세', '부가가치세', '세금', '면세',
  '할인', '쿠폰', '포인트', '적립', '사용',
  '카드', '결제', '승인', '현금', '잔액', '거스름',
  '신용카드', '체크카드', '현금영수증', '영수증',
  '감사합니다', '환영합니다', '고객님',
  '매장', '점포', '지점', '사업자', '대표',
  '전화', 'tel', 'fax',
  '주소', '등록번호',
  '품목', '수량', '단가', '금액', '상품명',
];

// 매장명 후보 (큰 브랜드)
const KNOWN_STORES = [
  '이마트', '홈플러스', '롯데마트', '쿠팡', '마켓컬리',
  'GS25', 'CU', '세븐일레븐', '이마트24',
  '스타벅스', '투썸플레이스', '이디야',
  '맥도날드', '버거킹', 'KFC',
  '다이소', '올리브영',
  '하나로마트', '농협', '킴스클럽',
];

// 숫자만 있는 라인, 너무 짧은 라인, 특수문자만 있는 라인 제외
function isNoise(line: string): boolean {
  const t = line.trim();
  if (t.length < 2) return true;
  if (/^[\d\s.,\-*=+/|\\()]+$/.test(t)) return true;
  if (/^[-=*_~]+$/.test(t)) return true;
  return false;
}

function containsAnyKeyword(line: string, keywords: string[]): boolean {
  return keywords.some(k => line.toLowerCase().includes(k.toLowerCase()));
}

// 매장명 추출 — 알려진 브랜드 우선, 없으면 첫 3줄 중 한글 포함된 것
function extractStore(lines: string[]): string | null {
  for (const line of lines.slice(0, 10)) {
    for (const store of KNOWN_STORES) {
      if (line.includes(store)) return store;
    }
  }
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    if (trimmed.length >= 2 && trimmed.length <= 20 && /[가-힣]/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

// 날짜 추출 — YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD, MM/DD 등
function extractDate(lines: string[]): string | null {
  const patterns = [
    /(\d{4})[-./\s](\d{1,2})[-./\s](\d{1,2})/, // 2026-04-20
    /(\d{2})[-./\s](\d{1,2})[-./\s](\d{1,2})/, // 26-04-20
  ];
  for (const line of lines) {
    for (const re of patterns) {
      const m = line.match(re);
      if (m) {
        const [, rawY, mo, d] = m;
        const y = rawY.length === 2 ? '20' + rawY : rawY;
        const ym = y.padStart(4, '0');
        const mm = mo.padStart(2, '0');
        const dd = d.padStart(2, '0');
        return `${ym}-${mm}-${dd}`;
      }
    }
  }
  return null;
}

// 가격 추출 — 라인 끝에 붙은 숫자 (쉼표 포함)
function extractPrice(line: string): { price: number | null; remaining: string } {
  const m = line.match(/([\d,]+)\s*원?\s*$/);
  if (!m) return { price: null, remaining: line };
  const price = parseInt(m[1].replace(/,/g, ''), 10);
  if (isNaN(price) || price < 100) return { price: null, remaining: line };
  return { price, remaining: line.slice(0, m.index).trim() };
}

// 수량·단위 추출 — "양파 500g", "사과 3개"
function extractQuantityUnit(text: string): { quantity: number | null; unit: string | null; cleaned: string } {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|L|l|개|팩|봉|묶음|박스|통|알|마리|장|병)\s*$/i);
  if (!m) return { quantity: null, unit: null, cleaned: text };
  return {
    quantity: parseFloat(m[1]),
    unit: m[2].toLowerCase() === 'l' ? 'L' : m[2],
    cleaned: text.slice(0, m.index).trim(),
  };
}

// 상품명 후보인지 판단 — 한글 포함 + 제외 키워드 없음 + 노이즈 아님
function isItemCandidate(line: string): boolean {
  if (isNoise(line)) return false;
  if (containsAnyKeyword(line, EXCLUDE_KEYWORDS)) return false;
  if (!/[가-힣a-zA-Z]/.test(line)) return false;
  return true;
}

/**
 * OCR 텍스트 라인 배열을 받아 영수증 구조로 파싱.
 */
export function parseReceiptLines(lines: string[]): ParsedReceipt {
  const cleaned = lines.map(l => l.trim()).filter(l => l.length > 0);

  const store = extractStore(cleaned);
  const date = extractDate(cleaned);

  const items: ParsedItem[] = [];
  for (const rawLine of cleaned) {
    if (!isItemCandidate(rawLine)) continue;

    const { price, remaining } = extractPrice(rawLine);
    const { quantity, unit, cleaned: nameAndUnit } = extractQuantityUnit(remaining);
    const itemName = nameAndUnit.trim();

    // 상품명 최소 조건: 한글/영문 2자 이상
    if (itemName.length < 2) continue;
    if (!/[가-힣a-zA-Z]/.test(itemName)) continue;
    // 가격도 없고 수량도 없으면 단순 안내 문구일 가능성 높음
    if (price === null && quantity === null) continue;

    items.push({ rawText: rawLine, itemName, quantity, unit, price });
  }

  return { store, date, items };
}
