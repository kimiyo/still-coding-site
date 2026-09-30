---
title: "스파이 게임의 비밀은 어디에 있나 — 방장 브라우저가 심판이 되는 구조"
description: "12명이 각자의 휴대폰으로 하는 스파이 게임에서 역할과 제시어를 숨기기 위해, 방장 브라우저를 권위자로 삼고 서버는 메시지 길만 정하게 한 Direct Play의 설계를 코드로 정리합니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Game Design", "WebSocket", "Cloudflare Durable Objects", "Architecture"]
draft: true
---

<!-- TODO(사용자): 초안입니다. TODO 주석을 채우고 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

스파이 게임은 4명에서 12명이 함께합니다. 한 명은 몰래 스파이가 되고, 나머지는 같은 제시어를 받습니다. 스파이는 제시어를 모른 채 대화에 섞여야 하고, 시민은 대화 속 어색함으로 스파이를 찾아야 합니다.

이 게임은 **비밀**이 전부입니다. 누가 스파이인지, 제시어가 무엇인지가 한 명이라도 새면 판이 깨집니다. 그런데 Direct Play는 서버에 게임 규칙을 두지 않는 앱입니다. 그렇다면 비밀은 어디에 두어야 할까요? 이 글은 그 질문에 대한 답과, 그 답의 한계를 정리합니다.

<!-- TODO(사용자): 스파이 게임을 만든 이유. 이 게임을 넣기로 한 계기(모임에서 하려고? 인원 많은 게임이 필요해서?)를 한두 문장. -->

## 1. 세 가지 후보 중에서 고르기

비밀을 지키는 방법은 크게 세 가지가 있습니다.

| 후보 | 비밀이 있는 곳 | 문제 |
| --- | --- | --- |
| 모두가 모든 정보를 갖는다 | 전원의 브라우저 | 개발자 도구를 열면 스파이가 보인다 |
| 서버가 심판이 된다 | 서버 | 게임마다 서버 규칙과 상태를 만들어야 한다 |
| **방장 브라우저가 심판이 된다** | 방장의 브라우저 | 방장은 볼 수 있다 |

Direct Play는 세 번째를 골랐습니다. 이미 "서버는 얇게, 게임은 브라우저에서"라는 원칙으로 만든 앱이라 서버에 게임 규칙을 넣지 않았고, 소규모 모임에서 개발자 도구까지 열어 보는 참가자는 드물다고 판단했습니다.

<!-- TODO(사용자): 이 판단이 실제 생각과 맞는지 확인하세요. 특히 "방장은 볼 수 있다"는 한계를 어떻게 받아들였는지. (방장도 플레이어인데 스파이가 누군지 알 수 있다면 공정한가? 방장이 스파이 후보에서 제외되는 것도 아니다.) -->

## 2. 누가 무엇을 볼 수 있는가

방장의 브라우저가 모든 것을 가지고 있고, 다른 참가자에게는 **각자 봐도 되는 만큼만** 보냅니다. 코드에서 이 구분은 함수 두 개로 나뉩니다.

```js
// frontend/games/spy-game/logic.js — 특정 참가자 한 명만 볼 수 있는 카드
export function privateCard(round, sessionId) {
  if (!round || !round.order.includes(sessionId)) return null;
  const spy = round.spySessionId === sessionId;
  return {
    roundId: round.roundId,
    role: spy ? "spy" : "citizen",
    categoryId: round.categoryId,
    keyword: spy ? null : round.keyword,   // 스파이에게는 제시어가 없다
  };
}
```

```js
// 전원에게 보내는 공개 상태 — 스파이도 제시어도 없다
export function publicRound(round) {
  const snapshot = {
    roundId: round.roundId,
    phase: round.phase,
    phaseEndsAt: round.phaseEndsAt,
    order: [...round.order],
    voteCount: Object.keys(round.votes || {}).length,
    // 카테고리도 결과나 스파이의 마지막 추리 단계에서만 공개
    categoryId: round.phase === PHASES.RESULT || round.phase === PHASES.SPY_GUESS ? round.categoryId : null,
    // ...
  };
  if (round.phase === PHASES.RESULT) {
    snapshot.spySessionId = round.spySessionId;   // 결과 단계에서야 공개
    snapshot.keyword = round.keyword;
  }
  return snapshot;
}
```

