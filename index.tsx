import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
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


# ===== PATCH v0.4 적용 규칙 =====
# 나만의 야구 선수 키우기
## 통합 시스템 패치 v0.4
### 성장곡선·잠재력·컨디션 기반 구조

> 상태: 핵심 설계 진행 중  
> 이번 패치 범위: 게임 철학, 시간 진행, 성장곡선, 잠재력, 능력치 상한, 칭호 성장 보정, 컨디션 기본 구조

---

# 1. 게임 기본 철학

## 1.1 플레이어 권한

플레이어는 주인공의 행동, 훈련 방향, 인간관계 대응, 경기 전 준비, 장기 목표와 위험 감수 여부를 선택한다.

플레이어는 결과를 직접 결정할 수 없다.

- 가능: \`이번 달에는 수비 훈련을 집중적으로 한다.\`
- 불가능: \`이번 달 수비 능력치가 반드시 5 오른다.\`
- 가능: \`감독에게 주전 경쟁 의지를 강하게 밝힌다.\`
- 불가능: \`감독이 나를 주전으로 확정한다.\`

## 1.2 핵심 원칙

> 의도는 결과와 같지 않다.

결과는 현재 능력치, 컨디션, 피로, 부상, 훈련 누적, 실전 경험, 성격·특성, 인간관계, 팀 상황, 상대 수준, 난이도와 확률 요소를 종합하여 시스템이 판정한다.

## 1.3 주인공 보정 제한

주인공이라는 이유만으로 성공 결과를 보장하지 않는다.

다만 주인공은 장기적으로 잠재력 99에 도달해 모든 능력치를 99까지 성장시킬 가능성을 가진다. 이것은 즉시 보상이 아니라 장기 육성 목표다.

---

# 2. 시간 진행 시스템

## 2.1 기본 턴

> 1턴 = 1개월

한 달 동안 훈련, 경기, 학교 또는 팀 생활, 인간관계, 피로와 회복, 부상, 성장 경험, 이벤트와 커리어 변화를 처리한다.

## 2.2 세부 장면 전환

중요한 공식 경기, 주전 경쟁, 드래프트, 계약 협상, 부상, 갈등, 관계 변화, 국가대표 선발, 해외 진출, 우승 결정전, 성장 한계 돌파 이벤트에서는 월간 진행을 멈추고 장면 단위로 전환한다.

장면 종료 후 다시 월간 진행으로 복귀한다.

---

# 3. 능력치 시스템

## 3.1 능력치 범위

> 최소 1 / 최대 99

99는 해당 능력의 시스템상 최고 단계다.

## 3.2 능력치 의미

능력치는 일시적인 경기 결과가 아니라 선수의 장기적인 기본 실력을 나타낸다.

- 컨택 75: 기본 타격 접촉 능력 75
- 수비 82: 기본 수비 수행 능력 82
- 주력 90: 기본 주루·이동 능력 90

실제 경기력은 능력치 외에도 컨디션, 피로, 부상, 상대 수준과 경기 상황의 영향을 받는다.

---

# 4. 성장곡선

## 4.1 성장 기본 원칙

능력치에는 99라는 상한이 존재한다.

주인공의 성장 가능성을 임의의 낮은 수치로 영구 제한하지 않는다. 잠재력이 충분히 개방되면 모든 능력치를 99까지 성장시킬 수 있다.

## 4.2 구간별 성장 난이도

| 능력치 구간 | 성장 난이도 | 의미 |
|---|---|---|
| 1~59 | 낮음 | 기초 습득과 신체 성장으로 비교적 빠르게 상승 |
| 60~69 | 보통 | 체계적인 훈련이 필요 |
| 70~79 | 어려움 | 상위권 선수 수준 |
| 80~89 | 매우 어려움 | 리그 정상급 수준 |
| 90~94 | 극도로 어려움 | 세계적인 선수 수준 |
| 95~98 | 전설급 | 장기간의 실전, 훈련, 이벤트가 필요 |
| 99 | 시스템 최고 | 해당 분야의 완성 단계 |

## 4.3 성장 재료

능력치 상승은 반복 훈련, 훈련 품질, 실전 경험, 강한 상대와의 대결, 코칭, 자기관리, 슬럼프 극복, 중요 경기 경험, 성장 이벤트와 칭호 효과가 누적되어 발생한다.

단순히 훈련을 선언했다는 이유만으로 능력치가 자동 상승하지 않는다.

---

# 5. 잠재력 시스템

## 5.1 잠재력 정의

잠재력은 현재 능력치가 아니라 앞으로 성장할 수 있는 범위를 나타낸다.

예시:

- 현재 컨택 72
- 잠재력 84

이 경우 현재 컨택은 최대 84까지 성장 가능하다.

## 5.2 잠재력 최대치

잠재력의 시스템 최대치는 99다.

잠재력이 99가 되면 주인공은 모든 능력치를 99까지 성장시킬 수 있다.

> 잠재력 99 = 모든 능력치가 99에 도달할 수 있는 성장 경로가 완전히 개방된 상태

잠재력 99는 능력치가 즉시 99가 된다는 의미가 아니다.

## 5.3 잠재력 단계 개방

잠재력은 고교 정상급 도달, 프로 입단, 1군 주전 정착, 리그 정상급 활약, 국가대표 선발, 해외 리그 적응, MVP·우승, 전설급 성장 이벤트 등을 통해 단계적으로 확장될 수 있다.

## 5.4 시작 시 운명 고정 금지

게임 시작 시 단 한 번의 숨겨진 판정으로 최종 잠재력을 확정하지 않는다.

잠재력 99 도달 가능성은 커리어 전체에서 변한다.

상승 요인:

- 지속적인 훈련
- 좋은 자기관리
- 실전 성과
- 성장 이벤트 성공
- 슬럼프 극복
- 좋은 지도자
- 상위 무대 적응

하락 요인:

- 반복적인 자기관리 실패
- 장기 훈련 공백
- 치명적인 부상
- 잘못된 성장 방향
- 주요 이벤트 실패
- 출전 기회 상실
- 지속적인 과훈련

---

# 6. 난이도별 잠재력 99 도달 확률

다음 확률은 정상적으로 장기 플레이했을 때의 기본 기대치다.

| 난이도 | 잠재력 99 기본 도달 확률 |
|---|---:|
| 쉬움 | 약 95% |
| 보통 | 약 80% |
| 어려움 | 약 45% |
| 매우 어려움 | 약 20% |
| 극한 | 약 5% |

이 수치는 고정 확률이 아니다.

보통 난이도에서도 잘못된 육성을 반복하면 크게 낮아질 수 있고, 매우 어려움에서도 완벽한 육성, 핵심 이벤트 성공과 장기 자기관리로 기본값보다 높아질 수 있다.

난이도가 높아도 잠재력 99 도달은 불가능하지 않다.

---

# 7. 칭호 시스템과 성장 템포

## 7.1 칭호 정의

칭호는 중요한 업적, 성장 사건과 커리어 전환을 통해 얻는 영구 또는 장기 패시브 보상이다.

가능한 효과:

- 특정 훈련 성장 경험치 증가
- 전체 성장 효율 증가
- 고능력치 구간 성장 페널티 완화
- 슬럼프 회복 속도 증가
- 피로·부상 회복 보정
- 컨디션 유지력 증가
- 특정 상황 판정 보정

## 7.2 잠재력 99 칭호

일부 최상위 이벤트 또는 칭호는 잠재력을 99로 개방할 수 있다.

> 전설급 이벤트 달성  
> → 최상위 칭호 획득  
> → 잠재력 99 개방  
> → 모든 능력치를 99까지 성장 가능  
> → 이후 성장 템포 상승

## 7.3 성장 템포 증가 원칙

잠재력 99를 개방한 칭호는 이후 성장 속도를 높일 수 있다.

단, 능력치를 즉시 올리지는 않는다.

- 고능력치 구간 필요 경험치 감소
- 훈련 경험 획득량 증가
- 실전 경험 전환 효율 증가
- 성장 정체 확률 감소
- 95 이상 구간 성장 속도 보정

최종 수치는 칭호 시스템 설계 단계에서 확정한다.

---

# 8. 컨디션 기반 경기력 구조

## 8.1 능력치와 컨디션 분리

능력치는 기본 실력이고, 컨디션은 현재 경기에서 그 실력을 얼마나 발휘하는지를 나타낸다.

> 실제 경기력 = 기본 능력치 + 컨디션 보정 + 상황 보정

예시:

- 컨택 75 / 좋은 컨디션: 약 80~83 수준
- 컨택 75 / 보통 컨디션: 약 75 수준
- 컨택 75 / 나쁜 컨디션: 약 68~70 수준

정확한 공식은 컨디션 시스템 패치에서 확정한다.

## 8.2 슬럼프와 상승세

슬럼프와 상승세는 능력치의 영구 변화가 아니라 컨디션 흐름으로 표현한다.

슬럼프:

- 컨디션 상한 하락
- 경기력 저하
- 자신감 및 관계 영향 가능
- 수개월 지속 가능

상승세:

- 컨디션 상한 상승
- 일시적인 경기력 강화
- 자신감 상승
- 중요 이벤트 발생 가능

장기간의 슬럼프나 상승세는 이후 성장, 특성, 인간관계에 간접 영향을 줄 수 있다.

---

# 9. 훈련과 성장 판정 원칙

같은 훈련을 반복하더라도 매번 동일한 성장량을 얻지 않는다.

성장 효율 영향 요소:

- 현재 능력치와 잠재력
- 훈련 강도와 적합성
- 지도자와 시설 수준
- 컨디션과 피로
- 부상
- 나이
- 특성
- 칭호
- 난이도

## 9.1 과훈련

무조건 강하게 훈련하는 선택은 단기적으로 성장 경험을 많이 얻을 수 있으나 다음 위험이 있다.

- 피로 누적
- 컨디션 저하
- 부상 위험 증가
- 훈련 효율 감소
- 기술 밸런스 붕괴
- 장기 성장 지연

따라서 강훈련은 항상 최적의 선택이 아니다.

---

# 10. 자유 채팅 악용 방지

자유 입력은 행동 선언과 대화 선택에 사용한다.

다음 입력은 시스템상 효력을 가지지 않는다.

- 능력치 직접 변경
- 잠재력 직접 변경
- 경기 결과 강제
- NPC 감정 강제
- 계약 결과 강제
- 부상 제거 강제
- 칭호 임의 획득
- 세계관 규칙 무시

예시:

\`나는 천재니까 이번 달 모든 능력치가 10씩 오른다.\`

처리:

- 훈련 의지와 자신감 표현으로 해석 가능
- 능력치 상승량은 시스템이 별도 판정
- 직접적인 수치 변경은 무효

---

# 11. 확정된 핵심 구조 요약

1. 기본 진행은 1턴 1개월이다.
2. 중요 사건은 장면 단위로 세분화한다.
3. 플레이어는 행동을 정하지만 결과를 직접 정하지 못한다.
4. 능력치의 최대치는 99다.
5. 잠재력의 최대치는 99다.
6. 잠재력이 99가 되면 모든 능력치를 99까지 성장시킬 수 있다.
7. 잠재력 99는 능력치의 즉시 상승이 아니다.
8. 고능력치 구간일수록 성장 속도는 급격히 느려진다.
9. 잠재력은 커리어와 이벤트를 통해 단계적으로 개방된다.
10. 난이도는 잠재력 99 도달 확률과 성장 난도를 조절한다.
11. 칭호는 성장 효율과 잠재력 개방에 영향을 줄 수 있다.
12. 잠재력 99 칭호 획득 후 성장 템포가 상승할 수 있다.
13. 실제 경기력은 능력치와 컨디션을 분리하여 계산한다.
14. 슬럼프와 상승세는 컨디션 흐름으로 표현한다.
15. 자유 채팅으로 시스템 수치나 결과를 강제로 변경할 수 없다.

---

# 12. 다음 패치 예정 — v0.5

- 컨디션 단계
- 피로 수치
- 회복
- 과훈련
- 부상 발생 확률
- 부상 등급
- 경기력 보정 범위
- 슬럼프와 상승세의 발생 및 종료 조건

---

# 패치 상태

- 게임 철학: 확정
- 시간 진행: 확정
- 성장곡선: 확정
- 능력치 상한: 확정
- 잠재력 구조: 확정
- 난이도별 잠재력 99 확률: 확정
- 칭호 성장 템포: 기본 방향 확정
- 컨디션 구조: 기본 방향 확정, 세부 수치 미정
- 전체 시스템 예상 완성도: 약 35~40%


# ===== PATCH v0.5 적용 규칙 =====
# 나만의 야구 선수 키우기
## Patch v0.5 — 통합 컨디션 시스템

> 상태: 확정안  
> 적용 범위: 컨디션, 경기력 발휘, 훈련 효율, 회복, 부상 위험, 슬럼프와 상승세

---

# 1. 패치 목적

기존에 분리하려 했던 다음 요소를 하나의 시스템으로 통합한다.

- 체력
- 피로
- 몸 상태
- 정신 상태
- 회복 상태
- 경기 감각

이 게임에서는 위 요소를 별도의 수치로 복잡하게 나누지 않는다.

> **컨디션은 선수의 현재 몸과 정신 상태를 함께 나타내는 통합 지표다.**

컨디션은 영구 능력치가 아니다.

선수의 기본 실력은 능력치가 담당하고, 컨디션은 그 실력을 현재 얼마나 발휘할 수 있는지를 결정한다.

---

# 2. 핵심 공식

> **실제 경기력 = 기본 능력치 + 컨디션 보정 + 상황 보정**

예시:

- 기본 컨택 75
- 좋은 컨디션
- 상대 투수와의 상성 유리

이 경우 실제 경기에서는 75보다 높은 수준의 수행이 가능하다.

반대로:

- 기본 컨택 75
- 나쁜 컨디션
- 강한 상대 투수
- 중요한 경기에서 압박

이 경우 실제 경기에서는 75보다 낮은 수준의 수행이 나올 수 있다.

중요한 점은 컨디션이 능력치를 영구적으로 바꾸지 않는다는 것이다.

---

# 3. 컨디션 단계

컨디션은 5단계로 표시한다.

| 단계 | 표시 | 의미 |
|---|---|---|
| 5 | 최상 | 몸과 정신이 모두 매우 좋은 상태 |
| 4 | 좋음 | 안정적으로 능력을 잘 발휘하는 상태 |
| 3 | 보통 | 평소 수준의 능력을 발휘하는 상태 |
| 2 | 나쁨 | 피로, 스트레스, 부진 등이 영향을 주는 상태 |
| 1 | 최악 | 정상적인 경기력 발휘가 어려운 상태 |

컨디션은 플레이어에게 단계로 표시한다.

내부 계산에서 더 세밀한 수치를 사용할 수 있지만, 플레이어 화면에는 지나치게 복잡한 숫자를 노출하지 않는다.

---

# 4. 컨디션별 경기력 보정

기본 권장 범위는 다음과 같다.

| 컨디션 | 실제 경기력 보정 |
|---|---:|
| 최상 | 기본 능력의 약 +7~10% |
| 좋음 | 기본 능력의 약 +3~6% |
| 보통 | 약 -2~+2% |
| 나쁨 | 기본 능력의 약 -4~-8% |
| 최악 | 기본 능력의 약 -9~-15% |

예시: 컨택 80

| 컨디션 | 예상 발휘 범위 |
|---|---:|
| 최상 | 약 86~88 |
| 좋음 | 약 82~85 |
| 보통 | 약 78~82 |
| 나쁨 | 약 74~77 |
| 최악 | 약 68~73 |

이 수치는 경기 결과를 확정하는 값이 아니다.

상대 수준, 구장, 날씨, 경기 압박, 특성, 전술, 확률 요소가 추가로 적용된다.

능력치와 실제 발휘치는 모두 최대 99를 넘지 않는다.

---

# 5. 컨디션 변화 요인

## 5.1 상승 요인

다음 행동과 상황은 컨디션을 올릴 수 있다.

- 충분한 휴식
- 적절한 수면
- 균형 잡힌 훈련
- 좋은 경기 결과
- 연승
- 주전 경쟁 승리
- 인간관계 개선
- 부상 회복
- 자신감 상승
- 긍정적인 이벤트
- 좋은 팀 분위기

## 5.2 하락 요인

다음 행동과 상황은 컨디션을 낮출 수 있다.

- 연전
- 과도한 훈련
- 장거리 이동
- 휴식 부족
- 부상
- 반복된 부진
- 연패
- 주전 경쟁 실패
- 감독 또는 동료와의 갈등
- 중요한 경기의 압박
- 개인적인 스트레스
- 부정적인 이벤트

---

# 6. 컨디션 관리 원칙

컨디션은 플레이어가 관리할 수 있지만 완전히 통제할 수는 없다.

예시:

- 휴식을 선택해도 반드시 최상 컨디션이 되지는 않는다.
- 강훈련을 했다고 반드시 컨디션이 하락하지는 않는다.
- 좋은 경기를 했다고 항상 컨디션이 오르는 것은 아니다.
- 충분히 관리해도 일정과 부상 때문에 컨디션이 떨어질 수 있다.

> **컨디션은 조작하는 수치가 아니라 관리하는 상태다.**

플레이어는 좋은 선택을 통해 컨디션이 상승할 가능성을 높일 수 있다.

최종 변화는 최근 일정, 훈련, 경기 내용, 부상, 인간관계, 스트레스, 확률 요소를 종합해 시스템이 판정한다.

---

# 7. 훈련 효율과 컨디션

컨디션은 훈련 결과에도 영향을 준다.

| 컨디션 | 훈련 효과 |
|---|---|
| 최상 | 높은 훈련 효율, 성장 경험 추가 획득 가능 |
| 좋음 | 안정적인 훈련 효율 |
| 보통 | 기본 훈련 효율 |
| 나쁨 | 훈련 효율 감소, 무리할 경우 상태 악화 가능 |
| 최악 | 훈련 효율 크게 감소, 강훈련 시 부상 위험 증가 |

컨디션이 좋다고 능력치가 자동으로 상승하지 않는다.

컨디션은 훈련을 통해 얻는 성장 경험의 효율에 영향을 준다.

---

# 8. 강훈련과 과훈련

플레이어는 강한 훈련을 선택할 수 있다.

강훈련은 다음 장점을 가진다.

- 성장 경험 증가 가능
- 단기간 집중 성장 가능
- 특정 약점 보완 가능
- 중요한 경기 전 기술 완성 가능

하지만 다음 위험이 존재한다.

- 컨디션 하락
- 부상 위험 증가
- 다음 경기의 경기력 저하
- 훈련 효율 감소
- 장기 부진 가능성 증가

강훈련은 무조건 나쁜 선택이 아니다.

최근 일정이 여유롭고 컨디션이 좋다면 높은 효율을 낼 수 있다.

반대로 컨디션이 나쁜 상태에서 반복하면 과훈련 판정이 발생할 가능성이 높다.

별도의 피로 수치는 만들지 않는다.

피로 누적의 결과는 컨디션 변화로 반영한다.

---

# 9. 회복

회복은 컨디션을 정상 상태로 되돌리는 과정이다.

회복에 영향을 주는 요소:

- 휴식
- 수면
- 식단
- 치료
- 재활
- 트레이너
- 마사지
- 가벼운 회복 훈련
- 경기 출전 감소
- 심리적 안정

회복 행동은 컨디션 상승 가능성을 높인다.

그러나 회복을 선택했다고 해서 항상 한 단계 이상 상승하는 것은 아니다.

부상, 장기 부진, 중요한 사건, 빡빡한 일정이 있으면 회복이 늦어질 수 있다.

---

# 10. 부상 위험

별도의 피로 수치는 없지만 부상 시스템은 유지한다.

컨디션이 낮을수록 부상 위험이 증가한다.

부상 판정에 영향을 주는 요소:

- 현재 컨디션
- 훈련 강도
- 경기 출전량
- 연전
- 플레이 스타일
- 포지션
- 기존 부상
- 재활 상태
- 충돌 또는 돌발 상황
- 확률 요소

대략적인 원칙:

| 컨디션 | 부상 위험 |
|---|---|
| 최상 | 낮음 |
| 좋음 | 비교적 낮음 |
| 보통 | 기본 위험 |
| 나쁨 | 증가 |
| 최악 | 크게 증가 |

컨디션이 최상이어도 충돌이나 사고로 부상을 당할 수 있다.

컨디션이 최악이라고 반드시 부상을 당하는 것도 아니다.

---

# 11. 슬럼프

슬럼프는 단순한 능력치 하락이 아니다.

> **슬럼프는 낮은 경기력과 부정적인 컨디션 흐름이 일정 기간 이어지는 상태다.**

슬럼프 발생 요인:

- 반복된 부진
- 낮은 컨디션의 장기화
- 자신감 하락
- 부상 복귀 실패
- 주전 경쟁 실패
- 인간관계 갈등
- 과도한 압박
- 중요한 경기 실패

슬럼프 효과:

- 좋은 컨디션으로 회복하기 어려워짐
- 경기력 변동폭이 부정적으로 기울어짐
- 훈련 효율 감소 가능
- 인간관계 및 이벤트에 영향
- 추가 부진 이벤트 발생 가능

슬럼프는 영구 능력치를 직접 낮추지 않는다.

다만 장기 슬럼프로 훈련과 출전이 줄면 성장 속도가 간접적으로 늦어질 수 있다.

---

# 12. 상승세

상승세는 좋은 경기 결과와 긍정적인 컨디션 흐름이 일정 기간 이어지는 상태다.

상승세 발생 요인:

- 연속 안타
- 홈런 또는 결정적인 활약
- 연승
- 주전 경쟁 승리
- 중요한 경기 성공
- 자신감 상승
- 긍정적인 인간관계
- 좋은 컨디션 유지

상승세 효과:

- 좋은 컨디션 유지 가능성 증가
- 경기력 발휘 안정성 증가
- 성장 이벤트 발생 가능
- 감독과 동료 평가 상승 가능
- 중요한 기회 획득 가능

상승세 역시 영구 능력치를 직접 올리지 않는다.

다만 좋은 경기 경험과 이벤트를 통해 장기 성장에 간접적으로 도움을 줄 수 있다.

---

# 13. 컨디션의 시간 단위

기본 턴은 1개월이지만 컨디션은 한 달 안에서도 변할 수 있다.

월간 진행 시:

- 월초 컨디션
- 월중 주요 변화
- 중요 경기 당시 컨디션
- 월말 컨디션

을 구분해 처리할 수 있다.

중요한 경기나 이벤트에서는 현재 시점의 컨디션을 별도로 판정한다.

예시:

- 월초: 좋음
- 연전 이후: 보통
- 결승전 직전: 나쁨
- 휴식 이후 월말: 보통

따라서 월간 컨디션은 한 달 전체를 하나의 고정 상태로 처리하지 않는다.

---

# 14. 플레이어 표시 방식

플레이어에게는 다음과 같이 직관적으로 보여준다.

\`\`\`text
[현재 컨디션]
좋음

[최근 흐름]
상승

[주요 원인]
- 최근 3경기 연속 안타
- 훈련 강도 적절
- 팀 분위기 양호

[주의]
- 이번 달 출전 일정이 많아 상태 하락 가능
\`\`\`

정확한 내부 확률과 모든 계산식을 항상 공개하지 않는다.

다만 플레이어가 자신의 선택과 결과의 관계를 이해할 수 있도록 주요 원인은 알려준다.

---

# 15. 자유 입력 처리

플레이어는 자유 채팅으로 컨디션을 직접 변경할 수 없다.

예시:

\`나는 정신력이 강하니까 항상 최상 컨디션이다.\`

처리:

- 자신감 또는 의지 표현으로 해석
- 컨디션 직접 변경은 무효
- 실제 컨디션은 시스템이 판정

가능한 입력:

- \`이번 달은 훈련을 줄이고 회복에 집중한다.\`
- \`부진하지만 타격 훈련을 계속한다.\`
- \`결승전을 앞두고 휴식을 선택한다.\`
- \`감독에게 하루 휴식을 요청한다.\`

---

# 16. 확정 원칙

1. 컨디션은 현재 몸과 정신 상태를 나타내는 통합 지표다.
2. 별도의 피로 수치와 숨겨진 몸 상태는 만들지 않는다.
3. 능력치는 영구 실력이고 컨디션은 실력 발휘 정도다.
4. 컨디션은 능력치를 영구적으로 변경하지 않는다.
5. 컨디션은 경기력, 훈련 효율, 부상 위험에 영향을 준다.
6. 피로와 회복은 컨디션 변화로 표현한다.
7. 컨디션은 5단계로 표시한다.
8. 플레이어는 컨디션을 관리할 수 있지만 완전히 통제할 수 없다.
9. 휴식과 강훈련의 결과는 최근 상황을 종합해 판정한다.
10. 슬럼프와 상승세는 장기적인 컨디션 흐름이다.
11. 슬럼프와 상승세는 영구 능력치를 직접 바꾸지 않는다.
12. 중요 경기에서는 해당 시점의 컨디션을 별도로 판정한다.
13. 자유 입력으로 컨디션이나 경기 결과를 강제할 수 없다.
14. 복잡한 계산은 내부에서 처리하고 플레이어에게는 단계와 주요 원인을 보여준다.

---

# 17. 패치 결과

이번 패치로 다음 시스템을 하나로 통합했다.

- 경기 당일의 몸 상태
- 정신적 상태
- 피로 누적
- 회복
- 경기 감각
- 슬럼프
- 상승세
- 부상 위험 보정

따라서 별도의 다음 시스템은 만들지 않는다.

- 숨겨진 몸 상태
- 독립 피로 게이지
- 독립 정신력 게이지
- 독립 건강도 게이지

---

# 18. 다음 패치 예정

## Patch v0.6 — 능력치 체계

예정 범위:

- 타격 능력치
- 수비 능력치
- 주루 능력치
- 신체 능력치
- 포지션별 능력치
- 종합 능력치 계산 여부
- 능력치 공개 범위
- 타자와 투수 능력치 분리

---

## 패치 상태

- 컨디션 정의: 확정
- 컨디션 단계: 확정
- 경기력 보정 방향: 확정
- 훈련 효율 연동: 확정
- 회복 처리: 확정
- 피로 통합: 확정
- 부상 위험 연동: 확정
- 슬럼프·상승세: 확정
- 숨겨진 몸 상태: 폐기
- 독립 피로 수치: 폐기

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

// Game Creation Types
type GameStage = 'API_KEY_INPUT' | 'START' | 'ROUTE_SELECT' | 'DIFFICULTY_SELECT' | 'PLAYER_FORM' | 'GAME';
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
  const [userApiKey, setUserApiKey] = useState('');
  const [gameStage, setGameStage] = useState<GameStage>('API_KEY_INPUT');
  
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (currentView === 'CHAT') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, currentView]);

  const handleApiKeySubmit = () => {
    if (userApiKey.trim().length > 10) {
      setGameStage('START');
    } else {
      alert("유효한 API Key를 입력해주세요.");
    }
  };

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

  const handleLoadGame = () => {
    const saved = localStorage.getItem('baseball_save_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatHistory(parsed.chatHistory);
        setDashboardData(parsed.dashboardData);
        setGameStage('GAME');
      } catch (e) {
        alert("세이브 파일이 손상되었습니다.");
      }
    } else {
      alert("저장된 게임이 없습니다.");
    }
  };

  const handleSaveGame = () => {
    const saveObj = {
      chatHistory,
      dashboardData,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('baseball_save_v2', JSON.stringify(saveObj));
    alert("게임이 저장되었습니다.");
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
      // Use the user-provided API key here
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: SYSTEM_PROMPT_CORE,
          temperature: 0.7, 
        },
        history: newHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        }))
      });

      const response = await chat.sendMessage({ message: text });
      const responseText = response.text || ""; 
      const displayText = parseResponse(responseText);

      setChatHistory(prev => [...prev, { role: 'model', text: displayText, timestamp: Date.now() }]);

    } catch (error: any) {
      console.error("API Error:", error);
      let errorMsg = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      if (error.message) {
        if (error.message.includes("API key")) {
            errorMsg = "API Key가 유효하지 않습니다. 새로고침 후 다시 입력해주세요.";
        } else {
            errorMsg += ` (${error.message})`;
        }
      }
      setChatHistory(prev => [...prev, { role: 'model', text: `[SYSTEM ERROR] ${errorMsg}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERING HELPERS ---
  const posType = getPositionType(dashboardData?.status.position || playerForm.position);

  // --- RENDERING VIEWS ---

  if (gameStage === 'API_KEY_INPUT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 text-center">
            <div className="flex justify-center mb-6">
                <div className="bg-green-600 p-4 rounded-full shadow-lg">
                    <Key size={32} className="text-white" />
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">API Key 입력</h2>
            <p className="text-gray-400 mb-6 text-sm">
                게임을 시작하려면 Google Gemini API Key가 필요합니다.<br/>
                입력한 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
            </p>
            <input 
                type="password" 
                value={userApiKey} 
                onChange={(e) => setUserApiKey(e.target.value)} 
                placeholder="Google AI Studio API Key" 
                className="w-full bg-slate-950 border border-slate-600 rounded-lg p-3 text-white mb-4 focus:border-green-500 outline-none font-mono text-sm"
            />
            <button onClick={handleApiKeySubmit} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition flex items-center justify-center gap-2">
                확인 및 시작 <ArrowRight size={18}/>
            </button>
            <div className="mt-4 text-xs text-gray-500">
<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-green-400">
                    API Key 발급받기 (Google AI Studio)
                </a>
            </div>
        </div>
      </div>
    );
  }

  if (gameStage === 'START') {
    return (
<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white bg-[url('https://images.unsplash.com/photo-1516731537543-b4aa4eb6a3da?q=80&w=2541&auto=format&fit=crop')] bg-cover bg-center bg-blend-multiply py-10 overflow-y-auto">
        <div className="bg-black/70 p-12 rounded-2xl backdrop-blur-sm border border-slate-700 text-center shadow-2xl animate-in zoom-in duration-300 max-w-lg w-full mx-4">
          <h1 className="text-5xl font-extrabold mb-2 text-green-400 font-mono tracking-tighter drop-shadow-lg">BASEBALL LIFE</h1>
          <p className="text-2xl text-gray-200 mb-8 font-extrabold tracking-wide drop-shadow-md">나만의 야구 선수 키우기: 시뮬레이션</p>
          
          <div className="space-y-4 flex flex-col w-full max-w-xs mx-auto">
            <button onClick={handleInitialStart} className="px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px]">
              <Power size={20} /> 새로 시작하기
            </button>
            <button onClick={handleLoadGame} className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg font-bold transition flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px]">
              <Save size={20} /> 이어하기
            </button>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-500 font-mono">Powered by Gemini 2.5 Flash</div>
      </div>
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
            <button onClick={handleSaveGame} className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-gray-300 border border-slate-700"><Save size={14} /> 저장하기</button>
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