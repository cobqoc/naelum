'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TermsOfServicePage() {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch('/api/terms/accept?version=1.0')
      .then((r) => r.json())
      .then((d) => setAccepted(d.accepted ?? false))
      .catch(() => setAccepted(false));
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    const res = await fetch('/api/terms/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: '1.0' }),
    });
    if (res.ok) setAccepted(true);
    setAccepting(false);
  };

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
        {/* DRAFT Warning */}
        <div className="mb-8 p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <p className="text-warning font-bold">⚠️ 개발용 초안</p>
          <p className="text-text-secondary text-sm mt-1">
            이 문서는 AI가 생성한 초안입니다. 프로덕션 배포 전 반드시 변호사의 검토가 필요합니다.
          </p>
        </div>

        <h1 className="text-4xl font-bold text-text-primary mb-2">이용약관</h1>
        <p className="text-text-secondary mb-8">최종 수정일: 2026년 4월 21일</p>

        <div className="space-y-8 text-text-primary">
          {/* 제1조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제1조 (목적)</h2>
            <p className="text-text-secondary leading-relaxed">
              이 약관은 낼름(이하 &ldquo;회사&rdquo;)이 제공하는 레시피 공유 플랫폼 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제2조 (정의)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>&ldquo;서비스&rdquo;란 회사가 제공하는 낼름 레시피 공유 플랫폼을 의미합니다.</li>
                <li>&ldquo;이용자&rdquo;란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li>&ldquo;회원&rdquo;이란 회사와 서비스 이용계약을 체결하고 회원 아이디(ID)를 부여받은 자를 의미합니다.</li>
                <li>&ldquo;비회원&rdquo;이란 회원으로 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
                <li>&ldquo;레시피&rdquo;란 회원이 서비스를 통해 게시한 요리법, 사진, 동영상 등의 콘텐츠를 의미합니다.</li>
                <li>&ldquo;아이디(ID)&rdquo;란 회원 식별과 서비스 이용을 위해 회원이 선정하고 회사가 승인한 이메일 주소 또는 문자와 숫자의 조합을 의미합니다.</li>
              </ol>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제3조 (약관의 게시와 개정)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면 및 회원가입 화면에 게시합니다.</p>
              <p>② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
              <p>③ 회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 전부터 공지합니다.</p>
              <p>④ 회원이 개정약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다. 개정약관 공지 후 7일 이내에 거부의사를 표시하지 않으면 승인한 것으로 간주합니다.</p>
            </div>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제4조 (서비스의 제공)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>회사는 다음과 같은 서비스를 제공합니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>레시피 작성, 수정, 삭제 및 공유 서비스</li>
                <li>레시피 검색 및 추천 서비스</li>
                <li>보유 재료 기반 레시피 추천 서비스</li>
                <li>사용자 간 소셜 기능 (좋아요, 댓글 등)</li>
                <li>레시피 북마크 및 개인 컬렉션 관리</li>
                <li>기타 회사가 정하는 서비스</li>
              </ol>
            </div>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제5조 (회원가입)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
              <p>② 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                <li>만 16세 미만인 경우 (GDPR Art. 8, COPPA, 개인정보보호법 등 글로벌 기준)</li>
                <li>이전에 회원 자격을 상실한 적이 있는 경우 (단, 회사의 재가입 승낙을 얻은 경우 제외)</li>
              </ol>
              <p>③ 회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한 시점으로 합니다.</p>
            </div>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제6조 (회원 탈퇴 및 자격 상실)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회원은 언제든지 서비스 내 회원탈퇴 메뉴를 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</p>
              <p>② 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>가입 신청 시 허위 내용을 등록한 경우</li>
                <li>다른 사람의 서비스 이용을 방해하거나 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                <li>서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                <li>타인의 명예를 손상시키거나 불이익을 주는 행위를 한 경우</li>
                <li>부적절한 콘텐츠(욕설, 음란물, 혐오 표현 등)를 게시한 경우</li>
              </ol>
              <p>③ 회원 탈퇴 시 관련 법령 및 개인정보처리방침에 따라 회사가 회원정보를 보유하는 경우를 제외하고는 탈퇴 즉시 모든 데이터가 삭제됩니다.</p>
            </div>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제7조 (회원의 의무)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회원은 다음 행위를 하여서는 안 됩니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>신청 또는 변경 시 허위 내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                <li>타인의 레시피를 무단으로 복제하여 자신의 것으로 게시하는 행위</li>
              </ol>
              <p>② 회원은 관계법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 합니다.</p>
            </div>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제8조 (게시물의 저작권)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회원이 서비스 내에 게시한 레시피, 사진, 동영상 등의 콘텐츠(이하 &ldquo;게시물&rdquo;)의 저작권은 해당 게시물의 작성자에게 귀속됩니다.</p>
              <p>② 회원은 서비스에 게시물을 게시함으로써 회사에게 다음의 권리를 부여합니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>서비스 내에서 게시물을 사용, 편집, 복제, 수정, 공개 전송, 전시, 배포할 수 있는 라이선스</li>
                <li>서비스 홍보를 위해 게시물의 일부를 발췌하여 사용할 수 있는 권리</li>
                <li>검색 결과 및 추천 시스템에서 게시물을 노출할 수 있는 권리</li>
              </ol>
              <p>③ 회사는 회원의 게시물을 소중히 여기며, 서비스 제공 목적 이외의 상업적 용도로 사용하지 않습니다.</p>
              <p>④ 회원은 자신이 서비스에 게시한 게시물에 대한 책임을 지며, 타인의 저작권을 침해하는 게시물로 인해 발생하는 모든 법적 책임은 회원 본인에게 있습니다.</p>
            </div>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제9조 (게시물의 관리 및 신고 처리)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회원의 게시물이 정보통신망법 및 저작권법 등 관련법에 위반되는 내용을 포함하는 경우, 권리자는 관련법이 정한 절차에 따라 해당 게시물의 게시중단 및 삭제 등을 요청할 수 있으며, 회사는 관련법에 따라 조치를 취합니다.</p>
              <p>② 회사는 전항에 따른 권리자의 요청이 없는 경우라도 권리침해가 인정될 만한 사유가 있거나 기타 회사 정책 및 관련법에 위반되는 경우에는 관련법에 따라 해당 게시물에 대해 임시조치 등을 취할 수 있습니다.</p>
              <p>③ 이용자 신고 처리 기준 (EU Digital Services Act·정보통신망법 준수):</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>아동 성착취·폭력·긴급 위해 콘텐츠: <span className="font-medium text-text-primary">즉시 조치</span> (24시간 이내)</li>
                <li>스팸·욕설·혐오 표현: <span className="font-medium text-text-primary">영업일 기준 3일 이내</span></li>
                <li>저작권 침해 신고 (DMCA): <span className="font-medium text-text-primary">영업일 기준 3일 이내</span> (별도 <Link href="/copyright" className="text-accent-warm underline">저작권 정책</Link> 참고)</li>
                <li>기타 이용약관 위반: <span className="font-medium text-text-primary">영업일 기준 7일 이내</span></li>
              </ul>
              <p>④ 회사는 신고 접수 및 처리 결과를 신고자에게 이메일로 안내하며, 조치 대상 게시물의 작성자에게도 사유를 통지합니다.</p>
            </div>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제10조 (서비스 이용의 제한)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 다음 각 호의 경우 서비스 제공을 중지할 수 있습니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>서비스용 설비의 보수 등 공사로 인한 부득이한 경우</li>
                <li>전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지했을 경우</li>
                <li>국가비상사태, 정전, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 정상적인 서비스 제공이 불가능할 경우</li>
              </ol>
              <p>② 회사는 제1항의 경우 사전에 서비스 중지 사실과 사유를 공지합니다. 다만, 회사가 통제할 수 없는 사유로 인한 서비스 중단의 경우에는 사후에 통지할 수 있습니다.</p>
            </div>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제11조 (면책조항)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</p>
              <p>② 회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</p>
              <p>③ 회사는 회원이 서비스를 통해 얻은 정보 또는 자료의 신뢰도, 정확성 등에 대해서는 보증하지 않으며, 이로 인해 발생한 회원의 손해에 대하여 책임을 지지 않습니다.</p>
              <p>④ 회사는 회원이 게시 또는 전송한 자료의 내용에 대해서는 책임을 지지 않습니다.</p>
              <p>⑤ 레시피를 따라 요리한 결과에 대한 책임은 이용자 본인에게 있으며, 회사는 레시피 정보의 정확성이나 요리 결과에 대해 책임을 지지 않습니다.</p>
              <p>⑥ 회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 대해서는 개입할 의무가 없으며 이로 인한 손해를 배상할 책임도 없습니다.</p>
            </div>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제12조 (분쟁 해결)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</p>
              <p>② 회사와 이용자 간 발생한 분쟁은 전자문서 및 전자거래 기본법에 의해 설치된 전자문서·전자거래분쟁조정위원회의 조정 절차를 거칠 수 있습니다.</p>
              <p>③ 이 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.</p>
            </div>
          </section>

          {/* 부칙 */}
          <section className="pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-4">부칙</h2>
            <p className="text-text-secondary">이 약관은 2026년 2월 14일부터 시행되며, 2026년 4월 21일 개정되었습니다.</p>
            <p className="text-text-muted text-sm mt-2">개정 내용: 연령 기준 16세로 상향 (글로벌 준수), 콘텐츠 신고 처리 기한 명시 (DSA·정보통신망법), 서비스 기능 업데이트 반영.</p>
          </section>
        </div>

        {/* 약관 동의 섹션 */}
        {accepted !== null && (
          <div className="mt-10 p-6 rounded-xl bg-background-secondary border border-white/10">
            {accepted ? (
              <div className="flex items-center gap-3 text-success">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-semibold">이용약관에 동의하셨습니다.</p>
                  <p className="text-sm text-text-muted mt-0.5">동의 기록이 저장되어 있습니다.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-text-secondary text-sm">
                  위 이용약관을 읽고 동의하시면 아래 버튼을 눌러주세요.
                </p>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {accepting ? '처리 중...' : '이용약관에 동의합니다'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
          <Link
            href="/"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/privacy"
            className="text-accent-warm hover:text-accent-hover transition-colors"
          >
            개인정보처리방침 →
          </Link>
          <Link
            href="/copyright"
            className="text-accent-warm hover:text-accent-hover transition-colors"
          >
            저작권 정책 →
          </Link>
        </div>
      </main>
    </div>
  );
}
