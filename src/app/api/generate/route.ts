// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canGenerateEbook, incrementUsage } from '@/lib/subscription/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens = 3000,
  retries = 5
): Promise<string> {
  // ... keep your existing callGroq function exactly as is ...
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
          temperature: 0.75,
          max_tokens: maxTokens,
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        const msg = data?.error?.message || ''
        const match = msg.match(/try again in ([0-9.]+)s/i)
        const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 + 2000 : 15000
        await sleep(waitMs)
        continue
      }
      if (!res.ok) throw new Error(data?.error?.message || 'Groq failed')
      const content = data.choices?.[0]?.message?.content?.trim() || ''
      if (!content) throw new Error('Empty response')
      return content
    } catch (err: any) {
      console.error(`Attempt ${i + 1} failed:`, err.message)
      if (i < retries) await sleep(4000 + i * 2000)
    }
  }
  return ''
}

function stripMd(text: string): string {
  // ... keep your existing stripMd function ...
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/^[-–—•]\s*/gm, '')
    .trim()
}

function extractJSON(raw: string): any {
  // ... keep your existing extractJSON function ...
  if (!raw) return null
  try {
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    cleaned = cleaned.slice(start, end + 1)
    cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    return JSON.parse(cleaned)
  } catch (e) {
    return null
  }
}

export async function POST(req: Request) {
  // ========== 🔒 SUBSCRIPTION CHECK - ADD THIS FIRST ==========
  
  // Create Supabase client with cookies
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
get(name: string) { return cookieStore.get(name)?.value },        set() { },
        remove() { },
      },
    }
  )

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Please login to generate ebooks' },
      { status: 401 }
    )
  }

  // Check if user can generate (plan limits)
  const { allowed, remaining, limit, planId } = await canGenerateEbook(user.id)

  if (!allowed) {
    return NextResponse.json(
      { 
        error: 'monthly_limit_reached',
        message: `You've reached your ${planId} plan limit of ${limit} ebooks this month. Upgrade to continue generating.`,
        remaining: 0,
        limit,
        planId,
        upgradeUrl: '/pricing'
      },
      { status: 403 }
    )
  }

  // ========== END OF SUBSCRIPTION CHECK ==========
  
  // Continue with your existing generation code...
  const { idea } = await req.json()
  const chaptersCount = idea.chapterCount || 6
  const bookLength = idea.bookLength || 'medium'
  const tone = idea.tone || 'Professional'

  const lengthConfig = {
    short: { parasPerChapter: 4, introParas: 3, conclusionParas: 2, tipCount: 3 },
    medium: { parasPerChapter: 6, introParas: 4, conclusionParas: 3, tipCount: 4 },
    long: { parasPerChapter: 9, introParas: 5, conclusionParas: 4, tipCount: 5 }
  }
  const cfg = lengthConfig[bookLength as keyof typeof lengthConfig] || lengthConfig.medium

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`))

      try {
        send('progress', { step: 'Planning your book structure...' })

        // STEP 1: Generate outline with chapter titles
        const outlinePrompt = `You are a professional book author. Create an outline for a ${bookLength}-length ebook.

TOPIC: "${idea.title}"
ANGLE: "${idea.angle}"
AUDIENCE: "${idea.targetAudience}"
TONE: ${tone}
NUMBER OF CHAPTERS: ${chaptersCount}

Generate a JSON object with this EXACT structure. No markdown, no explanation, only JSON:
{
  "title": "An improved, compelling title (6-10 words)",
  "subtitle": "A benefit-driven subtitle (8-12 words)",
  "chapters": [
    {"title": "Specific, actionable chapter title", "focus": "What problem this chapter solves"},
    {"title": "Another specific chapter title", "focus": "Key transformation in this chapter"}
  ]
}`

        const outlineRaw = await callGroq([
          { role: 'system', content: 'You are a professional book author. Output only valid JSON. No markdown, no explanation.' },
          { role: 'user', content: outlinePrompt }
        ], 1500)

        let outline = { title: idea.title, subtitle: idea.angle, chapters: [] as any[] }
        const parsedOutline = extractJSON(outlineRaw)
        if (parsedOutline) {
          outline.title = parsedOutline.title || idea.title
          outline.subtitle = parsedOutline.subtitle || idea.angle
          outline.chapters = parsedOutline.chapters || []
        }
        
        // Ensure we have enough chapters
        while (outline.chapters.length < chaptersCount) {
          outline.chapters.push({ 
            title: `Chapter ${outline.chapters.length + 1}`, 
            focus: `Key concepts and strategies for ${idea.title.toLowerCase()}`
          })
        }

        await sleep(1500)
        send('progress', { step: 'Writing introduction...' })

        // STEP 2: Introduction
        const introPrompt = `Write a compelling introduction for "${outline.title}".

AUDIENCE: ${idea.targetAudience}
TONE: ${tone}

Write ${cfg.introParas} paragraphs that:
1. Hook the reader with a relatable problem or desire
2. Explain why solving this matters RIGHT NOW
3. Preview what they'll learn (mention chapter topics)
4. ${cfg.introParas >= 4 ? 'Build credibility and trust' : 'End with an invitation to begin'}

CRITICAL RULES:
- Each paragraph MUST be unique content - NO repetition
- Each paragraph = 2-4 sentences
- Separate paragraphs with double newlines (\\n\\n)
- NO markdown, NO asterisks, NO bold
- NO phrases like "in this chapter" or "as you'll learn"

