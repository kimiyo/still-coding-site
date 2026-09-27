# still-coding.cc AdSense 신청 전 종합 점검 결과

- 점검일: 2026-09-27
- 범위: 포털 `still-coding.cc`(이 저장소)와 포털에서 연결되는 하위 앱 7개
- 방법: 각 저장소의 소스와 배포 설정(`wrangler.jsonc`, `public/`, 라우팅)을 직접 확인하고, 포털은 `pnpm run build` 산출물로 검증했다.
- 한계: 점검 환경의 네트워크 정책 때문에 실제 배포 URL(`*.still-coding.cc`)에는 접속하지 못했다. 아래 내용은 **저장소 기준**이며, 배포본이 저장소와 다르면 결과도 달라질 수 있다.

| 하위 도메인 | 저장소 |
| --- | --- |
| dp.still-coding.cc | kimiyo/direct-play-games |
| pinhole-game.still-coding.cc | kimiyo/openai-game-builders-pinhole |
| study-hiragana.still-coding.cc | kimiyo/study-japanese-language-alphabet |
| collaboard.still-coding.cc | kimiyo/collaboard-app |
| bus-explorer.still-coding.cc | kimiyo/bus-route-in-trip |
| piano-play.still-coding.cc | kimiyo/piano-songnote |
| vocal-check.still-coding.cc | kimiyo/vocal-check-app |

## 요약: 신청 전에 반드시 고칠 것 (P0)

1. **포털 개인정보처리방침이 광고 게재와 모순된다.** `src/pages/privacy.astro`, `src/pages/en/privacy.astro`에 "광고 식별자 수집을 운영하지 않습니다"라고 적혀 있다. AdSense 프로그램 정책은 Google 등 제3자 공급업체가 쿠키로 광고를 게재한다는 사실과 사용자가 맞춤 광고를 끌 수 있는 방법을 개인정보처리방침에 공개하도록 요구한다.
2. **AdSense 사이트 확인 코드가 없다.** `src/layouts/BaseLayout.astro`에 `google-adsense-account` 메타 태그나 `adsbygoogle.js` 스크립트가 없다. 사이트를 등록하고 검토를 요청하려면 둘 중 하나가 있어야 한다.
3. **콘텐츠가 얇다. 가장 큰 거절 위험이다.** 포털은 외부 하위 도메인으로 보내는 링크 허브에 가깝다. 빌드 산출물 기준으로 앱 상세 페이지 7개의 본문은 메뉴·푸터를 포함해도 각각 약 1,400–1,900자이고, `/about/`은 약 1,100자, `/contact/`는 약 800자다. 홈 화면은 영어 슬로건과 비주얼이 대부분이다. "가치가 별로 없는 콘텐츠(Low value content)" 판정을 받기 쉬운 구조다.
4. **CollaBoard에 가짜 게시자 ID가 들어간 `ads.txt`가 있다.** `collaboard-app/frontend/ads.txt`에 `pub-XXXXXXXXXXXXXXXX` 행이 있고, assets 디렉터리가 `./frontend`라서 그대로 배포된다. 잘못된 행은 삭제해야 한다. 하위 도메인 ads.txt는 원래 필요하지도 않다(아래 참고).
5. **Pinhole Lab은 크롤러가 볼 공개 페이지가 없다.** `not_found_handling: "single-page-application"` 때문에 `/robots.txt`, `/sitemap.xml`, `/ads.txt`, `/privacy/` 등 없는 모든 경로가 `index.html`을 200으로 돌려준다(soft 404). 개인정보·가이드 정적 페이지와 포털로 돌아가는 링크도 없다.

## 1. 포털 (still-coding.cc)

### P0

