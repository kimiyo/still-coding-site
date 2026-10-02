# still-coding.cc AdSense 승인 전 심층 점검 보고서

- 점검일: 2026-10-01 (진행 현황 갱신: 2026-10-02, 0절)
- 대상: `still-coding.cc`(포털) + 하위 도메인 8개(dp, study-hiragana, guitar-play, collaboard, piano-play, vocal-check, pdf-flow-studio, bus-explorer)
- 근거 표기
  - **[빌드]** 포털 저장소를 `pnpm run build`로 빌드한 `dist/` 97페이지를 스크립트로 전수 점검
  - **[소스]** 각 하위 앱 저장소의 기본 브랜치 최신 커밋을 직접 읽음
  - **[미확인]** 실제 배포본·대시보드에서만 확인 가능 (이번 점검 환경은 네트워크 정책상 `still-coding.cc`에 접속할 수 없었음)
- 이 문서의 우선순위는 작업 순서이며 Google의 공식 승인 기준이나 승인 보장이 아니다. 기존 체크리스트는 `docs/ADSENSE_APPROVAL.md`를 따른다.

| 하위 앱 | 저장소 | 점검 커밋 |
| --- | --- | --- |
| Direct Play (`dp`) | direct-play-games | 5514d57 (10/01) |
| 가나 공방 (`study-hiragana`) | study-japanese-language-alphabet | f17d5b9 (09/26) |
| Guitar Auto-Strum (`guitar-play`) | guitar-app-web | 83a1e01 (09/29) |
| CollaBoard (`collaboard`) | collaboard-app | 984664a (10/01) |
| Songnote (`piano-play`) | piano-songnote | 0b83115 (09/27) |
| Vocal Check (`vocal-check`) | vocal-check-app | a1ac345 (09/28) |
| PDF Flow Studio (`pdf-flow-studio`) | pdf-flow-studio | d5a47f7 (10/01) |
| Bus Explorer (`bus-explorer`) | bus-route-in-trip | 83ece98 (09/27) |

---

## 0. 진행 현황 (2026-10-02 갱신)

- 기준: 포털 `66d35e6`(10/02 배포 완료, 운영자 확인), 하위 앱 저장소 `main` 최신 커밋. 실제 배포본은 이번에도 네트워크 정책상 직접 열어 보지 못했다 [미확인].
- **노트 수 정정:** 처음 점검 때 "35편"으로 적었으나 실제 공개 노트는 **38편**이다(기존 문서의 숫자를 그대로 옮긴 오류). 이하 본문의 35편은 38편으로 읽는다.

### 0-1. 항목별 상태

