# still-coding.cc → still-coding.com 이전 계획

- 작성: 2026-10-02 (같은 날 전 저장소 점검 결과로 개정, 2026-10-03 저장소 경로 명시, `memo.` 이전·`apigameroom.` 정리 추가)
- 목표: 포털과 공개 앱의 정식 주소를 `*.still-coding.com`으로 바꾸고, `still-coding.cc`는 경로를 보존하는 301 리디렉트용으로 유지한다.
- 근거 표기
  - **[소스]**: 각 저장소 기본 브랜치의 최신 커밋을 `git grep`으로 직접 확인
  - **[미확인]**: 대시보드나 서버에서만 확인할 수 있는 사항

## 0. 확정된 결정

| 항목 | 결정 |
| --- | --- |
| Cloudflare 소유 계정 | `kimiyohome@gmail.com`. `.cc`와 `.com` 두 존 모두 이 계정에 둔다. |
| 공개 연락처 메일 | `still.coding.com@gmail.com`. 모든 사이트의 문의, 개인정보처리방침, 약관에 표기한다. |
| Search Console 소유 계정 | `still.coding.com@gmail.com` |
| AdSense 소유 계정 | `still.coding.com@gmail.com` |
| `www` | `www.still-coding.com` → `still-coding.com`으로 301 |
| `.cc` 도메인 | 계속 갱신한다. 리디렉트를 유지하고, 비공개 서비스도 여기에 남는다. |
| 기존 메일 `still.coding.cc@gmail.com` | 최소 1년 유지하고 새 주소로 자동 전달한다. |

**두 Google 계정의 역할 분담**

- DNS 레코드 추가는 `kimiyohome`이 Cloudflare에서 한다.
- Search Console 인증 코드 발급과 AdSense 신청은 `still.coding.com`이 한다.
- Search Console에는 `kimiyohome`을 **소유자로 추가**해 둔다. 한 계정을 잃어도 관리가 가능하게 하기 위해서다.

## 1. 점검 결과 요약

### 1-1. 사이트 일람 [소스]

| # | 사이트 (`.cc` → `.com`) | 저장소 경로 | 호스팅 | `.cc` 참조 파일 | 메일 표기 | 브라우저 저장 데이터 | 서비스 워커 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P | `still-coding.cc`, `www.` | `E:\dev-e\jh-projects\still-coding` | Worker 정적 자산 | 63 | 1곳 (`site.ts`) | 없음 | 없음 |
| A1 | `dp.` + 게임 도메인 10개 | `D:\dev\jh-personal-projects\direct-play-games` | Worker + Durable Objects + R2 | 70+ | 12 파일 | 세션·방 토큰, SUM DROP 진행 기록 (낮음) | 없음 |
| A2 | `study-hiragana.` | `E:\dev-e\study-non-it\study-japanese-language-alphabet` | **Pages** (`study-hiragana-app-pages`) | 8 | **없음** | **학습 진도** `kana-atelier-progress-v2` (높음) | **있음** `/sw.js` |
| A3 | `guitar-play.` | `E:\dev-e\jh-projects\guitar-app-web` | Worker 정적 자산 | 31 | 5 파일 | **곡·코드 레이아웃(localStorage), 악보(IndexedDB)** (높음) | **있음** |
| A4 | `collaboard.` | `E:\dev-e\jh-projects\collaboard-app` | Worker + Durable Objects | 19 | 3 파일 | 방 세션 토큰, 투표 기록 (낮음) | 없음 |
| A5 | `piano-play.` | `E:\dev-e\jh-projects\Piano-SongNote` | Worker 정적 자산 | 33 | 4 파일 | **악보 초안·버전·사용자 곡** `songnote-*` (높음) | 없음 |
| A6 | `vocal-check.` | `E:\dev-e\jh-projects\vocal-check-app` | Worker 정적 자산 | 17 | **없음** | 언어 설정만 | 없음 |
| A7 | `pdf-flow-studio.` | `D:\dev\jh-personal-projects\pdf-flow-studio` | Worker 정적 자산 | 16 | 6 파일 | 언어, 펜 설정만 (낮음) | 없음 |
| A8 | `bus-explorer.` | `E:\dev-e\jh-projects\bus-route-in-trip` | **홈서버 Docker** (8221) + 터널 [미확인] | 9 | 3 파일 | **저장한 경로, 선택 노선, 도시** (중간) | 없음 |
| S | `user-feedback.` | `E:\dev-e\jh-projects\User-feedback-api` | **홈서버 Docker** (4100) + 터널 [미확인] | 9 | – | – | – |
| M | `memo.` | `D:\dev\jh-personal-projects\kims-memo-markdowns` (서버: `web-server-for-shareing`, 데스크톱 앱 2종 — §3-M) | **홈서버 Docker** (3131) + 터널 [미확인] | 데스크톱 앱 4 + 서버 문서 1 | – | 웹 로그인 토큰 `share_token` (재로그인으로 충분) | 없음 |

### 1-2. 이전하지 않는 호스트

다음은 비공개 또는 실험 서비스이므로 `.cc`에 그대로 둔다.

