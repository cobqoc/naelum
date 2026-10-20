import type { TranslationKeys } from '@/lib/i18n/translations';

// 앱 내 알림 표시 문구를 사용자 언어로 만든다 (2026-10-20 ICL-40).
// notifications 행은 한국어 완성문 title·message 를 그대로 저장하고(KMP 앱·GDPR 내보내기·옛 행 호환),
// 2026-10-20 이후 행은 params(jsonb)도 함께 저장한다. params 가 있고 종류를 알면 번역 템플릿으로,
// 아니면(옛 행·모르는 종류·필수 값 누락) 저장된 문구를 그대로 쓴다.

export interface NotificationParams {
  actor?: string | null;
  recipe?: string;
  rating?: number;
  ingredient?: string;
  days?: number;
}

export interface RenderableNotification {
  notification_type: string;
  title: string;
  message: string;
  params?: NotificationParams | null;
}

type NotificationTexts = TranslationKeys['notifications'];

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function renderNotification(
  n: RenderableNotification,
  tn: NotificationTexts,
): { title: string; message: string } {
  const stored = { title: n.title, message: n.message };
  const p = n.params;
  if (!p) return stored;

  const actor = p.actor || tn.someone;
  switch (n.notification_type) {
    case 'comment':
      if (!p.recipe) return stored;
      return {
        title: tn.commentTitle,
        message: fill(tn.commentMessage, { actor, recipe: p.recipe }),
      };
    case 'rating':
      if (!p.recipe || typeof p.rating !== 'number') return stored;
      return {
        title: tn.ratingTitle,
        message: fill(tn.ratingMessage, { actor, recipe: p.recipe, stars: '⭐'.repeat(p.rating) }),
      };
    case 'save':
      if (!p.recipe) return stored;
      return {
        title: tn.saveTitle,
        message: fill(tn.saveMessage, { actor, recipe: p.recipe }),
      };
    case 'expiry':
      if (!p.ingredient || typeof p.days !== 'number') return stored;
      return {
        title: fill(tn.expiryTitle, { ingredient: p.ingredient }),
        message: p.days === 0
          ? fill(tn.expiryTodayMessage, { ingredient: p.ingredient })
          : fill(tn.expiryDaysMessage, { ingredient: p.ingredient, days: p.days }),
      };
    case 'expiry_estimate':
      if (!p.ingredient || typeof p.days !== 'number') return stored;
      return {
        title: fill(tn.estimateTitle, { ingredient: p.ingredient }),
        message: fill(p.days === 0 ? tn.estimateTodayMessage : tn.estimateTomorrowMessage, {
          ingredient: p.ingredient,
        }),
      };
    default:
      return stored;
  }
}
