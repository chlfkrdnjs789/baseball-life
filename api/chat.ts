import OpenAI from 'openai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel에 OPENAI_API_KEY가 등록되지 않았습니다.' });
  }

  try {
    const { systemPrompt, history = [], message } = req.body ?? {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지가 없습니다.' });
    }

    const client = new OpenAI({ apiKey });
    const input = [
      { role: 'developer', content: String(systemPrompt || '') },
      ...history.map((item: any) => ({
        role: item.role === 'model' ? 'assistant' : 'user',
        content: String(item.text || '')
      })),
      { role: 'user', content: message }
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input
    });

    return res.status(200).json({ text: response.output_text || '' });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error?.message || 'OpenAI API 오류가 발생했습니다.' });
  }
}
