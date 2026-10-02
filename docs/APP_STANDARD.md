# Still Coding 웹앱 공통 표준

- 문서 버전: 1.0
- 작성일: 2026-10-02
- 적용 대상: `still-coding.cc` 포털과 `*.still-coding.cc`에서 운영하는 모든 웹앱
- 원본 위치: 이 문서(`kimiyo/still-coding-site`의 `docs/APP_STANDARD.md`). 각 앱 저장소에는 복사하지 않고 이 문서를 가리키는 한 줄만 둔다(10절).

## 0. 이 문서를 쓰는 때

| 상황 | 시작할 곳 |
| --- | --- |
| 새 앱을 만든다 | 1~7절의 **필수** 항목을 설계에 넣고, 공개 직전에 8절(포털 등록)과 9절(점검표) |
| 다른 곳에서 만든 앱을 Still Coding 앱으로 들여온다 | 9절 점검표로 현재 상태를 표시한 뒤 빠진 **필수** 항목부터 채우고, 8절로 포털에 등록 |
| 이미 운영 중인 앱을 점검한다 | 9절 점검표와 부록 A의 지난 결과를 비교 |

**등급**

- **필수**: 빠지면 AdSense 검토, 검색 색인, 포털 연동 중 하나가 실제로 깨진다. 공개 전에 반드시 맞춘다.
- **권장**: 없어도 동작하지만 품질 신호가 약해진다. 공개 후 순서대로 채운다.

각 항목의 ID(예: `D-1`)는 점검표와 커밋 메시지에서 그대로 쓴다. 항목 끝의 **근거**는 그 규칙이 생긴 실제 사례다(대부분 `docs/ADSENSE_AUDIT_2026-10-01.md`).

이 문서는 작업 기준이며 Google의 공식 승인 기준이나 승인 보장이 아니다.

### 관련 문서

| 문서 | 다루는 것 | 이 문서와의 관계 |
| --- | --- | --- |
| `still-coding-multilingual-requirements.md` (각 앱 저장소 루트) | 다국어(ko/en) UI·URL·번역 계약 전체 | 6절은 요약이다. 구현은 원문을 따른다 |
| `docs/FEEDBACK_WIDGET_INTEGRATION.md` | 테스터 피드백 위젯 연동 | 7-3이 가리킨다 |
| `docs/ADSENSE_APPROVAL.md` | AdSense 신청 절차와 거절 대응 | 5절 규칙의 배경 |
| `docs/ADSENSE_AUDIT_2026-10-01.md` | 10/1 전수 점검 결과 | 이 문서의 근거 사례 |

---

## 1. 도메인과 배포 (D)

| ID | 등급 | 요구사항 | 확인 방법 |
| --- | --- | --- | --- |
| D-1 | 필수 | 앱 주소는 `https://<앱>.still-coding.cc/` 하나다. 서브도메인 이름은 공개 후 바꾸지 않는다(포털 링크·색인·외부 링크가 모두 깨진다). | 포털 `apps.ts`의 `url`과 일치 |
| D-2 | 필수 | Cloudflare Workers로 배포하면 `wrangler.jsonc`에 `"workers_dev": false`, `"preview_urls": false`를 **명시**한다. 기본값에 기대지 않는다. | `grep -E 'workers_dev|preview_urls' wrangler.jsonc` |
| D-3 | 필수 | 같은 내용이 다른 주소(`*.workers.dev`, `*.pages.dev`, 옛 Pages 프로젝트, `www`)로 열리지 않는다. 남겨야 하면 정식 주소로 301. | 각 주소를 직접 열어 404 또는 301 확인 |
| D-4 | 필수 | 없는 경로는 **HTTP 404**를 돌려준다. SPA라도 모든 경로에 200 + `index.html`을 주지 않는다(soft 404). Workers 정적 자산이면 `"not_found_handling": "404-page"`. | `curl -sI https://<앱>.still-coding.cc/zzz-nope` → `404` |
| D-5 | 권장 | 서비스를 종료하면 DNS·커스텀 도메인·Workers/Pages 프로젝트를 함께 정리하고, 포털 FAQ에 이동 안내를 남긴다. | Cloudflare 대시보드 |

