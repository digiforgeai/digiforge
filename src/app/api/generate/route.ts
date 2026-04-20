import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Safe JSON parser for single objects
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
      throw new Error('Invalid JSON boundaries')
    }

    cleaned = cleaned.slice(start, end + 1)
    cleaned = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')

    return JSON.parse(cleaned)
  } catch (err) {
    throw new Error('JSON parse failed')
  }
}

/**
 * Generic AI caller with retry
 */
async function callAI(prompt: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 2000,
      })

      return res.choices[0]?.message?.content || ''
    } catch (err: any) {
      if (err?.status === 429) {
        await sleep(3000 + i * 2000)
      } else {
        throw err
      }
    }
  }

  throw new Error('AI failed after retries')
}

/**
 * Build prompts per section
 */
function buildIntroPrompt(idea: any) {
  return `
Write a LONG, detailed introduction for a professional ebook.

Title: ${idea.title}
Audience: ${idea.targetAudience}
Tone: ${idea.tone || 'Professional'}

Make it:
- 3–5 paragraphs
- Engaging and educational
- Set context clearly
- No JSON, just plain text
`
}

function buildChapterPrompt(idea: any, chapterNumber: number, total: number) {
  return `
Write CHAPTER ${chapterNumber} of ${total} for a high-value ebook.

Title: ${idea.title}
Audience: ${idea.targetAudience}
Tone: ${idea.tone || 'Professional'}

REQUIREMENTS:
- VERY detailed (like a paid ebook chapter)
- 4–8 paragraphs minimum
- Include examples, explanations, frameworks
- Actionable insights

Return ONLY the chapter text. No JSON.
`
}

function buildConclusionPrompt(idea: any) {
  return `
Write a powerful conclusion + call-to-action for this ebook:

Title: ${idea.title}
Audience: ${idea.targetAudience}

Requirements:
- 2–4 paragraphs conclusion
- Strong motivational ending
- Clear call-to-action
- No JSON
`
}

/**
 * MAIN API
 */
export async function POST(req: Request) {
  const { idea } = await req.json()

  try {
    const chaptersCount = idea.chapterCount || 6

    // 1. TITLE + SUBTITLE (structured safe JSON)
    const metaPrompt = `
Create a ebook title and subtitle.

Return ONLY JSON:
{
  "title": "",
  "subtitle": ""
}

Topic: ${idea.title}
Tone: ${idea.tone || 'Professional'}
`

    const metaRaw = await callAI(metaPrompt)
    const meta = safeJSON(metaRaw)

    // 2. INTRODUCTION
    const introduction = await callAI(buildIntroPrompt(idea))

    // 3. CHAPTERS (STEP-BY-STEP)
    const chapters = []

    for (let i = 1; i <= chaptersCount; i++) {
      const content = await callAI(buildChapterPrompt(idea, i, chaptersCount))

      chapters.push({
        title: `Chapter ${i}`,
        content,
        tips: [
          "Apply this concept consistently",
          "Take notes while practicing",
          "Test it in real scenarios"
        ],
      })

      // small delay to avoid rate limit
      await sleep(1200)
    }

    // 4. CONCLUSION
    const conclusion = await callAI(buildConclusionPrompt(idea))

    // 5. FINAL ASSEMBLY
    const finalContent = {
      title: meta.title || idea.title,
      subtitle: meta.subtitle || '',
      introduction,
      chapters,
      conclusion,
      callToAction: "Start implementing these strategies today and build your results step-by-step."
    }

    return NextResponse.json({ content: finalContent })

  } catch (e) {
    console.error('GENERATION ERROR:', e)

    return NextResponse.json(
      { error: 'Content generation failed' },
      { status: 500 }
    )
  }
}