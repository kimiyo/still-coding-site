---
title: "시간표가 없는 버스 경로에 '몇 분'을 붙이는 법 — Bus Explorer의 소요 시간 추정"
description: "공공데이터에는 정류장 사이 소요 시간표가 없습니다. Bus Explorer가 실시간 도착 정보, 관측한 구간 중앙값, 기본값을 섞어 경로의 소요 시간을 추정하고, 그 추정이 어디서 왔는지 함께 보여 주는 방법을 코드로 정리합니다."
pubDate: 2026-10-01
app: bus-explorer
tags: ["Python", "FastAPI", "공공데이터", "Algorithm"]
draft: true
---

<!-- TODO(사용자): 초안입니다. TODO 주석을 채우고 사실과 다른 곳은 고친 뒤 frontmatter의 draft: true를 지우세요. -->

[Bus Explorer](https://bus-explorer.still-coding.cc/)는 울산 시내버스 노선을 지도에서 탐색하고, 출발지에서 도착지까지 갈 경로를 찾아 주는 앱입니다. 경로 후보를 보여 줄 때 가장 궁금한 것은 결국 **"그래서 몇 분 걸려요?"** 입니다.

그런데 이 질문에는 바로 답할 수 없습니다. 공공데이터포털의 TAGO 버스 API가 주는 데이터에는 이 답에 필요한 조각이 빠져 있기 때문입니다.

<!-- TODO(사용자): 이 앱을 만든 이유(울산 버스를 자주 타서? 공공데이터를 써 보고 싶어서?)를 한두 문장. -->

## 1. 아는 것과 모르는 것

| 알 수 있는 것 | 알 수 없는 것 |
| --- | --- |
| 노선이 지나는 정류장의 순서 | 정류장 사이를 가는 데 걸리는 시간 |
| 지금 정류장에 각 노선이 몇 초 뒤 도착하는지 | 30분 뒤에 탈 다음 정류장의 도착 예상 |
| 지금 버스가 몇 번째 정류장을 지나는지 | 어제 같은 시간에는 얼마나 걸렸는지 |

코드의 주석이 이 사정을 그대로 말합니다(번역).

> 네트워크 스냅샷은 여정이 몇 개의 정류장을 지나는지는 알지만, 그것이 얼마나 걸리는지는 알지 못한다. 그래서 여기 있는 모든 숫자는 추정이며, 각자 자기 출처를 달고 있다.

여기서 중요한 것은 마지막 문장입니다. 이 앱의 추정은 **숫자와 함께 그 숫자가 어디서 왔는지를 같이 계산**합니다.

## 2. 첫 승차: 기다리는 시간과 속도를 한 번에 얻는다

실시간 도착 정보 API는 한 정류장에 오는 모든 노선의 도착 예정을 한 번에 돌려줍니다. 항목마다 `arrtime`(몇 초 뒤 도착)과 `arrprevstationcnt`(몇 정류장 전)이 있습니다. 이 둘을 나누면 **그 노선이 지금 정류장당 몇 초로 달리고 있는지**가 나옵니다.

```python
# app/timing.py
@dataclass(frozen=True)
class Arrival:
    route_id: str
    seconds: float
    stops_away: int | None = None

    @property
    def seconds_per_stop(self) -> float | None:
        if not self.stops_away or self.stops_away <= 0:
            return None
        return self.seconds / self.stops_away
```

이 값은 두 가지에 쓰입니다.

- **기다리는 시간**: 지금 정류장에서 타려는 버스가 몇 초 뒤에 오는가.
- **첫 구간의 속도**: 그 버스가 지금 정류장당 몇 초로 가는가.

기다리는 시간을 구할 때 한 가지를 신경 썼습니다. 승차 정류장까지 **걸어가는 시간**이 있다는 점입니다. 2분 뒤에 도착하는 버스는 걷는 데 3분이 걸리는 사람에게는 소용이 없습니다.

```python
def _first_catchable(arrivals, route_id, after_seconds):
    """The earliest arrival of this route the rider can still reach."""
    candidates = [a for a in arrivals if a.route_id == route_id and a.seconds >= after_seconds]
    return min(candidates, key=lambda a: a.seconds, default=None)
```

걷는 시간보다 먼저 도착하는 버스는 건너뛰고, 탈 수 있는 첫 번째 버스를 고릅니다. 걷는 속도는 시속 약 4.3km(초속 1.2m)로 가정했습니다.

## 3. 그다음부터는 평균으로

환승해서 두 번째, 세 번째 버스를 탈 때는 실시간 도착 정보를 쓰지 않습니다. 이유는 코드의 주석에 있습니다.

> 도착 API는 언제나 "지금부터 얼마나 걸리는가"에 답한다. 이것은 30분 뒤에 도착할 정류장에 대해서는 틀린 질문이다.

그래서 환승 대기는 **배차 간격의 절반**으로 잡습니다. 배차 간격을 모르는 노선은 15분으로 가정하고, 아무리 짧아도 2분(120초)은 기다린다고 계산하며, 1시간을 넘는 값은 "평균 대기"라고 말하기 부적절하다고 보고 상한을 둡니다.

```python
DEFAULT_HEADWAY_MINUTES = 15.0
MIN_TRANSFER_WAIT_SECONDS = 120.0
MAX_ESTIMATED_WAIT_SECONDS = 3600.0

def headway_wait_seconds(headway_minutes):
    minutes = headway_minutes if headway_minutes and headway_minutes > 0 else DEFAULT_HEADWAY_MINUTES
    return min(minutes * 60.0 / 2.0, MAX_ESTIMATED_WAIT_SECONDS)
```

<!-- TODO(사용자): 배차 간격(headway) 데이터는 어디서 오는지, 15분 기본값은 울산 노선의 실제 분포를 보고 정한 것인지 확인해 주세요. -->

## 4. 버스를 지켜보고 구간 시간을 배운다

탑승 중 구간의 시간은 정류장 수에 속도를 곱하면 되지만, 그 속도가 노선과 구간마다 다르다는 것이 문제입니다. 그래서 Bus Explorer는 **실측 값**을 모읍니다.

차량 위치 API는 각 버스가 몇 번째 정류장에 있는지를 알려 줍니다. 같은 버스가 N번째에서 N+1번째로 넘어가는 순간을 잡으면, 운영사의 예측이 아니라 **실제로 걸린 시간**을 얻을 수 있습니다.

```python
# app/segments.py — 도착 시각은 "마지막으로 이전 정류장에서 본 시각"과
# "처음으로 이 정류장에서 본 시각"의 중간으로 잡는다
entered_at = (previous.last_at + at) / 2
```

위치를 60초마다 확인하기 때문에 한 번의 측정에는 최대 그 간격만큼의 오차가 있습니다. 그래서 도착 시각을 두 관측의 **중간**으로 잡아 오차를 양쪽으로 나눕니다. 이 오차는 좌우 대칭이어서 여러 번 측정한 **중앙값**은 실제 값에 가까워집니다. 반대로 한 번의 측정은 믿지 않습니다. 구간마다 최소 5개의 표본이 쌓여야 중앙값을 저장하고, 그 전에는 기존 값을 지웁니다.

```python
MIN_SAMPLES_FOR_MEDIAN = 5     # app/observations.py
```

수집은 별도의 상주 서비스(`collector`)가 맡습니다. 위치 API의 하루 호출 한도(키 전체 10,000회)를 화면의 실시간 차량 위치가 함께 쓰기 때문에, 수집기는 기본 6,000회만 쓰고 멈추게 했습니다.

<!-- TODO(사용자): 지금까지 수집한 실제 규모(구간 수, 노선 수, 표본 수)를 넣으면 좋습니다. API `/api/…`의 observations coverage 값(segments_with_median, routes_covered)을 확인해 보세요. 수집을 언제부터 얼마나 돌렸는지도. -->

## 5. 세 가지 출처의 우선순위

구간 하나의 시간은 다음 순서로 정합니다.

1. **관측한 중앙값**이 있으면 그것을 쓴다.
2. 없으면 **타려는 버스의 지금 속도**(첫 승차 구간에 한해)를 쓴다.
3. 그것도 없으면 **기본값(정류장당 100초)**을 쓴다.

```python
def ride_seconds(leg, fallback_pace):
    hops = int(leg.get('stop_hops') or 0)
    measured = leg.get('segments')          # 구간별 관측 중앙값, 없으면 None
    if not measured:
        return hops * fallback_pace, 0
    total, known = 0.0, 0
    for index in range(hops):
        seconds = measured[index] if index < len(measured) else None
        if seconds is None:
            total += fallback_pace           # 이 구간만 대체값
        else:
            total += float(seconds)
            known += 1
    return total, known
```

한 번의 탑승 안에서도 구간마다 출처가 섞일 수 있습니다. 어떤 구간은 실측 중앙값, 어떤 구간은 현재 속도로 계산하는 식입니다. 그래서 함수는 **몇 개의 구간이 실측이었는지**(`known`)도 함께 돌려줍니다.

기본값 100초는 임의의 숫자가 아니라, 실제로 관측한 한 번의 값(9개 정류장에 905초)에서 온 것이라고 코드에 적어 두었습니다. 실측이 쌓이기 전까지 쓰는 임시 값입니다.

## 6. 추정을 정직하게 보여 주기

`estimate_journey`는 총 시간만 돌려주지 않고, 그 시간이 어디서 왔는지도 같이 돌려줍니다.

```python
return {
    'total_minutes': max(1, round(total / 60)),
    'wait_seconds': ..., 'wait_source': wait_source,   # 'live' 또는 'headway'
    'pace_source': pace_source or 'not_applicable',    # 'live' 또는 'default'
    'observed_segments': observed_segments,            # 실측 구간 수
    'total_segments': total_segments,                  # 전체 구간 수
}
```

API 응답에는 경고도 붙습니다. 화면이 보여 줄 수 있는 것 이상으로 자신 있게 말하지 않기 위해서입니다.

```python
'basis': 'live_arrivals_at_first_boarding_stop_only',
'warnings': ['transfer_wait_is_half_headway', 'ride_time_is_estimated'],
```

화면에서도 두 경우를 다르게 표시합니다.

- 실시간 도착 정보가 있으면: **"N번 4분 후 · 도착까지 약 27분"**
- 없으면: **"배차 기준 약 27분 · 실시간 도착정보 없음"** (흐린 스타일)

<!-- TODO(사용자): 위 예시의 숫자는 표시 형식을 보이려고 쓴 가상의 값입니다. 실제 화면 캡처로 바꾸거나, 실제 노선 하나의 예시를 넣어 주세요. -->

## 7. 아직 모르는 것

- **시간대를 구분하지 않는다.** 관측 값은 구간별 중앙값 하나로 합쳐집니다. 출퇴근 시간의 정체와 한낮의 흐름이 같은 값으로 섞입니다. (코드에서 시간대·요일로 나누는 부분은 찾지 못했습니다.)
- **환승 대기는 평균이다.** 환승 대기는 실제 도착 정보가 아니라 "배차 간격의 절반"이어서, 운이 나쁘면 크게 틀립니다. 그래서 응답에 경고를 붙입니다.
- **후보는 3개까지, 승차 정류장은 3곳까지.** 후보 하나마다 실시간 도착 API를 한 번 호출하므로 상한을 두었고, 넘으면 422 오류를 돌려줍니다.

<!-- TODO(사용자): 시간대 구분을 해 볼 계획이 있는지, 실제 이용 시 추정과 실제 소요 시간이 얼마나 맞았는지 비교한 경험이 있으면 적어 주세요. 이 글에서 가장 궁금한 부분입니다. -->

## 정리

버스 경로의 소요 시간에는 정답이 없습니다. 그래서 이 앱은 정답인 척하지 않고, **가진 정보 중 가장 믿을 만한 것부터 쓰고, 각 숫자에 출처를 달았습니다.** 실시간 도착, 관측한 중앙값, 기본값의 순서로 내려가되, 사용자에게는 어디까지가 실측이고 어디부터가 가정인지를 보여 줍니다.

<!-- TODO(사용자): 마지막에 "다시 만든다면" 한두 문장. -->
