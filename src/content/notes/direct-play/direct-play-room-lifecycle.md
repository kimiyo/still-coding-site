---
title: "방에도 수명이 있다 — 알람으로 청소하고 하루 500방으로 지키는 Direct Play의 서버 비용 설계"
description: "Direct Play의 방은 설정 중 1시간, 활동 없이 3일, 보관 후 7일이 지나면 스스로 사라집니다. Durable Object 알람으로 방을 정리하는 방법, 쓰기를 줄이는 장치, 하루 500방 한도를 전역 객체 하나로 세는 방법을 코드로 정리합니다."
pubDate: 2026-10-01
app: direct-play
tags: ["Cloudflare Durable Objects", "Alarms", "Cost", "Architecture"]
draft: true
---

<!-- TODO(사용자): 초안입니다. TODO 주석을 채우고 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

서버를 두는 서비스에서 흔히 잊는 것이 **청소**입니다. 방을 만드는 기능은 처음부터 만들지만, 쓰지 않는 방을 지우는 기능은 나중에 만들게 됩니다. 그리고 그때는 이미 쌓여 있습니다.

[Direct Play](https://dp.still-coding.cc/)는 방을 만드는 순간부터 **언제 사라질지**를 정해 두었습니다. 이 글은 그 수명 설계와, 서버 비용을 작게 유지하려고 넣은 한도를 정리합니다.

<!-- TODO(사용자): 이렇게 방에 수명을 준 이유. (무료 플랜 한도 때문에? 개인 사진이 남지 않게 하려고? 둘 다?) 본인의 말로 한두 문장. -->

## 1. 방의 일생: 세 가지 상태

방은 세 가지 상태를 거칩니다.

| 상태 | 의미 | 다음으로 넘어가는 조건 |
| --- | --- | --- |
| **draft**(설정 중) | 방장이 사진과 설정을 준비하는 중 | 만든 지 **1시간**이 지나면 삭제 |
| **published**(활성) | 설정이 끝나 플레이할 수 있음 | 마지막 활동 후 **3일**이 지나면 보관 |
| **archived**(보관됨) | 정보와 결과만 볼 수 있고 게임은 불가 | 보관 후 **7일**이 지나면 삭제 |

```js
// worker/utils.js
export const MAX_DAILY_ROOMS = 500;
export const DRAFT_TTL_MS    = 60 * 60 * 1000;             // 1시간
export const ACTIVE_IDLE_MS  = 3 * 24 * 60 * 60 * 1000;    // 3일
export const ARCHIVED_TTL_MS = 7 * 24 * 60 * 60 * 1000;    // 7일
export const TOUCH_MIN_INTERVAL_MS = 60 * 1000;
```

즉 아무도 들어오지 않는 방은 최대 10일(3일 + 7일) 안에 완전히 사라지고, 만들다 만 방은 한 시간이면 사라집니다.

## 2. 누가 청소하나: Durable Object 알람

이 앱은 방 하나를 Durable Object 하나로 다룹니다(방 ID로 객체를 찾습니다). Durable Object에는 **알람**이 있습니다. 미래의 특정 시각에 객체를 깨우는 예약입니다. 그래서 "주기적으로 모든 방을 훑는 청소 작업" 대신, **방이 자기 만료 시각에 스스로 깨어나** 자기 상태를 확인합니다.

```js
async scheduleLifecycleAlarm(room) {
  let when = null;
  if (room.status === "draft") {
    when = Date.parse(room.createdAt) + DRAFT_TTL_MS;
  } else if (room.status === "published") {
    when = Date.parse(room.lastActiveAt || room.createdAt) + ACTIVE_IDLE_MS;
  } else if (room.status === "archived") {
    when = Date.parse(room.archivedAt || room.lastActiveAt) + ARCHIVED_TTL_MS;
  }
  if (Number.isFinite(when) && when > Date.now()) {
    await this.ctx.storage.setAlarm(when);
  } else if (Number.isFinite(when)) {
    await this.ctx.storage.setAlarm(Date.now() + 1000);   // 이미 지났다면 곧바로
  }
}
```

알람이 울리면 상태별로 할 일이 다릅니다.

- **draft**가 1시간을 넘겼으면: 접속자에게 `room-deleted`를 알리고 저장소를 통째로 비웁니다(`deleteAll`).
- **published**가 3일 동안 조용했으면: **보관됨**으로 바꿉니다. 이때 결과 기록은 20개로 줄이고, 자원 정보에서 썸네일 같은 큰 필드를 버리고 `archived: true`를 표시하고, 접근 권한 기록도 32개로 자릅니다. 대기 중이던 자원 요청도 비웁니다.
- **archived**가 7일을 넘겼으면: 삭제합니다.

이 방식의 장점은 청소가 **요청에 의존하지 않는다**는 점입니다. 방문자가 없어도 시각이 되면 알람이 울립니다. 반대로, 폴링으로 청소하면 아무도 접속하지 않는 방이 오히려 영영 남을 수 있습니다.

<!-- TODO(사용자): 알람 대신 "누가 요청할 때 만료를 검사하는" 방식(lazy 검사)을 먼저 써 봤는지, 알람으로 바꾼 이유가 있는지. -->

## 3. "활동"을 세되, 쓰기는 줄인다

3일 동안 활동이 없으면 보관한다면 "활동"을 기록해야 합니다. 입장, 설정 완료, 결과 제출 같은 동작마다 마지막 활동 시각(`lastActiveAt`)을 갱신합니다. 문제는 이 기록도 **저장소 쓰기**라는 것입니다. 참가자가 계속 오가는 방에서 매번 쓰면 쓰기가 크게 늘어납니다.

그래서 `touchRoom`은 마지막 갱신으로부터 **1분 이내**면 아무것도 하지 않습니다.

```js
async touchRoom(room, force = false) {
  const now = Date.now();
  const last = Date.parse(room.lastActiveAt || "") || 0;
  if (!force && now - last < TOUCH_MIN_INTERVAL_MS) {
    return room;                       // 1분 안에는 다시 쓰지 않는다
  }
  room.lastActiveAt = new Date(now).toISOString();
  await this.saveRoom(room);
  await this.scheduleLifecycleAlarm(room);   // 알람도 새 시각으로 옮긴다
  return room;
}
```

수명이 3일 단위인 서비스에서 1분 오차는 아무 문제가 아닙니다. 정밀도를 조금 포기하고 쓰기를 크게 줄이는 거래입니다. `force`는 방을 보관에서 되살릴 때처럼 반드시 기록해야 하는 경우에 씁니다.

## 4. 보관은 삭제가 아니다: 되살리기

보관된 방은 바로 지워지지 않고 7일간 남습니다. 방장이 (또는 자원을 가진 참가자가) 돌아오면 **되살릴 수 있습니다**(`restore`).

```js
if (room.status !== "archived") {
  return json({ ok: false, error: "only archived rooms can be restored" }, 409);
}
room.status = "published";
room.archivedAt = null;
// ... 보관 표시를 지우고
await this.touchRoom(room, true);      // 활동 시각을 갱신하고 알람을 다시 건다
this.broadcast("room-restored", { /* ... */ });
```

3일 뒤에 초대 링크를 다시 누른 친구들이 "방이 사라졌다"가 아니라 "보관됨, 되살릴 수 있음"을 만나게 하려는 장치입니다. 다만 게임 자원(사진)은 방장이나 참가자의 브라우저에 있는 것이므로, 되살리려면 자원을 가진 사람이 있어야 합니다.

## 5. 하루 500방: 전역 객체 하나로 세기

무료 플랜에서 서비스를 열어 두면 예기치 않게 트래픽이 늘 때가 걱정입니다. 그래서 하루에 만들 수 있는 방 수에 상한(500개)을 두고, 이를 세는 **전역 Durable Object 하나**(`DailyLimits`, 이름 `global`)를 둡니다. 방을 만들기 전에 이 객체에 "한 자리 예약"을 요청합니다.

```js
// worker/limits.js — 하루(UTC) 단위 카운터
if (request.method === "POST" && path.endsWith("/reserve")) {
  const day = utcDayKey();
  const key = `count:${day}`;
  const count = Number((await this.ctx.storage.get(key)) || 0);
  if (count >= MAX_DAILY_ROOMS) return overloadResponse();   // 503
  await this.ctx.storage.put(key, count + 1);
  await this.purgeOldDayKeys(day);      // 지난 날짜 카운터는 지운다
  // ...
}
```

- 한도를 넘으면 503과 함께 "서버가 과부하 상태입니다. 일일 방 생성 한도(500개)에 도달했습니다. 내일 다시 시도해 주세요."를 돌려줍니다.
- 카운터는 UTC 날짜 키로 세고, 새 날짜가 되면 이전 날짜 키를 지워 **저장소가 커지지 않게** 합니다(코드 주석: "Free 저장소를 작게 유지").
- 한도는 **서버 방**에만 적용됩니다. 혼자 하는 게임(예: SUM DROP)은 서버 방을 만들지 않으므로 한도를 쓰지 않습니다.

여기서 한 가지 눈여겨볼 점이 있습니다. 이 앱의 개발 문서(재사용 기술 모음)는 "**모든 방을 하나의 객체에 넣지 말 것, 전역 단일 객체 금지**"라고 적었습니다. 그런데 `DailyLimits`는 전역 단일 객체입니다. 이유는 다릅니다. 방 데이터는 방마다 분산해야 확장되지만, **하루 방 수를 세는 일은 정확한 직렬 처리가 필요하고 호출량이 적기** 때문입니다. 이 객체는 방을 만들 때마다 한 번만 불리고, 방 안의 메시지는 전혀 거치지 않습니다.

<!-- TODO(사용자): 500이라는 숫자를 정한 근거(무료 플랜 한도에서 역산한 값인지)와, 실제로 한도에 도달한 적이 있는지. 하루 평균 방 생성 수를 알 수 있다면 넣어 주세요. -->

## 6. 한계

- **예약은 되돌리지 않는다.** 방 생성 전에 자리를 예약하기 때문에, 이후 방 생성이 실패해도 카운트는 그대로입니다. 삭제된 방도 그날의 카운트를 되돌려 주지 않습니다.
- **한도는 전역이다.** 500개가 차면 모든 사용자가 그날 새 방을 만들 수 없습니다. 한 사람이 남용하면 모두가 영향을 받을 수 있습니다.
- **같은 날 중복 요청.** 카운터는 요청이 도착한 순서대로 하나씩 처리되므로 정확하지만, 사용자 단위 제한은 없습니다.

<!-- TODO(사용자): 남용 대응(사용자별 제한, 봇 방지 등)을 생각한 적이 있는지. 있다면 계획을, 없다면 이 절을 그대로 두세요. -->

## 정리

방의 수명을 처음부터 설계에 넣은 덕분에, 서버는 **쓰지 않는 것을 스스로 정리**하고 저장소는 커지지 않습니다. 정리는 알람에게 맡겼고, 쓰기는 1분 단위로 뭉쳤고, 하루 방 수는 전역 카운터 하나로 지켰습니다. 정밀도를 조금 포기하고 운영의 단순함과 비용을 얻는 거래였습니다.

<!-- TODO(사용자): 마지막에 "다시 만든다면" 한두 문장. -->
