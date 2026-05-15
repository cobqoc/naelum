'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

interface RestaurantSnapshot {
  id: string;
  name: string;
  is_open: boolean;
  is_active: boolean;
}

interface Props {
  lang: string;
  restaurant: RestaurantSnapshot | null;
  userEmail: string;
  children: React.ReactNode;
}

export default function MerchantLayoutClient({ lang, restaurant, userEmail, children }: Props) {
  const { t } = useI18n();
  const pathname = usePathname();

  const navItems = [
    { key: 'dashboard', label: t.merchant.navDashboard, icon: '📊', href: `/${lang}/merchant` },
    { key: 'restaurant', label: t.merchant.navRestaurant, icon: '🏪', href: `/${lang}/merchant/restaurant` },
    { key: 'menu', label: t.merchant.navMenu, icon: '📋', href: `/${lang}/merchant/menu` },
    { key: 'orders', label: t.merchant.navOrders, icon: '🛵', href: `/${lang}/merchant/orders` },
  ];

  const onOnboarding = pathname?.includes('/merchant/onboarding');

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <header className="fixed top-0 z-50 w-full bg-background-secondary/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${lang}`} className="text-lg font-bold text-accent-warm">
              낼름
            </Link>
            <span className="px-2 py-1 text-xs font-bold rounded bg-info text-white">
              🏪 MERCHANT
            </span>
            {restaurant && (
              <span className="hidden md:inline text-sm text-text-muted ml-2">
                {restaurant.name}
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    restaurant.is_open ? 'bg-success/20 text-success' : 'bg-text-muted/20 text-text-muted'
                  }`}
                >
                  {restaurant.is_open ? t.merchant.isOpen : t.merchant.isClosed}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-text-muted">{userEmail}</span>
            <Link
              href={`/${lang}`}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              메인
            </Link>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar — onboarding 페이지에선 숨김 */}
        {!onOnboarding && restaurant && (
          <aside className="hidden md:block fixed left-0 top-16 w-56 h-[calc(100vh-4rem)] bg-background-secondary border-r border-white/10 overflow-y-auto">
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-accent-warm text-background-primary font-bold'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        )}

        <main className={`flex-1 p-4 md:p-6 ${!onOnboarding && restaurant ? 'md:ml-56' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