| # | 항목 | 상태 | 근거 |
| --- | --- | --- | --- |
| 2-1 | 미래 게시일 노트 8편 | ✅ 완료 | `2638c7d` — 8편 `pubDate`를 10/01로 수정, 미래 날짜면 빌드 실패하는 검사 추가. `lastmod`도 09/27·10/01만 남음 |
| 2-2 | 노트 JSON-LD 누락 | ✅ 완료 | `cc17f57` — `TechArticle` 38개, `BreadcrumbList` 31개(태그·허브 페이지도 같은 원인이었음) 출력 |
| 2-3 | 게시자 ID 반영 | ⏳ 대기 | AdSense 가입 후 `.env`에 `PUBLIC_ADSENSE_CLIENT` 입력·재배포 필요 |
| 2-4 | Search Console 색인 | ⏳ 미착수 [미확인] | 도메인 속성 등록·사이트맵 제출·URL 검사 |
| 3-1 | 얇은 태그/허브 페이지 | ⏳ 미착수 | 사이트맵 96 URL 중 태그 23·허브 8 그대로 |
| 3-2 | About 보강 | ⏳ 미착수 | `/about/` 474자 그대로 |
| 3-3 | 방침 갱신일 | ✅ 완료 | `e878a1b` 최종 업데이트 10/01, `23d1c54` 날짜를 `src/data/policies.ts`로 일원화하고 7항을 "최종 업데이트 날짜와 내용을 함께 갱신"으로 변경 |
| 3-4 | 중복 호스트 — workers.dev | ✅ 완료(소스) | Direct Play `96420ad`, Guitar `f43d398`, PDF Flow Studio `28c5493`에서 `workers_dev`·`preview_urls` 모두 `false`. 각 앱 재배포 여부 [미확인] |
| 3-4 | 중복 호스트 — `www` 301 | ⏳ 미착수 [미확인] | Cloudflare Redirect Rule 필요 |
| 3-4 | Guitar 구 Pages, 가나 공방 pages.dev | ⏳ 미확인 | Cloudflare 대시보드 확인 필요 |
| 3-4 | Songnote·Vocal Check·CollaBoard `workers_dev` 명시 | ⏳ 미착수 | 세 저장소 변경 없음(낮은 우선순위) |
| 3-5 | Bus Explorer 메인 메타·포털 링크 | ⏳ 미착수 | `web/index.html`에 description·canonical·포털 링크 없음 |
| 3-5 | Guitar 메인 canonical·포털 링크 | ⏳ 미착수 | `web-app/index.html`에 둘 다 없음 |
| 3-6 | PDF Flow Studio 사용법 링크 | ✅ 완료 | 포털 `42aca21`·`66d35e6`(ko `/guide/`, en `/en/guide/`), 앱 `183fc4e`(영어 가이드 추가, 사이트맵 등록). 단, 두 가이드는 `noindex` 리다이렉트 페이지 |
| 3-7 | 콘텐츠 공개 속도 | ⏳ 진행 중 | 신청 전까지 며칠 간격으로 노트 추가 |
| 4-1 | 하위 앱 방침 광고 문구 | 승인 후 | 변경 없음(현재 사실과 일치) |
| 4-2 | CMP 설정 | 승인 후 | — |
| 4-3 | 404 메타 | ⏳ 미착수 | `404.html`에 `canonical=/404/` 그대로, `noindex` 없음 |
| 4-4 | 한국어 홈 title | ⏳ 미착수 | ko/en 모두 `Still Coding — Ideas, made real.` |
| 4-5 | 홈 `WebSite`·`Person` | ⏳ 미착수 | `ItemList`만 있음 |
| 4-6 | Bus Explorer FastAPI 문서 | ⏳ 미착수 | 저장소 변경 없음 |

### 0-2. 남은 일 (권장 순서)

1. **[포털 코드]** 4-3 404 `noindex`, 3-1 얇은 태그 페이지 `noindex`·사이트맵 제외, 3-2 About 보강, 4-4 한국어 title, 4-5 `WebSite`·`Person`
2. **[하위 앱 코드]** 3-5 Bus Explorer·Guitar 메인 메타·포털 링크, 4-6 FastAPI 문서 비활성화
3. **[배포 확인]** Direct Play·Guitar·PDF Flow Studio 재배포 후 workers.dev 주소가 더 이상 열리지 않는지 확인
4. **[Cloudflare]** `www` → 루트 301, Bot Fight Mode·AI 봇 차단 확인, Guitar 구 Pages·가나 공방 pages.dev 정리, Pinhole Lab DNS 정리
5. **[Search Console]** 등록·사이트맵 제출·색인 확인
6. **[AdSense]** 가입 → 게시자 ID 반영·재배포 → 사이트 등록·검토 요청

---

## 1. 종합 판정

포털의 **필수 요건(개인정보처리방침·약관·문의·고유 콘텐츠·탐색 구조·robots/sitemap·ads.txt 코드)은 충실히 갖춰져 있다.** 개발 노트 35편은 평균 본문 약 5,000자로, AdSense 거절 사유 1순위인 "가치가 낮은 콘텐츠"에 대한 방어력이 높은 편이다.

