'use client';

import { useState, useEffect } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useI18n } from '@/lib/i18n/context';

interface ExpiringIngredient {
  id: string;
  ingredient_name: string;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  expiry_date: string;
  days_until_expiry: number;
  storage_location?: string | null;
}

export default function ExpiringIngredientsAlert() {
  const { t } = useI18n();
  const [expiringIngredients, setExpiringIngredients] = useState<ExpiringIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchExpiringIngredients();
  }, []);

  const fetchExpiringIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients/expiring?days=7');
      const data = await response.json();
      setExpiringIngredients(data.expiring || []);
    } catch (error) {
      console.error('Error fetching expiring ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || expiringIngredients.length === 0 || dismissed) {
    return null;
  }

  // 긴급도별 분류
  const critical = expiringIngredients.filter(i => i.days_until_expiry <= 3);
  const warning = expiringIngredients.filter(i => i.days_until_expiry > 3 && i.days_until_expiry <= 7);

  return (
    <div className="mb-8 animate-fadeIn">
      <div className={`rounded-2xl border-2 transition-all ${
        critical.length > 0
          ? 'border-error bg-error/5'
          : 'border-warning bg-warning/5'
      }`}>
        {/* 알림 헤더 */}
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-text-primary">
                  {critical.length > 0 ? t.ingredient.expiringUrgent : t.ingredient.expiringCaution} {t.ingredient.expiringSoonItems}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {critical.length > 0 && (
                    <span className="text-error font-medium">
                      {t.ingredient.expiringCount3d.replace('{count}', String(critical.length))}
                    </span>
                  )}
                  {critical.length > 0 && warning.length > 0 && ', '}
                  {warning.length > 0 && (
                    <span className="text-warning font-medium">
                      {t.ingredient.expiringCount7d.replace('{count}', String(warning.length))}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDismissed(true);
                }}
                className="text-text-muted hover:text-error transition-colors p-2"
                title={t.common.close}
              >
                ✕
              </button>
              <span className="text-text-muted text-sm">
                {expanded ? '▲' : '▼'}
              </span>
            </div>
          </div>
        </div>

        {/* 확장된 상세 목록 */}
        {expanded && (
          <div className="border-t border-current/10 p-4 space-y-3">
            {critical.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-error mb-2">{t.ingredient.expiringUrgentSection}</h4>
                <div className="space-y-2">
                  {critical.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-background-secondary"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-text-primary">
                          {ingredient.ingredient_name}
                        </div>
                        <div className="text-sm text-text-muted mt-1">
                          {ingredient.quantity && ingredient.unit && `${ingredient.quantity}${ingredient.unit} • `}
                          {ingredient.days_until_expiry === 0 ? t.ingredient.expiringToday : `D-${ingredient.days_until_expiry}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-full bg-error/20 text-error font-bold">
                          {ingredient.days_until_expiry === 0 ? t.ingredient.expiringTodayShort : `D-${ingredient.days_until_expiry}`}
                        </span>
                        <Link
                          href={`/search?q=${encodeURIComponent(ingredient.ingredient_name)}`}
                          className="text-xs px-2.5 py-1 rounded-full bg-accent-warm/15 text-accent-warm hover:bg-accent-warm/25 font-semibold transition-colors whitespace-nowrap"
                          onClick={e => e.stopPropagation()}
                        >
                          {t.ingredient.recipeArrow}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {warning.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-warning mb-2">{t.ingredient.expiringCautionSection}</h4>
                <div className="space-y-2">
                  {warning.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-background-secondary"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-text-primary">
                          {ingredient.ingredient_name}
                        </div>
                        <div className="text-sm text-text-muted mt-1">
                          {ingredient.quantity && ingredient.unit && `${ingredient.quantity}${ingredient.unit} • `}
                          D-{ingredient.days_until_expiry}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning font-bold">
                          D-{ingredient.days_until_expiry}
                        </span>
                        <Link
                          href={`/search?q=${encodeURIComponent(ingredient.ingredient_name)}`}
                          className="text-xs px-2.5 py-1 rounded-full bg-accent-warm/15 text-accent-warm hover:bg-accent-warm/25 font-semibold transition-colors whitespace-nowrap"
                          onClick={e => e.stopPropagation()}
                        >
                          {t.ingredient.recipeArrow}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
