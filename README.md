# Still Coding

> **"생각한 것을, 작동하게 만듭니다."**
> Games, learning tools and creative experiments — designed, built and operated by JH Kim.

[Still Coding](https://still-coding.com/)은 실제로 만들고 운영하는 웹 애플리케이션들을 소개하고, 방문자가 각 앱을 브라우저에서 직접 사용해 볼 수 있도록 연결하는 제품 포트폴리오 사이트입니다.

---

## 🌐 라이브 사이트

- **공식 도메인**: [https://still-coding.com](https://still-coding.com)
- **보조 도메인**: `www.still-coding.com` — Cloudflare Redirect Rule로 루트 도메인에 301 리다이렉트합니다(아래 배포 절 참고).
- **앱 도메인**: 앱은 `<앱>.still-coding.com` 규칙을 따릅니다. 이전 전 앱은 `src/data/site.ts`의 `appUrl()`이 옛 `.cc` 주소를 돌려주며, 앱이 `.com`으로 옮겨지면 `migratedApps`에 서브도메인 이름을 추가하면 포털 전체 링크가 한 번에 바뀝니다. 루트 도메인은 `APP_DOMAIN` 상수 하나입니다.
- `*.workers.dev` 주소와 미리보기 URL은 중복 색인을 막기 위해 끕니다(`workers_dev: false`, `preview_urls: false`).

### 등록된 앱 목록

| 앱 | 카테고리 | 상태 | 설명 | 링크 |
|---|---|---|---|---|
| **Direct Play** | Play | `Public` | 링크 하나로 방을 만들고 함께 즐기는 브라우저 게임 모음 (사진 퍼즐, 숫자 야구, 미니 스도쿠, PINHOLE, SUM DROP 등 9종) | [바로가기](https://dp.still-coding.cc/) |
| **가나 공방** | Learn | `Public` | 히라가나와 가타카나를 듣고 말하고 쓰며 익히는 일본어 학습 도구 | [바로가기](https://study-hiragana.still-coding.cc/) |
| **Guitar Auto-Strum** | Create | `Public` | 실시간 코드 전환과 곡 코드 차트로 반주하는 브라우저 기타 자동 반주 (오프라인 PWA) | [바로가기](https://guitar-play.still-coding.cc/) |
| **CollaBoard** | Create | `Public` | 서버 저장 없이 WebRTC로 연결하는 8가지 협업 공간 (화이트보드·브레인스토밍·Q&A·퀴즈·투표·파일 공유·공지·피드백) | [바로가기](https://collaboard.still-coding.cc/) |
| **Bus Explorer** | Explore | `Public` | 정류장과 노선을 따라 도시의 연결을 탐색하는 버스 노선 도구 | [바로가기](https://bus-explorer.still-coding.cc/) |
| **Songnote** (Piano Play) | Create | `Public` | ABC 악보를 편집하고 108건반 합성 피아노로 듣는 스튜디오 | [바로가기](https://piano-play.still-coding.cc/) |
| **Vocal Check** | Learn | `Public` | 마이크 입력의 음정을 실시간으로 시각화하는 보컬 연습 도구 | [바로가기](https://vocal-check.still-coding.cc/) |

> Pinhole Lab(PINHOLE, SUM DROP)은 2026-09-28 Direct Play로 통합되었습니다. 예전 상세 주소 `/apps/pinhole-lab/`은 `public/_redirects`로 `/apps/direct-play/`에 301 연결합니다.

---

## 🎨 디자인 콘셉트: Independent Practice

앱이 개발자를 소개하는 개인 전시 공간입니다. 생성한 금속 궤도 조형물, 절제된 타이포그래피, 선별된 작품과 제작 관점으로 감각과 구현력을 전달합니다.

- 공개 작품 여러 개(Guitar Auto-Strum 포함). 비공개 실험 작업대 섹션은 공개 앱이 없어 제거했습니다.
- Direct Play 카드 미리보기는 9개 게임을 5.2초마다 차례로 소개합니다(마우스 올림·포커스·화면 밖·멈춤 버튼에서 정지, 모션 감소 설정 시 첫 게임 고정). 게임 목록은 `src/data/directPlayGames.ts`, 이미지는 `public/images/apps/direct-play/`에 있으며 Direct Play 카탈로그가 바뀌면 함께 갱신합니다.
- 썸네일·제목·행동 링크와 네이티브 details 기반 제작 노트.
- 모션 감소 설정 지원, 키보드 포커스, 본문 바로가기, JavaScript 없이도 읽을 수 있는 콘텐츠.
- 이미지 생성 프롬프트와 원본 위치: [디자인 기록](docs/design/independent-practice.md).
- 기존 GeometryBackground는 404 페이지에 유지됩니다.

---

## 🛠 기술 스택

- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Native CSS (CSS Custom Properties / Tokens), Component-scoped CSS
- **Typography**: `@fontsource-variable/manrope` (Sans), `@fontsource/noto-serif-kr` (Serif)
- **Canvas / Motion**: Vanilla HTML5 Canvas 2D API
- **Deployment & Hosting**: [Cloudflare Workers](https://workers.cloudflare.com/) (Static Assets) via [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

---

## 📁 디렉터리 구조

```text
still-coding/
├─ docs/
│  └─ SITE_DESIGN.md         # 상세 사이트 설계서 (기획/디자인/사양)
├─ public/
│  ├─ images/
│  │  ├─ brand/             # 브랜드 키 비주얼 자산
│  │  └─ apps/              # 앱 썸네일 이미지
│  ├─ favicon.ico, favicon-32.png, apple-touch-icon.png, icon-*.png, manifest.webmanifest
│  └─ robots.txt
├─ src/
│  ├─ content/notes/         # 개발 노트 Markdown (content.config.ts 스키마로 검증)
│  ├─ components/
│  │  ├─ AppCard.astro       # 앱 카드 컴포넌트 (상태, 태그, CTA 링크)
│  │  ├─ AppVisual.astro     # 앱별 고유 기하학 비주얼 일러스트
│  │  └─ GeometryBackground.astro # 반응형 인터랙티브 Canvas 배경
│  ├─ data/
│  │  ├─ apps.ts            # 앱 카탈로그 레지스트리 (데이터 모델)
│  │  └─ site.ts            # 운영자·연락처·AdSense 게시자 ID 설정
│  ├─ layouts/
│  │  └─ BaseLayout.astro    # 공통 HTML 레이아웃 (SEO, Meta, OG)
│  ├─ pages/
│  │  ├─ index.astro        # 메인 페이지 (Hero, 소개, Works, 노트, About, Footer)
│  │  ├─ notes/             # 개발 노트 목록·상세 (한국어)
│  │  ├─ privacy·terms·contact·about.astro  # 정책·운영 페이지 (en/ 아래 영어판)
│  │  ├─ sitemap.xml.ts     # 앱·노트 데이터로 사이트맵 생성
│  │  ├─ ads.txt.ts         # PUBLIC_ADSENSE_CLIENT가 있을 때만 판매자 행 출력
│  │  └─ 404.astro          # 커스텀 404 페이지
│  └─ styles/
│     └─ global.css         # 글로벌 토큰 및 리셋 스타일
├─ astro.config.mjs          # Astro 설정 파일
├─ package.json
├─ tsconfig.json
└─ wrangler.jsonc           # Cloudflare Workers 배포 및 커스텀 도메인 설정
```

---

## 💻 로컬 개발 환경

### 요구 사항

- Node.js 18.17.1 이상
- pnpm (권장) 또는 npm

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 로컬 개발 서버 시작 (http://localhost:4321)
pnpm run dev

# 타입 및 코드 진단 검사
pnpm run check

# 정적 사이트 빌드 (./dist 생성)
pnpm run build

# 빌드 결과 로컬 미리보기
pnpm run preview
```

### 빌드 환경변수

| 변수 | 용도 |
| --- | --- |
| `PUBLIC_ADSENSE_CLIENT` | AdSense 게시자 ID(`ca-pub-` + 16자리). 값이 있으면 모든 페이지 `<head>`에 `google-adsense-account` 메타 태그와 `adsbygoogle.js`를 넣고, `/ads.txt`에 판매자 행을 출력합니다. 형식이 틀리면 무시합니다. |
| `PUBLIC_FEEDBACK_APP_ID` | 테스터 피드백 위젯 앱 ID. 없으면 위젯을 넣지 않습니다. |
| `PUBLIC_FEEDBACK_BASE_URL` | 피드백 서비스 주소. 없으면 `appUrl("user-feedback")`(`https://user-feedback.still-coding.com`)를 씁니다. 로컬 `.env`에 옛 `.cc` 값이 있으면 지우거나 `.com`으로 바꾸세요. |

빌드는 로컬에서 하고 `dist/`를 배포하므로, 값은 저장소 루트의 `.env`(커밋하지 않음)에 둡니다.

```bash
# .env
PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
```

### 개발 노트 추가

`src/content/notes/`에 Markdown 파일을 추가하면 `/notes/<파일명>/`으로 게시되고, 노트 목록·홈·사이트맵에 자동으로 들어갑니다. `app`에 `apps.ts`의 `id`를 적으면 해당 앱 상세 페이지에도 링크가 붙습니다.

```markdown
---
title: "글 제목"
description: "목록과 검색 결과에 보일 한두 문장 요약"
pubDate: 2026-10-01
app: vocal-check   # 선택
tags: ["Web Audio"]
---
```

---

## 🚀 배포 (Cloudflare Workers)

이 프로젝트는 Cloudflare Workers의 **Static Assets** 기능을 통해 전 세계 엣지 네트워크로 배포됩니다.

### 배포 명령어

```bash
# 빌드 및 프로덕션 배포
pnpm run deploy
# 또는
npx wrangler deploy
```

### 도메인 및 라우트 구성 (`wrangler.jsonc`)

루트 도메인(`still-coding.com`)과 `www` 서브도메인을 모두 Worker Custom Domain으로 연결하되, 대표 주소는 루트 도메인 하나입니다. 같은 내용이 두 주소로 색인되지 않도록 Cloudflare 대시보드에서 `www`를 루트로 301 리다이렉트합니다.

1. Cloudflare 대시보드 → `still-coding.com` → **Rules → Redirect Rules → Create rule**
2. 템플릿 **Redirect from WWW to root**를 선택하거나, 조건 `Hostname equals www.still-coding.com`, 동작 `Dynamic` / `concat("https://still-coding.com", http.request.uri.path)` / `301` / 쿼리 문자열 유지로 만듭니다.
3. `curl -I https://www.still-coding.com/about/`가 `301`과 `location: https://still-coding.com/about/`를 돌려주는지 확인합니다.

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "still-coding-portfolio",
  "compatibility_date": "2026-09-01",
  "workers_dev": false,
  "preview_urls": false,
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  },
  "routes": [
    {
      "pattern": "still-coding.com",
      "custom_domain": true
    },
    {
      "pattern": "www.still-coding.com",
      "custom_domain": true
    }
  ]
}
```

---

## ➕ 신규 앱 등록 방법

신규 앱을 포트폴리오에 추가할 때는 `src/data/apps.ts` 파일의 `apps` 배열에 항목을 추가하면 됩니다.

```typescript
// src/data/apps.ts
{
  id: "my-new-app",
  title: "앱 이름",
  eyebrow: "카테고리 번호 / 01",
  url: "https://my-app.still-coding.com/",
  category: "play", // "play" | "learn" | "create" | "explore"
  status: "public", // "public" | "preview" | "private-beta" | "coming-soon"
  summary: "간결한 한 줄 요약",
  detail: "상세 설명 문구",
  tags: ["태그1", "태그2"],
  accent: "#색상코드",      // 주 강조색
  accentSoft: "#보조색상코드", // 보조 강조색
  visual: "direct-play",
  size: "standard",        // "wide" (2열 차지) 또는 "standard"
  order: 5,
}
```

> **참고**: `status: "private-beta"`인 앱은 검증 중인 외부 사용자가 인증 실패 화면으로 무단 진입하지 않도록 메인 카드의 바로가기 링크가 비활성화됩니다.

---

## 📄 라이선스 및 문서

- 사이트 기획 및 설계 상세: [docs/SITE_DESIGN.md](docs/SITE_DESIGN.md)
- 저작권: © Still Coding. Designed & Built by JH Kim.