다만 이번 점검에서 **기존 문서에 없던 문제 4건**을 새로 발견했다. 그중 2건(미래 게시일, 구조화 데이터 누락)은 코드 수정만으로 바로 해결된다.

| 구분 | 건수 | 요약 |
| --- | --- | --- |
| 🔴 신청 전 반드시 해결 | 4 | 미래 게시일 노트 8편, `TechArticle` JSON-LD 전량 누락, 게시자 ID 미반영, Search Console 색인 미확인 |
| 🟠 신청 전 권장 | 7 | 얇은 태그/허브 페이지 색인, About 분량, 개인정보방침 갱신일 불일치, 중복 호스트(www·workers.dev·pages.dev), 하위 앱 3곳 포털 링크·메타 누락 등 |
| 🟡 승인 후/개선 | 6 | 하위 앱 개인정보방침 광고 문구 통일, CMP, 404 메타, 홈 title, FastAPI 문서 노출 등 |

---

## 2. 🔴 신청 전 반드시 해결

### 2-1. 노트 8편의 게시일이 미래 날짜 (신규 발견) [빌드]

오늘(10/01) 기준으로 아직 오지 않은 날짜가 `pubDate`에 들어가 있는데, 빌드는 이를 걸러내지 않고 이미 공개하고 있다.

| pubDate | 편수 | 파일 |
| --- | --- | --- |
| 2026-10-02 | 2 | `bus-explorer-live-cache`, `bus-explorer-segment-observation` |
| 2026-10-03 | 3 | `kana-atelier-extended-kana-rules`, `kana-atelier-service-worker-mime-error`, `kana-atelier-typing-lab-ime` |
| 2026-10-04 | 3 | `guitar-auto-strum-golden-transport-test`, `…-string-physical-model`, `…-swing-humanize` |

**영향**
- 화면에 "2026년 10월 4일" 같은 미래 날짜가 바이라인으로 표시된다. 검토자 입장에서는 날짜를 조작했거나 자동 생성된 콘텐츠로 의심할 단서다.
- `sitemap.xml`의 `<lastmod>` 22개가 미래 날짜다(10/02 4개, 10/03 8개, 10/04 10개; 태그·허브 페이지가 최신 노트 날짜를 상속). Google은 부정확한 `lastmod`를 신뢰하지 않고 무시하게 된다.
- 홈과 `/notes/`의 "최근 노트" 정렬 맨 위에 미래 날짜 글이 온다.

**조치**
1. 8편의 `pubDate`를 실제 공개일(10/01 또는 실제 작성일)로 고친다.
2. 재발 방지: `src/lib/notes.ts`의 `getSortedNotes()`에 아래 검사를 추가해 빌드를 실패시킨다(정적 빌드라 날짜 필터링으로 "예약 발행"을 흉내 내면 재빌드 시점에 따라 결과가 달라지므로, 필터보다 **빌드 실패**가 안전하다).
   ```ts
   const now = Date.now();
   for (const note of all) {
     if (!note.data.draft && note.data.pubDate.valueOf() > now) {
       throw new Error(`Note "${note.id}" has a future pubDate. Keep it draft: true until it is published.`);
     }
   }
   ```

### 2-2. 노트 35편의 `TechArticle` 구조화 데이터가 출력되지 않음 (신규 발견) [빌드]

`src/pages/notes/[slug].astro`는 `TechArticle` JSON-LD(작성자, 게시일, 수정일)를 `<script slot="head">`로 넘기지만, 중간의 `src/layouts/InfoLayout.astro`가 `head` 슬롯을 `BaseLayout`으로 **전달하지 않는다.** Astro는 받지 않은 이름 있는 슬롯을 조용히 버리므로 빌드 결과물 35개 노트 모두에 `application/ld+json`이 0개다.

```
$ grep -c "ld+json" dist/notes/direct-play-spy-game-secrets/index.html
0
```

