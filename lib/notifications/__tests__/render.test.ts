import { describe, it, expect } from 'vitest';
import { renderNotification } from '../render';
import { ko } from '@/lib/i18n/locales/ko';
import { en } from '@/lib/i18n/locales/en';

// 저장 문구(create.ts·send-expiry 가 만드는 한국어 완성문)와 ko 템플릿 렌더 결과가 같아야 한다 —
// 한국어 화면은 이번 변경 전과 똑같이 보인다.
describe('renderNotification', () => {
  const tk = ko.notifications;

  it('params 없는 옛 행은 저장 문구 그대로', () => {
    const n = { notification_type: 'comment', title: '새로운 댓글', message: '옛 문구' };
    expect(renderNotification(n, en.notifications)).toEqual({ title: '새로운 댓글', message: '옛 문구' });
  });

  it('모르는 종류·필수 값 누락이면 저장 문구', () => {
    expect(renderNotification({ notification_type: 'meal_time', title: 'a', message: 'b', params: { recipe: 'x' } }, tk))
      .toEqual({ title: 'a', message: 'b' });
    expect(renderNotification({ notification_type: 'rating', title: 'a', message: 'b', params: { recipe: 'x' } }, tk))
      .toEqual({ title: 'a', message: 'b' });
  });

  it('댓글·평가·낼름 — ko 는 저장 문구와 동일', () => {
    expect(renderNotification({ notification_type: 'comment', title: '', message: '', params: { actor: '민지', recipe: '김치찌개' } }, tk))
      .toEqual({ title: '새로운 댓글', message: '민지님이 "김치찌개" 레시피에 댓글을 남겼습니다' });
    expect(renderNotification({ notification_type: 'rating', title: '', message: '', params: { actor: '민지', recipe: '김치찌개', rating: 3 } }, tk))
      .toEqual({ title: '새로운 평가', message: '민지님이 "김치찌개"에 ⭐⭐⭐ 평가를 남겼습니다.' });
    expect(renderNotification({ notification_type: 'save', title: '', message: '', params: { actor: null, recipe: '김치찌개' } }, tk))
      .toEqual({ title: '레시피 낼름!', message: '누군가님이 "김치찌개"을(를) 낼름했습니다.' });
  });

  it('유통기한·추정 — ko 는 저장 문구와 동일', () => {
    expect(renderNotification({ notification_type: 'expiry', title: '', message: '', params: { ingredient: '두부', days: 0 } }, tk))
      .toEqual({ title: '⏰ 유통기한 임박: 두부', message: '두부의 유통기한이 오늘 만료됩니다.' });
    expect(renderNotification({ notification_type: 'expiry', title: '', message: '', params: { ingredient: '두부', days: 2 } }, tk))
      .toEqual({ title: '⏰ 유통기한 임박: 두부', message: '두부의 유통기한이 2일 후 만료됩니다. (D-2)' });
    expect(renderNotification({ notification_type: 'expiry_estimate', title: '', message: '', params: { ingredient: '두부', days: 1 } }, tk))
      .toEqual({ title: '🧊 보관기한 예상: 두부', message: '두부의 예상 보관기한이 내일쯤이에요. 상태를 확인해보세요. (예상)' });
  });

  it('비한국어 로케일은 번역 템플릿, 행위자 없으면 someone', () => {
    expect(renderNotification({ notification_type: 'save', title: '레시피 낼름!', message: 'x', params: { actor: null, recipe: 'Kimchi stew' } }, en.notifications))
      .toEqual({ title: 'Recipe saved!', message: 'Someone saved "Kimchi stew".' });
  });
});
