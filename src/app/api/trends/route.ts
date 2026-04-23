// app/api/trends/route.ts
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

  const isGeneralNiche = niche === 'General'
  
  // SUPER STRICT prompt for General - ONLY high potential ideas
  const prompt = isGeneralNiche ? `
You are an expert digital product researcher. Your job is to find ONLY the HIGHEST POTENTIAL ideas that will ACTUALLY make money.

IMPORTANT: If an idea doesn't meet ALL criteria below, DO NOT include it.

REQUIRED CRITERIA for each idea:
1. Monthly search volume > 1,000 (people actively searching)
2. Products in this space sell for $27-$97 (real price point)
3. Low competition (not saturated like "weight loss" or "get rich quick")
4. Target audience has buying intent (not just browsers)

RETURN ONLY ${count} ideas. If you can't find ${count} high-quality ideas, return fewer.

REAL EXAMPLES of GOOD ideas:
- "ChatGPT Prompts for Real Estate Agents" (search volume: 2,400, sells for $37)
- "Notion Dashboard for Freelance Project Management" (search volume: 1,800, sells for $47)
- "Faceless YouTube Script Templates" (search volume: 3,200, sells for $29)

RETURN ONLY JSON (no other text):

[
  {
    "title": "specific product title with keywords people search",
    "angle": "unique hook that makes this different from competitors",
    "targetAudience": "specific group with money (not 'everyone')",
    "whyItSells": "exact problem this solves + proof people pay for this",
    "searchTerms": ["exact keyword 1", "exact keyword 2", "exact keyword 3", "exact keyword 4"],
    "demandScore": 85-95,
    "competitionScore": 25-50,
    "monetizationScore": 80-95,
    "viralityScore": 70-90,
    "forgeScore": 0,
    "trend": "Hot"
  }
]

SCORING (NON-NEGOTIABLE FOR GENERAL):
- demandScore: NEVER below 80
- competitionScore: NEVER above 55
- monetizationScore: NEVER below 75
- forgeScore: automatically calculated as average
- trend: ALWAYS "Hot" for any idea you return

${topic ? `Focus specifically on: ${topic}` : 'Pick the absolute best trending opportunities right now'}

REMEMBER: Quality over quantity. Return fewer ideas if needed.
` : `
Generate ${count} digital product ideas for niche: ${niche}

Return ONLY JSON array:

[
  {
    "title": "",
    "angle": "",
    "targetAudience": "",
    "whyItSells": "1-2 sentences explaining exactly why this will sell",
    "searchTerms": ["term1", "term2", "term3", "term4"],
    "demandScore": 70-90,
    "competitionScore": 35-65,
    "monetizationScore": 65-85,
    "viralityScore": 60-85,
    "forgeScore": 0,
    "trend": "Rising or Hot"
  }
]

${topic ? `Topic focus: ${topic}` : ''}
Niche: ${niche}
`

  try {
    const raw = await callGroq(prompt)
    
    // Clean the response
    let cleanRaw = raw
    if (raw.includes('```json')) {
      cleanRaw = raw.split('```json')[1].split('```')[0]
    } else if (raw.includes('```')) {
      cleanRaw = raw.split('```')[1].split('```')[0]
    }
    
    let ideas = []
    try {
      ideas = JSON.parse(cleanRaw)
      
      // FOR GENERAL NICHE: Filter out low-score ideas
      let filteredIdeas = ideas
      if (isGeneralNiche) {
        filteredIdeas = ideas.filter((idea: any) => {
          const avgScore = (idea.demandScore + idea.monetizationScore) / 2
          return avgScore >= 75 && idea.competitionScore <= 60
        })
        
        // If filtering removed too many, use fallback
        if (filteredIdeas.length < Math.min(count, 3)) {
          filteredIdeas = getHighPotentialFallback(count)
        }
      }
      
      // Calculate forgeScore for all ideas
      filteredIdeas = filteredIdeas.map((idea: any) => ({
        ...idea,
        whyItSells: idea.whyItSells || getDefaultWhyItSells(idea.title),
        searchTerms: idea.searchTerms || getDefaultSearchTerms(idea.title),
        forgeScore: Math.round(
          (idea.demandScore + (100 - idea.competitionScore) + idea.monetizationScore + idea.viralityScore) / 4
        ),
        trend: isGeneralNiche ? 'Hot' : (idea.forgeScore > 70 ? 'Hot' : 'Rising')
      }))
      
      // Sort by forgeScore (highest first)
      filteredIdeas.sort((a: any, b: any) => b.forgeScore - a.forgeScore)
      
      return NextResponse.json({ ideas: filteredIdeas })
      
    } catch (parseError) {
      console.error('Parse error:', parseError)
      const fallback = isGeneralNiche ? getHighPotentialFallback(count) : getFallbackIdeas(count, niche)
      return NextResponse.json({ ideas: fallback })
    }
    
  } catch (e) {
    console.error(e)
    const fallback = isGeneralNiche ? getHighPotentialFallback(count) : getFallbackIdeas(count, niche)
    return NextResponse.json({ ideas: fallback })
  }
}

