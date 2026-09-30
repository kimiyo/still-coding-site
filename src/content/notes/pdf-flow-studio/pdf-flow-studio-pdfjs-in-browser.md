---
title: "서버 없이 PDF를 읽는다 — PDF Flow Studio의 pdf.js 워커와 문서 캐시"
description: "PDF Flow Studio가 pdf.js로 PDF를 브라우저에서 읽는 구조를 정리합니다. 문서 Promise 캐시, 사본을 넘기는 이유, 600px 썸네일 생성, CDN에서 불러오는 워커 스크립트, Cursor 내장 브라우저용 Map 폴리필, 콘솔 성능 로그를 코드로 보입니다."
pubDate: 2026-10-01
app: pdf-flow-studio
tags: ["pdf.js", "Web Worker", "Cache", "Privacy"]
---

[PDF Flow Studio](https://pdf-flow-studio.still-coding.cc/)는 PDF 파일을 서버에 올리지 않습니다. 업로드한 파일은 `File`에서 읽은 `Uint8Array`로 브라우저 메모리에 올라가고, 읽는 쪽과 합치는 쪽이 이 바이트를 나눠 씁니다.

- 페이지를 그리는 일(썸네일, 편집 화면 배경)은 `pdfjs-dist`
- 페이지를 옮겨 새 파일을 만드는 일은 `pdf-lib`

합치는 쪽은 [다른 글](/notes/pdf-flow-studio-merge-edited-pages/)에서 다룹니다. 이 글은 읽는 쪽, `app/src/shared/services`의 `pdfDocCache.ts`와 `thumbnailService.ts`입니다. 2026-03-17에 `App.tsx` 하나에 있던 이 코드를 서비스 파일로 분리했고, 그 커밋 메시지에 "동작을 바꾸지 않고" 책임만 옮겼다고 적혀 있습니다.

## 문서는 Promise째 캐시한다

같은 PDF를 다시 열 때마다 파싱하지 않도록 파일 ID를 키로 하는 `Map`에 문서를 둡니다. 값은 문서가 아니라 문서를 만드는 Promise입니다.

```ts
const pdfDocPromises = new Map<string, Promise<PdfDocumentProxy>>()

export function getPdfDoc(fileId: string, data: Uint8Array): Promise<PdfDocumentProxy> {
  let docPromise = pdfDocPromises.get(fileId)
  if (docPromise) return docPromise

  docPromise = getPdfjs().then((pdfjsLib) => pdfjsLib.getDocument({ data: data.slice() }).promise)
  pdfDocPromises.set(fileId, docPromise)
  return docPromise
}
```

Promise를 저장하면 파싱이 끝나기 전에 같은 파일을 요청하는 두 번째 호출도 같은 Promise를 받습니다. 요청이 겹쳐도 파싱은 한 번만 일어납니다.

`data.slice()`는 바이트의 사본을 넘깁니다. 병합할 때 `PDFDocument.load(sourceFile.data)`가 같은 원본 바이트를 다시 읽으므로, 원본 `Uint8Array`를 그대로 남겨 두려고 사본을 만들어 pdf.js에 줍니다. 파일이 큰 만큼 메모리는 그 사본만큼 더 씁니다.

## 썸네일은 가로 600px, 페이지를 하나씩

파일을 고르면 `generateThumbnailsForFile`이 모든 페이지를 순서대로 캔버스에 그려 PNG 데이터 URL로 만듭니다.

```ts
const DEFAULT_THUMB_WIDTH = 600

for (let pageNumber = 1; pageNumber <= file.pageCount; pageNumber += 1) {
  const page = await doc.getPage(pageNumber)
  const unscaled = page.getViewport({ scale: 1 })
  const scale = thumbWidth / unscaled.width
  const viewport = page.getViewport({ scale })
  // canvas 생성 → page.render(...).promise → canvas.toDataURL('image/png')
}
```

페이지마다 `await`로 기다리는 직렬 루프입니다. 병렬로 그리지 않으므로 앞쪽 페이지부터 차례로 만들어집니다. 페이지가 수백 장인 PDF에서 걸리는 시간은 이 글을 쓰면서 재지 않았습니다.

## 워커 스크립트는 CDN에서 온다

pdf.js는 파싱과 렌더링을 웹 워커에서 하고, 그 워커 파일의 주소를 앱이 알려 줘야 합니다. 이 앱은 버전에 맞춰 unpkg 주소를 만듭니다.

```ts
pdfjsPromise = import('pdfjs-dist').then((mod) => {
  const pdfjsLib = mod as typeof PdfjsModule
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  return pdfjsLib
})
```

그래서 PDF를 처음 열 때 브라우저는 `unpkg.com`에서 스크립트 한 개를 내려받습니다. 이 요청에는 사용자의 PDF도 편집 내용도 실리지 않고, 스크립트를 받아 올 뿐입니다. 앱 소개에 적은 "서버로 전송하지 않는다"는 PDF 파일과 편집 내용에 대한 말입니다. 앱이 외부와 아무 통신도 하지 않는다는 뜻으로 쓰면 이 코드와 맞지 않습니다.

이 구성에는 이점이 하나, 약점이 둘 있습니다. 워커 파일이 번들에 들어가지 않아 빌드 결과가 작아집니다. 반면 unpkg에 연결되지 않는 환경에서는 PDF를 읽지 못하고, 외부 서비스가 내려가면 앱도 영향을 받습니다. 워커를 같은 도메인에서 내려받도록 바꾸는 일은 아직 하지 않았습니다.

## Cursor 내장 브라우저에서 터진 TypeError

`pdfDocCache.ts` 맨 위에는 `Map.prototype.getOrInsertComputed` 폴리필이 있습니다.

```ts
if (typeof (Map.prototype as unknown as { getOrInsertComputed?: unknown }).getOrInsertComputed !== 'function') {
  Map.prototype.getOrInsertComputed = function (key, make) {
    if (this.has(key)) return this.get(key)
    const value = make()
    this.set(key, value)
    return value
  }
}
```

코드 주석에 이유가 적혀 있습니다. pdfjs-dist가 내부 캐시에서 이 메서드를 쓰는데, Cursor 내장 브라우저(WebView)에는 없어서 썸네일을 만드는 중에 `TypeError`가 났다는 것입니다. Edge나 Chrome에서는 이미 있을 수 있으니 없을 때만 채워 넣습니다. 성능 로그를 넣은 커밋 메시지에는 `Made-with: Cursor`가 붙어 있습니다.

## 콜드와 웜을 콘솔에 남긴다

2026-03-17 "Add perf logging for cold/warm start analysis" 커밋으로 성능 로그가 들어갔습니다. 문서 캐시는 조회할 때마다 HIT와 MISS를 시각과 함께 콘솔에 씁니다.

```ts
console.log(`[Perf] [${nowHHMMSS()}] [PdfDoc] cache HIT (warm)`, { fileId })
console.log(`[Perf] [${nowHHMMSS()}] [PdfDoc] cache MISS (cold) -> getDocument()`, { fileId })
```

썸네일 생성은 호출 횟수를 세어 첫 호출을 `cold-first-call`, 이후를 `warm-subsequent-call`로 표시하고 페이지마다 시작과 완료를 남깁니다. 커밋 제목대로 첫 실행(cold)과 이후 실행(warm)을 비교하려는 로그이고, 로그 코드는 지금 배포본에도 그대로 남아 있습니다. 이 로그로 잰 수치는 저장소에 기록되어 있지 않아 이 글에 싣지 않았습니다.
