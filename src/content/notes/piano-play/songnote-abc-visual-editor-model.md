---
title: "텍스트 악보를 마우스로 고치려면 — Songnote가 ABC를 문서 모델로 바꿔 편집하는 법"
description: "ABC는 손으로 쓰기엔 편하지만 음표를 클릭해서 고치기엔 불편한 텍스트입니다. Songnote의 시각 악보 편집기가 ABC를 구조화된 문서 모델로 바꿔 편집하고 다시 ABC로 되돌리는 방법, 실행 취소, 텍스트와 모델의 동기화 문제를 코드로 정리합니다."
pubDate: 2026-10-01
app: piano-play
tags: ["ABC Notation", "React", "abcjs", "Editor"]
---

[Songnote](https://piano-play.still-coding.cc/)는 ABC라는 텍스트 악보를 입력하면 오선보로 그려 주고 피아노로 연주해 주는 앱입니다. [이전 글](/notes/songnote-abc-notation-additive-synthesis/)에서는 ABC 문법과 소리 만드는 법을 다뤘습니다.

오선보에서 음표를 반음 올리거나 세 번째 마디 뒤에 음을 넣으려면, ABC 텍스트에서는 해당 글자 위치부터 찾아야 합니다. 음 길이를 잘못 쓰면 마디도 어긋납니다. Songnote의 시각 편집기는 클릭한 음표를 문서 모델의 이벤트에 연결해 고칩니다. 편집 결과는 다시 ABC로 내보냅니다.

## 클릭한 음표를 문서의 이벤트로 찾기

가장 단순한 방법은 마우스로 음표를 클릭하면 ABC 텍스트의 해당 글자를 찾아 문자열을 바꾸는 것입니다. 하지만 이 방법은 금방 막힙니다. 음을 하나 지우면 마디의 나머지 박이 어긋나고, 화음을 추가하려면 문자열 안에서 대괄호를 정확히 다뤄야 하며, 실행 취소는 문자열 조각 단위의 차이(diff)를 관리해야 합니다.

편집기는 ABC를 마디와 이벤트로 나누어 다룹니다. 시각 편집 명령을 실행할 때마다 문서를 ABC 텍스트로 되돌리고, 상위 화면에 초안 변경을 알립니다. 저장이나 재생 시점까지 변환을 미루는 구조는 아닙니다.

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
- 이벤트의 `id`로 선택한 음을 가리킵니다. 다른 이벤트를 끼워 넣어도 기존 이벤트의 id는 유지됩니다. ABC를 다시 파싱하면 새 id가 만들어지므로 선택도 초기화합니다.
- 음 길이(`duration`)는 온음표를 1로 한 분수 값입니다(4분음표는 1/4). ABC 텍스트에서는 기본 음 길이(`L:`)를 기준으로 한 접미사(`2`, `/2`, `3/2`)로 적기 때문에, 이 값을 그때그때 변환합니다.

## 음 길이를 ABC 접미사로 되돌리기

`frac`는 분자와 분모를 최대공약수로 약분합니다. 기본 음 길이를 읽을 때 이 함수를 쓰지만, 이벤트의 `duration`과 `onset`은 `fracValue`로 변환한 숫자입니다. 모든 계산을 분수로 유지하는 구현은 아닙니다. 3잇단음표처럼 이진 부동소수점으로 정확히 표현되지 않는 길이가 있고, 비교에는 `1e-6`의 허용 오차를 둡니다.

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

## 문서를 복제해 실행 취소 기록 남기기

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

실행 취소 기록에는 문서 전체의 복제본이 들어갑니다. 이전 문서를 꺼내면 되므로 명령별 반대 동작을 작성할 필요는 없습니다. 문서가 커지면 복제 비용과 기록의 메모리 사용량도 늘어납니다. 이 코드만으로 긴 곡에서의 반응 속도를 판단할 수는 없습니다.

## 텍스트 입력과 시각 편집이 만나는 시점

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
- 전체 ABC 텍스트 칸의 `onChange`도 `lastLocal`을 갱신하므로, 입력 중에는 모델을 다시 파싱하지 않습니다. 초안 텍스트는 이때도 브라우저에 저장됩니다. `saveCurrentVersion`을 실행하면 텍스트를 파싱해 모델을 교체하고, 스튜디오 반영과 버전 저장을 함께 요청합니다. 초안 보관과 악보 반영은 서로 다른 시점입니다.

## 마디가 넘칠 때와 모자랄 때

마디의 박 수가 맞지 않으면 어떻게 할까요? 음을 하나씩 입력하는 도중에는 마디가 잠시 비어 있거나 넘치는 것이 당연합니다. 검증 함수는 상태를 두 단계로 나눕니다.

```js
if (total > doc.measureLength + 1e-6)      // 마디 길이를 넘음
  diagnostics.push({ level: 'error', code: 'diag.over', /* ... */ });
else if (total > 0 && total < doc.measureLength - 1e-6)   // 부족함
  diagnostics.push({ level: 'warning', code: 'diag.under', /* ... */ });
```

- 넘치는 것은 **오류**로 보이고, 부족한 것은 **경고**로만 알려 줍니다. 입력 중인 악보를 오류로 막지 않기 위해서입니다.
- 비어 있는 자리는 저장되는 쉼표(`z`)와 구별해서 **자리 표시 쉼표(`x`)**로 다룹니다. 아직 아무것도 입력하지 않은 칸이 "쉼표를 쓴 것"으로 오해되지 않게 하려는 것입니다.

## 렌더링된 음표와 소스 위치 잇기

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

## 브라우저에 남는 초안과 버전

- 편집 초안은 곡별로 브라우저에 저장됩니다(`songnote-drafts`).
- 의미 있는 시점마다 **버전**을 남깁니다(`songnote-versions`). 곡마다 버전 목록이 있고, 이전 버전으로 되돌릴 수 있습니다.
- 브라우저 저장 공간이 가득 차 저장에 실패하면 조용히 넘어가지 않고 안내 문구를 보여 줍니다(`notice.versionSpace` 등).
- `main.jsx`는 `window.location.search`가 비어 있지 않으면 `noindex,follow` 메타 태그를 설정합니다. `?piece=…`뿐 아니라 어떤 쿼리 문자열이든 이 조건에 해당합니다. 클라이언트의 effect에서 적용하므로, 초기 HTML에 서버가 넣는 지시와는 적용 시점이 다릅니다.

이 편집기에서 시각 명령은 문서 모델을 바꾸고, 텍스트 입력은 초안을 먼저 바꿉니다. 버전 저장 시점에 두 표현이 다시 맞춰집니다. 실행 취소 기록은 그 모델 안에서 유지되며, 외부 텍스트를 다시 읽을 때 초기화됩니다.
