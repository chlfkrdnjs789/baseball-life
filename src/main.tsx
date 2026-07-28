import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import SaveSlotsModal from './components/SaveSlotsModal';
import { buildAIHistory, buildGameStateContext } from './services/aiContext';
import { deleteSlot, listSaveSlots, loadFromSlot, migrateLegacySave, saveToSlot } from './services/saveService';
import type { SaveMetadata, SaveSlotNumber } from './models/saveGame';
import { 
  Smartphone, 
  MessageSquare, 
  User, 
  Activity, 
  Calendar, 
  Settings, 
  Save, 
  Power, 
  Send, 
  Menu,
  Trophy,
  TrendingUp,
  Newspaper,
  ChevronRight,
  AlertCircle,
  MapPin,
  Briefcase,
  School,
  ArrowRight,
  Check,
  BarChart2,
  List,
  Radar,
  Globe,
  Users,
  X,
  Grid,
  Target,
  Zap,
  Key
} from 'lucide-react';

// --- CONSTANTS & SYSTEM PROMPT ---

// Fixed: Escaped backticks for variable names within the template literal to prevent TypeScript errors.
const SYSTEM_PROMPT_CORE = `
# 역할 정의

너는 초현실 야구 커리어 시뮬레이터 **[나만의 야구 선수 키우기]**의 전담 게임 마스터(GM)다.

* 플레이어는 **“야구선수 1명”**의 인생 전체를 플레이한다.
  * ① 2024년 고교 1학년 유망주 (시작 시점: 2024년 1월 동계훈련)
  * ② 2026년 KBO 신인 1년차 (시작 시점: 2026년 1월 스프링캠프)
* 너는 **설명 + 해설 + 경기·커리어 시뮬레이터 + 판정자** 역할만 수행한다.
* **공정성·현실성·디테일**이 절대 최우선이다.
* **실명 선수 사용**: 2026년 프로 루트 시 실제 KBO 선수 이름(이정후, 강백호, 원태인 등)을 적극적으로 등장시켜라. 고교 루트에서도 유명 유망주나 가상의 라이벌을 구체적인 이름으로 등장시켜라.

# 난이도별 시뮬레이션 가중치 (GM 필독 - 엄격 적용)
사용자가 선택한 난이도에 따라 아래 규칙을 **반드시** 적용하라.
1. **쉬움 (Easy)**: 
   - 성장 속도 150%. 부상 확률 거의 없음. 
   - 슬럼프가 와도 1~2경기면 회복. 주전 경쟁에서 항상 우위 점함.
2. **보통 (Normal)**: 
   - 현실적인 야구 확률 분포. 노력에 비례한 성장.
3. **어려움 (Hard)**: 
   - **성장 속도 70%**로 감소. 
   - 부상 위험 '높음'. 3경기 연속 무안타/대량실점 시 **즉시 2군 강등** 혹은 벤치행.
   - 경쟁자(NPC)들이 더 잘함. FA/연봉 협상 시 구단이 매우 짠물임.
4. **매우 어려움 (Very Hard)**: 
   - **성장 속도 40%** 수준. 스탯이 오히려 떨어질 수도 있음.
   - **유리몸**: 조금만 무리해도 부상(4주 이상 결장) 발생.
   - **억까(Bad Luck)**: 잘 맞은 타구도 호수비에 걸리고, 빗맞은 안타를 허용함.
   - **구단의 인내심 바닥**: 신인이라도 못하면 가차 없이 방출(Release) 또는 트레이드.
   - 해외 진출은 리그를 씹어먹는 성적이 아니면 불가능.

# 중요: 데이터 출력 규칙 (Vibe Coding Engine)
모든 응답의 **맨 마지막**에 반드시 아래 JSON 포맷의 데이터를 포함해야 한다. 
이 데이터는 게임 UI를 업데이트하는 데 사용된다.
플레이어의 포지션(투수/타자/투타겸업)에 따라 \`abilities\`와 \`advanced_stats\`의 필드를 적절히 채워라.
텍스트 응답이 끝난 후, 반드시 \`\`\`json\`\`\` 블록으로 감싸서 출력하라.

JSON 포맷 예시 (타자/투수/투타겸업 통합 구조):
\`\`\`json
{
  "status": {
    "name": "홍길동",
    "team": "덕수고등학교",
    "position": "투수", 
    "age": "17세",
    "ovr": "72 (B+)",
    "condition": "보통",
    "money": "5,000만원",
    "followers": 13200
  },
  "date": "2024년 1월",
  "abilities": {
    // [타자용] (투수면 "-" 또는 생략 가능)
    "contact": "-", 
    "power": "-",
    "eye": "-",
    "speed": "60 (C)",
    "defense": "80 (A)",
    "bq": "65 (B)",
    
    // [투수용] (타자면 "-" 또는 생략 가능)
    "stamina": "75 (B+)",
    "velocity": "148km/h (A-)",
    "control": "70 (B)",
    "stuff": "68 (B-)", // 구위
    "breaking": "슬라이더(B), 커브(C)", // 변화구 목록
    
    "potential": "S (엘리트)",
    "mental": "강함"
  },
  "advanced_stats": {
    // [타자 세이버메트릭스 포함]
    "avg": ".305", "hr": "12", "rbi": "45", "sb": "5", 
    "ops": ".950", "woba": ".410", "wrc_plus": "145", "iso": ".250", "babip": ".330",
    "war_bat": "3.5",
    
    // [투수 세이버메트릭스 포함]
    "era": "2.45", "w": "10", "l": "2", "sv": "0", "so": "120", "whip": "1.10",
    "fip": "2.80", "era_plus": "160", "k_9": "9.5", "bb_9": "2.1",
    "war_pit": "4.2"
  },
  "league_data": {
    "league_name": "2024 고교야구 주말리그 (서울권A)",
    "standings": [
      {"rank": 1, "team": "덕수고", "w": 5, "l": 0, "d": 0, "gb": "-"},
      {"rank": 2, "team": "휘문고", "w": 4, "l": 1, "d": 0, "gb": "1.0"}
    ],
    "leaderboards": {
       // 포지션에 맞는 리더보드 위주로 출력
       "era": [{"name": "홍길동", "team": "덕수고", "val": "1.20"}],
       "so": [{"name": "김투수", "team": "서울고", "val": "50"}]
    }
  },
  "yearly_records": [
     {
       "year": 2024, "team": "덕수고", 
       "avg": "-", "hr": "-", "ops": "-", "wrc_plus": "-", "war": "2.1", // 타자용
       "era": "2.45", "w": "3", "l": "1", "so": "45", "whip": "1.05", "fip": "2.30", // 투수용
       "note": "주말리그 우수투수상"
     }
  ],
  "career_stats": {
     // 현재 포지션에 중요한 누적 스탯 (세이버 포함)
     "g": "10", 
     "avg": "-", "hr": "-", "ops": "-", "wrc_plus": "-", "war": "2.1", // 타자
     "era": "2.45", "w": "3", "so": "45", "whip": "1.05", "fip": "2.30" // 투수
  },
  "sns_feed": [
    {"type": "SNS", "user": "야구팬1", "content": "오늘 직구 구속 미쳤다 ㄷㄷ", "likes": 120},
    {"type": "NEWS", "user": "스포츠서울", "content": "[속보] 고교 최대어 홍길동, 메이저리그 스카우트 접촉설", "likes": 1200}
  ],
  "messages": [
    {"from": "코치", "content": "내일 불펜 피칭 준비해라."}
  ]
}
\`\`\`

# 전역 규칙
1. **시작 시점 고정**: 
   - 고교 루트: **2024년 1월** (입학 전 동계 훈련부터 시작)
   - 프로 루트: **2026년 1월** (신인 드래프트 후 입단식/스프링캠프부터 시작)
   - 절대 시즌 중반이나 3월부터 시작하지 말 것. 1월부터 월 단위로 진행.
2. **포지션별 차별화**: 
   - **투수**: 구속, 구위, 제구, 변화구 능력치 중심. 기록은 ERA, FIP, WHIP, ERA+ 등 세부 지표 포함.
   - **타자**: 컨택, 파워, 선구안, 주력, 수비 중심. 기록은 타율, OPS, wRC+, WAR, ISO 등 세부 지표 포함.
   - **투타겸업**: 양쪽 능력치와 기록을 모두 제공.
3. **현실 고증**: 한국 고교 주말리그/전국대회, KBO 리그 구조 완벽 모사.
4. **시간 단위**: 기본 1턴 = 1개월 (중요 시점은 주/일 단위).
5. **리그 데이터**: 매 턴 \`league_data\`에 현재 속한 리그의 팀 순위(TOP 5~10)와 개인 기록 순위(타율/홈런/ERA/다승 등)를 갱신하라. 실존 학교/구단 이름을 사용할 것.
6. **기록 누적**: \`yearly_records\`와 \`career_stats\`에도 반드시 세이버메트릭스(WAR, OPS, WHIP 등)를 포함하여 출력하라.

# 14. 2026 KBO 로스터 (참고용)
KT, SSG, 삼성, 한화, 두산, NC, LG, 롯데, 키움, KIA. (실존 선수 활용)

이 지침을 바탕으로 사용자와 텍스트 RPG를 진행하라.
`;

