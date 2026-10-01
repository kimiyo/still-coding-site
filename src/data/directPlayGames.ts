// Direct Play 카드 미리보기에서 순서대로 소개하는 게임들.
// 원본: direct-play-games/frontend/games/catalog.js — 게임이 추가되면 여기와 public/images/apps/direct-play/ 를 함께 갱신한다.
type Localized = { ko: string; en: string };

export interface DirectPlayGame {
  id: string;
  title: Localized;
  tags: Localized;
  pitch: Localized;
  players: [min: number, max: number];
  minutes: number;
  image: string;
  icon: string;
}

const base = "/images/apps/direct-play";

export const directPlayGames: DirectPlayGame[] = [
  { id: "photo-puzzle", title: { ko: "사진퍼즐게임", en: "Photo Puzzle" }, tags: { ko: "협동 · 퍼즐", en: "Co-op · Puzzle" }, pitch: { ko: "사진 조각을 맞추고 숨겨진 장소를 찾아보세요.", en: "Assemble photo tiles and discover hidden places." }, players: [1, 8], minutes: 10, image: `${base}/photo-puzzle.webp`, icon: `${base}/icons/photo-puzzle.webp` },
  { id: "pinhole", title: { ko: "PINHOLE", en: "PINHOLE" }, tags: { ko: "관찰 · 추리", en: "Observation · Deduction" }, pitch: { ko: "작은 원형 시야로 장면을 관찰하고 숨은 정답을 맞혀 보세요.", en: "Scan a scene through a tiny circular window and identify what is hidden." }, players: [1, 8], minutes: 3, image: `${base}/pinhole.svg`, icon: `${base}/icons/pinhole.svg` },
  { id: "number-baseball", title: { ko: "숫자 야구", en: "Number Baseball" }, tags: { ko: "두뇌 · 추리", en: "Brain · Deduction" }, pitch: { ko: "스트라이크·볼 힌트로 비밀 숫자를 추리하세요.", en: "Deduce the secret number using strike and ball clues." }, players: [1, 8], minutes: 6, image: `${base}/number-baseball.webp`, icon: `${base}/icons/number-baseball.svg` },
  { id: "pocket-race", title: { ko: "포켓 레이스", en: "Pocket Race" }, tags: { ko: "파티 · 레이싱", en: "Party · Racing" }, pitch: { ko: "QR로 모여 30초 동안 부딪히며 질주하세요.", en: "Gather via QR code and race together for 30 fast seconds." }, players: [2, 4], minutes: 1, image: `${base}/pocket-race.webp`, icon: `${base}/icons/pocket-race.svg` },
  { id: "sum-drop", title: { ko: "SUM DROP", en: "SUM DROP" }, tags: { ko: "액션 · 퍼즐", en: "Action · Puzzle" }, pitch: { ko: "숫자 블록을 떨어뜨려 합 10 연쇄를 만들고 점수를 겨뤄 보세요.", en: "Drop number blocks, chain sums of ten, and compare your score." }, players: [1, 8], minutes: 5, image: `${base}/sum-drop.svg`, icon: `${base}/icons/sum-drop.svg` },
  { id: "mini-sudoku", title: { ko: "6×6 미니 스도쿠", en: "6×6 Mini Sudoku" }, tags: { ko: "두뇌 · 논리", en: "Brain · Logic" }, pitch: { ko: "연필 메모를 활용해 1~6 숫자 격자를 완성하세요.", en: "Complete the 1–6 grid using pencil notes and logic." }, players: [1, 8], minutes: 8, image: `${base}/mini-sudoku.webp`, icon: `${base}/icons/mini-sudoku.svg` },
  { id: "spy-game", title: { ko: "스파이 게임", en: "Spy Game" }, tags: { ko: "파티 · 추리", en: "Party · Deduction" }, pitch: { ko: "대화와 추리로 숨어 있는 스파이를 찾아보세요.", en: "Uncover the secret spy through conversation and deduction." }, players: [4, 12], minutes: 8, image: `${base}/spy-game.webp`, icon: `${base}/icons/spy-game.svg` },
  { id: "photo-sliding-puzzle", title: { ko: "슬라이딩 사진퍼즐", en: "Sliding Photo Puzzle" }, tags: { ko: "협동 · 퍼즐", en: "Co-op · Puzzle" }, pitch: { ko: "빈 칸과 같은 줄의 조각을 밀어 사진을 완성하세요.", en: "Slide tiles toward the empty slot to restore the photo." }, players: [1, 8], minutes: 10, image: `${base}/photo-sliding-puzzle.webp`, icon: `${base}/icons/photo-sliding-puzzle.svg` },
  { id: "sum-puzzle", title: { ko: "숫자합 퍼즐", en: "Sum Puzzle" }, tags: { ko: "캐주얼 · 두뇌", en: "Casual · Brain" }, pitch: { ko: "1~9 타일을 골라 목표 합을 만들고 판을 비워 보세요.", en: "Pick 1–9 tiles to reach the target sum and clear the board." }, players: [1, 8], minutes: 5, image: `${base}/sum-puzzle.webp`, icon: `${base}/icons/sum-puzzle.svg` },
  { id: "rock-paper-scissors", title: { ko: "가위바위보 멀티플레이", en: "Multiplayer Rock Paper Scissors" }, tags: { ko: "파티 · 대전", en: "Party · Competition" }, pitch: { ko: "모두 손을 고른 뒤 한 번에 공개해 승부를 겨뤄 보세요.", en: "Choose in secret, reveal together, and compete over several rounds." }, players: [2, 8], minutes: 5, image: `${base}/rock-paper-scissors.webp`, icon: `${base}/icons/rock-paper-scissors.webp` },
];