**조치** — `InfoLayout.astro`의 `<BaseLayout …>` 안에 한 줄을 추가한다.
```astro
<BaseLayout title={title} description={description} locale={locale} translated={translated} ogType={ogType}>
  <slot name="head" slot="head" />
  <header class="info-header">…
```
작성자(`Person`)·게시일 정보가 기계적으로 읽히게 되어 E-E-A-T(작성자 신원) 신호에 도움이 된다. 수정 후 `dist/notes/*/index.html`에서 `ld+json`이 나오는지 확인한다.

### 2-3. 게시자 ID 반영 및 배포 확인 [소스 / 미확인]

`dist/ads.txt`는 현재 `# Still Coding ads.txt — no authorized sellers are configured yet.` 한 줄이고, `google-adsense-account` 메타도 없다. 코드는 올바르게 준비되어 있으므로 `.env`에 `PUBLIC_ADSENSE_CLIENT=ca-pub-…`를 넣고 재배포하면 된다(기존 문서 절차와 동일). 사이트 등록 **전에** 배포를 끝내야 소유권 확인이 된다.

### 2-4. Search Console 색인 확인 [미확인]

사이트의 첫 커밋은 2026-09-14이고 노트 26편이 10/01 하루에 공개되었다. 사이트가 생긴 지 약 2.5주라 **Google 색인이 아직 거의 없을 가능성이 높다.** AdSense 검토는 Google이 사이트를 읽을 수 있는지에 크게 의존하므로:

1. Search Console에 `still-coding.cc` 도메인 속성 등록 → `sitemap.xml` 제출
2. URL 검사로 홈·노트 몇 편이 "Google에 등록됨"이 될 때까지 기다린 뒤 신청
3. 같은 화면의 "실제 URL 테스트"로 Googlebot이 Cloudflare 챌린지 없이 200을 받는지 확인(Bot Fight Mode / AI 봇 차단 설정 점검을 겸함)

---

## 3. 🟠 신청 전 권장

### 3-1. 얇은 목록 페이지 26개가 사이트맵에 포함됨 [빌드]

사이트맵 96개 URL 중 **태그 페이지 23개**와 **앱별 노트 허브 8개**는 노트 제목 목록뿐인 페이지다. 본문 분량(헤더·푸터 제외)이 작다.

| 페이지 | 본문 글자 수 |
| --- | --- |
| `/notes/tag/websocket/` | 439 |
| `/notes/tag/p2p/` | 447 |
| `/notes/tag/dsp/` | 490 |
| `/notes/tag/debugging/` | 494 |
| `/notes/app/collaboard/`, `/notes/app/vocal-check/` | 511 |
| (참고) 노트 본문 평균 | 약 5,000 |

얇은 페이지 비율이 높으면 "가치가 낮은 콘텐츠" 판정에 불리하다. **노트가 1~2편뿐인 태그 페이지는 `<meta name="robots" content="noindex,follow">`를 붙이고 사이트맵에서 제외**하는 것을 권한다(링크는 유지되므로 탐색성은 그대로). `BaseLayout`에 `noindex?: boolean` prop을 추가하고 `sitemap.xml.ts`의 `tagGroups` 매핑에 같은 기준(예: 노트 3편 미만 제외)을 적용하면 된다. 앱 허브 페이지는 앱 소개 1~2문단을 덧붙여 고유 설명을 갖게 하는 쪽이 낫다.

### 3-2. About 페이지가 너무 짧음 (474자) [빌드]

AdSense 검토자와 Google 품질 평가는 "누가 운영하는가"를 본다. 현재 `/about/`은 세 문단, 474자로 운영자 소개가 "JH Kim — 아이디어를 설계하고 코드로 만들고 직접 운영합니다." 한 줄이다. Direct Play는 운영자를 "김종훈(대한민국)"으로 명시하고 있어 포털보다 오히려 구체적이다.