- `speaker.`, `remote.`, `songfilm.`, `songfilm-pub.`, `api-mini.`
- `apigameroom.`: 쓰지 않는 옛 주소. 이전하지 않고 **삭제**한다(§8).
- 따라서 `.cc` 리디렉트는 와일드카드로 걸지 않고 **공개 호스트 목록만 명시**한다.
- `memo.`는 비공개 서비스지만 **이전 대상**이다(§3-M). 다른 호스트와 달리 301로 넘기지 않고 일정 기간 두 주소를 함께 운영한다.
- `pinhole-game.`은 문서와 링크에만 남은 옛 주소다. 실제 라우트는 `pinhole.`이다. 이전할 때 링크를 정리한다.

### 1-3. 계획을 바꾼 발견

1. **도메인을 바꾸면 브라우저 저장 데이터가 사라진다.**
   - localStorage와 IndexedDB는 출처(origin)별로 따로 저장된다.
   - A2 가나 공방, A3 기타, A5 Songnote, A8 버스는 주소만 바꾸면 사용자가 저장한 데이터가 새 주소에서 보이지 않는다.
   - iframe으로 옛 주소의 데이터를 읽는 방법은 현재 브라우저의 **저장소 분할 정책 때문에 동작하지 않는다.** 반드시 최상위 페이지 이동으로 넘겨야 한다. (§3 이사 브리지)
2. **서비스 워커가 리디렉트를 가린다.**
   - A2와 A3은 `.cc`에 서비스 워커가 등록되어 있다.
   - `/sw.js` 요청이 301을 받으면 브라우저는 업데이트에 실패하고, 옛 워커가 캐시된 앱을 계속 띄운다.
   - 리디렉트를 걸기 전에 **자기 해제(kill-switch) 서비스 워커**를 배포해야 한다.
3. **피드백 API의 허용 출처는 DB에 저장되어 있다.**
   - `project_origins` 테이블을 쓰고, 이 값이 CORS와 `frame-ancestors` 둘 다 결정한다.
   - 코드를 고치는 것이 아니라 **관리자 화면에서 앱마다 `.com` 출처를 추가**해야 한다.
4. **Direct Play 게임 도메인 리디렉트는 도메인 이름에 의존하지 않는다.**
   - `worker/game-domains.js`는 호스트의 첫 라벨만 본다.
   - 그래서 Worker에 `.cc`와 `.com` 게임 도메인을 모두 붙이고 `APP_ORIGIN`만 `.com`으로 바꾸면 된다.
   - 이렇게 하면 `.cc` 게임 도메인도 **한 번의 리디렉트**로 `.com` 게임 화면에 도착한다.
   - 단, `dp.still-coding.cc` 자체는 `dp`가 게임 ID가 아니어서 앱이 그대로 응답한다. 이 호스트는 반드시 존 리디렉트로 처리한다.
5. **가나 공방과 Vocal Check에는 연락처 메일이 없다.** 이번에 `still.coding.com@gmail.com`을 추가해 전 사이트를 통일한다. AdSense 심사의 연락처 요건도 함께 충족된다.
6. **홈서버 두 곳은 코드보다 운영 설정이 핵심이다.** 버스(8221)와 피드백(4100)은 Cloudflare Tunnel 공개 호스트 이름을 `.com`으로 추가해야 한다. 터널 설정은 저장소에 없다 [미확인].

---

## 2. 공통 준비 (모든 사이트보다 먼저)

### 2-1. 계정과 DNS

| # | 작업 | 담당 계정 |
| --- | --- | --- |
| C1 | `still-coding.com` 존이 Cloudflare에 있는지 확인한다. Cloudflare Registrar 구매가 아니면 네임서버를 변경한다. SSL은 Full (strict), Always Use HTTPS. | kimiyohome |
| C2 | `.com` 존에 www → 루트 301 Redirect Rule을 만든다. 포털 README 절차와 같은 방식이다. | kimiyohome |
| C3 | Search Console에서 **도메인 속성** `still-coding.com`과 `still-coding.cc`를 추가하고 TXT 값을 발급받는다. 기존 `.cc` 리디렉트를 이 계정으로 관리하려면 두 속성이 다 필요하다. | still.coding.com |
| C4 | C3에서 받은 TXT를 각 존에 추가하고 인증한다. Search Console 설정 → 사용자 및 권한에서 kimiyohome을 소유자로 추가한다. | kimiyohome → still.coding.com |
| C5 | `still.coding.cc@gmail.com`에 새 주소로 자동 전달을 설정하고, 자동응답으로 새 주소를 안내한다. | 옛 Gmail |
| C6 | AdSense 계정 상태를 확인한다. kimiyohome이나 옛 Gmail에 **이미 AdSense 계정이 있으면 새로 만들지 않는다.** 한 사람(수취인)당 한 계정 정책이 있다. 이 경우 기존 계정에 사용자로 추가하는 방식을 검토한다. 신청 자체는 포털 이전 후(§5)에 한다. | still.coding.com |
| C7 | Google 로그인 OAuth 클라이언트가 어느 GCP 계정에 있는지 확인하고, **승인된 JavaScript 원본**에 새 주소를 추가한다 [미확인]. 피드백 API(`GOOGLE_CLIENT_ID`) → `https://user-feedback.still-coding.com`, Kim's Memo 공유 서버(`GOOGLE_CLIENT_ID`) → `https://memo.still-coding.com`. `.cc` 원본은 전환이 끝날 때까지 지우지 않는다. | GCP 소유 계정 |

