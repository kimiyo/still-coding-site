# 앱 ↔ 개발 노트 연결 구조 구현 계획

작성일 2026-09-30 (앱별 노트 후보와 초안 흐름 추가)

관련 문서: `ADSENSE_APPROVAL.md`(신청 준비 최종본. 신청 절차와 사전 점검을 통합함)

## 1. 목표와 범위

### 목표

Still Coding을 다음 구조의 사이트로 만든다.

```
Apps  = 내가 만든 것
Notes = 왜 만들었고, 어떻게 만들었으며, 무엇을 배웠는가
Still Coding = 둘을 연결하는 개인 개발자의 개발 기록
```

앱에서 노트로, 노트에서 앱으로 양방향 경로를 만들고, 앱별·글별로 진입할 수 있게 한다. AdSense 승인만을 위한 글 늘리기가 아니라, 방문자가 두 가지 방식(앱 중심, 글 중심)으로 사이트를 탐색할 수 있게 하는 것이 목적이다.

### 이 문서의 범위

- **포함**: 코드 구조 변경(1단계), 노트 작성 절차와 템플릿(2단계), 페이지 문구 보강(3단계), 검색·기술 점검(4단계), 검증 기준.
- **제외**: 개별 노트의 최종 본문(초안은 Claude가 쓰고 사용자가 수정·보완해 확정), 하위 앱 저장소 7개의 수정, AdSense 대시보드 설정(CMP 등).

### 하지 않는 것

- 노트 편수를 채우기 위한 일반론 글. 실제 저장소 코드·커밋·수치에 근거한 글만 쓴다.
- 직접 만든 쿠키 동의 팝업. 승인 후 AdSense의 Google CMP 기능을 사용한다.
- 영어 노트. 노트는 한국어뿐이며, 영어 화면에서는 한국어 노트로 연결한다는 표시(`KR`)를 붙인다.
- 태그별 목록(`/notes/tag/…`). 글이 10편 이상 된 뒤에 검토한다.

## 2. 현재 상태와 목표 상태

| 영역 | 현재 | 목표 |
| --- | --- | --- |
| 앱 카드 | 상세 / 가이드 / 앱 열기 | + **개발 노트** (노트가 있는 앱만) |
| `/notes/` | 최신순 단일 목록 | 앱별 묶음 + 최신순 목록 |
| 앱별 노트 목록 | 없음 (앱 상세 페이지 5번 섹션에 일부) | `/notes/app/{id}/` 정적 페이지 |
| 노트 → 앱 | 노트 하단에 "이 글에서 다룬 앱" 링크 있음 | 앱 소개·앱 열기·같은 앱의 다른 노트로 확장 |
| 영어 화면 | 카드에 노트 링크 없음 | `Dev Notes (KR)` 링크 |
| 사이트맵 | `/notes/`, 각 노트 | + `/notes/app/{id}/` |
| 노트 편수 | 4편 (CollaBoard, Songnote, Vocal Check, 포털) | 앱마다 1편 이상 (2단계, 후보는 5.3) |
| Search Console | 미등록 | 등록·사이트맵 제출 |

노트가 있는 앱: `collaboard`, `piano-play`, `vocal-check`. 노트가 없는 앱: `direct-play`, `kana-atelier`, `guitar-auto-strum`, `bus-explorer`. 포털 자체를 다룬 노트 1편은 `app` 필드가 없다.

## 3. 정보 구조

```
/                       홈 (앱 카드 → 앱 열기 / 상세 / 개발 노트)
/apps/{id}/             앱 상세 (관련 노트 섹션 유지)
/notes/                 개발 노트 전체 (앱별 묶음 + 최신순)
/notes/app/{id}/        앱별 개발 노트 목록          ← 신규
/notes/{slug}/          노트 상세 (관련 앱 블록 확장)
```

### 두 가지 진입 경로

```
경로 A (앱 중심)   홈 → 앱 카드 [개발 노트] → /notes/app/{id}/ → 노트 상세
경로 B (글 중심)   홈/메뉴 [개발 노트] → /notes/ → 앱 묶음 또는 노트 상세
```

### URL 결정

앱별 목록은 `/notes/?app=direct-play` 같은 쿼리 필터가 아니라 **정적 경로 `/notes/app/{id}/`**로 만든다. 크롤러가 링크를 따라가 색인할 수 있고, 사이트맵에 넣을 수 있으며, 클라이언트 스크립트가 필요 없다.

