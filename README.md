# Still Coding

> **"사용할 수 있는 아이디어를 계속 만들고 있습니다."**  
> Games, learning tools and creative experiments — designed, built and operated by JH Kim.

[Still Coding](https://still-coding.cc/)은 실제로 만들고 운영하는 웹 애플리케이션들을 소개하고, 방문자가 각 앱을 브라우저에서 직접 사용해 볼 수 있도록 연결하는 제품 포트폴리오 사이트입니다.

---

## 🌐 라이브 사이트

- **공식 도메인**: [https://still-coding.cc](https://still-coding.cc)
- **보조 도메인**: [https://www.still-coding.cc](https://www.still-coding.cc)
- **Cloudflare Workers**: [https://still-coding-portfolio.kimiyohome.workers.dev](https://still-coding-portfolio.kimiyohome.workers.dev)

### 등록된 앱 목록

| 앱 | 카테고리 | 상태 | 설명 | 링크 |
|---|---|---|---|---|
| **Direct Play** | Play | `Public` | 링크 하나로 방을 만들고 함께 즐기는 브라우저 게임 모음 (사진 퍼즐, 숫자 야구 등 7종) | [바로가기](https://dp.still-coding.cc/) |
| **Pinhole Lab** | Play | `Public` | 작은 규칙과 관찰을 중심으로 한 퍼즐 게임 컬렉션 (Pinhole, Sum Drop) | [바로가기](https://pinhole-game.still-coding.cc/) |
| **가나 공방** | Learn | `Public` | 히라가나와 가타카나를 듣고 말하고 쓰며 익히는 일본어 학습 도구 | [바로가기](https://study-hiragana.still-coding.cc/) |
| **Guitar Auto-Strum** | Create | `Private beta` | 코드와 리듬을 선택해 기타 자동 반주를 연주하는 웹 오디오 도구 | *검증 중 (Access 제한)* |
| **CollaBoard** | Create | `Public` | 서버 저장 없이 WebRTC로 연결하는 화이트보드·브레인스토밍·Q&A·퀴즈·투표·파일 공유 공간 | [바로가기](https://collaboard.still-coding.cc/) |

---

## 🎨 핵심 디자인 콘셉트: Living Geometry

- **디지털 작업실(Digital Atelier)**: 기하학적 캔버스 배경의 점(노드)과 선은 지속적으로 조립되고 연결되는 프로젝트를 상징합니다.
- **인터랙티브 반응**: 앱 카드에 호버하거나 포커스할 때 해당 앱의 고유 강조색(Accent Color) 노드가 캔버스에서 부드럽게 반응합니다.
- **접근성(A11y)**: WCAG AA 준수, 키보드 내비게이션 완벽 지원, `prefers-reduced-motion` 감지 시 캔버스 정지 모드 지원.

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
│  ├─ favicon.svg
│  └─ robots.txt
├─ src/
│  ├─ components/
│  │  ├─ AppCard.astro       # 앱 카드 컴포넌트 (상태, 태그, CTA 링크)
│  │  ├─ AppVisual.astro     # 앱별 고유 기하학 비주얼 일러스트
│  │  └─ GeometryBackground.astro # 반응형 인터랙티브 Canvas 배경
│  ├─ data/
│  │  └─ apps.ts            # 앱 카탈로그 레지스트리 (데이터 모델)
│  ├─ layouts/
│  │  └─ BaseLayout.astro    # 공통 HTML 레이아웃 (SEO, Meta, OG)
│  ├─ pages/
│  │  ├─ index.astro        # 메인 페이지 (Hero, Bento Grid, About, Footer)
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

Cloudflare의 **CNAME Flattening** 덕분에 루트 도메인(`still-coding.cc`)과 `www` 서브도메인을 모두 Worker Custom Domain으로 직접 매핑하여 운영합니다.

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "still-coding-portfolio",
  "compatibility_date": "2026-09-01",
  "workers_dev": true,
  "preview_urls": true,
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  },
  "routes": [
    {
      "pattern": "still-coding.cc",
      "custom_domain": true
    },
    {
      "pattern": "www.still-coding.cc",
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
  url: "https://my-app.still-coding.cc/",
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
