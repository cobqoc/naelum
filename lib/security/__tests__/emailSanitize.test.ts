import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeEmailHeader } from '../sanitize';

describe('escapeHtml', () => {
  it('& < > " 를 엔티티로 바꾼다', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
  it('보통 이메일 주소는 그대로 둔다', () => {
    expect(escapeHtml('user.name+tag@example.co.kr')).toBe('user.name+tag@example.co.kr');
  });
  it('& 를 먼저 바꿔 이중 이스케이프하지 않는다', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('sanitizeEmailHeader', () => {
  it('개행·탭을 공백으로 바꿔 헤더 인젝션을 막는다', () => {
    expect(sanitizeEmailHeader('이름\r\nBcc: victim@example.com')).toBe('이름 Bcc: victim@example.com');
  });
  it('연속 공백을 하나로 접고 앞뒤를 자른다', () => {
    expect(sanitizeEmailHeader('  a \t\t b  ')).toBe('a b');
  });
  it('100자로 자른다', () => {
    expect(sanitizeEmailHeader('가'.repeat(150))).toHaveLength(100);
  });
});
