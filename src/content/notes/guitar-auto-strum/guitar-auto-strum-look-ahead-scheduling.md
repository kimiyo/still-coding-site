---
title: "박자가 흔들리지 않는 자동 반주 — 타이머는 흔들리고 오디오 시계는 흔들리지 않는다"
description: "브라우저의 setInterval로 음을 직접 울리면 박자가 흔들립니다. Guitar Auto-Strum이 오디오 시계 위에 음을 미리 예약하는 look-ahead 스케줄러로 박자를 지키고, 코드 변경과 마디 경계에서 생기는 문제를 다룬 방법을 코드로 정리합니다."
pubDate: 2026-10-01
app: guitar-auto-strum
tags: ["Web Audio", "JavaScript", "Scheduling", "Music"]
---

[Guitar Auto-Strum](https://guitar-play.still-coding.cc/)은 코드와 리듬, 템포를 고르고 Play를 누르면 기타가 자동으로 반주를 쳐 주는 웹 앱입니다. 반주 엔진은 각 스트로크에 오디오 시각을 붙여 미리 예약합니다.

브라우저에서 `setInterval` 콜백이 실행될 때마다 소리를 내면 메인 스레드의 지연이 박자에 반영됩니다. 이 앱은 타이머를 예약 작업을 깨우는 데 쓰고, 실제 재생 시각은 Web Audio에 전달합니다.

## 왜 타이머로 직접 울리면 안 되나

`setInterval`이나 `setTimeout`은 "약 이 정도 뒤에 실행해 달라"는 요청일 뿐입니다. 브라우저가 다른 작업을 하고 있으면 몇 밀리초에서 수십 밀리초까지 늦게 실행됩니다. 사람의 귀는 음악의 박에서 이런 어긋남을 민감하게 알아챕니다. 게다가 매번 "이전 실행 시각 + 간격"으로 다음 시각을 정하면 늦어진 만큼이 누적됩니다.

반면 Web Audio의 `AudioContext.currentTime`은 오디오 하드웨어를 기준으로 흐르는 시계이고, 소리를 "이 시각에 내라"고 미리 예약할 수 있습니다. 그래서 오디오 앱의 표준적인 접근은 이렇습니다.

> 타이머는 부정확해도 좋다. 다만 자주 깨어나서, 가까운 미래의 소리를 오디오 시계에 미리 예약해 두기만 하면 된다.

## look-ahead 스케줄러

이 앱의 `transport.js`는 이렇게 동작합니다.

```js
const LOOKAHEAD_SEC = 0.25;     // 0.25초 앞까지 미리 예약
export const SCHEDULE_HZ = 40;  // 1초에 40번 깨어난다 (25ms마다)

function startScheduler(gen) {
  clearTimer();
  tick(gen);
  timerId = window.setInterval(() => tick(gen), 1000 / SCHEDULE_HZ);
}
```

25ms마다 깨어나서, 지금부터 0.25초 안에 울려야 할 스트로크를 모두 찾아 정확한 오디오 시각을 붙여서 예약합니다. 깨어나는 시점이 조금 늦어도(수십 ms) 0.25초의 여유가 있으니 예약을 제때 전달할 수 있습니다. 메인 스레드가 예약 창보다 오래 멈추거나 오디오 장치 자체에 지연이 생기는 경우까지 보장하지는 않습니다.

각 스트로크의 시각은 인덱스로 계산한 절대 시각입니다. 타이머 콜백이 늦게 실행된 시간을 다음 박의 기준으로 쓰지 않습니다.

```js
/** Where a song position falls on the audio clock. */
function audioTimeOf(position) {
  return downbeat + shift + position;
}
// 스트로크의 위치(onset)는 인덱스에서 바로 계산 — 누적 오차가 없다
```

`schedule.js`의 머리말도 "absolute onsets (no cumulative drift)"라고 못 박아 두었습니다. 한 번 늦어져도 다음 스트로크는 그 늦음을 이어받지 않습니다.

카운트인도 같은 원리입니다. 시작 버튼을 누르면 3초 뒤를 첫 박(`downbeat`)으로 정하고, 카운트 클릭은 `downbeat - 남은 초`의 절대 시각에 예약합니다.

## 뒤처졌을 때: 밀린 것을 몰아서 치지 않는다

탭이 백그라운드로 가거나 기기가 잠깐 멈추면, 깨어났을 때 예약해야 할 스트로크가 이미 한참 지나 있을 수 있습니다. 이때 밀린 것을 한꺼번에 울리면 한 덩어리로 뭉개진 소리가 납니다. 그래서 0.25초 넘게 뒤처졌다면 밀린 스트로크를 건너뛰고 현재로 점프합니다.

```js
const MAX_CATCH_UP_SEC = 0.25;
// ...
if (t - nextOnset > MAX_CATCH_UP_SEC) {
  // Too far behind to play the backlog — skip to the present instead.
  strumIndex = skipToNow({ rhythm: modeRhythm, bpm, fromIndex: strumIndex, elapsed: t, resets, segments });
  return;
}
```

## 미리 예약했기 때문에 생기는 문제들

look-ahead는 박자를 지켜 주지만 대가가 있습니다. 소리가 이미 미래에 예약되어 있다는 사실이 다른 기능과 부딪힙니다. 이 앱에서 부딪힌 것들은 이렇습니다.

### 지금 선택된 코드가 아니라 그 스트로크의 코드로

노래 모드에서는 마디마다 코드가 바뀝니다. 그런데 예약은 0.25초 앞을 미리 하므로, 지금 예약하는 스트로크가 다음 마디의 것일 수 있습니다. 이때 "현재 선택된 코드"로 소리를 만들면 마디 경계가 0.25초씩 번집니다. 그래서 코드를 스트로크 자신의 위치로 찾습니다.

```js
function chordForOnset(onset) {
  return deps.getChordAt?.(onset) ?? deps.getMusic().chord;
}
```

### 코드를 바꾸면 이미 예약된 소리를 지운다

라이브 모드에서 사용자가 코드를 바꾸면, 이미 예약된 0.25초 분량은 옛 코드로 울리게 됩니다. 그래서 `rechord()`가 아직 들리지 않은 예약을 취소하고, 아직 울리지 않은 첫 스트로크까지 되감아서 새 코드로 다시 예약합니다.

```js
rechord() {
  const cancelled = deps.synth.cancelPending(ctx.currentTime);
  if (!cancelled) return 0;
  // Rewind to the first stroke that has not sounded yet ...
  strumIndex = rewindToUnplayed({ /* ... */ });
  tick(generation);
  return cancelled;
}
```

### "이번 마디까지만"은 경계에서 예약을 멈춘다

반복이나 정지를 "이번 마디를 끝낸 뒤"로 예약하면, 예약 창(0.25초)이 다음 마디까지 걸칠 수 있습니다. 그러면 마디가 끝나기도 전에 다음 마디의 소리가 미리 잡혀 버립니다. 그래서 대기 중인 큐가 있으면 예약 창을 그 경계에서 잘라냅니다.

```js
const horizon = cue == null
  ? t + LOOKAHEAD_SEC
  : Math.min(t + LOOKAHEAD_SEC, cue.at - BOUNDARY_EPSILON);
```

### 부동소수점 오차와 반복의 첫 박

마디 경계는 두 가지 계산 경로(틱을 세는 경로와 마디 길이를 더하는 경로)로 얻어지는데, 두 값이 부동소수점 오차로 아주 조금 어긋납니다. `transport.js` 주석은 이 오차 때문에 마디의 첫 스트로크가 이전 마디 쪽으로 분류될 수 있다고 설명합니다. 현재 코드는 경계 비교에 `1e-6`초의 여유(`BOUNDARY_EPSILON`)를 둡니다. 실제 기기에서 발생한 경험인지는 아래 TODO에서 확인할 항목입니다.

## 스윙과 사람 같은 어긋남은 예약 창 안에서

스윙(뒷박을 늦춤)과 휴머나이즈(박을 조금 흔듦)는 스트로크의 시각을 일부러 바꿉니다. 예약 창(0.25초) 밖으로 스트로크가 밀려나면 놓칠 수 있으므로, 코드의 주석이 이유를 밝혀 둡니다(번역).

> 스윙은 항상 늦추기만 하므로 스트로크가 창 밖으로 미끄러지지 않는다. 휴머나이즈는 0.25초의 예약 창에 비해 몇 ms만 당긴다.

그래서 스트로크는 적어 둔 시각으로 먼저 모으고, 그 결과에 스윙·휴머나이즈를 적용합니다.

## 예약 취소와 백그라운드 타이머의 범위

- 예약 취소는 "아직 들리지 않은 것"에 한한다. `cancelPending(ctx.currentTime)`은 현재 시각 이후로 예약된 소리만 지웁니다. 코드를 바꾸는 순간 이미 울리기 시작한 소리는 그대로 이어집니다.
- look-ahead는 반응을 늦출 수 있다. 코드 주석에 따르면 `rechord()`가 없으면 코드를 바꾼 뒤에도 첫 박 정도는 옛 코드로 울립니다. 예약 창이 곧 최대 지연이 될 수 있다는 뜻이고, 그래서 취소와 되감기를 넣었습니다.
- `setInterval`은 여전히 백그라운드에서 느려진다. 브라우저는 백그라운드 탭의 타이머를 느리게 만들 수 있고, 0.25초 창이 이를 항상 보완하지는 못합니다. 앱은 뒤처지면 건너뛰는 쪽을 택했습니다.