`publicRound`에는 `spySessionId`와 `keyword`가 **결과 단계 전에는 필드 자체가 없습니다.** 값을 가리는 것이 아니라 아예 담지 않습니다. 누가 몇 명 투표했는지(`voteCount`)는 공개하지만 누가 누구에게 투표했는지는 담지 않습니다.

## 3. 서버는 "누구에게 보낼지"만 정한다

방장이 참가자 한 명에게 비밀 카드를 보내려면 메시지가 서버를 지나야 합니다. 서버(Durable Object)는 이 메시지를 **읽지 않고 길만 정합니다.**

```js
// worker/room.js (요약)
if (msg.type === "moderated-action" || msg.type === "moderated-sync") {
  if (!ownerSessionId || att.sessionId === ownerSessionId) return;
  this.broadcast(msg.type, { from: att.sessionId, event, payload }, { to: ownerSessionId });
  return;                                   // 참가자의 행동은 방장에게만 간다
}
if (!att.isOwner) return;                   // 여기부터는 방장만 보낼 수 있다
if (msg.type === "moderated-private") {
  const target = String(msg.to || "");
  if (!target || !this.isConnectedSession(target)) return;
  this.broadcast("moderated-private", { to: target, event, payload }, { to: target });
  return;
}
this.broadcast("moderated-public", { event, payload });   // 전원에게
```

정리하면 이렇습니다.

- 참가자의 행동(역할 확인, 투표, 마지막 추리)은 **방장에게만** 전달됩니다.
- 비밀 카드처럼 특정 한 명에게 가는 메시지는 **그 사람의 연결로만** 전송됩니다. 다른 참가자의 웹소켓에는 아예 나가지 않습니다.
- 공개 상태와 비밀 카드는 **방장만** 보낼 수 있습니다. 서버는 메시지 안의 주장이 아니라, 웹소켓 연결을 맺을 때 서버가 붙여 둔 `isOwner` 값으로 방장인지를 판단합니다.
- 서버는 이 모드를 스파이 게임 방에서만 허용하고, 메시지 하나를 16KB, 페이로드를 8KB로 제한합니다. 이벤트 이름도 정해진 형식(`^[a-z][a-z0-9-]{0,31}$`)이어야 합니다.

<!-- TODO(사용자): 이 메시지 길을 서버에서 직접 걸러 준 이유. (클라이언트에서만 걸러도 되는데 서버가 한 번 더 확인하게 한 이유가 있는지.) -->

## 4. 게임의 진행 상태

게임은 단계(phase)로 진행됩니다.

```text
role-reveal(역할 확인 45초) → discussion(질문·대화) → voting(투표 30초)
   → [동률이면 runoff-voting 결선] → spy-guess(스파이의 마지막 추리) → result
```

승패 규칙은 `logic.js`의 순수 함수에 들어 있습니다.

- 최다 득표자가 **한 명**이고 그가 스파이이면, 스파이에게 **제시어를 맞힐 기회**가 한 번 남습니다. 맞히면 스파이가 이깁니다.
- 최다 득표자가 스파이가 아니면(오답 지목) 스파이가 이깁니다.
- 동률이면 후보끼리 **한 번만** 결선 투표를 하고, 그래도 동률이면 스파이가 이깁니다.
- 스파이가 시간 안에 추리하지 못하면 시민이 이깁니다.

