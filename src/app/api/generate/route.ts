import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * GROQ CALLER (NO SDK)
 */
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
      temperature: 0.6,
      max_tokens: 2500,
    }),
  })

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * SAFE JSON PARSER
 */
function safeJSON(raw: string) {
  try {
    let cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')

    if (start === -1 || end === -1) throw new Error('No JSON found')

    cleaned = cleaned.slice(start, end + 1)

    cleaned = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')

    return JSON.parse(cleaned)
  } catch {
    throw new Error('JSON parse failed')
  }
}

/**
 * AI CALL WITH RETRY
 */
async function callAI(prompt: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await callGroq(prompt)
    } catch (err: any) {
      if (err?.status === 429) {
        await sleep(2000 + i * 2000)
      } else {
        throw err
      }
    }
  }

  throw new Error('AI failed after retries')
}

/**
 * PROMPTS
 */
const buildIntroPrompt = (idea: any) => `
Write a detailed ebook introduction.

Title: ${idea.title}
Audience: ${idea.targetAudience}
Tone: ${idea.tone || 'Professional'}

Make it 3–5 deep paragraphs.
`

const buildChapterPrompt = (idea: any, i: number, total: number) => `
Write Chapter ${i} of ${total}.

Title: ${idea.title}
Audience: ${idea.targetAudience}
Tone: ${idea.tone || 'Professional'}

Requirements:
- Very detailed (6+ paragraphs)
- Examples + explanations
- Educational depth
`

const buildConclusionPrompt = (idea: any) => `
Write a strong conclusion + CTA.

Title: ${idea.title}
Audience: ${idea.targetAudience}
`

/**
 * MAIN ROUTE
 */
export async function POST(req: Request) {
  const { idea } = await req.json()

  try {
    const chaptersCount = idea.chapterCount || 6

    // 1. META
    const metaRaw = await callAI(`
Return ONLY JSON:
{
  "title": "",
  "subtitle": ""
}

Topic: ${idea.title}
`)

    const meta = safeJSON(metaRaw)

    // 2. INTRO
    const introduction = await callAI(buildIntroPrompt(idea))

    // 3. CHAPTERS
    const chapters = []

    for (let i = 1; i <= chaptersCount; i++) {
      const content = await callAI(buildChapterPrompt(idea, i, chaptersCount))

      chapters.push({
        title: `Chapter ${i}`,
        content,
        tips: [
          'Apply consistently',
          'Practice daily',
          'Test in real scenarios',
        ],
      })

      await sleep(800)
    }

    // 4. CONCLUSION
    const conclusion = await callAI(buildConclusionPrompt(idea))

    // 5. FINAL OUTPUT
    return NextResponse.json({
      content: {
        title: meta.title || idea.title,
        subtitle: meta.subtitle || '',
        introduction,
        chapters,
        conclusion,
        callToAction: 'Start applying these strategies today.',
      },
    })
  } catch (e) {
    console.error('GEN ERROR:', e)
    return NextResponse.json(
      { error: 'Content generation failed' },
      { status: 500 }
    )
  }
}