Return ONLY the introduction as plain text with double newlines between paragraphs.`

        let introduction = await callGroq([
          { role: 'system', content: 'You write engaging, unique content. Never repeat yourself. No markdown. Use double newlines between paragraphs.' },
          { role: 'user', content: introPrompt }
        ], 1200)
        introduction = stripMd(introduction).replace(/\*\*/g, '').replace(/\*/g, '')

        await sleep(1500)

        // STEP 3: Generate each chapter
        const chapters: any[] = []
        
        for (let i = 0; i < chaptersCount; i++) {
          send('progress', { step: `Writing chapter ${i + 1} of ${chaptersCount}...`, chapter: i + 1 })
          
          const ch = outline.chapters[i] || { title: `Chapter ${i + 1}`, focus: 'Practical strategies and insights' }
          
          const chapterPrompt = `Write Chapter ${i + 1}: "${ch.title}"

BOOK: "${outline.title}"
AUDIENCE: ${idea.targetAudience}
TONE: ${tone}
CHAPTER FOCUS: ${ch.focus}

Write ${cfg.parasPerChapter} substantive paragraphs that:
- Start with a strong, engaging opening
- Teach specific, actionable concepts
- Include a concrete example or scenario
- Address potential obstacles or questions
- End with a practical application

CRITICAL RULES:
- EVERY paragraph must be UNIQUE - NO repetition of phrases or ideas
- NEVER use placeholder text like "this chapter builds on everything"
- NEVER repeat the chapter title as the first sentence
- Each paragraph = 2-4 sentences
- Separate paragraphs with double newlines (\\n\\n)
- NO markdown, NO asterisks, NO bold
- Make it genuinely valuable for ${idea.targetAudience}

Return ONLY the chapter content as plain text with double newlines between paragraphs.`

          let chapterContent = await callGroq([
            { role: 'system', content: 'You write unique, valuable content. Never repeat yourself. Never use placeholder text. No markdown. Use double newlines between paragraphs.' },
            { role: 'user', content: chapterPrompt }
          ], bookLength === 'long' ? 3500 : 2500)
          
          chapterContent = stripMd(chapterContent)
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/^#+\s*/gm, '')
          
          // Generate tips for this chapter
          const tipsPrompt = `Generate ${cfg.tipCount} specific, actionable tips for a chapter titled "${ch.title}" in a book about ${idea.title}.

Each tip must:
- Be a specific action the reader can take TODAY
- Be directly related to "${ch.focus}"
- Be 8-15 words long
- Start with an action verb

Return as JSON array of strings. Example: ["Tip one here", "Tip two here", "Tip three here"]`

          const tipsRaw = await callGroq([
            { role: 'system', content: 'Output only valid JSON array of strings. No markdown, no explanation.' },
            { role: 'user', content: tipsPrompt }
          ], 500)
          
          let tips = [
            `Apply one concept from this chapter within 24 hours`,
            `Share your biggest insight with an accountability partner`,
            `Create a small action plan based on what you learned`
          ]
          
          try {
            const tipMatch = tipsRaw.match(/\[[\s\S]*\]/)
            if (tipMatch) {
              const parsedTips = JSON.parse(tipMatch[0])
              if (Array.isArray(parsedTips) && parsedTips.length >= 3) {
                tips = parsedTips.slice(0, cfg.tipCount)
              }
            }
          } catch (e) {
            console.error('Tips parse error:', e)
          }

          chapters.push({
            title: ch.title,
            content: chapterContent,
            tips: tips
          })

          if (i < chaptersCount - 1) {
            await sleep(2000)
          }
        }

        send('progress', { step: 'Writing conclusion...' })

        // STEP 4: Conclusion
        const conclusionPrompt = `Write a powerful conclusion for "${outline.title}".

AUDIENCE: ${idea.targetAudience}
TONE: ${tone}

Write ${cfg.conclusionParas} paragraphs that:
1. Recap the transformation journey (without repeating word-for-word)
2. Celebrate the reader's progress and potential
3. Provide ${cfg.conclusionParas >= 3 ? '3' : '2'} specific next steps they can take TODAY
4. ${cfg.conclusionParas >= 4 ? 'Address common fears or doubts' : 'End with an inspiring call to action'}

CRITICAL RULES:
- Each paragraph UNIQUE content
- NO markdown, NO bold, NO asterisks
- Double newlines between paragraphs
- Make it encouraging and actionable`

        let conclusion = await callGroq([
          { role: 'system', content: 'You write encouraging, actionable conclusions. No markdown. Use double newlines between paragraphs.' },
          { role: 'user', content: conclusionPrompt }
        ], 1000)
        conclusion = stripMd(conclusion).replace(/\*\*/g, '').replace(/\*/g, '')

        // STEP 5: Call to action
        const ctaPrompt = `Write a short, powerful call to action (2-3 sentences) for the end of "${outline.title}".
Encourage the reader to take immediate action on what they've learned.
Make it urgent, specific, and inspiring.
No markdown, no bold.`

        let callToAction = await callGroq([
          { role: 'system', content: 'Write 2-3 powerful, action-oriented sentences.' },
          { role: 'user', content: ctaPrompt }
        ], 300)
        callToAction = stripMd(callToAction).replace(/\*\*/g, '').replace(/\*/g, '')

        // ========== AFTER SUCCESSFUL GENERATION, INCREMENT USAGE ==========
        await incrementUsage(user.id)

        send('done', {
          content: {
            title: outline.title,
            subtitle: outline.subtitle,
            introduction: introduction || `Welcome to "${outline.title}". This guide will help you ${idea.angle.toLowerCase()}.`,
            chapters: chapters,
            conclusion: conclusion || `You've completed this journey. Now it's time to take action. Start with one small step today.`,
            callToAction: callToAction || `Download this guide and implement one strategy today. Your future self will thank you.`
          },
          // Also return usage info to the client
          usage: { remaining: remaining - 1, limit, planId }
        })

      } catch (error: any) {
        console.error('Generation error:', error)
        send('error', { message: error.message || 'Generation failed. Please try again.' })
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