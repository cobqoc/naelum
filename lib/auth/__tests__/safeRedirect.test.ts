import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from '../safeRedirect';

const ORIGIN = 'https://naelum.app';

describe('safeRedirectPath — 로그인 후 redirect 같은 출처 경로만 허용 (AG2-48)', () => {
  it('정상 내부 경로는 입력 그대로 반환한다 (기존과 같은 위치로 이동)', () => {
    for (const p of [
      '/',
      '/ko/tip/new',
      '/recipes/new?x=1',
      '/ko/recipes/abc-123?tab=steps&y=2',
      '/admin/ingredients',
      '/ko/delivery/orders/42',
      '/ko/%EB%A0%88%EC%8B%9C%ED%94%BC',
      '/ko/recipes#steps',
    ]) {
      expect(safeRedirectPath(p, ORIGIN)).toBe(p);
    }
  });

  it('로컬 개발 출처(포트 포함)에서도 내부 경로는 그대로', () => {
    expect(safeRedirectPath('/ko/tip/new', 'http://localhost:3000')).toBe('/ko/tip/new');
  });

  it('값이 없으면 fallback', () => {
    expect(safeRedirectPath(null, ORIGIN)).toBe('/');
    expect(safeRedirectPath(undefined, ORIGIN)).toBe('/');
    expect(safeRedirectPath('', ORIGIN)).toBe('/');
  });

  it('프로토콜-상대 //evil.com 거부', () => {
    expect(safeRedirectPath('//evil.com', ORIGIN)).toBe('/');
    expect(safeRedirectPath('//evil.com/ko', ORIGIN)).toBe('/');
  });

  it('/\\evil.com (브라우저가 //evil.com 으로 해석) 거부', () => {
    expect(new URL('/\\evil.com', ORIGIN).origin).toBe('https://evil.com'); // 위험 근거
    expect(safeRedirectPath('/\\evil.com', ORIGIN)).toBe('/');
    expect(safeRedirectPath('/\\/evil.com', ORIGIN)).toBe('/');
  });

  it('탭·개행이 끼어 // 가 되는 변형도 거부 (URL 파서가 탭·개행을 지움)', () => {
    expect(safeRedirectPath('/\t/evil.com', ORIGIN)).toBe('/');
    expect(safeRedirectPath('/\n/evil.com', ORIGIN)).toBe('/');
    expect(safeRedirectPath('/\r\n\\evil.com', ORIGIN)).toBe('/');
  });

  it('절대 URL·다른 스킴 거부', () => {
    expect(safeRedirectPath('https://evil.com', ORIGIN)).toBe('/');
    expect(safeRedirectPath('http://naelum.app.evil.com/ko', ORIGIN)).toBe('/');
    expect(safeRedirectPath('javascript:alert(1)', ORIGIN)).toBe('/');
    expect(safeRedirectPath('JAVASCRIPT:alert(1)', ORIGIN)).toBe('/');
    expect(safeRedirectPath('data:text/html,<script>alert(1)</script>', ORIGIN)).toBe('/');
  });

  it('/ 로 시작하지 않는 값(상대경로·앞 공백) 거부', () => {
    expect(safeRedirectPath('ko/tip', ORIGIN)).toBe('/');
    expect(safeRedirectPath(' //evil.com', ORIGIN)).toBe('/');
    expect(safeRedirectPath('evil.com', ORIGIN)).toBe('/');
  });

  it('실제 흐름 — signin 쿼리(?redirect=)를 searchParams.get 으로 디코드한 값 (PAU-61: %09·%5C 우회)', () => {
    const fromQuery = (q: string) => new URL(`https://naelum.app/ko/signin?redirect=${q}`).searchParams.get('redirect');
    expect(fromQuery('/%09/evil.com')).toBe('/\t/evil.com');
    expect(safeRedirectPath(fromQuery('/%09/evil.com'), ORIGIN)).toBe('/');
    expect(safeRedirectPath(fromQuery('/%5Cevil.com'), ORIGIN)).toBe('/');
    expect(safeRedirectPath(fromQuery('/%2F%2Fevil.com'), ORIGIN)).toBe('/'); // 디코드 → //evil.com
    expect(safeRedirectPath(fromQuery('%2F%2Fevil.com'), ORIGIN)).toBe('/');
    // 정상 내부 경로(인코딩된 쿼리 포함)는 디코드 결과 그대로
    expect(safeRedirectPath(fromQuery('%2Fko%2Frecipes%2Fabc%3Fx%3D1'), ORIGIN)).toBe('/ko/recipes/abc?x=1');
    expect(safeRedirectPath(fromQuery('/ko/tip/new'), ORIGIN)).toBe('/ko/tip/new');
  });

  it('디코드되지 않은 퍼센트 문자열은 같은 출처 경로일 뿐이라 허용(브라우저도 경로로 취급)', () => {
    expect(safeRedirectPath('/%09/evil.com', ORIGIN)).toBe('/%09/evil.com');
    expect(new URL('/%09/evil.com', ORIGIN).origin).toBe(ORIGIN);
  });

  it('fallback 지정 가능', () => {
    expect(safeRedirectPath('//evil.com', ORIGIN, '/ko')).toBe('/ko');
  });
});
