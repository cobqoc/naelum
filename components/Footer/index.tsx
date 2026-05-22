'use client';

import Link from '@/components/Common/LocalizedLink';
import { useI18n } from '@/lib/i18n/context';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="hidden md:block py-12 text-center text-text-muted border-t border-white/5">
      <p>{t.footer.copyright}</p>
      <div className="flex justify-center gap-6 mt-3 text-sm">
        <Link href="/terms" className="hover:text-text-secondary transition-colors">{t.meta.termsTitle}</Link>
        <Link href="/privacy" className="hover:text-text-secondary transition-colors">{t.meta.privacyTitle}</Link>
        <Link href="/cookies" className="hover:text-text-secondary transition-colors">{t.meta.cookiesTitle}</Link>
        <Link href="/copyright" className="hover:text-text-secondary transition-colors">{t.meta.copyrightTitle}</Link>
      </div>
    </footer>
  );
}