### 2-2. 데이터 이사 브리지 (A2, A3, A5, A8용)

**목적**

- 301 리디렉트는 그대로 유지해서 검색엔진 신호를 깨끗하게 둔다.
- 그러면서 옛 출처의 저장 데이터를 한 번만 새 출처로 옮긴다.

**구성**

1. **`.cc` 쪽: 공용 Worker `cc-migrate-bridge`** (신규, kimiyohome)
   - 라우트: `study-hiragana.still-coding.cc/__migrate*`, `guitar-play…/__migrate*`, `piano-play…/__migrate*`, `bus-explorer…/__migrate*`, `study-hiragana…/sw.js`, `guitar-play…/sw.js`
   - `/__migrate/export`는 작은 HTML을 돌려준다. 이 페이지는 `.cc` 출처에서 실행된다.
     - 그 출처의 localStorage 전체를 읽는다.
     - JSON → gzip(CompressionStream) → base64url로 변환한다.
     - `https://<같은 라벨>.still-coding.com/__migrate/import#d=…`로 최상위 이동한다.
     - 데이터가 없으면 `#none`으로 이동한다.
   - fragment(`#` 뒤)는 서버로 전송되지 않으므로 로그에 남지 않는다.
   - `/sw.js`는 자기 해제 워커를 돌려준다. 이 워커는 캐시를 모두 지우고, 등록을 해제하고, 열린 탭을 새로고침한다.
   - §4의 리디렉트 규칙에서 `/__migrate`와 `/sw.js` 경로를 예외로 둔다.
2. **`.com` 쪽: 각 앱에 추가할 코드** (앱 저장소마다)
   - 첫 실행 시 확인: 자기 저장 키가 비어 있고 `sc-migrated` 표시도 없으면 `https://<라벨>.still-coding.cc/__migrate/export`로 한 번 이동한다. 새 방문자는 아주 짧게 왕복한다.
   - `/__migrate/import`:
     - fragment를 해석해 **앱별 허용 키 목록에 있는 것만** 쓴다.
     - 이미 값이 있는 키는 덮어쓰지 않는다.
     - `sc-migrated=1`을 기록한 뒤 `history.replaceState`로 fragment를 지우고 원래 경로로 이동한다.
   - 압축 후 1.5MB를 넘으면 자동 이전 대신 "백업 파일로 옮기기" 안내를 띄운다.
3. **유지 기간**: 6개월이 지나면 앱의 자동 이동 코드와 브리지 Worker를 제거하고 순수 301만 남긴다.

> 2-2는 앱마다 따로 만들지 않는다. 브리지 Worker는 하나만 두고, 앱 쪽 import 코드도 같은 스니펫에 키 목록만 바꿔 쓴다.

### 2-3. 피드백 API를 먼저 열어 두기 (S, 1차)

- 관리자 화면에서 모든 앱 프로젝트에 `.com` 출처를 **추가**한다. `.cc`는 아직 지우지 않는다.
- 이것을 먼저 해 두면 이후 앱 이전 순서에 의존하지 않게 된다. 상세는 §3-S.

---

## 3. 사이트별 작업

각 표의 "공통" 행은 모든 사이트에서 같은 작업이다.

- `canonical`, `og:url`, `hreflang`, JSON-LD, sitemap, robots의 도메인
- 포털과 다른 앱으로 가는 상호 링크
- 연락처 메일 `still.coding.cc@gmail.com` → `still.coding.com@gmail.com`
- 개인정보처리방침·약관의 도메인 표기와 **최종 업데이트 날짜**
- 피드백 위젯 `baseUrl` → `https://user-feedback.still-coding.com`
- 배포 라우트를 `.com`으로 교체 → 배포 → `.cc` 호스트를 §4 리디렉트 목록에 추가 → 포털 `src/data/apps.ts`의 해당 앱 URL 교체

### P. 포털 — still-coding

- 저장소: `E:\dev-e\jh-projects\still-coding`

