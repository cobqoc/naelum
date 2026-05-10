'use client';

import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useI18n } from '@/lib/i18n/context';

interface WriteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WriteModal({ isOpen, onClose }: WriteModalProps) {
  const router = useRouter();
  const { t } = useI18n();

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-background-secondary border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-base font-bold text-center">{t.writeModal.title}</h2>
        </div>
        <div className="p-3 space-y-2">
          <button
            onClick={() => handleSelect('/recipes/new')}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
          >
            <span className="text-3xl">🍳</span>
            <div>
              <p className="font-bold text-text-primary">{t.writeModal.recipeTitle}</p>
              <p className="text-xs text-text-muted mt-0.5">{t.writeModal.recipeSub}</p>
            </div>
          </button>
          <button
            onClick={() => handleSelect('/tip/new')}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
          >
            <span className="text-3xl">💡</span>
            <div>
              <p className="font-bold text-text-primary">{t.writeModal.tipTitle}</p>
              <p className="text-xs text-text-muted mt-0.5">{t.writeModal.tipSub}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