노트 슬러그가 `app`이면 `/notes/app/`과 충돌한다. 노트 파일명을 `app.md`로 짓지 않도록 템플릿에 명시한다.

## 4. 1단계 — 구조 변경

### 4.1 공용 헬퍼 (신규)

`src/lib/notes.ts`

```ts
getSortedNotes()            // pubDate 내림차순 전체 노트
getNotesByApp(appId)        // 해당 앱의 노트 (최신순)
getNoteCounts()             // { [appId]: number }
getAppsWithNotes()          // 노트가 1편 이상인 public 앱 (apps.order 순)
```

지금은 `notes/index.astro`, `notes/[slug].astro`, `apps/[slug].astro`, `sitemap.xml.ts`가 각각 `getCollection("notes")`를 호출해 정렬·필터를 따로 한다. 헬퍼로 모아 중복을 없앤다.

`draft` 처리: `content.config.ts` 스키마에 `draft: z.boolean().default(false)`를 추가한다. 헬퍼는 **프로덕션 빌드에서 `draft: true`인 노트를 모든 조회에서 제외**한다(목록, 상세 경로, 앱별 페이지, 카드의 편수, 사이트맵). 개발 서버(`import.meta.env.DEV`)에서는 포함하고 "초안" 배지를 표시해 사용자가 미리 볼 수 있게 한다. 따라서 `notes/[slug].astro`, `sitemap.xml.ts` 등은 `getCollection`을 직접 부르지 않고 반드시 헬퍼를 거치게 한다.

`content.config.ts`의 `app` 필드는 `z.string().optional()`이라 오타가 나도 빌드가 통과한다. 헬퍼에서 `app` 값이 `apps`의 id에 없으면 **빌드를 실패시킨다**(존재하지 않는 앱을 가리키는 노트를 배포하지 않기 위해).

### 4.2 앱 카드에 [개발 노트] 버튼

수정: `src/components/AppCard.astro`, `src/pages/index.astro`, `src/pages/en/index.astro`

- 홈 페이지에서 `getNoteCounts()`를 한 번 호출해 카드에 `noteCount` prop으로 전달한다. 카드마다 컬렉션을 조회하지 않는다.
- `noteCount > 0`일 때만 `card-actions`에 링크를 추가한다: `개발 노트 {n}` → `/notes/app/{id}/`. 노트가 0편이면 버튼을 숨긴다(빈 페이지·"준비 중" 링크를 만들지 않는다).
- 영어 화면: `Dev Notes (KR)`로 표시하고 `hreflang="ko"`를 붙인다. 링크는 같은 한국어 경로를 쓴다.
- `card-actions`가 이미 3개(상세, 가이드, 앱 열기)라 모바일에서 넘칠 수 있다. 360px에서 줄바꿈·터치 영역을 확인하고, 필요하면 "개발 노트"를 카드 하단 별도 줄로 뺀다.

### 4.3 `/notes/` 재구성

수정: `src/pages/notes/index.astro`

- 상단: 기존 소개문 유지.
- **앱별 묶음**: 노트가 있는 앱만 표시. 앱 이름, 한 줄 요약, 노트 편수, `/notes/app/{id}/` 링크. `app` 필드가 없는 노트(포털 자체)는 "Still Coding" 묶음으로 표시한다.
- 하단: 기존 최신순 전체 목록을 유지한다.

앱 묶음을 위해 별도 분류 필드(예: `topic`)는 만들지 않는다. 제안서의 "Music" 같은 큰 묶음은 지금 편수에서는 과하므로, 앱 단위로 시작하고 글이 늘면 `apps.ts`의 `category`를 활용해 재검토한다.

### 4.4 `/notes/app/[id].astro` (신규)

- `getStaticPaths`: `getAppsWithNotes()`의 앱만 경로를 생성한다(노트 0편인 앱은 페이지 자체가 없다).
- 구성: 앱 이름·한 줄 소개, **[앱 실행]** 버튼(새 창), **앱 상세** 링크, 해당 앱 노트 목록(기존 `.note-list` 스타일 재사용), 전체 노트로 돌아가는 링크.
- `InfoLayout` 사용, `translated={false}`, canonical은 기존 방식 그대로.
- 제목·설명: `{앱 이름} 개발 노트`, "{앱 이름}을 만들며 기록한 설계와 문제 해결" 형태로 자동 생성.
- 구조화 데이터: `BreadcrumbList`(홈 › 개발 노트 › 앱).

