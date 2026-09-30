---
title: "글자가 획순대로 써지게 하려면 폰트로는 안 된다 — SVG로 만드는 획순 애니메이션"
description: "히라가나·가타카나를 한 획씩 써 보여 주는 애니메이션을 만들려면 획의 윤곽과 중심선이 필요합니다. 가나 공방이 AnimCJK 데이터와 SVG stroke-dashoffset으로 획순 예시를 구현한 방법과 라이선스 처리를 정리합니다."
pubDate: 2026-10-01
app: kana-atelier
tags: ["SVG", "React", "Animation", "Stroke Order"]
---

가나를 따라 쓰는 화면에는 완성된 모양 외에 획의 시작점과 순서도 필요합니다. 가나 공방은 연한 폰트 가이드 위에 획별 SVG를 재생하는 예시를 따로 얹습니다.

[가나 공방](https://study-hiragana.still-coding.cc/)의 쓰기 칸에는 **「쓰는 방법 예시」** 버튼이 있고, 누르면 그 칸 위에서 글자가 한 획씩 써지는 애니메이션이 재생됩니다. 이 글은 그 애니메이션을 어떻게 만들었는지 정리합니다.

## 폰트는 완성된 글자만 안다

따라 쓰기 가이드로 연하게 깔아 두는 「あ」는 폰트로 렌더링합니다. 이 가이드에는 획별 재생 데이터가 없으므로, 애니메이션에는 별도의 경로와 순서가 필요합니다.

| 방식 | 그려지는 것 | 획순 애니메이션 |
| --- | --- | --- |
| 폰트 가이드 | 완성된 글자 한 장 | 획의 구분도 순서도 없다 |
| 사용자의 필기 | 포인터가 지나간 궤적 | 예시가 아니다 |
| **획별 벡터 데이터** | 획마다의 윤곽과 경로 | 가능하다 |

그래서 이 앱의 쓰기 화면은 두 가지를 분리합니다. 따라 쓰기 **가이드**는 폰트로, 「쓰는 방법 예시」는 획별 SVG 데이터로 그립니다.

## 획마다 필요한 데이터는 두 가지

획을 "그어 가는" 모습을 보여 주려면 획마다 두 가지 경로가 필요합니다.

- **shape**: 그 획이 차지하는 **채워진 윤곽**.
- **median**: 펜이 지나가는 **중심선**.

```ts
type StrokePart = {
  shape: string;   // 획의 채워진 윤곽 (SVG path d)
  median: string;  // 그 획을 긋는 중심선 (SVG path d)
};

type StrokeStep = { parts: StrokePart[] };   // 같은 타이밍에 그릴 조각들

type StrokeOrderGlyph = {
  kana: string;
  viewBox: string;       // "0 0 1024 1024"
  steps: StrokeStep[];   // 배열 순서 = 획순
};
```

median만 그리면 선이 가늘어서 글자의 굵기가 나오지 않습니다. shape만 있으면 "어떻게 그어지는가"가 없습니다. 둘을 함께 써야 붓이 획의 모양대로 지나가는 것처럼 보입니다.

### 한 획인데 조각이 둘인 글자

「あ」의 세 번째 획처럼 **한 획이 자기 자신 위를 다시 지나가는** 글자는 데이터에서 `3a`, `3b`처럼 두 조각으로 나뉘어 있습니다. 이것을 그대로 4획으로 취급하면 실제 한 획을 두 번에 나눠 보여 주게 됩니다. 그래서 변환할 때 id의 숫자 부분(`3`)이 같은 조각들을 **하나의 step**으로 묶고, 같은 시각에 함께 재생합니다.

## 데이터는 어디서 왔나

획별 벡터는 직접 그린 것이 아니라 오픈소스 **AnimCJK**의 가나 데이터(`svgsJaKana`, `graphicsJaKana`)를 `kana-svg-data`라는 JSON 패키지 형태로 받아서 변환했습니다. `scripts/generate-stroke-order.mjs`가 이 JSON을 읽어 히라가나 46자를 앱용 TypeScript 파일로 만듭니다. 가타카나도 같은 방식의 스크립트(`generate-katakana-stroke-order.mjs`)가 있습니다.

```bash
curl -sL "https://cdn.jsdelivr.net/npm/kana-svg-data/dist/allHiragana.json" -o allHiragana.json
node scripts/generate-stroke-order.mjs allHiragana.json   # → src/data/strokeOrderGlyphs.ts
```

변환 규칙은 세 가지입니다.

1. 획의 윤곽(`strokes[i].value`)을 `shape`로 쓴다.
2. 중심선은 `clipPaths`의 path 문자열이 있으면 그대로 쓴다. 없으면 `medians`의 점열을 `M x,y x,y …` 형식의 path로 바꾸어 `median`으로 쓴다.
3. id의 숫자 접두사로 step을 묶는다.

생성된 파일(히라가나 46자)은 약 79KB입니다. 런타임에 외부 CDN을 부르지 않고 앱 번들에 포함합니다. 데이터 조회에 별도 네트워크 요청은 없지만, 오프라인 재생에는 앱의 JS 번들이 기기에 남아 있어야 합니다. 현재 서비스 워커는 `/assets/*`를 캐시하지 않으므로 오프라인 실행 여부는 기기에서 따로 확인해야 합니다.

### 라이선스

생성된 데이터 파일 머리는 AnimCJK와 `kana-svg-data`를 출처로 적고, 라이선스를 `LGPL-3.0-or-later`로 표시합니다. 다음은 파일에 남은 주석입니다.

```ts
/**
 * Path geometry adapted from AnimCJK (svgsJaKana / graphicsJaKana),
 * packaged via kana-svg-data. Licensed under LGPL-3.0-or-later.
 */
```

## 선이 써지는 것처럼 보이게: stroke-dashoffset

그려지는 선에는 SVG의 점선(dash) 속성을 씁니다.

1. median 경로에 `pathLength={100}`을 준다. 실제 길이와 상관없이 경로의 길이를 100으로 정규화한다.
2. `stroke-dasharray: 100; stroke-dashoffset: 100`으로 선 전체를 "보이지 않는 틈"으로 만든다.
3. `stroke-dashoffset`을 100에서 0으로 애니메이션한다.

```css
@keyframes strokeDemoDraw {
  to { stroke-dashoffset: 0; }
}

.stroke-demo-stroke {
  fill: none;
  stroke-width: 118;               /* viewBox 1024 기준 굵기 */
  stroke-linecap: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation-name: strokeDemoDraw;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
```

선이 시작점에서 끝점으로 "써지는" 것처럼 보입니다. `pathLength`를 100으로 맞춰 두었기 때문에 획마다 길이가 달라도 같은 CSS를 쓸 수 있습니다.

### 획 밖으로 삐져나오지 않게

median은 획의 중심만 따라가므로 굵은 선으로 그으면 획의 바깥으로 잉크가 새어 나옵니다. 그래서 shape를 `clipPath`로 걸어 **잉크가 그 획의 영역 안에만** 남게 합니다.

```tsx
<defs>
  <clipPath id={clipId}><path d={part.shape} /></clipPath>
</defs>
<path
  d={part.median}
  pathLength={100}
  clipPath={`url(#${clipId})`}
  className="stroke-demo-stroke"
  style={{ animationDuration: "900ms", animationDelay: `${delayMs}ms` }}
/>
```

### 레이어 세 겹

`StrokeOrderDemo.tsx`는 세 겹을 겹쳐서 그립니다.

1. **고스트**: 완성된 글자의 shape를 옅게 깔아, 학습자가 목표 모양을 본다.
2. **그어지는 획**: step마다 median에 clip을 걸어 순서대로 그린다.
3. **채우기**: 각 획이 거의 끝나는 시점(재생 시간의 85%)에 shape를 채워서, 끝난 획을 고정한다.

타이밍은 한 획에 900ms, 획 사이에 180ms입니다. 획의 순서는 `stepIndex * (900 + 180)`의 지연으로 만들었고, 별도의 JS 타이머 없이 CSS 애니메이션의 `animation-delay`가 순서를 맞춥니다. 화면 위 「획 2 / 3」 배지만 JS 타이머로 갱신합니다.

"다시 보기"는 SVG에 `key={playId}`를 바꾸어 컴포넌트를 다시 만들면 CSS 애니메이션이 처음부터 다시 돕니다.

## 쓰는 칸 위에 얹기

예시는 별도 화면이 아니라 **쓰기 칸 바로 위에 겹쳐서** 재생합니다. `InkCanvas` 위에 예시를 별도 컴포넌트로 얹는 구조입니다.

```text
.practice-ink-stage { position: relative; aspect-ratio: 1 }
  InkCanvas         → 실제 필기
  StrokeOrderDemo   → position: absolute; inset: 0  (그 위에 겹침)
```

닫으면 곧바로 같은 칸에 따라 쓸 수 있습니다. 예시가 없는 글자에서는 "아직 이 글자의 획순 예시가 없어요."라고 안내합니다. 이 컴포넌트는 히라가나 46자와 가타카나에 쓰이는 공통 쓰기 칸(`WriteCell`)에 들어 있어서, 모든 학습 화면에서 같은 버튼이 나옵니다.

## 한계와 확인한 것

- **폰트 가이드와 픽셀이 완벽히 겹치지는 않는다.** 획순 데이터의 좌표계(1024×1024)와 화면 폰트가 서로 다른 출처라서, 모양과 위치가 얼마나 어긋나는지는 실제 화면에서 확인해야 합니다.
- **기본 글자만 있다.** 히라가나 46자와 가타카나 46자, 모두 92자입니다. 탁음, 요음, 작은 글자 같은 확장 가나는 아직 넣지 않았습니다. 생성 스크립트의 문자 목록은 바꿀 수 있지만, 원본 데이터가 해당 표기를 지원하는지도 먼저 확인해야 합니다.
- **전수 확인 테스트가 있다.** `tests/strokeOrder.test.ts`가 히라가나·가타카나 각 46자의 데이터가 모두 존재하고, 획마다 윤곽과 중심선 경로가 비어 있지 않은지 검사합니다. 다만 애니메이션이 실제로 자연스러운지는 눈으로 봐야 합니다. 개발 문서에는 여러 조각으로 나뉜 글자(「あ」「ぬ」)와 한 획짜리 글자(「く」「し」「ん」)의 타이밍을 육안으로 확인하라는 체크리스트가 남아 있습니다.
