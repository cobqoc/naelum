'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendScrap: (settings: { requestUrl: string }) => void;
      };
    };
  }
}

interface ShareButtonProps {
  recipeId: string;
  title: string;
  description?: string;
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="5" fill="#FEE500"/>
      <path d="M10 4.5C6.96 4.5 4.5 6.48 4.5 8.93c0 1.57 1.01 2.96 2.54 3.76l-.56 2.04 2.39-1.28A7.2 7.2 0 0010 13.36c3.04 0 5.5-1.98 5.5-4.43S13.04 4.5 10 4.5z" fill="#3C1E1E"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="5" fill="#25D366"/>
      <path d="M10 3.5C6.41 3.5 3.5 6.41 3.5 10c0 1.15.3 2.24.82 3.18L3.5 16.5l3.38-.82A6.49 6.49 0 0010 16.5c3.59 0 6.5-2.91 6.5-6.5S13.59 3.5 10 3.5zm3.23 8.93c-.14.38-.8.73-1.1.77-.3.04-1.45-.07-2.76-.9-1.12-.7-1.93-1.86-1.99-1.94-.06-.08-.52-.7-.52-1.32 0-.63.31-.94.43-1.07.12-.13.27-.16.36-.16h.29c.09 0 .22-.04.33.26.12.3.43 1.07.47 1.15.04.08.07.18.01.28-.06.1-.09.16-.18.26-.09.1-.19.21-.27.28-.08.07-.18.14-.07.3.1.15.47.77 1.02 1.24.7.62 1.29.81 1.47.9.18.08.28.07.38-.04.1-.12.44-.52.56-.7.12-.18.24-.15.4-.09.17.06 1.07.5 1.25.6.18.09.3.13.34.21.04.08.04.45-.1.83z" fill="white"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="5" fill="#000"/>
      <path d="M11.02 9.09L14.9 4.5h-.87l-3.17 3.69L8.06 4.5H5l4.08 5.94L5 15.5h.87l3.57-4.15 2.85 4.15H15l-3.98-6.41zm-1.12 1.56l-.41-.59-3.28-4.69H7.6l2.65 3.79.41.59 3.44 4.92H12.7L9.9 10.65z" fill="white"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="5" fill="#1877F2"/>
      <path d="M12.78 10.5h-1.9v6.5h-2.7v-6.5H6.8V8.1h1.38V6.73C8.18 5.07 9.1 4 11.07 4h1.93v2.4h-1.2c-.72 0-.87.27-.87.78V8.1H13l-.22 2.4z" fill="white"/>
    </svg>
  );
}

function LineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="5" fill="#00B900"/>
      <path d="M16.5 9.3C16.5 6.39 13.59 4 10 4S3.5 6.39 3.5 9.3c0 2.62 2.32 4.82 5.46 5.23.21.05.5.14.57.32.06.16.04.42.02.58l-.09.55c-.03.16-.12.64.57.35.7-.3 3.75-2.21 5.12-3.78.86-.93 1.35-1.97 1.35-3.25z" fill="white"/>
      <path d="M8.5 8H7.97a.14.14 0 00-.14.14v2.72c0 .08.06.14.14.14h.53c.08 0 .14-.06.14-.14V8.14A.14.14 0 008.5 8zm3.83 0h-.53a.14.14 0 00-.14.14v1.62L10.4 8.1A.14.14 0 0010.27 8h-.53a.14.14 0 00-.14.14v2.72c0 .08.06.14.14.14h.53c.08 0 .14-.06.14-.14V9.24l1.27 1.67a.14.14 0 00.11.05h.53c.08 0 .14-.06.14-.14V8.14A.14.14 0 0012.33 8zM7.3 8H6.77a.14.14 0 00-.14.14v2.72c0 .08.06.14.14.14h1.8c.08 0 .14-.06.14-.14v-.53a.14.14 0 00-.14-.14H7.44V8.14A.14.14 0 007.3 8zm5.87.53v-.53A.14.14 0 0013.03 8h-1.8a.14.14 0 00-.14.14v2.72c0 .08.06.14.14.14h1.8c.08 0 .14-.06.14-.14v-.53a.14.14 0 00-.14-.14h-1.13v-.44h1.13c.08 0 .14-.06.14-.14v-.53a.14.14 0 00-.14-.14h-1.13v-.44h1.13c.08 0 .14-.06.14-.14z" fill="#00B900"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ig-grad" x1="2" y1="18" x2="18" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFDC80"/>
          <stop offset="0.4" stopColor="#F77737"/>
          <stop offset="0.7" stopColor="#E1306C"/>
          <stop offset="1" stopColor="#833AB4"/>
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="5" fill="url(#ig-grad)"/>
      <rect x="4.5" y="4.5" width="11" height="11" rx="2.5" stroke="white" strokeWidth="1.3" fill="none"/>
      <circle cx="10" cy="10" r="2.6" stroke="white" strokeWidth="1.3" fill="none"/>
      <circle cx="14.2" cy="5.8" r="0.9" fill="white"/>
    </svg>
  );
}

function CopyLinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="5" fill="#4a4a5a"/>
      <path d="M8 12.5a2.5 2.5 0 010-5h1m3 5h-1a2.5 2.5 0 010-5m-3 2.5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

export default function ShareButton({ recipeId, title, description }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const recipeUrl = `${baseUrl}/recipes/${recipeId}`;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(recipeUrl);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      toast.success(t.share.linkCopied);
    } catch {
      toast.error(t.share.copyFailed);
    }
    setIsOpen(false);
  };

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      toast.success(t.share.linkCopied);
    } catch {
      toast.error(t.share.copyFailed);
    }
    setIsOpen(false);
  };

  const handleKakaoShare = () => {
    if (!window.Kakao?.isInitialized()) {
      toast.error('카카오 앱 키가 설정되지 않았습니다.');
      return;
    }
    window.Kakao.Share.sendScrap({ requestUrl: recipeUrl });
    setIsOpen(false);
  };

  const handleNativeShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ title, text: description, url: recipeUrl });
      } catch {
        // user cancelled
      }
      setIsOpen(false);
      return true;
    }
    return false;
  };

  const handleShare = async () => {
    const isMobile = typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && 'share' in navigator) {
      await handleNativeShare();
    } else {
      setIsOpen(!isOpen);
    }
  };

  const linkItems = [
    {
      name: t.share.whatsapp,
      icon: <WhatsAppIcon />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: <XIcon />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'LINE',
      icon: <LineIcon />,
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
    },
  ];

  return (
    <>
      {KAKAO_KEY && (
        <Script
          src="https://developers.kakao.com/sdk/js/kakao.js"
          onLoad={() => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
              window.Kakao.init(KAKAO_KEY);
            }
          }}
        />
      )}

      <div className="relative" ref={menuRef}>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl bg-background-secondary px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-white/10 transition-colors"
          aria-label={t.share.shareRecipe}
        >
          <span>🔗</span>
          <span>{t.share.share}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-background-secondary border border-white/10 shadow-xl z-50 overflow-hidden animate-[slideIn_0.2s_ease-out]">
            {/* 카카오톡 (SDK 키가 있을 때만 표시) */}
            {KAKAO_KEY && (
              <button
                onClick={handleKakaoShare}
                className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-white/5 transition-colors w-full"
              >
                <KakaoIcon />
                <span>{t.share.kakao}</span>
              </button>
            )}

            {/* 외부 링크 공유 */}
            {linkItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-white/5 transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}

            {/* 인스타그램 (링크 복사) */}
            <button
              onClick={handleInstagramShare}
              className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-white/5 transition-colors w-full border-t border-white/5"
            >
              <InstagramIcon />
              <span>{t.share.instagram} ({t.share.copyLink})</span>
            </button>

            {/* 링크 복사 */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-white/5 transition-colors w-full border-t border-white/5"
            >
              <CopyLinkIcon />
              <span>{t.share.copyLink}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
