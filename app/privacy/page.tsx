import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold text-text-primary mb-2">개인정보처리방침</h1>
        <p className="text-text-secondary mb-8">최종 수정일: 2026년 4월 25일</p>

        <div className="space-y-8 text-text-primary">
          {/* 머리말 */}
          <section>
            <p className="text-text-secondary leading-relaxed">
              낼름(이하 &ldquo;회사&rdquo;)은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등
              관련 법령을 준수하고 있습니다. 회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
              개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>
          </section>

          {/* 제1조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제1조 (개인정보의 수집 항목 및 방법)</h2>
            <div className="text-text-secondary leading-relaxed space-y-4">
              <div>
                <p className="font-semibold text-text-primary mb-2">1. 수집하는 개인정보 항목</p>
                <p className="mb-2">회사는 회원가입, 서비스 제공을 위해 다음과 같은 개인정보를 수집하고 있습니다:</p>

                <div className="ml-4 space-y-3">
                  <div>
                    <p className="font-medium text-text-primary">가. 필수 항목</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>이메일 주소</li>
                      <li>비밀번호 (암호화 저장, 소셜 로그인 제외)</li>
                      <li>닉네임</li>
                      <li>생년월일 (GDPR Art. 8·COPPA·개인정보보호법에 따른 만 16세 이상 연령 검증용)</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-text-primary">나. 선택 항목</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>프로필 사진</li>
                      <li>성별</li>
                      <li>관심 요리 카테고리</li>
                      <li>식단 선호도 (채식주의, 비건 등)</li>
                      <li>알레르기 정보 (민감정보 — 별도 고지 참조)</li>
                      <li>마케팅 수신 동의 여부</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-text-primary">다. 소셜 로그인 시 수집 항목 (Google)</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>이메일 주소</li>
                      <li>이름</li>
                      <li>프로필 사진</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-text-primary">라. 서비스 이용 과정에서 자동 수집되는 정보</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>접속 IP 주소</li>
                      <li>쿠키</li>
                      <li>서비스 이용 기록</li>
                      <li>방문 일시</li>
                      <li>기기 정보 (브라우저 종류, OS 등)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-text-primary mb-2">2. 개인정보 수집 방법</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
                  <li>소셜 로그인 (Google OAuth 2.0) 연동</li>
                  <li>쿠키를 통한 자동 수집</li>
                  <li>서비스 이용 중 자동 생성 및 수집</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:</p>

              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium text-text-primary">1. 회원 관리</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>회원제 서비스 이용에 따른 본인확인, 개인 식별</li>
                    <li>부정 이용 방지 및 비인가 사용 방지</li>
                    <li>가입 의사 확인, 연령 확인</li>
                    <li>고지사항 전달</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-text-primary">2. 서비스 제공</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>레시피 작성, 저장, 공유 기능 제공</li>
                    <li>개인 맞춤형 레시피 추천</li>
                    <li>보유 재료 기반 레시피 제안</li>
                    <li>식단 선호도 기반 콘텐츠 필터링</li>
                    <li>사용자 간 소셜 기능 제공 (좋아요, 댓글 등)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-text-primary">3. 서비스 개선 및 신규 서비스 개발</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>서비스 이용 통계 및 분석</li>
                    <li>AI 추천 시스템 개선</li>
                    <li>신규 서비스 개발 및 마케팅</li>
                    <li>이벤트 정보 및 참여 기회 제공</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 이용자로부터 개인정보를 수집 시 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              <p>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>

              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium text-text-primary">1. 회원 가입 및 관리</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>보유 기간: 회원 탈퇴 시까지</li>
                    <li>다만, 다음의 경우에는 해당 기간 종료 시까지 보유합니다:</li>
                  </ul>
                  <ul className="list-disc list-inside ml-8 text-sm">
                    <li>관련 법령 위반에 따른 수사·조사 등이 진행중인 경우: 해당 수사·조사 종료 시까지</li>
                    <li>서비스 이용에 따른 채권·채무관계 잔존 시: 해당 채권·채무관계 정산 시까지</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-text-primary">2. 관련 법령에 의한 정보보유</p>
                  <p className="text-sm">상법, 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 관련 법령에서 정한 일정한 기간 동안 개인정보를 보관합니다:</p>
                  <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                    <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                    <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                    <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                    <li>표시·광고에 관한 기록: 6개월 (전자상거래법)</li>
                    <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제4조 (개인정보의 제3자 제공)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 원칙적으로 이용자의 개인정보를 제1조(개인정보의 수집 및 이용 목적)에서 명시한 범위 내에서만 처리하며, 이용자의 사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.</p>
              <p>② 다만, 다음의 경우에는 예외로 합니다:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </div>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제5조 (개인정보 처리의 위탁)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 서비스 향상을 위해서 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다:</p>

              <div className="ml-4 overflow-x-auto">
                <table className="w-full border border-white/10 text-sm">
                  <thead className="bg-background-secondary">
                    <tr>
                      <th className="border border-white/10 px-4 py-2 text-left">수탁업체</th>
                      <th className="border border-white/10 px-4 py-2 text-left">위탁업무 내용</th>
                      <th className="border border-white/10 px-4 py-2 text-left">위치·이전</th>
                      <th className="border border-white/10 px-4 py-2 text-left">보유 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Supabase, Inc.</td>
                      <td className="border border-white/10 px-4 py-2">DB·인증·파일 저장 호스팅</td>
                      <td className="border border-white/10 px-4 py-2">미국 (SCC 적용)</td>
                      <td className="border border-white/10 px-4 py-2">회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
                    </tr>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Vercel, Inc.</td>
                      <td className="border border-white/10 px-4 py-2">웹 애플리케이션 호스팅·CDN·서버리스 함수</td>
                      <td className="border border-white/10 px-4 py-2">미국 (SCC·EU-US DPF)</td>
                      <td className="border border-white/10 px-4 py-2">위탁계약 종료 시까지 (접속 로그: 30일)</td>
                    </tr>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Cloudflare, Inc.</td>
                      <td className="border border-white/10 px-4 py-2">CDN, DDoS·봇 차단, SSL/TLS 처리</td>
                      <td className="border border-white/10 px-4 py-2">전세계 엣지 (SCC 적용)</td>
                      <td className="border border-white/10 px-4 py-2">위탁계약 종료 시까지 (로그: 24시간 이내)</td>
                    </tr>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Functional Software, Inc. (Sentry)</td>
                      <td className="border border-white/10 px-4 py-2">에러·성능 추적 (사용자 동의 시에만)</td>
                      <td className="border border-white/10 px-4 py-2">미국 (SCC·EU-US DPF)</td>
                      <td className="border border-white/10 px-4 py-2">90일</td>
                    </tr>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Resend, Inc.</td>
                      <td className="border border-white/10 px-4 py-2">트랜잭션 이메일 발송 (이메일 인증, 알림)</td>
                      <td className="border border-white/10 px-4 py-2">미국 (SCC 적용)</td>
                      <td className="border border-white/10 px-4 py-2">발송 후 30일</td>
                    </tr>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Google LLC</td>
                      <td className="border border-white/10 px-4 py-2">소셜 로그인 (OAuth 2.0) 인증</td>
                      <td className="border border-white/10 px-4 py-2">미국 (SCC·EU-US DPF)</td>
                      <td className="border border-white/10 px-4 py-2">회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm">② 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.</p>
            </div>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제6조 (이용자의 권리와 그 행사 방법)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 이용자는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>개인정보 열람 요구</li>
                <li>개인정보에 오류가 있을 경우 정정 요구</li>
                <li>개인정보 삭제 요구</li>
                <li>개인정보 처리 정지 요구</li>
              </ul>
              <p>② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
              <p>③ 이용자가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
              <p>④ 제1항에 따른 권리 행사는 이용자의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 개인정보 보호법 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.</p>
            </div>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제7조 (개인정보의 파기)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
              <p>② 이용자로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</p>
              <p>③ 개인정보 파기의 절차 및 방법은 다음과 같습니다:</p>

              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium text-text-primary">1. 파기 절차</p>
                  <p>이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</p>
                </div>

                <div>
                  <p className="font-medium text-text-primary">2. 파기 방법</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>전자적 파일 형태의 정보: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
                    <li>종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제8조 (개인정보의 안전성 확보 조치)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                <li>비밀번호 암호화: 이용자의 비밀번호는 일방향 암호화하여 저장 및 관리되고 있습니다</li>
                <li>해킹 등에 대비한 기술적 대책: 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하고 있습니다</li>
              </ul>
            </div>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제9조 (쿠키의 운영)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 &lsquo;쿠키(cookie)&rsquo;를 사용합니다.</p>
              <p>② 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.</p>

              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium text-text-primary">1. 쿠키의 사용 목적</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>이용자의 접속 빈도나 방문 시간 등을 분석</li>
                    <li>이용자의 취향과 관심분야를 파악</li>
                    <li>각종 이벤트 참여 정도 및 방문 횟수 파악</li>
                    <li>개인 맞춤 서비스 제공</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-text-primary">2. 쿠키의 설치·운영 및 거부</p>
                  <p>이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.</p>
                  <p className="text-sm mt-2">※ 쿠키 설정 거부 방법 (Internet Explorer 기준)</p>
                  <p className="text-sm ml-4">웹 브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</p>
                  <p className="text-sm mt-2">※ 단, 쿠키 설치를 거부하였을 경우 로그인이 필요한 일부 서비스 이용이 어려울 수 있습니다.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제10조 (개인정보 보호책임자)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>

              <div className="ml-4 p-4 bg-background-secondary rounded-xl">
                <p className="font-semibold text-text-primary">개인정보 보호책임자</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>성명: 낼름 운영팀</li>
                  <li>직책: 개인정보 보호책임자</li>
                  <li>이메일: <a href="mailto:hello@naelum.app" className="text-accent-warm underline">hello@naelum.app</a></li>
                </ul>
                <p className="text-xs text-text-muted mt-3">※ 이메일로 문의 시 영업일 기준 7일 이내에 답변 드립니다 (긴급 보안 사고는 24시간 이내).</p>
              </div>

              <p>② 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.</p>
            </div>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제11조 (권익침해 구제 방법)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다. 이 밖에 기타 개인정보침해의 신고, 상담에 대하여는 아래의 기관에 문의하시기 바랍니다:</p>

              <div className="ml-4 space-y-3">
                <div className="p-3 bg-background-secondary rounded-lg">
                  <p className="font-medium text-text-primary">1. 개인정보분쟁조정위원회</p>
                  <p className="text-sm">전화: (국번없이) 1833-6972</p>
                  <p className="text-sm">홈페이지: www.kopico.go.kr</p>
                </div>

                <div className="p-3 bg-background-secondary rounded-lg">
                  <p className="font-medium text-text-primary">2. 개인정보침해신고센터</p>
                  <p className="text-sm">전화: (국번없이) 118</p>
                  <p className="text-sm">홈페이지: privacy.kisa.or.kr</p>
                </div>

                <div className="p-3 bg-background-secondary rounded-lg">
                  <p className="font-medium text-text-primary">3. 대검찰청 사이버수사과</p>
                  <p className="text-sm">전화: (국번없이) 1301</p>
                  <p className="text-sm">홈페이지: www.spo.go.kr</p>
                </div>

                <div className="p-3 bg-background-secondary rounded-lg">
                  <p className="font-medium text-text-primary">4. 경찰청 사이버안전국</p>
                  <p className="text-sm">전화: (국번없이) 182</p>
                  <p className="text-sm">홈페이지: cyberbureau.police.go.kr</p>
                </div>
              </div>
            </div>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제12조 (개인정보 처리방침 변경)</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <p>① 이 개인정보처리방침은 2026년 2월 14일부터 적용되며, 아래와 같이 개정되었습니다.</p>
              <p>② 개정 이력:</p>
              <ul className="list-disc list-inside ml-4 text-sm">
                <li>2026-02-14: 최초 작성</li>
                <li>2026-04-21: 연령 기준 16세로 상향, 수탁업체 전면 공개 (Vercel·Cloudflare·Sentry·Resend 추가), 민감정보(알레르기) 처리 별도 고지, 생년월일 필수 항목 이동, 개인정보 보호책임자 연락처 업데이트</li>
              </ul>
            </div>
          </section>

          {/* 추가 고지 */}
          <section className="pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-4">추가 고지사항</h2>
            <div className="text-text-secondary leading-relaxed space-y-4">
              <div>
                <p className="font-semibold text-text-primary mb-2">민감정보(알레르기 정보) 처리에 관한 고지</p>
                <p>
                  이용자가 입력하는 알레르기 정보는 <strong>건강에 관한 민감정보</strong>(개인정보보호법 제23조, GDPR Art. 9 &ldquo;특별 범주 개인정보&rdquo;)에 해당합니다.
                  회사는 해당 정보를 다음 원칙에 따라 처리합니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2 text-sm">
                  <li><strong>수집 근거</strong>: 이용자의 <strong>명시적 동의</strong> (GDPR Art. 9(2)(a))</li>
                  <li><strong>수집 목적</strong>: 알레르기 유발 재료가 포함된 레시피 경고 표시 (이용자 안전)</li>
                  <li><strong>수집 방법</strong>: 이용자가 설정 페이지에서 직접 입력 (선택 사항, 기본값 없음)</li>
                  <li><strong>공유 범위</strong>: 외부 제3자에게 제공되지 않으며, AI 학습·마케팅 등 다른 목적에 사용되지 않습니다</li>
                  <li><strong>철회 방법</strong>: 설정 페이지에서 언제든지 삭제·수정 가능하며, 계정 삭제 시 즉시 제거됩니다</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-text-primary mb-2">AI 학습 데이터 사용에 관한 안내</p>
                <p>회사는 서비스 개선 및 AI 추천 시스템 고도화를 위해 이용자의 레시피 열람 패턴, 검색 기록, 재료 선호도 등을 익명화하여 분석할 수 있습니다. 다만, 개인을 식별할 수 있는 정보 및 민감정보(알레르기 등)는 학습 데이터에 포함되지 않으며, 이용자는 언제든지 설정 페이지에서 데이터 수집을 거부할 수 있습니다.</p>
              </div>

              <div>
                <p className="font-semibold text-text-primary mb-2">사용자 제작 콘텐츠(레시피)에 관한 안내</p>
                <p>이용자가 작성한 레시피, 사진, 동영상 등의 저작권은 작성자에게 있으며, 회사는 서비스 제공 목적으로만 해당 콘텐츠를 사용합니다. 타인의 레시피를 무단 복제하거나 저작권을 침해하는 행위는 금지되며, 이로 인한 법적 책임은 작성자 본인에게 있습니다.</p>
              </div>

              <div>
                <p className="font-semibold text-text-primary mb-2">개인정보 유출 통보 절차 (GDPR Art. 33·34, 정보통신망법 제27조의3)</p>
                <p>회사는 개인정보 유출 사실을 인지한 경우 다음 절차에 따라 조치합니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2 text-sm">
                  <li>인지 후 <strong>72시간 이내</strong> 감독기관(EU의 경우 관할 DPA, 한국의 경우 개인정보보호위원회)에 통보</li>
                  <li>고위험 유출의 경우 영향 받은 이용자에게 <strong>즉시</strong> 이메일·서비스 내 공지를 통해 통보</li>
                  <li>유출 항목, 시점, 피해 최소화 조치, 문의 연락처를 함께 안내</li>
                </ul>
              </div>
            </div>
          </section>

          {/* GDPR 섹션 — EU·국제 사용자 전용 */}
          <section>
            <h2 className="text-2xl font-bold mb-4">제13조 (EU 거주자의 GDPR 권리)</h2>
            <div className="text-text-secondary leading-relaxed space-y-4">
              <p>
                EU(유럽연합) 거주자 및 EEA(유럽경제지역) 사용자는 일반 데이터 보호 규정(General Data Protection Regulation, GDPR)에 따라 다음 권리를 보유합니다:
              </p>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">1. 정보 접근권 (Right of Access)</p>
                <p>보유 중인 귀하의 개인정보 사본을 요청할 수 있습니다.</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">2. 정정권 (Right to Rectification)</p>
                <p>부정확하거나 불완전한 개인정보의 정정을 요청할 수 있습니다. 대부분의 정보는 설정 페이지에서 직접 수정 가능합니다.</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">3. 삭제권 (Right to Erasure / &ldquo;Right to be Forgotten&rdquo;)</p>
                <p>특정 조건 하에 개인정보 삭제를 요청할 수 있습니다. 계정 삭제 시 모든 개인 데이터가 영구적으로 제거됩니다.</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">4. 처리 제한권 (Right to Restriction of Processing)</p>
                <p>개인정보 처리의 일시 중단을 요청할 수 있습니다.</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">5. 데이터 이동권 (Right to Data Portability)</p>
                <p>귀하의 개인정보를 구조화된 기계 판독 가능한 형식으로 받아 다른 서비스로 이전할 수 있습니다. 요청 시 JSON·CSV 형식으로 제공합니다.</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">6. 반대권 (Right to Object)</p>
                <p>특정 유형의 개인정보 처리(예: 직접 마케팅)에 반대할 수 있습니다.</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">7. 동의 철회권 (Right to Withdraw Consent)</p>
                <p>
                  쿠키·분석 도구 사용에 대한 동의를 언제든 철회할 수 있습니다.
                  <Link href="/settings" className="text-accent-warm underline ml-1">설정 페이지</Link>의
                  &ldquo;쿠키 및 추적 설정&rdquo;에서 변경 가능합니다.
                  자세한 내용은 <Link href="/cookies" className="text-accent-warm underline">쿠키 정책</Link>을 참고하세요.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary">8. 감독 기관에 대한 민원권 (Right to Lodge a Complaint)</p>
                <p>
                  개인정보 처리가 GDPR에 위반된다고 판단될 경우, 귀하가 거주하는 EU 회원국의
                  데이터 보호 감독 기관에 민원을 제기할 권리가 있습니다.
                  예: 독일 BfDI, 프랑스 CNIL, 이탈리아 Garante 등.
                </p>
              </div>

              <p className="mt-4 p-3 rounded-lg bg-background-secondary">
                <strong>권리 행사 방법:</strong> 위 권리를 행사하려면
                <Link href="/settings" className="text-accent-warm underline mx-1">설정 페이지 → 개발자에게 문의</Link>
                를 통해 요청해주세요. 요청 접수 후 30일 이내에 응답해 드립니다.
              </p>

              <p>
                <strong>처리의 법적 근거:</strong>
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li><strong>계약 이행 (GDPR Art. 6(1)(b))</strong> — 회원가입·로그인·서비스 제공</li>
                <li><strong>동의 (GDPR Art. 6(1)(a))</strong> — 분석·마케팅 쿠키, 선택 항목 수집</li>
                <li><strong>정당한 이익 (GDPR Art. 6(1)(f))</strong> — 보안·사기 방지, 서비스 개선</li>
                <li><strong>법적 의무 (GDPR Art. 6(1)(c))</strong> — 법령상 보존 의무가 있는 경우</li>
              </ul>

              <p>
                <strong>국제 데이터 이전:</strong>
                낼름은 Supabase(미국·싱가포르 등), Vercel(미국), Cloudflare(전세계), Sentry(미국) 등 EEA 외부 서비스를 사용합니다.
                이러한 이전은 EU 표준계약조항(SCC, Standard Contractual Clauses) 또는 각 업체의 개인정보보호 프레임워크(예: Vercel·Sentry의 EU-US Data Privacy Framework 준수)에 따라 적절한 보호 장치와 함께 이루어집니다.
              </p>

              <p>
                <strong>보관 기간:</strong>
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>계정 데이터: 계정 삭제 시까지 (삭제 시 90일 이내 완전 제거)</li>
                <li>에러 로그 (Sentry): 90일</li>
                <li>서비스 로그: 6개월 (법적 요구사항 따라)</li>
                <li>쿠키 동의 기록: 동의 변경 시점까지 (감사 기록으로 5년 보관)</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
          <Link
            href="/terms"
            className="text-accent-warm hover:text-accent-hover transition-colors"
          >
            ← 이용약관
          </Link>
          <div className="flex gap-4">
            <Link
              href="/cookies"
              className="text-accent-warm hover:text-accent-hover transition-colors"
            >
              쿠키 정책
            </Link>
            <Link
              href="/copyright"
              className="text-accent-warm hover:text-accent-hover transition-colors"
            >
              저작권 정책 →
            </Link>
          </div>
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