| # | 항목 | 현황(근거) | 제안 |
| --- | --- | --- | --- |
| 1 | 개인정보처리방침의 광고 고지 | `privacy.astro` 1항: "광고 식별자 수집을 운영하지 않습니다" | 새 절 "광고 및 쿠키"를 추가한다. ① Google을 포함한 제3자 공급업체가 쿠키로 이 사이트와 다른 사이트 방문 기록을 바탕으로 광고를 게재함 ② Google은 광고 쿠키로 맞춤 광고를 제공함 ③ 맞춤 광고 해제는 [광고 설정](https://adssettings.google.com), 제3자 쿠키 해제는 [aboutads.info](https://www.aboutads.info) ④ [Google이 파트너 사이트 데이터를 사용하는 방식](https://policies.google.com/technologies/partner-sites) 링크. 1항의 "광고 식별자 수집 안 함" 문장은 삭제하고 시행일을 갱신한다. 한국어와 영어 두 버전 모두 고친다. |
| 2 | 사이트 확인 코드 | `BaseLayout.astro` `<head>`에 없음 | `PUBLIC_ADSENSE_CLIENT`(예: `ca-pub-…`) 환경변수가 있을 때만 `<meta name="google-adsense-account">`와 `adsbygoogle.js`(async, `crossorigin="anonymous"`)를 출력한다. ID가 없으면 아무것도 출력하지 않아 지금의 빌드가 그대로 유지된다. 게시자 ID는 가입 직후 발급되므로 승인을 기다릴 필요가 없다. |
| 3 | `ads.txt` | `public/ads.txt` 없음 | 게시자 ID를 받는 즉시 `public/ads.txt`에 `google.com, pub-…, DIRECT, f08c47fec0942fa0`를 게시한다. `docs/ADSENSE_APPROVAL.md`의 "승인 후 게시"는 틀린 설명이라 고쳐야 한다. 신청 시점부터 있어야 대시보드에서 "ads.txt 찾을 수 없음" 경고를 피할 수 있다. |
| 4 | 고유 콘텐츠 분량 | 앱 상세 7개 × 약 1.5천 자, 모두 같은 4단 템플릿(대상/3단계/데이터/FAQ) | 아래 "콘텐츠 보강안"을 참고한다. 목표는 사람이 읽을 만한 글 **15–20편 이상**이다. |
| 5 | 연락처 | `/contact/`에 GitHub 프로필 링크만 있음 | 운영자에게 직접 닿는 이메일 주소(예: 사이트 전용 주소)나 문의 폼을 추가한다. 이슈 링크를 쓰려면 프로필이 아니라 `…/issues/new` 같은 구체적인 경로를 안내한다. 검토자는 실제 운영 주체와 연락 가능성을 본다. |

### P1

| # | 항목 | 현황(근거) | 제안 |
| --- | --- | --- | --- |
| 6 | 중복 호스트 | `wrangler.jsonc`에 `www.still-coding.cc`도 custom domain으로 붙어 같은 내용을 제공하고, `workers_dev: true`, `preview_urls: true`라 `*.workers.dev`에서도 사이트가 열린다 | `www` → apex로 301 리다이렉트한다(Cloudflare Redirect Rule). `workers_dev`/`preview_urls`는 끄거나, 다른 호스트에 `X-Robots-Tag: noindex`를 붙인다. canonical만으로도 어느 정도 막히지만 신청 도메인을 하나로 정리하는 편이 안전하다. |
| 7 | 이용약관 | 포털에 `/terms/` 없음. 하위 앱(dp, bus, piano)에는 있음 | 포털에 간단한 이용약관 `/terms/`, `/en/terms/`를 만들고 푸터·사이트맵에 추가한다. |
| 8 | 가이드 링크 정확성 (`src/data/apps.ts`) | 가나 공방 `helpUrl`이 `#help`인데 앱에는 정적 `/guide/`가 있다. Bus Explorer는 `helpUrl`이 없는데 앱에 `/guide/`가 있다 | 가나 공방은 `https://study-hiragana.still-coding.cc/guide/`, Bus Explorer는 `https://bus-explorer.still-coding.cc/guide/`로 바꾼다. 해시(`#help`)보다 크롤링되는 정적 URL로 연결하는 편이 낫다. |
| 9 | 앱 설명과 실제 내용의 불일치 | Direct Play 카드는 "7개의 브라우저 게임"인데 dp 사이트맵에는 게임 가이드 9개(pinhole, sum-drop, photo-puzzle, photo-sliding-puzzle, sum-puzzle, number-baseball, pocket-race, spy-game, mini-sudoku)가 있다 | 실제 공개 게임 수를 확인해 카드·태그·상세·영문 텍스트를 통일한다. Pinhole/Sum Drop이 Direct Play와 Pinhole Lab 양쪽에 있으므로 관계("Pinhole Lab 게임은 Direct Play에서도 방으로 플레이 가능")를 설명한다. |
| 10 | 개인정보처리방침 3항 | "Direct Play, Pinhole Lab, Bus Explorer는 각 앱 화면의 최신 안내를 기준으로" | 각 앱의 실제 개인정보 페이지로 직접 링크한다: dp `/privacy/`, bus `/privacy/`, kana `/privacy/`, piano `/privacy/`, vocal `/privacy/`. Pinhole·CollaBoard는 정적 페이지를 만든 뒤 연결한다. |
| 11 | 홈의 한국어 본문 | 히어로·섹션 제목이 영문 슬로건 위주 | 홈에 "Still Coding은 무엇인가 / 어떤 앱이 있나 / 최근 글" 같은 2–3문단 한국어 소개와 최근 글 목록 섹션을 추가해 크롤러가 읽을 텍스트를 늘린다. |

### P2

| # | 항목 | 제안 |
| --- | --- | --- |
| 12 | OG 이미지 | `og:image`가 `.webp`다. 카카오톡 등 일부 미리보기에서 호환성이 떨어질 수 있으므로 이미 있는 PNG(`living-geometry-og-background.png`)를 1200×630으로 만들어 쓰고 `og:image:width/height`를 명시한다. |
| 13 | 구조화 데이터 | 현재는 `ItemList`만 있다. `WebSite`와 `Person`(JH Kim, `sameAs`: GitHub)을 추가해 운영 주체를 명확히 한다. |
| 14 | 사이트맵 | 손으로 관리하고 있고 `lastmod`가 없다. 글이 늘어나면 `@astrojs/sitemap`으로 자동 생성하는 편이 누락을 줄인다. |
| 15 | 개발 중 표시 | 홈의 "Guitar Auto-Strum — 비공개 실험·다듬는 중" 섹션은 "공사 중" 신호로 읽힐 수 있다. 신청 기간에는 비중을 줄이거나, 개발 과정 글(노트)로 연결해 읽을거리로 바꾼다. |
| 16 | Cloudflare 봇 설정 | Bot Fight Mode나 "AI 봇 차단" 관리형 robots.txt가 `Mediapartners-Google`/`Googlebot`에 챌린지를 걸지 않는지 대시보드에서 확인한다. 크롤러가 막히면 "사이트를 검토할 수 없음"으로 거절된다. |

### 콘텐츠 보강안 (P0-4 상세)

포털 운영자의 실제 개발 경험을 담은 글이 가장 설득력 있는 고유 콘텐츠다. `/notes/` 또는 `/blog/` 섹션(Astro Content Collections)을 만들고, 한 편에 2,000–4,000자로 스크린샷과 코드 조각을 넣는다. 예시 주제:

- CollaBoard: 서버 없이 WebRTC P2P로 협업 도구 8개 만들기, 시그널링 설계
- Vocal Check: 브라우저에서 실시간 음정을 검출하는 원리(자기상관·YIN), 센트 계산
- Songnote: ABC 악보 표기법 입문과 브라우저 합성 피아노 구현
- 가나 공방: 비슷한 가나 짝 학습(シ/ツ, ソ/ン)을 설계한 이유, 149개 표기 정리
- Direct Play: Cloudflare Durable Objects로 12인 실시간 게임방 만들기
- Bus Explorer: 공공 버스 API(TAGO·GBIS) 수집 파이프라인과 경로 후보 계산
- Pinhole / Sum Drop: 게임 규칙 설계와 난이도 조절 과정
- 운영 노트: Astro + Cloudflare Workers 정적 포털 배포, 다국어(ko/en) 구성

앱 상세 페이지 7개에도 실제 화면 스크린샷 2–3장, 핵심 기능 목록, 만든 배경, 기술 스택, 변경 이력(날짜별)을 더해 각 3,000자 이상으로 늘린다. 같은 문장을 영어로 옮겨 분량만 늘리는 방식은 효과가 없다.

## 2. 하위 도메인 앱

### 공통 원칙

- **승인 범위**: AdSense에는 루트 도메인 `still-coding.cc`를 등록한다. 승인되면 하위 도메인에도 같은 계정으로 광고를 게재할 수 있으므로 앱마다 따로 신청할 필요는 없다. 다만 광고가 나오는 모든 페이지는 프로그램 정책을 지켜야 한다.
- **ads.txt**: Google은 루트 도메인의 `https://still-coding.cc/ads.txt`를 확인한다. 하위 도메인마다 ads.txt를 둘 필요는 없고, 두려면 **실제 ID**만 넣어야 한다. 플레이스홀더 행은 두지 않는다.
- **광고 배치**: 게임·측정·편집 화면처럼 조작하는 곳 근처에 광고를 두면 "실수 클릭 유도"로 제재받을 수 있다. Songnote와 Vocal Check의 `ads.js` 허용 목록(읽기 페이지만 허용) 방식이 좋은 모범이므로 다른 앱에도 같은 규칙을 적용한다.
- **포털과 오가는 링크**: 모든 앱의 헤더나 푸터에 `still-coding.cc`로 돌아가는 링크를 둔다.

### 앱별 점검표

| 앱 | 공개 정적 페이지 | robots / sitemap | 개인정보의 광고 고지 | 포털 링크 | 주요 조치 |
| --- | --- | --- | --- | --- | --- |
| Direct Play (dp) | about, privacy, terms, contact, 게임 가이드 9개 (ko/en) | 있음, 방·API 경로 차단 | 있음 | 있음 | 가장 잘 갖춰짐. 포털의 게임 수 표기만 맞추면 된다. |
| Pinhole Lab | **없음** (SPA 한 페이지) | **없음**. SPA fallback이라 모든 경로가 index.html(200) | **없음** | **없음** | ① `not_found_handling`을 `404-page`로 바꾸고 `404.html` 추가 ② `public/robots.txt`, `sitemap.xml` 추가 ③ `/guide/`(Pinhole·Sum Drop 규칙), `/privacy/`, `/about/` 정적 페이지 추가 ④ 포털 링크 추가 ⑤ 같은 게임이 dp에도 있으므로 가이드 문장은 dp와 다르게 쓴다(중복 콘텐츠 방지). |
| 가나 공방 | guide, privacy, contact | 있음 | 있음(Google 언급 없음) | 있음 | 개인정보 문서에 Google 광고 쿠키와 해제 링크를 명시한다. 포털 `helpUrl`을 `/guide/`로 바꾼다. |
| CollaBoard | **해시 뷰만** (`/#help`, `/#privacy`, `/#contact`) | 사이트맵에 `#` URL 10개. Google은 fragment를 무시하므로 사실상 `/`, `/en/` 2개뿐이다 | 있음(JS 뷰 안) | 있음 | ① `frontend/ads.txt`의 `pub-XXXX…` 행 **삭제** ② help/privacy/contact를 정적 HTML(`/guide/`, `/privacy/`, `/contact/`)로 분리 ③ 사이트맵을 정적 URL로 교체. |
| Bus Explorer | about, guide, privacy, terms, contact | 있음(FastAPI 라우트) | 있음 | 정보 페이지에는 있고 **메인(index.html)에는 없음** | ① 메인에 포털 링크와 `<meta name="description">` 추가(현재 title이 "Bus Explorer"뿐) ② 포털 `apps.ts`에 `helpUrl` 추가. ads.txt는 환경변수가 없으면 빈 응답이라 문제없다. |
| Songnote (piano-play) | about, guide, library 5편, privacy, terms, contact (ko/en) | 있음 | 있음(Google 언급 없음) | 있음 | 모범 사례. 개인정보 문서에 Google 광고 쿠키 문구만 보강한다. |
| Vocal Check | guide, privacy, contact (ko/en) | 있음 | 있음 | 있음 | 모범 사례. `.assetsignore`로 md·테스트 파일이 배포에서 빠지는 것도 확인했다. |

## 3. 기존 문서 정정 사항 (`docs/ADSENSE_APPROVAL.md`)

| 위치 | 현재 서술 | 정정 |
| --- | --- | --- |
| 작성일 | 2026-09-28 | 실제 작성일로 수정(미래 날짜) |
| 체크리스트, 기술 설정 2 | ads.txt는 승인 후 게시 | 게시자 ID는 가입 즉시 발급되므로 **신청 전에** 게시한다. |
| 기술 설정 5, 유의사항 | 하위 앱마다 자체 ads.txt 필요 여부 확인 | 루트 도메인의 ads.txt 하나로 충분하다. 하위 도메인 파일은 선택 사항이며 두려면 실제 ID만 넣는다. |
| 유의사항 | 승인 전 광고 노출은 정책 위반 소지 | 승인 전에 `adsbygoogle.js` 코드를 넣는 것은 공식 확인 방법 중 하나다. 승인 전에는 광고가 표시되지 않을 뿐이다. |
| 체크리스트 | 고유 콘텐츠 7개 앱 소개 → 완료 | 분량 부족으로 **미완료** 처리하고 콘텐츠 보강안을 연결한다. |

## 4. 권장 실행 순서

1. AdSense 가입 → 게시자 ID 확보
2. 포털: 개인정보처리방침 광고 고지(ko/en), 확인 코드(환경변수), `public/ads.txt`, 연락처 이메일, `www`·workers.dev 정리
3. 하위 앱: CollaBoard 가짜 ads.txt 삭제, Pinhole Lab 정적 페이지·robots·404 정비, 가나·Songnote 개인정보 문구 보강, Bus 메인 포털 링크
4. 포털 콘텐츠: 노트 10편 이상 + 앱 상세 확장 (2–4주에 걸쳐 꾸준히 게시)
5. Search Console에 `still-coding.cc` 등록, 사이트맵 제출, 색인 생성 확인
6. 배포 후 `view-source:`에서 메타 태그와 `/ads.txt`의 text/plain 응답을 확인한 뒤 AdSense에서 검토 요청

이 문서의 우선순위는 작업 순서를 정리한 것이며, Google의 공식 승인 기준이나 승인 보장이 아니다.

참고:
[AdSense 프로그램 정책](https://support.google.com/adsense/answer/48182) ·
[개인정보처리방침 필수 내용](https://support.google.com/adsense/answer/1348695) ·
[사이트 준비](https://support.google.com/adsense/answer/7299563) ·
[ads.txt](https://support.google.com/adsense/answer/12171612) ·
[EEA·영국 CMP 요건](https://support.google.com/adsense/answer/13554116)
