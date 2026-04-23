// app/api/sales-content/route.ts
import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

async function callGroq(messages: any[], maxTokens = 3000) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function extractJSON(text: string): any {
  if (!text) return null
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) return null
  cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const { type, ebookData } = await req.json()

  try {
    if (type === 'sales-page') {
      const prompt = `You are a professional copywriter and web designer. Create a complete HTML sales page for this digital product:

TITLE: "${ebookData.title}"
DESCRIPTION: "${ebookData.subtitle || ebookData.description}"
TARGET AUDIENCE: "${ebookData.targetAudience || 'Entrepreneurs'}"
CHAPTERS: ${ebookData.chapters?.length || 6} chapters

Generate a COMPLETE, READY-TO-USE HTML page with:
- Modern, clean design (Tailwind CSS or inline styles)
- Responsive layout (works on mobile and desktop)
- Hero section with title and subtitle
- Problem/Solution section
- Benefits grid (4 benefits)
- What's inside section
- Testimonial section
- Pricing section with CTA button
- Footer with download link

Make it look professional and trustworthy. The CTA button should say "Get Instant Access" or similar.
Return ONLY the HTML code, no explanations.`

      const htmlContent = await callGroq([
        { role: 'system', content: 'You are an expert web designer. Output only valid HTML/CSS code. No markdown, no explanations.' },
        { role: 'user', content: prompt }
      ], 4000)

      return NextResponse.json({ success: true, data: { html: htmlContent } })
    }

    if (type === 'bundle') {
      const prompt = `You are a content strategist. Create social media content from this ebook:

TITLE: "${ebookData.title}"
DESCRIPTION: "${ebookData.subtitle || ebookData.description}"

Generate a JSON object:
{
  "twitterThread": "5 tweets that tease the ebook value (each tweet separated by \\n\\n)",
  "linkedinPost": "A professional post (150-200 words) positioning the author as an expert",
  "gumroadDescription": "Compelling product description for Gumroad (150-200 words) with emojis",
  "emailSequence": "3 short emails for a launch sequence (each separated by \\n---\\n)",
  "instagramCaption": "An engaging Instagram caption with relevant hashtags (8-10 hashtags)",
  "facebookPost": "A shareable Facebook post that drives engagement"
}

Return ONLY valid JSON.`

      const response = await callGroq([
        { role: 'system', content: 'You are a content strategist. Output only valid JSON.' },
        { role: 'user', content: prompt }
      ], 2500)

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      const bundle = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      
      return NextResponse.json({ success: true, data: bundle })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Sales content error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}