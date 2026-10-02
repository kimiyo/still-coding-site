export type AppGroup = "game" | "learn" | "music" | "tools";
export type AppStatus = "public" | "preview" | "private-beta" | "coming-soon";

export interface PortfolioApp {
  id: string;
  title: string;
  eyebrow: string;
  url?: string;
  helpUrl?: string;
  /** English guide when the app has no /en/ copy of its helpUrl page; otherwise the /en/ prefix is added to helpUrl. */
  englishHelpUrl?: string;
  englishReady?: boolean;
  group: AppGroup;
  status: AppStatus;
  summary: string;
  detail: string;
  tags: string[];
  accent: string;
  accentSoft: string;
  visual: "direct-play" | "kana" | "guitar" | "collaboard" | "bus" | "piano" | "vocal" | "pdf";
  size: "wide" | "standard";
  order: number;
  audience: string;
  steps: string[];
  dataPolicy: string;
  faqs: { question: string; answer: string }[];
}

export const apps: PortfolioApp[] = [
  {
    id: "direct-play",
    title: "Direct Play",
    eyebrow: "Game collection / 01",
    url: "https://dp.still-coding.cc/",
    helpUrl: "https://dp.still-coding.cc/about/",
    englishReady: true,
    group: "game",
    status: "public",
    summary: "게임을 고르고 링크로 초대하면 바로 시작되는 10개의 브라우저 게임",
    detail: "사진 퍼즐과 슬라이딩 퍼즐, 숫자 야구, 숫자합 퍼즐, 6×6 미니 스도쿠, 포켓 레이스, 스파이 게임, 그리고 작은 시야로 관찰하는 PINHOLE과 합 10을 잇는 SUM DROP, 모두 손을 고른 뒤 한 번에 공개하는 가위바위보까지. 공개방과 비밀방을 열어 게임에 따라 최대 12명이 설치 없이 함께합니다.",
    tags: ["10 games", "1–12 players", "Public · Private"],
    accent: "#66c7f2",
    accentSoft: "#ff8066",
    visual: "direct-play",
    size: "wide",
    order: 1,
    audience: "친구·가족·동료와 설치 없이 짧은 게임을 즐기고 싶은 사람",
    steps: ["게임을 고르고 방을 만듭니다.", "초대 링크를 친구에게 공유합니다.", "같은 방에서 게임을 선택하고 플레이합니다."],
    dataPolicy: "포털은 게임 화면을 저장하지 않습니다. 방과 플레이 데이터의 처리 방식은 게임별 운영 정책을 따르므로 플레이 전 앱 화면의 안내를 확인하세요.",
    faqs: [{ question: "회원가입이 필요한가요?", answer: "포털 계정 없이 시작할 수 있습니다. 게임방 공유에 필요한 링크를 함께 사용할 사람에게 보내면 됩니다." }, { question: "Pinhole Lab은 어디로 갔나요?", answer: "Pinhole Lab의 PINHOLE과 SUM DROP은 Direct Play로 옮겨 왔습니다. 혼자 연습하거나 친구들과 같은 방에서 점수를 겨룰 수 있습니다." }, { question: "몇 명까지 함께할 수 있나요?", answer: "대부분의 게임은 1–8명, 포켓 레이스는 2–4명, 가위바위보는 2–8명, 스파이 게임은 4–12명이 함께합니다." }, { question: "모바일에서도 되나요?", answer: "지원 브라우저에서 열 수 있지만, 게임별 조작 방식과 화면 크기는 다를 수 있습니다." }],
  },
  {
    id: "kana-atelier",
    title: "가나 공방",
    eyebrow: "Learning tool / 01",
    url: "https://study-hiragana.still-coding.cc/",
    helpUrl: "https://study-hiragana.still-coding.cc/guide/",
    group: "learn",
    status: "public",
    summary: "히라가나와 가타카나를 같은 소리와 손의 움직임으로 연결하는 학습 공방",
    detail: "149개 확장 표기까지 쓰기, 음성, 단어, 비슷한 글자와 짝 학습으로 익히고 브라우저에 진도를 이어서 기록합니다.",
    tags: ["149 forms", "Writing · Speech", "Progress"],
    accent: "#d14b38",
    accentSoft: "#e9b33f",
    visual: "kana",
    size: "standard",
    order: 2,
    audience: "히라가나·가타카나를 쓰고 듣고 말하며 익히려는 학습자",
    steps: ["학습할 문자와 표기 범위를 선택합니다.", "문자를 직접 쓰고 소리와 단어를 확인합니다.", "비슷한 글자 짝과 복습하며 진도를 이어갑니다."],
    dataPolicy: "학습 진도는 브라우저에 기록되며 포털 서버로 전송되지 않습니다. 음성 기능을 사용할 때는 브라우저의 마이크 권한이 필요할 수 있습니다.",
    faqs: [{ question: "149개 표기를 모두 학습할 수 있나요?", answer: "기본 문자와 확장 표기를 포함한 149개 범위를 제공하며, 원하는 범위부터 시작할 수 있습니다." }, { question: "설치해야 하나요?", answer: "설치 없이 브라우저에서 사용할 수 있습니다." }],
  },
  {
    id: "guitar-auto-strum",
    title: "Guitar Auto-Strum",
    eyebrow: "Music tool / 02",
    url: "https://guitar-play.still-coding.cc/",
    helpUrl: "https://guitar-play.still-coding.cc/guide/",
    group: "music",
    status: "public",
    summary: "스트로크는 앱에게, 연주는 당신에게 맡기는 브라우저 기타 자동 반주",
    detail: "실시간 코드 전환과 곡 코드 차트 반주, 두 가지 방식으로 반주합니다. 키·박자·리듬·템포·스윙과 스트럼 패턴을 고르고, 물리 모델링으로 만든 어쿠스틱 기타 소리를 지판 화면과 함께 듣습니다.",
    tags: ["Auto accompaniment", "Live · Song chart", "Works offline"],
    accent: "#d6aa43",
    accentSoft: "#704d38",
    visual: "guitar",
    size: "wide",
    order: 7,
    audience: "노래하거나 연습하거나 곡을 만들 때 기타 반주가 필요한 사람",
    steps: ["반주 방식을 고릅니다. 실시간 코드 전환 또는 곡 코드 차트로 시작합니다.", "키·박자·리듬·템포와 기타 음색을 정합니다.", "재생하며 지판과 코드를 확인하고, 필요한 마디는 반복 연습합니다."],
    dataPolicy: "회원가입 없이 쓸 수 있고, 만든 작업은 클라우드로 올라가지 않고 이 기기에서만 처리됩니다. 저장과 권한 처리의 자세한 범위는 앱의 개인정보처리방침(https://guitar-play.still-coding.cc/privacy/)을 기준으로 합니다.",
    faqs: [{ question: "어떤 방식으로 반주할 수 있나요?", answer: "코드를 실시간으로 바꾸는 라이브 모드와, 구간과 반복이 있는 곡 코드 차트 모드가 있습니다." }, { question: "설치하거나 가입해야 하나요?", answer: "설치나 회원가입 없이 브라우저에서 바로 쓸 수 있으며, 오프라인 사용을 지원하는 PWA입니다." }, { question: "기타 소리는 녹음 샘플인가요?", answer: "미리 녹음한 샘플이 아니라 물리 모델링으로 실시간 합성한 어쿠스틱 기타 소리이며, 클래식·스틸·일렉트릭 음색과 25–150% 재생 속도를 고를 수 있습니다." }, { question: "사용법은 어디에 있나요?", answer: "앱의 사용 가이드(https://guitar-play.still-coding.cc/guide/)에서 확인할 수 있습니다." }],
  },
  {
    id: "collaboard",
    title: "CollaBoard",
    eyebrow: "Collaboration tool / 01",
    url: "https://collaboard.still-coding.cc/",
    helpUrl: "https://collaboard.still-coding.cc/guide/",
    englishReady: true,
    group: "tools",
    status: "public",
    summary: "방은 서버가 만들고, 팀의 자료는 팀원 사이에만 남는 협업 공간",
    detail: "화이트보드, 브레인스토밍, Q&A, 퀴즈, 투표, 파일 공유, 공지, 피드백 8가지 도구를 하나의 비밀 룸에서 WebRTC로 직접 연결합니다.",
    tags: ["8 team tools", "WebRTC P2P", "No storage"],
    accent: "#00c8e7",
    accentSoft: "#6657f5",
    visual: "collaboard",
    size: "wide",
    order: 4,
    audience: "작은 팀이 별도 계정 없이 자료를 함께 보고 싶은 사람",
    steps: ["비밀 룸을 만들고 이름을 정합니다.", "초대 링크를 팀원에게 공유합니다.", "화이트보드·Q&A·퀴즈·투표 등 필요한 도구를 엽니다."],
    dataPolicy: "방을 찾기 위한 신호 교환은 서버를 거치지만 팀 자료는 WebRTC로 참여자 사이에 직접 전달되는 구조입니다. 포털은 협업 자료를 저장하지 않습니다. 민감한 자료는 팀의 보안 기준을 확인한 뒤 사용하세요.",
    faqs: [{ question: "어떤 협업 도구가 있나요?", answer: "화이트보드, 브레인스토밍, Q&A, 퀴즈, 투표, 파일 공유, 공지, 피드백의 8가지 도구를 제공합니다." }, { question: "파일도 서버에 저장되나요?", answer: "이 포털 설명 기준으로 팀 자료는 P2P로 전달되며, 연결이 끊기면 다시 공유해야 할 수 있습니다." }],
  },
  {
    id: "piano-play",
    title: "Songnote",
    eyebrow: "Piano Play / 02",
    url: "https://piano-play.still-coding.cc/",
    helpUrl: "https://piano-play.still-coding.cc/guide/",
    group: "music",
    status: "public",
    summary: "ABC 악보를 고치고 108건반으로 듣는 Songnote 스튜디오",
    detail: "Piano Play는 제품 Songnote의 포털 이름입니다. 예제 악보를 따라 ABC를 편집하고, 합성 피아노로 재생하고, 화면의 108건반으로 연주합니다. 만든 악보는 서버가 아니라 이 브라우저에만 남습니다.",
    tags: ["ABC score", "108 keys", "On this browser"],
    accent: "#87d8e8",
    accentSoft: "#e96487",
    visual: "piano",
    size: "standard",
    order: 6,
    audience: "ABC 악보를 편집하고 피아노 소리로 바로 확인하고 싶은 사람",
    steps: ["예제 악보를 열거나 ABC 표기를 입력합니다.", "악보를 확인하고 필요한 부분을 고칩니다.", "합성 피아노로 재생하거나 108건반으로 연주합니다."],
    dataPolicy: "만든 악보는 서버가 아니라 이 브라우저에만 남습니다. 브라우저 데이터를 삭제하거나 다른 기기에서 열면 저장한 작업을 잃을 수 있습니다.",
    faqs: [{ question: "Piano Play와 Songnote는 다른 앱인가요?", answer: "Piano Play는 포털에서의 이름이고, 앱 화면의 제품명은 Songnote입니다. 같은 주소의 같은 악보·피아노 스튜디오입니다." }, { question: "어떤 악보 형식을 쓰나요?", answer: "ABC 표기를 편집하고 화면에서 악보와 소리로 확인할 수 있습니다." }],
  },
  {
    id: "vocal-check",
    title: "Vocal Check",
    eyebrow: "Music tool / 01",
    url: "https://vocal-check.still-coding.cc/",
    helpUrl: "https://vocal-check.still-coding.cc/guide/",
    englishReady: true,
    group: "music",
    status: "public",
    summary: "내 목소리의 음정을 눈으로 확인하는 실시간 보컬 체크 도구",
    detail: "마이크로 들어오는 목소리의 높낮이를 시각화해 음정을 바로 확인합니다. 마이크 없이도 데모와 사용 가이드를 먼저 볼 수 있습니다.",
    tags: ["Pitch", "Microphone", "Realtime"],
    accent: "#b6e36f",
    accentSoft: "#65b8ea",
    visual: "vocal",
    size: "standard",
    order: 3,
    audience: "노래 연습 중 음정의 움직임을 눈으로 확인하고 싶은 사람",
    steps: ["마이크 없이 데모나 사용 가이드로 먼저 둘러봅니다.", "준비되면 마이크를 허용하고 한 음을 길게 냅니다.", "음이름, 센트, 12초 그래프를 보고 다시 잽니다."],
    dataPolicy: "앱은 마이크 소리를 파일로 저장하거나 서버로 보내지 않습니다. 음정 숫자만 브라우저 메모리에 잠시 남고, 탭을 떠나면 마이크가 꺼집니다. 처리 범위는 Vocal Check 개인정보 문서(https://vocal-check.still-coding.cc/privacy/)를 기준으로 합니다.",
    faqs: [{ question: "노래를 녹음하나요?", answer: "앱은 녹음 파일을 만들지 않고 소리를 서버로 보내지 않습니다. 최근 12초 그래프에는 음정 숫자만 남으며 마이크를 끄면 지워집니다." }, { question: "사용법은 어디에 있나요?", answer: "앱의 사용 가이드(https://vocal-check.still-coding.cc/guide/)에서 마이크 거부, 장치 없음, 소음, 그래프 읽는 법을 확인할 수 있습니다." }, { question: "정확한 튜너인가요?", answer: "연습을 돕는 시각 피드백 도구입니다. 전문 튜너나 의료·음향 측정 장비를 대신하지 않습니다." }],
  },
  {
    id: "pdf-flow-studio",
    title: "PDF Flow Studio",
    eyebrow: "Document tool / 01",
    url: "https://pdf-flow-studio.still-coding.cc/",
    helpUrl: "https://pdf-flow-studio.still-coding.cc/guide/",
    englishReady: true,
    group: "tools",
    status: "public",
    summary: "서버 전송 없이 브라우저에서 안전하게 재배치·추출·결합하는 PDF 워크스페이스",
    detail: "업로드한 PDF 파일을 외부 서버로 보내지 않고 브라우저 메모리 안에서만 처리합니다. 페이지 순서 변경, 90도 회전, 빈 페이지 삽입, 자유 펜 및 도형 주석, 원하는 페이지만 골라 새로운 PDF로 병합 다운로드까지 하나의 화면에서 안전하게 마칩니다.",
    tags: ["On this browser", "Visual editor", "No server upload"],
    accent: "#38bdf8",
    accentSoft: "#10b981",
    visual: "pdf",
    size: "wide",
    order: 8,
    audience: "계약서나 개인정보가 담긴 PDF를 유출 걱정 없이 브라우저에서 직접 재배치·편집·병합하려는 사용자",
    steps: [
      "PDF 파일을 사이드바에 드래그하여 워크스페이스에 올립니다.",
      "썸네일을 작업 영역에 추가하고 순서를 바꾸거나 주석을 작성합니다.",
      "원하는 페이지만 골라 새 PDF로 병합 다운로드합니다."
    ],
    dataPolicy: "모든 PDF 파일과 편집 작업은 브라우저 메모리 안에서만 처리되며 서버로 전송되거나 저장되지 않습니다. 자세한 처리 범위는 PDF Flow Studio 개인정보처리방침(https://pdf-flow-studio.still-coding.cc/privacy/)을 따릅니다.",
    faqs: [
      {
        question: "내 PDF 파일이 외부 서버에 저장되나요?",
        answer: "아닙니다. 파일 렌더링, 썸네일 생성, 페이지 결합 모두 브라우저 메모리(pdf-lib 및 pdf.js)에서 실행되며 외부 서버로 전송되지 않습니다."
      },
      {
        question: "파일 용량이나 페이지 수에 제한이 있나요?",
        answer: "서버 제한은 없으며 사용하는 기기의 브라우저 메모리 용량에 따라 결정됩니다. 수백 페이지 분량의 문서도 처리 가능합니다."
      },
      {
        question: "오프라인에서도 쓸 수 있나요?",
        answer: "첫 방문 후 브라우저에 코드가 캐시되므로 인터넷 연결이 없어도 안전하게 PDF를 편집하고 다운로드할 수 있습니다."
      },
      {
        question: "사용 가이드가 있나요?",
        answer: "사용 가이드(https://pdf-flow-studio.still-coding.cc/guide/) 또는 앱 상단의 '?' 버튼에서 5단계 시각적 튜토리얼, 상세 기능, 단축키를 전체 화면으로 확인하실 수 있습니다."
      }
    ],
  },
  {
    id: "bus-explorer",
    title: "Bus Explorer",
    eyebrow: "Exploration tool / 01",
    url: "https://bus-explorer.still-coding.cc/",
    helpUrl: "https://bus-explorer.still-coding.cc/guide/",
    group: "tools",
    status: "public",
    summary: "버스의 흐름을 따라 도시를 새롭게 읽는 노선 탐색 도구",
    detail: "정류장과 노선을 오가며 익숙한 도시의 연결을 다른 시선으로 살펴봅니다. 이동 정보가 하나의 탐험 경험이 됩니다.",
    tags: ["Transit", "Route map", "Urban explore"],
    accent: "#ef5b3f",
    accentSoft: "#f3c34f",
    visual: "bus",
    size: "standard",
    order: 5,
    audience: "버스 노선과 정류장의 연결을 지도처럼 탐색하고 싶은 사람",
    steps: ["관심 있는 도시·노선을 엽니다.", "정류장과 연결된 경로를 따라갑니다.", "새로운 이동 경로를 발견하고 다시 탐색합니다."],
    dataPolicy: "포털은 버스 탐색 기록을 저장하지 않습니다. 지도와 교통 데이터는 앱이 연결한 외부 데이터 제공자의 운영 상태에 영향을 받을 수 있습니다.",
    faqs: [{ question: "실시간 도착 정보인가요?", answer: "Bus Explorer는 노선과 연결을 탐색하는 경험에 초점을 둡니다. 실시간 운행 정보로 사용하기 전 앱의 데이터 기준일을 확인하세요." }, { question: "어떤 화면에서 시작하나요?", answer: "앱 링크를 열고 노선 또는 정류장을 선택하면 연결된 경로를 따라갈 수 있습니다." }],
  }
];