| 구분 | 작업 |
| --- | --- |
| 설정 | `astro.config.mjs` `site`, `wrangler.jsonc` routes(`still-coding.com`, `www.still-coding.com`), `public/robots.txt` |
| 데이터 | `src/data/site.ts`: `url` → `.com`, `contactEmail` → `still.coding.com@gmail.com`. `src/data/policies.ts` 갱신일 |
| 링크 | `src/data/apps.ts`(앱별 이전 시점에 맞춰 교체), `AppVisual.astro`·`notes/[slug].astro`의 `dp.` 링크, `BaseLayout.astro`·`FeedbackWidget.astro`의 피드백 URL, `.env`의 `PUBLIC_FEEDBACK_BASE_URL` |
| 화면 | `index.astro`의 공유 URL·QR·표시 주소, `{,en/}privacy.astro`, `{,en/}terms.astro` |
| 콘텐츠 | `src/content/notes/**` 약 40편. 게임 도메인 링크 포함. 옛 `pinhole-game.` 링크는 `pinhole.`으로 정리 |
| 자산 | `scripts/build-brand-assets.py`의 OG 문구 → 실행해서 `og-still-coding.png` 재생성 |
| 문서 | `README.md`(공식 도메인·배포 절), `docs/APP_STANDARD.md`(앱 도메인 규칙 `<앱>.still-coding.com`, 연락처). 과거 점검 보고서는 당시 기록이므로 수정하지 않는다. |
| 개선(선택) | 앱 URL 하드코딩 대신 루트 도메인 상수(`APP_DOMAIN`) 하나로 모으기 |
| 검증 | `pnpm run build` 후 `dist/`에 `still-coding.cc`와 옛 메일이 없는지 확인. 단, 아직 이전 전인 앱 링크는 예외 |

### A1. Direct Play — direct-play-games

- 저장소: `D:\dev\jh-personal-projects\direct-play-games`

| 구분 | 작업 |
| --- | --- |
| 설정 | `wrangler.jsonc` routes: `dp.still-coding.com` + 게임 도메인 10개를 `.com`으로 **추가**한다. `.cc` 게임 도메인 10개는 **그대로 둔다.** `dp.still-coding.cc`는 제거하고 존 리디렉트로 넘긴다. |
| 변수 | `vars.APP_ORIGIN`, `NOMINATIM_USER_AGENT`, `NOMINATIM_REFERER` → `.com` |
| 빌드 | `scripts/build-public-pages.mjs`의 도메인 → 재생성. 대상은 `frontend/` 하위 게임·방침·약관·소개·문의 페이지(ko/en)와 `frontend/sitemap.xml`, `robots.txt` |
| 메일 | 12개 파일 (privacy, terms, contact, about, ko/en) |
| 테스트 | `scripts/public-pages.test.mjs`, `tests/game-domains.test.mjs`의 기대 도메인 |
| 문서 | `docs/game-entry-links.md`, `docs/games/README.md`, `docs/Direct-play-games-cloudflare-deploy-guide.md` |
| 데이터 | 브리지 불필요. 기록이 세션·방 단위라 유실 영향이 작다. 진행 중인 방이 끊기지 않도록 **이용이 적은 시간에 전환**한다. |
| 기타 | `flutter-app`에 도메인 하드코딩이 있는지 확인한다 [미확인]. API CORS는 `*`라 수정할 필요가 없다. |
| 검증 | `https://sum-drop.still-coding.cc/` → 302 → `https://dp.still-coding.com/?game=sum-drop` (한 번에 도착). `dp.still-coding.cc/rooms/…` 공유 링크 → 301 → `.com` 같은 경로 |

### A2. 가나 공방 — study-japanese-language-alphabet

- 저장소: `E:\dev-e\study-non-it\study-japanese-language-alphabet`

| 구분 | 작업 |
| --- | --- |
| 호스팅 | Pages 프로젝트 `study-hiragana-app-pages`의 **대시보드 Custom domains**에 `study-hiragana.still-coding.com`을 추가한다. `.cc`는 브리지 준비가 끝난 뒤 해제한다. 코드에는 라우트가 없다. |
| 링크 | `index.html`, `public/{contact,privacy,guide}/index.html`, `public/sitemap.xml`, `public/robots.txt`, `src/App.tsx` |
| 메일 | 문의·방침 페이지에 `still.coding.com@gmail.com`을 **신규 추가**한다. |
| 데이터 | **브리지 대상.** 허용 키: `kana-atelier-progress-v2`, `kana-atelier-progress-v1`, 피드백 위젯 키. `src/main.tsx` 부팅 시 첫 실행 확인을 추가한다. |
| 서비스 워커 | `.cc/sw.js`를 자기 해제 워커로 교체한다(브리지 Worker가 제공). `.com`에서는 기존 `public/sw.js`를 그대로 등록한다. |
| 순서 | ① `.com` 커스텀 도메인 추가 + 배포 → ② 브리지 라우트 연결 → ③ `.cc` Pages 커스텀 도메인 해제 + proxied 더미 레코드 → ④ 존 리디렉트(예외 경로 포함) |

### A3. Guitar Auto-Strum — guitar-app-web

- 저장소: `E:\dev-e\jh-projects\guitar-app-web`