### 4.5 노트 상세 하단 확장

수정: `src/pages/notes/[slug].astro`

- 이미 "이 글에서 다룬 앱" 링크가 있다. 아래를 추가한다.
  - **[앱 실행]** 버튼(주 동작), 앱 상세 링크
  - **같은 앱의 다른 노트** 최대 3편(현재 글 제외, 최신순)
  - 링크 텍스트는 "모든 노트 보기" 외에 "{앱} 개발 노트 전체"(`/notes/app/{id}/`)
- 노트에 `app`이 없으면(포털 노트) 기존처럼 "모든 노트 보기"만 표시한다.

### 4.6 앱 상세 페이지

수정: `src/pages/apps/[slug].astro`, `src/pages/en/apps/[slug].astro`

- 관련 노트 섹션 하단에 "이 앱의 개발 노트 전체 보기" 링크(`/notes/app/{id}/`)를 추가한다.
- 영어 상세에는 현재 관련 노트 섹션이 없다. `Dev Notes (KR)` 섹션을 추가할지는 6번의 결정 사항 참고.

### 4.7 사이트맵

수정: `src/pages/sitemap.xml.ts`

- `getAppsWithNotes()`로 `/notes/app/{id}/`를 추가한다. `lastmod`는 해당 앱 노트 중 가장 최근 `updatedDate ?? pubDate`.
- 기존 `/notes/`의 `lastmod`도 가장 최근 노트 날짜로 채운다.

### 4.8 스타일

수정: `src/styles/global.css` (기존 `.note-list`, `.detail-notes` 재사용)

- 신규 클래스는 최소화: 앱 묶음 카드(`.note-groups`), 카드 버튼 보조 스타일.
- 모바일(360/375px)에서 카드 액션 줄바꿈, 앱 묶음 그리드 1열 확인.

### 4.9 변경 파일 요약

| 파일 | 구분 |
| --- | --- |
| `src/lib/notes.ts` | 신규 |
| `src/pages/notes/app/[id].astro` | 신규 |
| `src/components/AppCard.astro` | 수정 |
| `src/pages/index.astro`, `src/pages/en/index.astro` | 수정 |
| `src/pages/notes/index.astro`, `src/pages/notes/[slug].astro` | 수정 |
| `src/pages/apps/[slug].astro`, `src/pages/en/apps/[slug].astro` | 수정 |
| `src/pages/sitemap.xml.ts` | 수정 |
| `src/styles/global.css` | 수정 |
| `src/content.config.ts` | 수정 (`draft` 필드) |

### 4.10 커밋 단위

한 커밋에 하나의 변경만 담는다(저장소의 기존 커밋 관례).

1. `refactor: 노트 조회를 공용 헬퍼로 모은다`
2. `feat: 앱 카드에 개발 노트 링크를 넣는다`
3. `feat: 앱별 개발 노트 목록 페이지를 만든다`
4. `feat: 개발 노트 목록과 상세에서 앱으로 오가는 경로를 넓힌다`
5. `feat: 앱별 노트 목록을 사이트맵에 넣는다`

## 5. 2단계 — 노트 작성

### 5.1 앱별 개발 위치 (참고 정보)

노트의 근거는 각 앱의 실제 코드·문서·커밋 기록이다. 아래는 **현재 개발 위치**이며 나중에 바뀔 수 있다. 위치가 바뀌면 이 표만 고친다.

| 앱 | 로컬 저장소 | 확인 시점 기준 |
| --- | --- | --- |
| Direct Play | `D:\dev\jh-personal-projects\direct-play-games` | 커밋 120, 최근 2026-09-28 |
| Bus Explorer | `E:\dev-e\jh-projects\bus-route-in-trip` | 커밋 30, 최근 2026-09-11 |
| 가나 공방 | `E:\dev-e\study-non-it\study-japanese-language-alphabet` | 커밋 46, 최근 2026-09-26 |
| Guitar Auto-Strum | `E:\dev-e\jh-projects\guitar-app-web` | 커밋 146, 최근 2026-09-29 |
| CollaBoard | `E:\dev-e\jh-projects\collaboard-app` | 커밋 57, 최근 2026-09-27 |
| Songnote | `E:\dev-e\jh-projects\Piano-SongNote` | 커밋 25, 최근 2026-09-27 |
| Vocal Check | `E:\dev-e\jh-projects\vocal-check-app` | 커밋 7, 최근 2026-09-28 |

