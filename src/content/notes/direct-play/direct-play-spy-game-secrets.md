---
title: "스파이 게임의 진행 규칙 — 역할 확인, 투표, 마지막 추리"
description: "4~12명이 함께하는 Direct Play 스파이 게임의 투표와 결선, 마지막 추리 규칙을 설명합니다. 로컬 코드로 확인한 제한 시간 처리와 진행 상태 복원의 한계도 기록합니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Game Design", "WebSocket", "Cloudflare Durable Objects", "Architecture"]
---

[Direct Play](https://dp.still-coding.cc/)의 스파이 게임은 4명에서 12명이 함께합니다. 한 명은 스파이가 되고 나머지는 같은 제시어를 받습니다. 스파이는 제시어를 모른 채 대화에 섞이고, 시민은 대화를 바탕으로 스파이를 지목합니다.

사람들이 많이 하는 게임 가운데 여러 명이 함께할 수 있는 것을 만들고 싶었습니다. 스파이 게임은 대화가 많이 오가서 흥미로울 것 같아 넣었습니다.

## 역할 확인부터 투표까지

```text
role-reveal(역할 확인 45초) → discussion(질문·대화) → voting(투표 30초)
   → [동률이면 runoff-voting 결선] → spy-guess(스파이의 마지막 추리) → result
```

역할을 확인한 뒤 대화하고, 투표로 스파이를 지목합니다. 최다 득표자가 스파이라면 바로 끝나지 않습니다. 스파이에게 제시어를 맞힐 기회가 한 번 남습니다. 정답을 맞히면 스파이가 이기고, 제한 시간 안에 맞히지 못하면 시민이 이깁니다.

스파이가 아닌 사람을 지목하면 스파이가 이깁니다. 최다 득표자가 여러 명이면 그 후보들끼리 한 번 더 투표합니다. 결선에서도 동률이면 스파이 승리로 끝납니다.

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

`resolveVote`는 투표 결과를 받아 결선, 스파이 승리, 마지막 추리 중 다음 단계를 반환합니다. DOM에 의존하지 않아 `logic.test.js`에서 브라우저 없이 규칙을 검증합니다.

## 화면마다 남은 시간 계산하기

대화 2~5분, 투표 30초 같은 제한 시간은 단계가 끝나는 시각을 기준으로 표시합니다.

```js
round.phaseEndsAt = Date.now() + round.config.discussionSeconds * 1000;
// 각자 화면에서: 남은 시간 = phaseEndsAt - Date.now()
```

각 화면이 같은 종료 시각에서 자기 기기의 현재 시각을 뺍니다. 매초 남은 시간을 전달할 필요는 없지만, 기기 시계가 어긋나면 화면의 남은 시간도 달라집니다.

대화 중 질문할 차례는 경과 시간과 참가자 순서로 계산합니다. 일시정지 상태에서는 화면에 "일시정지"를 표시합니다.

## 라운드를 이어갈 수 있는 조건

진행 상태는 방장 브라우저의 메모리에 있습니다. 참가자가 다시 접속하면 현재 상태를 요청합니다. 방장이 새로고침하면 그 메모리의 라운드는 사라집니다.
