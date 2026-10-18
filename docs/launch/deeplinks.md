# 낼름 영상 → 앱 유입 자산

**작성일**: 2026-04-16
**용도**: 유튜브 영상, 인스타, Threads 등 외부 채널에서 낼름 앱으로 유입시키는 모든 URL/QR 모음

---

## 🔗 표준 딥링크 (UTM 포함)

UTM 파라미터로 어디서 왔는지 추적. 자체 analytics 가 기록한다 — `components/Analytics/PageViewTracker.tsx` 가 `page_view` 이벤트의 `payload` 에 쿼리스트링(utm 포함)·`referrer` 를 담아 `events` 테이블에 저장(분석 쿠키 동의자만). 관리자 행동 분석 화면(`lib/analytics/aggregateEvents.ts`)에는 utm·referrer 별 집계가 없으므로 `utm_source` 별 분리는 `events.payload` 를 직접 조회해야 한다. 보조로 Cloudflare Web Analytics(CSP 허용). Vercel Analytics·Plausible 은 미도입.

| 채널 | 목적 | URL |
|------|------|-----|
| 유튜브 인트로 영상 | 첫 영상 시청자 → 홈 | `https://naelum.app?utm_source=youtube&utm_medium=video&utm_campaign=intro` |
| 유튜브 쇼츠 | 쇼츠 시청자 → 해당 레시피 | `https://naelum.app/recipes/{id}?utm_source=youtube&utm_medium=shorts` |
| 인스타 프로필 링크 | bio link | `https://naelum.app?utm_source=instagram&utm_medium=bio` |
| 인스타 스토리 | story 스와이프업 | `https://naelum.app?utm_source=instagram&utm_medium=story` |
| Threads | 포스트 첨부 | `https://naelum.app?utm_source=threads` |
| Reddit /r/korea | 외국인 타겟 | `https://naelum.app?utm_source=reddit&utm_medium=community&utm_campaign=rkorea` |
| Reddit /r/koreanfood | 외국인 타겟 | `https://naelum.app?utm_source=reddit&utm_medium=community&utm_campaign=rkoreanfood` |
| 네이버 카페 자취생 | 한국 MZ 타겟 | `https://naelum.app?utm_source=naver_cafe&utm_campaign=jachi` |
| 디스콰이엇 | 메이커 커뮤니티 | `https://naelum.app?utm_source=disquiet` |
| Product Hunt | 메이커 커뮤니티 | `https://naelum.app?utm_source=producthunt` |

---

## 🟦 QR 코드 자산

`/public/qr/` 에 생성됨 (영상/이미지에 합성용).

| 파일 | URL | 사용처 |
|------|-----|--------|
| `naelum-app.png` | https://naelum.app | 일반 영상 워터마크 |
| `naelum-about.png` | https://naelum.app/about | 인트로 영상 엔딩 (자세히 보기) |
| `naelum-youtube.png` | https://naelum.app?utm_source=youtube&utm_medium=video&utm_campaign=intro | 유튜브 첫 영상 엔딩 화면 |

### 추가 생성 방법
```bash
npx -y qrcode 'https://naelum.app/recipes/{id}?utm_source=youtube&utm_medium=shorts' -o public/qr/recipe-{id}.png
```

---

## 📱 모바일 앱 딥링크 (향후)

현재 낼름 모바일 앱(KMP, `../naelum-app/`)은 미배포 상태. 앱 출시 전까지는 모든 딥링크가 웹(naelum.app)으로 향함. 앱 출시 후 추가 예정:

```
naelum://recipe/{id}      → 모바일 앱 직접 열기 (iOS/Android)
https://naelum.app/r/{id} → Universal Link (앱 미설치 시 웹)
```

iOS Universal Link 설정 시 `public/.well-known/apple-app-site-association` 필요.
Android App Link 설정 시 `public/.well-known/assetlinks.json` 필요.

---

## 📊 추적 설정 체크

- [ ] `events.payload` 의 `query`(utm_source)로 채널별 분리 집계가 되는지 확인 (Vercel Analytics 는 미도입)
- [ ] Sentry에 utm 파라미터가 노이즈로 잡히지 않는지 (PII 아님, OK)
- [ ] 향후 Plausible 도입 시 utm 자동 파싱 확인

---

## 📎 참고
- 영상 워크플로우: `docs/VIDEO_WORKFLOW.md`
- 인트로 스크립트: `docs/launch/intro_video_script.md`
- 런칭 플랜: `docs/LAUNCH.md`
