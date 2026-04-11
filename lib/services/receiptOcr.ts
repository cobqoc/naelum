/**
 * 영수증 OCR 서비스 추상화
 *
 * Naver CLOVA OCR (기본) / Claude Vision API (추후 전환) 지원
 * 환경변수 OCR_PROVIDER로 provider 선택
 */

export interface OcrLine {
  text: string;
  confidence: number;
}

export interface OcrResult {
  rawText: string;
  lines: OcrLine[];
  provider: string;
}

interface OcrProvider {
  recognize(imageBuffer: Buffer, mimeType: string): Promise<OcrResult>;
}

/**
 * Naver CLOVA General OCR
 * https://api.ncloud-docs.com/docs/ai-application-service-ocr
 */
class NaverClovaOcr implements OcrProvider {
  private apiUrl: string;
  private secretKey: string;

  constructor() {
    const apiUrl = process.env.NAVER_CLOVA_OCR_API_URL;
    const secretKey = process.env.NAVER_CLOVA_OCR_SECRET;

    if (!apiUrl || !secretKey) {
      throw new Error(
        'NAVER_CLOVA_OCR_API_URL과 NAVER_CLOVA_OCR_SECRET 환경변수가 필요합니다.'
      );
    }

    this.apiUrl = apiUrl;
    this.secretKey = secretKey;
  }

  async recognize(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    const format = mimeType === 'image/png' ? 'png' : 'jpg';
    const base64Image = imageBuffer.toString('base64');

    const requestBody = {
      version: 'V2',
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      lang: 'ko',
      images: [
        {
          format,
          data: base64Image,
          name: 'receipt',
        },
      ],
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': this.secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CLOVA OCR 요청 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.images?.[0]?.fields) {
      throw new Error('OCR 결과가 비어있습니다.');
    }

    const fields = data.images[0].fields as Array<{
      inferText: string;
      inferConfidence: number;
      lineBreak?: boolean;
    }>;

    // 필드들을 라인 단위로 그룹핑
    const lines: OcrLine[] = [];
    let currentLine = '';
    let minConfidence = 1;

    for (const field of fields) {
      currentLine += (currentLine ? ' ' : '') + field.inferText;
      minConfidence = Math.min(minConfidence, field.inferConfidence);

      if (field.lineBreak) {
        lines.push({
          text: currentLine.trim(),
          confidence: minConfidence,
        });
        currentLine = '';
        minConfidence = 1;
      }
    }

    // 마지막 라인 처리
    if (currentLine.trim()) {
      lines.push({
        text: currentLine.trim(),
        confidence: minConfidence,
      });
    }

    const rawText = lines.map((l) => l.text).join('\n');

    return { rawText, lines, provider: 'clova' };
  }
}

/**
 * Claude Vision OCR — placeholder, not yet implemented.
 * Activate by setting OCR_PROVIDER=claude and installing @anthropic-ai/sdk.
 */
class ClaudeOcr implements OcrProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recognize(_imageBuffer: Buffer, _mimeType: string): Promise<OcrResult> {
    throw new Error('Claude OCR이 구현되지 않았습니다. OCR_PROVIDER=clova를 사용하세요.');
  }
}

/**
 * OCR provider 팩토리
 * 환경변수 OCR_PROVIDER에 따라 적절한 provider 반환
 */
export function createOcrProvider(): OcrProvider {
  const provider = process.env.OCR_PROVIDER || 'clova';

  switch (provider) {
    case 'clova':
      return new NaverClovaOcr();
    case 'claude':
      return new ClaudeOcr();
    default:
      throw new Error(`지원하지 않는 OCR provider: ${provider}`);
  }
}
