import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

async function callGroq(prompt: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function POST(req: Request) {
  const { topic, niche, count } = await req.json()

  try {
    const prompt = `
Generate ${count} ebook ideas.

Return ONLY JSON array:

[
  {
    "title": "",
    "angle": "",
    "targetAudience": "",
    "demandScore": 80,
    "competitionScore": 60,
    "monetizationScore": 75,
    "viralityScore": 70,
    "forgeScore": 0,
    "trend": "Rising"
  }
]

Rules:
- forgeScore = average of all scores
- trend = Rising | Stable | Hot
- real monetizable ideas only

Topic: ${topic}
Niche: ${niche}
`

    const raw = await callGroq(prompt)

    let ideas = []
    try {
      ideas = JSON.parse(raw)
    } catch {
      ideas = []
    }

    return NextResponse.json({ ideas })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'AI generation failed' },
      { status: 500 }
    )
  }
}