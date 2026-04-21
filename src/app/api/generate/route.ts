import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens = 3000,
  retries = 5
): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.6,
          max_tokens: maxTokens,
        }),
      })

      const data = await res.json()

      if (res.status === 429) {
        const msg = data?.error?.message || ''
        const match = msg.match(/try again in ([0-9.]+)s/i)
        const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 + 2000 : 15000
        console.log(`Rate limited. Waiting ${waitMs}ms...`)
        await sleep(waitMs)
        continue
      }

      if (!res.ok) throw new Error(data?.error?.message || 'Groq failed')
      return data.choices?.[0]?.message?.content?.trim() || ''
    } catch (err: any) {
      console.log(`Attempt ${i + 1} failed:`, err.message)
      if (i < retries) await sleep(4000 + i * 2000)
    }
  }
  return ''
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#+\s?/g, '')
    .trim()
}

function extractJSON(raw: string): any {
  try {
    let cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) return null
    cleaned = cleaned.slice(start, end + 1)
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
    return JSON.parse(cleaned)
  } catch { return null }
}

export async function POST(req: Request) {
  const { idea } = await req.json()
  const chaptersCount = idea.chapterCount || 6

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`)
        )
      }

      try {
        // ── SYSTEM PROMPT ──
        const systemPrompt = `You are a professional ebook writer. You always follow instructions exactly.
When asked to return JSON, you ONLY return raw JSON. No markdown. No backticks. No explanation.
Your response starts with { and ends with }. Nothing before or after.
You NEVER use ** or * for emphasis in any text values. Write plain sentences only.`

        // ── META ──
        send('progress', { step: 'Reading your customizations...' })

        const metaRaw = await callGroq([
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Return a JSON object for an ebook with this topic: "${idea.title}". Tone: ${idea.tone || 'Professional'}.
{
  "title": "A compelling, specific ebook title",
  "subtitle": "One sentence describing what the reader will gain"
}`
          }
        ], 300)

        let meta = { title: idea.title, subtitle: idea.angle || '' }
        const metaParsed = extractJSON(metaRaw)
        if (metaParsed?.title) {
          meta = {
            title: stripMarkdown(metaParsed.title),
            subtitle: stripMarkdown(metaParsed.subtitle || ''),
          }
        }

        await sleep(2500)

        // ── INTRODUCTION ──
        send('progress', { step: 'Writing introduction...' })

        const introRaw = await callGroq([
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Write a 4-paragraph introduction for an ebook titled "${meta.title}".
Target audience: ${idea.targetAudience}. Tone: ${idea.tone || 'Professional'}.
Rules:
- Return PLAIN TEXT only. No JSON. No markdown. No ** or *.
- Each paragraph separated by a blank line.
- Be engaging and set up what the reader will learn.`
          }
        ], 1200)

        const introduction = stripMarkdown(introRaw) || `Welcome to ${meta.title}. This guide will walk you through everything you need to know.`

        await sleep(3000)

        // ── CHAPTERS ──
        const chapters = []
        const bookContext = `Ebook title: "${meta.title}". Total chapters: ${chaptersCount}. Audience: ${idea.targetAudience}. Tone: ${idea.tone || 'Professional'}.`

        for (let i = 1; i <= chaptersCount; i++) {
          send('progress', { step: `Writing chapter ${i} of ${chaptersCount}...`, chapter: i })
          console.log(`Generating chapter ${i}/${chaptersCount}...`)

          const chapterRaw = await callGroq([
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `${bookContext}

Write chapter ${i} of ${chaptersCount}. This chapter should cover a UNIQUE topic that fits naturally in the book's progression.

Return ONLY this JSON object. Start with { end with }:
{
  "title": "A specific, descriptive chapter title (NOT 'Key Strategies')",
  "content": "Seven full paragraphs of plain text. Each paragraph is 4-5 sentences. No markdown. No ** or *. Paragraphs separated by newline characters. Practical and detailed.",
  "tips": [
    "A specific actionable tip related to this chapter's topic",
    "Another specific tip related to this chapter",
    "A third specific tip",
    "A fourth tip",
    "A fifth tip"
  ]
}`
            }
          ], 3000)

          let chapter = {
  title: `Chapter ${i}`,
  content: `This chapter covers important strategies for ${meta.title}. Apply the principles consistently and track your progress over time.`,
  tips: [
    `Set a clear goal for what you want to achieve from this chapter`,
    `Schedule dedicated time to practice what you learn here`,
    `Track your results after implementing these strategies`,
    `Share your progress with an accountability partner`,
    `Review this chapter again after one week of practice`
  ],
}

          if (chapterRaw) {
            const parsed = extractJSON(chapterRaw)

            if (parsed && parsed.title && parsed.content && parsed.content.length > 150) {
              const chTitle = stripMarkdown(parsed.title)
              // Reject if title is still generic
              const isGeneric = ['key strategies', 'chapter', 'strategies', 'tips'].includes(chTitle.toLowerCase().trim())

              chapter = {
                title: isGeneric ? `Chapter ${i}: ${meta.title} Deep Dive` : chTitle,
                content: stripMarkdown(parsed.content),
                tips: Array.isArray(parsed.tips) && parsed.tips.length >= 3
                  ? parsed.tips.map((t: string) => stripMarkdown(t)).filter((t: string) => t.length > 5)
                  : chapter.tips,
              }
            } else {
              // JSON failed — extract plain text as content
              const plainText = stripMarkdown(
                chapterRaw
                  .replace(/```json|```/g, '')
                  .replace(/"title"\s*:/g, '')
                  .replace(/"content"\s*:/g, '')
                  .replace(/"tips"\s*:/g, '')
                  .replace(/[{}"[\]]/g, '')
                  .trim()
              )
              if (plainText.length > 150) {
                chapter.content = plainText.slice(0, 3000)
              }
            }
          }

          chapters.push(chapter)
          send('chapter_done', { chapter: i, total: chaptersCount })

          if (i < chaptersCount) {
            const delay = i % 2 === 0 ? 7000 : 4500
            console.log(`Waiting ${delay}ms before chapter ${i + 1}...`)
            await sleep(delay)
          }
        }

        await sleep(3000)

        // ── CONCLUSION ──
        send('progress', { step: 'Writing conclusion...' })

        const conclusionRaw = await callGroq([
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Write a 3-paragraph conclusion for an ebook titled "${meta.title}".
Audience: ${idea.targetAudience}.
Rules:
- Return PLAIN TEXT only. No JSON. No markdown. No ** or *.
- Be motivational, summarize key lessons, inspire action.
- Each paragraph separated by a blank line.`
          }
        ], 800)

        const conclusion = stripMarkdown(conclusionRaw) || 'You now have everything you need to succeed. Take action today and stay consistent.'

        // ── DONE ──
        send('done', {
          content: {
            title: meta.title,
            subtitle: meta.subtitle,
            introduction,
            chapters,
            conclusion,
            callToAction: 'Start applying these strategies today — one step at a time.',
          }
        })

      } catch (e) {
        console.error('GENERATION ERROR:', e)
        send('error', { message: 'Generation failed. Please try again.' })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}