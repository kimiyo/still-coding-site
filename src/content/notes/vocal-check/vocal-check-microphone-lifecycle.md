---
title: "마이크는 켜는 것보다 끄는 것이 어렵다 — Vocal Check의 마이크 수명 관리"
description: "Vocal Check의 마이크 요청 번호와 종료 경로를 따라갑니다. 늦게 도착한 권한 응답, 탭 이탈, 장치 분리와 오류 안내를 다루고, 측정 화면에서 광고를 제외하는 앱 자체 규칙을 설명합니다."
pubDate: 2026-10-01
app: vocal-check
tags: ["Web Audio", "getUserMedia", "UX", "Privacy"]
---

`navigator.mediaDevices.getUserMedia()`는 마이크 권한 응답이 올 때까지 기다립니다. [Vocal Check](https://vocal-check.still-coding.cc/)에서는 그 사이에 사용자가 페이지를 떠나거나 데모로 전환했는지도 확인해야 합니다. 마이크 요청과 종료가 엇갈리는 경우를 `generation`이라는 요청 번호로 처리합니다.

마이크는 사용자에게 민감한 입력입니다. 켜져 있으면 안 될 때 켜져 있는 것이 켜지지 않는 것보다 훨씬 나쁩니다. 이 글은 음정 측정기가 마이크를 언제 켜고, 언제 끄고, 실패하면 무엇을 보여 주는지를 정리합니다. (음정을 계산하는 알고리즘은 [YIN 글](/notes/vocal-check-yin-pitch-detection/)에서 다뤘습니다.)

## 권한 요청 전에 확인하는 조건

시작 버튼을 누르면 마이크를 요청하기 전에 두 가지를 확인합니다.

```js
if (!window.isSecureContext) { showMicFailure('insecure'); return; }
if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) {
  showMicFailure('unsupported'); return;
}
```

이 앱은 `isSecureContext`와 마이크·Web Audio API 지원 여부를 먼저 검사합니다. 둘 중 하나라도 통과하지 못하면 권한 요청을 보내지 않고 안내를 표시합니다.

## 허용 응답이 뒤늦게 도착하면

사용자가 권한 창에 응답하기 전에 데모를 시작하거나 페이지를 떠날 수 있습니다. 허용 응답이 뒤늦게 도착하면, 이미 종료한 요청이 마이크를 다시 연결하는 문제가 생깁니다. 요청 대기 중에는 시작 버튼이 비활성화되므로 같은 버튼을 눌러 취소하는 방식은 아닙니다.

이 앱은 요청마다 번호표(`generation`)를 붙여서 이 경쟁 상황을 막습니다.

```js
pending = true;
const token = ++generation;           // 이 요청의 번호표
try {
  await audioContext();
  const acquired = await acquireStream();
  if (token !== generation) {         // 그 사이에 stop()이 불렸다면
    acquired.stream.getTracks().forEach(track => track.stop());   // 받은 마이크를 바로 닫는다
    return;
  }
  stream = acquired.stream;
  // ...
} catch (error) {
  if (token !== generation) return;   // 오래된 요청의 오류는 무시
  stop(); showMicFailure(error?.name || 'unknown');
} finally {
  if (token === generation) { pending = false; $('start').disabled = false; }
}
```

`stop()`은 `generation`을 올립니다. 그러면 예전 요청의 응답이 뒤늦게 도착해도 번호가 달라서, 열린 마이크를 즉시 닫고 화면 상태를 건드리지 않습니다.

## 트랙을 닫는 경로

마이크를 끄는 `stop()`은 트랙을 정지하고, 오디오 노드의 연결을 끊고, 애니메이션 프레임과 소리 재생을 멈춥니다.

```js
function stop() {
  generation++; pending = false; running = false; demo = false;
  cancelAnimationFrame(frame); stopTone();
  if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
  if (source)   { source.disconnect();   source = null; }
  if (analyser) { analyser.disconnect(); analyser = null; }
  // ...
}
```

이 함수가 불리는 경로는 사용자가 누르는 정지 버튼 하나가 아닙니다.

- 문서가 숨김 상태가 되면 실제 마이크 측정과 대기 중인 요청을 종료합니다(`visibilitychange`). 화면 잠금도 브라우저가 이 이벤트를 전달한 경우에 이 경로로 처리됩니다.
- **페이지를 닫거나 이동하면** 끕니다(`pagehide`).
- **장치가 빠지거나 브라우저가 입력을 끝내면** 알려 주고 끕니다(`track.onended`).

```js
window.addEventListener('pagehide', stop);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ((running && !demo) || pending)) { stop(); showMicFailure('hidden'); }
});
stream.getAudioTracks()[0].onended = () => { if (running && !demo) { stop(); showMicFailure('ended'); } };
```

숨김 상태가 되면 `stop()`을 호출하고 `hidden` 안내를 표시합니다. 탭으로 돌아왔다고 마이크를 자동으로 다시 열지는 않습니다. 사용자가 다시 시작해야 합니다. 데모만 실행 중인 경우는 이 조건에서 제외됩니다.

## 오류 이름을 다음 행동으로 바꾸기

`getUserMedia`가 실패하는 이유는 하나가 아닙니다. 브라우저마다 오류 이름도 조금씩 다릅니다. 이 앱은 오류 이름을 화면에 그대로 보여 주지 않고, 사용자가 다음에 할 수 있는 행동으로 바꿉니다.

| 상황 | 안내하는 것 |
| --- | --- |
| 보안 연결이 아님 | 잠금 표시가 있는 주소(HTTPS)로 다시 열기 |
| 브라우저가 지원하지 않음 | 최신 Chrome, Edge, Firefox, Safari에서 다시 열기 |
| 권한 거부 | 주소창의 자물쇠나 사이트 설정에서 마이크를 허용으로 바꾸기 |
| 마이크가 없음 | 장치를 연결한 뒤 다시 시도 |
| 다른 앱이 사용 중 | 그 사용을 끝낸 뒤 다시 시도 |
| 권한 창을 닫음/연결 중단 | 다시 시도 |
| 탭을 떠남 | 돌아오면 다시 시작 |
| 장치가 분리됨 | 연결을 확인하고 다시 시작 |

브라우저마다 다른 이름은 별칭 표로 하나로 합칩니다.

```js
const micAliases = {
  PermissionDeniedError: 'NotAllowedError',
  NotFoundError: 'no-device',
  DevicesNotFoundError: 'no-device',
  TrackStartError: 'NotReadableError',
  ConstraintNotSatisfiedError: 'OverconstrainedError'
};
```

그리고 모든 안내 문구에는 **데모와 사용 가이드는 마이크 없이도 계속 쓸 수 있다**는 말이 함께 들어 있습니다. 마이크가 실패해도 사용자가 막다른 길에 서지 않게 하려는 장치입니다. 이 말이 모든 오류 코드의 한국어·영어 문구에 들어 있는지를 테스트가 확인합니다(`test-mic-help.cjs`).

```js
assert.match(info.detail, locale === 'ko' ? /데모|사용 가이드/ : /demo|guide/i, `${locale}:${code}`);
```

## 입력 조건을 낮춰 다시 요청하는 경우

첫 요청에는 에코 제거, 잡음 억제, 자동 게인을 끄는 값을 넣습니다. 소리를 가공하는 기능이 음정 측정에 개입하는 것을 줄이려는 설정입니다. [Media Capture 명세의 제약 조건](https://www.w3.org/TR/mediacapture-streams/#constrainbooleanparameters)에 따르면 `false`는 `exact: false`로 지정한 필수 제약과 다릅니다. 요청 값만으로 모든 기기에서 기능이 꺼졌다고 단정하지는 않습니다.

```js
async function acquireStream() {
  const strict = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false };
  try { return { stream: await navigator.mediaDevices.getUserMedia(strict), relaxed: false }; }
  catch (error) {
    if (error?.name !== 'OverconstrainedError' && error?.name !== 'ConstraintNotSatisfiedError') throw error;
    return { stream: await navigator.mediaDevices.getUserMedia({ audio: true, video: false }), relaxed: true };
  }
}
```

기기가 이 조건을 지원하지 못할 때만(`OverconstrainedError`) 기본 조건으로 다시 요청하고, 화면에는 "조건을 낮춰 연결했다"는 상태 문구가 뜹니다. 그 외의 오류(권한 거부 등)는 조건을 낮춰도 해결되지 않으므로 그대로 던집니다.

## 측정 화면에서 광고를 제외하는 앱 규칙

`ads.js`에는 앱에서 광고를 허용할 화면을 정하는 규칙이 있습니다. Google 정책의 의무 조항을 옮긴 코드라는 근거는 없습니다. 머리말은 이렇게 시작합니다(번역).

> 공개된 읽기 페이지는 앞으로 광고 후보가 될 수 있다. 튜너는 절대 그렇지 않다.

```js
function getAdEligibility({ pathname = '/', measuring = false, helpOpen = false } = {}) {
  if (measuring) return { allowed: false, reason: 'microphone-measurement' };
  if (helpOpen)  return { allowed: false, reason: 'help-or-permission-surface' };
  const path = normalizePath(pathname);
  if (CANDIDATES.has(path)) return { allowed: true, reason: 'public-reading-page' };
  if (path === '/') return { allowed: false, reason: 'live-measurement-surface' };
  return { allowed: false, reason: 'path-not-allowlisted' };
}
```

측정 중이거나 도움말·권한 안내가 열려 있을 때, 그리고 측정 화면(`/`) 자체에서는 광고가 허용되지 않고, 허용 목록에 있는 읽기 페이지(현재는 `/guide/`)에서만 후보가 됩니다. 허용되지 않는 화면에서는 혹시 들어와 있는 광고 스크립트와 노드를 제거하는 함수(`stripAdNodes`)까지 있습니다. 허용하지 않는 사유의 이름(`microphone-measurement`, `help-or-permission-surface`, `live-measurement-surface`)이 그 의도를 말해 줍니다. 마이크를 다루는 화면과 권한 안내는 광고와 섞지 않겠다는 것입니다.

검토한 로컬 코드에는 "현재 게시자 ID가 설정되지 않아 AdSense 스크립트는 로드하지 않는다"는 주석이 있습니다. `/guide/`는 후보 경로일 뿐, `allowed: true`가 광고 송출을 뜻하지는 않습니다. 영어 경로도 정규화 후 같은 규칙을 적용합니다.

`stop()`은 트랙과 오디오 노드를 해제하고 요청 번호도 바꿉니다. 이미 받은 입력과 아직 기다리는 입력을 같은 종료 경로에서 처리합니다. 종료 후 마이크를 다시 여는 동작은 시작 버튼에 남겨 둡니다.
