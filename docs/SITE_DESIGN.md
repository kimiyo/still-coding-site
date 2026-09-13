# Still Coding 포트폴리오 사이트 설계서

> 문서 상태: Draft v1.0  
> 작성일: 2026-09-13  
> 대상 도메인: `https://still-coding.cc/`

## 1. 문서 목적

Still Coding은 개발자가 외부에 공개하거나 공개를 준비 중인 웹 앱을 소개하고, 방문자가 각 앱을 직접 사용해 볼 수 있도록 연결하는 제품 포트폴리오다.

이 사이트의 주인공은 개발자의 경력이나 기술 목록이 아니라 **실제로 작동하고 운영되는 앱**이다. 사이트는 앱마다 다른 시각적 개성을 보존하면서, 하나의 Still Coding 브랜드 아래에서 탐색할 수 있는 전시장 역할을 한다.

## 2. 제품 목표

### 2.1 핵심 목표

1. 방문자가 첫 화면에서 Still Coding의 성격을 5초 안에 이해한다.
2. 공개 앱을 목적별로 탐색하고 한 번의 클릭으로 실행할 수 있다.
3. 비공개 검증 중인 앱도 적절한 상태 표시와 함께 소개할 수 있다.
4. 새 앱을 코드 변경 최소화로 등록할 수 있다.
5. 시각적으로 역동적이면서도 접근성과 성능을 유지한다.

### 2.2 비목표

- 포트폴리오에서 앱별 계정이나 데이터를 통합 관리하지 않는다.
- Cloudflare에 배포된 모든 프로젝트를 자동 공개하지 않는다.
- 초기 버전에서는 별도의 CMS나 관리자 페이지를 만들지 않는다.
- 앱 상세 설명을 위해 복잡한 블로그 시스템을 도입하지 않는다.

## 3. 브랜드와 디자인 콘셉트

### 3.1 핵심 콘셉트: Living Geometry

Still Coding을 **계속 조립되고 연결되는 디지털 작업실**로 표현한다.

- 점: 하나의 앱 또는 아이디어
- 선: 앱과 기술, 관심사 사이의 연결
- 채워진 노드: 공개 앱
- 점선 또는 빈 노드: Preview, Private beta, Coming soon
- 움직임: 지속적인 개발과 실험

기하학 배경은 단순 장식이 아니라 앱 카드와 반응하는 하나의 인터랙션 레이어다. 특정 앱 카드에 포커스하거나 마우스를 올리면 해당 앱의 색상과 연결 노드가 활성화된다.

### 3.2 브랜드 인상

| 속성 | 방향 |
|---|---|
| 분위기 | 정교한 실험실, 디지털 설계도, 살아 있는 작업대 |
| 화면 구성 | 비대칭, 넓은 여백, 크기가 다른 프로젝트 카드 |
| 색상 | Charcoal과 Ivory를 기본으로 앱별 강조색 사용 |
| 질감 | 이전 포트폴리오의 한지 감성을 매우 약한 grain으로 계승 |
| 모션 | 느리고 의도적이며 입력에 반응하는 움직임 |
| 지양 | 보라색 그라데이션, 과도한 glassmorphism, 동일 크기 카드 나열 |

### 3.3 브랜드 문구 초안

주 문구:

> 사용할 수 있는 아이디어를 계속 만들고 있습니다.

보조 문구:

> Games, learning tools and creative experiments — designed, built and operated by JH Kim.

표기 원칙:

- 브랜드명은 `STILL / CODING` 또는 `Still Coding`을 사용한다.
- 앱 제목은 앱 자체의 공식 표기를 우선한다.
- 본문 기본 언어는 한국어로 시작하되 앱명과 짧은 장식 문구에는 영어를 사용할 수 있다.

## 4. 콘텐츠 분류

### 4.1 카테고리

기술 스택이 아니라 방문자의 사용 목적을 기준으로 한다.

| ID | 표시명 | 설명 |
|---|---|---|
| `play` | Play | 게임, 퍼즐, 함께 즐기는 경험 |
| `learn` | Learn | 언어 및 지식 학습 도구 |
| `create` | Create | 음악, 이미지, 글 등 창작을 돕는 도구 |
| `explore` | Explore | 새로운 인터랙션과 기술을 검증하는 실험 |
| `archive` | Archive | 더 이상 적극적으로 운영하지 않는 기록 |

