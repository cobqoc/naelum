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
        {/* DRAFT Warning */}
        <div className="mb-8 p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <p className="text-warning font-bold">⚠️ 개발용 초안</p>
          <p className="text-text-secondary text-sm mt-1">
            이 문서는 AI가 생성한 초안입니다. 프로덕션 배포 전 반드시 변호사의 검토가 필요합니다.
          </p>
        </div>

        <h1 className="text-4xl font-bold text-text-primary mb-2">개인정보처리방침</h1>
        <p className="text-text-secondary mb-8">최종 수정일: 2026년 2월 14일</p>

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
                      <li>비밀번호 (암호화 저장)</li>
                      <li>닉네임</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-text-primary">나. 선택 항목</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>프로필 사진</li>
                      <li>생년월일</li>
                      <li>성별</li>
                      <li>관심 요리 카테고리</li>
                      <li>식단 선호도 (채식주의, 비건 등)</li>
                      <li>알레르기 정보</li>
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
                    <li>사용자 간 소셜 기능 제공 (팔로우, 댓글 등)</li>
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

              <div className="ml-4">
                <table className="w-full border border-white/10 text-sm">
                  <thead className="bg-background-secondary">
                    <tr>
                      <th className="border border-white/10 px-4 py-2">수탁업체</th>
                      <th className="border border-white/10 px-4 py-2">위탁업무 내용</th>
                      <th className="border border-white/10 px-4 py-2">보유 및 이용기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Supabase (미국)</td>
                      <td className="border border-white/10 px-4 py-2">클라우드 서버 호스팅, 데이터베이스 관리</td>
                      <td className="border border-white/10 px-4 py-2">회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
                    </tr>
                    <tr>
                      <td className="border border-white/10 px-4 py-2">Google LLC</td>
                      <td className="border border-white/10 px-4 py-2">소셜 로그인 (OAuth 2.0) 인증</td>
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
                  <li>성명: [담당자 이름]</li>
                  <li>직책: [직책]</li>
                  <li>이메일: privacy@naelum.app</li>
                  <li>전화번호: [전화번호]</li>
                </ul>
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
              <p>① 이 개인정보처리방침은 2026년 2월 14일부터 적용됩니다.</p>
              <p>② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다:</p>
              <ul className="list-disc list-inside ml-4">
                <li>이전 버전 없음 (최초 작성)</li>
              </ul>
            </div>
          </section>

          {/* 추가 고지 */}
          <section className="pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-4">추가 고지사항</h2>
            <div className="text-text-secondary leading-relaxed space-y-3">
              <div>
                <p className="font-semibold text-text-primary mb-2">AI 학습 데이터 사용에 관한 안내</p>
                <p>회사는 서비스 개선 및 AI 추천 시스템 고도화를 위해 이용자의 레시피 열람 패턴, 검색 기록, 재료 선호도 등을 익명화하여 분석할 수 있습니다. 다만, 개인을 식별할 수 있는 정보는 학습 데이터에 포함되지 않으며, 이용자는 언제든지 설정 페이지에서 데이터 수집을 거부할 수 있습니다.</p>
              </div>

              <div>
                <p className="font-semibold text-text-primary mb-2">사용자 제작 콘텐츠(레시피)에 관한 안내</p>
                <p>이용자가 작성한 레시피, 사진, 동영상 등의 저작권은 작성자에게 있으며, 회사는 서비스 제공 목적으로만 해당 콘텐츠를 사용합니다. 타인의 레시피를 무단 복제하거나 저작권을 침해하는 행위는 금지되며, 이로 인한 법적 책임은 작성자 본인에게 있습니다.</p>
              </div>
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
          <Link
            href="/copyright"
            className="text-accent-warm hover:text-accent-hover transition-colors"
          >
            저작권 정책 →
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
