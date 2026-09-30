---
title: "일본어 타자를 가르치는데 한글 입력기가 켜져 있다면 — 물리 키로 받는 입력 연습"
description: "가나 공방의 '가나 입력 공방'은 로마자로 일본어를 조립하는 규칙 7가지를 연습시킵니다. 사용자의 입력기가 한국어여도 깨지지 않게 event.code로 키를 받고 조합 이벤트를 막은 방법, 그리고 가르칠 규칙을 고른 기준을 코드로 정리합니다."
pubDate: 2026-10-03
app: kana-atelier
tags: ["IME", "Keyboard Events", "React", "Education"]
draft: true
---

<!-- TODO(사용자): 초안입니다. TODO 주석을 채우고 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

히라가나 46자를 외웠다고 일본어를 **칠 수** 있는 것은 아닙니다. 실제로 일본어를 입력하려면 로마자로 소리를 치고, 몇 가지 예외를 손에 익혀야 합니다. 가나 공방에는 이를 연습하는 화면 **가나 입력 공방**이 있습니다(2026년 9월 3일 추가).

이 화면을 만들 때 부딪힌 문제는 학습 내용보다 **입력 처리**였습니다. 일본어를 배우러 온 한국어 사용자의 키보드는 대부분 **한글 입력기가 켜진 상태**이기 때문입니다.

<!-- TODO(사용자): 이 화면을 만든 계기(일본어를 직접 입력해 보다가 막혔던 경험?)를 한두 문장. -->

## 1. 무엇을 가르치나: 헷갈리는 입력 7가지

로마자 입력 전체를 가르치지 않습니다. 소리대로 치면 되는 대부분은 그냥 두고, **소리와 철자가 어긋나거나 규칙이 필요한 일곱 경우**만 골랐습니다.

| 단계 | 주제 | 예시 | 키 입력 | 규칙 |
| --- | --- | --- | --- | --- |
| 01 | 기본 조립 | にほんご | `nihongo` | 뒤에 자음이 오면 `n` 하나로 ん이 확정된다 |
| 02 | 조사 | わたしは | `watashiha` | 조사 '와'는 `wa`가 아니라 `ha` → は |
| 03 | 작은 글자 | きょう | `kyou` | き + 작은 よ는 `kyo`로 묶는다 |
| 04 | 작은 っ | がっこう | `gakkou` | 다음 자음을 겹친다(`kk`) |
| 05 | 닮은 소리 | はなぢ | `hanadi` | じ는 `ji`, ぢ는 `di` |
| 06 | 가타카나 장음 | コーヒー | `ko-hi-` | ー는 하이픈 키 |
| 07 | 반복 부호 | 々 | `onaji` + Space | 이름을 입력하고 변환 후보에서 고른다 |

각 단계는 정답 키 배열을 "조각"(`segments`)으로 쪼개 둡니다. `ni → に`, `ho → ほ`, `n → ん`처럼 어느 키가 어느 글자가 되는지 보여 주려는 것입니다.

```ts
segments: [
  { keys: "ga", kana: "が" }, { keys: "k", kana: "っ" }, { keys: "ko", kana: "こ" }, { keys: "u", kana: "う" },
],
```

한 가지 밝혀 둡니다. 이 연습은 **진짜 일본어 입력기를 흉내 내는 범용 변환기가 아닙니다.** 단계마다 정해 둔 정답과 조각 표로 "지금까지 친 키가 어떤 글자가 되는지"를 보여 줄 뿐입니다. 아무 문장이나 넣어도 변환해 주지는 않습니다. 가르치려는 규칙에 집중하려고 범위를 좁혔습니다.

<!-- TODO(사용자): 범용 변환기를 만들지 않고 고정 표로 한 이유(범위? 복잡도?)와, 7가지를 고른 기준을 본인의 말로. -->

## 2. 문제: 한글 입력기가 켜져 있다

