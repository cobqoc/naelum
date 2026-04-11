import Link from "next/link";

export default function Footer() {
  return (
    <footer className="hidden md:block py-12 text-center text-text-muted border-t border-white/5">
      <p>&copy; 2026 낼름 (Naelum) Team. All rights reserved.</p>
      <div className="flex justify-center gap-6 mt-3 text-sm">
        <Link href="/terms" className="hover:text-text-secondary transition-colors">이용약관</Link>
        <Link href="/privacy" className="hover:text-text-secondary transition-colors">개인정보처리방침</Link>
        <Link href="/copyright" className="hover:text-text-secondary transition-colors">저작권 정책</Link>
      </div>
    </footer>
  );
}