| 구분 | 작업 |
| --- | --- |
| 설정 | `wrangler.jsonc` route → `guitar-play.still-coding.com` |
| 빌드 | 정적 HTML은 `site/layout.mjs`와 `site/pages/policy.mjs`에서 생성된다. 생성기를 고친 뒤 재생성한다. 대상은 `web-app/` 하위 rhythms 11, learn 5, guide, about, contact, privacy, terms 페이지와 `sitemap.xml`(23), `robots.txt` |
| 메일 | 5개 파일 |
| 데이터 | **브리지 대상.** localStorage: `guitar.songs.v1`, 코드 레이아웃 키 등 `backup.js`의 `BACKUP_STORAGE_KEYS`를 그대로 허용 목록으로 쓴다. **IndexedDB 악보 라이브러리는 기존 백업에 포함되지 않는다.** 브리지 export 페이지에서 악보가 있으면 "악보 백업 파일 받기" 버튼을 띄우고, `.com` 앱에 그 파일을 가져오는 기능을 추가한다. |
| 서비스 워커 | `web-app/js/register-sw.js`로 등록된 워커 → `.cc`에 자기 해제 워커를 둔다. 설치형 PWA 사용자에게 새 주소에서 다시 설치하라고 안내한다(앱 안 배너 + 가이드). |
| 문서 | `docs/workers-migration.md`, `docs/operations.md`, `README.md`, `web-app/README.md` |

### A4. CollaBoard — collaboard-app

- 저장소: `E:\dev-e\jh-projects\collaboard-app`

| 구분 | 작업 |
| --- | --- |
| 설정 | `wrangler.jsonc` route → `collaboard.still-coding.com` |
| 빌드 | `scripts/build-static-pages.mjs` → `frontend/` 하위 index, guide, privacy(ko/en), `sitemap.xml`, `robots.txt` 재생성 |
| 화면 코드 | `frontend/views/lobby.js`·`help.js`의 포털·Direct Play 링크. 도움말 문구 "collaboard.still-coding.cc의 사이트 데이터 삭제"도 수정. `frontend/core/i18n.js`의 대체 출처 |
| 메일 | 3개 파일 |
| 테스트·문서 | `test/i18n.test.js`, `docs/still-coding-portal-guide-2026-10-01.md`, `PRD.md` |
| 데이터 | 브리지 불필요. 방 세션 토큰과 투표 기록은 일시적이다. 진행 중인 방은 끊기므로 한가한 시간에 전환한다. |

### A5. Songnote (Piano Play) — Piano-SongNote

- 저장소: `E:\dev-e\jh-projects\Piano-SongNote`

| 구분 | 작업 |
| --- | --- |
| 설정 | `wrangler.jsonc` route → `piano-play.still-coding.com` |
| 링크 | `index.html`, `en/index.html`, `public/` 하위 about, contact, privacy, terms, guide, library 5종(ko/en), `404.html`, `sitemap.xml`(22), `robots.txt`. `src/main.jsx`의 라이브러리·푸터 링크, `src/guide.jsx` |
| 메일 | 4개 파일 |
| 테스트·문서 | `tests/locale.spec.js`, `README.md` |
| 데이터 | **브리지 대상.** 허용 키: `songnote-draft`, `songnote-drafts`, `songnote-versions`, `songnote-custom-pieces`. 초안·버전은 커질 수 있으므로 1.5MB를 넘을 때의 백업 경로(악보 내보내기)가 실제로 동작하는지 확인한다. |

### A6. Vocal Check — vocal-check-app

- 저장소: `E:\dev-e\jh-projects\vocal-check-app`

| 구분 | 작업 |
| --- | --- |
| 설정 | `wrangler.jsonc` route → `vocal-check.still-coding.com` |
| 링크 | 루트의 `index.html`, `en/index.html`, `guide`, `privacy`, `contact`(ko/en), `404.html`, `sitemap.xml`, `robots.txt`, `README.md`, `test-public.cjs` |
| 메일 | 문의·방침 페이지에 **신규 추가** |
| 데이터 | 없음. 가장 먼저 이전하는 시범 대상이다. |

### A7. PDF Flow Studio — pdf-flow-studio

- 저장소: `D:\dev\jh-personal-projects\pdf-flow-studio`

| 구분 | 작업 |
| --- | --- |
| 설정 | `wrangler.jsonc` route → `pdf-flow-studio.still-coding.com` |
| 링크 | `app/index.html`, `app/public/` 하위 contact, terms, privacy, guide(ko/en), `404.html`, `sitemap.xml`, `robots.txt`. `app/src/App.tsx` 포털 링크 |
| 메일 | 6개 파일 |
| 문서 | `cloudflare_deploy_guide.md`, `README.md` |
| 데이터 | 언어·펜 설정만 있다. 유실을 허용한다(브리지 불필요). |

### A8. Bus Explorer — bus-route-in-trip

- 저장소: `E:\dev-e\jh-projects\bus-route-in-trip`

| 구분 | 작업 |
| --- | --- |
| 호스팅 | 홈서버 터널의 공개 호스트 이름에 `bus-explorer.still-coding.com` → `localhost:8221`을 **추가**한다. `.cc` 호스트 이름은 브리지 준비가 끝나면 제거하고 존 리디렉트로 넘긴다 [미확인: 터널 구성]. |
| 코드 | `app/main.py`: `FEEDBACK_BASE_URL`, robots의 Sitemap, sitemap `<loc>` 도메인 (가능하면 환경변수 `PUBLIC_BASE_URL` 하나로) |
| 링크·메일 | `web/pages/` 하위 privacy, terms, guide, contact |
| 문서 | `docs/public-launch.md`(운영자 연락처), `docs/multi-city-expansion-plan.md` |
| 데이터 | **브리지 대상.** 허용 키: 도시(`CITY_KEY`), 선택 노선(`selectedRoutesKey()`), 저장 경로(`planner.js`의 `savedKey`) |

