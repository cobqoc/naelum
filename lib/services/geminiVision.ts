/**
 * Gemini Vision — 영수증·재료 사진 자동 인식
 *
 * 기존 Naver CLOVA OCR + receiptParser 파이프라인을 Gemini 단일 호출로 교체.
 * Gemini는 이미지 → 구조화 JSON을 한 번에 반환 (OCR + 파싱).
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);

async function callGemini(imageBuffer: Buffer, mimeType: string, prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error('지원하지 않는 이미지 형식입니다.');
  }

  const base64 = imageBuffer.toString('base64');
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 오류 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini 응답이 비어있습니다.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini 응답 JSON 파싱 실패');
  }
}

// ── 영수증 스캔 ──────────────────────────────────────────────────────────────

export interface ParsedReceiptItem {
  rawText: string;
  itemName: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
}

export interface ParsedReceipt {
  store: string | null;
  date: string | null;
  items: ParsedReceiptItem[];
}

const RECEIPT_PROMPT = `한국 식료품점·마트 영수증 사진입니다. 아래 JSON 스키마 그대로 반환하세요.

{
  "store": "매장명 (예: 이마트, 홈플러스, 쿠팡). 없으면 null",
  "date": "구매일 YYYY-MM-DD 형식. 없으면 null",
  "items": [
    {
      "rawText": "영수증에 적힌 원본 라인 텍스트",
      "itemName": "정제된 상품명 (한국어, 접두어·카테고리 코드 제거)",
      "quantity": 수량 숫자 또는 null,
      "unit": "g, kg, ml, L, 개, 팩 등 단위 문자열 또는 null",
      "price": 가격 숫자(원) 또는 null
    }
  ]
}

규칙:
- 합계, 할인, 부가세, 포인트, 카드승인, 결제수단 등 **영수증 결제 정보 라인은 items에서 완전히 제외**.
- 상품명만 items에 포함. 의심스러우면 제외.
- 수량·단위가 상품명에 포함된 경우(예: "양파 500g") quantity=500, unit="g"로 분리.
- price는 단가가 아니라 해당 항목의 실제 결제액.
- JSON 외의 텍스트는 절대 출력하지 마세요.`;

export async function recognizeReceipt(imageBuffer: Buffer, mimeType: string): Promise<ParsedReceipt> {
  const raw = await callGemini(imageBuffer, mimeType, RECEIPT_PROMPT);
  if (!raw || typeof raw !== 'object') {
    throw new Error('Gemini 응답 형식 오류');
  }
  const obj = raw as Record<string, unknown>;

  const store = typeof obj.store === 'string' ? obj.store : null;
  const date = typeof obj.date === 'string' ? obj.date : null;
  const items: ParsedReceiptItem[] = Array.isArray(obj.items)
    ? obj.items
        .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
        .map((it) => ({
          rawText: typeof it.rawText === 'string' ? it.rawText : (typeof it.itemName === 'string' ? it.itemName : ''),
          itemName: typeof it.itemName === 'string' ? it.itemName.trim() : '',
          quantity: typeof it.quantity === 'number' ? it.quantity : null,
          unit: typeof it.unit === 'string' && it.unit.trim() ? it.unit.trim() : null,
          price: typeof it.price === 'number' ? it.price : null,
        }))
        .filter((it) => it.itemName.length > 0)
    : [];

  return { store, date, items };
}

// ── 재료 사진 인식 ───────────────────────────────────────────────────────────

export interface RecognizedIngredient {
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  confidence: number;
}

// IngredientForm의 CATEGORIES id와 동일한 집합. 프롬프트·파싱 양쪽에 사용.
const CATEGORY_IDS = ['veggie', 'meat', 'seafood', 'grain', 'dairy', 'seasoning', 'condiment', 'fruit', 'other'] as const;

const INGREDIENT_PROMPT = `사진 속 식재료를 식별해 JSON으로 반환하세요.

{
  "items": [
    {
      "name": "한국어 식재료명 (예: 양파, 닭가슴살, 우유, 계란)",
      "category": "${CATEGORY_IDS.join('|')} 중 정확히 하나",
      "quantity": 개수 또는 양 (숫자, 정확히 셀 수 있을 때만, 아니면 null),
      "unit": "개|g|kg|ml|L|팩|봉 등 (quantity 있을 때만, 아니면 null)",
      "confidence": 0.0~1.0 확신도
    }
  ]
}

규칙:
- **요리 재료로 쓸 수 있는 것만** 포함. 완성된 조리 음식(예: 김치찌개 그릇), 포장 로고, 조미료 용기 글자만 읽은 경우 등은 제외.
- category는 반드시 목록 중 하나. veggie=채소, meat=육류, seafood=해산물, grain=곡물, dairy=유제품·계란, seasoning=양념·소스, condiment=조미료, fruit=과일, other=기타
- 확신 낮으면 confidence 0.5 미만으로. 너무 낮으면(<0.3) 아예 제외.
- 같은 재료 여러 개 있어도 **하나의 아이템으로 합치고 quantity로 표현**.
- JSON 외 텍스트 출력 금지.`;

export async function recognizeIngredients(imageBuffer: Buffer, mimeType: string): Promise<RecognizedIngredient[]> {
  const raw = await callGemini(imageBuffer, mimeType, INGREDIENT_PROMPT);
  if (!raw || typeof raw !== 'object') {
    throw new Error('Gemini 응답 형식 오류');
  }
  const obj = raw as Record<string, unknown>;
  const items = Array.isArray(obj.items) ? obj.items : [];

  const validCategories = new Set<string>(CATEGORY_IDS);

  return items
    .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
    .map((it) => {
      const name = typeof it.name === 'string' ? it.name.trim() : '';
      const rawCategory = typeof it.category === 'string' ? it.category.trim() : '';
      const category = validCategories.has(rawCategory) ? rawCategory : 'other';
      const quantity = typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : null;
      const unit = typeof it.unit === 'string' && it.unit.trim() ? it.unit.trim() : null;
      const confidenceRaw = typeof it.confidence === 'number' ? it.confidence : 0.5;
      const confidence = Math.max(0, Math.min(1, confidenceRaw));
      return { name, category, quantity, unit, confidence };
    })
    .filter((it) => it.name.length > 0 && it.confidence >= 0.3);
}
