import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * GROQ CALLER
 */
async function callGroq(prompt: string) {
  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500, // 🔥 reduced for stability
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Groq request failed')
  }

  return data.choices?.[0]?.message?.content || ''
}

/**
 * SAFE RETRY WRAPPER
 */
async function callAI(prompt: string, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await callGroq(prompt)
    } catch (err: any) {
      console.log(`Retry ${i + 1} failed`)

      await sleep(1500 + i * 1500)

      if (i === retries) {
        return '' // 🔥 never crash whole flow
      }
    }
  }

  return ''
}

/**
 * SAFE JSON
 */
function safeJSON(raw: string) {
  try {
    let cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')

    if (start === -1 || end === -1) {
      return { title: 'Generated Guide', subtitle: '' }
    }

    cleaned = cleaned.slice(start, end + 1)

    cleaned = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')

    return JSON.parse(cleaned)
  } catch {
    return { title: 'Generated Guide', subtitle: '' }
  }
}

/**
 * PROMPTS
 */
function introPrompt(idea: any) {
  return `
Write a detailed ebook introduction.

Title: ${idea.title}
Audience: ${idea.targetAudience}
Tone: ${idea.tone || 'Professional'}

Requirements:
- 4 paragraphs minimum
- Engaging storytelling
- Clear context
`
}

function chapterPrompt(idea: any, i: number, total: number) {
  return `
Write Chapter ${i} of ${total} for a premium ebook.

Title: ${idea.title}
Audience: ${idea.targetAudience}
Tone: ${idea.tone || 'Professional'}

Requirements:
- 6–8 paragraphs
- Deep explanations
- Real-world examples
- Educational + practical
`
}

function conclusionPrompt(idea: any) {
  return `
Write a powerful conclusion and call-to-action.

Title: ${idea.title}
Audience: ${idea.targetAudience}

Requirements:
- 3–4 paragraphs
- Motivational ending
- Clear action steps
`
}

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
    const introduction = await callAI(introPrompt(idea))

    // 3. CHAPTERS (🔥 CONTROLLED BATCH MODE)
    const chapters: any[] = []

    const batchSize = 2

    for (let i = 0; i < chaptersCount; i += batchSize) {
      const batchPromises = Array.from({ length: batchSize }, (_, j) => {
        const chapterIndex = i + j + 1
        if (chapterIndex > chaptersCount) return null

        return callAI(chapterPrompt(idea, chapterIndex, chaptersCount))
      }).filter(Boolean) as Promise<string>[]

      const results = await Promise.allSettled(batchPromises)

      results.forEach((res, idx) => {
        const chapterIndex = i + idx + 1

        if (res.status === 'fulfilled' && res.value) {
          chapters.push({
            title: `Chapter ${chapterIndex}`,
            content: res.value,
            tips: [
              'Apply consistently',
              'Practice daily',
              'Test in real scenarios',
            ],
          })
        } else {
          chapters.push({
            title: `Chapter ${chapterIndex}`,
            content:
              'This chapter failed to generate properly due to API limits.',
            tips: [],
          })
        }
      })

      await sleep(2000) // 🔥 prevents Groq overload
    }

    // 4. CONCLUSION (GUARANTEED)
    let conclusion = await callAI(conclusionPrompt(idea))

    if (!conclusion) {
      conclusion = `
This ebook is about execution.

Knowledge means nothing without action.
Start applying what you learned step by step.
`
    }

    // 5. FINAL RESPONSE
    return NextResponse.json({
      content: {
        title: meta.title || idea.title,
        subtitle: meta.subtitle || '',
        introduction,
        chapters,
        conclusion,
        callToAction:
          'Start applying these strategies today and build momentum.',
      },
    })
  } catch (e) {
    console.error('GENERATION ERROR:', e)

    return NextResponse.json(
      { error: 'Content generation failed' },
      { status: 500 }
    )
  }
}