---
title: "숫자 야구: 판정은 스무 줄이고, 나머지는 입력을 막고 상태를 복원하는 일이었다"
description: "Direct Play 숫자 야구의 비밀 숫자 생성, 스트라이크·볼 판정, 중복 입력 차단, 세 상태 메모, 힌트, 새로고침 뒤 복원과 순위 정렬을 실제 코드로 정리합니다. 참가자가 정답을 볼 수 있다는 한계도 함께 적습니다."
pubDate: 2026-10-01
app: direct-play
game: number-baseball
tags: ["Game Design", "JavaScript", "Puzzle", "Testing"]
---

[숫자 야구](https://number-baseball.still-coding.cc)는 서로 다른 숫자로 된 비밀 숫자를 스트라이크와 볼 단서로 맞히는 게임입니다. 방장이 자릿수(3~5자리)와 추리 횟수 제한을 정하면 모든 참가자가 같은 비밀 숫자를 받습니다. 누가 더 적은 횟수로 맞히는지 겨룹니다.

## 실시간 퀴즈를 접고 고른 게임

어릴 때 많이 해 본 게임이라 넣고 싶었습니다.

계획서에는 처음 생각한 게임이 따로 남아 있습니다. 실시간으로 문제를 내는 퀴즈였습니다. Direct Play는 방장이 설정을 끝낼 때 게임 자원(이 게임에서는 비밀 숫자)을 한 번 고정하고, 참가자는 그것을 받아 각자 풀고 결과만 모으는 구조입니다. 문제를 그때그때 내는 방식은 이 구조와 맞지 않았습니다. 그래서 같은 문제를 각자 풀어도 성립하는 추리 게임으로 바꿨습니다.

자원이 어떻게 참가자에게 가는지는 [사진은 서버를 거치지 않는다](/notes/direct-play-p2p-game-assets/)에 적었습니다.

## 비밀 숫자는 문자열이다

```js
export function generateSecret(digits, rng = Math.random) {
  const pool = "0123456789".split("");
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, digits).join("");
}
```

0부터 9까지를 Fisher-Yates로 섞고 앞에서 자릿수만큼 자릅니다. 서로 다른 숫자가 되도록 뽑는 것이 아니라, 섞은 순서에서 잘라 내기 때문에 중복이 생길 수 없습니다. 결과는 숫자가 아니라 문자열입니다. 첫 자리가 0인 `"0123"`을 그대로 보존하려는 것입니다. 테스트에도 첫 자리가 0인 비밀 숫자를 찾아 유효한 추리로 인정되는지 확인하는 항목이 있습니다.

가능한 비밀 숫자는 3자리가 720개, 4자리가 5,040개, 5자리가 30,240개입니다. 5자리는 10×9×8×7×6입니다.

## 판정

```js
export function judge(secret, guess) {
  let strikes = 0;
  let balls = 0;
  for (let index = 0; index < secret.length; index += 1) {
    if (guess[index] === secret[index]) strikes += 1;
    else if (secret.includes(guess[index])) balls += 1;
  }
  return {
    strikes,
    balls,
    isOut: strikes === 0 && balls === 0,
    isCorrect: strikes === secret.length,
  };
}
```

자리가 같으면 스트라이크, 자리는 다르지만 비밀 숫자에 들어 있으면 볼입니다. 두 숫자열 모두 중복이 없다는 전제라서 `includes` 한 번으로 충분합니다. 같은 숫자가 두 번 나오는 게임이었다면 볼을 세는 방법이 달라져야 합니다.

테스트는 손으로 계산한 값과 비교합니다. 비밀 숫자가 `3702`일 때 `3720`은 2S 2B, `3082`는 2S 1B, `2037`은 0S 4B입니다.

## 잘못된 입력은 검사하지 않고 못 누르게 한다

제출된 추리가 올바른지 검사하는 함수는 있습니다.

```js
export function validateGuess(guess, digits) {
  if (typeof guess !== "string" || guess.length !== digits) return { ok: false, reason: "length" };
  if (!/^[0-9]+$/.test(guess)) return { ok: false, reason: "char" };
  if (new Set(guess).size !== guess.length) return { ok: false, reason: "duplicate" };
  return { ok: true };
}
```

하지만 화면에서는 이 검사에 걸릴 입력이 애초에 만들어지지 않게 했습니다. 입력 중인 추리에 이미 쓴 숫자는 패드에서 비활성화됩니다. 오류 메시지를 읽게 하는 것보다 누를 수 없게 하는 편이 모바일에서 덜 답답하다고 봤습니다. `validateGuess`는 저장된 상태를 복원하거나 받은 데이터를 확인할 때 씁니다.

같은 수를 다시 제출하는 경우는 패드로 막을 수 없습니다. 이때는 입력 칸이 흔들리고 경고가 나오며, 추리 횟수는 늘지 않습니다. 순위가 횟수로 정해지기 때문에 실수로 같은 수를 낸 것을 횟수에 넣지 않았습니다.

## 메모는 세 상태, 추론은 사람이 한다

0~9 숫자마다 메모 상태가 있습니다. 모름 → 제외 → 확정 → 모름으로 한 번 누를 때마다 순환합니다.

```js
export function cycleMemoState(state) {
  const current = Number(state);
  if (!Number.isInteger(current) || current < 0 || current >= MEMO_STATE_COUNT) return MEMO_UNKNOWN;
  return (current + 1) % MEMO_STATE_COUNT;
}
```

제외된 숫자는 패드에서 흐리게 보이고, 확정된 숫자는 링이 붙습니다. 메모는 사용자가 적는 것이고, 게임이 판정 로그에서 자동으로 지워 주지는 않습니다. 메모에 페널티도 없습니다.

## 힌트

```js
export function maxHintsFor(digits) {
  return Math.max(1, digits - 2);
}
```

힌트는 정답의 한 자리를 알려 줍니다. 3자리는 1번, 4자리는 2번, 5자리는 3번 쓸 수 있습니다.

```js
export function pickHint(secret, revealedPositions = [], rng = Math.random) {
  const available = [];
  for (let position = 0; position < secret.length; position += 1) {
    if (!revealedPositions.includes(position)) available.push(position);
  }
  if (!available.length) return null;
  const position = available[Math.floor(rng() * available.length)];
  return { position, digit: secret[position] };
}
```

이미 공개된 자리는 후보에서 빼고 남은 자리 중 하나를 고릅니다. 난수 함수를 인자로 받기 때문에 테스트에서는 시드가 정해진 난수를 넣어 같은 결과가 나오는지 확인합니다. 힌트를 쓴 횟수는 결과에 기록되어 순위에서 두 번째 기준이 됩니다.

## 새로고침해도 이어 하기

저장하는 것은 추리 목록, 입력 중인 숫자, 메모, 사용한 힌트입니다. 스트라이크와 볼은 저장하지 않습니다.

```js
export function restoreGuesses(rawGuesses, payload) {
  if (!Array.isArray(rawGuesses)) return [];
  const guesses = [];
  for (const item of rawGuesses) {
    const guess = typeof item === "string" ? item : "";
    if (!validateGuess(guess, payload.digits).ok) continue;
    if (guesses.includes(guess)) continue;
    guesses.push(guess);
    if (guess === payload.secret) break;
    if (payload.maxGuesses > 0 && guesses.length >= payload.maxGuesses) break;
  }
  return guesses;
}
```

복원할 때 판정은 비밀 숫자로 다시 계산합니다. 저장된 판정을 믿지 않으면 저장 형식이 바뀌어도 판정이 어긋날 일이 없습니다. 유효하지 않거나 중복된 추리는 건너뛰고, 정답이 나왔거나 횟수 제한에 닿으면 거기서 멈춥니다. 힌트도 마찬가지로 `digit === secret[position]`인 것만 남깁니다.

브라우저 저장소는 사용자가 직접 고칠 수 있는 곳이라, 읽은 값을 그대로 쓰지 않고 검증해서 쓰도록 했습니다.

## 순위

결과 화면의 정렬 기준은 다음 순서입니다.

```js
displayResults.sort((first, second) => {
  if (first.status !== second.status) return first.status === "completed" ? -1 : 1;
  return (first.correct === true ? 0 : 1) - (second.correct === true ? 0 : 1)
    || metric(first.guesses) - metric(second.guesses)
    || metric(first.hintsUsed) - metric(second.hintsUsed)
    || metric(first.elapsed) - metric(second.elapsed)
    || Date.parse(first.endedAt || 0) - Date.parse(second.endedAt || 0);
});
```

끝까지 한 사람이 먼저, 정답을 맞힌 사람이 그다음이고, 이어서 추리 횟수, 힌트 횟수, 걸린 시간 순입니다. 추리 횟수 제한을 다 쓰고 못 맞힌 사람은 "기회 소진"으로 표시되고 순위에 번호가 붙지 않습니다.

## 한계

비밀 숫자는 참가자에게 전달되는 자원 안에 들어 있습니다. 개발자 도구를 열면 볼 수 있습니다. 서버가 판정하는 게임이 아니라, 같은 문제를 각자 푸는 캐주얼 게임이라는 점에서 다른 게임과 같은 수준입니다. 친구끼리 하는 게임이라는 전제로 두었고, 이 전제가 맞지 않는 곳에서 쓰려면 판정을 서버로 옮겨야 합니다.

## 참고

- 게임 모듈이 로비에 연결되는 방식: [게임을 아홉 개로 늘려도 로비가 가벼운 이유](/notes/direct-play-game-module-registry/)
- 같은 방식으로 문제를 하나 만들어 나눠 갖는 게임: [6×6 미니 스도쿠](/notes/direct-play-mini-sudoku-generator/)
