---
title: "6×6 미니 스도쿠: 해가 하나뿐인 문제를 비트마스크 솔버로 만들어 내기"
description: "Direct Play의 6×6 미니 스도쿠가 문제를 만드는 방법을 정리합니다. 6비트 후보 마스크, 후보가 가장 적은 칸부터 푸는 백트래킹, 해를 두 개까지만 세는 유일성 검사, 180도 대칭 제거를 코드로 보이고 난이도 평가의 한계도 적습니다."
pubDate: 2026-10-01
app: direct-play
game: mini-sudoku
tags: ["Sudoku", "Algorithm", "Backtracking", "JavaScript"]
---

[6×6 미니 스도쿠](https://mini-sudoku.still-coding.cc)는 1~6을 각 행, 열, 2×3 박스에 한 번씩 넣는 스도쿠입니다. 방장이 난이도를 고르면 문제 하나가 만들어지고, 모든 참가자가 같은 문제를 풉니다. 오답 횟수, 힌트 횟수, 시간으로 순위를 정합니다.

모바일에서 여유 시간에 빨리 끝낼 수 있는 게임으로 6×6을 설계했습니다.

이 게임에서 신경 쓴 것은 "해가 하나뿐인 문제를 그 자리에서 만들어 낸다"입니다. 미리 만들어 둔 문제 은행 없이 방을 만들 때마다 새 문제가 나옵니다. 모든 참가자가 같은 문제를 푸는 방식이므로, 해가 둘 이상이면 어떤 사람은 정답과 다른 답을 내고도 규칙을 지킨 셈이 됩니다. 그래서 유일해가 필수 조건이었습니다.

## 보드와 후보를 숫자 하나로

보드는 길이 36의 평면 배열이고 `index = row * 6 + col`입니다. 각 행, 열, 박스에서 이미 쓴 숫자와 한 칸의 후보 숫자는 6비트 정수로 관리합니다. 숫자 `n`의 비트는 `1 << (n - 1)`입니다.

```js
const rowMasks = new Array(SIZE).fill(0);
const colMasks = new Array(SIZE).fill(0);
const boxMasks = new Array(SIZE).fill(0);

// 한 칸의 후보 = 전체 숫자에서 행·열·박스에 쓰인 숫자를 뺀 것
return ALL_DIGITS_MASK & ~(state.rowMasks[row] | state.colMasks[col] | state.boxMasks[box]);
```

`ALL_DIGITS_MASK`는 `0b111111`, 즉 63입니다. 후보 개수는 비트를 세면 되고, 후보가 하나뿐이면 그 칸의 값이 정해집니다. 숫자를 놓거나 지울 때는 세 마스크에 비트를 켜고 끄기만 하면 됩니다. 배열을 복사하거나 다시 훑을 필요가 없어서 백트래킹에 알맞은 표현이었습니다.

## 후보가 가장 적은 칸부터

```js
function search(state, options, onSolution) {
  checkDeadline(options.deadlineAt);
  const choice = findMrvCell(state);
  if (choice.index < 0) return onSolution([...state.cells]);
  if (choice.count === 0) return false;

  const values = options.randomize
    ? shuffledValues(choice.mask, options.rng)
    : shuffledValues(choice.mask, () => 0.999999);
  for (const value of values) {
    placeValue(state, choice.index, value);
    const shouldStop = search(state, options, onSolution);
    removeValue(state, choice.index, value);
    if (shouldStop) return true;
  }
  return false;
}
```

빈칸 중 후보가 가장 적은 칸을 고르는 전략(MRV)을 씁니다. 후보가 0개인 칸이 생기면 그 가지는 바로 버리고, 후보가 1개인 칸이 있으면 더 찾지 않고 그 칸부터 채웁니다.

같은 함수를 두 가지로 씁니다. 완성판을 만들 때는 후보 순서를 섞어서(`randomize`) 매번 다른 판이 나오게 하고, 풀이나 해 세기에서는 순서를 고정합니다. 재귀는 `onSolution` 콜백이 `true`를 돌려주면 즉시 빠져나옵니다.

## 해를 두 개까지만 센다

```js
export function countSolutions(board, limit = 2, options = {}) {
  const state = createSearchState(board);
  if (!state) return 0;
  const safeLimit = Math.max(1, Number(limit) || 1);
  let count = 0;
  search(state, { randomize: false, rng: Math.random, deadlineAt: options.deadlineAt }, () => {
    count += 1;
    return count >= safeLimit;
  });
  return count;
}
```

문제가 유일해인지 알고 싶을 뿐이라 해를 전부 셀 필요가 없습니다. 두 번째 해를 찾는 순간 멈추고 2를 돌려줍니다. 결과가 1이면 유일해, 2이면 해가 여럿, 0이면 풀 수 없는 보드입니다. 테스트는 빈 보드가 2를 돌려주는지, 한 칸만 비운 보드가 1을 돌려주는지 확인합니다.

## 완성판에서 칸을 빼 나가기

```js
const solution = generateSolvedBoard({ rng, deadlineAt });
const givens = [...solution];
let clueCount = CELL_COUNT;

for (const group of shuffledRemovalGroups(rng)) {
  if (clueCount - group.length < profile.targetClues) continue;
  const previous = group.map((index) => givens[index]);
  group.forEach((index) => { givens[index] = 0; });
  if (countSolutions(givens, 2, { deadlineAt }) === 1) {
    clueCount -= group.length;
  } else {
    group.forEach((index, offset) => { givens[index] = previous[offset]; });
  }
}
```

1. 빈 보드에서 후보 순서를 섞어 풀어 완성판을 얻습니다.
2. 칸을 무작위 순서로 지웁니다. 지운 뒤 해가 하나가 아니게 되면 바로 되돌립니다.
3. 남은 단서 수가 난이도의 목표에 닿으면 멈춥니다.

칸은 하나씩이 아니라 쌍으로 지웁니다. `shuffledRemovalGroups`는 `[index, 35 - index]`를 한 묶음으로 만드는데, 보드를 180도 돌렸을 때 겹치는 칸입니다. 그래서 단서 배치가 점대칭이 됩니다. 스도쿠 문제집에서 흔히 보는 모양을 따랐습니다.

난이도별 목표 단서 수는 쉬움 22개, 보통 18개, 어려움 14개입니다. 생성이 끝난 뒤에는 단서 수가 허용 범위 안인지, 쉬움과 어려움은 난이도 평가와 맞는지 다시 확인하고, 안 맞으면 처음부터 다시 시도합니다. 함수의 기본값은 최대 20번, 250ms이고, 방 설정 화면에서는 350ms, 30번으로 부릅니다. 시간 안에 못 만들면 `null`을 돌려주고 설정 화면이 다시 시도하라고 안내합니다.

## 난이도는 단서 수와 "한 가지 방법으로 풀리는가"

```js
export function rateDifficulty(board) {
  // ...
  const singles = solveWithSingles(board);
  const level = clueCount <= DIFFICULTIES.hard.targetClues
    ? "hard"
    : singles.solved
      ? "easy"
      : "normal";
```

`solveWithSingles`는 두 가지 규칙만 반복해서 적용합니다. 후보가 하나뿐인 칸을 채우기(naked single), 어떤 행·열·박스에서 그 숫자가 들어갈 칸이 하나뿐이면 채우기(hidden single)입니다. 이 두 규칙만으로 끝까지 풀리면 쉬움, 아니면 보통, 단서가 14개 이하면 어려움으로 봅니다.

사람이 쓰는 기법(쌍 후보, 잠긴 후보 등)으로 난이도를 재는 것은 아닙니다. 계획서에서도 기법 기반 평가는 나중 일로 미루고 단서 수 기반으로 시작하기로 했습니다. 어려움이 정말 "어렵다"고 말하려면 실제로 풀어 본 시간이 필요합니다.

## 생성이 얼마나 빠른가

Node 22에서 함수의 기본 옵션(250ms, 20번)으로 난이도마다 300번씩 생성해 봤습니다. 화면에서 쓰는 350ms, 30번은 이보다 여유가 있는 설정입니다.

| 난이도 | 실패 | 중앙값 | 95번째 백분위 | 최대 | 단서 수 |
|---|---|---|---|---|---|
| 쉬움 | 0/300 | 0.1ms | 0.4ms | 1.5ms | 22 |
| 보통 | 0/300 | 0.1ms | 0.2ms | 0.3ms | 18 |
| 어려움 | 0/300 | 0.1ms | 0.2ms | 0.7ms | 14 |

6×6에서는 백트래킹이 워낙 작아서 1ms 안에 끝납니다. 계획서는 생성이 오래 걸려 화면이 멈출까 봐 제한 시간과 미리 생성해 두는 방안을 적어 두었는데, 이 크기에서는 걱정한 만큼의 문제가 아니었습니다. 다만 이것은 데스크톱 Node의 값이고, 저사양 모바일 브라우저에서 잰 것은 아닙니다.

## 정답은 문제에 넣지 않는다

방장이 만든 문제는 자산 봉투에 담겨 참가자에게 전달됩니다. 봉투에는 단서(`givens`)만 들어 있고 완성판(`solution`)은 없습니다. 미리 보기 이미지에도 실제 단서를 그리지 않고 빈 격자와 난이도만 표시합니다.

받는 쪽은 그대로 믿지 않습니다.

```js
export function sanitizePuzzlePayload(payload) {
  const givens = Array.isArray(payload?.givens) ? payload.givens.map(Number) : null;
  if (!givens || givens.length !== CELL_COUNT || !isValidBoard(givens)) return null;
  if (countSolutions(givens, 2) !== 1) return null;
  // ...
}
```

길이, 값 범위, 행·열·박스 충돌을 확인하고, 유일해인지까지 다시 셉니다. 문제가 전송 중에 깨졌거나 저장소에서 변조됐다면 여기서 걸러집니다.

정답이 필요한 순간은 플레이가 시작될 때입니다. 참가자의 브라우저가 받은 단서로 `solve(givens)`를 한 번 돌려 정답을 메모리에만 둡니다. 이 값으로 입력이 맞는지 확인하고 힌트를 채웁니다.

## 오답과 힌트

```js
const allowedMask = getCandidateMask(values, selectedCell);
if (!(allowedMask & bitFor(digit))) return;
// ...
if (solution[selectedCell] !== digit) {
  mistakes += 1;
  // 칸이 흔들리고 값은 보드에 들어가지 않는다
}
```

같은 행, 열, 박스에 이미 있는 숫자는 후보에 없으므로 눌러도 아무 일이 없습니다. 오답으로 세지도 않습니다. 후보에는 있지만 정답이 아닌 숫자를 넣었을 때만 오답이 1 늘고, 그 숫자는 보드에 들어가지 않습니다.

힌트는 3번까지 쓸 수 있습니다. 빈칸 중 후보가 가장 적은 칸을 골라 정답을 채웁니다.

순위는 오답 횟수, 힌트 횟수, 시간 순으로 정합니다. 시간을 먼저 보면 아무 숫자나 빠르게 넣어 보는 방식이 유리해지기 때문에, 오답을 시간보다 앞에 두었습니다.

## 남은 한계

- 정답이 참가자의 브라우저에서 계산되므로, 개발자 도구를 열어 `solution`을 보는 것은 막지 못합니다.
- 테스트가 만드는 문제는 난이도별로 12개입니다. 계획서에는 난이도별 10,000개를 검증한다고 적어 두었지만 테스트에는 아직 반영하지 않았습니다.
- 어려움의 기준이 단서 수 14개 이하입니다. 단서가 적다고 논리가 어려운 것은 아닙니다.

## 참고

- 같은 "방장이 만든 문제를 모두가 푼다" 구조: [숫자 야구](/notes/direct-play-number-baseball/)
- 자원이 참가자에게 전달되는 과정: [사진은 서버를 거치지 않는다](/notes/direct-play-p2p-game-assets/)
