---
title: "SUM DROP: 합 10을 지우는 낙하 퍼즐 — 시드 하나로 같은 판을 만들고, 연쇄를 한 단계씩 기록하기"
description: "Direct Play의 SUM DROP이 시드 문자열에서 같은 보드와 같은 블록 순서를 만드는 방법, 합이 목표인 줄을 찾는 매처, 연쇄를 단계별로 기록해 애니메이션과 분리한 구조, 20개 손으로 만든 스테이지를 코드로 설명합니다. 해커톤 앱의 서버 검증이 사라진 것도 적습니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Game Design", "Deterministic", "TypeScript", "Canvas"]
---

[SUM DROP](https://sum-drop.still-coding.cc)은 위에서 떨어지는 숫자 블록을 원하는 칸에 놓아서, 가로·세로·대각선으로 이어진 숫자의 합이 10이 되면 지우는 게임입니다. 지워진 자리로 위 블록이 내려오면서 새 합이 생기면 연쇄가 이어집니다. 스테이지를 하나씩 깨는 STAGE CLIMB, 끝없이 버티는 엔들리스, 3분 스프린트 세 모드가 있습니다.

PINHOLE과 마찬가지로 해커톤용 독립 앱에서 만들어 Direct Play로 옮긴 게임입니다. 독립 앱에서는 2026년 8월 16일에 추가했고, 9월 26일에 Direct Play의 모듈로 가져왔습니다.

## 같은 시드, 같은 판

방장이 만든 방에서는 모든 참가자가 같은 판에서 시작해야 합니다. 그래서 게임의 무작위는 전부 시드 문자열 하나에서 나옵니다.

```ts
/** Deterministic 32-bit PRNG. The state is serializable for replay validation. */
export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 0x9e3779b9;
}

export function nextRandom(state: number): { state: number; value: number } {
  let next = (state + 0x6d2b79f5) | 0;
  let value = Math.imul(next ^ (next >>> 15), 1 | next);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
  return { state: next >>> 0, value: ((value ^ (value >>> 14)) >>> 0) / 4294967296 };
}
```

시드 문자열은 FNV-1a 해시로 32비트 숫자가 되고, 난수 생성기는 그 숫자를 상태로 들고 다음 값을 돌려줍니다. 상태가 숫자 하나뿐이라서 저장했다가 그대로 복원할 수 있습니다. `Math.random`은 게임 안에서 쓰지 않습니다.

숫자가 나오는 확률은 가중치 표로 정합니다. 기본값은 1~9에 `[15, 15, 15, 15, 12, 10, 8, 6, 4]`이고, 작은 숫자가 더 자주 나옵니다. 보너스 스테이지는 이 표를 더 작은 숫자 쪽으로, 어려운 스테이지는 큰 숫자 쪽으로 바꿉니다.

시작 보드도 시드에서 만듭니다. 아래쪽 두 줄(기본값)을 채우되, 채우는 도중에 이미 합 10이 되는 줄이 생기지 않는 숫자를 고릅니다. 시작하자마자 저절로 지워지는 줄이 있으면 안 되기 때문입니다.

## 합이 10인 줄 찾기

```ts
export function findMatches(board, target, flags, minLength = 2): MatchGroup[] {
  for (const direction of DIRECTIONS) {            // 가로, 세로, 대각선 두 방향
    if (!flags[direction.enabled]) continue;
    for (let row ...) for (let column ...) {
      // 이 방향의 줄이 시작하는 칸만 출발점으로 삼는다
      // 숫자가 이어지는 구간(run)을 모은다. 빈칸과 돌에서 끊긴다.
      for (let start = 0; start < run.length; start += 1) {
        let sum = 0;
        for (let end = start; end < run.length; end += 1) {
          sum += board[run[end].row][run[end].column] ?? 0;
          if (sum > target) break;
          if (sum === target && end - start + 1 >= minLength) {
            groups.push({ positions: run.slice(start, end + 1), direction });
            break;
          }
        }
      }
    }
  }
  return groups;
}
```

방향마다 이어진 숫자 구간을 하나씩 뽑고, 그 구간 안에서 시작 위치를 옮겨 가며 합이 정확히 목표가 되는 가장 짧은 구간을 찾습니다. 숫자는 모두 1 이상이라 합이 목표를 넘으면 그 시작점에서는 더 볼 필요가 없습니다. 돌(0으로 저장)과 빈칸은 구간을 끊습니다. 예를 들어 `3, 돌, 7`은 합 10이 아닙니다.

한 번에 여러 구간이 겹쳐서 잡힐 수 있습니다. 겹치는 블록은 한 번만 지우고(`uniqueMatchPositions`), 지운 블록 바로 옆(상하좌우)에 있는 돌은 같이 부서집니다. 돌은 합을 끊는 방해물이지만, 옆에서 매치가 터지면 사라집니다.

## 연쇄를 한 단계씩 기록한다

블록이 착지하면 지울 줄이 없어질 때까지 반복합니다.

```ts
while (true) {
  const groups = matchesOn(state.board, state.settings);
  if (groups.length === 0) break;
  chain += 1;
  const positions = uniqueMatchPositions(groups);
  const lengths = groups.map((group) => group.positions.length);
  const linkScore = scoreResolution(positions.length, lengths, chain);
  const before = state.board;
  const removed = [...positions, ...adjacentStones(before, positions)];
  const emptied = removePositions(before, removed);
  steps.push({ chain, board: before, groups: /* ... */, removed, falls: gravityFalls(emptied), score: linkScore });
  state.board = applyGravity(emptied);
}
```

한 번의 착지가 `steps` 배열로 돌아옵니다. 각 단계에는 지우기 전 보드, 지워진 그룹, 없어진 블록, 어떤 블록이 어디서 어디로 떨어지는지(`falls`), 그 단계의 점수가 들어 있습니다. 게임 규칙은 이 계산이 끝난 결과만 씁니다.

화면은 이 기록을 받아 한 단계씩 재생합니다. 이어진 줄에 하이라이트를 주고, 부서지고, 위 블록이 떨어지고, 다음 연쇄로 넘어갑니다. 애니메이션 시간과 게임 규칙이 서로 섞이지 않습니다. 규칙 쪽 테스트는 화면 없이 돌릴 수 있고, 연출을 바꿔도 규칙은 그대로입니다.

### 점수

```ts
export function chainMultiplier(chain: number): number {
  if (chain >= 5) return 5;
  if (chain === 4) return 3;
  if (chain === 3) return 2;
  if (chain === 2) return 1.5;
  return 1;
}

export function scoreResolution(blockCount: number, matchLengths: number[], chain: number): number {
  const base = blockCount * 10;
  const largeGroupBonus = matchLengths.reduce((sum, length) => sum + Math.max(0, length - 2) ** 2 * 10, 0);
  return Math.round((base + largeGroupBonus) * chainMultiplier(chain));
}
```

지운 블록 하나에 10점이고, 3개 이상을 한 줄로 지우면 `(길이−2)² × 10`의 보너스가 붙습니다. 블록 두 개를 지우면 20점, 세 개를 한 줄로 지우면 30 + 10 = 40점, 네 개면 40 + 40 = 80점입니다. 그 값에 연쇄 배수가 곱해집니다. 2연쇄는 1.5배, 3연쇄는 2배, 4연쇄는 3배, 5연쇄부터는 5배입니다. 긴 줄과 연쇄를 노리는 쪽이 유리합니다.

## 아래에서 올라오는 줄

STAGE CLIMB(세 번째 스테이지부터)과 엔들리스에는 일정 시간마다 바닥에서 방해 줄이 올라옵니다. 이 줄은 구멍이 한 칸 있고, 몇 칸은 돌이며 나머지는 숫자입니다.

```ts
for (let column = 0; column < width; column += 1) {
  if (column === holeColumn) continue;
  if (stones.has(column)) { row[column] = STONE; continue; }
  const drawn = drawDigit(state);
  row[column] = drawn;
  // A garbage row must not hand out free clears; rotate through digits until it is inert.
  for (let offset = 1; offset < 9 && matchesOn(board, state.settings).length > 0; offset += 1) {
    row[column] = ((drawn - 1 + offset * 4) % 9) + 1;
  }
  // ...
}
```

새 줄이 올라오자마자 저절로 지워지면 플레이어에게 공짜 점수를 주는 셈입니다. 그래서 줄을 채울 때 합 10이 만들어지지 않는 숫자를 골라서 넣습니다.

구멍과 돌의 위치, 숫자는 모두 시드의 난수에서 나옵니다. 다만 떨어지는 블록의 숫자와 방해 줄이 **같은 난수열**을 나눠 씁니다. 방해 줄이 없는 모드(스프린트, 스테이지 1·2)에서는 모든 참가자가 같은 블록 순서를 받지만, 방해 줄이 있는 모드에서는 블록을 빨리 떨어뜨린 사람이 난수를 더 많이 소비한 상태에서 방해 줄을 받게 됩니다. 시작 보드는 모두 같고 이후 판은 플레이에 따라 달라집니다.

## 스테이지는 손으로 20개

STAGE CLIMB의 스테이지는 처음 20개를 손으로 만들었습니다.

```ts
// Each stage introduces at most one new idea; every 5th is a breather and every 10th a boss.
const HANDMADE: StageSpec[] = [
  { quota: 20, fall: 16, intro: "블록 20개를 지우면 클리어! 합 10을 만들어 보세요." },
  { quota: 30, fall: 15, intro: "다음 숫자를 미리 읽고 긴 합을 노려 보세요." },
  { quota: 40, fall: 14, garbage: 10, intro: "새 규칙: 바닥에서 방해 줄이 올라옵니다. 꼭대기에 닿으면 실패!" },
  { quota: 45, fall: 14, garbage: 9, stones: 2, intro: "새 블록: 돌. ..." },
  { quota: 45, fall: 12, weights: BONUS_WEIGHTS, intro: "BONUS: 작은 숫자가 쏟아집니다. 연쇄를 노리세요!" },
  // ...
  { quota: 55, fall: 9, garbage: 8, stones: 4, target: 12, minMatch: 3, preview: 1, weights: HEAVY_WEIGHTS, intro: "BOSS: 지금까지의 모든 규칙이 한꺼번에!" },
];
```

한 스테이지에 새 아이디어를 하나씩만 넣습니다. 방해 줄, 돌, 미리보기 줄이기, 목표 합 12, 대각선 끄기, 3개 이상 매치, 목표 합 15 순서로 규칙이 하나씩 더해집니다. 5의 배수 스테이지는 작은 숫자가 많이 나오는 쉬어가는 보너스이고, 10의 배수는 모든 규칙이 합쳐진 보스입니다.

20번을 넘으면 코드가 만듭니다. 방해 줄 간격은 짧아지고 돌은 늘어나며 떨어지는 속도가 빨라지는데, 각각 하한과 상한(방해 줄 4초, 돌 8개, 낙하 6틱)이 있습니다. 앞에 나온 규칙 조합 다섯 가지를 돌려 씁니다.

클리어하면 별 1개를 받고, 점수가 목표 블록 수의 13배면 2개, 18배면 3개입니다. 규칙 없이 두 개짜리만 계속 지우면 목표 블록 수의 10배가 나오므로(`quota × 10`), 별을 더 받으려면 긴 줄이나 연쇄가 필요합니다.

각 스테이지와 재도전은 고유한 시드를 받습니다.

```ts
export function stageSeed(runSeed: string, stage: number, attempt: number): string {
  return `${runSeed}-s${stage}-a${attempt}`;
}
```

실패하고 다시 하면 `attempt`가 올라가서 새 판이 나옵니다.

## 진행 기록은 브라우저에만

스테이지 잠금, 별, 최고 점수는 `localStorage`의 `dp_sum_drop_progress_v1`에 저장합니다. 방에서 하는 게임은 스테이지를 해금하지 않습니다.

```ts
/**
 * Solo SUM DROP records kept in this browser only: ...
 * Room play never unlocks stages, so a shared seed cannot be farmed for stars.
 */
```

같은 시드를 받은 방에서 별을 쌓을 수 있으면 반복해서 노릴 수 있기 때문입니다. 저장이 막힌 브라우저(사생활 보호 창, 저장 공간 부족)에서는 기록만 남지 않고 게임은 그대로 진행됩니다.

## 독립 앱에서 옮겨 오며 사라진 것

독립 앱에는 실시간 게임방이 있었고, 서버가 결과를 검증했습니다. 플레이어가 보낸 입력 기록을 서버가 같은 시드로 다시 재생해서, 플레이어가 주장한 점수와 같은지 확인했습니다. 이 방식이 가능한 것은 엔진이 결정적이기 때문입니다.

이 검증에서 발견한 문제가 둘 있었습니다.

- **입력도 틱을 하나 소비합니다.** 3분 게임은 3,600틱(틱 하나가 50ms)이라고 계산했는데, 플레이어의 입력 하나가 엔진을 한 틱 진행시킵니다. 입력이 많은 판은 3,600틱을 넘겨 끝나는데, 서버는 3,600틱을 넘은 입력을 거부했습니다. 3분을 끝까지 채운 판에 늦은 입력이 있으면 검증에 실패했습니다. 한도를 `3,600 + 입력 수`로 바꾸고, 클라이언트가 자신이 끝난 틱을 함께 보내도록 고쳤습니다.
- **화면이 사라진 뒤 게임 루프가 죽었습니다.** 서버의 라운드 타이머가 클라이언트보다 먼저 끝나면 클라이언트가 게임 화면을 숨깁니다. 크기가 0인 캔버스에 계속 그리다가 예외가 나서 루프가 종료 처리(`finish`) 전에 죽었고, 모든 참가자의 점수가 0으로 기록됐습니다. 캔버스에 크기가 없으면 그리기를 건너뛰게 했습니다.

Direct Play로 옮기면서 서버 검증은 없어졌습니다. 다른 게임들과 같은 방식으로 점수를 브라우저에서 계산하고 결과에 실어 보냅니다. 같은 설정(`모드:난이도:스테이지:시드`)으로 푼 결과끼리만 순위를 매기지만, 점수를 조작할 수 있다는 점은 다른 캐주얼 게임과 같습니다. 결정적 엔진이므로 나중에 서버 재생 검증을 다시 붙일 수는 있습니다. 관련 테스트는 이식한 파일에 그대로 남아 있습니다.

## 테스트

엔진 테스트는 규칙을 손으로 계산한 값과 비교합니다.

```ts
assert.equal(findMatches(board([[3, STONE, 7]]), 10, flags).length, 0, "a stone breaks a sum");
assert.equal(findMatches(board([[3, 7, null]]), 10, flags, 3).length, 0, "pairs do not clear when three are required");
assert.deepEqual(sumDropEndlessPressure(1), { fallTicks: 14, garbageTicks: 240, stones: 1 });
assert.deepEqual(sumDropEndlessPressure(20), sumDropEndlessPressure(13), "ENDLESS stops getting harder after level 13");
```

엔들리스의 압박은 레벨에 따라 올라가다 13에서 멈춥니다. 레벨 13부터는 방해 줄이 3초마다 올라오고 돌이 7개씩 섞입니다.

## 남은 일

- 서버 검증이 없어서 점수를 조작할 수 있습니다.
- 20번 이후 스테이지는 다섯 가지 규칙 조합을 반복하는 수준이고, 직접 해 보고 다듬은 것이 아닙니다.
- 낙하 속도와 방해 줄 간격은 봇 시뮬레이션과 감으로 정했습니다. 실제 플레이어의 클리어율 같은 자료가 없습니다.

## 참고

- 독립 앱에서 함께 옮겨 온 게임: [PINHOLE](/notes/direct-play-pinhole-coverage-score/)
- 게임 모듈 계약과 번들: [게임 모듈 구조](/notes/direct-play-game-module-registry/)
