import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export async function POST(req: Request) {
  const { topic, niche, count } = await req.json()

  try {
    const prompt = `You are a digital product trend analyst and monetization expert.

Generate exactly ${count} trending PDF guide ideas for:
- Topic: "${topic || 'any trending topic'}"
- Niche: "${niche}"

Return ONLY a valid JSON array. No markdown, no explanation, no backticks. Raw JSON only:

[
  {
    "title": "Specific punchy guide title",
    "angle": "One sentence describing the unique angle",
    "targetAudience": "Who this is specifically for",
    "demandScore": 85,
    "competitionScore": 60,
    "monetizationScore": 78,
    "viralityScore": 72,
    "forgeScore": 74,
    "trend": "Rising"
  }
]

Rules:
- forgeScore = Math.round((demandScore + competitionScore + monetizationScore + viralityScore) / 4)
- trend must be exactly one of: "Rising", "Stable", "Hot"
- All scores are integers between 0-100
- Titles must be specific and sellable (not generic)
- Focus on ideas people actively search and would pay $7-$27 for
- Return ONLY the JSON array`

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    })

    const raw = completion.choices[0].message.content?.trim() || ''

    const ideas = JSON.parse(raw)

    return NextResponse.json({ ideas })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}