const HIGH_SCHOOLS = [
  "랜덤 (Random)",
  "덕수고 (서울)", "휘문고 (서울)", "서울고 (서울)", "충암고 (서울)", "경기상업고 (서울)", "신일고 (서울)",
  "유신고 (경기)", "야탑고 (경기)", 
  "북일고 (충청)", 
  "광주제일고 (전라)", 
  "경남고 (부산)", "부산고 (부산)", 
  "경북고 (대구)", "대구고 (대구)", 
  "마산용마고 (경남)", 
  "강릉고 (강원)", 
  "전주고 (전북)"
];

// --- TYPES ---

interface PlayerStatus {
  name: string;
  team: string;
  position: string;
  age: string;
  ovr: string;
  condition: string;
  money: string;
  followers: number;
}

interface PlayerAbilities {
  // Common
  potential: string;
  mental: string;
  bq: string;
  stamina: string;
  
  // Batter
  contact?: string;
  power?: string;
  eye?: string;
  speed?: string;
  defense?: string;
  
  // Pitcher
  velocity?: string;
  control?: string;
  stuff?: string;
  breaking?: string;
}

interface AdvancedStats {
  // Batter
  avg?: string;
  hr?: string;
  rbi?: string;
  sb?: string;
  ops?: string;
  woba?: string;     // New
  wrc_plus?: string; // New
  iso?: string;      // New
  babip?: string;    // New
  war_bat?: string;
  
  // Pitcher
  era?: string;
  w?: string;
  l?: string;
  sv?: string;
  so?: string;
  whip?: string;
  fip?: string;      // New
  era_plus?: string; // New
  k_9?: string;      // New
  bb_9?: string;     // New
  war_pit?: string;

  // General fallback
  [key: string]: string | undefined;
}

interface TeamStanding {
  rank: number;
  team: string;
  w: number;
  l: number;
  d: number;
  gb: string;
}

interface LeaderboardItem {
  name: string;
  team: string;
  val: string;
}

interface LeagueData {
  league_name: string;
  standings: TeamStanding[];
  leaderboards: {
    [key: string]: LeaderboardItem[];
  };
}

interface YearlyRecord {
  year: number;
  team: string;
  // Batter
  avg?: string;
  hr?: string;
  rbi?: string;
  sb?: string;
  ops?: string;
  wrc_plus?: string;
  war?: string;
  
  // Pitcher
  era?: string;
  w?: string;
  l?: string;
  sv?: string;
  so?: string;
  whip?: string;
  fip?: string;
  
  note?: string;
}

interface CareerStats {
  g: string;
  // Batter
  avg?: string;
  h?: string;
  hr?: string;
  rbi?: string;
  sb?: string;
  ops?: string;
  wrc_plus?: string;
  war?: string;
  
  // Pitcher
  era?: string;
  w?: string;
  l?: string;
  sv?: string;
  so?: string;
  whip?: string;
  fip?: string;
  k?: string; // alias for so if needed
}

interface SNSPost {
  type: 'SNS' | 'COMMUNITY' | 'NEWS';
  user: string;
  content: string;
  likes: number;
}

interface Message {
  from: string;
  content: string;
}

interface DashboardData {
  status: PlayerStatus;
  date: string;
  abilities: PlayerAbilities;
  advanced_stats: AdvancedStats;
  league_data: LeagueData;
  yearly_records: YearlyRecord[];
  career_stats: CareerStats;
  sns_feed: SNSPost[];
  messages: Message[];
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface GameSavePayload {
  chatHistory: ChatMessage[];
  dashboardData: DashboardData | null;
  selectedRoute: RouteType | null;
  difficulty: DifficultyType;
  playerForm: PlayerFormData;
  currentView: ViewMode;
  recordTab: 'SEASON' | 'YEARLY' | 'CAREER';
}

// Game Creation Types
type GameStage = 'START' | 'ROUTE_SELECT' | 'DIFFICULTY_SELECT' | 'PLAYER_FORM' | 'GAME';
type RouteType = 'HIGHSCHOOL_2024' | 'PRO_2026';
type DifficultyType = '쉬움' | '보통' | '어려움' | '매우 어려움';
type ViewMode = 'CHAT' | 'STATS' | 'RECORDS' | 'LEAGUE';

interface PlayerFormData {
  name: string;
  position: string;
  role: string;
  team: string;
  style: string;
  school: string;
}

// --- HELPER FUNCTION ---
const getPositionType = (pos: string = ''): 'PITCHER' | 'BATTER' | 'TWOWAY' => {
  if (pos.includes('투타') || pos.includes('겸업')) return 'TWOWAY';
  if (pos.includes('투수')) return 'PITCHER';
  return 'BATTER';
};

// --- APP COMPONENT ---

const App = () => {
  const [gameStage, setGameStage] = useState<GameStage>('START');
  
  // Game Setup State
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyType>('보통');
  const [playerForm, setPlayerForm] = useState<PlayerFormData>({
    name: '',
    position: '투수',
    role: '우투우타',
    team: '랜덤',
    style: '밸런스형',
    school: '랜덤 (Random)'
  });

  // Main Game State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [phoneApp, setPhoneApp] = useState<'HOME' | 'SNS' | 'MSG'>('HOME');
  const [currentView, setCurrentView] = useState<ViewMode>('CHAT');
  
  // Records View Tab State
  const [recordTab, setRecordTab] = useState<'SEASON' | 'YEARLY' | 'CAREER'>('SEASON');
  const [saveModalMode, setSaveModalMode] = useState<'save' | 'load' | null>(null);
  const [saveSlots, setSaveSlots] = useState<Array<SaveMetadata | null>>([null, null, null]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (currentView === 'CHAT') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, currentView]);