권장 보강(1,500자 이상 목표):
- 운영자 소개: 개발 경력·관심 분야, 앱을 만드는 이유, 운영 국가
- 사이트 운영 원칙: 앱별 데이터 처리 방침, 광고 배치 원칙(조작 화면 제외), 노트 작성 방식(실제 코드와 대조)
- 앱 목록과 노트 허브로 가는 링크, GitHub 링크
- 포털과 하위 앱의 운영자 표기 통일(예: "김종훈(JH Kim)")

### 3-3. 개인정보처리방침 "최종 업데이트" 날짜가 실제와 다름 [소스]

`privacy.astro`와 `en/privacy.astro`는 9/30(PDF Flow Studio 추가), 10/01(CMP 문구 정정)에 내용이 바뀌었지만 표시는 여전히 `최종 업데이트 2026년 9월 27일` / `Updated September 27, 2026`이다. 방침 7항에 "광고 방식이 바뀌면 시행일과 내용을 함께 업데이트합니다"라고 적혀 있어 스스로의 약속과 어긋난다. **두 파일 모두 `2026년 10월 1일`로 갱신**한다.

### 3-4. 같은 콘텐츠를 내보내는 중복 호스트 [소스 / 미확인]

| 호스트 | 근거 | 조치 |
| --- | --- | --- |
| `www.still-coding.cc` | 포털 `wrangler.jsonc`에 custom domain으로 등록, 리다이렉트 없음 | Cloudflare Redirect Rule로 루트에 301 (기존 문서의 미완료 항목) |
| `direct-play-games.*.workers.dev` | `workers_dev: true` | `false`로 바꾸거나 Worker에서 `APP_ORIGIN` 외 호스트를 301 |
| `guitar-auto-strum-app.*.workers.dev` + 미리보기 URL | `workers_dev: true`, `preview_urls: true` | 둘 다 `false` |
| Guitar 구 Pages 프로젝트(`*.pages.dev`) | `wrangler.jsonc` 주석: "Pages project stays up" | 이전 완료 후 Pages 프로젝트 삭제 [미확인] |
| `pdf-flow-studio.*.workers.dev` | `workers_dev: true` | `false` |
| 가나 공방 `*.pages.dev` | Cloudflare Pages 배포 | canonical은 있음. 가능하면 Pages 프로젝트에서 pages.dev 접근 차단 [미확인] |
| Songnote·Vocal Check·CollaBoard | `workers_dev` 미지정 | 명시적으로 `false` 지정 권장 |

포털 자체는 `canonical`이 모든 페이지에 정확히 들어가 있어(97/97 일치 확인) 피해가 적지만, 하위 앱의 workers.dev 사본은 canonical이 없는 앱(Guitar)에서 그대로 중복 색인될 수 있다.

### 3-5. 하위 앱 메인 화면의 포털 링크·메타 누락 [소스]

| 앱 | 메인 `<title>` | description | canonical | 메인 화면 포털 링크 |
| --- | --- | --- | --- | --- |
| Direct Play | 다이렉트 플레이 | ✅ | ✅ | ✅ |
| 가나 공방 | ✅ 충실 | ✅ | ✅ | ✅ |
| **Guitar Auto-Strum** | Guitar Auto-Strum | ✅ | ❌ | ❌ (about·rhythms 페이지에만 있음) |
| CollaBoard | ✅ 충실 | ✅ | ✅ | ✅ |
| Songnote | ✅ 충실 | ✅ | ✅ | ✅ |
| Vocal Check | ✅ 충실 | ✅ | ✅ | ✅ |
| PDF Flow Studio | PDF Flow Studio | ✅ | ✅ | ✅ |
| **Bus Explorer** | Bus Explorer | ❌ | ❌ | ❌ |

- **Bus Explorer** (`web/index.html`): 9/27 점검에서 지적된 그대로 남아 있다. `<meta name="description">`, `<link rel="canonical" href="https://bus-explorer.still-coding.cc/">`, 헤더나 푸터에 `still-coding.cc` 링크를 추가하고 title을 "Bus Explorer — 도시 버스 노선·정류장 탐색" 식으로 구체화한다.
- **Guitar Auto-Strum** (`web-app/index.html`): canonical과 메인 화면의 포털 링크를 추가한다.