### 4.2 공개 상태

카테고리와 공개 상태는 서로 독립적으로 관리한다.

| 상태 | 노출 | 기본 CTA |
|---|---|---|
| `public` | 전체 공개 | `앱 열기` |
| `preview` | 전체 공개, 시험 운영 표시 | `미리 보기` |
| `private-beta` | 소개 공개, 앱은 접근 제한 | `검증 중` 또는 허용 사용자용 링크 |
| `coming-soon` | 소개만 공개 | `준비 중` |
| `archived` | Archive 필터에서 노출 | `기록 보기` |

Cloudflare Access 로그인 실패 화면으로 일반 사용자를 불필요하게 보내지 않도록 `private-beta` 앱의 기본 카드는 링크를 비활성화한다. 필요하면 별도의 작은 `테스트 사용자 접속` 링크를 제공한다.

## 5. 초기 앱 카탈로그

| 앱 | URL | 카테고리 | 상태 | 설명 초안 |
|---|---|---|---|---|
| Direct Play | `https://dp.still-coding.cc/` | Play | Public | 링크 하나로 방을 만들고 함께 즐기는 브라우저 게임 모음 |
| Pinhole Lab | `https://pinhole-game.still-coding.cc/` | Play | Public | 작은 규칙과 관찰, 계산을 중심으로 만든 게임 컬렉션 |
| 가나 공방 | `https://study-hiragana.still-coding.cc/` | Learn | Public | 히라가나와 가타카나를 듣고 말하고 쓰며 익히는 학습 도구 |
| Guitar Auto-Strum | `https://guitar-play.still-coding.cc/` | Create | Private beta | 코드와 리듬을 선택해 기타 자동 반주를 만드는 브라우저 음악 도구 |

Guitar Auto-Strum은 `guitar-auto-strum-app` Workers 앱으로 migration이 완료된 상태다. 현재 Cloudflare Access로 개발자와 테스트 사용자만 접근할 수 있으며, 검증 완료 후 Public으로 상태를 변경한다.

Direct Play 내부의 여러 게임과 Pinhole Lab 내부의 두 게임은 초기 포트폴리오에서 별도 최상위 카드로 중복 등록하지 않는다. 각 서비스 자체가 게임 컬렉션이므로 컬렉션 단위로 소개한다.

## 6. 정보 구조

초기 버전은 단일 페이지를 기본으로 한다.

```text
/
├─ Header
├─ Hero
├─ Featured Apps
├─ All Apps + Category Filters
├─ Making Principles
├─ About
└─ Footer
```

앱 수와 설명이 증가하면 `/apps/[slug]` 상세 페이지를 추가한다. 초기 구현부터 데이터 모델에는 상세 페이지용 필드를 포함하지만 모든 앱에 상세 페이지 생성을 강제하지 않는다.

## 7. 화면 설계

### 7.1 Header

- 좌측: `STILL / CODING` 로고
- 우측: `Apps`, `About`, GitHub 링크
- 스크롤 전에는 투명, 스크롤 후에는 반투명한 짙은 배경과 얇은 하단 선 적용
- 모바일에서는 복잡한 햄버거 메뉴보다 핵심 링크 2개만 유지

### 7.2 Hero

```text
STILL / CODING                                  04 WORKS

사용할 수 있는 아이디어를
계속 만들고 있습니다.

Games, learning tools and creative experiments —
designed, built and operated by JH Kim.

[앱 둘러보기 ↓]                         ● SYSTEMS ONLINE
```

- 텍스트는 좌측 7열, 대표 기하학 오브젝트는 우측 5열
- 진입 시 제목, 설명, CTA, 기하학 선 순서로 등장
- Hero 하단의 선과 노드가 Featured Apps 영역으로 이어짐
- 공개 앱 수를 수동 데이터에서 계산하여 표시

### 7.3 Featured Apps

- 2열 기반의 비대칭 Bento 레이아웃
- 첫 번째 대표 앱은 2배 크기로 표시
- 앱 썸네일이 카드 면적의 60~70%를 차지
- 상태, 카테고리, 한 줄 설명만 기본 노출
- 호버와 키보드 포커스 시 추가 정보와 CTA 표시

