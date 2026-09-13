export type AppCategory = "play" | "learn" | "create" | "explore";
export type AppStatus = "public" | "preview" | "private-beta" | "coming-soon";

export interface PortfolioApp {
  id: string;
  title: string;
  eyebrow: string;
  url?: string;
  category: AppCategory;
  status: AppStatus;
  summary: string;
  detail: string;
  tags: string[];
  accent: string;
  accentSoft: string;
  visual: "direct-play" | "pinhole" | "kana" | "guitar";
  size: "wide" | "standard";
  order: number;
}

export const apps: PortfolioApp[] = [
  {
    id: "direct-play",
    title: "Direct Play",
    eyebrow: "Game collection / 01",
    url: "https://dp.still-coding.cc/",
    category: "play",
    status: "public",
    summary: "링크 하나로 방을 만들고 함께 즐기는 브라우저 게임 모음",
    detail: "사진 퍼즐, 숫자 야구, 포켓 레이스 등 일곱 개의 게임을 설치 없이 시작할 수 있습니다.",
    tags: ["7 games", "Multiplayer", "Browser"],
    accent: "#66c7f2",
    accentSoft: "#ff8066",
    visual: "direct-play",
    size: "wide",
    order: 1,
  },
  {
    id: "pinhole-lab",
    title: "Pinhole Lab",
    eyebrow: "Game collection / 02",
    url: "https://pinhole-game.still-coding.cc/",
    category: "play",
    status: "public",
    summary: "작은 규칙, 날카로운 판단",
    detail: "적게 보고 맞히는 Pinhole과 숫자를 연결하는 Sum Drop을 한 곳에서 즐깁니다.",
    tags: ["2 games", "Puzzle", "Solo · Multi"],
    accent: "#70e1ec",
    accentSoft: "#f0b65d",
    visual: "pinhole",
    size: "standard",
    order: 2,
  },
  {
    id: "kana-atelier",
    title: "가나 공방",
    eyebrow: "Learning tool / 01",
    url: "https://study-hiragana.still-coding.cc/",
    category: "learn",
    status: "public",
    summary: "듣고, 말하고, 손끝으로 익히는 일본어",
    detail: "히라가나와 가타카나를 쓰기, 발음, 단어와 짝 학습으로 연결합니다.",
    tags: ["Japanese", "Writing", "Speech"],
    accent: "#d14b38",
    accentSoft: "#e9b33f",
    visual: "kana",
    size: "standard",
    order: 3,
  },
  {
    id: "guitar-auto-strum",
    title: "Guitar Auto-Strum",
    eyebrow: "Creative tool / 01",
    category: "create",
    status: "private-beta",
    summary: "코드만 잡으면 리듬이 흐르는 브라우저 기타 반주 도구",
    detail: "Workers migration을 마치고 공개 전 검증 중입니다. 현재 개발자와 테스트 사용자만 접근할 수 있습니다.",
    tags: ["Music", "Web Audio", "Workers"],
    accent: "#d6aa43",
    accentSoft: "#704d38",
    visual: "guitar",
    size: "wide",
    order: 4,
  },
];

export const categoryLabels: Record<"all" | AppCategory, string> = {
  all: "All",
  play: "Play",
  learn: "Learn",
  create: "Create",
  explore: "Explore",
};

export const statusLabels: Record<AppStatus, string> = {
  public: "Public",
  preview: "Preview",
  "private-beta": "Private beta",
  "coming-soon": "Coming soon",
};
