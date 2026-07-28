# Baseball Life OpenAI Edition

Gemini 기반 원본을 OpenAI API 기반으로 변환한 야구 커리어 시뮬레이터입니다.

## Vercel 환경 변수

- `OPENAI_API_KEY`: OpenAI API 키
- `OPENAI_MODEL`: 선택 사항. 기본값 `gpt-5-mini`

API 키는 브라우저에 노출되지 않고 `/api/chat` 서버리스 함수에서만 사용됩니다.