권장 초기 배치:

```text
┌─────────────────────────────┐ ┌───────────────┐
│ DIRECT PLAY                 │ │ PINHOLE LAB   │
│ Featured / large            │ └───────────────┘
│                             │ ┌───────────────┐
└─────────────────────────────┘ │ 가나 공방      │
┌───────────────────────┐       └───────────────┘
│ GUITAR AUTO-STRUM     │
│ PRIVATE BETA          │
└───────────────────────┘
```

### 7.4 All Apps

- 필터: `All`, `Play`, `Learn`, `Create`, `Explore`
- 필터 변경 시 카드가 무작위로 날아다니지 않고 짧은 opacity/position 전환으로 재배치
- 각 필터 버튼에 결과 개수를 표시할 수 있음
- URL query 또는 hash로 현재 필터를 공유할 수 있도록 설계

### 7.5 Making Principles

긴 기술 스택 대신 제작 원칙 세 가지를 짧게 보여 준다.

1. **Usable** — 설명보다 먼저 직접 사용할 수 있게 만든다.
2. **Focused** — 하나의 문제와 경험에 집중한다.
3. **Operated** — 배포 이후에도 관찰하고 개선한다.

### 7.6 About 및 Footer

- About은 3~4문장으로 제한
- GitHub와 이메일 링크 제공
- 운영 주체와 저작권 연도 표시
- 개인정보처리방침이 필요한 경우 포트폴리오 공통 정책 또는 개별 앱 정책으로 연결

## 8. 앱 카드 사양

### 8.1 기본 정보

```text
[썸네일]

DIRECT PLAY                                      PUBLIC
친구들과 링크 하나로 시작하는 브라우저 게임 모음

Play · Multiplayer · 7 games                    OPEN ↗
```

### 8.2 인터랙션

- 카드 진입: 아래에서 16~24px 이동하며 fade-in
- 호버: 썸네일 scale `1.02~1.04`
- 포커스: 호버와 동일한 정보 제공
- 테두리: 네 모서리가 조립되듯 나타나는 짧은 선 애니메이션
- 배경 연동: 카드의 `accent` 색상과 대응 노드를 활성화
- 외부 링크임을 아이콘과 접근성 레이블로 알림

### 8.3 썸네일

- 원본 비율: 3:2 권장
- 최소 크기: 1200 × 800
- 형식: AVIF 우선, WebP fallback
- 실제 앱 대표 화면을 사용
- 동일한 외곽 프레임과 내부 여백 적용
- 이미지 위에 긴 제목이나 설명을 직접 합성하지 않음
- 모바일용 crop 위치를 데이터로 지정할 수 있게 함

## 9. 비주얼 시스템

### 9.1 기본 색상 초안

```css
:root {
  --color-canvas: #090b0d;
  --color-surface: #111519;
  --color-surface-raised: #171c21;
  --color-ink: #f0eee7;
  --color-ink-muted: #969da3;
  --color-line: rgba(240, 238, 231, 0.14);
  --color-focus: #71dbe8;
}
```

앱별 강조색 초안:

| 앱 | Primary | Secondary |
|---|---|---|
| Direct Play | `#66C7F2` | `#FF8066` |
| Pinhole Lab | `#70E1EC` | `#F0B65D` |
| 가나 공방 | `#C94132` | `#E9B33F` |
| Guitar Auto-Strum | `#D6AA43` | `#704D38` |

실제 구현 시 WCAG 대비를 측정한 뒤 텍스트용 색상과 장식용 색상을 분리한다.

### 9.2 타이포그래피

- Display: 기하학적이되 흔한 SaaS 인상을 피하는 영문 서체
- Korean heading/body: 화면용 가독성이 좋은 명조와 고딕의 의도적 조합
- 기술적인 숫자와 상태: monospace 계열
- `Inter`, `Roboto`, 기본 시스템 폰트만으로 전체 인상을 만들지 않음

최종 폰트는 라이선스와 한글 로딩 용량을 확인한 뒤 구현 단계에서 결정한다. 한글 폰트는 필요한 weight만 self-host하거나 CDN 캐시 전략을 적용한다.

### 9.3 레이아웃