  useEffect(() => {
    migrateLegacySave<any>((legacy) => ({
      playerName: legacy?.dashboardData?.status?.name || '이름 미상',
      team: legacy?.dashboardData?.status?.team || '-',
      position: legacy?.dashboardData?.status?.position || '-',
      date: legacy?.dashboardData?.date || '-',
      ovr: legacy?.dashboardData?.status?.ovr || '-',
    }));
    setSaveSlots(listSaveSlots());
  }, []);


  const handleInitialStart = () => {
    setGameStage('ROUTE_SELECT');
  };

  const handleRouteSelect = (route: RouteType) => {
    setSelectedRoute(route);
    setGameStage('DIFFICULTY_SELECT');
  };

  const handleDifficultySelect = (diff: DifficultyType) => {
    setDifficulty(diff);
    setGameStage('PLAYER_FORM');
  };

  const handleGameLaunch = async () => {
    if (!playerForm.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    setGameStage('GAME');
    setChatHistory([]);
    // Initial empty data structure with full fields to prevent undefined errors in RecordTable
    setDashboardData({
      status: { name: playerForm.name, team: '-', position: playerForm.position, age: '-', ovr: '-', condition: '-', money: '0', followers: 0 },
      date: '게임 생성 중...',
      abilities: { contact: '-', power: '-', eye: '-', speed: '-', defense: '-', bq: '-', stamina: '-', potential: '-', mental: '-' },
      advanced_stats: { 
        avg: '-', hr: '-', rbi: '-', sb: '-', ops: '-', woba: '-', wrc_plus: '-', iso: '-', babip: '-', war_bat: '-',
        era: '-', w: '-', l: '-', sv: '-', so: '-', whip: '-', fip: '-', k_9: '-', bb_9: '-', era_plus: '-', war_pit: '-'
      },
      league_data: { league_name: '-', standings: [], leaderboards: {} },
      yearly_records: [],
      career_stats: { g: '-' },
      sns_feed: [],
      messages: []
    });

    const routeDesc = selectedRoute === 'HIGHSCHOOL_2024' ? "2024년 고교 1학년" : "2026년 KBO 신인 1년차";
    const startDate = selectedRoute === 'HIGHSCHOOL_2024' ? "2024년 1월" : "2026년 1월";
    
    let schoolInfo = "";
    if (selectedRoute === 'HIGHSCHOOL_2024') {
        schoolInfo = `- 소속 고교: ${playerForm.school}\n   - 선호(응원) 구단: ${playerForm.team}`;
    } else {
        schoolInfo = `- 소속 구단(드래프트/입단): ${playerForm.team}`;
    }

    let difficultyRules = "";
    if (difficulty === '어려움') {
      difficultyRules = "난이도 '어려움': 성장 속도 70% 제한, 경쟁자 능력치 상향, 잦은 슬럼프, 칼같은 2군행 적용.";
    } else if (difficulty === '매우 어려움') {
      difficultyRules = "난이도 '매우 어려움': 성장 속도 40% 제한, 유리몸 특성(부상 빈번), 불운(억까) 적용, 조금만 부진해도 방출 위협, 지옥의 난이도.";
    } else {
      difficultyRules = `난이도: ${difficulty}`;
    }

    const initialPrompt = `
[시스템: 플레이어 초기 설정 완료]
1. 시작 루트: ${routeDesc} (시작 시점: ${startDate}로 고정)
2. ${difficultyRules}
3. 선수 정보:
   - 이름: ${playerForm.name}
   - 포지션: ${playerForm.position}
   - 투타: ${playerForm.role}
   ${schoolInfo}
   - 스타일: ${playerForm.style}

위 설정을 바탕으로 ${startDate} 시점에서 게임을 시작하세요.
오프닝 멘트와 함께, JSON 데이터의 \`abilities\`와 \`advanced_stats\`, \`yearly_records\`, \`career_stats\`를 포지션에 맞게 초기화하여 출력하세요.
특히 세이버메트릭스 데이터(OPS, wRC+, WAR, FIP 등)도 모든 기록 테이블에 포함해야 합니다.
난이도가 '${difficulty}'이므로 이에 맞는 초기 능력치와 구단의 태도를 보여주세요.
`;
    
    await sendMessage(initialPrompt, true);
  };

  const refreshSaveSlots = () => setSaveSlots(listSaveSlots());

  const buildSavePayload = (): GameSavePayload => ({
    chatHistory,
    dashboardData,
    selectedRoute,
    difficulty,
    playerForm,
    currentView,
    recordTab,
  });

  const openSaveModal = (mode: 'save' | 'load') => {
    refreshSaveSlots();
    setSaveModalMode(mode);
  };

  const handleSaveSlot = (slot: SaveSlotNumber) => {
    if (!dashboardData) {
      alert('저장할 게임이 없습니다.');
      return;
    }

    const existing = saveSlots[slot - 1];
    if (existing && !confirm(`저장 슬롯 ${slot}을 덮어쓰시겠습니까?`)) return;

    saveToSlot(slot, buildSavePayload(), {
      playerName: dashboardData.status.name || playerForm.name || '이름 미상',
      team: dashboardData.status.team || '-',
      position: dashboardData.status.position || playerForm.position,
      date: dashboardData.date || '-',
      ovr: dashboardData.status.ovr || '-',
    });

    refreshSaveSlots();
    setSaveModalMode(null);
    alert(`저장 슬롯 ${slot}에 저장했습니다.`);
  };

  const handleLoadSlot = (slot: SaveSlotNumber) => {
    const envelope = loadFromSlot<GameSavePayload>(slot);
    if (!envelope) {
      alert('저장 데이터를 읽을 수 없습니다.');
      refreshSaveSlots();
      return;
    }

    const game = envelope.game;
    setChatHistory(Array.isArray(game.chatHistory) ? game.chatHistory : []);
    setDashboardData(game.dashboardData ?? null);
    setSelectedRoute(game.selectedRoute ?? null);
    setDifficulty(game.difficulty ?? '보통');
    setPlayerForm(game.playerForm ?? playerForm);
    setCurrentView(game.currentView ?? 'CHAT');
    setRecordTab(game.recordTab ?? 'SEASON');
    setGameStage('GAME');
    setSaveModalMode(null);
  };

  const handleDeleteSlot = (slot: SaveSlotNumber) => {
    if (!confirm(`저장 슬롯 ${slot}을 삭제하시겠습니까?`)) return;
    deleteSlot(slot);
    refreshSaveSlots();
  };

  const parseResponse = (text: string) => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    let cleanText = text;
    
    if (match) {
      try {
        const jsonStr = match[1];
        const data = JSON.parse(jsonStr);
        setDashboardData(prev => {
           // Merge objects deeply for stats to preserve previous keys if new one is partial
           return {
             ...prev,
             ...data,
             advanced_stats: {
               ...(prev?.advanced_stats || {}),
               ...(data.advanced_stats || {})
             }
           } as DashboardData;
        });
        cleanText = text.replace(match[0], '').trim();
      } catch (e) {
        console.error("JSON Parse Error", e);
      }
    }
    return cleanText;
  };

  const sendMessage = async (text: string, isSystemInit = false) => {
    if (!text.trim() && !isLoading) return;
    
    let newHistory = [...chatHistory];
    if (!isSystemInit) {
      newHistory.push({ role: 'user', text, timestamp: Date.now() });
      setChatHistory(newHistory);
      setInput('');
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT_CORE + buildGameStateContext(dashboardData),
          history: buildAIHistory(newHistory),
          message: text
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'OpenAI API 호출에 실패했습니다.');
      }
      const responseText = payload.text || ""; 
      const displayText = parseResponse(responseText);

