---
title: "마이크는 켜는 것보다 끄는 것이 어렵다 — Vocal Check의 마이크 수명 관리"
description: "웹 앱에서 마이크를 여는 코드는 몇 줄이면 됩니다. Vocal Check가 권한 창이 늦게 닫히는 경쟁 상황, 탭 이탈, 장치 분리, 여러 가지 실패 원인을 어떻게 다루는지, 그리고 측정 화면에는 광고를 두지 않는 정책을 코드로 정리합니다."
pubDate: 2026-10-01
app: vocal-check
tags: ["Web Audio", "getUserMedia", "UX", "Privacy"]
draft: true
---

<!-- TODO(사용자): 초안입니다. TODO 주석을 채우고 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

웹에서 마이크를 여는 코드는 짧습니다. `navigator.mediaDevices.getUserMedia()` 한 줄이면 됩니다. 그런데 [Vocal Check](https://vocal-check.still-coding.cc/) 코드에서 가장 신경 쓴 부분은 여는 쪽이 아니라 **닫는 쪽과 실패하는 쪽**이었습니다.

마이크는 사용자에게 민감한 입력입니다. 켜져 있으면 안 될 때 켜져 있는 것이 켜지지 않는 것보다 훨씬 나쁩니다. 이 글은 음정 측정기가 마이크를 언제 켜고, 언제 끄고, 실패하면 무엇을 보여 주는지를 정리합니다. (음정을 계산하는 알고리즘은 [YIN 글](/notes/vocal-check-yin-pitch-detection/)에서 다뤘습니다.)

<!-- TODO(사용자): 마이크를 다루면서 가장 애를 먹은 상황이 있다면 한두 문장. (특정 브라우저? 모바일? 권한 창?) -->

## 1. 켜기 전에 확인할 것

시작 버튼을 누르면 마이크를 요청하기 전에 두 가지를 확인합니다.

```js
if (!window.isSecureContext) { showMicFailure('insecure'); return; }
if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) {
  showMicFailure('unsupported'); return;
}
```

마이크는 HTTPS 또는 `localhost`에서만 열립니다. 주소가 `http://`이거나 브라우저가 Web Audio를 지원하지 않으면, 권한 창을 띄우기 전에 원인을 알려 줍니다. 권한 창이 뜨지도 않고 아무 반응이 없는 것이 사용자에게는 가장 답답합니다.

## 2. 권한 창이 열려 있는 동안 벌어지는 일

권한 창은 사용자가 언제 눌러도 됩니다. 그 사이에 사용자가 **취소하거나, 다른 버튼을 누르거나, 페이지를 떠날 수 있습니다.** 그러면 "허용" 응답이 나중에 도착했을 때 이미 끄기로 한 상태에서 마이크가 켜지는 일이 생길 수 있습니다.

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

## 3. 끄는 방법은 세 곳에서 나온다

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

- **탭을 떠나거나 화면이 잠기면** 자동으로 끕니다.
- **페이지를 닫거나 이동하면** 끕니다(`pagehide`).
- **장치가 빠지거나 브라우저가 입력을 끝내면** 알려 주고 끕니다(`track.onended`).

```js
window.addEventListener('pagehide', stop);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ((running && !demo) || pending)) { stop(); showMicFailure('hidden'); }
});
stream.getAudioTracks()[0].onended = () => { if (running && !demo) { stop(); showMicFailure('ended'); } };
```

탭을 떠날 때 끄는 이유는 코드에 적혀 있지 않지만, 짐작되는 것은 두 가지입니다. 하나는 **개인정보**입니다. 사용자가 다른 창을 보는 동안 마이크가 조용히 켜져 있으면 안 됩니다. 다른 하나는 **실용성**입니다. 백그라운드 탭에서는 타이머가 느려져 측정이 의미를 잃습니다. 이때 화면에는 "화면을 떠나 마이크를 껐어요. 이 탭으로 돌아오면 다시 시도할 수 있습니다"라고 알려 줍니다.

<!-- TODO(사용자): 탭을 떠날 때 마이크를 끄기로 한 것이 처음부터의 설계였는지, 사용해 보고 바꾼 것인지. -->

## 4. 실패에는 이름이 있고, 이름마다 다른 말이 필요하다

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

<!-- TODO(사용자): 권한 거부가 가장 흔한 실패인지, 실제로 사용자에게서 받은 문의나 피드백이 있는지. 데모 모드를 만든 이유(마이크 없이 앱을 보여 주려고?)도 함께. -->

## 5. 엄격하게 요청하고, 안 되면 완화한다

마이크를 여는 조건도 두 단계입니다. 음정 측정에는 브라우저가 소리를 "다듬는" 기능(에코 제거, 잡음 억제, 자동 게인)이 오히려 방해가 되므로, 처음에는 이 세 가지를 모두 끈 조건으로 요청합니다.

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

## 6. 측정 화면에는 광고를 두지 않는다

이 앱의 광고 정책도 마이크와 연결되어 있습니다. `ads.js`의 머리말은 이렇게 시작합니다(번역).

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

이 코드에는 "현재 게시자 ID가 설정되지 않아 AdSense 스크립트는 로드하지 않는다"는 주석이 함께 있습니다.

<!-- TODO(사용자): 이 정책을 어떤 기준으로 정했는지(AdSense 정책 때문인지, 사용자 경험 때문인지) 본인의 말로 적어 주세요. 그리고 글을 공개하는 시점의 광고 적용 상태에 맞게 위 문장을 고쳐 주세요. -->

## 정리

마이크 코드에서 가장 중요한 것은 **소유권**입니다. 사용자가 허락한 마이크를 앱이 쥐고 있는 시간은 필요한 만큼만이어야 하고, 사용자가 자리를 뜨거나 취소하거나 장치가 빠지는 모든 경우에 앱이 먼저 놓아야 합니다. 실패할 때는 오류 이름이 아니라 **다음에 할 일**을 알려 주고, 마이크가 없어도 쓸 수 있는 길(데모, 가이드)을 항상 남겨 둡니다.

<!-- TODO(사용자): 마지막에 "다시 만든다면" 한두 문장. -->