### 3-6. 포털의 PDF Flow Studio 도움말 링크가 쿼리 문자열 주소 [소스]

`src/data/apps.ts`의 PDF Flow Studio `helpUrl`이 `https://pdf-flow-studio.still-coding.cc/?help=true`(앱 내부 모달)다. 해당 앱에는 이제 정적 `/guide/` 페이지가 있으므로, 다른 앱처럼 **`/guide/`로 바꿔** 크롤러가 따라갈 수 있는 링크로 만든다.

- **[10/2 반영]** 한국어 링크는 `/guide/`로 바꿨다. PDF Flow Studio에는 `/en/guide/`가 없어서, 영어 페이지는 새 필드 `englishHelpUrl`로 기존 `/en/?help=true`를 유지한다.
- **[10/2 정정]** 처음 점검 때 "`/guide/`가 사이트맵에 있다"고 적었지만 사실이 아니다. `pdf-flow-studio` 저장소의 `app/public/sitemap.xml`에는 `/guide/`가 없다. 그 앱 저장소에서 사이트맵에 `/guide/`를 추가하고, 영어 가이드(`/en/guide/`)를 만드는 작업이 남아 있다.
- **[10/2 반영]** `pdf-flow-studio` `183fc4e`에서 `/en/guide/`를 만들고 두 가이드를 사이트맵에 넣었다. 포털은 `englishHelpUrl`을 지워 영어 링크도 `/en/guide/`를 쓴다. 두 가이드 페이지는 `noindex` 리다이렉트 페이지라 색인되지 않는다.

### 3-7. 콘텐츠 공개 속도 [빌드]

노트 35편 중 26편이 10/01, 4편이 09/27로 표시된다. Google은 AI 활용 자체를 금지하지 않지만, 짧은 기간에 같은 형식의 글이 대량 공개된 신생 사이트는 "확장된 콘텐츠 남용(scaled content)" 여부를 더 꼼꼼히 본다. 현재 노트는 실제 코드와 대조한 구체적 내용이라 품질 면에서는 강점이 있으나, 다음을 권한다.
- 신청 전까지 **며칠 간격으로 새 노트를 추가**해 꾸준히 갱신되는 사이트라는 이력을 만든다.
- 노트마다 직접 겪은 시행착오·판단 이유(1인칭 경험) 문단이 들어가 있는지 한 번 더 확인한다.

---

## 4. 🟡 승인 후 또는 개선 사항

| # | 항목 | 근거 | 조치 |
| --- | --- | --- | --- |
| 4-1 | 하위 앱 개인정보방침과 포털 방침의 광고 문구 불일치 | 포털 4항은 "일부 앱의 읽기 페이지에 AdSense 광고 게재 가능, EEA는 CMP 도입 후 맞춤 광고"라고 하지만, 가나 공방·Songnote·Vocal Check·Guitar·Bus Explorer 방침은 "광고 스크립트 없음"이며 Google 광고 쿠키·해제 링크 언급이 없다. Vocal Check는 "맞춤 광고를 하지 않으므로 CMP를 넣지 않는다"고 적어 포털과 정반대다. | 현재 광고가 없으므로 **승인 심사에는 문제 없음**(오히려 사실과 일치). 하위 앱에 광고를 붙이는 시점에 PDF Flow Studio·CollaBoard 방침 문구(Google 광고 쿠키, `adssettings.google.com`, `aboutads.info`, CMP)를 공통 템플릿으로 삼아 함께 갱신 |
| 4-2 | EEA·영국·스위스 CMP | 포털 방침에 "도입 전 해당 지역 광고 미게재"로 명시 | 승인 후 AdSense "개인정보 보호 및 메시지"에서 Google CMP를 켜거나 해당 지역 광고 차단을 실제로 설정. 문구만 있고 설정이 없으면 정책 위반 |
| 4-3 | 404 페이지 메타 | `dist/404.html`에 `canonical=/404/`, `hreflang en=/en/404/` 등 **존재하지 않는 URL**을 가리키는 태그 | 404 페이지에는 `noindex`를 넣고 canonical·hreflang 출력 생략 |
| 4-4 | 한국어 홈 `<title>` | `/`와 `/en/` 모두 `Still Coding — Ideas, made real.` (그 외 ko/en 앱 상세·About·Contact도 title 동일) | 한국어 페이지는 "Still Coding — 직접 만들고 운영하는 웹 앱과 개발 노트"처럼 한국어 title로 차별화 |
| 4-5 | 홈 구조화 데이터 | `ItemList`만 있음 | `WebSite` + `Person`(이름, `sameAs` GitHub) 추가 (기존 P2 항목) |
| 4-6 | Bus Explorer의 FastAPI 자동 문서 | `FastAPI(title='Bus Explorer API')`에 `docs_url`/`redoc_url` 비활성화가 없어 `/docs`, `/redoc`, `/openapi.json`이 공개됨 | `FastAPI(..., docs_url=None, redoc_url=None, openapi_url=None)` 또는 `robots.txt`에 Disallow. 검토자가 "개발 중 페이지"로 볼 여지를 없앤다 |