- 최대 콘텐츠 폭: `1440px`
- 데스크톱: 12-column grid
- 태블릿: 8-column grid
- 모바일: 4-column grid
- Hero 최소 높이: 데스크톱 `85svh`, 모바일 콘텐츠 기준 자동 높이
- 카드 간격은 화면 폭에 따라 `clamp()` 사용

## 10. Dynamic Background 설계

### 10.1 레이어 구성

```text
Layer 4  UI / text / cards
Layer 3  App accent glow
Layer 2  Canvas nodes and connecting lines
Layer 1  CSS grid, large geometric outlines
Layer 0  Charcoal canvas + subtle grain
```

### 10.2 Canvas 동작

- 뷰포트 크기에 따라 18~32개의 노드 생성
- 가까운 노드끼리만 낮은 alpha의 선으로 연결
- 노드는 매우 느린 속도로 이동하고 화면 경계에서 반사 또는 순환
- 포인터 주변 노드는 80~140px 반경 내에서 미세하게 반응
- 카드 포커스 시 등록된 `accent` 색상의 노드가 1~3개 강조
- 스크롤 위치에 따라 기하학 구성의 밀도와 강조 위치 변경
- 탭 비활성화 시 `requestAnimationFrame` 루프 중지

배경은 사용자 입력을 가로채지 않도록 `pointer-events: none`을 적용하고 인터랙션 좌표는 상위 페이지 이벤트에서 읽는다.

### 10.3 모션 원칙

- 큰 전환은 페이지 진입과 Featured 영역 진입에 집중
- 지속 애니메이션은 느리고 낮은 대비로 유지
- 카드 조작 피드백은 120~240ms
- 레이아웃 전환은 300~500ms
- 장식 모션은 콘텐츠 이해를 방해하지 않아야 함

### 10.4 Reduced Motion

`prefers-reduced-motion: reduce`에서는 다음을 적용한다.

- Canvas 노드를 정지 상태로 렌더링
- parallax 제거
- 카드 진입 이동 제거, 짧은 opacity 전환만 허용
- 자동 회전과 반복 pulse 제거

## 11. 콘텐츠 데이터 모델

Cloudflare 배포 상태와 포트폴리오 공개 상태를 분리한다. 포트폴리오 레지스트리가 공개 여부의 최종 기준이다.

```ts
type AppCategory = "play" | "learn" | "create" | "explore" | "archive";
type AppStatus =
  | "public"
  | "preview"
  | "private-beta"
  | "coming-soon"
  | "archived";

interface PortfolioApp {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  url?: string;
  category: AppCategory;
  status: AppStatus;
  summary: string;
  description?: string;
  thumbnail: {
    src: string;
    alt: string;
    mobilePosition?: string;
  };
  accent: {
    primary: string;
    secondary?: string;
  };
  tags: string[];
  featured: boolean;
  featuredOrder?: number;
  platform?: "workers" | "pages" | "external";
  cloudflareProject?: string;
  detailEnabled?: boolean;
  releasedAt?: string;
  updatedAt?: string;
}
```

### 11.1 공개 규칙

```text
Cloudflare에 배포
        ↓
관리자가 PortfolioApp 데이터 등록
        ↓
status와 featured 값을 검토
        ↓
빌드 및 배포
        ↓
포트폴리오에 노출
```

Cloudflare Pages 또는 Workers 프로젝트 목록을 런타임에 그대로 표시하지 않는다. 내부 도구, 검증 중인 배포, 별도 고객용 서비스가 의도치 않게 노출될 수 있기 때문이다.

## 12. 권장 기술 구조

### 12.1 프런트엔드

- Astro + TypeScript
- 정적 생성 우선
- 프레임워크 컴포넌트는 Canvas 또는 복잡한 필터 인터랙션에만 제한적으로 사용
- 콘텐츠는 TypeScript 레지스트리 또는 Astro Content Collections로 관리
- 스타일은 CSS custom properties와 component-scoped CSS 중심

### 12.2 디렉터리 구조