### S. 피드백 API — User-feedback-api

- 저장소: `E:\dev-e\jh-projects\User-feedback-api`

| 구분 | 작업 |
| --- | --- |
| 1차 (가장 먼저) | 관리자 화면 `/admin/projects`에서 각 앱 프로젝트에 `.com` 출처를 추가한다: 포털, dp, study-hiragana, guitar-play, collaboard, piano-play, vocal-check, pdf-flow-studio, bus-explorer |
| 2차 (호스트 이전) | 터널에 `user-feedback.still-coding.com` → `localhost:4100`을 추가한다. `.env`의 `APP_BASE_URL`을 `.com`으로 바꾸고 재시작한다. C7의 OAuth 원본을 추가한다. 관리자는 다시 로그인한다(쿠키는 호스트 단위). |
| 코드·문서 | `compose.yaml`·`.env.example`의 기본 `APP_BASE_URL`, `docs/widget-integration-guide.md`, `docs/admin-operation-guide.md`, `README.md`, `public/admin/projects.html`의 예시, `tests/unit/testers.test.js` |
| 마무리 (6개월 후) | 브리지를 제거할 때 `.cc` 출처도 DB에서 삭제한다. |

### M. Kim's Memo 원격 공유 서버 — `memo.`

- 저장소
  - 서버 + Tauri 앱(현행): `D:\dev\jh-personal-projects\kims-memo-markdowns` (서버는 `web-server-for-shareing/`)
  - Electron 앱(구버전 v1.0.16): `D:\dev\jh-personal-projects\kims-memo` — 같은 서버 코드를 담고 있다. 두 저장소의 `web-server-for-shareing/` 파일 목록은 동일하다(2026-10-03 확인).

**무엇에 쓰는가 (잊지 않도록)**

- 데스크톱 메모 앱 **Kim's Memo**의 "내 메모 공유" 기능을 위한 서버다. 집 PC에서 공유를 켜 두면, 밖에서 휴대폰이나 다른 PC 브라우저로 `memo.still-coding.cc`에 접속해 **그 PC의 메모를 검색·조회·작성·수정·삭제**할 수 있다.
- 서버가 하는 일은 **연결 중개뿐**이다.
  - 로그인: 이메일 회원가입·로그인, Google 로그인
  - 기기 관리: PC 이름 등록·해제, 같은 계정의 온라인 PC 목록, 공유 켜기·끄기
  - 연결: WebRTC 시그널링(`wss://…/ws`)으로 브라우저와 PC를 직접 연결
- **메모 제목과 본문은 서버에 저장하지 않는다.** 브라우저와 PC가 WebRTC로 직접 주고받는다. 서버 DB(SQLite `/data/share.db`)에는 계정과 기기 정보만 있다.
- 주소 구성: 웹 UI `/`, 상태 확인 `/health`, REST API `/memoapi`, 시그널링 `/ws`
- 호스팅: 홈서버 Docker Compose(`share-server`, 포트 3131, 볼륨 `share-sqlite`) + Cloudflare Tunnel. 2026-10-03 현재 접속 시 `502`. 컨테이너가 꺼져 있거나 터널이 끊긴 상태로 보이므로 이전 전에 먼저 살린다 [미확인]. 메인 PC의 `docker ps`에는 이 컨테이너가 없다. 다른 호스트에서 운영 중인지 확인한다.

**다른 사이트와 다른 점: 301로 바로 넘기면 기존 앱이 끊긴다**

- 데스크톱 앱 2종이 주소를 코드에 고정해 두었다.
  - `src-tauri/src/commands.rs` `REMOTE_SHARE_SERVER_URL`
  - `src/share/mainShareBootstrap.js`, `src/shareWindow/shareRenderer.js` `REMOTE_SHARE_SERVER_URL`
  - `src/shareWindow/share.html` 안내 문구, 숨은 `server-url` 값, 공유 사이트 열기 버튼
- WebSocket(`wss://…/ws`)은 리디렉트를 따라가지 않는다. 그리고 POST 요청은 301을 만나면 GET으로 바뀐다. 따라서 `.cc`를 301로 돌리면 **옛 버전 앱의 공유 기능이 바로 멈춘다.**
- 그래서 **같은 컨테이너에 두 주소를 함께 연결**해 두고, 내 PC들의 앱을 모두 새 버전으로 바꾼 뒤에야 `.cc`를 리디렉트로 돌린다.

