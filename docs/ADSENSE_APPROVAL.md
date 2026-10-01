# still-coding.cc AdSense 승인 준비 (최종본)

- 갱신일: 2026-10-01
- 이 문서는 `ADSENSE_APPROVAL.md`(신청 절차)와 `ADSENSE_REVIEW_2026-09-27.md`(사전 점검)를 하나로 합친 것이다. 두 문서는 이 문서로 대체되었다.
- 확인 방법 표시: **[확인]** 이 저장소의 코드·빌드 결과로 2026-09-30에 확인함 / **[9/27]** 하위 앱 저장소를 9월 27일에 점검한 결과이며 이후 다시 확인하지 않음 / **[미확인]** 대시보드나 외부 도구에서 봐야 함.
- 우선순위는 작업 순서를 정리한 것이며, Google의 공식 승인 기준이나 승인 보장이 아니다.

## 1. 지금 상태 한눈에

| 구분 | 상태 |
| --- | --- |
| 포털 코드·콘텐츠 준비 | 완료. 아래 미완료 항목은 모두 계정·대시보드·외부 확인 작업 |
| 개발 노트 | 35편 공개 (Direct Play 14, Bus Explorer 4, Guitar Auto-Strum 5, 가나 공방 5, CollaBoard 2, Songnote 2, Vocal Check 2, 포털 1). 초안·TODO 없음 |
| 신청 전에 사람이 해야 할 일 | AdSense 가입, 게시자 ID 입력 후 재배포, `/ads.txt` 확인, Search Console 등록, 트래픽 판단, CMP 검토, Cloudflare 봇 설정 확인 |

## 2. 체크리스트

### 완료 [확인]

- [x] 도메인·HTTPS 배포 (`astro.config.mjs` `site: "https://still-coding.cc"`)
- [x] `/privacy/`, `/en/privacy/` — 4항 "광고와 쿠키"에 제3자 쿠키 광고, 맞춤 광고 해제 방법 고지. 3항에서 앱별 방침으로 직접 링크
- [x] `/terms/`, `/en/terms/` — 푸터·사이트맵 포함
- [x] `/contact/` — 운영자 이메일 `still.coding.cc@gmail.com`(`src/data/site.ts`)과 GitHub 이슈 경로
- [x] 확인 코드 — `PUBLIC_ADSENSE_CLIENT`가 있으면 `BaseLayout.astro`가 `google-adsense-account` 메타와 `adsbygoogle.js`를 출력. 값이 없으면 아무것도 출력하지 않음
- [x] `/ads.txt` 생성 코드 — `src/pages/ads.txt.ts`. 값이 없으면 주석 한 줄만 내고 가짜 ID는 넣지 않음
- [x] `robots.txt`(전체 허용 + 사이트맵), `sitemap.xml` 자동 생성(`src/pages/sitemap.xml.ts`, 앱·노트 데이터 기반, 노트 `lastmod` 포함)
- [x] 고유 콘텐츠 — 앱 상세 7개, 개발 노트 35편. 초안은 공개 빌드에서 제외되고, `TODO(사용자)`가 남은 노트는 빌드가 실패하도록 막아 둠
- [x] 홈 한국어 본문(소개·최근 노트), 앱 ↔ 노트 상호 링크
- [x] 앱 설명 정확성 — Direct Play 9개 게임 표기, Pinhole Lab 카드 제거와 FAQ("Pinhole Lab은 어디로 갔나요?"), 가나 공방·Bus Explorer·Guitar·Songnote·Vocal Check의 `helpUrl`을 정적 `/guide/`로
- [x] 중복 호스트 정리 — `wrangler.jsonc`에서 `workers_dev: false`, `preview_urls: false`, `not_found_handling: "404-page"`(없는 경로는 진짜 404)
- [x] 게임 개발 노트 — Direct Play 게임 9개 모두 노트가 있음(포켓 레이스·스파이 게임은 기존 노트, 나머지 7개는 게임별 노트)

### 미완료

