---
title: "사진 한 장으로 '여기가 어디게?' — EXIF GPS, 지도 임베드, 그리고 사진 만 장 중 한 장 고르기"
description: "Direct Play 사진퍼즐의 EXIF GPS 읽기, 지도 표시, 장소 이름 추천을 설명합니다. 공개 여부를 확인해야 하는 로컬 Flutter 사진첩 구현과 60초 타임아웃에 관한 커밋 기록도 다룹니다."
pubDate: 2026-10-01
app: direct-play
game: photo-puzzle
tags: ["EXIF", "Geolocation", "Cloudflare Durable Objects", "Flutter", "Performance"]
---

[Direct Play](https://dp.still-coding.com/)의 사진퍼즐게임은 사진을 조각으로 맞춘 뒤 "이 사진은 어디서 찍었을까?"를 맞히는 게임입니다. 방장은 사진을 올리고 정답 장소를 정해야 합니다. 그런데 방장이 매번 장소 이름을 직접 입력하는 것은 번거롭습니다. 사진에는 이미 어디서 찍었는지가 들어 있을 수 있기 때문입니다.

브라우저에서는 EXIF의 좌표를 읽고 장소 이름을 추천합니다. 사진의 GPS에서 위치를 가져오면 장소가 정확하고, 방장이 이름을 매번 입력하지 않아도 되어 편합니다. 로컬 Flutter 구현에는 사진첩에서 GPS 사진을 찾는 코드도 있습니다. 두 경로는 사진을 고르는 방식부터 다릅니다.

## 사진 파일 안의 위치, EXIF

스마트폰으로 찍은 JPEG에는 EXIF 메타데이터가 들어 있을 수 있습니다. 촬영 설정과 사진을 옮긴 경로에 따라 GPS 좌표가 남기도 하고 빠지기도 합니다. 이 앱은 외부 라이브러리 없이 브라우저에서 `DataView`로 파일을 직접 읽어 좌표를 꺼냅니다. 서버에는 사진을 올리지 않습니다.

과정은 이렇습니다.

1. JPEG는 `0xFFD8`로 시작합니다.
2. 여러 세그먼트 중 `APP1`(`0xFFE1`)에 `"Exif"`로 시작하는 TIFF 데이터가 들어 있습니다.
3. 그 TIFF의 첫 표에서 `GPSInfo` 태그(`0x8825`)가 GPS 표의 위치를 가리킵니다.
4. GPS 표에서 위도(N/S와 도·분·초), 경도(E/W와 도·분·초)를 읽습니다.
5. 도·분·초를 소수 좌표로 바꿉니다. 남반구와 서반구는 부호를 뒤집습니다.

```js
// frontend/games/photo-puzzle/setup.js (요지)
function findTiffOffset(view) {
  // JPEG → APP1 세그먼트 중 "Exif\0\0"로 시작하는 것을 찾는다
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return -1;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda || marker === 0xd9) break;          // 이미지 데이터 시작이면 중단
    const size = view.getUint16(offset + 2, false);
    if (marker === 0xe1 && view.getUint32(offset + 4, false) === 0x45786966) return offset + 10;
    offset += 2 + size;
  }
  return -1;
}
```

GPS가 없는 사진(위치 정보를 끄고 찍었거나, 메신저를 거치며 정보가 지워진 사진)에서는 지도를 숨기고 "GPS가 없습니다. 게임에서 맞힐 장소명을 직접 입력하세요"라고 안내합니다. 실패해도 게임을 만들 수 있게 하려는 것입니다.

## API 키 없이 지도 보여 주기

좌표가 나오면 방장이 "이 위치가 맞는지" 확인할 수 있게 지도를 보여 줍니다. Google 지도의 임베드 주소를 iframe에 넣습니다.

```js
const src = `https://www.google.com/maps?q=${encodeURIComponent(coordinates)}&z=${zoom}&output=embed`;
```

좌표와 확대 수준(`z`)만 주소에 담으면 되고 API 키나 결제 설정이 필요 없습니다. 대신 마커의 모양이나 이벤트 같은 세밀한 제어는 할 수 없습니다. 설정 화면에서는 사진의 위치를 확인하는 용도로 씁니다. 확대 수준은 세로 슬라이더로 바꿀 수 있습니다.

## 좌표를 장소 이름으로: 공개 서버를 예의 바르게 쓰기

정답 장소에는 "37.5665, 126.9780" 같은 좌표 대신 "서울시청" 같은 이름을 입력합니다. 좌표를 주소로 바꾸는 역지오코딩은 OpenStreetMap의 공개 서버(Nominatim)를 씁니다. [Nominatim 이용 정책](https://operations.osmfoundation.org/policies/nominatim/)은 앱 전체의 요청을 초당 최대 한 번으로 제한하고, 앱 식별 정보와 출처 표기를 요구합니다. 현재 구현은 Worker를 거쳐 요청 간격과 캐시를 관리합니다.

### 요청을 한 줄로 세운다

하루 방 생성 수도 세는 전역 Durable Object(`DailyLimits`) 안에 역지오코딩 대기열이 있습니다. 역지오코딩 요청을 한 번에 하나씩 처리하고, 요청 사이에 최소 1.1초를 둡니다.

```js
// worker/limits.js
const NOMINATIM_MIN_INTERVAL_MS = 1_100;

enqueueReverseGeocode(latitude, longitude) {
  const result = this.reverseGeocodeQueue.then(() => this.reverseGeocode(latitude, longitude));
  this.reverseGeocodeQueue = result.then(() => undefined, () => undefined);   // 실패해도 대기열은 계속
  return result;
}
```

방이 아무리 많아도 공개 서버에는 초당 한 번 안팎으로만 요청이 갑니다.

### 결과를 캐시한다

한 번 찾은 장소는 7일 동안 저장해 두고, 같은 곳을 다시 물으면 서버에 가지 않습니다. 캐시 키에는 좌표를 소수점 3자리(약 110m)까지만 씁니다. 같은 관광지를 찍은 사진들의 좌표가 조금씩 달라도 한 번만 묻기 위해서입니다. 캐시 키만 3자리로 묶고, 실제 질의에는 5자리 좌표를 씁니다. 캐시 적중률을 높이려는 구분입니다. 위도의 소수점 3자리는 약 110m이고, 경도의 거리는 위도에 따라 달라집니다. 같은 캐시 칸 안에서는 이전에 받은 장소 이름이 재사용되므로 추천값을 확인해야 합니다. 캐시가 2,000개를 넘으면 오래된 것부터 지우고, 정리는 하루에 한 번만 합니다.

### 출처를 밝히고, 실패하면 직접 입력하게 한다

응답에는 OpenStreetMap 출처 표기(attribution)를 함께 담고, 요청에는 앱을 식별할 수 있는 `User-Agent`와 `Referer`를 붙입니다. 서버가 실패하면 "장소를 자동으로 찾지 못했습니다. 직접 입력해 주세요."라는 안내와 함께 502를 돌려줍니다. 자동 결과는 추천일 뿐이라, 방장은 그대로 쓰거나 고칠 수 있습니다.

## 로컬 Flutter 구현: GPS 사진을 표본으로 찾기

테스트 사용자에게 휴대폰 앱을 Flutter로 간략히 만들어 시험을 했습니다. 사진첩의 사진으로 퍼즐을 만드는 아래 내용은 그 피드백을 반영해 고친 것입니다.

커밋 기록에는 사진첩 전체를 훑던 방식이 웹 화면의 60초 타임아웃에 걸린 원인으로 적혀 있습니다. 그 분석을 번역하면 다음과 같습니다.

> 스캔은 모든 이미지를 불러온 뒤 하나씩 순서대로 `latlngAsync()`를 호출했다. 비용이 사진첩 크기에 비례해서, 사진이 만 장이면 첫 퍼즐이 나오기까지 수 분이 걸리는 만 번의 순차 왕복이 생겼다.

게임에는 GPS가 있는 사진이 한 장만 필요합니다. 그래서 전체 목록을 만들지 않고, 무작위 위치를 묶음으로 찔러 보도록 바꿨습니다.

```dart
static const int _probeBudget = 120;      // 확인해 볼 최대 사진 수
static const int _probeBatchSize = 10;    // 한 번에 병렬로 확인하는 수
static const int _minCandidates = 3;      // 후보를 3장 모으면 멈춘다

// 무작위 인덱스를 10개씩 뽑아 병렬로 확인, 후보가 모이면 중단
while (picked.length < _minCandidates && seen.length < budget) {
  final batch = /* 겹치지 않는 무작위 인덱스 10개 */;
  final assets = await Future.wait(batch.map((i) => _assetAt(root, i)));
  // 묶음 안에서는 병렬로 GPS를 확인한다
}
```

- 작업량은 사진첩이 만 장이든 십 장이든 최대 120장 확인으로 묶입니다.
- 후보를 3장 모으는 것은 읽지 못하는 사진에 대비한 처리입니다. 사진첩에는 읽지 못하는 사진(HEIF, 재시작 마커가 있는 JPEG, 손상된 파일)이 섞여 있어서, 한 장이 안 읽힌다고 판이 끝나면 안 되기 때문입니다. 여러 장을 뽑아 두고 쓸 수 있는 것이 나올 때까지 넘어갑니다.
- 찾아 둔 GPS 사진은 최대 200장까지 기억해 다음 판에 씁니다.

### 표본에서 찾지 못한 경우

표본 조사는 GPS 사진이 없다는 사실을 증명하지 못합니다. GPS 사진이 10장뿐인 사진첩에서 120장을 뽑았는데 못 만났다면 "GPS 사진이 없다"가 아니라 "이번에는 못 봤다"에 가깝습니다. 코드는 전체를 확인했는지에 따라 오류를 둘로 나눕니다.

- `no-gps-photo`: 사진첩 전체를 확인했는데도 없을 때만 씁니다(`exhaustive`).
- `no-gps-photo-in-sample`: 표본에서 못 찾았을 때 씁니다. 안내 문구에는 "다시 시도하면 다른 사진을 본다"고 적습니다.

진단 줄에도 `확인 N장`을 함께 보여 줘서, GPS 사진 0장이 "없다"인지 "이번엔 못 봤다"인지를 읽을 수 있게 했습니다. 이 구분도 테스트 사용자의 피드백을 반영해 고친 것입니다.

지도 iframe과 역지오코딩 요청에는 좌표가 외부 서비스로 전달됩니다. 사진 원본을 서버에 올리지 않는다는 설명과는 구분해야 합니다. Nominatim 정책은 개인정보나 기밀 자료를 보내지 말라고도 명시하므로, 위치가 민감한 사진을 어떻게 처리할지는 공개 전에 확인이 필요합니다.