일본어 타자를 연습하는 웹 화면인데, 사용자가 `k`를 누르면 한글 입력기 때문에 `ㅏ`가 입력될 수 있습니다. `<input>`에 그대로 받으면 두 가지가 깨집니다.

- 입력된 글자가 영문이 아니라 한글 자모라서 정답과 비교할 수 없다.
- 브라우저가 글자를 **조합 중**(composition) 상태로 잡고 있어서 `keydown`, `input` 이벤트의 값이 예측과 다르게 온다.

이 화면의 첫 버전(`ebe506e`)을 만든 다음 날, 커밋 `84ca3c8`이 "**입력기와 포커스에 상관없이** 키를 받는다"로 고쳤습니다.

## 3. 해법: 글자가 아니라 물리 키를 본다

핵심은 키 이벤트의 `key`(입력된 글자)가 아니라 `code`(**눌린 물리 키의 위치**)를 쓰는 것입니다. 한글 입력기가 켜져 있어도 `KeyK`는 K 위치의 키입니다.

```ts
function keyFromCode(code: string) {
  if (code === "Space") return " ";
  if (code === "Minus" || code === "NumpadSubtract") return "-";
  const letter = /^Key([A-Z])$/.exec(code);
  return letter ? letter[1].toLowerCase() : null;
}
```

그리고 이벤트를 **가장 먼저 잡습니다.** `window`에 `keydown`을 **캡처 단계**(`true`)로 걸고, 우리가 처리할 키는 `preventDefault`로 브라우저와 입력기가 손대지 못하게 막습니다.

```ts
const onKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;   // 단축키는 건드리지 않는다
  ...
  const key = keyFromCode(event.code);
  if (key == null) return;
  event.preventDefault();
  event.stopPropagation();
  setValue((current) => `${current}${key}`.slice(0, lesson.romaji.length));
};

window.addEventListener("keydown", onKeyDown, true);
```

조합 이벤트도 막습니다. 입력기가 조합을 시작하면 `compositionstart`, `compositionupdate`, `compositionend`가 오는데, 세 이벤트를 모두 캡처 단계에서 취소합니다.

```ts
const onComposition = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};
window.addEventListener("compositionstart", onComposition, true);
window.addEventListener("compositionupdate", onComposition, true);
window.addEventListener("compositionend", onComposition, true);
```

<!-- TODO(사용자): 실제로 어떤 환경(한글 입력기 켠 Windows? 맥? iPad 키보드?)에서 어떤 문제가 있었는지, 그리고 이 방식이 잘 동작하는 것을 확인한 환경. 조합 이벤트 취소가 모든 브라우저에서 효과가 있는지는 제가 검증하지 못했습니다. -->

## 4. 입력창은 읽기 전용이다

입력 필드는 화면에 있지만 `readOnly`입니다. 값은 키 이벤트로 상태에서 만들고, 필드는 **포커스를 받는 자리이자 접근성 이름표**로만 씁니다.

```tsx
<input
  ref={inputRef} value={value} readOnly
  lang="en" inputMode="none"
  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
/>
```

- `inputMode="none"`으로 모바일에서 화면 키보드가 저절로 올라오지 않게 합니다. 대신 화면에 **연습용 영문 키보드**를 그려서, 터치 기기에서도 눌러서 연습합니다.
- 화면의 버튼들은 `onMouseDown`에서 `preventDefault()`를 불러 **포커스를 훔치지 못하게** 합니다. 버튼을 눌러도 입력창의 포커스가 유지되어 그다음 키가 계속 들어갑니다(`keepButtonFocus`).

## 5. 틀린 키를 어떻게 알려 주나

정답 문자열의 **접두사**인지만 확인합니다.

```ts
const isCorrectPrefix = lesson.romaji.startsWith(value);
const isDone = value === lesson.romaji;
const nextKey = isCorrectPrefix ? lesson.romaji[value.length] : undefined;
```

