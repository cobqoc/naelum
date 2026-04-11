/**
 * 영수증 텍스트 파서
 *
 * OCR로 추출된 영수증 텍스트에서 상품 항목을 추출하고
 * 브랜드명/부가정보를 제거하여 순수 재료명을 반환
 */

import {
  BRAND_PREFIXES,
  IGNORE_PATTERNS,
  NON_INGREDIENT_KEYWORDS,
  RECEIPT_IGNORE_KEYWORDS,
  RECEIPT_NAME_MAPPINGS,
} from '@/lib/data/receiptNameMappings';
import type { OcrLine } from './receiptOcr';

export interface ReceiptItem {
  rawText: string;
  itemName: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
}

export interface ParsedReceipt {
  items: ReceiptItem[];
  store: string | null;
  date: string | null;
}

/** 가격 패턴: 쉼표 포함 숫자 (1,500 / 12000 등) */
const PRICE_PATTERN = /[\d,]+$/;

/** 수량/단위 패턴 */
const QUANTITY_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|L|개|팩|봉|병|캔|줄|묶음|포기|단|송이|마리)/i,
  /(\d+(?:\.\d+)?)\s*(KG|G|ML)/,
];

/** 마트명 감지 패턴 */
const STORE_PATTERNS: Record<string, RegExp> = {
  '이마트': /이마트|E[\s-]?MART|EMART/i,
  '롯데마트': /롯데마트|LOTTE\s*MART/i,
  '홈플러스': /홈플러스|HOMEPLUS/i,
  '코스트코': /코스트코|COSTCO/i,
  '하나로마트': /하나로|농협/i,
  'GS더프레시': /GS|더프레시/i,
  '메가마트': /메가마트/i,
};

/** 날짜 패턴 */
const DATE_PATTERNS = [
  /(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/,   // 2026.01.15, 2026-01-15
  /(\d{2})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/,    // 26.01.15
];

/**
 * 라인이 상품 항목인지 판별
 */
function isItemLine(text: string): boolean {
  // 무시 키워드가 포함된 라인 제외
  const lowerText = text.toLowerCase();
  for (const keyword of RECEIPT_IGNORE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return false;
    }
  }

  // 너무 짧은 라인 제외
  if (text.length < 2) return false;

  // 숫자만 있는 라인 제외
  if (/^\s*[\d,.\s]+$/.test(text)) return false;

  // 가격이 포함된 라인은 상품 가능성 높음
  const hasPrice = PRICE_PATTERN.test(text.replace(/\s/g, ''));

  // 한글이 포함되어 있고 가격이 있으면 상품 항목으로 판단
  const hasKorean = /[가-힣]/.test(text);

  return hasKorean && hasPrice;
}

/**
 * 비식재료 여부 확인
 */
function isNonIngredient(itemName: string): boolean {
  const lower = itemName.toLowerCase();
  return NON_INGREDIENT_KEYWORDS.some((keyword) =>
    lower.includes(keyword.toLowerCase())
  );
}

/**
 * 상품명에서 브랜드명 제거
 */
function removeBrandPrefix(name: string): string {
  let cleaned = name;

  for (const brand of BRAND_PREFIXES) {
    // 브랜드명이 앞에 있는 경우 제거
    const brandRegex = new RegExp(`^${escapeRegex(brand)}\\s*`, 'i');
    cleaned = cleaned.replace(brandRegex, '');
  }

  return cleaned.trim();
}

/**
 * 부가정보 패턴 제거 (국산, 수입, 냉장 등)
 */
function removeIgnorePatterns(name: string): string {
  let cleaned = name;

  for (const pattern of IGNORE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

/**
 * 상품명 라인에서 가격 추출
 */
function extractPrice(text: string): number | null {
  // 공백 제거 후 우측 숫자 추출
  const match = text.match(/(\d{1,3}(?:,\d{3})*)\s*$/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

/**
 * 상품명에서 수량/단위 추출
 */
function extractQuantity(text: string): { quantity: number | null; unit: string | null; cleaned: string } {
  for (const pattern of QUANTITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit: match[2].toLowerCase(),
        cleaned: text.replace(match[0], '').trim(),
      };
    }
  }
  return { quantity: null, unit: null, cleaned: text };
}

/**
 * 상품명 정제: 브랜드명, 부가정보, 수량 제거 후 순수 재료명 추출
 */
function cleanItemName(rawName: string): { name: string; quantity: number | null; unit: string | null } {
  let cleaned = rawName.trim();

  // 1. 부가정보 제거
  cleaned = removeIgnorePatterns(cleaned);

  // 2. 브랜드명 제거
  cleaned = removeBrandPrefix(cleaned);

  // 3. 수량/단위 추출 및 제거
  const { quantity, unit, cleaned: afterQuantity } = extractQuantity(cleaned);
  cleaned = afterQuantity;

  // 4. 슬래시 앞부분만 사용 (예: "삼겹살/냉장" → "삼겹살")
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/')[0].trim();
  }

  // 5. 불필요한 공백 정리
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 6. 매핑 테이블에서 표준 재료명으로 변환
  const mapped = RECEIPT_NAME_MAPPINGS[cleaned];
  if (mapped) {
    cleaned = mapped;
  } else {
    // 부분 매칭 시도 (매핑 키가 상품명에 포함된 경우)
    for (const [key, value] of Object.entries(RECEIPT_NAME_MAPPINGS)) {
      if (cleaned.includes(key) && key.length >= 2) {
        cleaned = value;
        break;
      }
    }
  }

  return { name: cleaned, quantity, unit };
}

/**
 * 마트명 감지
 */
function detectStore(lines: OcrLine[]): string | null {
  // 상위 5줄에서 마트명 탐색
  const headerLines = lines.slice(0, 5);
  for (const line of headerLines) {
    for (const [storeName, pattern] of Object.entries(STORE_PATTERNS)) {
      if (pattern.test(line.text)) {
        return storeName;
      }
    }
  }
  return null;
}

/**
 * 영수증 날짜 감지
 */
function detectDate(lines: OcrLine[]): string | null {
  for (const line of lines) {
    for (const pattern of DATE_PATTERNS) {
      const match = line.text.match(pattern);
      if (match) {
        const year = match[1].length === 2 ? `20${match[1]}` : match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }
  return null;
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * OCR 결과를 파싱하여 재료 항목 추출
 */
export function parseReceipt(lines: OcrLine[]): ParsedReceipt {
  const store = detectStore(lines);
  const date = detectDate(lines);
  const items: ReceiptItem[] = [];

  for (const line of lines) {
    if (!isItemLine(line.text)) continue;

    // 가격 추출
    const price = extractPrice(line.text);

    // 가격 부분을 제거한 상품명 추출
    let rawItemText = line.text;
    if (price !== null) {
      // 우측 가격 부분 제거
      rawItemText = rawItemText.replace(/\s*\d{1,3}(?:,\d{3})*\s*$/, '').trim();
    }

    // 수량 표기 제거 (예: "2 ", "x3" 등 앞쪽 수량)
    rawItemText = rawItemText.replace(/^\d+\s+/, '').trim();
    rawItemText = rawItemText.replace(/\s*[xX×]\s*\d+\s*$/, '').trim();

    if (!rawItemText) continue;

    // 상품명 정제
    const { name, quantity, unit } = cleanItemName(rawItemText);

    if (!name || name.length < 1) continue;

    // 비식재료 필터링
    if (isNonIngredient(name)) continue;

    items.push({
      rawText: line.text,
      itemName: name,
      quantity,
      unit,
      price,
    });
  }

  return { items, store, date };
}
