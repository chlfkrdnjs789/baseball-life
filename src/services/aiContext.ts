export interface AIHistoryItem {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 5000;

/** API 비용과 컨텍스트 폭주를 막기 위해 최근 대화만 전달한다. */
export function buildAIHistory(history: AIHistoryItem[]): AIHistoryItem[] {
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      ...item,
      text: item.text.slice(0, MAX_MESSAGE_CHARS),
    }));
}

export function buildGameStateContext(dashboardData: unknown): string {
  if (!dashboardData) return '현재 게임 상태 데이터 없음';

  try {
    return `\n\n# 코드가 보관 중인 현재 게임 상태\n아래 상태와 모순되지 않게 다음 장면을 진행하라. 이전 기록을 임의로 초기화하지 마라.\n${JSON.stringify(dashboardData)}`;
  } catch {
    return '';
  }
}
