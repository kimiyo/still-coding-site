---
title: "사진은 서버를 거치지 않는다 — Direct Play가 게임 자원을 P2P로 나눠 주는 법"
description: "사진퍼즐처럼 방장이 올린 사진이 게임의 재료인 앱에서, 서버에 사진을 저장하지 않고 참가자에게 전달하기 위해 Direct Play가 만든 자원 요청 라우팅, 16,000자 청크 전송, 해시 검증, 실패 처리를 정리합니다."
pubDate: 2026-10-01
app: direct-play
tags: ["WebRTC", "P2P", "Cloudflare Durable Objects", "Architecture"]
draft: true
---

<!-- TODO(사용자): 초안입니다. 아래 TODO 주석을 채우고, 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

[Direct Play](https://dp.still-coding.cc/)의 사진퍼즐게임은 방장이 올린 사진 한 장으로 시작합니다. 참가자들은 그 사진을 조각으로 맞추고, 사진이 어디서 찍혔는지도 맞힙니다. 그러려면 방에 들어온 모든 사람의 브라우저에 **같은 사진**이 있어야 합니다.

가장 쉬운 방법은 방장의 사진을 서버에 올리고 참가자가 내려받게 하는 것입니다. 하지만 이 앱은 그렇게 하지 않습니다. 서버가 저장하는 것은 방의 상태뿐이고, 사진은 참가자의 브라우저에서 브라우저로 직접 건너갑니다.

<!-- TODO(사용자): 서버에 사진을 저장하지 않기로 한 이유를 본인의 말로 한두 문장. (개인 사진이라서? 저장 비용? 운영 부담?) -->

WebRTC로 두 브라우저를 잇는 기본 원리는 [CollaBoard 글](/notes/collaboard-webrtc-p2p-room/)에서 다뤘습니다. 이 글은 Direct Play에서 **"게임 자원을 누가, 누구에게, 어떻게 믿을 수 있게 전달하는가"**를 다룹니다.

## 1. 서버가 아는 것은 이 정도입니다

방장이 사진을 고르고 설정을 마치면, 서버에는 자원의 **설명서**만 등록됩니다. 서버 쪽 코드에서 그 설명서를 걸러 내는 함수는 이렇게 생겼습니다.

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

썸네일은 명시적으로 버립니다. 남는 것은 "자원이 있다", "무슨 게임이다", "난이도는 얼마다", 그리고 자원의 **SHA-256 해시**입니다. 사진의 바이트는 서버 어디에도 없습니다. 해시가 왜 필요한지는 뒤에서 나옵니다.

방 자체도 오래 남지 않습니다. 설정 중인 방은 1시간, 활동이 없는 방은 3일, 보관된 방은 7일이 지나면 Durable Object 알람이 정리합니다.

## 2. 사진을 주는 사람은 방장이 아니라 "가진 사람"

처음에는 방장만 사진을 갖고 있습니다. 참가자가 입장하면 서버에 "자원을 보내 달라"는 요청(`asset-request`)이 갑니다. 서버는 이 요청을 **지금 접속해 있고 자원을 가진 사람**에게 전달합니다.

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

<!-- TODO(사용자): "가장 먼저 들어온 사람에게 요청한다"를 고른 이유가 있나요? (방장 부담 분산? 단순함?) 실제로 방장 외에 다른 참가자가 사진을 넘겨준 적이 있는지도 확인해 보세요. -->

## 3. 서버는 연결 신호를 전달만 하고 저장하지 않는다

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

## 4. 후보가 먼저 도착하는 문제

연결 정보를 교환하다 보면 이상한 일이 생깁니다. ICE 후보는 여러 개가 연달아 오는데, 네트워크를 거치다 보면 **offer보다 후보가 먼저 도착**할 수 있습니다. 아직 상대의 offer를 받지 않았는데 후보를 추가하려 하면 브라우저가 오류를 냅니다.

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

<!-- TODO(사용자): 이 버퍼를 넣게 된 계기가 있다면 적어 주세요. (특정 환경에서 연결이 안 되던 경험 등) 커밋 기록에서 시점을 찾아 넣어도 좋습니다. -->

## 5. 큰 자원을 16,000자씩 잘라 보내기

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

<!-- TODO(사용자): 16,000이라는 숫자를 고른 이유. (브라우저 간 메시지 크기 제한을 보수적으로 잡은 것인지, 실험으로 정한 것인지) 사진 한 장의 실제 전송 크기와 걸리는 시간도 측정해서 넣으면 좋습니다. -->

## 6. 받은 것을 그대로 믿지 않는다

P2P로 받은 자원은 **누가 보냈는지**를 서버가 보증하지 않습니다. 방장이 아닌 다른 참가자가 보내 줄 수도 있으니까요. 그래서 받은 뒤에 검증합니다. 1번에서 본 해시가 여기서 쓰입니다.

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

이 검증에는 한계도 있습니다. 서버에 해시가 등록되어 있지 않으면 검증을 건너뜁니다(`if (!expected) return true`). 그리고 이 해시는 "서버가 알고 있는 원본과 같은가"를 확인할 뿐, 사진이 적절한 내용인지까지 확인하지는 않습니다.

<!-- TODO(사용자): 해시가 항상 등록되는지(빈 값이 오는 경우가 실제로 있는지) 확인하세요. -->

## 7. 연결이 안 될 때

직접 연결은 언제나 되지 않습니다. 회사망이나 VPN, 일부 이동통신망에서는 두 브라우저가 서로를 찾지 못합니다. 이런 경우를 위한 릴레이 서버(TURN)를 쓰면 되지만, 이 앱은 STUN 서버 하나(`stun:stun.l.google.com:19302`)만 사용하고 TURN은 쓰지 않습니다. 그 대신 실패를 다음과 같이 다룹니다.

- 자원을 요청하거나 전송이 시작된 뒤 **12초** 안에 받지 못하면 실패로 보고, 한 번 자동으로 다시 시도합니다.
- 그래도 안 되면 "VPN을 끄거나 같은 Wi-Fi에 연결한 뒤 다시 시도해 주세요"라고 안내하고 다시 시도 버튼을 보여 줍니다.
- 방에 자원을 가진 사람이 아무도 없으면 실패가 아니라 **대기** 상태입니다. 누군가 들어오면 자동으로 이어서 받습니다.

<!-- TODO(사용자): TURN을 쓰지 않은 이유(비용? 운영 복잡도?)와, 실제로 연결이 실패한 사례나 비율이 있다면 적어 주세요. 이 부분이 글의 신뢰도를 가장 높여 줍니다. -->

## 정리

Direct Play가 사진을 서버에 저장하지 않아서 얻은 것과 치른 대가는 이렇습니다.

| 얻은 것 | 치른 대가 |
| --- | --- |
| 서버에 사진이 남지 않는다 | 연결이 안 되는 네트워크가 있다 |
| 저장소와 전송 비용이 없다 | 자원을 가진 사람이 없으면 기다려야 한다 |
| 방장이 나가도 받은 사람이 이어 준다 | 해시 검증, 재시도, 청크 조립을 직접 만들어야 한다 |

작은 방에서 잠깐 노는 게임에는 이 거래가 맞았습니다. 반대로 사진을 오래 보관하거나, 모르는 사람 여럿에게 뿌려야 하는 서비스라면 다른 선택을 했을 것입니다.

<!-- TODO(사용자): 마지막에 "다시 만든다면 무엇을 바꾸겠는가" 한두 문장. -->