```js
export function resolveVote(round) {
  const tally = tallyVotes(round);
  if (tally.leaders.length !== 1) {
    if (round.voteRound === 0 && tally.leaders.length > 1) {
      return { type: "runoff", candidates: tally.leaders, tally };
    }
    return { type: "spy-win", reason: "tie", tally };
  }
  const accused = tally.leaders[0];
  if (accused !== round.spySessionId) return { type: "spy-win", reason: "wrong-accusation", accused, tally };
  return { type: "spy-guess", accused, tally };
}
```

이 함수는 DOM을 전혀 쓰지 않아서 `logic.test.js`로 브라우저 없이 검증합니다. 비밀을 다루는 규칙일수록 화면과 떼어 두는 편이 안전했습니다.

<!-- TODO(사용자): "동률이 두 번이면 스파이 승"이라는 규칙을 정한 이유. (게임 밸런스? 단순함?) 직접 플레이해 보고 규칙을 바꾼 적이 있다면 알려 주세요. -->

## 5. 시간은 남은 초가 아니라 "끝나는 시각"으로

투표 30초, 대화 2~5분 같은 제한 시간은 모든 참가자 화면에 같이 흘러야 합니다. "남은 초"를 계속 보내면 전달 지연만큼 어긋나고 메시지도 많아집니다. 그래서 상태에 **끝나는 절대 시각**(`phaseEndsAt`)을 담아 한 번만 보냅니다.

```js
round.phaseEndsAt = Date.now() + round.config.discussionSeconds * 1000;
// 각자 화면에서: 남은 시간 = phaseEndsAt - Date.now()
```

대화 시간에는 질문하는 사람이 순서대로 바뀝니다. 이것도 방장이 별도 신호를 보내지 않고, 경과 시간을 참가자 수로 나눈 구간으로 계산해서 정합니다. 방장이 잠시 멈추면(`pausedAt`) 모두의 화면에 "일시정지"가 표시됩니다.

<!-- TODO(사용자): 각 참가자의 기기 시계가 다를 때(시계 오차) 어떻게 되는지. 실제로 문제가 있었는지 확인해 보세요. -->

## 6. 이 구조의 한계

- **방장은 정보를 다 가진다.** 방장의 브라우저에 스파이와 제시어가 있으므로, 방장도 플레이어라면 완전히 공정하지는 않습니다.
- **방장이 나가면 판이 멈춘다.** 진행 상태는 방장 브라우저의 메모리에 있습니다. 참가자가 재접속하면 방장에게 현재 상태를 다시 요청하지만(`sync-request`), 방장이 새로고침하면 진행 중이던 라운드는 사라집니다. 상태를 서버(Durable Object)로 옮기는 방법을 설계 문서에서 후속 과제로 적어 두었습니다.
- **브라우저 조작은 막지 못한다.** 방장 브라우저의 개발자 도구까지 막을 수는 없습니다. 이 게임은 친구·가족 모임처럼 서로를 믿는 자리를 전제로 합니다.

<!-- TODO(사용자): 방장 새로고침으로 라운드가 사라진 적이 있는지, 방장이 이탈했을 때의 실제 안내 화면이 어떤지 확인해서 적어 주세요. 설계 문서(docs/plans/spy-game-implementation-plan.md)에는 화면 꺼짐 방지(Wake Lock)와 새로고침 복원이 언급되어 있는데, 현재 코드에서는 찾지 못했습니다. 구현 여부를 확인해 주세요. -->

## 정리

스파이 게임의 비밀은 **방장 브라우저에 있고, 서버는 누구에게 보낼지만 정합니다.** 공개 상태에는 비밀이 담기지 않게 만들고, 개인 카드는 그 사람에게만 가는 길로 보냅니다. 서버에 게임 규칙을 두지 않는 대신 방장을 신뢰해야 한다는 것이 이 구조의 거래 조건입니다. 여러 사람이 잠깐 노는 게임에서는 그 거래가 맞았다고 생각합니다.

<!-- TODO(사용자): 마지막 문장을 본인의 평가로 바꿔 주세요. 다시 만든다면 어떻게 하겠는지. -->
