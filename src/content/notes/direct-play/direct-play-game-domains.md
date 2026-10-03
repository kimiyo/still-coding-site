---
title: "게임마다 주소를 주면 생기는 일 — 문 하나짜리 서브도메인과 302 리다이렉트"
description: "spy-game.still-coding.com처럼 게임마다 외우기 쉬운 주소를 주되, 실제 플레이는 한곳에서 하도록 만든 Direct Play의 게임 도메인 구조를 정리합니다. 리다이렉트 규칙, 저장소가 흩어지는 문제, 링크 하나가 방 하나를 쓰는 비용을 다룹니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Cloudflare Workers", "Routing", "Redirect", "Design Decision"]
---

[Direct Play](https://dp.still-coding.com/)에는 게임이 열 개 있습니다. 게임을 친구에게 알려 줄 때 "`dp.still-coding.com`에 들어가서 스파이 게임을 골라"라고 하는 것보다 "`spy-game.still-coding.com`로 와"라고 하는 편이 훨씬 쉽습니다.

게임별 주소는 게임 선택 화면으로 바로 연결됩니다. 게임마다 주소를 따로 둔 것은 그 게임으로의 접근을 최대한 쉽게 하려는 것이었습니다. 게임별로 홍보할 수 있고, 복잡한 절차 없이 바로 시작할 수 있습니다. 주소를 나누면서 브라우저 저장소, 초대 링크, 방 생성 한도도 함께 확인해야 했습니다.

## 주소는 "문"이고 방은 한곳에 있다

게임 도메인은 접속을 받아 앱 주소로 보내는 역할을 합니다. `spy-game.still-coding.com`로 접속하면 Worker가 `dp.still-coding.com/?game=spy-game`으로 302 리다이렉트를 보내고, 실제 플레이는 언제나 `dp.still-coding.com`에서 합니다.

이유는 브라우저 저장소가 도메인별로 분리되기 때문입니다. 각 게임 주소에서 그대로 플레이하게 하면 이런 일이 생깁니다.

- 닉네임과 개인 기록이 도메인마다 따로 저장된다.
- 이 브라우저에서 만든 방 목록도 도메인마다 흩어진다.

개발 문서의 표현은 이렇습니다(번역). "게임 도메인은 외우기 쉬운 입구일 뿐이다. 실제 플레이·기록·닉네임·방은 모두 `dp.still-coding.com` 한곳에 남는다."

## 리다이렉트를 함수 하나로

리다이렉트 판단은 Worker의 순수 함수 하나(`worker/game-domains.js`)로 만들었고, 모든 요청에서 가장 먼저 호출됩니다.

```js
export function gameDomainRedirect(url, appOrigin, gameIds) {
  if (!appOrigin) return null;                      // 설정이 없으면 기능이 꺼진다
  const app = new URL(appOrigin);
  if (url.hostname === app.hostname) return null;   // 본진은 리다이렉트하지 않는다
  const [label, ...rest] = url.hostname.split(".");
  if (!rest.length || !gameIds.has(label)) return null;   // 게임 ID가 아니면 무시

  const target = new URL(url.pathname, app.origin);
  target.search = url.search;                        // 기존 쿼리(utm 등)는 유지
  const isShell = url.pathname === "/" || url.pathname === "/index.html"
    || url.pathname === "/en" || url.pathname === "/en/" || url.pathname === "/en/index.html";
  if (isShell && !target.searchParams.has("room")) target.searchParams.set("game", label);
  return target.toString();
}
```

규칙은 몇 줄 안 되지만, 각 줄에 고려한 상황이 있습니다.

- 호스트의 첫 라벨이 게임 ID일 때만 동작합니다. `sumdrop`처럼 ID와 다르면 리다이렉트하지 않습니다.
- `?room=…`이 있으면 `game`을 붙이지 않고 그 방으로 보냅니다. 방 링크가 게임 링크로 바뀌면 초대받은 사람이 엉뚱한 곳에 도착하기 때문입니다.
- 영어 화면(`/en/`)은 영어 셸을 유지한 채 이동합니다.
- 그 밖의 경로(`/games/sum-drop/` 등)는 같은 경로로 본진에 보냅니다.
- `localhost`나 게임 ID로 시작하지 않는 호스트에는 리다이렉트를 적용하지 않습니다. 함수는 첫 라벨을 검사하므로, 게임 ID로 시작하는 `*.workers.dev` 주소까지 예외라고 단정할 수는 없습니다.

이 함수는 카탈로그의 게임 ID 목록을 받아서 판단하므로, 새 게임을 카탈로그에 넣고 도메인만 연결하면 코드를 고치지 않고 주소가 생깁니다. 테스트(`tests/game-domains.test.mjs`)는 위 경계 조건들을 하나씩 확인합니다.

### 임시 이동 응답을 쓰는 이유

영구 이동(301)은 브라우저가 오래 기억합니다. 나중에 게임 주소의 동작을 바꾸고 싶을 때 이미 기억한 사용자에게는 바뀌지 않을 수 있습니다. 그래서 임시 이동(302)을 골랐습니다. 문서에도 "나중에 정책을 바꾸기 쉽다"는 이유가 적혀 있습니다.

## 링크를 여는 순간 방이 만들어진다

대부분의 게임은 링크로 들어오는 순간 서버에 방을 하나 만듭니다. 그리고 서버 방 생성은 [하루 500개 한도](/notes/direct-play-room-lifecycle/)를 하나씩 씁니다.

링크를 열어 구경만 하고 나가는 방문자도 방을 하나씩 소모합니다. 문서에도 이 점이 주의 사항으로 적혀 있습니다. 방 생성이 실패하면 메인 화면의 해당 게임 카드로 돌아가게 했습니다.

이 비용을 피한 게임이 하나 있습니다. SUM DROP은 혼자 하는 모드가 기본이라, 링크로 들어가면 서버를 부르지 않는 로컬 방이 열립니다. "친구와 같이 하기"를 눌러 공유할 때 비로소 서버 방으로 바뀝니다.

| 진입 | 서버 호출 | 하루 한도 소모 |
| --- | --- | --- |
| SUM DROP 링크 | 없음(로컬 방) | 없음 |
| 그 밖의 게임 링크 | 방 생성 | 1개 |
| 친구와 같이 하기(SUM DROP) | 이때 서버 방 생성 | 1개 |

방이 링크와 함께 생기다 보니, 구경만 하고 버려진 방과 아무도 남지 않은 고아 방이 쌓입니다. 쓰이지 않는 방은 주기적으로 거두어야 합니다.

만들어지는 방 자체를 줄이려면 SUM DROP처럼 서버를 부르지 않는 로컬 방을 다른 게임에도 검토할 필요가 있습니다. 같이 할 사람이 생겨 공유할 때 서버 방으로 바꾸면, 열리기만 하고 쓰이지 않는 방이 한도에 쌓이지 않습니다.

로컬 방은 서버에 만들지 않고, 연 브라우저의 저장소에만 두는 방입니다. SUM DROP은 혼자 플레이할 수 있다고 표시되어 있어서, 게임 카드를 누르면 서버에 방을 만들지 않고 이 방이 열립니다. 방 번호는 `local-`으로 시작합니다. 이 접두사가 있으면 입장할 때 서버를 부르지 않습니다. 설정 화면은 서버 방과 같게 보이지만 공유 링크는 없고, 점수와 판 정보도 그 브라우저에만 남습니다.

친구와 같이 하기를 눌러 초대할 때만 서버 방으로 바뀝니다. 그때 하루 생성 한도를 하나 쓰고, 다른 사람에게 보낼 링크가 생깁니다. 그래서 혼자 플레이하는 동안에는 서버에 고아 방이 쌓이지 않습니다.

## 도메인 목록도 코드로 관리한다

Cloudflare의 커스텀 도메인은 대시보드에서 누르는 대신 `wrangler.jsonc`의 `routes`에 적습니다.

```jsonc
"routes": [
  { "pattern": "dp.still-coding.com", "custom_domain": true },
  { "pattern": "sum-drop.still-coding.com", "custom_domain": true },
  // ...
]
```

개발 문서에는 기존 도메인도 함께 적으라는 주의 사항이 있습니다. 배포할 때 wrangler는 목록에 없는 커스텀 도메인을 이 Worker에서 떼어낼 수 있습니다. 그래서 원래 대시보드에서 붙였던 본진(`dp.still-coding.com`)도 반드시 목록에 넣어야 합니다. 도메인을 코드로 옮기는 순간, 기존 것을 빠뜨리는 실수가 서비스 중단이 될 수 있습니다.

새 게임을 추가할 때 도메인은 카탈로그에 ID가 있는지 확인하고, 목록에 한 줄을 넣고, 배포하면 wrangler가 DNS와 인증서까지 만듭니다.
