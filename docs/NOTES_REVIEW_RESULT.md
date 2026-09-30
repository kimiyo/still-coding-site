# 개발 노트 검토 결과

검토일: 2026-09-30. 대상은 초안 24편이며 기존 공개 글 4편은 수정하지 않았다. 글별 진행 상황은 [요청서 7절](./NOTES_REVIEW_REQUEST.md#7-검토-결과-기록)에 기록했다.

## 이번 수정의 범위

로컬 앱 코드와 커밋·개발 기록에 맞춰 기술 설명을 고쳤다. 문서에 적힌 과거 측정값, 테스트 기록, 코드 주석의 수치는 이번에 직접 측정한 결과와 구분했다. 확인되지 않은 개발 동기, 재현 경험, 청취 평가를 필자의 경험으로 쓰지 않았다. 반복되는 번호형 절과 교훈형 결말을 줄이고 금지 표현을 정리했다.

요청서 1절의 TODO 처리와 6.3절의 TODO 보존 지시가 함께 있어, AI 퇴고에 관한 구체적 지시인 6.3절을 적용했다. 원래 사용자 TODO와 맨 위 초안 주석은 모두 보존했다. CollaBoard에는 운영 배포 확인 TODO를 추가했다. 날짜와 `draft: true`도 유지했다. 초안 날짜는 실제 공개할 때 바꿔야 한다.

이번 작업은 글의 사실 확인과 편집이다. 사용자만 아는 경험의 보충, 운영 배포 인증, AdSense 승인 여부 판단은 완료로 표시하지 않는다.

## 대조한 저장소

아래 HEAD는 로컬 검토 기준이다. 운영 서버의 배포 버전이라는 뜻은 아니다.

| 앱 | 저장소 | HEAD |
| --- | --- | --- |
| Direct Play | `D:/dev/jh-personal-projects/direct-play-games` | `35a0eff` |
| Bus Explorer | `E:/dev-e/jh-projects/bus-route-in-trip` | `7eae87a` |
| 가나 공방 | `E:/dev-e/study-non-it/study-japanese-language-alphabet` | `f17d5b9` |
| Guitar Auto-Strum | `E:/dev-e/jh-projects/guitar-app-web` | `83a1e01` |
| CollaBoard | `E:/dev-e/jh-projects/collaboard-app` | `816d13c` |
| Songnote | `E:/dev-e/jh-projects/Piano-SongNote` | `0b83115` |
| Vocal Check | `E:/dev-e/jh-projects/vocal-check-app` | `a1ac345` |

## 사실 설명에서 고친 부분

- Direct Play: 게임 카탈로그는 9개다. 게임 주소 판별은 호스트의 첫 라벨을 사용하며 `workers.dev` 예외가 없다. P2P 해시 검사는 기대값이나 실제 계산값이 없으면 건너뛴다. 포켓 레이스의 다른 차량은 받은 상태를 직접 적용하고, 연결 시도 상수 2는 총 시도 횟수다. 방 카운터와 역지오코딩 대기열은 같은 전역 객체를 사용한다.
- Bus Explorer: 조회 순서는 서비스 대기, 캐시 hit, 키별 대기 순이다. 30분 최대 대기 상수는 사용되지 않으며 적응형 TTL은 기본 활성화다. 첫 승차의 대체 속도는 동일 노선 예측의 평균이다. 300쌍 경로 검색 결과와 관측 수집 시간은 당시 커밋 기록으로 명시했다.
- Guitar: 예약 창 0.25초와 루프 40Hz를 확인했다. 골든 테스트를 직접 실행해 178케이스·3726이벤트를 확인했다. 파일 최초 추가 커밋은 `aad59fa`, 날짜는 2026-08-13이다. 분산 필터 주석의 0.4센트는 두 구성 간 차이가 아니라 각 구성의 9번째 부분음 이동량이다.
- CollaBoard: 일회용 입장권, 멤버 토큰, 방장 토큰의 역할을 현재 코드와 대조했다. 기존 방에는 SHA-256 호환 분기가 남아 있다. 강퇴는 세션 식별자 기준 제한이며 사람·기기 영구 차단이 아니다. 과거 검증 수치를 개발 기록에 귀속했다.
- Songnote: 이벤트 길이는 숫자로 저장되며 모든 계산을 분수로 수행하지 않는다. 시각 편집마다 ABC로 직렬화한다. 텍스트 초안 보관, 모델 반영, 버전 저장 시점을 구분했다. `noindex,follow`는 비어 있지 않은 모든 쿼리 문자열에 클라이언트에서 적용된다.
- Vocal Check: 권한 대기 중 시작 버튼은 비활성화된다. 문서 숨김 이벤트로 실제 측정·대기 요청을 종료하지만 데모는 제외한다. 측정 화면의 광고 제외는 앱 자체 규칙이며 Google 정책의 의무 조항으로 설명하지 않았다. 마이크 제약 조건은 [W3C 명세](https://www.w3.org/TR/mediacapture-streams/#constrainbooleanparameters)와 대조했다.

- 가나 공방: 46+46 글리프, 42행·149표기를 코드와 대조했다. `clipPaths` 문자열과 `medians` 점열의 처리 차이를 정정했다. 서비스 워커 수정 두 건은 2026-08-05이며, 당시 오염 캐시를 직접 확인했다는 단정은 제거했다. iPad 이벤트 설명과 실제 기기 재현, IME 코드 동작과 선택 동기를 구분했다. 일본어 표기 기준과 용례 출처는 해당 글에 연결했다.

## 공개 전 남은 조건

1. 스파이 게임은 요청서 4절에 따라 권한 판별과 개인 메시지 라우팅 상세를 삭제했다. 관련 코드 블록 3개도 삭제했다. 게임 규칙·시간 처리 설명은 남겼지만, 보안 수정 확인 전 공개는 보류한다.
2. CollaBoard는 로컬 코드에 수정이 존재한다. 운영 배포를 확인하지 못했으므로 과거 취약점 재현 절차와 남은 약점의 상세 경로를 삭제했다. 인증 버전·배포 날짜 확인 후 공개를 판단한다. 두 보안 글의 삭제는 요청서 4절의 공개 제한을 적용한 것으로, 단순 윤문 예외다.
3. 사진 GPS 글의 Flutter 사진첩 기능은 로컬 구현과 운영 공개를 구분했다. 공개 여부 확인이 필요하다. 역지오코딩에는 위치 정보가 외부로 전달되며, [Nominatim 공식 사용 정책](https://operations.osmfoundation.org/policies/nominatim/)의 전체 앱 호출 제한·식별·출처 표시·개인정보 제한을 함께 확인해야 한다.
4. 확장 가나의 드문 예시는 앱에 들어 있다는 사실만으로 학습용 현대 용례가 되지 않는다. 일본어 검토와 교체 결정이 필요하다. 원본 앱 데이터는 수정하지 않았다.
5. 운영 표본·유입·실제 기기 경험은 사용자 TODO로 남겼다. 코드를 읽었다는 이유로 해당 경험을 확인한 것으로 처리하지 않았다.

## 링크와 공개 순서

앱 주소 7곳은 HTTP GET으로 최종 응답 200을 확인했다. 홈페이지 응답은 보안 수정 배포나 내부 기능 검증의 증거가 아니다. `/notes/…/` 링크의 대상 파일은 모두 존재한다.

초안 간 링크 8개는 대상이 함께 공개되어야 운영에서 열린다. 확장 가나 글의 초안 연결은 일반 설명으로 바꿨다.

| 링크가 있는 글 | 필요한 대상 글 |
| --- | --- |
| `bus-explorer-route-search-raptor`, `bus-explorer-segment-observation` | `bus-explorer-travel-time-estimate` |
| `direct-play-game-domains` | `direct-play-room-lifecycle` |
| `guitar-auto-strum-golden-transport-test` | `guitar-auto-strum-swing-humanize`, `guitar-auto-strum-string-physical-model` |
| `guitar-auto-strum-string-physical-model` | `guitar-auto-strum-swing-humanize`, `guitar-auto-strum-golden-transport-test` |
| `guitar-auto-strum-swing-humanize` | `guitar-auto-strum-look-ahead-scheduling` |

개별 공개라면 대상 글을 먼저 공개하거나 링크를 일반 텍스트로 바꿔야 한다. 기타 글들의 순환 링크는 같은 배포에서 공개하면 된다.

## 실행 검증

- Guitar: `test:golden`, `test:capo`, `test:feel`, `test:timbre` 통과. 골든 178케이스·3726이벤트, 음색 15케이스. 골든 갱신 명령은 실행하지 않았다.
- Direct Play: 기존 도메인·스파이 규칙·포켓 레이스 테스트 통과.
- CollaBoard: `node test/room-policy.test.js` 통과. 운영 접속이나 공격 재현은 실행하지 않았다.
- Vocal Check: `node test-mic-help.cjs`, `node test-ads.cjs` 통과.
- 가나 공방: 획순·확장 코스 기존 테스트 8개 통과.
- 원래 사용자 TODO 148개 전부 문구까지 보존. 운영 배포 확인 1개를 추가해 총 149개다. 초안 24편의 `pubDate`, `app`, `draft` 유지와 공개 글 4편 무변경 확인.
- 코드 블록은 스파이 글에서 공개 제한에 따라 삭제한 3개를 제외하고 원문 보존. 본문 금지 표현, 번호형 절 제목, `정리` 절, 존재하지 않는 내부 링크 0건. `git diff --check` 통과.
- `pnpm run build` 통과: Astro 진단 오류 0, 경고 0, 기존 미사용 `AppVisual` import 힌트 2개. 정적 페이지 33개 생성. 초기 콘텐츠 동기화에 중복 id 경고가 있었으나 파일명 중복은 없고, 개발 서버의 콘텐츠 저장소 초기화 후 24개 초안이 각각 정상 렌더링되었다.
- 개발 서버에서 초안 24개 URL의 HTTP 200, 초안 배지와 글 본문 렌더링을 확인했다. 이 검사는 레이아웃 스크린샷 검토나 실제 기기 기능 시험은 아니다. 확인용 개발 서버는 종료했다.

커밋과 운영 배포는 수행하지 않았다. 기존 미추적 `.claude/`와 `scripts/organize-notes.ps1`도 수정하지 않았다.
