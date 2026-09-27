# Google AdSense 승인 요청 절차 (still-coding.cc)

작성일 2026-09-28

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
- [x] `/contact/` 문의 페이지 게시 (`src/pages/contact.astro`)
- [x] `robots.txt`, `sitemap.xml` 공개 (`public/robots.txt`, `public/sitemap.xml`)
- [x] 고유 콘텐츠 7개 앱 소개 포털 + 운영자 소개(About)
- [ ] `/ads.txt` 미게시 — `public/ads.txt`가 아직 없음 (AdSense 계정 승인 후 실제 게시자 ID로 게시해야 함)
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

1. **사이트 소유권 확인 코드 삽입** — AdSense가 발급한 `<meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX">` 또는 `adsbygoogle.js` 스크립트 태그를 `BaseLayout.astro`의 `<head>` 내부(기존 `<meta>` 태그들 바로 아래)에 추가한다.
2. **`ads.txt` 게시** — AdSense 계정이 발급한 행(예: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`)을 그대로 `public/ads.txt`에 일반 텍스트로 넣고 빌드한다. Astro는 `public/` 아래 파일을 루트에 그대로 복사하므로 배포 후 `https://still-coding.cc/ads.txt`가 일반 텍스트로 응답되는지 반드시 확인한다(SPA/404 핸들러가 HTML을 대신 반환하지 않도록 주의).
3. **검토용 vs 실서빙 코드 분리** — 사이트 등록/소유권 확인 단계에는 확인 태그만 필요하다. 승인 이전에 실제 광고 유닛(Auto Ads 또는 디스플레이 광고)을 미리 삽입하지 않는다 — 승인되지 않은 사이트에서 광고 코드만 먼저 돌아가는 것은 정책상 문제가 되지는 않지만, 승인 후 실제 게재 코드를 따로 추가하는 편이 변경 이력 관리에 유리하다.
4. **배포** — `pnpm run build`(`astro check && astro build`) 후 `pnpm run deploy`(`wrangler deploy`)로 반영한다. 변경 후 반드시 실제 배포 도메인에서 `view-source:`로 `<meta name="google-adsense-account">` 태그와 `/ads.txt` 응답을 직접 확인한다.
5. **앱별 하위 도메인** — Vocal Check 등 `*.still-coding.cc` 하위 앱은 별도 배포체로, 각 앱이 자체 `ads.txt`가 필요한지는 해당 저장소에서 별도로 관리해야 한다.

## 콘텐츠 및 정책 요구사항

Google이 가장 자주 거절하는 사유는 정책 위반이 아니라 '검토할 수 있는 고유 콘텐츠 부족'이다. 신청 전 아래를 확인한다.

| 항목 | 요구사항 | still-coding.cc 현황 |
| --- | --- | --- |
| 고유 콘텐츠 | 다른 사이트에 없는 자체 설명·평가·문서가 충분해야 함 | 7개 앱 소개 문구가 실제 기능과 일치하는지 재점검 필요(CollaBoard 기능 수, Piano Play→Songnote 명칭 불일치 미검증) |
| 탐색 가능성 | 메뉴/링크로 페이지 간 이동이 명확해야 함 | 각 앱 카드 → 앱 → 포털 외론 경로 점검 필요 |
| 개인정보처리방침 | 실제 데이터 처리 방식과 일치하는 문서가 공개되어야 함 | `/privacy/`, `/en/privacy/` 게시됨(커밋 `872ed63`) |
| 연락처 | 운영자에게 연락할 수 있는 경로 필요 | `/contact/` 게시됨 |
| 네비게이션 | 사용자가 실수로 광고를 클릭하도록 유도하는 UI 금지 | 앱 조작 화면에 광고를 배치하지 않고 포털·소개 영역으로 제한 |
| 금지 콘텐츠 | 성인·폭력·저작권 침해 등이 없어야 함 | 포트폴리오 성격상 해당 없음(직접 확인 권장) |
| 사이트 안정성 | 404·깨진 링크 없이 정상 작동해야 함 | `/ads.txt`는 아직 404 — 승인 후 게시로 입력 문제 없도록 해야 함 |
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
- 승인 전까지는 사이트에 실제 광고를 노출하지 않는다(정책 위반 소지).
- 한 계정으로 여러 도메인(하위 앱 포함)을 관리할 수 있으므로, 포털이 승인되면 각 `*.still-coding.cc` 앱은 별도 승인 절차 없이 같은 계정에 추가할 수 있다(각 앱이 자체 `ads.txt`를 가지는지는 개별 확인 필요).