참고로 Direct Play의 PINHOLE 문제 이미지는 `resources/pinhole-challenges/ATTRIBUTION.md`에 "배포 권리 미확인"으로 기록되어 있으나 같은 문서에 "공개 정적 자산에 번들하지 않는다"고 되어 있어 현재 저작권 노출 위험은 낮다. 원본 프로젝트(`openai-game-builders-pinhole`)가 종훈님 소유이므로, 이미지 출처(직접 생성 여부)를 ATTRIBUTION에 확정 기록해 두면 이 항목을 닫을 수 있다.

---

## 5. 점검 결과 상세 (양호 항목)

### 5-1. 포털 [빌드]

| 항목 | 결과 |
| --- | --- |
| 빌드 | `astro check && astro build` 성공, 97페이지 |
| 페이지당 `<h1>` | 97/97 정확히 1개 |
| `lang` 속성 | ko/en 정확 |
| canonical | 97/97, 모두 자기 자신을 가리킴 |
| meta description | 97/97 존재, **중복 0건** |
| hreflang | 번역 있는 페이지만 ko/en/x-default 출력, 노트는 `translated={false}`로 생략 — 올바름 |
| 내부 링크 깨짐 | 0건 |
| robots.txt | 전체 허용 + 사이트맵 |
| sitemap.xml | 96 URL (404 제외), 노트 `lastmod` 포함 (단 2-1 참조) |
| ads.txt | `text/plain`, 가짜 ID 없음 |
| 개인정보처리방침 | AdSense 필수 고지(제3자 쿠키, Google 광고 쿠키, 맞춤 광고 해제 링크, aboutads, 파트너 사이트 데이터 사용 안내) 모두 포함 |
| 약관·문의 | ko/en, 푸터에서 1클릭 |
| 노트 본문 | 35편, 2,441~9,193자(평균 약 5,000자), 앱 ↔ 노트 상호 링크 |
| 리소스 무게 | 히어로 이미지 webp 44~76KB, 데모 영상 276KB — 양호 |
| `_redirects` | Pinhole Lab 상세 → Direct Play 301 |

### 5-2. 하위 앱 [소스]

