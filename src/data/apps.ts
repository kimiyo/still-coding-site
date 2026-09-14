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
  visual: "direct-play" | "pinhole" | "kana" | "guitar" | "collaboard";
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
    summary: "게임을 고르고 링크로 초대하면 바로 시작되는 7개의 브라우저 게임",
    detail: "사진 퍼즐부터 숫자 야구, 포켓 레이스, 스파이 게임까지. 공개방과 비밀방을 열어 최대 12명이 설치 없이 함께합니다.",
    tags: ["7 games", "1–12 players", "Public · Private"],
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
    summary: "관찰과 계산, 서로 다른 두 가지 판단을 겨루는 퍼즐 랩",
    detail: "작은 시야로 정답을 찾는 Pinhole과 떨어지는 숫자로 합 10의 연쇄를 만드는 Sum Drop을 혼자 또는 게임방에서 즐깁니다.",
    tags: ["Observe", "Calculate", "Solo · Room"],
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
    summary: "히라가나와 가타카나를 같은 소리와 손의 움직임으로 연결하는 학습 공방",
    detail: "149개 확장 표기까지 쓰기, 음성, 단어, 비슷한 글자와 짝 학습으로 익히고 브라우저에 진도를 이어서 기록합니다.",
    tags: ["149 forms", "Writing · Speech", "Progress"],
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
  {
    id: "collaboard",
    title: "CollaBoard",
    eyebrow: "Collaboration tool / 01",
    url: "https://collaboard.still-coding.cc/",
    category: "create",
    status: "public",
    summary: "방은 서버가 만들고, 팀의 자료는 팀원 사이에만 남는 협업 공간",
    detail: "화이트보드, 브레인스토밍, Q&A, 퀴즈, 즉석 투표와 파일 공유를 하나의 비밀 룸에서 WebRTC로 직접 연결합니다.",
    tags: ["6 team tools", "WebRTC P2P", "No storage"],
    accent: "#00c8e7",
    accentSoft: "#6657f5",
    visual: "collaboard",
    size: "wide",
    order: 5,
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
