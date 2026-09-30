---
title: "슬라이딩 사진퍼즐: 섞기는 거꾸로 걸어서, 풀이는 A*로 — 그리고 4×4부터 멈추는 풀이 버튼"
description: "Direct Play 슬라이딩 사진퍼즐이 풀 수 있는 배치만 만드는 방법, 한 줄을 통째로 미는 이동 규칙, 포기하면 보여 주는 정답 풀이(BFS·A*)를 코드로 설명합니다. 풀이가 3×3에서만 안정적이고 4×4부터 실패하는 것을 직접 재어 정리했습니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Puzzle", "A*", "BFS", "Algorithm"]
---

[슬라이딩 사진퍼즐](https://photo-sliding-puzzle.still-coding.cc)은 빈칸 하나를 두고 사진 조각을 밀어 원래 그림을 맞추는 퍼즐입니다. 방장이 사진과 크기(3×3~6×6)를 정하면 참가자가 각자 같은 사진을 풉니다. 막히면 포기하고 정답 풀이를 단계별로 볼 수 있습니다.

사진을 올리고 참가자에게 나눠 주는 부분은 [사진퍼즐](/notes/direct-play-photo-puzzle-group-drag/)의 코드를 복사해서 시작했고, 전달 방식은 [사진은 서버를 거치지 않는다](/notes/direct-play-p2p-game-assets/)에서 다뤘기 때문에 이 글에서는 다루지 않습니다. 새로 쓴 것은 세 가지입니다. 풀 수 있는 배치 만들기, 줄 단위로 미는 이동, 그리고 정답 풀이입니다.

## 아무렇게나 섞으면 절반은 풀 수 없다

슬라이딩 퍼즐은 조각을 무작위로 늘어놓으면 안 됩니다. 빈칸이 있는 이동만 허용되기 때문에, 가능한 모든 배치 가운데 정확히 절반은 아무리 밀어도 원래 그림이 되지 않습니다. 그래서 섞기를 "정답 상태에서 시작해 빈칸을 무작위로 걷게 하는" 방식으로 했습니다.

```js
function shuffleTiles(n, moveCount = null) {
  let tiles = solvedTiles(n);
  const totalMoves = moveCount ?? n * n * 30;
  let prevBlank = -1;
  for (let step = 0; step < totalMoves; step += 1) {
    const blank = blankIndex(tiles);
    const neighbors = neighborIndexes(blank, n);
    const candidates = prevBlank >= 0 ? neighbors.filter((index) => index !== prevBlank) : neighbors;
    const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? neighbors[0];
    tiles = slideTilesSingle(tiles, pick);
    prevBlank = blank;
  }
  return tiles;
}
```

- 정답 배치에서 시작해 실제 게임과 같은 이동을 반복하므로, 결과는 반드시 되돌릴 수 있는 배치입니다.
- 직전에 있던 칸으로 곧바로 되돌아가는 이동은 제외합니다. 안 그러면 앞뒤로 흔들리기만 하고 섞이지 않는 경우가 생깁니다.
- 횟수는 `n × n × 30`입니다. 3×3이면 270번, 6×6이면 1,080번입니다.

## 한 줄을 통째로 민다

빈칸과 같은 행이나 열에 있는 조각을 누르면, 그 조각과 빈칸 사이의 조각이 모두 빈칸 쪽으로 한 칸씩 밀립니다.

```js
if (fromRow === blankRow) {
  const row = fromRow;
  if (fromCol < blankCol) {
    for (let col = blankCol; col > fromCol; col -= 1) {
      next[row * n + col] = next[row * n + col - 1];
    }
  } else {
    for (let col = blankCol; col < fromCol; col += 1) {
      next[row * n + col] = next[row * n + col + 1];
    }
  }
  next[fromIndex] = BLANK;
  return { tiles: next, moveCount: Math.abs(blankCol - fromCol) };
}
```

조각 하나를 누르고 빈칸까지 여러 칸 떨어져 있어도 한 번에 밀립니다. 이웃한 조각만 한 칸씩 움직이는 전통적인 방식과 다른 점입니다. 이동 횟수는 밀린 조각의 개수만큼 올라갑니다(`moveCount`). 완료 연출에 `N번 이동`으로 표시되고, 결과에도 함께 제출됩니다.

이 이동 규칙은 풀이 탐색에도 영향을 줍니다. 아래에서 다룹니다.

## 포기하면 정답 풀이를 보여 준다

"포기"를 누르고 확인하면 지금 상태에서 정답까지 가는 경로를 계산해서, 이전/다음 버튼으로 한 단계씩 보여 줍니다. 경로를 찾는 방법은 크기에 따라 다릅니다.

```js
export function findSolutionPath(startTiles, n) {
  // ...
  const limit = NODE_LIMITS[n] || 800_000;

  if (n <= 3) {
    const linePath = searchSolution(startKey, goalKey, n, lineSlideMoves, limit);
    if (linePath) return linePath;
  }
  return searchSolutionAStar(startKey, goalKey, n, adjacentSlideMoves, limit);
}
```

- **3×3**: 줄 단위 이동을 그대로 쓰는 너비 우선 탐색(BFS)입니다. 게임에서 하는 이동과 같으므로 "가장 적게 누르는" 풀이가 나옵니다.
- **4×4 이상**: 한 칸씩 움직이는 이동으로 A* 탐색을 합니다. 휴리스틱은 각 조각이 제자리까지 가는 맨해튼 거리의 합입니다. 이 값은 실제 필요한 이동 수보다 크지 않으므로 A*가 최단 풀이를 돌려줍니다.
- 상태는 `"3,1,-1,..."` 같은 문자열 키로 방문 여부를 저장합니다.
- 방문한 상태가 한도(3×3 40만, 4×4 800만, 5×5 1,000만, 6×6 1,200만)를 넘으면 탐색을 포기하고 `null`을 돌려줍니다.

## 직접 재 보니

풀이 버튼이 실제로 얼마나 걸리고 얼마나 성공하는지 Node 22에서 재 봤습니다. 게임과 같은 방식(`n × n × 30`번 걷기)으로 섞은 배치를 `findSolutionPath`에 넣고 시간을 쟀습니다.

| 크기 | 시도 | 실패 | 걸린 시간 | 풀이 길이 |
|---|---|---|---|---|
| 3×3 | 30 | 0 | 중앙값 143ms, 최대 315ms | 11~20번(줄 이동) |
| 4×4 | 12 | 6 | 중앙값 약 18.7초, 최대 19.1초 | 44~56번(한 칸 이동) |
| 5×5 | 4 | 4 | 약 29초 | 없음 |
| 6×6 | 1 | 1 | 약 50초 | 없음 |

3×3은 문제가 없습니다. 4×4는 열두 번 중 여섯 번이 실패했고, 걸린 시간은 중앙값이 약 19초였습니다. 5×5와 6×6은 시도한 것 모두 실패했습니다. 표본이 작고(6×6은 한 번) 데스크톱 Node에서 잰 값이라 정확한 성공률이나 모바일 시간은 알 수 없지만, 3×3 밖에서는 이 기능을 믿을 수 없다는 것은 분명합니다.

더 나쁜 것은 계산이 메인 스레드에서 동기적으로 돌아간다는 점입니다.

```js
els.solutionMessage.textContent = "정답 경로를 찾는 중입니다. 잠시만 기다려 주세요.";
await new Promise((resolve) => { window.setTimeout(resolve, 0); });
const path = findSolutionPath(tiles, n);
if (!path) {
  ctx.notify("풀이를 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  return;
}
```

`setTimeout(…, 0)`을 한 번 기다리는 것은 "찾는 중입니다" 문구를 먼저 그리기 위해서입니다. 그다음 `findSolutionPath`가 시작되면 끝날 때까지 화면이 멈춥니다. 4×4에서 위 표대로라면 약 19초 동안 아무것도 눌리지 않고, 결국 "풀이를 계산하지 못했습니다"가 뜰 수도 있습니다.

## 어떻게 고칠 것인가

- 계산을 Web Worker로 옮기면 화면이 멈추는 문제는 사라집니다. 실패는 그대로입니다.
- 4×4 이상은 최단 풀이를 포기하고, 사람이 하는 방식(윗줄과 왼쪽 열부터 차례로 맞추기)으로 풀이를 만드는 방법이 있습니다. 게임의 도움말이 이미 이 전략을 설명하고 있어서 방향은 맞습니다. 풀이가 길어져도 항상 끝난다는 장점이 있습니다.
- IDA* 같은 메모리를 적게 쓰는 탐색이나 패턴 데이터베이스를 쓰는 방법도 있지만, 게임에 넣기에는 무겁습니다.

## 남은 일

- 이 게임에는 순수 로직 테스트가 없습니다. `logic.js`는 DOM에 의존하지 않아 테스트를 붙이기 쉽습니다. 이동 결과와 풀이가 정답 배치에 닿는지 확인하는 것부터 시작할 수 있습니다.
- `n × n × 30`번이면 충분히 섞이는지 확인하지 않았습니다.

## 참고

- 조각을 바꾸는 방식의 사진 퍼즐: [사진 퍼즐](/notes/direct-play-photo-puzzle-group-drag/)
- 게임 모듈이 로비에 연결되는 방식: [게임 모듈 구조](/notes/direct-play-game-module-registry/)
