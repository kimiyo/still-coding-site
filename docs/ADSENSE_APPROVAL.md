# Google AdSense 승인 요청 절차 (still-coding.cc)

작성일 2026-09-27 (같은 날 `ADSENSE_REVIEW_2026-09-27.md` 점검 결과를 반영해 정정)

## 개요

Google AdSense는 사이트를 심사한 뒤 광고 게재를 승인하는 방식이므로, 신청 전에 사이트가 정책 요구사항을 충족하도록 준비하는 것이 핵심이다. 전체 흐름은 다음과 같다.

1. 사전 준비사항 점검 (콘텐츠, 정책, 트래픽)
2. AdSense 계정 생성 및 사이트 등록
3. 사이트 인증 코드(ads.txt 포함) 삽입
4. Google 검토 대기 (통상 수일~수주)
5. 승인 또는 반려 통지, 반려 시 사유 확인 후 재신청
6. 승인 후 광고 단위 배치 및 성과 모니터링

## 사전 준비사항 체크리스트

still-coding.cc는 Astro로 빌드되어 Cloudflare(wrangler)로 배포되는 정적 포털 사이트다. 현재 코드베이스 기준 상태는 아래와 같다.

- [x] 도메인 소유 및 HTTPS 배포 (`astro.config.mjs`의 `site: "https://still-coding.cc"`)
- [x] `/privacy/` 개인정보처리방침 페이지 게시 (`src/pages/privacy.astro`, `src/pages/en/privacy.astro`)
- [x] `/contact/` 문의 페이지 게시 — 운영자 이메일 `still.coding.cc@gmail.com` (`src/data/site.ts`)
- [x] `/terms/` 이용약관 게시 (`src/pages/terms.astro`, `src/pages/en/terms.astro`)
- [x] 개인정보처리방침에 Google 광고 쿠키와 맞춤 광고 해제 방법 고지 (4항 "광고와 쿠키")
- [x] AdSense 확인 코드: `PUBLIC_ADSENSE_CLIENT` 환경변수로 `BaseLayout.astro`에 메타 태그·스크립트 출력
- [x] `robots.txt`, `sitemap.xml` 공개 (`public/robots.txt`, 사이트맵은 `src/pages/sitemap.xml.ts`가 앱·노트 데이터로 생성)
- [ ] 고유 콘텐츠 — 앱 상세 7개 + 개발 노트 4편으로 시작. 노트를 15–20편 이상으로 늘린 뒤 신청 권장 (`src/content/notes/`)
- [ ] `/ads.txt` — `src/pages/ads.txt.ts`가 `PUBLIC_ADSENSE_CLIENT` 값으로 판매자 행을 만든다. 게시자 ID는 가입 즉시 발급되므로 **신청 전에** 값을 넣고 배포한다.
- [ ] 최근 30일 내 충분히 확보된 실제 방문 트래픽 확보 (미검증, AdSense 자체는 최소 트래픽을 명시하지 않지만 검토자가 실제 이용 정황을 확인함)
- [ ] 만 18세 이상이어야 하며 계정 소유자의 은행 개인정보가 AdSense 계정에 등록되어 있어야 함(지급을 위해 필수)

이 문서는 2026-09-26자 `still-coding-adsense-improvements.md` 점검 결과 이후 변화(commit `872ed63 feat: prepare portal for AdSense review`)를 반영해 작성되었다.

## 신청 절차

```
계정 생성 → 사이트 등록 → 검토 통과? ──아니오──▶ 거절 확인 ──(수정 후 재제출)──┐
                              │                                          │
                             예                                          │
                              ▼                                          │
                          게재 설정 → 게재 시작                            │
                              ▲                                          │
                              └──────────────────────────────────────────┘
```

검토를 통과하면 광고 게재 설정 후 게재가 시작되고, 거절되면 사유를 확인해 사이트를 수정한 뒤 다시 검토를 요청한다. 각 단계의 세부 사항은 다음과 같다.