- [ ] **AdSense 계정 생성, 게시자 ID 확보** — 만 18세 이상, 지급용 개인정보·은행 정보 등록 필요 (사람만 할 수 있음)
- [ ] **`PUBLIC_ADSENSE_CLIENT` 입력 후 재배포** — 저장소 루트에 `.env`가 없음. `PUBLIC_ADSENSE_CLIENT=ca-pub-…`를 넣고 빌드·배포해야 확인 코드와 `/ads.txt` 판매자 행이 생긴다. 게시자 ID는 가입 즉시 발급되므로 **신청 전에** 넣는다
- [ ] **`www.still-coding.cc` → 루트 301** — 코드에는 `www`도 custom domain으로 남아 있어 같은 내용을 제공한다. Cloudflare Redirect Rule 설정 여부 [미확인]
- [ ] **Cloudflare 봇 설정** [미확인] — Bot Fight Mode나 "AI 봇 차단" 관리형 robots.txt가 `Googlebot`/`Mediapartners-Google`에 챌린지를 걸지 않는지 대시보드에서 확인. 막히면 "사이트를 검토할 수 없음"으로 거절된다
- [ ] **Search Console** — `still-coding.cc` 등록, 사이트맵 제출, 색인 생성 확인
- [ ] **실제 방문 트래픽** [미확인] — AdSense가 최소 수치를 명시하지는 않지만 검토자는 실제 이용 정황을 본다
- [ ] **EEA·영국·스위스 CMP** [미확인] — 해당 지역 방문자 비율을 측정하지 않았다. 개인정보처리방침은 "승인 후 도입 예정, 도입 전까지 해당 지역에는 광고 미게재"로 정정했다(10/1). 광고 단위를 붙이기 전에 CMP 도입 또는 지역 제외를 실제로 구현해야 한다(승인 자체와는 별개 작업)
- [ ] **하위 앱 저장소 조치** — 아래 4절. 마지막 점검(9/27) 이후 다시 확인하지 않았다

### 선택 (P2)

- [ ] 구조화 데이터 — 현재는 `ItemList`만 있다. `WebSite`와 `Person`(JH Kim, `sameAs` GitHub) 추가 [확인: BaseLayout에 없음]
- [ ] OG 이미지 형식 — 새 앱 아이콘으로 교체됨(9/29). 카카오톡 등 미리보기에서 `.webp` 호환성은 [미확인]

## 3. 신청 절차

```
계정 생성 → 사이트 등록 → 검토 통과? ──아니오──▶ 거절 사유 확인 ──(수정 후 검토 요청)──┐
                              │                                                │
                             예                                                │
                              ▼                                                │
                          게재 설정 → 게재 시작                                  │
                              ▲                                                │
                              └────────────────────────────────────────────────┘
```