| 앱 | robots | sitemap URL 수 | 404 처리 | 공개 정보 페이지 | ads.txt | 광고 스크립트 |
| --- | --- | --- | --- | --- | --- | --- |
| Direct Play | ✅ 방·API Disallow | 30 | `404-page` | about, privacy, terms, contact, 게임 가이드 10 (ko/en) | Worker가 주석 응답, HTML 방지 | 없음 (`ads.js` 허용 목록 준비) |
| 가나 공방 | ✅ | **4** | Pages `404.html`, SPA catch-all 없음 | guide, privacy, contact | 없음 | 없음 |
| Guitar Auto-Strum | ✅ | 23 | `404-page` | about, guide, privacy, terms, contact, learn 5, rhythms 11 | 없음 | 없음 |
| CollaBoard | ✅ API Disallow | 6 | `404-page` | guide, privacy (ko/en) | **가짜 행 파일 삭제됨** ✅ | 없음 (`ads.js` 준비) |
| Songnote | ✅ | 22 | `404-page` | about, guide, library 4편, privacy, terms, contact (ko/en) | 없음 | `ads.js` 허용 목록 |
| Vocal Check | ✅ | 8 | `404-page`, `.assetsignore`로 테스트·문서 업로드 제외 | guide, privacy, contact (ko/en) | 없음 | `ads.js` 허용 목록 |
| PDF Flow Studio | ✅ | 8 | `404-page` (이전 soft 404 해소된 설정) | guide, privacy, terms, contact (ko/en) | 없음 | `ads.js` 준비 |
| Bus Explorer | ✅ (FastAPI, `/busapi/` Disallow) | 6 | FastAPI JSON 404 | about, guide, privacy, terms, contact | 환경변수 없으면 빈 응답 | 없음 |

- 하위 도메인에는 ads.txt가 없어도 된다(Google은 루트 도메인 ads.txt를 본다). 현재 모든 앱이 **가짜 게시자 ID를 내보내지 않는** 상태라 양호하다.
- 가나 공방은 정적 페이지가 3개뿐이라 상대적으로 얇다. 승인 범위가 루트이므로 차단 요인은 아니지만, 광고를 붙일 계획이라면 히라가나/가타카나 행별 학습 가이드 같은 읽기 페이지를 추가하는 것이 좋다.

---

## 6. 권장 실행 순서

1. **[코드, 30분]** 2-1 미래 `pubDate` 8편 수정 + 빌드 검사 추가, 2-2 `InfoLayout` 슬롯 한 줄, 3-3 방침 갱신일, 3-6 PDF `helpUrl`, 4-3 404 noindex → 빌드·배포
2. **[코드, 1~2시간]** 3-1 얇은 태그 페이지 noindex·사이트맵 제외, 3-2 About 보강
3. **[하위 앱]** 3-5 Bus Explorer·Guitar 메인 메타·포털 링크, 3-4 `workers_dev`/`preview_urls` false, 4-6 FastAPI 문서 비활성화
4. **[Cloudflare 대시보드]** `www` → 루트 301, Bot Fight Mode·AI 봇 차단 설정 확인, Guitar 구 Pages 프로젝트 정리, Pinhole Lab DNS 레코드 정리
5. **[Search Console]** 도메인 속성 등록, 사이트맵 제출, 주요 URL 색인 확인 (1~2주 소요 예상)
6. **[대기 기간]** 며칠 간격으로 노트 추가, 실제 방문 유입 확보
7. **[AdSense]** 가입 → `PUBLIC_ADSENSE_CLIENT` 반영·재배포 → `view-source:`와 `/ads.txt` 확인 → 사이트 등록·검토 요청
8. **[승인 후]** 4-1 하위 앱 방침 통일, 4-2 CMP 설정, 광고 단위는 읽기 페이지에만

---

## 부록: 이번 점검으로 기존 문서(`ADSENSE_APPROVAL.md`)에 반영할 변경

- 4절 표 "CollaBoard — 가짜 `pub-XXXX` 행 재확인" → **해결됨**(저장소에 `frontend/ads.txt` 없음, 배포본은 [미확인])
- 4절 표 "PDF Flow Studio — soft 404" → `not_found_handling: "404-page"`와 `404.html` 확인, 배포본은 [미확인]
- 4절 표 "Guitar Auto-Strum — 점검 안 함" → 본 문서 3-4, 3-5 결과로 대체
- 2절 "완료" 목록의 구조화 데이터 관련 서술에 2-2 버그를 반영