// HIGH QUALITY fallback ideas for General niche (all scores 75+)
function getHighPotentialFallback(count: number): any[] {
  const highPotentialIdeas = [
    {
      title: "AI Sales Scripts for Etsy Sellers",
      angle: "Done-for-you conversation scripts that convert tire-kickers into buyers",
      targetAudience: "Etsy shop owners with <100 sales who struggle with customer conversion",
      whyItSells: "Etsy sellers lose 40% of potential sales due to bad messaging. One script pays for itself.",
      searchTerms: ["etsy sales script", "convert etsy customers", "ai for etsy sellers", "etsy message templates"],
      demandScore: 92, competitionScore: 38, monetizationScore: 89, viralityScore: 84, forgeScore: 82, trend: "Hot"
    },
    {
      title: "Faceless IG Reel Templates Pack",
      angle: "100 editable templates for faceless accounts (no face, no voice needed)",
      targetAudience: "Introverted creators wanting to build an audience anonymously",
      whyItSells: "Faceless accounts are growing 300% faster. Most fail because they can't create consistent content.",
      searchTerms: ["faceless instagram", "reel templates", "anonymous content creator", "viral reel formula"],
      demandScore: 94, competitionScore: 45, monetizationScore: 86, viralityScore: 95, forgeScore: 82, trend: "Hot"
    },
    {
      title: "Notion Client Portal for Freelancers",
      angle: "All-in-one dashboard that makes freelancers look professional (templates + automations)",
      targetAudience: "Freelancers making $2k-5k/month who want to charge higher rates",
      whyItSells: "Freelancers using client portals charge 2-3x more. This saves 10+ hours of setup per client.",
      searchTerms: ["notion for freelancers", "client portal template", "freelance organization", "notion dashboard"],
      demandScore: 88, competitionScore: 52, monetizationScore: 91, viralityScore: 76, forgeScore: 76, trend: "Hot"
    },
    {
      title: "ChatGPT Prompts for Cold Email",
      angle: "250 tested prompts that generate replies (used by 500+ founders)",
      targetAudience: "Agency owners and B2B freelancers who send >50 cold emails/week",
      whyItSells: "Cold email converts at 1-3% normally. These prompts get 8-12% reply rates.",
      searchTerms: ["cold email prompts", "chatgpt for sales", "email outreach templates", "b2b lead generation"],
      demandScore: 91, competitionScore: 48, monetizationScore: 88, viralityScore: 82, forgeScore: 78, trend: "Hot"
    },
    {
      title: "Digital Planner for ADHD Entrepreneurs",
      angle: "Daily/Weekly system designed for the ADHD brain (not neurotypical planners)",
      targetAudience: "Entrepreneurs with ADHD who've tried and failed with normal planners",
      whyItSells: "ADHD entrepreneurs spend $200+/year on planners that don't work. This is built differently.",
      searchTerms: ["adhd planner", "digital planner for adhd", "adhd entrepreneur tools", "notion adhd template"],
      demandScore: 89, competitionScore: 42, monetizationScore: 87, viralityScore: 79, forgeScore: 78, trend: "Hot"
    },
    {
      title: "TikTok Affiliate Script Vault",
      angle: "100+ proven scripts that have generated $10k+ in affiliate commissions",
      targetAudience: "TikTok creators with 1k-10k followers wanting to monetize",
      whyItSells: "Most affiliates fail because they don't know what to say. These scripts are battle-tested.",
      searchTerms: ["tiktok affiliate marketing", "affiliate script", "tiktok shop scripts", "make money tiktok"],
      demandScore: 93, competitionScore: 56, monetizationScore: 90, viralityScore: 91, forgeScore: 79, trend: "Hot"
    }
  ]
  
  return highPotentialIdeas.slice(0, Math.min(count, highPotentialIdeas.length))
}

function getFallbackIdeas(count: number, niche: string): any[] {
  // Generic fallback for other niches
  return Array(Math.min(count, 3)).fill(null).map((_, i) => ({
    title: `${niche} Digital Product Bundle ${i + 1}`,
    angle: "Curated collection of high-demand templates and tools",
    targetAudience: `${niche} professionals looking to scale their income`,
    whyItSells: "Proven demand with multiple monetization paths",
    searchTerms: [`${niche.toLowerCase()} templates`, `digital products for ${niche.toLowerCase()}`, `make money in ${niche.toLowerCase()}`],
    demandScore: 75, competitionScore: 50, monetizationScore: 70, viralityScore: 65,
    forgeScore: 65, trend: "Rising"
  }))
}

function getDefaultWhyItSells(title: string): string {
  if (title.toLowerCase().includes("template")) return "Saves 10+ hours of work. Templates are the #1 selling digital product."
  if (title.toLowerCase().includes("prompt")) return "AI prompts are selling like crazy. One good prompt saves hours of trial and error."
  if (title.toLowerCase().includes("notion")) return "Notion templates have a $50M+ market. Users pay for systems that save time."
  return "High demand niche with clear buyer intent. Multiple upsell opportunities available."
}

function getDefaultSearchTerms(title: string): string[] {
  return [
    title.toLowerCase().replace(/[^a-z0-9]/g, ' ').slice(0, 30),
    "digital product",
    "make money online",
    "passive income"
  ]
}