---
title: "텍스트 악보를 마우스로 고치려면 — Songnote가 ABC를 문서 모델로 바꿔 편집하는 법"
description: "ABC는 손으로 쓰기엔 편하지만 음표를 클릭해서 고치기엔 불편한 텍스트입니다. Songnote의 시각 악보 편집기가 ABC를 구조화된 문서 모델로 바꿔 편집하고 다시 ABC로 되돌리는 방법, 실행 취소, 텍스트와 모델의 동기화 문제를 코드로 정리합니다."
pubDate: 2026-10-01
app: piano-play
tags: ["ABC Notation", "React", "abcjs", "Editor"]
draft: true
---

<!-- TODO(사용자): 초안입니다. TODO 주석을 채우고 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

[Songnote](https://piano-play.still-coding.cc/)는 ABC라는 텍스트 악보를 입력하면 오선보로 그려 주고 피아노로 연주해 주는 앱입니다. [이전 글](/notes/songnote-abc-notation-additive-synthesis/)에서는 ABC 문법과 소리 만드는 법을 다뤘습니다.

ABC는 텍스트라서 악보를 **쓰기**에는 편합니다. 하지만 이미 그려진 악보에서 "이 음을 반음 올리고 싶다"거나 "세 번째 마디 뒤에 음표를 하나 넣고 싶다"면 어떨까요? 글자 위치를 찾아 직접 고쳐야 하고, 음 길이를 잘못 쓰면 마디가 어긋납니다. 그래서 오선보에서 음표를 직접 고르고 고칠 수 있는 **시각 악보 편집기**를 만들었습니다. 이 글은 그 편집기의 뼈대인 "문서 모델"에 대한 이야기입니다.

<!-- TODO(사용자): 시각 편집기를 만든 이유. (ABC를 모르는 사람을 위해? 스스로 불편해서?) 화면 캡처를 넣을 위치입니다. -->

## 1. 텍스트를 직접 고치지 않는다

가장 단순한 방법은 마우스로 음표를 클릭하면 ABC 텍스트의 해당 글자를 찾아 문자열을 바꾸는 것입니다. 하지만 이 방법은 금방 막힙니다. 음을 하나 지우면 마디의 나머지 박이 어긋나고, 화음을 추가하려면 문자열 안에서 대괄호를 정확히 다뤄야 하며, 실행 취소는 문자열 조각 단위의 차이(diff)를 관리해야 합니다.

그래서 편집기는 ABC를 **구조화된 문서**로 바꾸어 다루고, 화면에 보이는 편집은 그 문서를 고치는 일로 만들었습니다. 저장하거나 재생할 때만 다시 ABC 텍스트로 되돌립니다.

```text
ABC 텍스트  ──parseScore──▶  문서 모델  ──serializeScore──▶  ABC 텍스트
                              ▲    │
                        편집 명령   └── 오선보 렌더링, 재생, 검증
```

`src/editor/model.js`의 문서 모델은 대략 이런 모양입니다.

```js
{
  header:   { title, composer, meter: '4/4', unitLength: '1/4', tempo: 100, key: 'C' },
  voices:   [{ id: 'RH', clef: 'treble' }, { id: 'LH', clef: 'bass' }],
  measures: [
    { id, number: 1, eventsByVoice: {
        RH: [{ id, kind: 'note' | 'chord' | 'rest', onset, duration, pitches, tieStart, articulations }],
        LH: [ /* ... */ ]
    } }
  ]
}
```

- 악보는 **마디**의 목록이고, 각 마디는 성부(손)별 **이벤트**(음표, 화음, 쉼표)를 갖습니다.
- 모든 이벤트에 **고유 id**가 있어서, "선택한 음"을 텍스트 위치가 아니라 id로 가리킵니다. 음을 지우거나 끼워 넣어도 선택이 어긋나지 않습니다.
- 음 길이(`duration`)는 온음표를 1로 한 분수 값입니다(4분음표는 1/4). ABC 텍스트에서는 기본 음 길이(`L:`)를 기준으로 한 접미사(`2`, `/2`, `3/2`)로 적기 때문에, 이 값을 그때그때 변환합니다.

<!-- TODO(사용자): 처음에는 텍스트를 직접 고치는 방식을 시도했는지, 처음부터 모델 방식으로 갔는지. 시도했다면 어디서 막혔는지 알려 주세요. -->

## 2. 음 길이는 분수로 계산하고, 되돌릴 때 정확하게

음표의 길이는 부동소수점 오차가 생기기 쉬운 곳입니다. 3/2박(점4분음표)이나 3잇단음표는 소수로 나타내면 정확히 떨어지지 않습니다. 그래서 길이를 계산할 때는 분수를 쓰는 보조 함수(`frac`, 최대공약수로 약분)를 두었고, 비교에는 `1e-6`의 여유를 둡니다.

ABC 텍스트로 되돌릴 때는 길이를 ABC의 접미사로 바꾸는 함수가 분모를 1부터 16까지 시도해서 딱 떨어지는 분수를 찾습니다.

```js
const durationSuffix = (duration, unit) => {
  const ratio = duration / fracValue(unit);
  if (Math.abs(ratio - 1) < 1e-6) return '';
  // ABC accepts a numerator/denominator suffix. Keep compound values such
  // as 3/2 exact; emitting /1 changes how renderers interpret the duration.
  for (let denominator = 1; denominator <= 16; denominator += 1) {
    const numerator = Math.round(ratio * denominator);
    if (Math.abs(ratio - numerator / denominator) > 1e-6) continue;
    if (denominator === 1) return String(numerator);
    if (numerator === 1) return `/${denominator}`;
    return `${numerator}/${denominator}`;
  }
  // ...
};
```

코드의 주석이 이유를 밝혀 둡니다(번역). "3/2 같은 복합 값은 정확히 유지한다. `/1`을 내보내면 렌더러가 길이를 다르게 해석한다."

## 3. 편집은 "복제 → 수정 → 기록"

편집 하나하나는 `commit`이라는 함수를 거칩니다.

```js
const commit = updater => {
  const before = cloneDocument(doc);      // 지금 상태를 통째로 복제해 기록
  const next = cloneDocument(doc);
  updater(next);                          // 복제본에만 수정을 적용
  next.revision += 1;
  setHistory(h => [...h.slice(-49), before]);   // 실행 취소 기록 (최대 50단계)
  setFuture([]);                                // 새 편집을 하면 '다시 실행'은 비운다
  setDoc(next);
  const text = serializeScore(next);
  lastLocal.current = text;
  onDraftChange?.(text);                  // ABC 텍스트로 되돌려 초안으로 저장
};
```

문서 전체를 복제해 기록하는 방식은 메모리를 더 쓰지만, 곡 하나는 작아서 감당할 만하다고 봤습니다. 대신 **실행 취소가 아주 단순**해집니다. 이전 문서를 되돌리기만 하면 되고, "이 명령의 반대 동작"을 명령마다 만들 필요가 없습니다.

<!-- TODO(사용자): 문서 전체 복제 방식을 고른 이유와, 긴 곡에서 성능 문제가 없었는지(가장 큰 곡의 마디 수와 편집 반응 속도). -->

## 4. 텍스트와 모델이 서로를 덮어쓰지 않게

이 편집기에는 같은 곡을 나타내는 표현이 두 개입니다. 사용자가 ABC 텍스트를 직접 고치는 칸과, 시각 편집기의 문서 모델입니다. 한쪽이 바뀔 때마다 다른 쪽을 갱신하면 서로를 덮어쓰는 **무한 루프**가 생기기 쉽습니다. 그래서 편집기가 마지막으로 스스로 만든 텍스트를 기억해 둡니다.

```js
// 밖에서 온 텍스트가 내가 방금 만든 것과 다를 때만 다시 읽는다
useEffect(() => {
  if (source !== lastLocal.current) {
    const next = parseScore(source);
    setDoc(next);
    setSelected(null); setHistory([]); setFuture([]);   // 곡이 바뀌었으니 실행 취소도 초기화
    lastLocal.current = source;
  }
}, [source]);
```

- 편집기 안에서 생긴 변경은 `lastLocal`에 기록되므로, 텍스트가 돌아와도 다시 읽지 않습니다.
- 다른 곡을 열거나 저장된 버전을 되살리는 것처럼 **바깥에서 텍스트가 바뀐 경우**에만 모델을 새로 만들고 실행 취소 기록을 비웁니다.
- 텍스트 칸에서 직접 입력하는 동안에는 모델을 다시 만들지 않습니다. 아직 완성되지 않은 ABC를 억지로 해석하다 편집 중인 내용을 잃지 않기 위해서입니다. 사용자가 명시적으로 **저장**을 눌렀을 때 그 텍스트를 파싱해 모델에 반영합니다.

## 5. 편집 중인 악보는 틀려도 된다

마디의 박 수가 맞지 않으면 어떻게 할까요? 음을 하나씩 입력하는 도중에는 마디가 잠시 비어 있거나 넘치는 것이 당연합니다. 검증 함수는 상태를 두 단계로 나눕니다.

```js
if (total > doc.measureLength + 1e-6)      // 마디 길이를 넘음
  diagnostics.push({ level: 'error', code: 'diag.over', /* ... */ });
else if (total > 0 && total < doc.measureLength - 1e-6)   // 부족함
  diagnostics.push({ level: 'warning', code: 'diag.under', /* ... */ });
```

- 넘치는 것은 **오류**로 보이고, 부족한 것은 **경고**로만 알려 줍니다. 입력 중인 악보를 오류로 막지 않기 위해서입니다.
- 비어 있는 자리는 저장되는 쉼표(`z`)와 구별해서 **자리 표시 쉼표(`x`)**로 다룹니다. 아직 아무것도 입력하지 않은 칸이 "쉼표를 쓴 것"으로 오해되지 않게 하려는 것입니다.

## 6. 화면의 음표와 소스 위치를 잇는 방법

문서 모델은 악보를 **그리지는** 않습니다. 오선보 그림은 abcjs 라이브러리가 ABC 텍스트로부터 그립니다. 그렇다면 재생 중인 음표를 강조하거나, 클릭한 음표가 무엇인지 알려면 그림 속 요소와 소스를 이어야 합니다. abcjs는 렌더링된 각 요소가 소스 텍스트의 어느 위치(`startChar`)에서 왔는지를 알려 줍니다.

```js
selectables.current = rendered[0]?.getSelectableArray?.() || [];
// ...
for (const item of selectables.current) {
  const start = item.absEl?.abcelem?.startChar;
  item.svgEl?.classList.toggle('is-sounding', chars.has(start));   // 지금 울리는 음표만 강조
}
```

재생용 음표 목록의 각 음이 자기 `startChar`를 가지고 있어서, 지금 재생 위치에 걸친 음들의 `startChar` 집합을 만들고, 같은 값을 가진 SVG 요소에 클래스를 붙입니다. 선택한 음표의 테두리는 abcjs가 붙여 주는 클래스(`abcjs-v{성부}`, `abcjs-m{마디}`)로 요소를 찾아 그립니다.

<!-- TODO(사용자): "클릭한 위치와 렌더링된 악보를 맞추는 것"(hit testing)에서 겪은 어려움. 개발 기록에 "fix: align note hit testing with rendered score" 커밋이 있습니다. 무엇이 어긋났고 어떻게 맞췄는지 알려 주세요. 이 글에서 가장 이야기가 있는 부분일 수 있습니다. -->

## 7. 저장과 복구

- 편집 초안은 곡별로 브라우저에 저장됩니다(`songnote-drafts`).
- 의미 있는 시점마다 **버전**을 남깁니다(`songnote-versions`). 곡마다 버전 목록이 있고, 이전 버전으로 되돌릴 수 있습니다.
- 브라우저 저장 공간이 가득 차 저장에 실패하면 조용히 넘어가지 않고 안내 문구를 보여 줍니다(`notice.versionSpace` 등).
- 스튜디오 주소에 쿼리 문자열(`?…`)이 붙어 있으면 `noindex,follow`를 넣어 검색 색인에서 제외합니다. 같은 화면이 주소만 달리해 여러 개로 색인되는 것을 막기 위한 것으로 보입니다.

## 정리

텍스트로 된 데이터를 그래픽으로 고치게 만들 때의 원칙은 **텍스트를 직접 고치지 않는 것**이었습니다. 텍스트를 구조화된 모델로 바꾸고, 모델만 고치고, 필요할 때 텍스트로 되돌립니다. 그 덕분에 실행 취소는 모델을 통째로 되돌리는 것으로 끝났고, 선택은 id로 안정적으로 유지됐습니다. 대신 두 표현이 공존하기 때문에 **누가 최신인가**를 정하는 규칙(`lastLocal`)이 필요했습니다.

<!-- TODO(사용자): 마지막에 "다시 만든다면" 한두 문장. 그리고 이 편집기에 대해 가장 자랑하고 싶은 부분. -->