**근거**: Direct Play·Guitar·PDF Flow Studio의 `workers_dev: true`로 같은 앱이 workers.dev 주소로도 열렸다(감사 3-4). PDF Flow Studio의 `/zzz-nope`가 200을 돌려줬다(soft 404). Pinhole Lab 종료 뒤 DNS 레코드가 남아 있을 수 있다.

## 2. 공개 페이지 (P)

AdSense 검토자와 검색 엔진이 읽는 것은 조작 화면이 아니라 **읽을 수 있는 정적 페이지**다. 아래 페이지는 JavaScript 없이도 본문이 HTML에 들어 있어야 한다.

| ID | 등급 | 페이지 | 경로 | 내용 기준 |
| --- | --- | --- | --- | --- |
| P-1 | 필수 | 메인 | `/` | 조작 화면이어도 앱 이름과 한두 문장 설명, 사용법·정책 링크가 HTML에 있다 |
| P-2 | 필수 | 사용법 | `/guide/` | 실제 사용 순서, 화면 설명, 자주 막히는 지점, 제약. 앱의 대표 읽기 페이지다 |
| P-3 | 필수 | 개인정보처리방침 | `/privacy/` | 5-4 기준 |
| P-4 | 필수 | 문의 | `/contact/` | 운영자 이메일 `still.coding.cc@gmail.com` 또는 포털 `/contact/`로 연결 |
| P-5 | 필수 | 404 | 없는 모든 경로 | 메인·사용법으로 돌아가는 링크. 4-6의 `noindex` |
| P-6 | 권장 | 소개 | `/about/` | 만든 이유, 대상, 운영자, 기술 구성. 사용법과 합쳐도 된다 |
| P-7 | 조건부 필수 | 이용약관 | `/terms/` | 사용자가 글·방·파일을 만들거나 다른 사람과 공유하는 기능이 있으면 필수(Direct Play, CollaBoard 등) |
| P-8 | 권장 | 읽을거리 | 앱별 | 규칙 해설, 학습 자료, 예제 소개처럼 앱 주제를 깊게 다루는 정적 페이지(예: Direct Play 게임 가이드, Guitar `/learn/`·`/rhythms/`, Songnote `/library/`) |

- 경로는 디렉터리형(`/guide/`)을 쓰고, 슬래시 없는 주소는 슬래시 있는 주소로 리다이렉트한다.
- 사용법을 `?help=true`, `#help` 같은 앱 내부 상태로만 제공하지 않는다. 내부 도움말을 유지하더라도 정적 `/guide/`를 따로 둔다.
- 모든 공개 페이지의 머리글이나 바닥글에 4-1의 포털 링크와 사용법·개인정보·문의 링크를 둔다.

**근거**: PDF Flow Studio 포털 링크가 `?help=true`여서 검토자가 읽을 사용법 페이지로 이어지지 않았다(감사 3-6). Bus Explorer·Guitar 메인에는 설명 메타·포털 링크가 없었다(감사 3-5).

## 3. 검색 메타와 색인 (S)

