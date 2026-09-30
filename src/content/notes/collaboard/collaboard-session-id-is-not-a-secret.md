---
title: "sessionId는 비밀이 아니다 — CollaBoard의 식별자와 입장 권한 분리"
description: "CollaBoard에서 공개 식별자, 일회용 입장권, 멤버 토큰, 방장 토큰의 역할을 나눕니다. 참가자 번호를 아는 것과 입장·방장 권한을 갖는 것을 어떻게 갈랐는지 정리합니다."
pubDate: 2026-10-01
app: collaboard
tags: ["Security", "Cloudflare Durable Objects", "WebSocket", "Code Review"]
---

[CollaBoard](https://collaboard.still-coding.cc/)는 참가자끼리 WebRTC로 자료를 주고받는 협업 앱입니다. [이전 글](/notes/collaboard-webrtc-p2p-room/)에서는 방과 연결 구조를 설명했습니다. 여기서는 참가자를 가리키는 값과 그 참가자의 권한을 증명하는 값을 어떻게 나누었는지 다룹니다. 여럿이 한 방에서 자료를 주고받는 만큼, 협업 쪽 보안을 더 강화하려고 이 구분을 넣었습니다.

## 참가자를 가리키는 값과 권한을 증명하는 값

`sessionId`는 참가자끼리 메시지의 상대를 지정하는 공개 식별자입니다. 다른 참가자가 그 값을 알 수 있다는 전제에서 권한을 따로 확인해야 합니다. 수정 계획서 0.3절에도 공개 식별자만으로 권한을 얻지 못하게 하고, 서버가 권한을 판단한다는 원칙이 적혀 있습니다.

현재 코드는 입장권, 멤버 토큰, 방장 토큰을 구분합니다.

| 값 | 용도 | 보관·전달 범위 |
| --- | --- | --- |
| `sessionId` | 참가자 식별과 통신 상대 지정 | 다른 참가자에게 알려질 수 있음 |
| `wsTicket` | 승인된 WebSocket 입장 | 만료와 일회 사용을 서버에서 검사 |
| `memberToken` | 기존 참가자의 재입장 증명 | 클라이언트에 보관, 서버에는 해시 저장 |
| `hostToken` | 방장 권한 증명 | 방장 변경 시 갱신 |

## 비밀번호 확인과 실제 연결을 잇는 입장권

비밀번호 확인 또는 방장 승인을 통과하면 서버는 60초 동안 한 번만 쓸 수 있는 입장권을 발급합니다. WebSocket을 열 때도 이 승인 결과를 검사합니다.

```js
// worker/room.js — WebSocket 연결 시
const ticketId = url.searchParams.get("ticket") || "";
const ticketKey = `ticket:${ticketId}`;
const ticket = ticketId ? await this.ctx.storage.get(ticketKey) : null;
if (ticket) await this.ctx.storage.delete(ticketKey);   // 일회용
if (!validateTicket(ticket, { sessionId }).ok) {
  return text("invalid_ticket", 401);
}
if (await this.ctx.storage.get(`ban:${sessionId}`)) {
  return text("banned", 403);
}
```

`worker/policy.js`의 `validateTicket`은 입장권의 존재, 만료 시각, `sessionId` 일치를 검사합니다. 토큰을 받았다는 사실과 실제 연결 허용 여부가 이어지는 지점입니다.

새 방의 비밀번호 해시는 PBKDF2(반복 100,000회)를 사용합니다. `worker/utils.js`에는 이전 방을 위한 SHA-256 호환 분기도 남아 있습니다. 기존 방까지 모두 새 방식으로 바뀌었다는 뜻은 아닙니다. 비밀번호 실패 횟수는 IP 해시별 기록으로 세며, 제한 창 안에서 5회 실패한 뒤의 요청은 429로 거부합니다.

## 재입장과 방장 변경

첫 입장 때 발급한 멤버 토큰은 클라이언트가 방별로 `localStorage`에 보관합니다. 서버는 SHA-256 해시를 저장해 재입장 시 비교합니다. 공개된 `sessionId`를 안다는 것만으로 기존 참가자의 자리를 사용할 수는 없습니다.

방장 역할은 방장 토큰을 확인했거나, 현재 방장의 `sessionId`에 해당하는 멤버 토큰을 확인했을 때 부여합니다. 초안의 비교식은 로컬 코드와 다음처럼 대응합니다.

```js
const isOwner = typeof ownerToken === "string" && safeEqual(ownerToken, room.hostToken);
const memberValid = memberRecord && typeof memberToken === "string"
  && safeEqual(await sha256Hex(memberToken), memberRecord.tokenHash);
const role = isOwner || (memberValid && sessionId === room.hostSessionId) ? "host" : "member";
```

이 인용은 조건을 보여 주는 발췌입니다. 실제 `memberValid`는 `Boolean(...)`으로 감싸며, 입장 흐름에는 기존 멤버 기록, 비밀번호, 승인 모드에 대한 검사도 있습니다.

방장 변경은 `assignHost`에서 처리합니다. 자동 승계에서는 서버가 기록한 입장 순서로 대상을 고릅니다. 방장 식별자가 바뀌거나 토큰이 없을 때 새 방장 토큰을 발급합니다. 강퇴는 대상 연결을 닫고 해당 `sessionId`의 재입장을 제한합니다. 사람이나 기기 자체에 대한 영구 차단으로 설명해서는 안 됩니다.

## P2P 자료와 서버 제어 메시지의 경계

서버에 자료를 저장하지 않는다는 설명만으로 통신 경로 전체가 설명되지는 않습니다. 연결 협상과 참가자 상태 같은 제어 메시지는 서버를 거칩니다. 앱 자료가 직접 연결을 사용하는지도 따로 확인해야 합니다.

수정 코드의 서버 중계 경로는 허용된 제어 메시지로 제한됩니다. 주석에도 용도가 적혀 있습니다.

  ```js
  // Control-message fallback while DataChannels are opening. App content never uses this path.
  case "relay-app": {
    if (raw.length > RELAY_MAX_BYTES) return;   // 16KB
    // ...
  ```

`RELAY_MAX_BYTES`는 16 * 1024이고 검사는 `raw.length`를 사용합니다. 인용의 16KB는 상수에 붙인 설명이며, 모든 유니코드 문자열의 실제 전송 바이트 수를 측정한다는 뜻은 아닙니다.

브레인스토밍의 블라인드 모드는 공개 전 카드를 `{ id, createdAt }`로 전달합니다. 본문은 작성자 기기에 남고 공개 시 작성자가 게시합니다. 작성자가 공개 전에 나가면 다른 참가자는 카드 본문을 복구할 수 없습니다.

수정 계획서에는 2026-09-14 과금 때문에 TURN을 사용하지 않기로 했다고 기록되어 있습니다. 직접 연결에 실패하면 안내를 표시하는 구현도 있습니다. 당시의 운영 결정이며, 현재 배포 설정은 공개 전에 다시 확인해야 합니다.

## 번호와 권한은 따로

`sessionId`는 상대를 가리키는 공개 값입니다. 입장, 재입장, 방장 권한은 입장권과 멤버 토큰, 방장 토큰으로 확인합니다.