| 순서 | 작업 |
| --- | --- |
| 1. 서버 복구 | 홈서버에서 `docker compose ps`로 `share-server` 상태를 확인하고, 터널의 `memo.still-coding.cc` 연결을 정상화한다. `/health`가 `200`을 돌려주는지 확인한다. |
| 2. 새 주소 추가 | 터널 공개 호스트 이름에 `memo.still-coding.com` → `http://localhost:3131`을 **추가**한다. `.cc`는 그대로 둔다. C7에서 OAuth 원본도 추가한다. |
| 3. 서버 코드 | 수정할 곳이 거의 없다. CORS가 열려 있고(`cors()`), 웹 UI는 `location.origin`을 기준으로 동작한다. `README.md`의 배포 주소(12곳)와 `.env.example` 설명만 바꾼다. |
| 4. 데스크톱 앱 | 두 저장소에서 위 고정 주소를 `https://memo.still-coding.com`으로 바꾸고 새 버전을 빌드한다(Tauri 앱, Electron 앱). 자동 업데이트 설정이 없으므로 **내 PC마다 직접 다시 설치**한다. |
| 5. 웹 사용 | 브라우저 로그인 토큰(`share_token`)은 주소별로 따로 저장되므로 새 주소에서 **한 번 다시 로그인**하면 된다. 계정과 기기 정보는 서버 DB에 그대로 있어 이전할 데이터가 없다. 휴대폰 북마크와 홈 화면 바로가기를 새 주소로 바꾼다. |
| 6. `.cc` 정리 | 모든 PC의 앱이 새 버전이 된 것을 확인한 뒤, `memo.still-coding.cc`를 터널 공개 호스트 이름에서 빼고 §4 리디렉트 목록에 추가한다. 그 다음 OAuth의 `.cc` 원본을 삭제한다. |

---

## 4. `.cc` 존 리디렉트 규칙 (kimiyohome, `still-coding.cc` 존)

- **Single Redirect 1개**로 처리한다.
  - 조건: `http.host in {공개 호스트 목록} and not starts_with(http.request.uri.path, "/__migrate") and http.request.uri.path ne "/sw.js"`
  - 대상: `https://` + (`www.` 제거, `.cc` → `.com`으로 바꾼 호스트) + 경로, 쿼리 유지, 301
  - 표현식에 `regex_replace`를 쓸 수 없으면 호스트별 규칙이나 Bulk Redirect 목록으로 대체한다.
- 공개 호스트 목록에는 해당 앱의 이전이 끝날 때마다 하나씩 추가한다.
  - 대상: `still-coding.cc`, `www.`, `dp.`, `study-hiragana.`, `guitar-play.`, `collaboard.`, `piano-play.`, `vocal-check.`, `pdf-flow-studio.`, `bus-explorer.`, `user-feedback.`, `memo.`(§3-M 6번 이후에만)
  - **게임 도메인 10개는 넣지 않는다.** Worker가 직접 처리한다(A1).
- Worker나 Pages, 터널에서 `.cc` 호스트를 떼어낸 뒤에는 그 호스트에 **proxied DNS 레코드(예: `AAAA 100::`)** 가 있어야 규칙이 동작한다.

---

## 5. 검색·광고 등록 (still.coding.com 계정)

1. **포털 이전 직후**
   - Search Console `.com` 속성에 `https://still-coding.com/sitemap.xml`을 제출한다.
   - `.cc` 속성에서 **주소 변경 도구**를 실행한다.
   - 하위 도메인은 301로 처리된다. 주소 변경 도구가 하위 도메인까지 적용되는지는 실행 화면에서 확인한다 [미확인].
2. **앱 이전마다** 해당 앱의 sitemap을 제출하고, 대표 URL은 URL 검사로 색인을 요청한다.
3. **Bing Webmaster Tools**: Search Console에서 가져오기 + 사이트 이동 도구
4. **AdSense** (모든 공개 앱 이전 후 권장)
   - 사이트 `still-coding.com`을 추가한다. 하위 도메인은 루트 승인에 포함된다.
   - 발급된 `ca-pub-…`를 포털 `.env`의 `PUBLIC_ADSENSE_CLIENT`에 넣고 재배포한다. `ads.txt`는 포털 루트에서만 노출된다.
   - 앱별 광고 코드에 게시자 ID를 반영하는 작업은 기존 AdSense 점검 문서를 따른다.
5. **외부 링크**: GitHub 프로필과 각 저장소의 About/homepage, 배포한 QR·명함·SNS, 수정 가능한 커뮤니티 글

---

## 6. 실행 순서

