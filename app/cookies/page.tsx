import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: '쿠키 정책 | 낼름 Naelum',
  description: '낼름이 사용하는 쿠키와 추적 기술에 대한 자세한 설명.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-dvh bg-background-primary text-text-primary">
      <Header />
      <div className="h-14 md:h-20" />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">쿠키 정책</h1>
          <p className="text-text-muted text-sm">최종 업데이트: 2026년 4월 21일</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. 쿠키란 무엇인가요?</h2>
          <p className="text-text-secondary leading-relaxed">
            쿠키(Cookie)는 웹사이트가 브라우저에 저장하는 작은 데이터 조각입니다.
            로그인 유지, 사용자 설정 기억, 서비스 개선을 위한 분석 등 다양한 용도로 사용됩니다.
            낼름은 사용자 프라이버시를 존중하며, GDPR·개인정보보호법 등 관련 법규를 준수합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. 낼름이 사용하는 쿠키 카테고리</h2>

          <div className="space-y-4">
            {/* Essential */}
            <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">필수 쿠키 (Essential)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-warm/20 text-accent-warm">항상 사용</span>
              </div>
              <p className="text-sm text-text-secondary mb-3">서비스 작동에 꼭 필요한 쿠키. 거부할 수 없습니다.</p>
              <table className="w-full text-xs">
                <thead className="text-text-muted">
                  <tr>
                    <th className="text-left py-1.5">쿠키명</th>
                    <th className="text-left py-1.5">목적</th>
                    <th className="text-left py-1.5">보관 기간</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-t border-white/5">
                    <td className="py-1.5 font-mono">sb-*-auth-token</td>
                    <td className="py-1.5">Supabase 인증 세션</td>
                    <td className="py-1.5">7일 (새로고침)</td>
                  </tr>
                  <tr className="border-t border-white/5">
                    <td className="py-1.5 font-mono">naelum_cookie_consent</td>
                    <td className="py-1.5">쿠키 동의 기록</td>
                    <td className="py-1.5">영구 (로컬)</td>
                  </tr>
                  <tr className="border-t border-white/5">
                    <td className="py-1.5 font-mono">naelum_theme</td>
                    <td className="py-1.5">다크/라이트 모드 기억</td>
                    <td className="py-1.5">영구 (로컬)</td>
                  </tr>
                  <tr className="border-t border-white/5">
                    <td className="py-1.5 font-mono">naelum_lang</td>
                    <td className="py-1.5">선택한 언어 기억</td>
                    <td className="py-1.5">영구 (로컬)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analytics */}
            <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">분석·에러 추적 쿠키 (Analytics)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-info/20 text-info">선택</span>
              </div>
              <p className="text-sm text-text-secondary mb-3">서비스 개선을 위한 오류 수집. 사용자가 거부하면 전송되지 않습니다.</p>
              <table className="w-full text-xs">
                <thead className="text-text-muted">
                  <tr>
                    <th className="text-left py-1.5">서비스</th>
                    <th className="text-left py-1.5">수집 내용</th>
                    <th className="text-left py-1.5">위치</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-t border-white/5">
                    <td className="py-1.5">Sentry</td>
                    <td className="py-1.5">JavaScript 에러, 성능 데이터, 세션 리플레이 (오류 시)</td>
                    <td className="py-1.5">미국 (Functional Software, Inc.)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Marketing */}
            <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">마케팅 쿠키 (Marketing)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-text-muted/20 text-text-muted">현재 미사용</span>
              </div>
              <p className="text-sm text-text-secondary">
                맞춤형 광고·리마케팅용 쿠키. <strong>현재 낼름은 마케팅 쿠키를 사용하지 않습니다.</strong>
                향후 도입 시 사용자에게 재동의를 구할 예정입니다.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. 동의 변경·철회</h2>
          <p className="text-text-secondary leading-relaxed">
            언제든지 쿠키 동의를 변경하거나 철회할 수 있습니다:
          </p>
          <ul className="list-disc ml-5 text-text-secondary space-y-1">
            <li><Link href="/settings" className="text-accent-warm underline">설정 페이지</Link>의 &ldquo;쿠키 및 추적 설정&rdquo; 섹션</li>
            <li>계정 탭에서 &ldquo;변경&rdquo; 버튼 → 카테고리별 선택 가능</li>
            <li>브라우저 설정에서 수동으로 쿠키 삭제 가능</li>
          </ul>
          <p className="text-xs text-text-muted">
            철회 시 이미 수집된 데이터에는 소급 적용되지 않으나, 이후 수집은 즉시 중단됩니다.
            이미 수집된 데이터 삭제를 원하시면 <Link href="/settings" className="underline">계정 삭제</Link>를 통해 모든 데이터를 제거할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. 제3자 쿠키</h2>
          <p className="text-text-secondary leading-relaxed">
            낼름은 아래 제3자 서비스의 쿠키를 사용합니다:
          </p>
          <ul className="list-disc ml-5 text-text-secondary space-y-1">
            <li><strong>Supabase</strong> (필수) — 인증·DB. 미국·싱가포르 등 리전</li>
            <li><strong>Vercel</strong> (필수) — 호스팅·CDN·DDoS 보호. 미국</li>
            <li><strong>Cloudflare</strong> (필수) — CDN·봇 차단. 전세계</li>
            <li><strong>Sentry</strong> (선택 — 동의 시) — 에러 추적. 미국</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. 문의</h2>
          <p className="text-text-secondary leading-relaxed">
            쿠키나 개인정보에 관한 문의는 <Link href="/settings" className="text-accent-warm underline">설정 페이지 &rarr; 개발자에게 문의</Link> 또는 개인정보처리방침의 연락처를 참고해주세요.
          </p>
        </section>

        <nav className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-accent-warm underline">개인정보처리방침</Link>
          <Link href="/terms" className="text-accent-warm underline">이용약관</Link>
          <Link href="/settings" className="text-accent-warm underline">설정으로 돌아가기</Link>
        </nav>
      </main>
    </div>
  );
}
