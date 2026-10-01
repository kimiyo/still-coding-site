---
title: "배포 뒤 MIME 오류가 남았다 — 서비스 워커의 빌드 파일 캐시를 걷어내기"
description: "가나 공방의 MIME 오류 관련 커밋 두 개와 현재 서비스 워커 코드를 대조합니다. HTML 폴백을 캐시에서 거르는 수정 뒤에 빌드 파일 요청을 가로채지 않도록 바뀐 과정, 기존 캐시를 지우는 장치, 오프라인 동작의 확인 범위를 다룹니다."
pubDate: 2026-10-01
app: kana-atelier
tags: ["PWA", "Service Worker", "Cache", "Debugging"]
---

[가나 공방](https://study-hiragana.still-coding.cc/)의 서비스 워커에는 빌드 파일을 가로채지 않는 예외가 있습니다. `/assets/` 요청이면 캐시를 찾지도 않고 `respondWith`도 부르지 않습니다.

이 규칙은 2026년 8월 5일의 MIME 오류 수정 두 건에서 나왔습니다. 오전에는 HTML 응답을 캐시에 넣지 않는 검사를 추가했고, 오후에는 빌드 파일 요청 자체를 서비스 워커에서 제외했습니다. 여기서는 커밋과 현재 코드로 확인되는 변경을 따라갑니다. 오류가 난 기기와 당시 캐시 내용은 아래 사용자 확인 항목으로 남겨 둡니다.

## 수정 기록이 가리키는 실패 경로

두 커밋 메시지는 배포 뒤 서비스 워커 캐시 때문에 JS/CSS MIME 오류가 났다고 기록합니다. 현재 `public/sw.js`에도 JS/CSS 주소 아래 HTML이 저장된 항목을 버린다는 주석과 코드가 있습니다. 이 기록만으로 당시의 응답 본문이나 기존 사용자에게만 재현됐는지까지 확인할 수는 없습니다.

Vite의 빌드 파일에는 해시가 붙습니다(`/assets/index-3f9a….js`). 배포로 옛 파일이 없어졌을 때 서버가 그 주소에 HTML을 반환하면 브라우저가 기대한 JS와 응답의 종류가 맞지 않습니다. 그 HTML을 성공 응답이라는 이유로 캐시에 저장하면 같은 주소를 다시 요청해도 HTML이 돌아오는 경로가 생깁니다.

두 수정은 이 경로를 막습니다. 첫 수정은 HTML 응답의 저장을 거르고, 두 번째 수정은 `/assets/` 요청을 서비스 워커에서 제외하며 SPA 폴백을 제거합니다. 이는 커밋과 코드가 겨냥한 원인 설명입니다. 당시 브라우저의 캐시 항목을 직접 조사한 기록이 확보되기 전까지 실제 장애 원인으로 확정하지 않습니다.

## 첫 번째 수정: 서비스 워커를 똑똑하게 만들다(오전)

첫 수정(`d915060`)은 서비스 워커의 방어를 늘리는 방향이었습니다.

- HTML 문서(화면 진입)는 **네트워크 우선**으로 바꿔서 새 빌드의 해시를 항상 받는다.
- 자산 주소에 HTML이 돌아오면 **캐시에 넣지 않는다**(`canCacheResponse`).
- `response.clone()`을 본문이 소비되기 전에 만든다(타이밍 버그 수정).
- `_redirects`에 `/assets/*  /404  404`를 추가해, 없는 해시 파일은 HTML이 아니라 404를 돌려주게 한다.

같은 날 오후의 커밋 `ea0af05`는 MIME 오류를 재수정했다고 기록합니다. 두 번째 변경이 있었다는 사실은 확인되지만, 첫 수정 뒤의 신고 경로나 재현 조건은 커밋만으로 알 수 없습니다.

## 오후 수정: 빌드 파일 요청을 제외하다

두 번째 수정에서는 `/assets` 요청의 가로채기를 중단하고 SPA 폴백을 제거했습니다. 아래는 현재 코드에 남아 있는 예외 처리입니다.

```js
// public/sw.js
function isBuildAsset(url) {
  // Vite hashed bundles — browser/CDN cache is enough; SW must not poison them with HTML.
  return url.pathname.startsWith("/assets/");
}

// Critical: do not intercept Vite build assets. A single bad HTML cache entry
// breaks the whole app with MIME type errors after deploys.
if (isBuildAsset(url)) {
  return;        // respondWith를 부르지 않으면 브라우저가 평소대로 처리한다
}
```

`fetch` 이벤트에서 `respondWith`를 부르지 않고 그냥 돌아오면, 그 요청은 서비스 워커가 없는 것처럼 브라우저가 알아서 처리합니다. 해시가 달라지면 요청 주소도 달라집니다. 현재 코드는 이 파일의 캐시 처리를 브라우저와 CDN에 맡깁니다. 서비스 워커의 HTML 캐시가 해당 요청에 답하지 않도록 경로를 분리한 것입니다.

`_redirects`의 SPA 폴백도 아예 지웠습니다.

```text
# No SPA catch-all on purpose.
# This app uses in-memory screens (no path routes). A /* → index.html rewrite
# makes missing /assets/*.js|css return HTML (MIME type errors after deploys).
```

이 앱은 화면을 주소가 아니라 앱 안의 상태로 전환하므로 "없는 주소는 `index.html`"이라는 규칙이 필요 없었습니다. 두 번째 수정은 이 규칙을 없애 자산 주소가 HTML로 바뀌는 경로를 줄였습니다.

## 복구를 위한 장치들

기존 캐시에 잘못된 항목이 남았을 가능성에 대비한 장치도 있습니다.

- **캐시 이름을 올린다**(`kana-atelier-v5`). 서비스 워커가 활성화될 때 기존 캐시를 전부 지우고 다시 만듭니다.
- **서비스 워커 파일은 항상 네트워크에서** 받습니다(`/sw.js`는 캐시하지 않음). 그러지 않으면 고친 서비스 워커를 받지 못합니다.
- **등록 시 `updateViaCache: "none"`**, 그리고 탭이 다시 보일 때마다 `registration.update()`를 불러 새 서비스 워커를 빨리 집어냅니다.
- **새 서비스 워커가 제어권을 잡으면 한 번만 새로고침**합니다(`controllerchange`). 오염된 캐시를 쥔 채 화면을 이어 가지 않게 하려는 것입니다.
- 캐시에서 **HTML이 JS/CSS 자리에서 나오면 버립니다**(`cacheFirst`). 이미 오염된 항목을 만나면 지우고 네트워크로 갑니다.

```js
// 브라우저에 새 SW가 자리 잡으면 한 번만 새로고침
let refreshing = false;
navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (refreshing) return;      // 무한 새로고침 방지
  refreshing = true;
  window.location.reload();
});
```

## 지금의 캐시 규칙

| 요청 | 처리 | 이유 |
| --- | --- | --- |
| `/sw.js` | 항상 네트워크 | 서비스 워커의 업데이트가 캐시에 갇히지 않게 |
| `/assets/*` (빌드 산출물) | **서비스 워커가 개입하지 않음** | 잘못된 캐시가 앱 전체를 죽인다 |
| `/mnemonic/*`(연상 카드 그림) | 네트워크 우선, 오프라인이면 저장본 | 같은 주소로 그림이 교체될 수 있다 |
| `/info.css`, HTML 문서 | 네트워크 우선 | 새 빌드와 문서 변경을 바로 반영 |
| 그 밖의 정적 파일 | 캐시 우선 | 속도와 오프라인 |

## 오프라인 범위도 다시 확인해야 한다

`/assets/*`를 서비스 워커에서 제외했으므로 앱 셸 HTML이 저장돼 있다는 사실만으로 오프라인 실행을 보장할 수는 없습니다. 필요한 JS와 CSS가 브라우저 캐시에 남아 있어야 합니다. HTML 캐시의 유무와 앱 전체가 비행기 모드에서 열리는지는 별개의 확인 항목입니다.
