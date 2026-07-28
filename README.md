# Baseball Life OpenAI v1.1

React + Vite 기반 AI 야구 커리어 시뮬레이터입니다.

## 실행

```bash
npm install
npm run dev
```

## Vercel 환경변수

- `OPENAI_API_KEY`: OpenAI Platform API 키
- `OPENAI_MODEL`: 선택 사항. 미설정 시 `gpt-5-mini`

## v1.1 핵심 변경

- 자동저장 없음
- 수동 저장 슬롯 3개
- 기존 저장 데이터 이전
- 최근 대화 12개만 API 전달
- 현재 게임 상태를 AI 프롬프트에 포함