      setChatHistory(prev => [...prev, { role: 'model', text: displayText, timestamp: Date.now() }]);

    } catch (error: any) {
      console.error("API Error:", error);
      let errorMsg = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      if (error.message) {
        errorMsg += ` (${error.message})`;
      }
      setChatHistory(prev => [...prev, { role: 'model', text: `[SYSTEM ERROR] ${errorMsg}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERING HELPERS ---
  const posType = getPositionType(dashboardData?.status.position || playerForm.position);

  // --- RENDERING VIEWS ---

  if (gameStage === 'START') {
    return (
      <>
      {saveModalMode === 'load' && (
        <SaveSlotsModal
          mode="load"
          slots={saveSlots}
          onSelect={handleLoadSlot}
          onDelete={handleDeleteSlot}
          onClose={() => setSaveModalMode(null)}
        />
      )}
<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white bg-[url('https://images.unsplash.com/photo-1516731537543-b4aa4eb6a3da?q=80&w=2541&auto=format&fit=crop')] bg-cover bg-center bg-blend-multiply py-10 overflow-y-auto">
        <div className="bg-black/70 p-12 rounded-2xl backdrop-blur-sm border border-slate-700 text-center shadow-2xl animate-in zoom-in duration-300 max-w-lg w-full mx-4">
          <h1 className="text-5xl font-extrabold mb-2 text-green-400 font-mono tracking-tighter drop-shadow-lg">BASEBALL LIFE</h1>
          <p className="text-2xl text-gray-200 mb-8 font-extrabold tracking-wide drop-shadow-md">나만의 야구 선수 키우기: 시뮬레이션</p>
          
          <div className="space-y-4 flex flex-col w-full max-w-xs mx-auto">
            <button onClick={handleInitialStart} className="px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px]">
              <Power size={20} /> 새로 시작하기
            </button>
            <button onClick={() => openSaveModal('load')} className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg font-bold transition flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px]">
              <Save size={20} /> 이어하기
            </button>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-500 font-mono">Powered by OpenAI</div>
      </div>
      </>
    );
  }

  if (gameStage === 'ROUTE_SELECT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 py-10 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 text-green-400 text-center">커리어 시작 시점 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
          {/* High School Route */}
          <button 
            onClick={() => handleRouteSelect('HIGHSCHOOL_2024')}
            className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-green-500 rounded-xl p-6 text-left transition-all hover:-translate-y-1 shadow-xl flex flex-col h-auto min-h-[250px]"
          >
            <div className="absolute top-4 right-4 bg-slate-900 p-2 rounded-full text-slate-400 group-hover:text-green-400">
              <School size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">2024년 고교 1학년</h3>
            <p className="text-gray-400 text-sm mb-4">고교 주말리그부터 시작하여 전국대회 우승과 프로 지명을 목표로 합니다.</p>
            <ul className="text-xs text-gray-300 space-y-1 mt-auto">
              <li className="flex items-center gap-2"><Check size={12} className="text-green-500"/> 3년간의 성장 기간</li>
              <li className="flex items-center gap-2"><Check size={12} className="text-green-500"/> 청소년 국가대표 도전</li>
              <li className="flex items-center gap-2"><Check size={12} className="text-green-500"/> 신인 드래프트 이벤트</li>
            </ul>
          </button>

          {/* Pro Route */}
          <button 
            onClick={() => handleRouteSelect('PRO_2026')}
            className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-blue-500 rounded-xl p-6 text-left transition-all hover:-translate-y-1 shadow-xl flex flex-col h-auto min-h-[250px]"
          >
             <div className="absolute top-4 right-4 bg-slate-900 p-2 rounded-full text-slate-400 group-hover:text-blue-400">
              <Briefcase size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">2026년 KBO 신인</h3>
            <p className="text-gray-400 text-sm mb-4">프로 구단의 지명을 받은 신인 선수로 1군 데뷔와 주전 경쟁을 시작합니다.</p>
            <ul className="text-xs text-gray-300 space-y-1 mt-auto">
              <li className="flex items-center gap-2"><Check size={12} className="text-blue-500"/> 즉시 프로 무대 데뷔</li>
              <li className="flex items-center gap-2"><Check size={12} className="text-blue-500"/> 연봉 협상 및 FA</li>
              <li className="flex items-center gap-2"><Check size={12} className="text-blue-500"/> 빠른 해외 진출 가능</li>
            </ul>
          </button>
        </div>
        <button onClick={() => setGameStage('START')} className="mt-6 text-gray-500 hover:text-white underline text-sm">
          뒤로 가기
        </button>
      </div>
    );
  }

  if (gameStage === 'DIFFICULTY_SELECT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 overflow-y-auto py-10">
        <h2 className="text-3xl font-bold mb-8 text-green-400">난이도 설정</h2>
        <div className="flex flex-col gap-4 w-full max-w-md">
          {(['쉬움', '보통', '어려움', '매우 어려움'] as DifficultyType[]).map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultySelect(diff)}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500 p-6 rounded-xl text-left flex justify-between items-center transition group"
            >
              <div>
                <span className="text-xl font-bold block mb-1 group-hover:text-green-400 transition">{diff}</span>
                <span className="text-xs text-gray-500">
                  {diff === '쉬움' && "빠른 성장, 적은 부상, 넉넉한 기회"}
                  {diff === '보통' && "현실적인 밸런스, 가장 추천"}
                  {diff === '어려움' && "엄격한 경쟁, 성장 둔화, 칼같은 방출"}
                  {diff === '매우 어려움' && "극악의 난이도, 불운(억까) 존재"}
                </span>
              </div>
              <ChevronRight className="text-gray-600 group-hover:text-green-500" />
            </button>
          ))}
        </div>
         <button onClick={() => setGameStage('ROUTE_SELECT')} className="mt-8 text-gray-500 hover:text-white underline text-sm">
          뒤로 가기
        </button>
      </div>
    );
  }

  if (gameStage === 'PLAYER_FORM') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 overflow-y-auto py-10">
        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-green-400 flex items-center justify-center gap-2">
            <User size={28}/> 선수 정보 입력
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">이름</label>
              <input type="text" value={playerForm.name} onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})} placeholder="홍길동" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">포지션</label>
                <select value={playerForm.position} onChange={(e) => setPlayerForm({...playerForm, position: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none">
                  <option>투수</option><option>포수</option><option>1루수</option><option>2루수</option><option>3루수</option><option>유격수</option><option>좌익수</option><option>중견수</option><option>우익수</option><option>투타겸업</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">투타 유형</label>
                <select value={playerForm.role} onChange={(e) => setPlayerForm({...playerForm, role: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none">
                  <option>우투우타</option><option>우투좌타</option><option>좌투좌타</option><option>좌투우타</option>
                </select>
              </div>
            </div>
            {selectedRoute === 'HIGHSCHOOL_2024' ? (
              <>
                 <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">입학할 고교</label>
                  <select value={playerForm.school} onChange={(e) => setPlayerForm({...playerForm, school: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none">
                    {HIGH_SCHOOLS.map(school => <option key={school} value={school}>{school}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">선호 구단 (응원 팀)</label>
                  <select value={playerForm.team} onChange={(e) => setPlayerForm({...playerForm, team: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none">
                    <option value="랜덤">랜덤 (Random)</option>
                    <option>삼성 라이온즈</option><option>KIA 타이거즈</option><option>LG 트윈스</option><option>두산 베어스</option><option>KT 위즈</option><option>SSG 랜더스</option><option>롯데 자이언츠</option><option>한화 이글스</option><option>NC 다이노스</option><option>키움 히어로즈</option>
                  </select>
                </div>
              </>
            ) : (
               <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">소속 구단 (드래프트/입단)</label>
                <select value={playerForm.team} onChange={(e) => setPlayerForm({...playerForm, team: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none">
                   <option value="랜덤">랜덤 (드래프트/지명)</option>
                   <option>삼성 라이온즈</option><option>KIA 타이거즈</option><option>LG 트윈스</option><option>두산 베어스</option><option>KT 위즈</option><option>SSG 랜더스</option><option>롯데 자이언츠</option><option>한화 이글스</option><option>NC 다이노스</option><option>키움 히어로즈</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">플레이 스타일</label>
              <input type="text" value={playerForm.style} onChange={(e) => setPlayerForm({...playerForm, style: e.target.value})} placeholder="예: 강속구 파워피쳐, 정교한 컨택형 등" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"/>
            </div>
          </div>
          <button onClick={handleGameLaunch} className="w-full mt-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2">
            게임 시작 <ArrowRight size={20}/>
          </button>
           <button onClick={() => setGameStage('DIFFICULTY_SELECT')} className="w-full mt-4 text-gray-500 hover:text-white underline text-sm text-center">뒤로 가기</button>
        </div>
      </div>
    );
  }

  // --- GAME DASHBOARD UI ---

  return (
    <>
      {saveModalMode === 'save' && (
        <SaveSlotsModal
          mode="save"
          slots={saveSlots}
          onSelect={handleSaveSlot}
          onDelete={handleDeleteSlot}
          onClose={() => setSaveModalMode(null)}
        />
      )}
    <div className="flex h-[100dvh] bg-[#0f172a] text-gray-100 font-sans overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="hidden md:flex w-80 bg-slate-900 border-r border-slate-800 flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-slate-800 flex flex-col items-center bg-slate-800/50">
          <div className="w-24 h-24 bg-slate-700 rounded-full mb-4 flex items-center justify-center border-4 border-slate-800 shadow-inner relative overflow-hidden group">
            <User size={40} className="text-slate-400 group-hover:scale-110 transition" />
            <div className="absolute inset-0 border-2 border-green-500/30 rounded-full"></div>
          </div>
          <h2 className="text-xl font-bold text-white text-center">{dashboardData?.status.name || playerForm.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded font-mono border border-green-800">{dashboardData?.status.position}</span>
            <span className="text-xs text-gray-400">{dashboardData?.status.team}</span>
          </div>
        </div>
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
               <StatRow label="나이" value={dashboardData?.status.age} icon={<Calendar size={14} />} />
               <StatRow label="컨디션" value={dashboardData?.status.condition} icon={<Activity size={14} />} />
               <StatRow label="자산" value={dashboardData?.status.money} icon={<Trophy size={14} />} />
            </div>
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 p-3 rounded-lg border border-slate-700">
                <span className="text-sm text-gray-400">종합 등급</span>
                <span className="text-xl font-bold text-green-400 font-mono">{dashboardData?.status.ovr}</span>
            </div>
            
            {/* Core Stats by Position */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><TrendingUp size={12} /> 핵심 기록 요약</h3>
              <div className="grid grid-cols-2 gap-2">
                {(posType === 'BATTER') && (
                  <>
                    <BoxStat label="타율" value={dashboardData?.advanced_stats.avg} />
                    <BoxStat label="홈런" value={dashboardData?.advanced_stats.hr} />
                    <BoxStat label="OPS" value={dashboardData?.advanced_stats.ops} />
                    <BoxStat label="WAR" value={dashboardData?.advanced_stats.war_bat} />
                  </>
                )}
                {(posType === 'PITCHER') && (
                  <>
                    <BoxStat label="ERA" value={dashboardData?.advanced_stats.era} />
                    <BoxStat label="승리" value={dashboardData?.advanced_stats.w} />
                    <BoxStat label="탈삼진" value={dashboardData?.advanced_stats.so} />
                    <BoxStat label="WHIP" value={dashboardData?.advanced_stats.whip} />
                  </>
                )}
                {(posType === 'TWOWAY') && (
                  <>
                    <BoxStat label="타율" value={dashboardData?.advanced_stats.avg} />
                    <BoxStat label="ERA" value={dashboardData?.advanced_stats.era} />
                    <BoxStat label="홈런" value={dashboardData?.advanced_stats.hr} />
                    <BoxStat label="승리" value={dashboardData?.advanced_stats.w} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-2">
            <button onClick={() => openSaveModal('save')} className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-gray-300 border border-slate-700"><Save size={14} /> 저장하기</button>
            <button onClick={() => confirm("종료하시겠습니까?") && setGameStage('START')} className="flex items-center justify-center gap-2 py-2 bg-red-900/30 hover:bg-red-900/50 rounded text-xs text-red-300 border border-red-900/30"><Power size={14} /> 종료</button>
        </div>
      </div>

      {/* CENTER: Main Game Area */}
      <div className="flex-1 flex flex-col relative bg-slate-925 w-full">
        {/* Top Bar */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-sm shrink-0">
          <div className="font-mono text-green-500 font-bold text-sm md:text-lg flex items-center gap-2">
            <Calendar size={16} /> {dashboardData?.date}
          </div>
          <div className="hidden md:flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <NavTab label="중계석" icon={<MessageSquare size={14}/>} active={currentView === 'CHAT'} onClick={() => setCurrentView('CHAT')} />
            <NavTab label="스카우팅" icon={<User size={14}/>} active={currentView === 'STATS'} onClick={() => setCurrentView('STATS')} />
            <NavTab label="기록실" icon={<BarChart2 size={14}/>} active={currentView === 'RECORDS'} onClick={() => setCurrentView('RECORDS')} />
            <NavTab label="리그정보" icon={<Globe size={14}/>} active={currentView === 'LEAGUE'} onClick={() => setCurrentView('LEAGUE')} />
          </div>
          <div className="flex items-center gap-3">
             <div className="md:hidden text-xs text-gray-400 mr-2">{dashboardData?.status.name}</div>
             <button onClick={() => { setShowPhone(!showPhone); setPhoneApp('HOME'); }} className={`p-2 rounded-full transition relative ${showPhone ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
              <Smartphone size={20} />
              {dashboardData?.messages && dashboardData.messages.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>}
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm p-2">
            <NavIcon icon={<MessageSquare size={20}/>} active={currentView === 'CHAT'} onClick={() => setCurrentView('CHAT')} />
            <NavIcon icon={<User size={20}/>} active={currentView === 'STATS'} onClick={() => setCurrentView('STATS')} />
            <NavIcon icon={<BarChart2 size={20}/>} active={currentView === 'RECORDS'} onClick={() => setCurrentView('RECORDS')} />
            <NavIcon icon={<Globe size={20}/>} active={currentView === 'LEAGUE'} onClick={() => setCurrentView('LEAGUE')} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 game-scroll bg-[#0b1120] relative">
          
          {/* VIEW: CHAT */}
          {currentView === 'CHAT' && (
            <>
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 animate-pulse">
                  <Trophy size={48} className="mb-4 opacity-20"/>
                  <p>시뮬레이션을 시작하는 중...</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-4 md:p-5 shadow-lg ${msg.role === 'user' ? 'bg-green-700 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-gray-200 markdown-body rounded-tl-none'}`}>
                    <div className="whitespace-pre-wrap leading-relaxed"><FormattedText text={msg.text} /></div>
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-start"><div className="bg-slate-800 rounded-lg p-4 flex gap-2 items-center border border-slate-700"><span className="text-xs text-gray-400 mr-2">GM 생각 중...</span><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-150"></div></div></div>}
              <div ref={chatEndRef} />
            </>
          )}

          {/* VIEW: STATS */}
          {currentView === 'STATS' && (
             <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2"><Radar size={24}/> 상세 능력치 리포트</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Batting Skills (Batter or Two-way) */}
                        {(posType === 'BATTER' || posType === 'TWOWAY') && (
                          <div className="space-y-4">
                            <h4 className="text-sm text-gray-400 font-bold border-b border-slate-600 pb-2 flex items-center gap-2"><Target size={14}/> 타격/수비 능력</h4>
                            <AbilityBar label="컨택" value={dashboardData?.abilities.contact} color="bg-blue-500" />
                            <AbilityBar label="파워" value={dashboardData?.abilities.power} color="bg-red-500" />
                            <AbilityBar label="선구안" value={dashboardData?.abilities.eye} color="bg-yellow-500" />
                            <AbilityBar label="주력" value={dashboardData?.abilities.speed} color="bg-green-500" />
                            <AbilityBar label="수비" value={dashboardData?.abilities.defense} color="bg-purple-500" />
                          </div>
                        )}
                        
                        {/* Pitching Skills (Pitcher or Two-way) */}
                        {(posType === 'PITCHER' || posType === 'TWOWAY') && (
                          <div className="space-y-4">
                            <h4 className="text-sm text-gray-400 font-bold border-b border-slate-600 pb-2 flex items-center gap-2"><Zap size={14}/> 투구 능력</h4>
                            {dashboardData?.abilities.velocity && <div className="flex justify-between items-center py-2 border-b border-slate-700/50"><span className="text-sm text-gray-300">평균 구속</span><span className="text-lg font-mono font-bold text-white">{dashboardData.abilities.velocity}</span></div>}
                            <AbilityBar label="제구" value={dashboardData?.abilities.control} color="bg-cyan-500" />
                            <AbilityBar label="구위" value={dashboardData?.abilities.stuff} color="bg-teal-500" />
                            {dashboardData?.abilities.breaking && <div className="py-2"><div className="text-xs text-gray-500 mb-1">보유 구종</div><div className="text-sm font-bold text-white">{dashboardData.abilities.breaking}</div></div>}
                          </div>
                        )}

                        {/* Common Skills */}
                        <div className="space-y-4">
                            <h4 className="text-sm text-gray-400 font-bold border-b border-slate-600 pb-2 flex items-center gap-2"><Activity size={14}/> 공통/멘탈</h4>
                            <AbilityBar label="BQ (야구지능)" value={dashboardData?.abilities.bq} color="bg-indigo-500" />
                            <AbilityBar label="체력" value={dashboardData?.abilities.stamina} color="bg-orange-500" />
                            <div className="pt-4 mt-4 bg-slate-900/50 rounded-lg p-4 grid grid-cols-2 gap-4 text-center">
                                <div><div className="text-xs text-gray-500 mb-1">잠재력</div><div className="text-sm font-bold text-yellow-400">{dashboardData?.abilities.potential}</div></div>
                                <div><div className="text-xs text-gray-500 mb-1">멘탈</div><div className="text-sm font-bold text-blue-400">{dashboardData?.abilities.mental}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          )}

          {/* VIEW: RECORDS (Enhanced with Sabermetrics) */}
          {currentView === 'RECORDS' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex gap-2 bg-slate-800 p-1 rounded-lg w-fit border border-slate-700">
                  {['SEASON', 'YEARLY', 'CAREER'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setRecordTab(tab as any)}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition ${recordTab === tab ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-slate-700'}`}
                    >
                      {tab === 'SEASON' ? '현재 시즌' : tab === 'YEARLY' ? '연도별 기록' : '통산 기록'}
                    </button>
                  ))}
               </div>

               <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl min-h-[400px]">
                   {recordTab === 'SEASON' && (
                     <>
                        <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2"><BarChart2 size={24}/> 이번 시즌 상세 기록 (Sabermetrics)</h3>
                        <div className="overflow-x-auto"><RecordTable data={dashboardData?.advanced_stats} posType={posType} /></div>
                     </>
                   )}
                   {recordTab === 'YEARLY' && (
                     <>
                        <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2"><List size={24}/> 연도별 히스토리</h3>
                        <div className="overflow-x-auto pb-4">
                          <table className="w-full text-sm text-left text-gray-300 min-w-[800px]">
                             <thead className="text-xs text-gray-400 uppercase bg-slate-700/50">
                               <tr>
                                 <th className="px-3 py-3 sticky left-0 bg-slate-800 shadow-sm z-10">Year</th>
                                 <th className="px-3 py-3 sticky left-16 bg-slate-800 shadow-sm z-10">Team</th>
                                 {posType !== 'PITCHER' && (
                                    <>
                                      <th className="px-3 py-3 text-green-400">AVG</th>
                                      <th className="px-3 py-3">HR</th>
                                      <th className="px-3 py-3">RBI</th>
                                      <th className="px-3 py-3">SB</th>
                                      <th className="px-3 py-3 text-yellow-400">OPS</th>
                                      <th className="px-3 py-3 text-yellow-400">wRC+</th>
                                      <th className="px-3 py-3 text-blue-400">WAR</th>
                                    </>
                                 )}
                                 {posType !== 'BATTER' && (
                                    <>
                                      <th className="px-3 py-3 text-green-400">ERA</th>
                                      <th className="px-3 py-3">W</th>
                                      <th className="px-3 py-3">L</th>
                                      <th className="px-3 py-3">SV</th>
                                      <th className="px-3 py-3">SO</th>
                                      <th className="px-3 py-3 text-yellow-400">WHIP</th>
                                      <th className="px-3 py-3 text-yellow-400">FIP</th>
                                      <th className="px-3 py-3 text-blue-400">WAR</th>
                                    </>
                                 )}
                                 <th className="px-4 py-3">Note</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-700">
                               {dashboardData?.yearly_records?.map((rec, i) => (
                                 <tr key={i} className="hover:bg-slate-700/30">
                                   <td className="px-3 py-3 font-mono sticky left-0 bg-slate-800">{rec.year}</td>
                                   <td className="px-3 py-3 sticky left-16 bg-slate-800">{rec.team}</td>
                                   {posType !== 'PITCHER' && (
                                    <>
                                      <td className="px-3 py-3 font-mono font-bold text-white">{rec.avg || '-'}</td>
                                      <td className="px-3 py-3 font-mono">{rec.hr || '-'}</td>
                                      <td className="px-3 py-3 font-mono">{rec.rbi || '-'}</td>
                                      <td className="px-3 py-3 font-mono">{rec.sb || '-'}</td>
                                      <td className="px-3 py-3 font-mono text-yellow-200">{rec.ops || '-'}</td>
                                      <td className="px-3 py-3 font-mono text-yellow-200">{rec.wrc_plus || '-'}</td>
                                      <td className="px-3 py-3 font-mono font-bold text-blue-300">{rec.war || '-'}</td>
                                    </>
                                   )}
                                   {posType !== 'BATTER' && (
                                    <>
                                      <td className="px-3 py-3 font-mono font-bold text-white">{rec.era || '-'}</td>
                                      <td className="px-3 py-3 font-mono">{rec.w || '-'}</td>
                                      <td className="px-3 py-3 font-mono">{rec.l || '-'}</td>
                                      <td className="px-3 py-3 font-mono">{rec.sv || '-'}</td>
                                      <td className="px-3 py-3 font-mono">{rec.so || '-'}</td>
                                      <td className="px-3 py-3 font-mono text-yellow-200">{rec.whip || '-'}</td>
                                      <td className="px-3 py-3 font-mono text-yellow-200">{rec.fip || '-'}</td>
                                      <td className="px-3 py-3 font-mono font-bold text-blue-300">{rec.war || (posType === 'TWOWAY' ? '-' : '-')}</td>
                                    </>
                                   )}
                                   <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{rec.note || '-'}</td>
                                 </tr>
                               ))}
                               {(!dashboardData?.yearly_records || dashboardData.yearly_records.length === 0) && (
                                 <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">아직 기록된 시즌이 없습니다.</td></tr>
                               )}
                             </tbody>
                          </table>
                        </div>
                     </>
                   )}
                   {recordTab === 'CAREER' && (
                     <>
                        <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2"><Trophy size={24}/> 통산 기록 요약 (Career Highs included)</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <CareerBox label="경기 수 (G)" value={dashboardData?.career_stats.g} />
                            {(posType === 'BATTER' || posType === 'TWOWAY') && (
                              <>
                                <CareerBox label="타율 (AVG)" value={dashboardData?.career_stats.avg} />
                                <CareerBox label="홈런 (HR)" value={dashboardData?.career_stats.hr} />
                                <CareerBox label="타점 (RBI)" value={dashboardData?.career_stats.rbi} />
                                <CareerBox label="OPS" value={dashboardData?.career_stats.ops} color="text-yellow-400" />
                                <CareerBox label="wRC+" value={dashboardData?.career_stats.wrc_plus} color="text-yellow-400" />
                                <CareerBox label="WAR" value={dashboardData?.career_stats.war} color="text-blue-400" />
                                <CareerBox label="안타 (H)" value={dashboardData?.career_stats.h} />
                              </>
                            )}
                            {(posType === 'PITCHER' || posType === 'TWOWAY') && (
                              <>
                                <CareerBox label="ERA" value={dashboardData?.career_stats.era} />
                                <CareerBox label="승리 (W)" value={dashboardData?.career_stats.w} />
                                <CareerBox label="탈삼진 (SO)" value={dashboardData?.career_stats.so || dashboardData?.career_stats.k} />
                                <CareerBox label="WHIP" value={dashboardData?.career_stats.whip} color="text-yellow-400" />
                                <CareerBox label="FIP" value={dashboardData?.career_stats.fip} color="text-yellow-400" />
                                <CareerBox label="WAR" value={dashboardData?.career_stats.war} color="text-blue-400" />
                                <CareerBox label="세이브 (SV)" value={dashboardData?.career_stats.sv} />
                              </>
                            )}
                         </div>
                     </>
                   )}
               </div>
            </div>
          )}

          {/* VIEW: LEAGUE INFO (New) */}
          {currentView === 'LEAGUE' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Standings */}
                 <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Globe size={18} className="text-green-400"/> {dashboardData?.league_data?.league_name || "리그 순위"}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-500 uppercase bg-slate-900/50">
                          <tr><th className="px-3 py-2">순위</th><th className="px-3 py-2">팀</th><th className="px-3 py-2">승</th><th className="px-3 py-2">패</th><th className="px-3 py-2">차</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {dashboardData?.league_data?.standings?.map((team, i) => (
                             <tr key={i} className={team.team.includes(dashboardData.status.team) || team.team === playerForm.team ? "bg-green-900/20" : ""}>
                               <td className="px-3 py-2 font-mono font-bold">{team.rank}</td>
                               <td className="px-3 py-2">{team.team}</td>
                               <td className="px-3 py-2 font-mono">{team.w}</td>
                               <td className="px-3 py-2 font-mono">{team.l}</td>
                               <td className="px-3 py-2 font-mono text-gray-400">{team.gb}</td>
                             </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
                 
                 {/* Leaderboards */}
                 <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-400"/> 부문별 랭킹 (TOP 5)</h3>
                    <div className="space-y-4">
                       {dashboardData?.league_data?.leaderboards && Object.entries(dashboardData.league_data.leaderboards).map(([key, list]) => (
                         <div key={key} className="bg-slate-900/50 rounded-lg p-3">
                           <div className="text-xs font-bold text-green-400 uppercase mb-2 border-b border-slate-700 pb-1">{key}</div>
                           {(list as LeaderboardItem[]).map((p, idx) => (
                             <div key={idx} className="flex justify-between text-xs py-1">
                               <span className="text-gray-300 w-4 font-mono">{idx+1}</span>
                               <span className={`flex-1 ${p.name.includes(playerForm.name) ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>{p.name} <span className="text-[10px] text-gray-600">({p.team})</span></span>
                               <span className="font-mono font-bold text-white">{p.val}</span>
                             </div>
                           ))}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}

        </div>

        {currentView === 'CHAT' && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 z-10">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)} placeholder={isLoading ? "진행 중입니다..." : "행동을 입력하세요..."} disabled={isLoading} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition disabled:opacity-50"/>
              <button onClick={() => sendMessage(input)} disabled={isLoading} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-lg"><Send size={18} /><span className="hidden md:inline">전송</span></button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: SMARTPHONE OVERLAY (ENHANCED) */}
      {showPhone && (
        <div className="absolute right-4 bottom-24 w-80 h-[600px] bg-black rounded-[3rem] border-4 border-gray-800 shadow-2xl flex flex-col overflow-hidden z-20 animate-in slide-in-from-bottom-10 fade-in duration-300 ring-4 ring-black/50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-30 flex justify-center items-end pb-1"><div className="w-16 h-1 bg-gray-800 rounded-full"></div></div>
          <div className="h-8 bg-slate-950 text-white flex justify-between px-6 items-center text-[10px] pt-2"><span>12:40</span><div className="flex gap-1"><span>5G</span><span>100%</span></div></div>
          
          <div className="flex-1 bg-slate-900 overflow-y-auto custom-scrollbar relative">
             {/* HOME SCREEN */}
             {phoneApp === 'HOME' && (
               <div className="p-6 pt-12 grid grid-cols-4 gap-4">
                  <PhoneAppIcon icon={<MessageSquare size={24}/>} color="bg-green-500" name="문자" onClick={() => setPhoneApp('MSG')} badge={dashboardData?.messages?.length} />
                  <PhoneAppIcon icon={<Users size={24}/>} color="bg-blue-500" name="커뮤니티" onClick={() => setPhoneApp('SNS')} badge={dashboardData?.sns_feed?.filter(f=>f.type!=='NEWS').length} />
                  <PhoneAppIcon icon={<Newspaper size={24}/>} color="bg-red-500" name="뉴스" onClick={() => setPhoneApp('SNS')} />
                  <PhoneAppIcon icon={<Settings size={24}/>} color="bg-gray-600" name="설정" />
                  <div className="col-span-4 mt-8">
                     <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-slate-700/50">
                        <div className="text-4xl font-thin text-white text-center mb-1">{new Date().getHours()}:00</div>
                        <div className="text-xs text-gray-400 text-center">{dashboardData?.date}</div>
                     </div>
                  </div>
               </div>
             )}

             {/* MESSAGES APP */}
             {phoneApp === 'MSG' && (
               <div className="min-h-full bg-slate-950">
                 <PhoneHeader title="메시지" onBack={() => setPhoneApp('HOME')} />
                 <div className="p-2 space-y-2">
                    {dashboardData?.messages?.map((msg, i) => (
                      <div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm">
                        <div className="font-bold text-white mb-1 text-xs">{msg.from}</div>
                        <p className="text-slate-300 text-xs">{msg.content}</p>
                      </div>
                    ))}
                    {(!dashboardData?.messages || dashboardData.messages.length === 0) && <div className="text-center text-gray-600 text-xs py-10">메시지가 없습니다.</div>}
                 </div>
               </div>
             )}

             {/* SNS/COMMUNITY APP */}
             {phoneApp === 'SNS' && (
               <div className="min-h-full bg-slate-100">
                  <PhoneHeader title="Baseball Talk" onBack={() => setPhoneApp('HOME')} light />
                  <div className="divide-y divide-gray-200">
                     {dashboardData?.sns_feed?.map((post, i) => (
                       <div key={i} className={`p-3 ${post.type === 'NEWS' ? 'bg-white' : 'bg-white'}`}>
                          <div className="flex items-center gap-2 mb-1">
                             {post.type === 'NEWS' && <span className="bg-red-500 text-white text-[9px] px-1 rounded font-bold">NEWS</span>}
                             {post.type === 'COMMUNITY' && <span className="bg-blue-500 text-white text-[9px] px-1 rounded font-bold">포럼</span>}
                             <span className="font-bold text-black text-xs">{post.user}</span>
                          </div>
                          <p className="text-gray-800 text-xs leading-relaxed mb-2 font-medium">{post.content}</p>
                          <div className="flex gap-3 text-[10px] text-gray-500 font-bold">
                             <span>👍 {post.likes}</span>
                             <span>💬 {Math.floor(post.likes/5)}</span>
                          </div>
                       </div>
                     ))}
                     {(!dashboardData?.sns_feed || dashboardData.sns_feed.length === 0) && <div className="text-center text-gray-400 text-xs py-10">게시글이 없습니다.</div>}
                  </div>
               </div>
             )}
          </div>
          <div className="h-6 bg-slate-950 flex justify-center items-center pb-2 cursor-pointer hover:bg-slate-900 transition" onClick={() => setShowPhone(false)}>
            <div className="w-24 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

// --- HELPER COMPONENTS ---

const NavTab = ({ label, icon, active, onClick }: any) => (
  <button onClick={onClick} className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-2 ${active ? 'bg-slate-700 text-green-400 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
    {icon} {label}
  </button>
);
const NavIcon = ({ icon, active, onClick }: any) => (
  <button onClick={onClick} className={`p-2 ${active ? 'text-green-400' : 'text-gray-500'}`}>{icon}</button>
);

const PhoneAppIcon = ({ icon, color, name, onClick, badge }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group relative">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition`}>
      {icon}
    </div>
    <span className="text-[10px] text-gray-300 font-medium">{name}</span>
    {badge > 0 && <span className="absolute top-0 right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white border border-slate-900">{badge}</span>}
  </button>
);

const PhoneHeader = ({ title, onBack, light }: any) => (
  <div className={`h-12 flex items-center px-3 border-b ${light ? 'bg-white border-gray-200 text-black' : 'bg-slate-900 border-slate-800 text-white'}`}>
    <button onClick={onBack} className="p-1 mr-2"><ChevronRight className="rotate-180" size={20}/></button>
    <span className="font-bold">{title}</span>
  </div>
);

const StatRow = ({ label, value, highlight, icon }: any) => (
  <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-700/30 last:border-0">
    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">{icon}<span>{label}</span></div>
    <span className={`font-mono font-medium text-sm ${highlight ? 'text-green-400' : 'text-gray-200'}`}>{value || '-'}</span>
  </div>
);

const BoxStat = ({ label, value }: any) => (
  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 flex flex-col items-center hover:bg-slate-750 transition">
    <span className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">{label}</span>
    <span className="text-lg font-bold text-white font-mono">{value || '-'}</span>
  </div>
);

const CareerBox = ({ label, value, color }: any) => (
  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className={`text-xl font-bold font-mono ${color || 'text-white'}`}>{value || '-'}</div>
  </div>
);

const AbilityBar = ({ label, value, color }: { label: string, value?: string, color: string }) => {
  let percent = 50;
  if (value) { const numMatch = value.match(/(\d+)/); if (numMatch) percent = parseInt(numMatch[1], 10); }
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-1"><span className="text-xs font-medium text-gray-300 group-hover:text-white transition">{label}</span><span className="text-sm font-mono font-bold text-white">{value || '-'}</span></div>
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700"><div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div></div>
    </div>
  );
};

// Modified Record Table to filter/show relevant keys based on position
const RecordTable = ({ data, posType }: { data: AdvancedStats | undefined, posType: string }) => {
  if (!data) return <div className="text-gray-500 p-4">데이터가 없습니다.</div>;
  
  // Define relevant keys for each position
  let keys: string[] = [];
  if (posType === 'PITCHER') {
    keys = ['era', 'w', 'l', 'sv', 'so', 'whip', 'fip', 'k_9', 'bb_9', 'era_plus', 'war_pit'];
  } else if (posType === 'BATTER') {
    keys = ['avg', 'hr', 'rbi', 'sb', 'ops', 'woba', 'wrc_plus', 'iso', 'babip', 'war_bat'];
  } else {
    // Two-way
    keys = ['avg', 'hr', 'ops', 'wrc_plus', 'war_bat', 'era', 'w', 'so', 'fip', 'war_pit'];
  }

  return (
    <table className="w-full text-sm text-left text-gray-300">
       <thead className="text-xs text-gray-400 uppercase bg-slate-700/50"><tr><th className="px-4 py-3">Stat</th><th className="px-4 py-3">Value</th></tr></thead>
       <tbody className="divide-y divide-slate-700">
         {keys.map((k) => (
           <tr key={k} className="hover:bg-slate-700/30">
             <td className="px-4 py-3 font-bold text-slate-400 uppercase">{k.replace('_', ' ')}</td>
             <td className="px-4 py-3 font-mono font-bold text-white">{data[k] || '-'}</td>
           </tr>
         ))}
       </tbody>
    </table>
  );
};

// --- Formatted Text Renderer (Kept same) ---
const FormattedText = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    return (
      <>
        {lines.map((line, i) => {
          if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-green-400 mt-4 mb-2">{line.replace('### ', '')}</h3>;
          if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3 border-b border-slate-600 pb-1">{line.replace('## ', '')}</h2>;
          
          if (line.includes('|') || line.match(/^\s*(순위|이름|팀|AVG|ERA)/)) {
            return <div key={i} className="font-mono text-xs md:text-sm my-1 text-green-300 whitespace-pre overflow-x-auto">{line}</div>;
          }
          
          let content = line;
          let isBullet = false;
          if (line.trim().startsWith('- ')) {
            content = line.replace('- ', '');
            isBullet = true;
          }

          const parts = content.split(/(\*\*.*?\*\*)/g);
          const renderedParts = parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={idx} className="text-green-400 font-extrabold">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (isBullet) {
            return <div key={i} className="pl-4 -indent-4 my-1 text-gray-300">• {renderedParts}</div>;
          }

          if (line.startsWith('```')) return null;

          return <div key={i} className="min-h-[1.5em]">{renderedParts}</div>;
        })}
      </>
    );
};

export default App;

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}