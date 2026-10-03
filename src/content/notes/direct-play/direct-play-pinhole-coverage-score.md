---
title: "PINHOLE: 본 만큼 점수가 깎이는 게임 — 128×72 격자로 '얼마나 봤는지' 재기"
description: "작은 원형 시야로 장면을 살피는 PINHOLE이 본 면적을 재는 방법과 점수 공식, 한국어 짧은 답을 판정하는 규칙을 코드로 설명합니다. 해커톤용 독립 앱에서 만든 게임을 Direct Play 모듈로 옮기면서 바뀐 것과 남은 한계도 정리합니다."
pubDate: 2026-10-01
app: direct-play
game: pinhole
tags: ["Game Design", "Canvas", "TypeScript", "Cloudflare R2"]
---

[PINHOLE](https://pinhole.still-coding.com)은 화면 전체가 아니라 작은 원 안만 보이는 게임입니다. 원을 움직여 장면 곳곳을 살피고, 무엇이 있는지 맞힙니다. 적게 볼수록 점수가 높습니다.

이 게임은 Direct Play에서 처음 만든 것이 아닙니다. 해커톤용으로 만든 독립 앱에서 시작했고(나중에 SUM DROP이 더해져 PINHOLE LAB이라는 이름이 됐습니다), 그다음 Direct Play의 게임 모듈로 옮겼습니다. 두 시점을 나눠서 적습니다.

## 본 면적을 어떻게 재는가

"적게 봤다"를 점수로 만들려면 얼마나 봤는지를 숫자로 알아야 합니다. 화면을 가로 128, 세로 72칸으로 나누고, 원이 지나가며 덮은 칸을 표시합니다.

```js
export class CoverageTracker {
  private readonly cells: Uint8Array;
  private visited = 0;

  constructor(private readonly columns = 128, private readonly rows = 72) {
    this.cells = new Uint8Array(columns * rows);
  }

  mark(normalizedX, normalizedY, radiusRatio) {
    const aspect = this.columns / this.rows;
    for (let row = 0; row < this.rows; row += 1) {
      const y = (row + 0.5) / this.rows;
      for (let column = 0; column < this.columns; column += 1) {
        const index = row * this.columns + column;
        if (this.cells[index]) continue;
        const x = (column + 0.5) / this.columns;
        const dx = (x - normalizedX) * aspect;
        const dy = y - normalizedY;
        if (dx * dx + dy * dy <= radiusRatio * radiusRatio) {
          this.cells[index] = 1;
          this.visited += 1;
        }
      }
    }
  }

  get ratio() { return this.visited / this.cells.length; }
}
```

- 칸은 모두 9,216개(128×72)입니다. 칸의 중심이 원 안에 들어오면 "봤다"고 표시합니다. 한 번 표시한 칸은 다시 세지 않으므로, 같은 곳을 왔다 갔다 해도 본 비율은 늘지 않습니다.
- 좌표는 0~1로 정규화하고, 가로 방향에는 화면 비율(`128/72`)을 곱해서 원이 찌그러지지 않게 합니다. 원의 반지름도 화면 높이에 대한 비율입니다.
- 결과는 `Uint8Array` 한 덩어리라서 스냅샷으로 저장하고 복원하기 쉽습니다. 새로고침해도 본 곳이 유지됩니다.

### 빠르게 움직여도 빠짐없이

포인터 이벤트는 프레임마다 한 번씩 오기 때문에, 손가락이나 마우스가 빨리 움직이면 두 점 사이가 건너뛰어집니다. 그 사이는 선분을 따라 잘게 나눠 표시합니다.

```js
markSegment(fromX, fromY, toX, toY, radiusRatio) {
  const aspect = this.columns / this.rows;
  const distance = Math.hypot((toX - fromX) * aspect, toY - fromY);
  const stepSize = Math.max(radiusRatio * 0.4, 0.002);
  const steps = Math.max(1, Math.ceil(distance / stepSize));
  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;
    this.mark(fromX + (toX - fromX) * progress, fromY + (toY - fromY) * progress, radiusRatio);
  }
}
```

간격을 반지름의 0.4배로 잡았기 때문에 인접한 표시가 항상 겹칩니다. 그 사이에 볼 수 있는 칸이 빠지지 않습니다.

## 점수 공식

```js
const scoreableInformation = Math.max(input.exploredRatio, input.scoreFloorRatio ?? 0);
const informationMultiplier = Math.pow(Math.max(0, 1 - scoreableInformation), 2);

const score = Math.round(
  10_000 * difficulty * verdictMultiplier[input.verdict] * informationMultiplier * input.accuracyMultiplier,
);
```

기본 점수 10,000점에 난이도(쉬움 1, 보통 1.25, 어려움 1.5, 극한 1.8), 판정(정답 1, 부분 정답 0.85, 오답 0), 정보량, 정확도를 곱합니다. 정보량은 `(1 − 본 비율)²`입니다. 제곱이라서 처음 조금 보는 구간에서 점수가 더 가파르게 줄어듭니다. 틀린 답과 시간 초과는 0점입니다.

정확도는 시도 횟수에서 옵니다. 답을 세 번까지 낼 수 있고, 두 번째부터 15%씩 깎입니다. 최소 0.5입니다.

```js
const accuracyMultiplier = Math.max(0.5, 1 - Math.max(0, attempts - 1) * 0.15);
```

보통 난이도에서 정답을 맞혔을 때 점수를 계산해 봤습니다.

| 본 비율 | 1번째 시도 | 2번째 시도 | 3번째 시도 |
|---|---|---|---|
| 5% | 11,281 | 9,589 | 7,897 |
| 10% | 10,125 | 8,606 | 7,088 |
| 30% | 6,125 | 5,206 | 4,287 |
| 60% | 2,000 | 1,700 | 1,400 |

5%만 보고 첫 시도에 맞히면 11,281점, 30%를 보고도 첫 시도에 맞히면 6,125점입니다. 60%를 보고 세 번 만에 맞히면 1,400점까지 내려갑니다. 같은 본 비율에서 시도가 한 번 늘 때마다 점수가 약 15%씩 줄어듭니다.

## 답을 판정하기

객관식은 정답 선택지와 비교하면 끝입니다. 주관식은 "빨간 자전거"라는 정답에 "자전거", "온실의 빨간 자전거"도 인정해야 하고, "자"나 "동물" 같은 답은 안 됩니다. 정규화한 문자열을 정답, 별칭, 필수 개념 묶음 순서로 비교합니다.

```js
if (input === normalize(scene.answer.canonical)) return "EXACT";
if (scene.answer.aliases.some((alias) => input === normalize(alias))) return "ACCEPTABLE";

if (input.length < 3) return "AMBIGUOUS";

const groups = scene.answer.requiredConceptGroups ?? [];
const matchedGroups = groups.filter((group) => group.some((concept) => containsConcept(input, concept))).length;
if (groups.length > 0 && matchedGroups === groups.length) return "ACCEPTABLE";
if (matchedGroups > 0 || optionalMatches > 0) return "PARTIAL";
```

정규화는 문장부호를 공백으로 바꾸고, 단어 끝의 조사(`은, 는, 이, 가, 을, 를, 의, 에서 ...`)를 떼고, 몇 가지 동의어(`강아지 → 개`)와 어미(`타고 있는 → 타다`)를 통일합니다. 정답과 입력 양쪽에 같은 정규화를 적용하므로 서로 어긋나지 않습니다. 다만 "고양이"처럼 끝 글자가 조사와 같은 낱말은 정규화에서 글자가 잘려 나갈 수 있습니다. 양쪽이 똑같이 잘려서 동등성 비교는 유지되지만, 개념 포함 검사에서는 의도하지 않은 일치가 생길 여지가 있습니다.

### 짧은 답을 둘러싼 두 번의 수정

세 글자 미만 입력을 모호한 답으로 막는 규칙은 두 번에 걸쳐 고쳤습니다. 처음에는 짧은 부분 문자열로 개념 묶음에 걸려서 정답 처리되는 것을 막으려고 두 글자 이하를 전부 막았습니다. 그런데 실제 정답이 "개"나 "AI"처럼 한두 글자일 수 있었습니다. 지금은 정답이나 별칭이 그 짧은 글자와 정확히 같을 때만 통과시킵니다.

```js
const shortAnswerScene = { ...scene, answer: { canonical: "개", aliases: [] } };
assert.equal(judgeAnswer(shortAnswerScene, "개"), "EXACT");
assert.equal(judgeAnswer(shortAnswerScene, "고"), "AMBIGUOUS");
```

제출 문서에는 이 과정이 "AI 코딩 도구(Codex)가 전부 막는 수정을 했고, 짧은 정답이 필요하다는 점을 제가 지적해 다시 고쳤다"로 남아 있습니다.

## 해커톤 때 내린 결정들

제출용으로 정리한 문서에 "받아들인 것"과 "뺀 것"이 남아 있습니다. 그중 이 게임의 모양을 정한 것들입니다.

- **정해진 경로를 만들지 않았습니다.** 단서를 순서대로 찾게 하는 방식도 제안됐지만, 플레이어가 스스로 가설을 세우는 게임에서 이동 순서를 정해 주면 정답 방향을 알려 주는 셈이었습니다. 시야 크기와 속도만 제한하고 자유롭게 움직이게 했습니다.
- **Memory Trail을 넣었다가 뺐습니다.** 지나온 경로를 다시 보여 주는 기능이었는데, 실제로 해 보니 규칙과 화면 요소가 늘어서 "관찰하고 맞힌다"는 핵심보다 설명이 앞섰습니다. 힌트, 기억 보기, 경로 재생과 관련 점수를 모두 지웠습니다. 9개 파일에서 591줄이 빠졌습니다.
- **가상 조이스틱을 직접 끌기로 바꿨습니다.** 데스크톱에서 조이스틱 표시가 시야를 가렸습니다. 마우스와 손가락이 움직인 만큼 원이 움직이게 하고, 키보드와 방향 버튼은 보조로 남겼습니다.
- **사용자가 올린 이미지는 서버에 저장하지 않기로 했습니다.** 친구의 사진이 게임이 끝난 뒤에도 서버에 남을 수 있기 때문입니다. 시스템 문제만 R2에 두고, 사용자 이미지는 방장의 브라우저에서 P2P로 전달합니다.

이 결정들은 AI 코딩 도구와 협업하면서 제안된 것 중에서 "실제로 해 보고" 고른 것들입니다.

## Direct Play로 옮기면서 바뀐 것

독립 앱에서는 Cloudflare Durable Object가 방을 관리하고 서버가 답을 판정하고 점수를 계산했습니다. Direct Play에는 이미 방과 자원 전달 체계가 있어서 게임 부분만 옮겼습니다.

| | 독립 앱 | Direct Play 모듈 |
|---|---|---|
| 방과 결과 | 자체 Durable Object | Direct Play의 방 |
| 판정과 점수 | 서버 | 브라우저 (`rulesVersion: pinhole-client-v1`) |
| 문제 이미지 | 시스템 문제는 R2, 사용자 이미지는 P2P | 방장만 R2에서 읽고 참가자에게 P2P로 전달 |
| 문제 수 | 여러 문제를 이어서 | 방 하나에 문제 하나 |

옮긴 방식도 정해 두었습니다.

- 게임 코드는 독립 앱에서 필요한 파일(렌더러, 이동, 탐색량, 판정, 점수)만 `game-src/pinhole/`에 복사합니다. 원본 폴더를 가리키는 경로나 패키지 의존은 두지 않았습니다. 원본이 사라져도 빌드되어야 하기 때문입니다.
- TypeScript는 esbuild로 `game.bundle.js`, `setup.bundle.js` 두 파일로 묶어 브라우저에서 바로 불러옵니다. 앱 전체를 새 번들러로 바꾸지 않았습니다.
- 문제 이미지 28개(28.51 MiB)는 R2에서 내려받아 저장소에 보관하고, 각 파일의 SHA-256을 `manifest.json`에 기록합니다. `npm run verify:pinhole-assets`가 이 해시를 확인합니다. 원본 R2 버킷이 사라지거나 바뀌어도 복구할 수 있게 하려는 것입니다.
- 런타임 코드는 R2에서 읽기만 합니다. 쓰기와 삭제 경로는 없습니다.
- 방장이 문제를 고르면 이미지와 메타를 한 번 읽어 자원으로 고정하고, 이후에는 R2를 다시 읽지 않습니다. R2에 일시적인 문제가 생겨도 이미 시작한 방은 영향을 받지 않습니다.
- 점수는 같은 설정(문제 버전, 시야 크기, 제한 시간)으로 푼 결과끼리만 비교합니다. `settingsKey`가 다른 결과는 서로 순위에 섞이지 않습니다.

### 한계

자원 안에 정답이 들어 있어서 참가자가 개발자 도구로 볼 수 있습니다. 독립 앱의 서버 판정과 같은 수준의 보안이 아닙니다. 점수는 친구들과 재미로 비교하는 용도입니다. 이 점은 게임 가이드와 계획서에도 그대로 적어 두었습니다.

문제 이미지의 출처와 이용 조건을 적은 문서가 원본 저장소에 없었습니다. 외부에 다시 배포해도 되는지는 확인하지 못했고, 그 사실을 `ATTRIBUTION.md`에 기록해 두었습니다. 제출 문서에는 문제 이미지를 이미지 생성 도구로 만들었다고 적혀 있습니다.

## 참고

- 사용자 이미지를 서버를 거치지 않고 전달하는 방법: [사진은 서버를 거치지 않는다](/notes/direct-play-p2p-game-assets/)
- 같은 독립 앱에서 옮겨 온 게임: [SUM DROP](/notes/direct-play-sum-drop-engine/)
- 게임 모듈 계약: [게임 모듈 구조](/notes/direct-play-game-module-registry/)
