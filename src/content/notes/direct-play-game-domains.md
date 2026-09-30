---
title: "게임마다 주소를 주면 생기는 일 — 문 하나짜리 서브도메인과 302 리다이렉트"
description: "spy-game.still-coding.cc처럼 게임마다 외우기 쉬운 주소를 주되, 실제 플레이는 한곳에서 하도록 만든 Direct Play의 게임 도메인 구조를 정리합니다. 리다이렉트 규칙, 저장소가 흩어지는 문제, 링크 하나가 방 하나를 쓰는 비용을 다룹니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Cloudflare Workers", "Routing", "Redirect", "Design Decision"]
draft: true
---

<!-- TODO(사용자): 초안입니다. TODO 주석을 채우고 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

[Direct Play](https://dp.still-coding.cc/)에는 게임이 아홉 개 있습니다. 게임을 친구에게 알려 줄 때 "`dp.still-coding.cc`에 들어가서 스파이 게임을 골라"라고 하는 것보다 **"`spy-game.still-coding.cc`로 와"**라고 하는 편이 훨씬 쉽습니다.

그래서 게임마다 주소를 하나씩 만들었습니다. 그런데 주소를 하나 더 만드는 일은 생각보다 많은 결정을 요구했습니다. 이 글은 그 결정들을 정리합니다.

<!-- TODO(사용자): 게임별 주소를 만든 계기. (공유하기 쉽게? 검색·홍보 목적? 특정 게임을 널리 알리려고?) -->

## 1. 주소는 "문"이고 방은 한곳에 있다

가장 먼저 정한 것은 **게임 도메인이 게임을 직접 제공하지 않는다**는 것입니다. `spy-game.still-coding.cc`로 접속하면 Worker가 `dp.still-coding.cc/?game=spy-game`으로 302 리다이렉트를 보내고, 실제 플레이는 언제나 `dp.still-coding.cc`에서 합니다.

이유는 **브라우저 저장소가 도메인별로 분리되기 때문**입니다. 각 게임 주소에서 그대로 플레이하게 하면 이런 일이 생깁니다.

- 닉네임과 개인 기록이 도메인마다 따로 저장된다.
- 이 브라우저에서 만든 방 목록도 도메인마다 흩어진다.

개발 문서의 표현은 이렇습니다(번역). "게임 도메인은 외우기 쉬운 **입구일 뿐**이다. 실제 플레이·기록·닉네임·방은 모두 `dp.still-coding.cc` 한곳에 남는다."

## 2. 리다이렉트를 함수 하나로

리다이렉트 판단은 Worker의 순수 함수 하나(`worker/game-domains.js`)로 만들었고, 모든 요청에서 **가장 먼저** 호출됩니다.

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

- **호스트의 첫 라벨이 게임 ID일 때만** 동작합니다. `sumdrop`처럼 ID와 다르면 리다이렉트하지 않습니다.
- **`?room=…`이 있으면 `game`을 붙이지 않고** 그 방으로 보냅니다. 방 링크가 게임 링크로 바뀌면 초대받은 사람이 엉뚱한 곳에 도착하기 때문입니다.
- **영어 화면**(`/en/`)은 영어 셸을 유지한 채 이동합니다.
- **그 밖의 경로**(`/games/sum-drop/` 등)는 같은 경로로 본진에 보냅니다.
- **`*.workers.dev`, `localhost`, 관계없는 서브도메인**은 건드리지 않습니다.

이 함수는 카탈로그의 게임 ID 목록을 받아서 판단하므로, 새 게임을 카탈로그에 넣고 도메인만 연결하면 코드를 고치지 않고 주소가 생깁니다. 테스트(`tests/game-domains.test.mjs`)는 위 경계 조건들을 하나씩 확인합니다.

### 왜 301이 아니라 302인가

영구 이동(301)은 브라우저가 오래 기억합니다. 나중에 게임 주소의 동작을 바꾸고 싶을 때 이미 기억한 사용자에게는 바뀌지 않을 수 있습니다. 그래서 임시 이동(302)을 골랐습니다. 문서에도 "나중에 정책을 바꾸기 쉽다"는 이유가 적혀 있습니다.

## 3. 링크를 여는 순간 방이 만들어진다

주소를 편하게 만들자 예상하지 못한 비용이 따라왔습니다. 대부분의 게임은 링크로 들어오는 순간 **서버에 방을 하나 만듭니다.** 그리고 서버 방 생성은 [하루 500개 한도](/notes/direct-play-room-lifecycle/)를 하나씩 씁니다.

즉 링크를 널리 퍼뜨리면 **구경만 하고 나가는 방문자도 방을 하나씩 소모**합니다. 문서에도 이 점이 주의 사항으로 적혀 있습니다. 방 생성이 실패하면 메인 화면의 해당 게임 카드로 돌아가게 했습니다.

이 비용을 피한 게임이 하나 있습니다. **SUM DROP**은 혼자 하는 모드가 기본이라, 링크로 들어가면 서버를 부르지 않는 **로컬 방**이 열립니다. "친구와 같이 하기"를 눌러 공유할 때 비로소 서버 방으로 바뀝니다.

| 진입 | 서버 호출 | 하루 한도 소모 |
| --- | --- | --- |
| SUM DROP 링크 | 없음(로컬 방) | 없음 |
| 그 밖의 게임 링크 | 방 생성 | 1개 |
| 친구와 같이 하기(SUM DROP) | 이때 서버 방 생성 | 1개 |

<!-- TODO(사용자): 링크를 여는 순간 방을 만드는 방식이 처음부터 의도였는지, 아니면 나중에 알게 된 부작용인지. 다른 게임도 SUM DROP처럼 로컬 방 방식으로 바꿀 계획이 있는지. -->

## 4. 도메인 목록도 코드로 관리한다

Cloudflare의 커스텀 도메인은 대시보드에서 누르는 대신 `wrangler.jsonc`의 `routes`에 적습니다.

```jsonc
"routes": [
  { "pattern": "dp.still-coding.cc", "custom_domain": true },
  { "pattern": "sum-drop.still-coding.cc", "custom_domain": true },
  // ...
]
```

여기에는 함정이 하나 있었습니다. **목록이 곧 전체 상태**라는 점입니다. 배포할 때 wrangler는 목록에 없는 커스텀 도메인을 이 Worker에서 떼어낼 수 있습니다. 그래서 원래 대시보드에서 붙였던 본진(`dp.still-coding.cc`)도 반드시 목록에 넣어야 합니다. 도메인을 코드로 옮기는 순간, 기존 것을 빠뜨리는 실수가 서비스 중단이 될 수 있습니다.

새 게임을 추가할 때 도메인은 카탈로그에 ID가 있는지 확인하고, 목록에 한 줄을 넣고, 배포하면 wrangler가 DNS와 인증서까지 만듭니다.

<!-- TODO(사용자): 실제로 도메인이 떨어져 나가는 사고를 겪었는지, 아니면 문서로 미리 경고해 둔 것인지. -->

## 정리

주소 하나를 더 주는 일은 **입구를 하나 더 만드는 일**이었습니다. 입구는 여러 개여도 방은 한곳에 두었고(저장소가 흩어지지 않게), 리다이렉트 판단은 순수 함수 하나로 만들어 테스트했고(경계 조건이 많아서), 임시 이동으로 두었습니다(나중에 바꿀 수 있게). 그리고 입구가 늘면서 생긴 비용, 즉 링크 하나가 방 하나를 쓴다는 사실은 문서에 주의 사항으로 남겼습니다.

<!-- TODO(사용자): 게임별 주소를 만든 뒤 실제로 유입이나 공유가 늘었는지. 늘었다면 수치나 체감을 한 문장. -->
