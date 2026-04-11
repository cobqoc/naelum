import Link from 'next/link';

export default function CopyrightPolicyPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-primary/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-accent-warm hover:text-accent-hover transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-text-primary mb-2">저작권 정책</h1>
        <p className="text-text-secondary mb-8">최종 수정일: 2026년 4월 8일</p>

        <div className="space-y-8 text-text-primary">
          {/* 머리말 */}
          <section>
            <p className="text-text-secondary leading-relaxed">
              낼름(이하 &ldquo;서비스&rdquo;)은 타인의 저작권을 존중합니다. 이 페이지는 서비스가 외부 콘텐츠를
              수집·활용하는 방식과 저작권자의 권리 행사 방법을 안내합니다.
            </p>
          </section>

          {/* 제1조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제1조 (콘텐츠 수집 원칙)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>서비스는 공개된 YouTube 영상에서 요리 레시피 정보를 수집합니다. 수집 과정에서 다음 원칙을 준수합니다:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <span className="font-medium text-text-primary">사실 정보만 추출</span> — 재료명·분량·조리 순서 등 사실에 해당하는 정보만 사용합니다.
                  요리법(레시피)은 저작권 보호 대상이 아닙니다.
                </li>
                <li>
                  <span className="font-medium text-text-primary">표현 전면 재작성</span> — 유튜버의 문장·말투·독창적 표현은 저작권 보호 대상입니다.
                  내용(사실 정보)은 유지하되, 모든 텍스트를 서비스 문체로 완전히 새로 작성합니다.
                  동의어 교체나 어순 변경 수준은 허용하지 않습니다.
                </li>
                <li>
                  <span className="font-medium text-text-primary">원본 출처 표시</span> — 모든 레시피에 원본 YouTube 영상 URL을 링크로 유지합니다.
                </li>
                <li>
                  <span className="font-medium text-text-primary">공개 영상만 대상</span> — 비공개 또는 멤버십 전용 영상은 수집하지 않습니다.
                </li>
              </ul>
            </div>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제2조 (저작권자 권리 존중)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>서비스는 콘텐츠 제작자의 권리를 최우선으로 존중합니다:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>저작권자의 삭제·비공개 요청에 대해 <span className="font-medium text-text-primary">영업일 기준 3일 이내</span>에 처리합니다.</li>
                <li>요청이 확인된 즉시 해당 레시피를 비공개 처리하고, 검토 후 삭제 또는 수정합니다.</li>
                <li>정당한 요청이라고 판단되면 별도의 소명 없이 신속하게 조치합니다.</li>
              </ul>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제3조 (DMCA 저작권 침해 신고)</h2>
            <div className="text-text-secondary leading-relaxed space-y-4">
              <p>
                본인의 저작권을 침해하는 콘텐츠를 발견하셨다면 아래 이메일로 신고해 주세요.
                미국 디지털 밀레니엄 저작권법(DMCA) 및 국내 저작권법에 따라 처리합니다.
              </p>

              {/* 신고 채널 */}
              <div className="p-5 bg-accent-warm/10 border border-accent-warm/30 rounded-xl">
                <p className="font-bold text-text-primary text-lg mb-1">저작권 신고 이메일</p>
                <a
                  href="mailto:copyright@naelum.app"
                  className="text-accent-warm hover:text-accent-hover text-xl font-mono transition-colors"
                >
                  copyright@naelum.app
                </a>
                <p className="text-text-muted text-sm mt-2">처리 기한: 영업일 기준 3일 이내</p>
              </div>

              {/* 신고 시 포함할 정보 */}
              <div>
                <p className="font-semibold text-text-primary mb-3">신고 이메일에 포함할 정보</p>
                <ol className="list-decimal list-inside ml-4 space-y-2">
                  <li>
                    <span className="font-medium text-text-primary">원본 콘텐츠 URL</span>
                    <p className="ml-5 text-sm mt-1">저작권을 보유하고 있는 원본 YouTube 영상 주소</p>
                  </li>
                  <li>
                    <span className="font-medium text-text-primary">낼름 레시피 URL</span>
                    <p className="ml-5 text-sm mt-1">침해가 의심되는 낼름 레시피 페이지 주소</p>
                  </li>
                  <li>
                    <span className="font-medium text-text-primary">저작권자 정보</span>
                    <p className="ml-5 text-sm mt-1">성명(또는 채널명), 연락처(이메일)</p>
                  </li>
                  <li>
                    <span className="font-medium text-text-primary">침해 내용 설명</span>
                    <p className="ml-5 text-sm mt-1">어떤 표현·내용이 침해되었는지 구체적으로 기술</p>
                  </li>
                  <li>
                    <span className="font-medium text-text-primary">진술 사항</span>
                    <p className="ml-5 text-sm mt-1">
                      &ldquo;본인은 위 신고 내용이 사실이며, 저작권자 또는 저작권자를 대리할 권한이 있음을 확인합니다.&rdquo;
                    </p>
                  </li>
                </ol>
              </div>

              {/* 처리 절차 */}
              <div>
                <p className="font-semibold text-text-primary mb-3">처리 절차</p>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-7 h-7 bg-accent-warm/20 text-accent-warm rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <p className="font-medium text-text-primary">신고 접수 확인</p>
                      <p className="text-sm text-text-muted">이메일 수신 즉시 접수 확인 메일을 발송합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-7 h-7 bg-accent-warm/20 text-accent-warm rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <p className="font-medium text-text-primary">즉시 비공개 처리</p>
                      <p className="text-sm text-text-muted">검토 기간 중 해당 레시피를 비공개로 전환합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-7 h-7 bg-accent-warm/20 text-accent-warm rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <p className="font-medium text-text-primary">내용 검토 (영업일 3일 이내)</p>
                      <p className="text-sm text-text-muted">신고 내용을 검토하여 삭제 또는 수정 여부를 결정합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-7 h-7 bg-accent-warm/20 text-accent-warm rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <div>
                      <p className="font-medium text-text-primary">처리 결과 안내</p>
                      <p className="text-sm text-text-muted">신고자에게 처리 결과를 이메일로 안내합니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제4조 (사용자 업로드 콘텐츠)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>이용자가 직접 작성·업로드한 레시피, 사진 등의 저작권은 작성자에게 있습니다. 서비스는 다음의 목적으로만 해당 콘텐츠를 사용합니다:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>서비스 내 레시피 표시 및 공유</li>
                <li>검색 및 추천 시스템 운영</li>
                <li>서비스 홍보 (사전 동의 시)</li>
              </ul>
              <p>타인의 레시피·사진을 무단으로 복제하거나 저작권을 침해하는 행위는 이용약관에 의해 금지되며, 이로 인한 법적 책임은 해당 이용자에게 있습니다.</p>
            </div>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제5조 (일반 문의)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>저작권 외 일반 문의 사항은 아래로 연락해 주세요:</p>
              <div className="p-4 bg-background-secondary rounded-xl">
                <p className="font-semibold text-text-primary mb-1">고객 지원</p>
                <a
                  href="mailto:support@naelum.app"
                  className="text-accent-warm hover:text-accent-hover font-mono transition-colors"
                >
                  support@naelum.app
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between">
          <Link
            href="/privacy"
            className="text-accent-warm hover:text-accent-hover transition-colors"
          >
            ← 개인정보처리방침
          </Link>
          <Link
            href="/"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
