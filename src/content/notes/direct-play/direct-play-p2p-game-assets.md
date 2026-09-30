---
title: "사진은 서버를 거치지 않는다 — Direct Play가 게임 자원을 P2P로 나눠 주는 법"
description: "사진퍼즐처럼 방장이 올린 사진이 게임의 재료인 앱에서, 서버에 사진을 저장하지 않고 참가자에게 전달하기 위해 Direct Play가 만든 자원 요청 라우팅, 16,000자 청크 전송, 해시 검증, 실패 처리를 정리합니다."
pubDate: 2026-10-01
app: direct-play
tags: ["WebRTC", "P2P", "Cloudflare Durable Objects", "Architecture"]
---

[Direct Play](https://dp.still-coding.cc/)의 사진퍼즐게임은 방장이 올린 사진 한 장으로 시작합니다. 참가자들은 그 사진을 조각으로 맞추고, 사진이 어디서 찍혔는지도 맞힙니다. 그러려면 방에 들어온 모든 사람의 브라우저에 같은 사진이 있어야 합니다.

가장 쉬운 방법은 방장의 사진을 서버에 올리고 참가자가 내려받게 하는 것입니다. 하지만 이 앱은 그렇게 하지 않습니다. 개인 사진에 서버가 관여하지 않고, 참가자끼리 안전하게 주고받게 하려 했습니다. 방 서버에는 자원 메타데이터를 저장하고, 사진퍼즐에서 고른 사진은 참가자의 브라우저에서 브라우저로 직접 건너갑니다. 그 과정에서 서버의 저장 공간과 운영 비용도 함께 줄어듭니다.

WebRTC로 두 브라우저를 잇는 기본 원리는 [CollaBoard 글](/notes/collaboard-webrtc-p2p-room/)에서 다뤘습니다. 이 글은 Direct Play에서 "게임 자원을 누가, 누구에게, 어떻게 믿을 수 있게 전달하는가"를 다룹니다.

## 서버가 아는 것은 이 정도입니다

방장이 사진을 고르고 설정을 마치면, 서버에는 자원의 설명서만 등록됩니다. 서버 쪽 코드에서 그 설명서를 걸러 내는 함수는 이렇게 생겼습니다.

```js
// worker/utils.js — 큰 필드는 버리고, 원본은 P2P에만 둔다
export function sanitizeAssetMeta(meta) {
  const { thumbnail: _thumbnail, ...rest } = meta;
  return {
    hasAsset: Boolean(rest.hasAsset),
    gameType: rest.gameType || null,
    summary: rest.summary || null,
    difficulty: rest.difficulty ?? null,
    payloadHash: rest.payloadHash || null,
    updatedAt: rest.updatedAt || null,
    // ...
  };
}
```

썸네일은 명시적으로 버립니다. 남는 것은 "자원이 있다", "무슨 게임이다", "난이도는 얼마다", 그리고 자원의 SHA-256 해시입니다. 사진퍼즐에서 고른 원본 사진과 썸네일은 이 메타데이터에 저장하지 않습니다. PINHOLE의 문제 이미지를 서버가 가져오는 경로는 별도입니다. 해시가 왜 필요한지는 뒤에서 나옵니다.

방 자체도 오래 남지 않습니다. 설정 중인 방은 1시간, 활동이 없는 방은 3일, 보관된 방은 7일이 지나면 Durable Object 알람이 정리합니다.

## 자원을 가진 참가자가 사진을 전달한다

처음에는 방장만 사진을 갖고 있습니다. 참가자가 입장하면 서버에 "자원을 보내 달라"는 요청(`asset-request`)이 갑니다. 서버는 이 요청을 지금 접속해 있고 자원을 가진 사람에게 전달합니다.

```js
// worker/room.js — 자원을 가진 접속자 중 가장 먼저 들어온 사람
onlineAssetHolders(exceptSessionId) {
  const holders = [];
  for (const ws of this.ctx.getWebSockets()) {
    const att = ws.deserializeAttachment() || {};
    if (!att.sessionId || att.sessionId === exceptSessionId) continue;
    if (att.hasAsset || this.assetHolders.has(att.sessionId)) {
      holders.push({ sessionId: att.sessionId, connectedAt: att.connectedAt || 0 });
    }
  }
  holders.sort((a, b) => a.connectedAt - b.connectedAt);
  return holders.map((h) => h.sessionId);
}
```

사진을 성공적으로 받은 참가자는 서버에 "나도 이제 자원이 있다"(`hasAsset: true`)고 알립니다. 그러면 다음 참가자의 요청은 방장이 아니라 이미 받은 사람에게도 갈 수 있습니다. 방장이 창을 닫아도 다른 참가자가 사진을 갖고 있으면 방은 계속 쓸 수 있습니다.

자원을 가진 사람이 아무도 접속해 있지 않다면 어떻게 될까요? 서버는 요청을 버리지 않고 대기열(`pendingAssetRequests`)에 넣습니다. 나중에 자원을 가진 사람이 들어오면 대기열을 비우며 그 사람에게 요청을 전달합니다. 대기열은 32건을 넘으면 가장 오래된 것부터 버립니다.

## 서버는 연결 신호를 전달만 하고 저장하지 않는다

WebRTC 연결을 맺으려면 두 브라우저가 서로의 연결 정보(offer, answer, ICE 후보)를 교환해야 합니다. 이 교환은 서버가 중계합니다.

```js
// worker/room.js — 신호는 저장하지 않는다
async relaySignal(request, roomId) {
  // ... 권한 확인 ...
  // Do not persist signals — ephemeral only (no historical data).
  this.broadcast("signal", { roomId: room.id, from: body.from, to: body.to,
    kind: body.kind, payload: body.payload }, body.to ? { to: body.to } : { except: body.from });
  return json({ ok: true });
}
```

받는 쪽에 그대로 전달하고 끝입니다. 이 신호는 사진의 내용을 담지 않습니다.

## 후보가 먼저 도착하는 문제

연결 정보를 교환하다 보면 이상한 일이 생깁니다. ICE 후보는 여러 개가 연달아 오는데, 네트워크를 거치다 보면 offer보다 후보가 먼저 도착할 수 있습니다. 아직 상대의 offer를 받지 않았는데 후보를 추가하려 하면 브라우저가 오류를 냅니다.

그래서 후보를 바로 쓰지 않고 잠깐 보관했다가, 상대의 설명서(remote description)가 준비된 뒤에 적용하는 버퍼를 두었습니다.

```js
// frontend/core/webrtc.js
async function addOrQueue(peerId, pc, candidate) {
  if (!pc?.remoteDescription) {
    queue(peerId, candidate);          // 아직이면 보관
    return false;
  }
  try {
    await pc.addIceCandidate(candidate);
    return true;
  } catch (error) {
    queue(peerId, candidate);          // 실패해도 다음 기회에 다시
    onError(error);
    return false;
  }
}
```

연결마다 최대 64개까지 보관하고, 넘치면 오래된 것부터 버립니다. `flush`는 remote description을 설정한 직후에 호출됩니다.

## 큰 자원을 16,000자씩 잘라 보내기

사진은 800×800 이하로 자르고 JPEG로 인코딩한 뒤 게임 설정과 함께 하나의 JSON 덩어리로 만듭니다. 이 덩어리는 한 번에 보내기에는 큽니다. 그래서 문자열로 만든 뒤 16,000자씩 잘라 `chunk-start`, `chunk`, `chunk-end` 메시지로 보냅니다.

```js
// frontend/core/p2p.js
const CHANNEL_CHUNK_SIZE = 16_000;

export function sendChannelJson(channel, data) {
  const raw = JSON.stringify(data);
  const messageId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const total = Math.ceil(raw.length / CHANNEL_CHUNK_SIZE);
  channel.send(JSON.stringify({ type: "chunk-start", messageId, total }));
  for (let index = 0; index < total; index += 1) {
    channel.send(JSON.stringify({ type: "chunk", messageId, index,
      value: raw.slice(index * CHANNEL_CHUNK_SIZE, (index + 1) * CHANNEL_CHUNK_SIZE) }));
  }
  channel.send(JSON.stringify({ type: "chunk-end", messageId }));
}
```

받는 쪽은 `messageId`별로 조각을 모아 두었다가 `chunk-end`가 오면 이어 붙여 JSON으로 되돌립니다. 데이터 채널을 `ordered: true`로 열어서 조각의 순서는 보장되지만, 조각마다 `index`를 넣어 어느 자리에 들어갈지 명시합니다.

## 받은 것을 그대로 믿지 않는다

이미 사진을 받은 참가자도 다음 사람에게 자원을 보낼 수 있습니다. 수신한 내용이 등록된 자원과 같은지 확인할 때 메타데이터의 해시를 씁니다.

```js
// frontend/core/rooms.js — 서버에 등록된 해시와 받은 자원의 해시를 비교
async function verifyAssetAgainstMeta(asset, assetMeta) {
  if (!asset) return false;
  const expected = assetMeta?.payloadHash;
  if (!expected) return true;
  const actual = await computePayloadHash(asset.payload);
  return !actual || actual === expected;
}
```

해시가 다르면 받은 자원을 버리고 "방장이 등록한 원본과 달라 무시했습니다. 다시 요청합니다."라고 알린 뒤 다시 요청합니다. 자원이 불완전하게 왔을 때도 같은 경로로 재요청합니다.

이 검증에는 한계도 있습니다. 서버에 해시가 등록되어 있지 않으면 검증을 건너뜁니다(`if (!expected) return true`). `computePayloadHash`가 값을 만들지 못한 경우에도 `!actual` 조건으로 통과합니다. 이 검사는 해시를 계산할 수 있을 때 등록된 값과 내용을 비교하며, 사진 내용의 적절성이나 발신자의 신원까지 확인하지는 않습니다.

## 연결이 안 될 때

직접 연결은 언제나 되지 않습니다. 회사망이나 VPN, 일부 이동통신망에서는 두 브라우저가 서로를 찾지 못합니다. 이런 경우를 위한 릴레이 서버(TURN)를 쓰면 되지만, 이 앱은 STUN 서버 하나(`stun:stun.l.google.com:19302`)만 사용하고 TURN은 쓰지 않습니다. 그 대신 실패를 다음과 같이 다룹니다.

- 자원을 요청하거나 전송이 시작된 뒤 12초 안에 받지 못하면 실패로 보고, 한 번 자동으로 다시 시도합니다.
- 그래도 안 되면 "VPN을 끄거나 같은 Wi-Fi에 연결한 뒤 다시 시도해 주세요"라고 안내하고 다시 시도 버튼을 보여 줍니다.
- 방에 자원을 가진 사람이 아무도 없으면 실패가 아니라 대기 상태입니다. 누군가 들어오면 자동으로 이어서 받습니다.

자원을 받은 참가자가 남아 있으면 다음 사람에게 사진을 전달할 수 있습니다. 모두 접속을 끊으면 서버에서 원본을 내려받는 경로는 없습니다.