### 5.2 원칙

- 편수 목표를 두지 않는다. 다만 카드의 [개발 노트]가 의미를 가지려면 앱마다 최소 1편이 필요하므로 **노트가 없는 앱 4개(Direct Play, Bus Explorer, 가나 공방, Guitar Auto-Strum)를 먼저 채운다**.
- 근거는 저장소의 코드, 문서, 커밋 기록이다. 일반론 설명은 쓰지 않는다.
- 아래 후보는 저장소의 문서(`docs/`, `reusable*/`), 파일 머리말, 커밋 메시지를 읽고 뽑은 것이다. **실제로 왜 그렇게 했는지와 수치는 초안 작성 때 코드로 다시 확인하고, 그래도 남는 부분은 작성자(사용자)가 채운다.**
- 사용자가 흥미를 느낄 만한 것을 우선한다: 결과가 눈에 보이거나, "왜 이렇게까지?"라는 질문이 생기거나, 다른 사람이 같은 문제를 겪을 때 검색하게 될 주제.
- **범위에서 제외**: Guitar Auto-Strum의 Guitar Pro·MIDI 악보 재생기는 홈 화면 설명에서 의도적으로 뺐다(커밋 `d322212`). 이 기능을 다루는 노트는 쓰지 않는다.

### 5.3 앱별 노트 후보

각 표의 "근거"는 초안 작성 때 읽을 실제 위치다. **우선** 열의 1은 첫 번째 묶음, 2는 두 번째 묶음, 3은 여유가 있을 때다.

#### Direct Play (9개 게임, 서버 없는 게임방)

| # | 가제 | 흥미 포인트 | 근거 | 우선 |
| --- | --- | --- | --- | --- |
| DP-1 | 서버는 방만 열어 주고, 사진은 서버를 거치지 않는다 | 게임방을 여는 서버가 어떻게 가벼울 수 있는가. 방장 브라우저가 사진을 들고 있다가 참가자에게 직접 준다 | `docs/reusable-techniques/lightweight-group-session-architecture.md`, `p2p-shared-group-room.md`, `README.md`(운영 스택) | 1 |
| DP-2 | 로그인 없이 "방장"을 알아보는 법 | 회원가입 없이 관리자와 입장권을 나누는 토큰 설계 | `capability-tokens-no-login.md` | 2 |
| DP-3 | 게임을 아홉 개로 늘려도 로비가 가벼운 이유 | 카탈로그는 메뉴판, 게임은 고를 때만 불러온다. 새 게임을 추가하는 구조 | `feature-plugin-registry.md`, `frontend/games/registry.js`, `docs/Game-Developer-Guide.md` | 1 |
| DP-4 | 스파이 게임의 비밀은 어디에 있나 | 12명 앞에서 역할을 숨기는 법. 방장 브라우저가 심판이 되고, 비밀 카드는 한 사람에게만 간다 | `docs/plans/spy-game-implementation-plan.md`(5·6절 권위 모델, 비밀 정보 모델), `frontend/games/spy-game/` | 1 |
| DP-5 | 사진 한 장으로 "여기가 어디게?" | 사진의 GPS를 읽고 지도 키 없이 보여 준다. 장소 후보 자동 추천, 정방형 크롭 | `exif-gps-google-maps.md`, `canvas-square-crop.md`, 커밋 "find a GPS photo by random sampling" | 2 |
| DP-6 | 포켓 레이스: 1분짜리 레이싱을 폰 4대로 | 실시간 상태 전송과 충돌, 절대 시각으로 3-2-1-GO 맞추기 | `frontend/games/pocket-race/logic.js`(상수·트랙), `docs/games/pocket-race.md` | 2 |
| DP-7 | 방에도 수명이 있다 | 설정 중 1시간, 활동 후 3일, 보관 후 7일. Durable Object 알람과 하루 500방 한도 | `README.md`(방 생명주기), `cloudflare-room-do-websocket.md` | 2 |
| DP-8 | 게임마다 주소를 주면 생기는 일 | `spy-game.still-coding.cc`가 방으로 바로 들어가는 구조와 그 대가(방 생성 한도) | `docs/game-entry-links.md`, 커밋 "redirect <game id>.still-coding.cc" | 2 |
| DP-9 | 테스터 피드백 위젯을 숨겼다 | 상단 제목을 5번 눌러야 나타나고 1분 쿨다운. 남용 방지 설계 | `tester-feedback-widget-abuse-protection.md` | 3 |