export interface AppGroupInfo {
  id: AppGroup;
  label: Record<"ko" | "en", string>;
  description: Record<"ko" | "en", string>;
}

// 홈 화면에 표시되는 그룹의 순서와 문구. 새 그룹은 AppGroup 타입과 여기에 함께 추가한다.
export const appGroups: AppGroupInfo[] = [
  { id: "game", label: { ko: "게임", en: "Games" }, description: { ko: "링크 하나로 함께 즐기는 브라우저 게임.", en: "Browser games you start together with a link." } },
  { id: "learn", label: { ko: "학습", en: "Learn" }, description: { ko: "손과 감각으로 익히는 공부 도구.", en: "Study tools built around hands-on practice." } },
  { id: "music", label: { ko: "음악", en: "Music" }, description: { ko: "연주하고, 듣고, 소리를 눈으로 확인하는 도구.", en: "Tools for playing, hearing, and seeing sound." } },
  { id: "tools", label: { ko: "도구", en: "Tools" }, description: { ko: "일과 일상을 덜어 주는 실용 앱.", en: "Practical apps for work and everyday errands." } },
];

// 그룹 안의 순서는 위 apps 배열의 순서를 따른다. 앱이 없는 그룹은 숨긴다.
export function getAppGroups() {
  return appGroups
    .map(group => ({ ...group, apps: apps.filter(app => app.group === group.id && app.status === "public") }))
    .filter(group => group.apps.length > 0);
}

export const statusLabels: Record<AppStatus, string> = {
  public: "Public",
  preview: "Preview",
  "private-beta": "Private beta",
  "coming-soon": "Coming soon",
};