틀리면 "키가 달라요. `k` 대신 `j` 키를 눌렀어요. Backspace로 돌아가세요."라고 어느 자리가 어떻게 다른지 알려 주고, 맞는 동안에는 "다음 키"를 강조해서 화면의 키보드에 표시합니다. 정답이 될 때까지는 다음 단계로 못 넘어가고, 완성하면 `Enter`로 넘어갑니다.

여기서 눈여겨볼 점이 있습니다. 조각 표로 지금까지 완성된 글자를 계산해서 아래에 실시간으로 보여 줍니다(`completedKana`). `g`, `a`를 누르면 `が`, 이어서 `k`를 누르면 `が っ`가 되는 식입니다. **키 하나가 글자로 바뀌는 순간**을 눈으로 보는 것이 이 연습의 재미입니다.

## 6. 이벤트 핸들러가 옛 상태를 보지 않게

작은 함정이 하나 있었습니다. 키 이벤트를 `window`에 한 번만 등록하기 때문에(`useEffect(..., [])`), 핸들러 안에서 `lesson`이나 `value`를 그대로 쓰면 **처음 렌더링의 값**을 계속 봅니다. 그래서 최신 상태를 `ref`에 매번 복사해 두고 핸들러는 `ref`를 읽습니다.

```ts
const sessionRef = useRef({ lesson, value, isDone, lessonIndex });
sessionRef.current = { lesson, value, isDone, lessonIndex };   // 매 렌더링마다 최신으로
```

리스너를 상태가 바뀔 때마다 다시 다는 방법도 있지만, 캡처 단계에서 키를 놓치는 틈이 생길 수 있어서 한 번만 등록하고 `ref`로 읽는 쪽을 택한 것으로 보입니다.

<!-- TODO(사용자): 이 방식을 택한 실제 이유(리스너 재등록 문제가 있었는지 등)를 확인해 주세요. 위 문장은 코드 구조에서 제가 추정한 것입니다. -->

## 7. 입력이 막힐 때 안내

앱 안에서만 해결할 수 없는 것도 있습니다. 실제 일본어 입력기를 쓰려면 운영체제에서 입력 방식을 바꿔야 합니다. 화면 아래에 세 가지를 짧게 안내합니다.

- **영문만 써질 때**: `Alt` + `~`로 반각 영문(A)을 히라가나(あ)로 전환
- **한자로 바꿀 때**: 히라가나 입력 뒤 `Space`로 후보를 고르고 `Enter`로 확정
- **가타카나가 필요할 때**: 읽기를 입력하고 `F7`

옆에는 Windows에서 언어를 바꾸는 단축키(`Win` + `Space`)도 적어 두었습니다. 이 연습은 실제 입력기를 대신하지 않고 **실제 입력기 앞에서 손을 풀어 주는** 역할입니다.

## 8. 한계

- **Windows 기준 안내입니다.** 단축키 안내가 Windows 위주입니다. 맥이나 모바일 사용자에게는 다르게 적용됩니다.
- **키 배열에 의존합니다.** `event.code`는 물리 위치라서 Dvorak 같은 배열에서는 사용자가 누르는 글자와 다르게 해석될 수 있습니다.
- **정해진 7문제입니다.** 사용자가 원하는 단어를 입력해 볼 수는 없습니다.

<!-- TODO(사용자): 실제 사용자 반응이나 테스터 피드백이 있다면 한 줄. -->

## 정리

일본어 타자를 가르치는 화면에서 진짜 어려운 부분은 일본어가 아니라 **사용자의 입력기를 이기는 것**이었습니다. 글자 대신 물리 키를 보고, 이벤트를 캡처 단계에서 먼저 잡고, 조합 이벤트를 막고, 입력창은 읽기 전용으로 둡니다. 그 위에서 가르칠 것은 규칙 일곱 가지로 좁혔습니다.

<!-- TODO(사용자): 마지막에 "다시 만든다면" 한두 문장. -->
