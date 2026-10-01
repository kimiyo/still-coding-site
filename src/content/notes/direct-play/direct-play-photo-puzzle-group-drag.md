---
title: "사진 퍼즐: 제자리에 붙은 조각은 한 덩어리로 — Union-Find로 묶고 옮기기"
description: "Direct Play 사진퍼즐이 정답 옆에 놓인 조각을 하나의 그룹으로 묶어 함께 옮기는 방법을 설명합니다. Union-Find로 그룹을 찾고, 옮길 자리를 만들어 주는 이동 규칙, 세 단계 힌트, 멀티터치에서 보드가 잠기던 버그의 원인을 코드로 정리합니다."
pubDate: 2026-10-01
app: direct-play
game: photo-puzzle
tags: ["Puzzle", "Union-Find", "Pointer Events", "JavaScript"]
---

[사진퍼즐게임](https://photo-puzzle.still-coding.cc)은 방장이 올린 사진을 3×3부터 6×6까지 조각내 섞어 놓고, 참가자가 조각을 바꿔 원래 그림을 맞추는 게임입니다. 그림을 다 맞추면 사진이 찍힌 장소를 입력해야 클리어입니다.

조각을 하나씩 두 개 골라 서로 바꾸기만 하면 6×6(36조각)에서는 너무 오래 걸립니다. 이미 맞는 이웃끼리 붙어 있는 조각을 하나씩 다시 옮겨야 한다면 더 그렇습니다. 그래서 정답에서도 서로 이웃인 조각은 한 덩어리로 묶어 함께 잡고 옮기게 했습니다. 이 글은 그 부분을 다룹니다.

## "정답에서도 이웃인가"

```js
/** 보드에서 서로 이웃한 두 칸이 정답에서도 같은 방향으로 이웃인지 */
function areCorrectlyAdjacent(board, posA, posB, n) {
  const sa = board[posA];   // posA 칸에 놓인 조각의 원래 번호
  const sb = board[posB];
  // ...
  if (ra === rb && Math.abs(ca - cb) === 1) {
    return sra === srb && sca - scb === ca - cb;
  }
  if (ca === cb && Math.abs(ra - rb) === 1) {
    return sca === scb && sra - srb === ra - rb;
  }
  return false;
}
```

`board[pos]`에는 그 칸에 놓인 조각의 원래 번호가 들어 있습니다. 좌우로 붙은 두 칸이라면, 두 조각의 원래 위치도 같은 행이고 열 차이가 같을 때만 맞게 이웃한 것입니다. 위아래도 같은 방식입니다. 두 조각이 서로 이웃해 있어도 원래 그림에서는 멀리 있었다면 묶이지 않습니다.

## 묶음은 Union-Find로

```js
function computeGroupIds(board, n) {
  const parent = Array.from({ length: n * n }, (_, index) => index);
  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  }
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      const pos = boardIndex(row, col, n);
      if (col + 1 < n && areCorrectlyAdjacent(board, pos, boardIndex(row, col + 1, n), n)) {
        union(pos, boardIndex(row, col + 1, n));
      }
      if (row + 1 < n && areCorrectlyAdjacent(board, pos, boardIndex(row + 1, col, n), n)) {
        union(pos, boardIndex(row + 1, col, n));
      }
    }
  }
  return Array.from({ length: n * n }, (_, index) => find(index));
}
```

모든 칸의 오른쪽 이웃과 아래쪽 이웃만 확인하면 모든 이웃 쌍을 한 번씩 보게 됩니다. 맞게 이웃한 쌍이면 두 칸을 같은 집합에 넣고, 마지막에 각 칸의 대표 번호를 돌려줍니다. 같은 대표 번호를 가진 칸이 한 그룹입니다. 사진의 어느 조각이 맞는 이웃끼리 붙어 있는지는 보드가 바뀔 때마다 다시 계산하는데, 칸이 36개라 부담이 없습니다.

이 그룹 번호로 화면에서 붙어 있는 조각 사이의 경계선을 없애서(`merge-right`, `merge-top` 같은 클래스) 한 덩어리처럼 보이게 합니다.

## 그룹을 옮기면 무엇이 밀려나는가

그룹을 다른 칸으로 끌어다 놓으면 그 자리에 있던 조각들이 밀려납니다. 이때 새 자리에서 겹치는 조각들이 어디로 가는지 정해야 합니다.

```js
function moveGroupMakeSpace(board, n, grabbedPos, targetPos) {
  // 잡은 조각이 targetPos로 가도록 그룹 전체를 같은 만큼 평행이동
  // ...
  const vacated = members.filter((pos) => !targetSet.has(pos)).sort((a, b) => a - b);
  const invaded = targetPositions.filter((pos) => !sourceSet.has(pos)).sort((a, b) => a - b);
  if (vacated.length !== invaded.length) return null;

  const next = board.slice();
  const displaced = invaded.map((pos) => board[pos]);
  for (const src of members) next[mapping.get(src)] = board[src];
  for (let i = 0; i < vacated.length; i += 1) next[vacated[i]] = displaced[i];
  // ...
}
```

- 그룹의 모든 칸을 잡은 조각이 이동한 만큼 옮깁니다. 하나라도 보드 밖으로 나가면 이동은 취소됩니다(`null`).
- 그룹이 비우는 칸(`vacated`)과 그룹이 차지하는 새 칸 중 원래 그룹 밖이었던 칸(`invaded`)의 개수는 같습니다.
- 밀려난 조각들은 칸 번호 순서대로 비워진 칸에 들어갑니다.

조각 두 개를 바꾸는 것은 크기가 1인 그룹을 옮기는 특별한 경우입니다. 그래서 탭으로 두 조각을 차례로 누르는 방식과 끌어다 놓는 방식이 같은 함수를 씁니다. 끌어 놓을 자리에 올려놓기만 해도 옮길 수 있는 곳이면 `piece-drop-target`이 표시되어, 놓기 전에 옮겨질지 알 수 있습니다.

## 섞기는 아무렇게나

슬라이딩 퍼즐과 달리 사진퍼즐은 임의의 두 조각(또는 그룹)을 바꿀 수 있어서 어떤 배치든 풀 수 있습니다. 그래서 섞기는 단순합니다.

```js
Array.from({ length: total }, (_, index) => index).sort(() => Math.random() - 0.5)
```

이 방식은 표준 셔플(Fisher-Yates)이 아니라서 모든 배치가 같은 확률로 나오지 않습니다. 비교 함수가 일관되지 않으면 자바스크립트 엔진에 따라 결과가 편향됩니다. 퍼즐에서는 눈에 띄는 문제가 아니라고 보고 두었지만, 숫자 야구의 비밀 숫자처럼 공정성이 필요한 곳에는 Fisher-Yates를 씁니다. 다음에 손볼 때는 이 줄도 같은 방식으로 바꾸는 편이 낫습니다.

## 세 단계 힌트

힌트 버튼은 누를 때마다 다음 단계를 엽니다.

1. **틀린 개수**: 제자리에 없는 조각이 몇 개인지 알려 줍니다.
2. **틀린 위치**: 제자리에 없는 조각에 표시를 붙입니다.
3. **전체 그림**: 완성된 그림 미리 보기를 엽니다.

```js
function wrongIndexes() {
  return boardOrder
    .map((source, index) => (source === index ? -1 : index))
    .filter((index) => index >= 0);
}
```

어느 단계까지 열었는지는 결과에 `힌트 N단계`로 남아, 같은 사진을 푼 참가자끼리 비교할 수 있습니다.

## 장소 정답

퍼즐이 맞춰진 뒤에 장소를 입력합니다. 비교는 단순합니다.

```js
function normalize(text) {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}
const correct = normalize(els.answer.value) === normalize(payload.place || "");
```

앞뒤 공백을 자르고, 연속된 공백을 하나로 줄이고, 소문자로 바꿔서 완전히 같은지 봅니다. 별칭이나 부분 일치는 지원하지 않습니다. "서울특별시 종로구"가 정답일 때 "종로"는 틀린 답입니다.

방장이 사진을 올릴 때 장소를 GPS에서 추천해 주는 부분은 [사진 한 장으로 '여기가 어디게?'](/notes/direct-play-photo-gps-place-quiz/)에서 다뤘습니다.

## 조각이 미끄러지는 애니메이션

조각을 바꾸면 각 조각이 이전 위치에서 새 위치로 미끄러집니다. 실제 DOM은 이미 새 위치에 있고, 이전 위치와의 차이만큼 먼저 되돌려 놓은 뒤 변환을 풀어서 애니메이션을 만드는 방식(FLIP)입니다.

```js
function animatePieceMove(piece, fromRect) {
  const toRect = piece.getBoundingClientRect();
  const dx = fromRect.left - toRect.left;
  const dy = fromRect.top - toRect.top;
  if (!dx && !dy) return;
  piece.style.transition = "none";
  piece.style.transform = `translate(${dx}px, ${dy}px)`;
  piece.getBoundingClientRect();     // 강제 리플로우로 시작 위치를 확정
  piece.style.transition = "";
  piece.style.transform = "";
}
```

`prefers-reduced-motion`이 켜져 있으면 애니메이션 없이 바로 바꿉니다.

## 멀티터치에서 보드가 잠기던 버그

끌기 리스너는 `window`에 붙어 있습니다. 태블릿에서 조각을 끄는 동안 다른 손가락이나 손바닥이 화면에 닿았다 떨어지면, 그 손가락의 `pointerup`이 같은 리스너로 들어옵니다. 예전 코드는 이벤트가 오면 누구 것인지 확인하지 않고 리스너부터 뗐습니다. 그러면 정작 조각을 잡고 있던 손가락의 `pointerup`을 영영 못 받아서 "지금 상호작용 중" 플래그가 켜진 채로 굳었고, 이후 모든 입력이 막혀 보드가 죽었습니다. 끌던 조각의 고스트도 화면에 남았습니다.

```js
function onPointerUp(event) {
  if (drag.pointerId != null && event.pointerId !== drag.pointerId) return;
  detachDragListeners();
  endDrag(event);
}
```

지금은 처음 잡은 `pointerId`와 같은 포인터의 이벤트일 때만 끝냅니다. 웹뷰가 `pointerup`을 흘리는 경우를 위해서, 모든 손가락이 떨어진 뒤 처음 닿는 주 포인터(`isPrimary`)가 들어오면 남은 상태를 정리하는 안전장치도 `startDrag`에 있습니다.

## 남은 일

- 이 게임에는 조각 이동을 검사하는 자동 테스트가 없습니다. 그룹 이동 함수는 순수하게 배열만 다루므로 테스트를 붙이기 좋은 후보입니다.
- 셔플이 표준 방식이 아닙니다.
- 장소 정답이 정확히 같은 글자여야 합니다.

## 참고

- 같은 사진 퍼즐을 밀어서 푸는 버전: [슬라이딩 퍼즐](/notes/direct-play-photo-sliding-puzzle-solver/)
- 사진이 참가자에게 전달되는 과정: [사진은 서버를 거치지 않는다](/notes/direct-play-p2p-game-assets/)