| 단계 | 내용 | 위험도 |
| --- | --- | --- |
| 1 | §2-1 C1~C7 계정·DNS 준비 | – |
| 2 | §2-3 피드백 API에 `.com` 출처 추가 | 낮음 |
| 3 | **A6 Vocal Check** 시범 이전. 리디렉트 규칙과 피드백 위젯을 검증한다. | 낮음 |
| 4 | **P 포털** 이전 → Search Console 주소 변경 | 중간 |
| 5 | **A7 PDF Flow Studio**, **A4 CollaBoard**, **A1 Direct Play** | 낮음~중간 |
| 6 | §2-2 브리지 Worker를 구축하고 테스트용 호스트로 검증 | – |
| 7 | **A5 Songnote** → **A8 Bus Explorer** → **A2 가나 공방** → **A3 기타**(IndexedDB 백업 포함) | 높음 |
| 8 | **S 피드백 API** 호스트 이전(2차) | 중간 |
| 8-1 | **M Kim's Memo** 서버 복구 → `.com` 병행 연결 → 데스크톱 앱 새 버전 설치 → `.cc` 리디렉트 | 중간 |
| 8-2 | **§8 `apigameroom.` 삭제** (이전 작업과 독립적이므로 언제든 가능) | 낮음 |
| 9 | §5 AdSense 신청, 외부 링크 갱신 | – |
| 10 | 4주 모니터링: Search Console 색인 이동, 크롤링 오류, 각 앱 피드백·방·PWA·데이터 이전 | – |
| 11 | 6개월 후: 브리지와 앱 자동 이동 코드 제거, 피드백 DB에서 `.cc` 출처 삭제 | – |

## 7. 사이트별 완료 기준

모든 사이트에서 다음을 확인한다.

- `curl -I https://<호스트>.still-coding.cc/<임의 경로>?x=1`이 `301`을 돌려주고 `location`이 `.com`의 **같은 경로와 쿼리**이며, 리디렉트가 한 번에 끝난다.
- `.com` 페이지 소스의 canonical, og:url, hreflang, sitemap, 메일이 모두 새 값이다. 저장소 `git grep "still-coding\.cc\|still\.coding\.cc@"` 결과에 의도된 예외만 남는다.
- 피드백 위젯이 열리고 제출된다(CORS, frame-ancestors).
- 브리지 대상 앱: `.cc`에 데이터를 만들어 두고 `.com`에 처음 접속했을 때 데이터가 그대로 보인다. 두 번째 접속부터는 왕복하지 않는다.
- 서비스 워커 앱: `.cc`에서 설치·캐시한 상태에서 다시 접속하면 새 주소로 이동한다.

---

## 8. 정리: `apigameroom.still-coding.cc` 삭제

**무엇이었나**

- Direct Play 초기 구조에서 게임 방 API로 가던 주소다.
  - 당시 구조: `Pages(프런트) → /apigameroom 프록시 → Tunnel → 홈서버 Docker gameapi(:8210)`
- 지금은 게임 방을 Cloudflare Worker의 Durable Objects가 처리한다. 현재 코드 어디에도 이 **호스트**를 부르는 곳이 없다.
  - `worker/utils.js`의 `/apigameroom` **경로 접두어** 제거 처리는 옛 클라이언트 호환용이다. 이것은 `dp.` 주소 안의 경로라서 이 호스트와는 무관하다.
- 2026-10-03 확인 결과
  - 접속하면 `403`
  - 메인 PC에 `gameapi` 컨테이너·볼륨 없음
  - 메인 PC에 방화벽 규칙 **"Open TCP Port 8210"(모든 프로필, 인바운드 허용)이 켜져 있음**

**삭제 순서** (모두 kimiyohome 계정과 홈서버에서 작업)

1. **사용 여부 확인**
   - 대시보드 → `still-coding.cc` → Analytics에서 호스트 `apigameroom.still-coding.cc`의 최근 30일 요청을 본다.
   - 봇 외의 실제 요청이 없으면 진행한다.
2. **터널 공개 호스트 이름 삭제**
   - Zero Trust → Networks → Tunnels → 해당 터널 → Public Hostnames에서 `apigameroom.still-coding.cc` 항목(서비스 `http://…:8210`)을 삭제한다.
3. **DNS 레코드 삭제**
   - `still-coding.cc` → DNS → Records에서 `apigameroom` 레코드(대개 `<터널ID>.cfargotunnel.com`을 가리키는 CNAME)를 삭제한다.
   - 2번에서 자동으로 지워지지 않는 경우가 있으니 반드시 확인한다.
4. **홈서버 정리**
   - 터널을 돌리는 모든 기기에서 `docker ps -a`로 `gameapi` / `direct-play-games-backend` 컨테이너를 찾는다.
   - 컨테이너가 있으면 `docker compose down`으로 내린다(`D:\dev\jh-personal-projects\direct-play-games`).
   - 볼륨 `gameapi-data`는 필요하면 백업한 뒤 삭제한다.
5. **방화벽 규칙 삭제** (메인 PC, 관리자 PowerShell)
   - 8210 포트를 쓰는 서비스가 없으므로 열어 둘 이유가 없다.

   ```powershell
   Remove-NetFirewallRule -DisplayName "Open TCP Port 8210"
   ```

6. **확인**
   - `nslookup apigameroom.still-coding.cc 1.1.1.1`이 주소를 돌려주지 않아야 한다(NXDOMAIN).
   - Direct Play에서 방 만들기·입장이 정상인지 확인한다.
7. **저장소 정리 (선택)**
   - `direct-play-games`의 `backend/`, `compose.yaml`, `open_port_8210.ps1`과 문서의 옛 구조 설명은 Direct Play 쪽 정리 작업에서 별도로 판단한다.
   - `/apigameroom` 경로 호환 코드는 옛 Pages 클라이언트가 더 없다고 판단될 때 제거한다.