| ID | 등급 | 요구사항 | 확인 방법 |
| --- | --- | --- | --- |
| S-1 | 필수 | 공개 페이지마다 고유한 `<title>`과 `<meta name="description">`. 앱 이름만 있는 title(예: `Bus Explorer`)은 피하고 무엇을 하는 앱인지 넣는다 | 페이지별 grep |
| S-2 | 필수 | 공개 페이지마다 자기 자신을 가리키는 절대 주소 `<link rel="canonical">` | 같은 |
| S-3 | 필수 | `<html lang="ko">`(영어 페이지는 `en`) | 같은 |
| S-4 | 필수 | `/robots.txt`: 공개 페이지 허용, API·방 코드·작업 공간 경로만 `Disallow`, `Sitemap:` 줄 포함 | `curl /robots.txt` |
| S-5 | 필수 | `/sitemap.xml`: 색인할 공개 페이지(사용법 포함)만. 방 코드, 사용자 작업 공간, 실시간 결과, 검색 필터 조합 URL은 넣지 않는다 | `curl /sitemap.xml` |
| S-6 | 필수 | 사이트맵 `lastmod`는 실제 내용이 바뀐 날짜. 빌드 날짜나 미래 날짜를 넣지 않는다 | 날짜 확인 |
| S-7 | 필수 | 404, 리다이렉트 안내, 테스트, 미완성 페이지는 `<meta name="robots" content="noindex">`를 넣고 사이트맵에서 뺀다. 거꾸로 `noindex` 페이지를 사이트맵에 넣지 않는다 | 사이트맵 URL마다 noindex 여부 확인 |
| S-8 | 권장 | Open Graph(`og:title`, `og:description`, `og:image`, `og:url`)와 `twitter:card` | 공유 미리보기 |
| S-9 | 권장 | 구조화 데이터(JSON-LD): 앱 메인은 `WebApplication`, 읽을거리는 `Article`/`TechArticle`, 하위 페이지는 `BreadcrumbList` | [Rich Results Test](https://search.google.com/test/rich-results) |

**근거**: 포털 노트 8편의 미래 `pubDate`가 사이트맵 `lastmod`로 그대로 나갔다(감사 2-1). 레이아웃이 `head` 슬롯을 넘기지 않아 JSON-LD가 조용히 사라졌다(감사 2-2). 그래서 메타는 소스가 아니라 **빌드 결과물**에서 확인한다. PDF Flow Studio 가이드가 `noindex` 리다이렉트 페이지인데 사이트맵에 들어 있다(감사 3-6 참고).

## 4. 포털 연동 (L)

### 4-1. 앱 쪽 요건

| ID | 등급 | 요구사항 |
| --- | --- | --- |
| L-1 | 필수 | 메인 화면과 모든 정적 페이지에서 포털로 가는 링크. 한국어 페이지는 `https://still-coding.cc/`, 영어 페이지는 `https://still-coding.cc/en/`. 문구 예: `Still Coding`, `Still Coding 메인 ↗` |
| L-2 | 필수 | 사용법 주소가 고정되어 있다. 포털 `helpUrl`이 이 주소를 가리킨다(기본 `/guide/`, 영어 `/en/guide/`) |
| L-3 | 필수 | 영어 페이지가 있으면 한국어 경로 앞에 `/en/`만 붙인 구조다. 포털은 이 규칙으로 영어 링크를 만든다(`localizedAppUrl`). 규칙을 지킬 수 없으면 포털 `englishHelpUrl`로 예외를 적는다 |
| L-4 | 필수 | 바닥글에 운영자와 Still Coding 소속 표시. 예: `운영자 JH Kim · ○○는 Still Coding의 앱입니다.` |
| L-5 | 권장 | 피드백 위젯 연동(7-3) |

**근거**: Bus Explorer는 메인뿐 아니라 정보 페이지 바닥글에도 포털 링크가 없다(10/2 재확인, 감사 3-5 정정). Guitar 메인에도 없다.

### 4-2. 포털 쪽 요건 (8절 절차로 등록)

- `src/data/apps.ts` 항목과 `src/i18n/index.ts`의 영어 번역
- 앱 카드 시각 요소(`visual`)
- 포털 개인정보처리방침의 앱별 목록(ko/en)
- 개발 노트 폴더 `src/content/notes/<앱 id>/`와 노트 1편 이상

## 5. 광고와 정책 (A)

| ID | 등급 | 요구사항 |
| --- | --- | --- |
| A-1 | 필수 | **광고 적격 페이지를 명시한다.** 읽기 페이지(사용법, 소개, 읽을거리)만 적격이다. 게임·편집·측정·협업 같은 조작 화면과 개인정보·약관·문의·404는 비적격이다. 화면에 `data-ad-eligible="true|false"`를 달고, 광고 스크립트(`ads.js`)는 비적격 화면에서 광고 태그를 제거한다. 본보기는 Songnote의 `src/ads.js`, Vocal Check의 `ads.js` |
| A-2 | 필수 | 조작 요소(버튼, 건반, 캔버스, 재생 컨트롤, 삭제) 옆에 광고 칸을 두지 않는다. 자동 광고를 조작 화면에 일괄로 켜지 않는다 |
| A-3 | 필수 | 가짜 게시자 ID(`pub-XXXXXXXXXXXXXXXX`)를 어디에도 두지 않는다. `ads.txt`는 루트 도메인 것만으로 충분하다. 하위 앱에 두려면 실제 ID만, 환경 변수로 넣는다(본보기: Bus Explorer `/ads.txt` 라우트) |
| A-4 | 필수 | 개인정보처리방침은 **현재 실제 동작**만 적는다. 광고 스크립트가 없으면 "지금은 광고 스크립트·게시자 ID·ads.txt를 넣지 않는다"라고 쓰고, 광고를 켜기 **전에** Google 광고 쿠키, 맞춤 광고 해제 방법(`https://adssettings.google.com/`), EEA·영국·스위스 동의 처리를 추가한다 |
| A-5 | 필수 | 방침에 앱이 실제로 저장·전송하는 데이터를 빠짐없이 적는다: 브라우저 저장소 키, 서버 전송 여부, 마이크·카메라·파일 처리, 외부 API, 피드백 위젯 |
| A-6 | 필수 | 방침에 시행일과 최종 업데이트 날짜를 표시하고, 내용을 고치면 **날짜와 내용을 함께** 갱신한다. 사이트맵 `lastmod`도 같은 날짜로 맞춘다 |
| A-7 | 권장 | 날짜는 한 곳에서 관리한다(포털 본보기: `src/data/policies.ts` + `PolicyMeta.astro`) |
| A-8 | 필수 | 저작권이 불분명한 이미지·음원·악보·폰트를 쓰지 않는다. 출처와 라이선스는 저장소의 `ATTRIBUTION.md` 등에 기록한다 |

**근거**: CollaBoard 배포본에 가짜 `pub-XXXX` ads.txt 행이 남아 있었다. 포털 방침이 9/30·10/1에 바뀌었는데 최종 업데이트가 9/27이었다(감사 3-3).

## 6. 다국어 (I)

상세 계약은 각 앱 저장소의 `still-coding-multilingual-requirements.md`를 따른다. 점검에 필요한 핵심만 적는다.

| ID | 등급 | 요구사항 |
| --- | --- | --- |
| I-1 | 권장 | 한국어가 기본 URL, 영어는 `/en/` 아래 같은 구조 |
| I-2 | 필수(영어가 있으면) | 대응 페이지끼리만 `hreflang="ko"`·`"en"`을 상호 선언하고, 각 페이지는 자기 자신을 canonical로 둔다 |
| I-3 | 필수(영어가 있으면) | 번역이 끝나지 않은 영어 페이지를 공개·색인하지 않는다. 포털 `englishReady`는 영어 페이지가 실제로 있을 때만 `true` |
| I-4 | 필수 | 브라우저 언어나 지역으로 강제 리다이렉트하지 않는다. 헤더 오른쪽에 `한글`/`English` 전환 버튼 |
| I-5 | 필수 | 언어를 바꿔도 광고 적격 규칙(A-1)은 같다 |

## 7. 보안과 운영 (O)

| ID | 등급 | 요구사항 |
| --- | --- | --- |
| O-1 | 필수 | 프레임워크 자동 문서와 관리 경로를 운영에서 끈다(FastAPI는 `FastAPI(docs_url=None, redoc_url=None, openapi_url=None)`) |
| O-2 | 필수 | API 키·서비스 계정 키는 환경 변수나 Secrets로만. 저장소에는 `*.sample.json`만 둔다 |
| O-3 | 권장 | 피드백 위젯은 `docs/FEEDBACK_WIDGET_INTEGRATION.md` 방식으로, 서버가 발급한 공개 app ID가 있을 때만 로드 |
| O-4 | 권장 | HTML은 `Cache-Control: no-cache`(재검증), 버전이 붙은 정적 자산은 장기 캐시 |
| O-5 | 권장 | 배포 전에 저장소의 테스트와 빌드를 돌리고, 공개 페이지 메타는 빌드 결과물에서 확인한다 |

**근거**: Bus Explorer의 FastAPI `/docs`가 공개되어 있다(감사 4-6).

## 8. 포털에 새 앱 등록하기

앱 쪽 1~7절 **필수** 항목이 배포본에서 확인된 뒤 진행한다.

1. **앱 데이터**: `src/data/apps.ts`에 항목을 추가한다.

   | 필드 | 내용 |
   | --- | --- |
   | `id` | 영문 소문자 kebab-case. 노트 폴더, 앱 상세 URL과 같은 값이며 공개 후 바꾸지 않는다 |
   | `url`, `helpUrl` | L-2 |
   | `englishReady` | I-3 |
   | `englishHelpUrl` | L-3 규칙을 못 지킬 때만 |
   | `status` | 공개 앱은 `"public"` |
   | `group`, `order`, `size` | 홈에서의 분류·순서·카드 크기 |
   | `summary`, `detail`, `tags`, `audience`, `steps` | 앱 상세 페이지 본문. 카드 요약을 반복하지 말고 대상·사용 순서·제약을 구체적으로 |
   | `dataPolicy` | 앱 방침(A-5)과 같은 사실을 한두 문장으로 |
   | `faqs` | 실제로 받는 질문. 사용법 주소 안내 포함 |
   | `accent`, `accentSoft`, `visual` | 카드 색과 시각 요소 |

2. **영어 번역**: `src/i18n/index.ts`의 앱 번역에 같은 `id`로 추가한다.
3. **카드 시각 요소**: `visual` 유니언 타입에 값을 추가하고 `AppVisual.astro`에 변형을 만들거나, `AppCard.astro`에서 이미지·영상을 쓴다. 자산은 `public/images/apps/<id>/`에 둔다.
4. **개인정보처리방침**: `src/pages/privacy.astro`와 `src/pages/en/privacy.astro`의 앱 목록에 한 줄씩 추가하고, `src/data/policies.ts`의 `privacy.updated`를 그날로 바꾼다(A-6).
5. **개발 노트**: `src/content/notes/<id>/`에 최소 1편. `draft: true`로 시작해 `TODO(사용자)`를 모두 해결한 뒤 공개한다. `pubDate`는 오늘 이전이어야 한다(빌드가 검사한다).
6. **빌드 확인**: `pnpm run build` 후 `dist/apps/<id>/`, 사이트맵, 홈 카드, 영어 링크(`/en/guide/`가 실제로 열리는지)를 확인한다.
7. **Search Console**: 하위 도메인은 루트 도메인 속성(`still-coding.cc`)에 포함된다. 앱 사이트맵을 그 속성에 추가로 제출한다.

## 9. 점검표

새 앱, 변환할 앱, 정기 점검에 같은 표를 쓴다. 저장소 소스가 아니라 **배포본**을 기준으로 표시하고, 배포본을 못 보면 `[미확인]`을 붙인다.

```text
앱: ____________  주소: https://____.still-coding.cc/  점검일: ______  커밋: ______

[1. 도메인·배포]
[ ] D-1 정식 주소 하나          [ ] D-2 workers_dev/preview_urls false 명시
[ ] D-3 중복 주소 없음           [ ] D-4 없는 경로 404

[2. 공개 페이지]
[ ] P-1 메인 설명               [ ] P-2 /guide/         [ ] P-3 /privacy/
[ ] P-4 /contact/              [ ] P-5 404 페이지       [ ] P-6 /about/ (권장)
[ ] P-7 /terms/ (공유 기능 시)   [ ] P-8 읽을거리 (권장)

[3. 검색 메타]
[ ] S-1 title·description       [ ] S-2 canonical        [ ] S-3 html lang
[ ] S-4 robots.txt              [ ] S-5 sitemap.xml      [ ] S-6 lastmod 정확
[ ] S-7 noindex 대상 정리        [ ] S-8 OG (권장)         [ ] S-9 JSON-LD (권장)

[4. 포털 연동]
[ ] L-1 포털 링크(메인·정적 페이지 전부)   [ ] L-2 사용법 주소 고정
[ ] L-3 /en/ 대응 규칙                   [ ] L-4 운영자·소속 표시
[ ] 포털 등록(8절 1~6)

[5. 광고·정책]
[ ] A-1 광고 적격 표시·allowlist   [ ] A-2 조작 요소 옆 광고 없음
[ ] A-3 가짜 ads.txt 없음          [ ] A-4·A-5 방침이 실제 동작과 일치
[ ] A-6 방침 날짜와 내용 함께 갱신   [ ] A-8 저작권 출처 기록

[6. 다국어] (영어가 있으면)
[ ] I-2 hreflang·canonical       [ ] I-3 미완성 영어 비공개   [ ] I-4 강제 리다이렉트 없음

[7. 보안·운영]
[ ] O-1 API 문서 비공개          [ ] O-2 비밀값 저장소 밖
```

### 빠른 확인 명령

배포본에 접속할 수 있는 환경에서 실행한다.

```bash
APP=https://<앱>.still-coding.cc
curl -sI "$APP/zzz-nope" | head -1                       # D-4: 404여야 함
curl -s "$APP/robots.txt"                                # S-4
curl -s "$APP/sitemap.xml" | grep -o '<loc>[^<]*' | sed 's/<loc>//'   # S-5
for p in / /guide/ /privacy/ /contact/; do               # S-1·S-2·L-1
  html=$(curl -s "$APP$p")
  echo "== $p"
  echo "$html" | grep -oE '<title>[^<]*|rel="canonical" href="[^"]*"|name="robots" content="[^"]*"'
  echo "$html" | grep -c 'href="https://still-coding.cc/' | sed 's/^/portal links: /'
done
curl -s "$APP/ads.txt"                                   # A-3: 비었거나 실제 ID
curl -sI "$APP/docs" | head -1                           # O-1: 404여야 함(FastAPI 앱)
```

## 10. 각 앱 저장소에 둘 안내

각 앱 저장소의 `CLAUDE.md`(없으면 `README.md`)에 아래를 넣는다. 문서를 복사하지 않으므로 기준이 갈라지지 않는다.

```markdown
## Still Coding 공통 표준
이 앱은 Still Coding 웹앱 공통 표준을 따른다:
https://github.com/kimiyo/still-coding-site/blob/main/docs/APP_STANDARD.md
공개 페이지·메타·광고·포털 연동을 바꿀 때는 이 문서의 해당 항목 ID(D-, P-, S-, L-, A-, I-, O-)를 확인하고, 커밋 메시지에 ID를 적는다.
```

## 11. 문서 관리

- 규칙을 추가·변경하면 맨 위 문서 버전과 작성일을 올리고, 근거 사례를 함께 적는다.
- 같은 문제가 두 앱 이상에서 나오면 이 문서에 규칙으로 올린다.
- 부록 A는 점검할 때마다 날짜와 함께 갱신한다.

---

## 부록 A. 앱별 준수 현황 (2026-10-02, 저장소 소스 기준)

배포본은 네트워크 정책상 열어 보지 못했다 [미확인]. 각 저장소 `main` 최신 커밋 기준이다.

| 앱 (도메인) | 커밋 | D-2 | P-2 사용법 | P-6 소개 | P-7 약관 | P-5 404·noindex | S-1·S-2 메인 메타 | S-8 메인 OG | L-1 포털 링크 | 영어 | A-1 광고 구분 | O-3 피드백 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Direct Play (`dp`) | b1ec025 | ✅ | ✅ `/about/`·게임 가이드 10개 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 가나 공방 (`study-hiragana`) | f17d5b9 | — Pages | ✅ | ❌ | ➖ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Guitar Auto-Strum (`guitar-play`) | f43d398 | ✅ | ✅ | ✅ | ✅ | ❌ noindex 없음 | ❌ canonical 없음 | ❌ | ❌ 메인 없음(정적 페이지는 있음) | ❌ | ❌ | ❌ |
| CollaBoard (`collaboard`) | 984664a | △ 미명시 | ✅ | ❌ | ❌ 방·공유 기능 있음 | ❌ 404.html 없음 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Songnote (`piano-play`) | 0b83115 | △ 미명시 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vocal Check (`vocal-check`) | a1ac345 | △ 미명시 | ✅ | ❌ | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDF Flow Studio (`pdf-flow-studio`) | 183fc4e | ✅ | ✅ (noindex 리다이렉트) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ 메인, ❌ 가이드 | ✅ | ✅ | ❌ |
| Bus Explorer (`bus-explorer`) | 83ece98 | — FastAPI | ✅ | ✅ | ✅ | △ JSON 404 | ❌ description·canonical 없음 | ❌ | ❌ 전체 없음 | ❌ | ❌ | ✅ |

표기: ✅ 충족, ❌ 미충족, △ 부분 충족, ➖ 해당 없음(공유 기능 없음, 권장 항목), — 해당 배포 방식이 아님.

### 앱별 우선 조치 (필수 항목만)

| 앱 | 조치 |
| --- | --- |
| Bus Explorer | 메인 description·canonical(S-1·S-2), 모든 페이지 포털 링크(L-1), FastAPI 문서 끄기(O-1) |
| Guitar Auto-Strum | 메인 canonical(S-2), 메인 포털 링크(L-1), 404 `noindex`(S-7) |
| CollaBoard | `workers_dev`·`preview_urls` 명시(D-2), 이용약관(P-7), `frontend/404.html` 추가(P-5. 지금은 `404-page` 설정만 있어 404 상태에 빈 본문) |
| PDF Flow Studio | 가이드 페이지 포털 링크(L-1), `noindex` 가이드를 사이트맵에서 빼거나 가이드를 색인 페이지로 전환(S-7) |
| 가나 공방 | 배포 방식(Pages) 확인 후 `pages.dev` 중복 주소 정리(D-3) |
| Songnote, Vocal Check | `workers_dev`·`preview_urls` 명시(D-2) |
| Direct Play | 없음 |

광고를 켜기 전에 할 일(A-1·A-4)은 승인 후 단계라 위 표에서 뺐다. 광고 구분이 없는 4개 앱(가나 공방, Guitar, CollaBoard, Bus Explorer)은 광고 게재 전에 A-1을 구현한다.

## 부록 B. 본보기 구현

| 항목 | 본보기 | 위치 |
| --- | --- | --- |
| 정적 정보 페이지 세트(ko/en) | Songnote | `public/`, `public/en/` |
| 광고 적격 구분 | Songnote, Vocal Check | `src/ads.js`, `ads.js`, `data-ad-eligible` |
| 서버형 앱의 robots·sitemap·ads.txt | Bus Explorer | `app/main.py` |
| 게임별 읽기 페이지 | Direct Play | `frontend/games/<game>/` |
| 방침 날짜 일원화 | 포털 | `src/data/policies.ts`, `src/components/PolicyMeta.astro` |
| 미래 날짜·초안 TODO 빌드 차단 | 포털 | `src/lib/notes.ts` |