1. **계정 생성** — Google 계정으로 [adsense.google.com](https://www.google.com/adsense/start/)에서 가입한다.
2. **사이트 등록** — 사이트 URL(`still-coding.cc`)을 등록하고 소유권을 확인한다.
3. **검토 대기** — Google이 콘텐츠와 정책 준수 여부를 검토한다. 보통 수일에서 수 주가 걸린다.
4. **결과 통보** — 이메일과 AdSense 대시보드로 승인 또는 거절이 통보된다.

## 기술 설정 (Astro + Cloudflare 기준)

still-coding.cc는 Astro로 빌드해 wrangler로 Cloudflare에 배포된다. 모든 페이지가 `src/layouts/BaseLayout.astro`를 공유하므로, 이곳에 한 번만 적용하면 사이트 전체에 적용된다.

1. **사이트 소유권 확인 코드** — `PUBLIC_ADSENSE_CLIENT`가 설정되면 `BaseLayout.astro`가 모든 페이지 `<head>`에 `<meta name="google-adsense-account">`와 `adsbygoogle.js` 스크립트를 출력한다. 코드를 직접 붙여 넣을 필요는 없다.
2. **`ads.txt` 게시** — 저장소 루트 `.env`에 `PUBLIC_ADSENSE_CLIENT=ca-pub-…`를 넣고 빌드하면 `/ads.txt`에 `google.com, pub-…, DIRECT, f08c47fec0942fa0` 행이 생긴다. 값이 없으면 주석 한 줄만 출력하고, 가짜 ID는 절대 넣지 않는다. Astro는 `public/` 아래 파일을 루트에 그대로 복사하므로 배포 후 `https://still-coding.cc/ads.txt`가 일반 텍스트로 응답되는지 반드시 확인한다(SPA/404 핸들러가 HTML을 대신 반환하지 않도록 주의).
3. **검토용 vs 실서빙 코드 분리** — `adsbygoogle.js` 스크립트는 Google이 안내하는 공식 확인 방법 중 하나이며, 승인 전에는 광고가 표시되지 않을 뿐이다. 개별 광고 단위(`<ins class="adsbygoogle">`)나 Auto Ads 설정은 승인 후 읽기 페이지에만 추가한다.
4. **배포** — `pnpm run build`(`astro check && astro build`) 후 `pnpm run deploy`(`wrangler deploy`)로 반영한다. 변경 후 반드시 실제 배포 도메인에서 `view-source:`로 `<meta name="google-adsense-account">` 태그와 `/ads.txt` 응답을 직접 확인한다.
5. **앱별 하위 도메인** — Google은 루트 도메인의 `https://still-coding.cc/ads.txt`를 확인하므로 하위 도메인마다 ads.txt를 둘 필요는 없다. 두려면 실제 ID만 넣고, 플레이스홀더(`pub-XXXX…`) 행은 두지 않는다.

## 콘텐츠 및 정책 요구사항

Google이 가장 자주 거절하는 사유는 정책 위반이 아니라 '검토할 수 있는 고유 콘텐츠 부족'이다. 신청 전 아래를 확인한다.

| 항목 | 요구사항 | still-coding.cc 현황 |
| --- | --- | --- |
| 고유 콘텐츠 | 다른 사이트에 없는 자체 설명·평가·문서가 충분해야 함 | 앱 설명을 실제 앱과 대조해 정정(Direct Play 9개 게임, CollaBoard 8개 도구, Songnote 명칭). 개발 노트 4편 게시, 15–20편 이상으로 확대 필요 |
| 탐색 가능성 | 메뉴/링크로 페이지 간 이동이 명확해야 함 | 각 앱 카드 → 앱 → 포털 외론 경로 점검 필요 |
| 개인정보처리방침 | 실제 데이터 처리 방식과 광고 쿠키 사용을 공개해야 함 | `/privacy/`, `/en/privacy/`에 광고와 쿠키(4항), 앱별 방침 링크 게시 |
| 연락처 | 운영자에게 연락할 수 있는 경로 필요 | `/contact/`에 운영자 이메일과 GitHub 이슈 경로 게시 |
| 네비게이션 | 사용자가 실수로 광고를 클릭하도록 유도하는 UI 금지 | 앱 조작 화면에 광고를 배치하지 않고 포털·소개 영역으로 제한 |
| 금지 콘텐츠 | 성인·폭력·저작권 침해 등이 없어야 함 | 포트폴리오 성격상 해당 없음(직접 확인 권장) |
| 사이트 안정성 | 404·깨진 링크 없이 정상 작동해야 함 | `/ads.txt`는 text/plain으로 항상 응답. 게시자 ID 설정 후 판매자 행 출력 |
| 유럽/영국 방문자 | EEA·영국·스위스 방문자에게는 CMP(동의 관리 플랫폼) 적용 검토 필요 | 해당 지역 방문자 비율 미계측 — 미리 검토 권장 |

참고: [AdSense에 적합한 사이트 준비](https://support.google.com/adsense/answer/7299563), [유럽 지역 CMP 요건](https://support.google.com/adsense/answer/13554116)

## 흔한 거절 사유와 대응

| 거절 사유(Google 통지 문구) | 의미 | still-coding.cc에서 점검할 점 |
| --- | --- | --- |
| Low value content | 콘텐츠가 얕다 판단 | 앱 소개가 카드 요약뿐이 아니라 사용법·대상·제약사항까지 담는지 |
| Unable to review site | 크롤러가 사이트를 제대로 읽지 못함 | robots.txt가 크롤러를 차단하지 않는지, 주요 페이지가 JS 없이도 렌더링되는지(Astro 정적 빌드로 대부분 해소됨) |
| Site under construction / navigation issues | 개발 중 페이지가 섞임 | 미완성 페이지에 `noindex`를 거는지, 사이트맵에서 제외되어 있는지 |
| Insufficient traffic | 검토자가 실제 이용을 확인할 수 없음 | 공식 최소 수치는 없지만, 대량 방문 유치 후 재신청하는 것이 안전함 |
| Violation of Google policies | 정책 위반 콘텐츠 포함 | 하위 앱(특히 외부 운영 사이트)의 사용자 생성 콘텐츠에 문제가 없는지 |
| Additional review required | 계정 수준에서 추가 검토 진행 중 | 자동으로 결정되며 사용자가 대응 불가, 대기 외에 방법 없음 |

거절 통지를 받으면 AdSense 대시보드의 사이트 상태 페이지에서 구체적인 사유를 확인한다. 지적된 문제를 수정한 뒤 같은 계정으로 '검토 요청(Request review)'을 누르면 되며, 새 계정을 만들 필요는 없다. 수정 직후 재신청하기보다 변경사항이 실제 배포에 반영되었는지를 먼저 확인한다.

## 승인 이후 할 일

- **광고 단위 배치** — 포털과 앱 소개처럼 읽을 거리가 있는 화면에만 광고 후보 영역을 검토하고, 앱 조작 화면에는 Auto Ads를 일괄 적용하지 않는다.
- **페이지별 제외 설정** — AdSense 설정에서 Auto Ads를 사용할 경우 앱 조작 경로(URL 패턴)를 제외 목록에 추가한다.
- **데스크톱/모바일 검증** — 광고와 조작 요소 간 거리, 레이아웃 이동(CLS), 닫기/스크롤 동작을 360/768/1280px에서 확인한다.
- **성과 모니터링** — AdSense 리포트에서 노출수·클릭률·수익을 주기적으로 확인하고, 정책 위반 경고(Policy Center)가 있는지 수시로 점검한다.
- **계정 정지 위험 관리** — 본인 광고 클릭, 부정 트래픽 유도, 정책 위반 콘텐츠 추가를 피한다 — 승인 후에도 Google은 지속적으로 사이트를 재검토한다.

## 예상 소요 기간 및 유의사항

검토는 보통 수일에서 수 주가 걸리며, 계정이나 지역에 따라 더 오래 걸릴 수 있다. Google은 정확한 처리 기간을 보장하지 않으므로 특정 날짜를 약속하지 않는다.

- 검토 중에는 사이트 내용을 자유롭게 수정해도 되지만, 이미 게재된 광고 코드를 임의로 제거하지 말 것.
- 거절 후 재신청은 횟수 제한이 명시되어 있지 않지만, 개선 없이 반복 재신청하면 검토 지연이나 계정 제한으로 이어질 수 있다.
- 승인 전에는 광고가 표시되지 않는다. 확인용 `adsbygoogle.js` 스크립트는 넣어 두어도 된다.
- 루트 도메인 `still-coding.cc`가 승인되면 `*.still-coding.cc` 하위 앱에도 같은 계정으로 광고를 게재할 수 있다. ads.txt는 루트 도메인 파일 하나로 충분하다.