```text
still-coding/
├─ public/
│  ├─ images/apps/
│  ├─ fonts/
│  └─ favicon.svg
├─ src/
│  ├─ components/
│  │  ├─ AppCard.astro
│  │  ├─ AppGrid.astro
│  │  ├─ AppFilters.astro
│  │  ├─ GeometryBackground.ts
│  │  ├─ Hero.astro
│  │  └─ SiteHeader.astro
│  ├─ data/apps.ts
│  ├─ layouts/BaseLayout.astro
│  ├─ pages/index.astro
│  └─ styles/
│     ├─ global.css
│     ├─ tokens.css
│     └─ motion.css
├─ docs/SITE_DESIGN.md
├─ astro.config.mjs
├─ package.json
└─ wrangler.jsonc
```

### 12.3 Cloudflare 배포

- 대상: Cloudflare Workers Static Assets
- 프로덕션 custom domain: `still-coding.cc`
- Preview는 Workers preview URL 또는 별도 staging route 사용
- 정적 자산에 긴 cache lifetime과 immutable fingerprint 적용
- HTML은 새 배포 반영을 위해 상대적으로 짧은 cache 정책 적용
- 초기 버전에는 D1, KV, R2가 필요하지 않음

배포 구성의 정확한 필드는 구현 당시 설치된 최신 Wrangler 스키마로 검증한다.

## 13. 접근성 요구사항

- WCAG 2.2 AA 수준을 목표로 한다.
- 모든 기능은 키보드만으로 사용할 수 있어야 한다.
- 앱 카드 전체 링크에는 목적지가 드러나는 접근성 이름을 제공한다.
- 상태를 색상만으로 표현하지 않고 텍스트와 형태를 병행한다.
- 외부 링크는 시각적 표시와 스크린리더 설명을 제공한다.
- Canvas는 `aria-hidden="true"`로 처리하고 핵심 정보를 담지 않는다.
- focus ring은 배경과 3:1 이상의 대비를 확보한다.
- 필터 변경 후 결과 수를 적절한 live region으로 알린다.
- 모바일 터치 대상은 최소 44 × 44 CSS px을 확보한다.

## 14. 성능 요구사항

목표 환경은 일반 모바일 기기와 보통 속도의 네트워크다.

| 항목 | 목표 |
|---|---|
| LCP | 2.5초 이하 |
| CLS | 0.1 이하 |
| INP | 200ms 이하 |
| 초기 JS | gzip 기준 100KB 내외 목표 |
| Hero 이미지 | 250KB 이하 목표 |

구현 원칙:

- Canvas device pixel ratio 상한 설정
- 모바일 노드 수를 데스크톱의 절반 이하로 제한
- IntersectionObserver를 이용해 화면 밖 애니메이션 중지
- 썸네일에 width/height 명시
- 첫 Featured 이미지만 우선 로딩하고 나머지는 lazy loading
- 애니메이션 때문에 React 전체를 hydration하지 않음

## 15. 반응형 동작

### Desktop

- 비대칭 12-column 구성
- Hero 우측에 큰 기하학 오브젝트
- 카드 hover와 포인터 반응 활성화

### Tablet

- Featured 카드 크기 차이를 줄인 2열 구성
- Canvas 노드 수 감소
- 보조 텍스트 일부 축약

### Mobile

- 1열 카드 구성
- Hero 기하학을 텍스트 뒤가 아닌 별도 상단/하단 영역에 배치
- hover 전용 정보는 항상 표시
- 포인터 추적 제거, 스크롤 기반 반응만 유지
- 필터는 가로 스크롤 가능한 chip 목록 사용

## 16. SEO 및 공유

- 고유한 title과 meta description 설정
- canonical URL은 `https://still-coding.cc/`
- Open Graph 이미지 제작
- `WebSite` 및 `ItemList` 구조화 데이터 검토
- 각 앱 링크는 실제 canonical URL 사용
- robots.txt와 sitemap.xml 생성
- Private beta 앱 URL은 포트폴리오의 구조화 데이터에서 실행 가능한 공개 앱으로 표시하지 않음

## 17. 운영 워크플로

새 앱 등록 절차:

1. 앱의 공개 가능 여부와 정책 페이지를 확인한다.
2. 대표 화면을 3:2 비율로 캡처하고 최적화한다.
3. `src/data/apps.ts`에 앱을 등록한다.
4. 카테고리와 상태를 지정한다.
5. 모바일·데스크톱 카드와 링크를 검증한다.
6. Preview 배포에서 접근성과 성능을 확인한다.
7. 프로덕션에 배포한다.