- 확인 필요: 숫자 야구, 미니 스도쿠, 숫자합 퍼즐의 문제 생성 방식은 아직 코드를 읽지 않았다. 흥미로운 로직이 있으면 후보에 추가한다.

#### Bus Explorer (울산 시내버스)

| # | 가제 | 흥미 포인트 | 근거 | 우선 |
| --- | --- | --- | --- | --- |
| BUS-1 | 시간표가 없는 버스 경로를 어떻게 "몇 분"이라고 말하나 | 정류장 수만 아는 데이터에서 소요 시간을 추정한다. 도착정보의 `arrtime / arrprevstationcnt`로 지금 속도를 알아낸다 | `app/timing.py`(머리말 설명), `app/main.py` | 1 |
| BUS-2 | 버스를 지켜보다 구간 시간을 배우다 | 차량 위치를 반복 수집해 정류장 사이 소요 시간을 관측한다. 수집기를 상주 서비스로 돌린 이유 | `app/segments.py`, `app/observations.py`, `app/scheduler.py`, 커밋 "learn stop-to-stop travel times" | 2 |
| BUS-3 | 환승 경로 찾기: 라운드 기반 탐색과 걸어서 갈아타기 | 환승 횟수를 라운드로 늘려 가며 찾고, 도보 환승을 끼워 넣는다 | `app/routing.py`(`StaticRouter`, `Walk`), 커밋 "round-based trip search with footpath transfers" | 2 |
| BUS-4 | 공공 API를 덜 두드리는 캐시 | 호출 한도가 있는 공공 API에서 캐시, 임대 잠금(lease), 첫 실패 재시도 | `app/cache.py`, `docs/api-cache-improvement-plan.md` | 2 |
| BUS-5 | 111번은 왜 하나가 아닌가 | 같은 번호의 노선을 묶고 방향을 표시한 이야기 | 커밋 "group 111 routes and show direction status", `docs/api-smoke-report.md` | 3 |

#### 가나 공방 (히라가나·가타카나 학습 PWA)

| # | 가제 | 흥미 포인트 | 근거 | 우선 |
| --- | --- | --- | --- | --- |
| KANA-1 | iPad에서 짧은 획이 사라지고 시리가 뜬다 | 재현하기 어려운 버그의 원인 추적. 다른 필기 앱을 만드는 사람이 검색할 만한 주제 | `reusable/ipad-pencil-short-stroke-siri-gesture.md`, `src/components/InkCanvas.tsx` | 1 |
| KANA-2 | 글자가 획순대로 써지게 하려면 폰트로는 안 된다 | 획 윤곽과 중심선, SVG `stroke-dashoffset`로 그리는 법. 46자 데이터 만들기 | `reusable/hiragana-stroke-order-animation.md`, `src/components/StrokeOrderDemo.tsx`, `scripts/generate-stroke-order.mjs` | 1 |
| KANA-3 | 로마자로 일본어를 입력하게 가르치다 | IME와 포커스에 상관없이 키를 받는 법, 조사 は, 작은 글자, 촉음 규칙 | `src/components/TypingLab.tsx`, `src/lib/kanaNormalize.ts`, 커밋 "capture typing keys independently of focus and IME" | 2 |
| KANA-4 | 서비스 워커가 JS를 가로채 앱이 죽었다 | 배포 후 MIME 오류를 두 번 고친 기록. PWA 캐시의 함정 | 커밋 "SW ... MIME"(2026-08-05), `public/`의 서비스 워커 | 2 |
| KANA-5 | 확장 가나를 "규칙"으로 가르치다 | 46자 다음의 탁음·요음을 외우게 하지 않고 만들어 내는 규칙으로 | `tests/extendedStudy.test.ts`, 커밋 "teach extended kana as derivation rules" | 2 |
| KANA-6 | 사전 녹음과 Web TTS를 섞은 발음 | 오디오 스프라이트 우선, 없으면 브라우저 TTS. Gemini TTS로 문장 녹음 | `utility/tts`, `output/audio/`, `tests/voiceManifest.test.ts` | 3 |