1. **계정 생성** — Google 계정으로 [adsense.google.com](https://www.google.com/adsense/start/)에서 가입한다.
2. **게시자 ID 반영** — `.env`에 `PUBLIC_ADSENSE_CLIENT=ca-pub-…`를 넣고 `pnpm run build`(`astro check && astro build`) 후 `pnpm run deploy`(`wrangler deploy`)한다.
3. **배포 확인** — 실제 도메인에서 `view-source:https://still-coding.cc/`로 `<meta name="google-adsense-account">`를 확인하고, `https://still-coding.cc/ads.txt`가 `text/plain`으로 `google.com, pub-…, DIRECT, f08c47fec0942fa0` 한 줄을 돌려주는지 본다. 404 페이지나 HTML이 대신 나오면 안 된다.
4. **사이트 등록** — `still-coding.cc`를 등록하고 소유권을 확인한다. 루트 도메인 하나만 등록한다.
5. **검토 대기** — 보통 수일에서 수 주. Google은 처리 기간을 보장하지 않는다.
6. **결과 통보** — 이메일과 대시보드로 승인 또는 거절이 통보된다.

### 원칙

- **ads.txt** — Google은 루트 도메인의 `https://still-coding.cc/ads.txt`를 확인한다. 하위 도메인마다 둘 필요가 없고, 두려면 실제 ID만 넣는다. 플레이스홀더(`pub-XXXX…`) 행은 두지 않는다.
- **승인 범위** — 루트 도메인이 승인되면 `*.still-coding.cc` 하위 앱에도 같은 계정으로 광고를 게재할 수 있다. 다만 광고가 나오는 모든 페이지는 프로그램 정책을 지켜야 한다.
- **확인 코드와 광고 단위** — `adsbygoogle.js`는 공식 확인 방법 중 하나이며, 승인 전에는 광고가 표시되지 않을 뿐이다. 개별 광고 단위(`<ins class="adsbygoogle">`)나 Auto Ads는 승인 후 읽을거리가 있는 페이지에만 추가한다.
- **광고 배치** — 게임·측정·편집 화면처럼 조작하는 곳 근처에 광고를 두면 실수 클릭 유도로 제재받을 수 있다. Songnote와 Vocal Check의 `ads.js` 허용 목록(읽기 페이지만 허용) 방식을 모범으로 삼는다.
- **포털 링크** — 모든 앱의 헤더나 푸터에 `still-coding.cc`로 돌아가는 링크를 둔다.
- 검토 중에는 사이트를 자유롭게 고쳐도 되지만 이미 넣은 확인 코드를 임의로 빼지 않는다.

## 4. 하위 앱 점검표 [9/27 기준, 재확인 필요]

점검 환경의 네트워크 제한으로 배포 URL에는 접속하지 못하고 각 저장소의 소스와 배포 설정만 봤다. 배포본이 저장소와 다르면 결과도 다를 수 있다.

| 앱 (도메인 / 저장소) | 공개 정적 페이지 | robots / sitemap | 광고 고지 | 포털 링크 | 남은 조치 |
| --- | --- | --- | --- | --- | --- |
| Direct Play (`dp` / kimiyo/direct-play-games) | about, privacy, terms, contact, 게임 가이드 9개 (ko/en) | 있음, 방·API 경로 차단 | 있음 | 있음 | 없음. 가장 잘 갖춰짐 |
| 가나 공방 (`study-hiragana` / study-japanese-language-alphabet) | guide, privacy, contact | 있음 | 있음(Google 언급 없음) | 있음 | 개인정보 문서에 Google 광고 쿠키와 해제 링크 명시 |
| CollaBoard (`collaboard` / collaboard-app) | `/guide/`, `/privacy/`, `/en/` 변형 정적 페이지 배포 [10/1 확인: 200]. 해시 뷰도 유지 | 정적 URL 사이트맵으로 교체됨. Search Console에 별도 속성으로 등록 필요 | 있음 | 있음 | 포털 링크는 `/guide/`, `/privacy/`로 교체함(10/1). `frontend/ads.txt`의 가짜 `pub-XXXXXXXXXXXXXXXX` 행이 10/1 점검 때 배포본에 남아 있었으므로 삭제 배포 여부 재확인 |
| Bus Explorer (`bus-explorer` / bus-route-in-trip) | about, guide, privacy, terms, contact | 있음 | 있음 | 정보 페이지에는 있고 **메인에는 없음** | 메인에 포털 링크와 `<meta name="description">` 추가(title이 "Bus Explorer"뿐) |
| Songnote (`piano-play` / piano-songnote) | about, guide, library 5편, privacy, terms, contact (ko/en) | 있음 | 있음(Google 언급 없음) | 있음 | 모범 사례. 개인정보 문서에 Google 광고 쿠키 문구만 보강 |
| Vocal Check (`vocal-check` / vocal-check-app) | guide, privacy, contact (ko/en) | 있음 | 있음 | 있음 | 모범 사례 |
| Guitar Auto-Strum (`guitar-play`) | 9/27 점검 이후 공개 앱이 됨 | 점검 안 함 | 점검 안 함 | 점검 안 함 | `/guide/`, `/privacy/`, robots·sitemap, 포털 링크를 다른 앱과 같은 기준으로 점검 |
| PDF Flow Studio (`pdf-flow-studio` / pdf-flow-studio) | guide, privacy, terms, contact (ko/en 정적 HTML) | 있음 (전체 허용 + sitemap.xml) | 있음 (Google 광고 쿠키, 해제 링크, 워크스페이스 비적격) | 있음 (헤더/푸터) | 없음. 모범 사례로 구축 완료 [9/30 확인] |

Pinhole Lab(`pinhole-game.still-coding.cc`)은 서비스를 종료했다. PINHOLE·SUM DROP은 Direct Play(`dp`)로 이식했고, 포털 카드와 코드의 참조는 모두 없다(2026-10-01 확인). 도메인은 연결되지 않는다. Cloudflare DNS·커스텀 도메인 레코드가 남아 있는지는 대시보드에서 확인해 정리한다 [미확인].

## 5. 콘텐츠 및 정책 요구사항

Google이 가장 자주 거절하는 사유는 정책 위반이 아니라 검토할 수 있는 고유 콘텐츠 부족이다.

| 항목 | 요구사항 | still-coding.cc 현황 |
| --- | --- | --- |
| 고유 콘텐츠 | 다른 사이트에 없는 자체 설명·평가·문서가 충분해야 함 | 개발 노트 35편(평균 약 9KB, 실제 코드와 대조한 글), 앱 상세 7개 [확인] |
| 탐색 가능성 | 메뉴·링크로 이동이 명확해야 함 | 홈 → 앱 → 관련 노트, 노트 → 앱 양방향 링크 [확인] |
| 개인정보처리방침 | 실제 데이터 처리와 광고 쿠키 사용 공개 | ko/en 게시 [확인] |
| 연락처 | 운영자에게 닿는 경로 | 이메일과 GitHub 이슈 [확인] |
| 네비게이션 | 실수 클릭 유도 UI 금지 | 앱 조작 화면에 광고를 두지 않고 포털·소개·노트 영역으로 제한 |
| 금지 콘텐츠 | 성인·폭력·저작권 침해 등 없음 | 포트폴리오 성격상 해당 없음. PINHOLE 문제 이미지의 재배포 권리는 확인하지 못했다고 Direct Play 저장소 `ATTRIBUTION.md`에 기록됨 |
| 사이트 안정성 | 404·깨진 링크 없이 정상 작동 | 없는 경로는 404 [확인]. 노트끼리 링크가 서로 연결되므로 공개 후 링크 검사 권장 |
| 유럽/영국 방문자 | CMP 적용 검토 | 미측정 [미확인] |

참고: [AdSense에 적합한 사이트 준비](https://support.google.com/adsense/answer/7299563), [EEA·영국 CMP 요건](https://support.google.com/adsense/answer/13554116)

### 콘텐츠 유지

- 노트는 계속 추가하되 같은 문장을 영어로 옮겨 분량만 늘리는 방식은 효과가 없다. 실제 개발 경험이 담긴 글이 가장 설득력 있다.
- 앱 상세 페이지에는 실제 화면, 핵심 기능, 만든 배경, 기술 스택, 변경 이력을 채울수록 좋다.
- 신규 노트는 `draft: true`로 시작하고 `TODO(사용자)`를 모두 해결한 뒤 공개한다(공개된 노트에 TODO가 남으면 빌드가 실패한다).

## 6. 흔한 거절 사유와 대응

| 거절 사유(Google 통지 문구) | 의미 | 점검할 점 |
| --- | --- | --- |
| Low value content | 콘텐츠가 얕다 | 앱 소개가 카드 요약에 그치지 않고 사용법·대상·제약, 노트로 이어지는지 |
| Unable to review site | 크롤러가 사이트를 읽지 못함 | Cloudflare 봇 설정, robots.txt, JS 없이 렌더링(Astro 정적 빌드로 대부분 해소) |
| Site under construction / navigation issues | 개발 중 페이지가 섞임 | 미완성 페이지에 `noindex`, 사이트맵 제외 (초안 노트는 이미 제외됨) |
| Insufficient traffic | 실제 이용을 확인할 수 없음 | 공식 최소 수치는 없음. 방문자를 늘린 뒤 재신청이 안전 |
| Violation of Google policies | 정책 위반 콘텐츠 | 하위 앱의 사용자 생성 콘텐츠(Direct Play 방 이름 등) 점검 |
| Additional review required | 계정 수준 추가 검토 | 자동 결정이며 대응 방법은 대기뿐 |

거절되면 대시보드 사이트 상태에서 사유를 확인하고, 수정이 실제 배포에 반영됐는지 확인한 뒤 같은 계정으로 검토를 다시 요청한다(새 계정 불필요). 개선 없이 반복 요청하면 검토 지연이나 계정 제한으로 이어질 수 있다.

## 7. 승인 이후

- **광고 단위 배치** — 포털·앱 소개·노트처럼 읽을거리가 있는 화면에만 후보 영역을 검토한다. 앱 조작 화면에는 Auto Ads를 일괄 적용하지 않는다.
- **Auto Ads 제외** — 사용한다면 앱 조작 경로(URL 패턴)를 제외 목록에 넣는다.
- **화면 검증** — 광고와 조작 요소의 거리, CLS, 닫기·스크롤 동작을 360/768/1280px에서 확인한다.
- **CMP** — 유럽 방문자가 있으면 광고 게재 전에 적용한다.
- **모니터링** — 리포트로 노출·클릭률·수익을 보고 Policy Center 경고를 수시로 확인한다.
- **계정 보호** — 본인 광고 클릭, 부정 트래픽 유도, 정책 위반 콘텐츠 추가를 피한다. 승인 후에도 재검토가 계속된다.

## 8. 권장 실행 순서 (남은 일)

1. 하위 앱 저장소 조치: CollaBoard의 가짜 `ads.txt` 삭제 배포 확인, PDF Flow Studio의 soft 404(`/zzz-nope`가 200)와 `/ads.txt` HTML 응답 수정, 가나 공방·Songnote 개인정보 문구 보강, Bus Explorer 메인 링크, Guitar Auto-Strum 점검, Pinhole Lab DNS 레코드 정리
2. Cloudflare: `www` → 루트 301 Redirect Rule, 봇 설정 확인
3. Search Console에 `still-coding.cc` 등록, 사이트맵 제출, 색인 확인 (노트 35편이 색인되는지)
4. 방문 트래픽이 어느 정도 쌓였는지 판단
5. AdSense 가입 → 게시자 ID를 `.env`에 넣고 재배포 → `view-source:`와 `/ads.txt` 확인
6. AdSense에서 사이트 등록 및 검토 요청

참고:
[AdSense 프로그램 정책](https://support.google.com/adsense/answer/48182) ·
[개인정보처리방침 필수 내용](https://support.google.com/adsense/answer/1348695) ·
[사이트 준비](https://support.google.com/adsense/answer/7299563) ·
[ads.txt](https://support.google.com/adsense/answer/12171612) ·
[EEA·영국 CMP 요건](https://support.google.com/adsense/answer/13554116)
