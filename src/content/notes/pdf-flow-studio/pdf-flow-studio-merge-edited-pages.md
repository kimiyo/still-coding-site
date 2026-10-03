---
title: "필기한 페이지는 이미지가 된다 — PDF Flow Studio가 편집 페이지를 합치는 방식"
description: "PDF Flow Studio가 여러 PDF의 페이지를 한 파일로 합칠 때 빈 페이지, 필기한 페이지, 손대지 않은 페이지를 어떻게 다르게 처리하는지 정리합니다. copyPages와 PNG 삽입의 차이, 캔버스 1200px 렌더링이 남기는 한계, 저장 시점을 코드로 보입니다."
pubDate: 2026-10-01
app: pdf-flow-studio
tags: ["PDF", "pdf-lib", "Canvas", "Design Decision"]
---

[PDF Flow Studio](https://pdf-flow-studio.still-coding.com/)는 여러 PDF에서 필요한 페이지만 골라 순서를 바꾸고, 펜이나 도형으로 필기한 다음 한 파일로 내려받는 앱입니다. 공부할 때 흩어져 있는 PDF 자료를 한 권으로 정리하려고 만들었습니다. 파일은 서버로 보내지 않고 브라우저 안에서만 읽고 합칩니다.

이 글은 합치는 부분, `app/src/shared/services/mergePdfService.ts`를 다룹니다. 이 파일에서 편집한 페이지와 그렇지 않은 페이지의 운명이 갈립니다.

## 페이지는 세 갈래로 나뉜다

`downloadMergedPdf`는 오른쪽 아래 Target 영역에 쌓인 페이지를 순서대로 돌면서 종류별로 다르게 처리합니다.

| 종류 | 판별 | 새 PDF에 넣는 방법 |
| --- | --- | --- |
| 빈 페이지 | `isBlank` | `addPage([너비, 높이])`. 크기 값이 없으면 842×595 |
| 필기한 페이지 | `editedImageDataUrl`이 있음 | PNG를 `embedPng`로 넣고 원본 페이지 크기에 맞춰 중앙 배치 |
| 손대지 않은 페이지 | 그 외 | `copyPages`로 원본 페이지를 그대로 복사 |

손대지 않은 페이지는 두 줄이면 끝납니다.

```ts
const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [pageIndex])
mergedPdf.addPage(copiedPage)
```

원본 페이지 객체를 통째로 옮기므로 글자는 여전히 글자이고 벡터는 여전히 벡터입니다. 선택하고 검색하고 확대해도 흐려지지 않습니다. PRD 3.3절에 "텍스트/벡터 품질 유지"가 요구사항으로 적혀 있었고, 이 줄이 그 요구사항을 채웁니다. 원본 파일은 파일마다 한 번만 `PDFDocument.load`하고 `Map`에 담아 두어, 같은 파일에서 여러 페이지를 뽑아도 다시 파싱하지 않습니다.

## 필기한 페이지는 캔버스 그림 한 장이다

필기한 페이지는 원본을 복사하지 않습니다. 편집 화면에서 저장한 PNG를 넣습니다.

```ts
const pngImage = await mergedPdf.embedPng(imageBytes)

const imageDimensions = pngImage.scale(1)
const scale = Math.min(pageWidth / imageDimensions.width, pageHeight / imageDimensions.height)
const drawWidth = imageDimensions.width * scale
const drawHeight = imageDimensions.height * scale
const x = (pageWidth - drawWidth) / 2
const y = (pageHeight - drawHeight) / 2

const page = mergedPdf.addPage([pageWidth, pageHeight])
page.drawImage(pngImage, { x, y, width: drawWidth, height: drawHeight })
```

`pageWidth`와 `pageHeight`는 원본 페이지에서 읽은 값입니다. 그래서 필기 여부와 상관없이 합친 파일의 종이 크기가 원본과 같고, 이미지는 비율을 유지하며 가운데에 놓입니다.

PNG가 나오는 곳은 `PageEditorDialog.tsx`입니다. 편집 화면은 pdf.js로 페이지를 캔버스에 그리고, 그 위에 펜, 형광펜, 직선, 화살표, 사각형, 타원, 텍스트, 이미지를 얹습니다. 캔버스는 가로 1200px로 고정해서 만듭니다.

```ts
const unscaled = pdfPage.getViewport({ scale: 1 })
const scale = 1200 / unscaled.width
const viewport = pdfPage.getViewport({ scale })
```

저장은 캔버스 전체를 그대로 PNG로 뽑습니다.

```ts
const dataUrl = canvas.toDataURL('image/png')
```

이 방식은 캔버스에 그린 모양이 PDF에 그대로 나온다는 장점이 있습니다. 화살표 머리 네 종류나 채우기 패턴처럼 캔버스에서만 정의한 모양을 PDF 그리기 명령으로 다시 구현하지 않아도 됩니다. 값은 치릅니다.

- 필기한 페이지의 글자는 이미지라서 선택도 검색도 되지 않습니다.
- 해상도의 상한이 가로 1200px입니다. 페이지 폭이 A4 세로(595pt)라면 인치당 약 145픽셀이고, 페이지가 클수록 더 낮아집니다. 이것은 코드의 상수에서 계산한 값이며 인쇄물로 확인한 값이 아닙니다.
- 파일 크기가 늘어납니다. 이 글을 쓰면서 크기를 재지는 않았습니다.

그래서 필기하지 않은 페이지는 끝까지 `copyPages`로 남기는 것이 중요합니다. 자료 한 권을 합쳐도 필기한 몇 장만 이미지가 되고 나머지는 원본 품질을 유지합니다.

## 다시 열면 이전 필기는 배경이 된다

필기한 페이지를 다시 열면 `editedImageDataUrl`을 캔버스 배경으로 불러오고, 그리기 항목(`items`)과 다시 실행 목록(`redoStack`)은 빈 배열로 시작합니다.

```ts
if (page.editedImageDataUrl) {
  const img = new Image()
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    context.drawImage(img, 0, 0)
    baseImageRef.current = context.getImageData(0, 0, canvas.width, canvas.height)
  }
  img.src = page.editedImageDataUrl
  return
}
```

실행 취소는 `items` 배열에서 항목을 꺼내는 방식이라, 한 번 저장한 필기는 다음에 열었을 때 항목이 아니라 배경 픽셀입니다. 저장 전에는 획 단위로 되돌릴 수 있고, 저장하고 나면 그 획들을 개별로 지울 수 없습니다. 지우려면 위에 흰색을 덮는 식이 됩니다.

## 저장은 이동하거나 닫을 때 한 번

저장 시점에는 계획과 구현이 다릅니다. 저장소의 `TODO.md`에는 페이지를 옮길 때 변경사항이 있으면 대화상자로 저장, 취소 후 이동, 이동 취소 중 하나를 고르게 하자는 안이 있습니다. 실제로 들어간 코드는 확인 없이 커밋합니다.

```ts
const commitEditsIfNeeded = (): void => {
  // 이동/닫기 시 1회만 커밋(=새 thumbnail 생성).
  if (items.length === 0) {
    setAutosaveStatus('idle')
    return
  }
  const dataUrl = canvas.toDataURL('image/png')
  setAutosaveStatus('idle')
  onSave(dataUrl)
}
```

이전 페이지, 다음 페이지, 닫기 버튼이 모두 이 함수를 먼저 부릅니다. 그리기 항목이 하나도 없으면 아무것도 저장하지 않으므로, 열어만 보고 닫은 페이지는 `editedImageDataUrl`이 생기지 않고 합칠 때도 `copyPages` 경로에 남습니다.

편집 화면의 자동 저장 표시는 상태 문구일 뿐입니다. 항목이 바뀌고 650ms가 지나면 `pending`에서 `ready`로 바뀌는 타이머가 있지만, PNG를 만드는 일은 위의 이동·닫기 시점에만 일어납니다. 2026-03-19에 "자동 저장 기능 구현" 커밋으로 들어간 부분입니다.

## 빈 페이지

빈 페이지에는 원본 파일이 없습니다. 기본 크기는 `App.tsx`의 `DEFAULT_BLANK_PAGE_SIZE`인 842×595(A4 가로, 포인트)이고, Target의 마지막 페이지가 있으면 그 페이지 크기를 따라갑니다. 마지막 페이지가 PDF 페이지면 `getViewport({ scale: 1 })`로 크기를 읽고, 빈 페이지면 그 페이지의 `blankWidth`, `blankHeight`를 물려받습니다. 여러 장을 이어 붙인 자료 사이에 끼워 넣어도 종이 크기가 어긋나지 않게 하려는 처리입니다.
