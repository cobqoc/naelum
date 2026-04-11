'use client';

import { useRouter } from 'next/navigation';

interface WriteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WriteModal({ isOpen, onClose }: WriteModalProps) {
  const router = useRouter();

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
          <h2 className="text-base font-bold text-center">무엇을 작성할까요?</h2>
        </div>
        <div className="p-3 space-y-2">
          <button
            onClick={() => handleSelect('/recipes/new')}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
          >
            <span className="text-3xl">🍳</span>
            <div>
              <p className="font-bold text-text-primary">레시피 작성</p>
              <p className="text-xs text-text-muted mt-0.5">재료와 단계별 조리법을 공유해보세요</p>
            </div>
          </button>
          <button
            onClick={() => handleSelect('/tip/new')}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
          >
            <span className="text-3xl">💡</span>
            <div>
              <p className="font-bold text-text-primary">팁 작성</p>
              <p className="text-xs text-text-muted mt-0.5">요리 팁과 기술을 단계별로 알려주세요</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