#### Guitar Auto-Strum

| # | 가제 | 흥미 포인트 | 근거 | 우선 |
| --- | --- | --- | --- | --- |
| GTR-1 | 박자가 흔들리지 않는 자동 반주 | 브라우저 타이머는 부정확하다. 미리 예약(look-ahead)해서 박자를 지키는 법 | `web-app/js/engine/transport.js`, `schedule.js`, `docs/architecture.md` | 1 |
| GTR-2 | 카포를 마이너스로: 진짜 카포에 없는 방향 | −5~+7까지 두는 이유(손의 한계 vs 귀의 한계), 코드 이름 `C (→D)` 표기 | `web-app/js/music/capo.js`, `docs/architecture.md` 1절 | 1 |
| GTR-3 | 샘플 없이 기타 소리 만들기 | 줄을 물리적으로 모델링해 소리를 만든다. 재생 속도 25~150% | `web-app/js/engine/string-voice.js`, `synth.js`, `docs/sound-engine-explainer.html` | 2 |
| GTR-4 | 스윙과 사람 같은 어긋남 | 정확한 박자에 일부러 흔들림을 주는 스윙·휴머나이즈 | `web-app/js/engine/feel.js`, 커밋 "Add swing and humanize" | 2 |
| GTR-5 | 타이밍 변경을 골든 스냅샷으로 지킨다 | 모든 리듬을 실제 엔진에 돌려 기록과 비교한다. 의도한 변경일 때만 갱신 | `web-app/js/test/`(transport golden), `package.json`의 `test:golden` | 2 |
| GTR-6 | 빌드 단계 없는 앱에 타입 검사만 붙이다 | 번들러 없이 ES 모듈을 그대로 배포하고 JSDoc으로 `tsc --checkJs` | `jsconfig.json`, `package.json`, `README.md` | 3 |
| GTR-7 | 사진 속 악보에서 코드 진행을 읽는다 | Gemini로 악보 이미지를 코드 진행으로 변환하는 도구 | `tools/omr/`, `docs/ai-recognize-song.md` | 확인 필요 |

- GTR-7은 이 도구가 앱에 포함되어 공개되는지 확인이 필요하다. 공개 기능이 아니면 쓰지 않는다.

#### CollaBoard, Songnote, Vocal Check (이미 1편씩 있음)

기존 글: CollaBoard "서버는 방만 만든다", Songnote "ABC 악보와 가산 합성", Vocal Check "YIN 음정 검출". 후속 글은 **코드를 다시 읽고 나서 후보를 확정**한다(아직 읽지 않았다).

| 앱 | 방향 (확정 전) |
| --- | --- |
| CollaBoard | 신규 참여자에게 기존 상태 전달하기, 동시 수정 충돌 해결, 8개 도구를 한 방에 얹은 구조 |
| Songnote | 악보를 서버 없이 브라우저에 저장하는 방식, 연주 화면 |
| Vocal Check | 마이크 입력 지연과 옥타브 오류 다루기, 결과 시각화 |

### 5.4 작성 순서

1. **1묶음(우선 1)**: DP-1, DP-3, DP-4, BUS-1, KANA-1, KANA-2, GTR-1, GTR-2 — 앱 4개가 각각 1편 이상 갖도록 하는 것이 목표.
2. **2묶음(우선 2)**: 우선 2 항목. 앱당 2편 안팎이 된다.
3. **3묶음**: 우선 3과 기존 3개 앱의 후속 글은 여유가 있을 때.
4. 사용자가 주제를 바꾸거나 빼도 된다. 후보는 제안일 뿐이다.

### 5.5 초안 → 검토 → 공개 흐름

초안은 사용자가 수정·보완하기 전에는 공개되면 안 된다. 이를 위해 노트에 `draft` 필드를 둔다(4.1 참고).

