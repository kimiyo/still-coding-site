---
title: "포켓 레이스: 1분짜리 레이싱을 휴대폰 네 대로 — 방장이 계산하고 각자는 예측한다"
description: "브라우저끼리 최대 4명이 실시간으로 달리는 포켓 레이스의 네트워크 구조를 정리합니다. 방장 권위 시뮬레이션, 순서를 포기한 상태 채널과 신뢰할 수 있는 이벤트 채널, 초당 20번의 상태 전송, 내 차의 예측과 보정을 코드로 설명합니다."
pubDate: 2026-10-01
app: direct-play
game: pocket-race
tags: ["WebRTC", "Netcode", "Game", "Prediction"]
---

[포켓 레이스](https://pocket-race.still-coding.cc)는 휴대폰을 가로로 들고 왼쪽과 오른쪽 화면을 누르기만 하면 되는 레이싱 게임입니다. 2~4명이 QR로 모여 1분 안팎으로 달리고 바로 재경기를 합니다.

이 게임은 Direct Play의 다른 게임과 성격이 다릅니다. 숫자 야구나 스도쿠는 각자 자기 화면에서 풀고 결과만 모으면 되지만, 레이싱은 모두가 같은 트랙 위에서 서로의 차를 실시간으로 봐야 합니다. 게임 계산은 방장 브라우저에서 하고, 연결 신호는 방 서버를 통해 교환합니다.

레이싱을 넣은 것은 액션 게임이 하나 있어야 게임들 사이의 균형이 맞을 것 같아서였습니다. 다만 지금 게임은 너무 단순해서, 앞으로는 더 재미있는 게임이 필요합니다.

## 누가 계산하나: 방장이 게임 서버

실시간 게임에서 가장 먼저 정할 것은 "진실은 누구의 계산인가"입니다. 각자 자기 차를 계산해서 위치를 알리는 방식은 단순하지만, 서로의 화면이 어긋나고 충돌 판정이 사람마다 달라집니다.

포켓 레이스는 방장의 브라우저를 게임 서버로 씁니다.

```text
  게스트 A ─ 조향·부스트 입력 ─▶┐
  게스트 B ─ 조향·부스트 입력 ─▶├─▶ 방장(권위): 세계를 계산
  게스트 C ─ 조향·부스트 입력 ─▶┘        │
        ▲                                 │ 초당 20번, 모든 차의 위치
        └─────────────────────────────────┘
```

- 게스트는 자기 입력(조향 방향, 부스트 여부)만 방장에게 보냅니다.
- 방장이 모든 차를 한 세계에서 움직이고, 충돌, 랩 수, 순위를 판정합니다.
- 방장은 세계의 상태를 게스트들에게 보냅니다.

연결은 방장을 가운데 두는 별 모양(스타)이고, 최대 4명입니다. 서버(Durable Object)는 연결을 맺을 때 필요한 신호만 전달하고 게임 계산에는 관여하지 않습니다.

## 채널을 둘로 나눈다

WebRTC 데이터 채널은 성격을 골라서 만들 수 있습니다. 이 게임은 한 연결에 성격이 다른 채널 두 개를 엽니다.

```js
// frontend/core/realtime.js
stateCh: pc.createDataChannel("game-state", { ordered: false, maxRetransmits: 0 }),
eventCh: pc.createDataChannel("game-event", { ordered: true }),
```

| 채널 | 설정 | 담는 것 | 이유 |
| --- | --- | --- | --- |
| `game-state` | 순서 없음, **재전송 없음** | 차 위치 스냅샷, 입력 | 1초 전의 위치는 쓸모없다. 늦게 온 것을 다시 보내느니 다음 것을 기다린다 |
| `game-event` | 순서 있음, 신뢰 | 참가, 준비, 시작, 결과, 완주 | 하나라도 놓치면 게임이 어긋난다 |

위치처럼 계속 새로 나오는 값은 놓쳐도 다음 패킷이 덮어씁니다. 반대로 "레이스 시작"이나 "결과"는 딱 한 번 오고 놓치면 안 되므로 신뢰 채널로 보냅니다. UDP와 TCP를 나눠 쓰는 것과 같은 발상입니다.

## 순서가 뒤바뀔 수 있다는 전제

순서를 보장하지 않는 채널을 쓰면 오래된 패킷이 늦게 도착할 수 있습니다. 그래서 방장이 입력을 받을 때 번호를 확인합니다.

```js
// 게스트 → 방장: 입력 패킷
if (packet.t === "in" && role === "host") {
  if (packet.r != null && packet.r !== session.raceId) return;   // 지난 판의 패킷은 버린다
  const prev = pendingInputs.get(packet.id);
  if (prev && packet.n <= prev.n) return;                        // 이미 더 새 입력을 받았다
  pendingInputs.set(packet.id, { playerId: packet.id, steering: packet.s, boost: Boolean(packet.b), seq: packet.n });
}
```

패킷마다 판 번호(`r`)와 순번(`n`)이 있습니다. 지난 판에서 늦게 도착한 입력, 이미 더 새로운 입력을 받은 뒤 도착한 옛 입력은 무시합니다. 방장은 차마다 "가장 최근 입력" 하나만 들고 있다가, 매 프레임 그 입력으로 차를 움직입니다.

## 초당 20번만 보낸다

방장은 화면을 60프레임 가까이 갱신하지만 상태는 1초에 20번(`1/20`초마다)만 보냅니다.

```js
// frontend/games/pocket-race/play.js — 방장의 프레임 루프
const events = stepWorld(world, dt);           // dt는 최대 0.05초로 제한
netAcc += dt;
if (netAcc >= 1 / 20) {
  netAcc = 0;
  ctx.publishState?.(packWorld(world));        // 초당 20번 스냅샷
}
```

- 시간 간격 `dt`는 `Math.min(0.05, …)`로 제한합니다. 탭이 멈췄다 돌아와 큰 시간 간격이 생겨도 한 번의 계산에 쓰는 시간은 이 상한을 넘지 않습니다.
- 스냅샷은 짧은 키(`i`, `x`, `y`, `r`, `v`, `l`…)와 반올림(위치는 소수 첫째 자리, 각도는 셋째 자리)으로 크기를 줄입니다.

```js
export function packCar(car) {
  return {
    i: car.id,
    x: Math.round(car.x * 10) / 10,
    y: Math.round(car.y * 10) / 10,
    r: Math.round(car.rotation * 1000) / 1000,
    v: Math.round(car.speed * 10) / 10,
    // 부스트, 랩, 완주, 순위 ...
  };
}
```

## 내 차는 기다리지 않는다: 예측과 보정

여기까지만 하면 문제가 있습니다. 게스트가 화면을 눌렀을 때 그 입력이 방장에게 갔다가 계산되고 상태가 돌아올 때까지의 왕복 시간 동안 내 차가 반응하지 않는 것처럼 느껴집니다. 조작과 화면 반응 사이에 지연이 생깁니다.

그래서 게스트는 자기 차를 자기 화면에서 먼저 움직입니다.(예측)

```js
} else if (phase === "racing" && !ctx.isHost?.()) {
  const me = findCar(world, myId);
  if (me && !me.finished) {
    integrateCar(me, dt);         // 내 차는 로컬에서 바로 계산
    collideWall(me, track);
  }
}
```

그리고 방장의 상태가 도착하면, 내 차만은 그 값으로 덮어쓰지 않고 조금씩 끌어당깁니다.(보정)

```js
listen(ctx.onState((packed) => {
  const pred = { x: mine.x, y: mine.y, rotation: mine.rotation, speed: mine.speed };   // 내 예측 저장
  applyPackedWorld(world, packed);                                                    // 방장 값 적용
  const auth = { x: mine.x, y: mine.y, rotation: mine.rotation, speed: mine.speed };
  Object.assign(mine, pred);                                                          // 내 차는 예측으로 되돌림
  reconcileCar(mine, { ...mine, ...auth }, 0.26);                                     // 방장 값 쪽으로 26%만 이동
}));
```

```js
export function reconcileCar(local, auth, alpha = 0.28) {
  local.x = lerp(local.x, auth.x, alpha);
  local.y = lerp(local.y, auth.y, alpha);
  local.rotation = lerpAngle(local.rotation, auth.rotation, alpha);
  // ...
}
```

패킷이 올 때마다 내 차는 방장이 계산한 위치 쪽으로 약 26%씩 다가갑니다. 위치를 한 번에 바꾸는 대신 차이를 여러 패킷에 걸쳐 줄입니다. 다른 참가자의 차는 `applyPackedWorld`에서 받은 값을 바로 적용합니다. 현재 상태 수신 경로에는 다른 차의 위치를 프레임 사이에 보간하는 코드가 없습니다. 반면 랩 수, 순위, 완주 여부는 게임의 결과이므로 보정 없이 방장의 값을 그대로 씁니다.

각도는 `lerpAngle`로 따로 다룹니다. 예를 들어 3라디안과 −3라디안은 숫자로는 멀지만 실제로는 가까운 방향이라, 원을 가로지르지 않고 짧은 쪽으로 보간해야 합니다.

## 시작 메시지를 받으면 3초를 기다린다

모두가 동시에 출발해야 합니다. 방장이 "시작"을 보내면서 `delayMs`(기본 3초)를 함께 보냅니다. 받은 쪽은 자기 시계로 그 시간만큼 기다렸다가 출발합니다.

```js
const START_DELAY_MS = 3000;
// ...
session._goTimer = setTimeout(() => setPhase("racing"), packet.delayMs || START_DELAY_MS);
```

각 기기는 메시지를 받은 시점부터 기다리므로 기기 시계의 절대값을 맞출 필요는 없습니다. 메시지가 도착하는 시간이 다르면 출발 시점도 그만큼 어긋납니다. 현재 코드에는 이 전달 지연을 측정해 보정하는 과정이 없습니다.

## 연결이 안 될 때

게스트가 방장에게 연결하는 데 실패하면 자동으로 다시 시도합니다.

| 상수 | 값 | 의미 |
| --- | --- | --- |
| `CONNECT_TIMEOUT_MS` | 8초 | 이 안에 채널이 열리지 않으면 실패로 본다 |
| `MAX_CONNECT_ATTEMPTS` | 2 | 최초 시도를 포함한 총 시도 횟수 |
| `CONNECT_RETRY_MS` | 2.2초 | 재시도 사이 간격 |

방장이 정상적으로 나가면 `host-left` 이벤트를 보냅니다. 갑자기 연결이 끊겨도 접속자 목록에서 방장이 사라진 것을 확인하면 게스트가 "방장을 기다리는 중" 상태로 돌아갑니다. 현재 구조에는 다른 참가자에게 진행 중인 세계의 계산을 넘기는 절차가 없습니다.
