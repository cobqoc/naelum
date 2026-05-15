import type { Metadata } from 'next';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import { createAdminClient } from '@/lib/supabase/server';
import Link from '@/components/Common/LocalizedLink';

// 토큰별 실시간 데이터 — 캐시 X
export const dynamic = 'force-dynamic';

interface ShareItem {
  id: string;
  ingredient_name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  recipe_title: string | null;
  is_checked: boolean;
  is_owned: boolean;
  note: string | null;
}

async function loadShare(token: string): Promise<{ ownerName: string; items: ShareItem[] } | null> {
  if (!token || token.length < 8 || token.length > 32) return null;
  const supabase = createAdminClient();

  const { data: share } = await supabase
    .from('shopping_list_shares')
    .select('owner_user_id, revoked_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!share || share.revoked_at) return null;
  if (share.expires_at && new Date(share.expires_at) <= new Date()) return null;

  const ownerId = share.owner_user_id;
  const [profileRes, itemsRes] = await Promise.all([
    supabase.from('profiles').select('username, full_name').eq('id', ownerId).maybeSingle(),
    supabase
      .from('shopping_list_items')
      .select('id, ingredient_name, category, quantity, unit, recipe_title, is_checked, is_owned, note')
      .eq('user_id', ownerId)
      .order('is_checked', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  void supabase
    .from('shopping_list_shares')
    .update({ last_viewed_at: new Date().toISOString() })
    .eq('token', token);

  return {
    ownerName: profileRes.data?.full_name || profileRes.data?.username || '낼름',
    items: (itemsRes.data ?? []) as ShareItem[],
  };
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  return {
    title: t.cart.shareMetaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function SharedCartPage({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}) {
  const { lang, token } = await params;
  const language: Language = SUPPORTED_LANGUAGES.includes(lang as Language)
    ? (lang as Language)
    : 'ko';
  const t = await loadLocale(language);
  const data = await loadShare(token);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-lg font-bold text-text-primary mb-2">{t.cart.shareExpiredTitle}</h1>
          <p className="text-sm text-text-secondary mb-6">{t.cart.shareExpiredDesc}</p>
          <Link
            href="/"
            className="inline-flex px-5 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover transition-colors"
          >
            {t.cart.shareGoHome}
          </Link>
        </div>
      </div>
    );
  }

  const { ownerName, items } = data;
  const checkedCount = items.filter(i => i.is_checked).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">🛒</span>
          <h1 className="text-lg font-bold text-text-primary">
            {t.cart.shareTitle.replace('{name}', ownerName)}
          </h1>
        </div>
        <p className="text-xs text-text-muted">{t.cart.shareReadOnly}</p>
      </div>

      {totalCount > 0 ? (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
              <span>
                {t.cart.checkedProgress
                  .replace('{checked}', String(checkedCount))
                  .replace('{total}', String(totalCount))}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-accent-warm transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="rounded-2xl bg-background-secondary border border-white/10 overflow-hidden divide-y divide-white/5">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${
                    item.is_checked ? 'bg-accent-warm' : 'border-2 border-white/25'
                  }`}
                >
                  {item.is_checked && (
                    <svg className="w-3 h-3 text-background-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm ${item.is_checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {item.ingredient_name}
                    </span>
                    {item.is_owned && !item.is_checked && (
                      <span className="text-[10px] text-info" aria-hidden="true">❄️</span>
                    )}
                  </div>
                  {(item.recipe_title || item.note) && (
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted">
                      {item.recipe_title && <span className="truncate">🍲 {item.recipe_title}</span>}
                      {item.note && <span className="truncate">📝 {item.note}</span>}
                    </div>
                  )}
                </div>
                {(item.quantity || item.unit) && (
                  <span className="text-xs text-text-muted flex-shrink-0">
                    {item.quantity ?? ''}{item.unit ?? ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-3" aria-hidden="true">🛒</div>
          <p className="text-sm text-text-muted">{t.cart.shareEmpty}</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs text-text-muted mb-2">{t.cart.shareFooterPrompt}</p>
        <Link
          href="/"
          className="inline-flex px-5 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          {t.cart.shareFooterCta}
        </Link>
      </div>
    </div>
  );
}