```markdown
---
title: "..."
description: "..."
pubDate: 2026-10-01
app: direct-play
tags: ["WebRTC", "Cloudflare"]
draft: true
---
```

1. Claude가 저장소를 읽고 초안을 `src/content/notes/`에 `draft: true`로 만든다.
2. 초안에는 사용자가 채울 곳을 `<!-- TODO(사용자): ... -->` 주석으로 표시한다. 예: 만든 이유, 실제로 겪은 시행착오, 측정값, 스크린샷 위치.
3. 사용자가 로컬 개발 서버에서 초안을 보며 수정·보완한다(개발 서버는 초안도 "초안" 배지와 함께 보여 준다).
4. 만족하면 `draft: true`를 지우고 `pubDate`를 확정한다. 이때부터 목록·카드·사이트맵에 나타난다.
5. Claude가 빌드를 확인하고 커밋한다.

초안은 저장소에 커밋해도 프로덕션 빌드에는 포함되지 않는다. 사이트에 공개되는 것은 `draft`가 없는 글뿐이다.

### 5.6 템플릿

`docs/NOTE_TEMPLATE.md`(본 계획 구현 시 함께 작성)에 다음을 담는다.

- frontmatter: `title`, `description`(검색 결과용 1~2문장), `pubDate`, `app`(apps.ts의 id와 일치), `tags`, `draft`
- 본문 흐름: 왜 만들었나 → 해결하려던 문제 → 처음 생각한 구조 → 실제 구현 → 만난 문제 → 해결 → 결과 → 다시 만든다면
- 규칙: 파일명은 영문 소문자·하이픈, `app.md` 금지(경로 충돌), 코드 조각과 수치는 실제 코드에서 가져올 것, 앱 링크는 본문 하단 "관련 앱"이 자동 생성하므로 본문에는 필요한 경우만 넣을 것

### 5.7 글 1편 작성 절차

1. 위 표의 근거 파일과 관련 커밋을 읽고 글의 뼈대와 사용할 코드·수치를 정한다.
2. 초안을 쓰고 `draft: true`로 저장한다. 확인하지 못한 사실은 쓰지 않고 TODO 주석으로 남긴다.
3. 사용자가 수정·보완한다(5.5).
4. 빌드·미리보기 확인 후 공개 커밋.

## 6. 3단계 — 페이지 보강

- **About**(`about.astro`, `en/about.astro`): "누가 → 왜 → 무엇을" 흐름으로 다시 쓰고, Apps와 Notes가 연결된 사이트라는 점을 한 문단으로 설명한다. 개인정보는 과도하게 넣지 않는다.
- **홈 소개문**: 앱 카드 영역 위에 "Apps는 만든 것, Notes는 만든 과정" 한 문장 안내를 넣는다.
- **미완성 표시 점검**: "다듬는 중" 문구, 자리 표시 링크, 빈 섹션을 찾아 제거하거나 다듬는다.
- **Privacy**: 조건부 문장("게재될 수 있습니다")은 그대로 유지한다. 단, "EEA 방문자에게 CMP로 동의를 받는다"는 문장은 대시보드에서 CMP를 켜야 사실이 되므로 신청 직후 설정한다(사용자 작업).

## 7. 4단계 — 검색·기술 점검

| # | 작업 | 담당 | 확인 방법 |
| --- | --- | --- | --- |
| 1 | Search Console에 도메인 속성으로 `still-coding.cc` 등록 | 사용자 | DNS TXT 인증(Cloudflare) |
| 2 | 사이트맵 `https://still-coding.cc/sitemap.xml` 제출 | 사용자 | 상태 "성공" |
| 3 | 홈·About·Privacy·Notes·대표 노트·앱 상세 URL 검사 | 사용자 | "Google에 등록됨" |
| 4 | 배포본 `robots.txt` 확인 | Claude | `Disallow: /` 없음 |
| 5 | Cloudflare Bot Fight Mode / AI 봇 차단이 Googlebot·Mediapartners-Google을 막지 않는지 | 사용자 | 대시보드 보안 이벤트 |
| 6 | 빌드 산출물 내부 링크 전수 검사 | Claude | 스크립트로 404 0건 |
| 7 | `www` → 루트 301, `workers.dev` 호스트 처리 | 사용자 | Redirect Rule, 응답 코드 |
| 8 | 하위 앱 7개 접속·정적 소개·privacy 페이지 확인 | Claude+사용자 | 각 `/privacy/`가 200 |
| 9 | 모바일(360/768/1280px) 화면 확인 | Claude | 브라우저 미리보기 |

