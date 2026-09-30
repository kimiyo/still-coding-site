---
title: "게임을 아홉 개로 늘려도 로비가 가벼운 이유 — Direct Play의 게임 모듈 구조"
description: "Direct Play가 게임 9개를 하나의 로비에서 다루기 위해 만든 카탈로그와 지연 로딩 레지스트리, 게임 모듈 계약, 순수 로직 분리를 설명합니다. 독립 앱 두 개를 같은 계약에 맞춰 옮긴 코드도 다룹니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Architecture", "JavaScript", "ES Modules", "Plugin"]
---

[Direct Play](https://dp.still-coding.cc/)에는 지금 게임이 아홉 개 있습니다. 사진퍼즐, 슬라이딩 사진퍼즐, 숫자합 퍼즐, 숫자 야구, 미니 스도쿠, 포켓 레이스, 스파이 게임, PINHOLE, SUM DROP입니다.

각 게임들을 최대한 모듈화 하여 구현을 했습니다. 이것을 통해서 앞으로 계속 게임을 추가할 예정입니다.

로비는 게임 목록을 그리고, 선택한 게임의 화면과 규칙은 따로 불러옵니다. 방 만들기, 초대, QR, 결과 공유는 게임들이 공통으로 쓰는 셸에 모여 있습니다.

## 로비는 "메뉴판"만 안다

로비에 게임 카드를 그리려면 게임마다 이름, 설명, 인원, 예상 시간, 태그 정도만 알면 됩니다. 게임을 실제로 실행하는 코드는 필요 없습니다. 그래서 두 가지를 나눴습니다.

- 카탈로그(`catalog.js`): 카드와 초대 문구에 쓰는 메타 데이터의 목록입니다. 가볍습니다.
- 게임 모듈(`games/<id>/`): 설정 화면, 플레이 화면, 규칙입니다. 무겁습니다.

```js
// frontend/games/catalog.js (일부)
{
  id: "sum-drop",
  title: "SUM DROP",
  description: "숫자 블록을 떨어뜨려 합 10 연쇄를 만들고 점수를 겨뤄 보세요.",
  players: { min: 1, max: 8 },
  durationMinutes: 5,
  tags: ["액션", "퍼즐"],
  howTo: ["숫자 블록을 원하는 칸에 떨어뜨려요.", /* ... */],
  status: "available",
}
```

게임 모듈은 사용자가 그 게임을 골랐을 때만 불러옵니다.

## 고를 때만 불러오는 레지스트리

```js
// frontend/games/registry.js
const LOADERS = {
  "photo-puzzle": () => import("./photo-puzzle/index.js"),
  "sum-drop":     () => import("./sum-drop/index.js"),
  pinhole:        () => import("./pinhole/index.js"),
  // ... 게임마다 한 줄
};

const moduleCache = new Map();

export async function loadGameModule(gameType) {
  if (moduleCache.has(gameType)) return moduleCache.get(gameType);
  const loader = LOADERS[gameType];
  if (!loader) throw new Error(`등록되지 않은 게임입니다: ${gameType}`);
  const mod = await loader();
  const game = mod.default || mod;
  await ensureGameStyles(gameType, game.style);
  moduleCache.set(gameType, game);
  return game;
}
```

번들러 없이 브라우저의 동적 `import()`를 그대로 씁니다. 한 번 불러온 모듈은 캐시에 두어 같은 게임을 다시 열 때 레지스트리에서 재사용합니다. 방의 `gameType` 값 하나로 어떤 게임을 실행할지 결정되므로, 초대 링크로 들어온 사람도 같은 경로로 필요한 게임만 받습니다.

### 스타일도 한 번만, 그리고 기다린다

게임마다 CSS가 따로 있습니다. 이 CSS도 게임을 처음 고를 때 `<link>`로 한 번만 붙입니다. 스타일 로드 전에 화면을 그리면 잠깐 서식 없는 화면이 나올 수 있습니다. 현재 코드는 스타일이 로드되거나 실패할 때까지 기다린 뒤 모듈을 반환합니다.

```js
const STYLE_WAIT_MS = 3000;   // 느린 CDN이 게임을 막지 않도록 상한을 둔다

export function ensureGameStyles(gameType, href) {
  // ...
  const ready = new Promise((resolve) => {
    const timer = setTimeout(resolve, STYLE_WAIT_MS);
    const done = () => { clearTimeout(timer); resolve(); };
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
  });
  document.head.appendChild(link);
  // ...
}
```

3초가 지나면 기다림을 끝내고 진행합니다. 스타일 응답이 늦더라도 화면 진입이 계속 막히지는 않습니다.

## 게임과 셸 사이의 계약

게임 폴더는 `index.js`에서 정해진 모양의 객체를 내보냅니다.

```js
// frontend/games/number-baseball/index.js
export default {
  id: "number-baseball",
  style: "/games/number-baseball/style.css",
  guide: getGameGuide("number-baseball"),
  meta: { title: "숫자 야구", players: { min: 1, max: 8 }, durationMinutes: 6, /* ... */ },
  createSetup,   // 방장이 설정하는 화면
  createPlay,    // 플레이 화면
  describeAsset(assetMeta) {
    if (!assetMeta?.hasAsset) return "미등록";
    return assetMeta.summary || "비밀 숫자 준비됨";
  },
};
```

게임이 하는 일은 규칙과 화면입니다. 방 이름, 공유 QR과 링크, 참가자 관리, P2P 전달, 타이머, 결과 제출, 축하 연출, 중도 종료는 셸(공통 프레임워크)이 맡습니다. 게임 코드에는 종료 버튼 처리조차 넣지 않도록 개발자 문서에 적어 두었습니다.

개발자 가이드의 기본 게임 폴더는 보통 파일 6~8개로 구성됩니다. 별도 엔진을 빌드하는 게임에는 추가 파일이 있습니다.

```text
frontend/games/number-baseball/
  index.js     # 위의 계약
  setup.js     # 방장 설정 화면
  play.js      # 플레이 화면
  logic.js     # 순수 규칙 (DOM 없음)
  logic.test.js
  style.css
```

## 규칙은 화면에서 떼어 둔다

`logic.js`는 DOM을 전혀 쓰지 않는 순수 함수만 담습니다. 예를 들어 숫자 야구의 스트라이크·볼 판정, 미니 스도쿠의 판 생성과 검증, 포켓 레이스의 물리 상수와 트랙이 여기에 들어갑니다. DOM이 없으니 브라우저 없이 `node`로 바로 테스트할 수 있습니다.

```json
"test:number-baseball": "node frontend/games/number-baseball/logic.test.js",
"test:mini-sudoku":     "node frontend/games/mini-sudoku/logic.test.js",
"test:pocket-race":     "node frontend/games/pocket-race/logic.test.js",
"test:spy-game":        "node frontend/games/spy-game/logic.test.js"
```

<!-- TODO(사용자): 규칙을 화면에서 떼어 놓았을 때 실제로 버그를 미리 잡은 경험이 있으면 한 가지 예를 들어 주세요. -->

## 새 게임을 추가하는 순서

개발자 문서에 적어 둔 절차는 단순합니다.

1. 비슷한 기존 게임 폴더를 복사한다. (이미지 기반이면 사진퍼즐, 이미지 없는 게임이면 숫자합 퍼즐, 논리 퍼즐이면 미니 스도쿠, 실시간이면 포켓 레이스)
2. 규칙과 화면을 바꾼다.
3. `catalog.js`에 카드 메타를 넣는다.
4. `registry.js`의 `LOADERS`에 한 줄을 넣는다.
5. `package.json`의 `check`에 새 파일을 넣는다.

<!-- TODO(사용자): 가장 최근에 게임을 추가했을 때 실제로 걸린 시간이나 손댄 파일 수. 문서상의 절차가 실제와 맞는지도 확인해 주세요. -->

## 구조를 시험하다: 독립 앱 두 개를 모듈로 옮기다

PINHOLE과 SUM DROP은 별개 프로젝트에서 Direct Play의 게임 모듈로 옮겼습니다. 이 게임들이 추가된 커밋은 2026년 9월 26일입니다.

- 두 프로젝트는 자체 로비, 방 API, 웹소켓 프로토콜, P2P를 가지고 있었습니다. 그런 부분은 가져오지 않고, 게임 엔진과 플레이 화면만 가져왔습니다.
- 방, 세션, 초대, 결과 공유는 기존 셸을 그대로 씁니다. 옮긴 쪽은 위의 모듈 계약에 맞는 어댑터(`createSetup`, `createPlay`)를 새로 썼습니다.
- 서버(`worker/room.js`)에는 PINHOLE 문제 이미지를 읽어 오는 엔드포인트가 추가되었지만, 방의 데이터 모델과 수명, 토큰, 초대 방식은 그대로 두었습니다.
- 원본이 TypeScript였기 때문에 `game-src/`의 소스를 `game.bundle.js`로 따로 빌드하고, 출처를 `UPSTREAM.md`에 남겼습니다.

## 나눈 자리

카드에 쓰는 이름과 설명은 `catalog.js`에 둡니다. 로비가 게임 코드를 불러오지 않고도 목록을 그리게 하려는 것입니다. 모듈 안의 `meta`는 그 게임을 열었을 때 쓰는 정보입니다.

새 게임은 `catalog.js`, `registry.js`, `package.json`에 한 줄씩 잇습니다. 게임을 더하는 동안 로비와 공통 셸은 그대로 두기 위한 자리입니다.