Private beta를 Public으로 전환할 때:

1. 앱 자체 검증을 완료한다.
2. Cloudflare Access 정책을 변경 또는 해제한다.
3. 비로그인 환경에서 앱 접근을 확인한다.
4. 포트폴리오 `status`를 `public`으로 변경한다.
5. CTA와 구조화 데이터를 확인한 후 배포한다.

## 18. 분석과 개인정보

- 초기에는 Cloudflare Web Analytics처럼 최소한의 개인정보 수집 방식 우선
- 필요한 이벤트만 측정: 앱 카드 노출, 필터 사용, 외부 앱 열기
- 사용자 식별자나 앱 내부 데이터를 포트폴리오로 가져오지 않음
- 분석 스크립트 도입 전 개인정보처리방침 필요 여부 확인

## 19. 구현 단계

### Phase 1 — Foundation

- Astro 프로젝트 구성
- 디자인 토큰과 기본 레이아웃
- 앱 레지스트리와 네 앱 등록
- Header, Hero, AppCard, AppGrid 구현
- Workers Static Assets Preview 배포

### Phase 2 — Visual System

- Dynamic Geometry Canvas 구현
- 앱별 accent 연동
- 진입 및 카드 인터랙션 모션
- 실제 썸네일 제작 및 최적화

### Phase 3 — Quality

- 키보드 및 스크린리더 검증
- reduced-motion 검증
- 모바일 성능 및 Core Web Vitals 점검
- SEO, OG, sitemap 구성

### Phase 4 — Launch

- `still-coding.cc` custom domain 연결
- 비로그인 브라우저에서 전체 링크 검증
- Analytics 및 오류 관찰
- 운영 문서와 앱 등록 절차 확정

## 20. 완료 기준

- [ ] 네 앱이 정확한 카테고리와 상태로 표시된다.
- [ ] Guitar Auto-Strum은 Private beta로 표시되고 일반 사용자를 Access 로그인으로 강제 이동시키지 않는다.
- [ ] 모든 Public 앱은 한 번의 조작으로 열린다.
- [ ] 필터가 마우스, 터치, 키보드에서 동작한다.
- [ ] 기하학 배경이 앱 카드와 시각적으로 연동된다.
- [ ] reduced-motion 환경에서 지속 애니메이션이 중지된다.
- [ ] 모바일 360px 폭에서 가로 스크롤이 발생하지 않는다.
- [ ] 주요 텍스트와 컨트롤이 WCAG AA 대비를 충족한다.
- [ ] 목표 Core Web Vitals를 Preview 환경에서 검증한다.
- [ ] Cloudflare 배포 프로젝트가 포트폴리오에 자동 공개되지 않는다.
- [ ] 새 앱은 데이터 한 항목과 썸네일 추가만으로 등록할 수 있다.

## 21. 구현 전 확정할 항목

1. 사이트 기본 언어를 한국어 단독으로 할지, 한·영 전환을 제공할지
2. GitHub 프로필과 공개 이메일 주소
3. Archived 앱을 첫 출시부터 표시할지 여부
4. Guitar Auto-Strum의 테스트 사용자용 접속 링크 노출 여부
5. 최종 로고 표기: `STILL / CODING`, `STILL CODING`, `Still Coding`

기본 권장안은 **한국어 중심, 영문 장식 문구 병행**, Archived는 초기 화면에서 제외, Private beta 접속 링크는 허용 사용자가 이미 알고 있는 경우에만 노출하는 것이다.

## 22. 준비된 이미지 자산

브랜드 키 비주얼은 `public/images/brand/`에 저장한다.

| 파일 | 용도 |
|---|---|
| `living-geometry-hero-desktop.webp` | Desktop Hero 및 reduced-motion fallback |
| `living-geometry-hero-mobile.webp` | Mobile Hero 및 reduced-motion fallback |
| `living-geometry-og-background.webp` | 1200 × 630 Open Graph 배경 |

동일 이름의 PNG 파일은 원본 master이며 실제 페이지에는 용량이 작은 WebP를 사용한다. 앱 카드 이미지는 생성형 이미지가 아니라 실제 배포 앱 화면을 캡처해 `public/images/apps/`에 추가한다.