색인은 Google이 결정하며 시간이 걸린다(수일~수주). 모든 페이지의 색인이 신청의 필수 조건은 아니다. 목적은 크롤러가 정상 접근하고 사이트가 완성돼 보이는지 확인하는 것이다.

## 8. 검증 기준

### 1단계 완료 조건

- [ ] `pnpm run build`(`astro check && astro build`) 통과
- [ ] 노트가 있는 앱(collaboard, piano-play, vocal-check)의 카드에만 [개발 노트]가 보이고 `/notes/app/{id}/`로 이동한다
- [ ] 노트가 0편인 앱은 카드 버튼도, `/notes/app/{id}/` 페이지도 없다
- [ ] `/notes/`에 앱별 묶음과 최신순 목록이 함께 표시된다
- [ ] 노트 상세에서 [앱 실행], 앱 상세, 같은 앱의 다른 노트로 이동할 수 있다
- [ ] 존재하지 않는 앱 id를 쓴 노트를 넣으면 빌드가 실패한다 (일부러 넣어 확인)
- [ ] `draft: true` 노트는 개발 서버에서만 보이고, 프로덕션 빌드의 페이지·목록·사이트맵·카드 편수에 나타나지 않는다 (`dist/`를 검색해 확인)
- [ ] 사이트맵에 `/notes/app/{id}/`가 포함된다
- [ ] 360/768/1280px에서 가로 스크롤과 겹침이 없다
- [ ] 콘솔 오류 없음, 영어 화면에서 `Dev Notes (KR)`가 한국어 경로로 이동한다

### 전체 완료 조건 (신청 직전)

- [ ] 앱 7개 모두 [개발 노트]가 보인다 (앱마다 1편 이상)
- [ ] About·홈 문구가 Apps ↔ Notes 구조를 설명한다
- [ ] Search Console 등록·사이트맵 제출 완료, 주요 URL 색인 확인
- [ ] 내부 링크 404 0건, `robots.txt`·봇 차단 점검 완료
- [ ] `.env`에 게시자 ID 반영 후 `/ads.txt`와 메타 태그 확인 (`ADSENSE_APPROVAL.md`)

## 9. 위험과 대응

| 위험 | 대응 |
| --- | --- |
| 노트가 얇거나 AI 일반론으로 보임 | 5.7 절차: 실제 코드·수치 근거, 사용자 사실 검토 |
| 검토 전 초안이 공개됨 | `draft` 필드로 프로덕션 빌드에서 제외, 빌드 결과 검색으로 확인 |
| 초안의 사실 오류 | 확인하지 못한 내용은 쓰지 않고 TODO로 남김, 사용자 검토 후 공개 |
| 노트 0편 앱에 빈 링크 생성 | 카드·페이지 모두 `noteCount > 0` 조건 |
| 노트의 `app` 오타로 링크 끊김 | 헬퍼에서 검증해 빌드 실패 처리 |
| 카드 액션 증가로 모바일 레이아웃 깨짐 | 360px 확인, 필요 시 줄 분리 |
| 슬러그 `app` 충돌 | 템플릿에 금지 명시 |
| 신청 시점에 사이트 구조가 계속 바뀜 | 1단계 완료 후 구조 동결, 이후에는 노트 추가만 |

## 10. 결정이 필요한 항목

1. **영어 앱 상세에 `Dev Notes (KR)` 섹션을 넣을지** — 영어 화면에서도 한국어 노트를 발견할 수 있게 하는 대신, 영어 사용자에게 읽을 수 없는 링크가 늘어난다. 기본안: 카드 버튼만 추가하고 영어 상세는 변경하지 않는다.
2. **`/notes/`의 묶음 기준** — 기본안은 앱 단위. 제안서의 "Music" 같은 카테고리 묶음은 편수가 늘면 재검토한다.
3. **첫 작성 묶음** — 기본안은 5.4의 1묶음 8편(DP-1, DP-3, DP-4, BUS-1, KANA-1, KANA-2, GTR-1, GTR-2). 주제를 바꾸거나 빼려면 알려 주세요.
