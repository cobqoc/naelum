'use client';

import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FridgeIngredient {
  id: string;
  ingredient_name: string;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  expiry_date?: string | null;
  storage_location?: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const CATEGORY_ICONS: Record<string, string> = {
  veggie: '🥬', meat: '🥩', seafood: '🐟', grain: '🌾',
  dairy: '🧀', seasoning: '🧂', fruit: '🍎', other: '📦',
};

export const SECTION_CONFIG = {
  냉장: {
    bg: 'linear-gradient(180deg, rgba(244,249,255,0.95) 0%, rgba(226,240,252,0.95) 100%)',
    headerColor: '#4a7a9a',
    subColor: '#7aa8c0',
    dividerBg: 'linear-gradient(180deg, #8ab4d4 0%, #6a94b4 100%)',
    dividerShadow: '0 4px 10px rgba(0,0,0,0.3)',
    pillCls: 'bg-sky-100/80 text-sky-800 ring-1 ring-sky-200/50',
    emptyText: '#7aa8c0',
  },
  냉동: {
    bg: 'linear-gradient(180deg, rgba(141,189,224,0.85) 0%, rgba(106,158,200,0.85) 100%)',
    headerColor: '#1a3a6a',
    subColor: 'rgba(42,90,154,0.7)',
    dividerBg: 'linear-gradient(180deg, rgba(70,120,170,0.90) 0%, rgba(50,90,140,0.90) 100%)',
    dividerShadow: '0 4px 10px rgba(0,0,0,0.4)',
    pillCls: 'bg-white/35 text-[#1a3a5a] ring-1 ring-white/25',
    emptyText: 'rgba(255,255,255,0.4)',
  },
  상온: {
    bg: 'linear-gradient(180deg, rgba(255,245,220,0.95) 0%, rgba(250,232,195,0.95) 100%)',
    headerColor: '#92600a',
    subColor: 'rgba(180,120,30,0.7)',
    dividerBg: 'linear-gradient(180deg, #c8944a 0%, #9a7035 100%)',
    dividerShadow: '0 4px 10px rgba(0,0,0,0.3)',
    pillCls: 'bg-amber-100/80 text-amber-800 ring-1 ring-amber-200/50',
    emptyText: 'rgba(180,120,30,0.45)',
  },
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

export function getExpiryInfo(expiryDate: string | null | undefined) {
  if (!expiryDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate); expiry.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: '만료', level: 'critical' as const };
  if (days === 0) return { text: 'D-Day', level: 'critical' as const };
  if (days <= 3) return { text: `D-${days}`, level: 'critical' as const };
  if (days <= 7) return { text: `D-${days}`, level: 'warning' as const };
  return null;
}

// ── IngredientPill ─────────────────────────────────────────────────────────

export function IngredientPill({
  item,
  pillCls,
  onDelete,
}: {
  item: FridgeIngredient;
  pillCls: string;
  onDelete?: (id: string) => void;
}) {
  const icon = CATEGORY_ICONS[item.category] || '📦';
  const expiry = getExpiryInfo(item.expiry_date);

  return (
    <span
      className={`group relative inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
        expiry?.level === 'critical'
          ? 'bg-red-100/90 text-red-700 ring-1 ring-red-300/60'
          : expiry?.level === 'warning'
          ? 'bg-orange-100/90 text-orange-700 ring-1 ring-orange-300/60'
          : pillCls
      }`}
    >
      <span>{icon}</span>
      <span className="truncate max-w-[56px]">{item.ingredient_name}</span>
      {expiry && <span className="text-[9px] font-bold">{expiry.text}</span>}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="opacity-0 group-hover:opacity-100 -mr-1 ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-black/20 hover:bg-red-500/80 text-[9px] text-white transition-all flex-shrink-0"
          aria-label="삭제"
        >
          ✕
        </button>
      )}
    </span>
  );
}

// ── ShelfSection ───────────────────────────────────────────────────────────

const MAX_ITEMS = 8;

export function ShelfSection({
  sectionKey,
  label,
  icon,
  items,
  isLast = false,
  onDelete,
}: {
  sectionKey: keyof typeof SECTION_CONFIG;
  label: string;
  icon: string;
  items: FridgeIngredient[];
  isLast?: boolean;
  onDelete?: (id: string) => void;
}) {
  const cfg = SECTION_CONFIG[sectionKey];
  const visible = items.slice(0, MAX_ITEMS);
  const overflow = items.length - MAX_ITEMS;

  return (
    <>
      <div style={{ background: cfg.bg }}>
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-bold" style={{ color: cfg.headerColor }}>{label}</span>
          <span className="text-[10px]" style={{ color: cfg.subColor }}>({items.length})</span>
        </div>
        <div className="px-3 pt-1 pb-3 min-h-[52px] flex flex-wrap gap-1.5 items-center">
          {visible.length > 0 ? (
            <>
              {visible.map(item => (
                <IngredientPill key={item.id} item={item} pillCls={cfg.pillCls} onDelete={onDelete} />
              ))}
              {overflow > 0 && (
                <span
                  className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-medium"
                  style={{ color: cfg.headerColor, background: 'rgba(0,0,0,0.06)' }}
                >
                  +{overflow}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] italic" style={{ color: cfg.emptyText }}>
              비어있음
            </span>
          )}
        </div>
      </div>
      {!isLast && (
        <div className="h-2.5" style={{
          background: cfg.dividerBg,
          boxShadow: cfg.dividerShadow,
        }} />
      )}
    </>
  );
}

// ── Layout Wrappers ────────────────────────────────────────────────────────

export function FridgeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
      {children}
    </div>
  );
}

export function FridgeHeader({ title, manageHref }: { title: string; manageHref?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-[#1c2a3a]">
      <h3 className="text-sm font-bold text-sky-100">{title}</h3>
      {manageHref && (
        <Link href={manageHref} className="text-[10px] text-accent-warm hover:text-accent-hover transition-colors">
          관리하기 &gt;
        </Link>
      )}
    </div>
  );
}

export function FridgeFooter({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <div className="px-3 py-3 bg-[#1c2a3a]">
      <Link
        href={href}
        onClick={onClick}
        className="block w-full py-2.5 rounded-xl bg-accent-warm text-background-primary text-xs font-bold text-center hover:bg-accent-hover transition-colors"
      >
        {label}
      </Link>
    </div>
  );
}
