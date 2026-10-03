---
title: "iPad에서 짧은 획이 사라지고 시리가 뜬다 — 필기 캔버스의 입력 처리 보강"
description: "가나 공방의 개발 문서에 기록된 iPad·Apple Pencil의 짧은 획 유실과 현재 포인터 처리를 대조합니다. 시리 화면과 입력 중단이 겹친 기록, 캡처 제거와 window 추적, 기기에서 다시 확인할 항목을 설명합니다."
pubDate: 2026-10-01
app: kana-atelier
tags: ["Apple Pencil", "Pointer Events", "iPadOS", "Debugging"]
---

[가나 공방](https://study-hiragana.still-coding.com/)은 히라가나와 가타카나를 펜으로 크게 따라 쓰며 익히는 학습 앱입니다. 글자를 쓰는 화면이 이 앱의 중심이라, 쓴 획이 화면에 남지 않으면 앱이 성립하지 않습니다.

개발 문서 `reusable/ipad-pencil-short-stroke-siri-gesture.md`에는 iPad의 Chrome에서 Apple Pencil로 짧은 획을 연달아 그릴 때 입력이 사라졌다고 적혀 있습니다. 시리 요청 화면이 뜨는 순간과 입력 중단이 겹쳤다는 기록도 있습니다. 현재 코드에서 확인되는 것은 포인터 처리의 보강입니다. 시스템 내부에서 어떤 제스처가 실행됐는지와 수정 뒤 재현 빈도는 추가 확인이 필요합니다.

## 증상

| 현상 | 설명 |
| --- | --- |
| 둘째 획이 사라진다 | 한 획을 긋고 바로 다음 짧은 획이나 점을 찍으면, 약 3~5번에 한 번 그 획이 화면에 전혀 나타나지 않는다 |
| 긴 획은 괜찮다 | 한 번에 길게 이어 긋는 획은 문제없다 |
| 간격을 두면 줄어든다 | 획 사이에 1초 정도 쉬면 덜 나타난다 |
| 시리가 뜬다 | 짧은 입력을 반복하면 시리 요청 화면이 자주 나타나고, 그때 입력이 끊긴다 |
| PC에서는 안 된다 | 같은 코드가 마우스나 트랙패드로 쓸 때는 재현되지 않는다 |

위 빈도와 1초 간격은 개발 문서의 관찰값입니다. 자동 측정 결과가 아니며, iPad 모델과 iPadOS 버전도 이 문서에는 없습니다.

## 문서에 남은 원인 후보

개발 문서는 필기 캔버스(`InkCanvas`)의 상태 처리와 시스템 제스처를 함께 원인 후보로 적어 두었습니다. 다음 표는 그 후보와 문서가 기록한 한계입니다. 각 항목의 실험 로그를 재확인한 결과는 아닙니다.

| 가설 | 내용 | 문서에 적힌 판단 |
| --- | --- | --- |
| 활성 포인터 잠김 | `pointerup`이 오기 전에 다음 `pointerdown`이 오면 무시 | 고칠 가치는 있지만, 시리 화면이 뜨는 현상은 설명하지 못한다 |
| 같은 `pointerId` 재사용 | Apple Pencil이 획마다 같은 id를 쓰면 up과 다음 down의 순서가 꼬일 수 있다 | 실제로 대비해야 한다. 그러나 시리와는 별개의 축이다 |
| `setPointerCapture` 직후 `lostpointercapture` | iPad에서 캡처가 바로 풀려 획이 끊길 수 있다 | iPad 특화 문제일 수 있으나 시리와는 관계없다 |
| 손바닥 방지(palm guard) | 펜을 뗀 뒤 일정 시간 터치를 무시하면 연속 획을 삼킨다 | 제거해도 시리 문제는 남는다 |
| 포인터 다운 시 부모 `setState` | 연속 획 사이에 화면이 다시 그려지면서 리스너가 흔들린다 | 보조 요인 |

현재 코드에는 캡처를 쓰지 않는 처리, 획 중 `window` 추적, 새 `pointerdown`에서 이전 획을 닫는 처리가 들어 있습니다. 이 변경 사실만으로 각 가설이 실험에서 배제됐다고 말할 수는 없습니다. iPad에서만 드러나는 앱 버그도 가능하므로 PC에서 재현되지 않았다는 이유만으로 앱 원인을 제외하지 않습니다.

## 시리 화면과 입력 중단이 겹쳤다는 기록

문서는 짧고 빠른 Pencil 입력을 운영체제나 브라우저가 제스처로 처리했을 가능성을 원인으로 제시합니다. 근거는 긴 획에서는 문제가 적었다는 기록, 획 사이 간격을 두면 줄었다는 기록, 시리 UI가 뜨는 시점과 입력 중단이 겹쳤다는 기록입니다.

여기서 확인되지 않은 부분은 실제 이벤트 순서입니다. 실패한 순간에 `pointercancel`이 왔는지, 이동 이벤트가 누락됐는지, 포커스가 바뀌었는지에 대한 로그가 없습니다. 따라서 짧은 획이 시리를 호출했다고 단정하기보다 시스템 UI가 뜬 상황에서 웹 입력도 끊겼다는 관찰로 남겨 둡니다.

## 무엇을 했나

현재 구현은 필기 화면의 페이지 제스처를 줄이고, 획의 시작과 끝을 앱에서 놓치지 않도록 보강합니다.

### 필기 화면에서 브라우저 제스처를 끈다

```css
/* 필기 모드 전체 */
touch-action: none;
-webkit-touch-action: none;
```

개발 문서는 이전 값이 `touch-action: manipulation`이었다고 적습니다. 현재 필기 화면의 `none`은 페이지의 기본 터치 동작을 억제하기 위한 설정입니다. 이 차이만으로 시리 호출 원인을 설명할 수는 없습니다.

### iOS 제스처 이벤트를 막는다

```ts
// InkCanvas.tsx — 핀치 등 페이지 제스처를 가능한 범위에서 차단
document.addEventListener("gesturestart", preventGesture, { passive: false, capture: true });
document.addEventListener("gesturechange", preventGesture, { passive: false, capture: true });
document.addEventListener("gestureend", preventGesture, { passive: false, capture: true });
```

`touchstart`와 `touchmove`에서도 `preventDefault()`를 호출합니다. WebKit이 터치 경로로 제스처를 먼저 판별하는 경우를 줄이기 위해서입니다.

### 포인터 처리를 견고하게 만든다

```ts
// setPointerCapture / lostpointercapture 를 쓰지 않음
// 획 중에는 window 에 pointermove / pointerup / pointercancel 을 건다
// 같은 pointerId 로 다시 down 이 오면 이전 획을 닫고 새 획으로 처리한다
const beginStroke = (event: PointerEvent) => {
  if (activePointerRef.current !== null) {
    finishStroke(activePointerRef.current, activePointerTypeRef.current);
  }
  activePointerRef.current = event.pointerId;
  // ...
};
```

- 획 중에는 캔버스가 아니라 `window`에서 이벤트를 받아서, 빠른 업/다운이나 캔버스 밖으로 벗어난 입력에도 종료를 놓치지 않습니다.
- 부모 컴포넌트의 상태 변경(`onInkStart`)은 **획이 끝난 뒤 다음 프레임**에 호출합니다. 첫 획이 진행되는 동안 부모의 상태 갱신이 끼어드는 것을 줄이려는 처리입니다. 프레임 예약이 이후의 모든 리렌더를 막는 것은 아닙니다.

```ts
window.requestAnimationFrame(() => {
  onInkStartRef.current?.();
});
```

## 코드 변경과 기기 확인은 별개다

개발 문서는 웹의 이벤트 취소로 네이티브 시리 진입을 완전히 차단한다고 보장할 수 없다고 적습니다. 비교 항목으로 시리 및 검색, Apple Pencil의 단축, 손글씨 변환 설정을 제시합니다. 이는 문서의 QA 안내입니다. 실제 앱 화면에 안내가 있는지와 수정 뒤 획 유실이 얼마나 줄었는지는 아직 확인하지 않았습니다.

## 다음에 비슷한 증상이 나면

이 프로젝트에서 정리해 둔 진단 순서입니다.

1. **PC에서 재현되는가?** 된다면 앱의 포인터 상태와 리렌더를 먼저 본다. 안 된다면 태블릿·모바일의 운영체제 제스처를 후보에 둔다.
2. **긴 획은 되고 짧은 획만 실패하는가?** 시스템이 탭이나 제스처로 오인하는 것이 강력한 후보다.
3. **실패한 순간에 시스템 UI(시리, 공유, 선택 메뉴)가 뜨는가?** 그 시점의 포커스와 `pointercancel`을 기록해 입력 중단과의 관계를 확인한다. 시스템 UI가 없으면 캡처, 같은 `pointerId`, `setState` 타이밍, 캔버스 여러 개도 확인한다.
4. `touch-action`, `preventDefault`, `gesture*` 적용 여부를 확인한다.
5. 상태 변경이 `pointerdown` 직후에 있다면 획이 끝난 뒤로 옮긴다.
