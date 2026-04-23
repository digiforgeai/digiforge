// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { incrementUsage } from "@/lib/subscription/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens = 3000,
  retries = 5,
): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages,
            temperature: 0.75,
            max_tokens: maxTokens,
          }),
        },
      );
      const data = await res.json();
      if (res.status === 429) {
        const msg = data?.error?.message || "";
        const match = msg.match(/try again in ([0-9.]+)s/i);
        const waitMs = match
          ? Math.ceil(parseFloat(match[1])) * 1000 + 2000
          : 15000;
        await sleep(waitMs);
        continue;
      }
      if (!res.ok) throw new Error(data?.error?.message || "Groq failed");
      const content = data.choices?.[0]?.message?.content?.trim() || "";
      if (!content) throw new Error("Empty response");
      return content;
    } catch (err: any) {
      console.error(`Attempt ${i + 1} failed:`, err.message);
      if (i < retries) await sleep(4000 + i * 2000);
    }
  }
  return "";
}

function stripMd(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s*/g, "")
    .replace(/^[-–—•]\s*/gm, "")
    .trim();
}

function extractJSON(raw: string): any {
  if (!raw) return null;
  try {
    let cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    cleaned = cleaned.slice(start, end + 1);
    cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  // ========== First, get the request data ==========
  const { idea } = await req.json();
  const chaptersCount = idea.chapterCount || 6;
  const bookLength = idea.bookLength || "medium";
  const tone = idea.tone || "Professional";

  // ========== Then authenticate user ==========
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Please login to generate ebooks" },
      { status: 401 },
    );
  }

  // ========== Get user's plan from database ==========
  const { data: planData } = await supabase
    .from("user_plans")
    .select("plan_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const userPlan = planData?.plan_id || "free";

  // ========== PRIORITY SPEED FOR PRO USERS ==========
const isPriority = userPlan === 'pro';

// For Pro users: reduce delays between chapters
const chapterDelay = isPriority ? 500 : 2000;
const introDelay = isPriority ? 500 : 1500;
const outlineDelay = isPriority ? 500 : 1500;

console.log(`⚡ Priority mode: ${isPriority ? 'ACTIVE (Pro user)' : 'OFF'}`);

  // ========== VALIDATE CHAPTER COUNT AGAINST PLAN ==========
  const MAX_CHAPTERS_BY_PLAN: Record<string, number> = {
    free: 3,
    starter: 6,
    pro: 12,
  };

  if (chaptersCount > MAX_CHAPTERS_BY_PLAN[userPlan]) {
    return NextResponse.json(
      {
        error: "plan_limit_exceeded",
        message: `Your ${userPlan} plan allows up to ${MAX_CHAPTERS_BY_PLAN[userPlan]} chapters. Upgrade to unlock more.`,
      },
      { status: 403 },
    );
  }

  // ========== VALIDATE BOOK LENGTH AGAINST PLAN ==========
  const ALLOWED_LENGTHS: Record<string, string[]> = {
    free: ["short"],
    starter: ["short", "medium"],
    pro: ["short", "medium", "long"],
  };

  if (!ALLOWED_LENGTHS[userPlan].includes(bookLength)) {
    return NextResponse.json(
      {
        error: "plan_limit_exceeded",
        message: `Book length "${bookLength}" is not available on your ${userPlan} plan. Upgrade to access.`,
      },
      { status: 403 },
    );
  }

  // ========== Check monthly generation limit ==========
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyCount } = await supabase
    .from("generated_ebooks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const monthlyLimit =
    userPlan === "free" ? 2 : userPlan === "starter" ? 10 : 30;
  const remaining = Math.max(0, monthlyLimit - (monthlyCount || 0));

  if (remaining <= 0) {
    return NextResponse.json(
      {
        error: "monthly_limit_reached",
        message: `You've reached your ${userPlan} plan limit of ${monthlyLimit} ebooks this month. Upgrade to continue generating.`,
        remaining: 0,
        limit: monthlyLimit,
        planId: userPlan,
        upgradeUrl: "/pricing",
      },
      { status: 403 },
    );
  }
  // ========== END OF SUBSCRIPTION CHECK ==========

  const lengthConfig = {
    short: {
      parasPerChapter: 5,
      introParas: 3,
      conclusionParas: 2,
      tipCount: 3,
      targetWordsPerChapter: 400,
      tokenLimit: 2500,
    },
    medium: {
      parasPerChapter: 8,
      introParas: 4,
      conclusionParas: 3,
      tipCount: 4,
      targetWordsPerChapter: 600,
      tokenLimit: 3000,
    },
    long: {
      parasPerChapter: 20,
      introParas: 8,
      conclusionParas: 6,
      tipCount: 8,
      targetWordsPerChapter: 1200,
      tokenLimit: 8000,
    },
  };
  const cfg =
    lengthConfig[bookLength as keyof typeof lengthConfig] ||
    lengthConfig.medium;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`),
        );

      try {
        send("progress", { 
  step: isPriority 
    ? "⚡ PRIORITY QUEUE - Planning your book structure at lightning speed..." 
    : "Planning your book structure..." 
});

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
}`;

        const outlineRaw = await callGroq(
          [
            {
              role: "system",
              content:
                "You are a professional book author. Output only valid JSON. No markdown, no explanation.",
            },
            { role: "user", content: outlinePrompt },
          ],
          1500,
        );

        let outline = {
          title: idea.title,
          subtitle: idea.angle,
          chapters: [] as any[],
        };
        const parsedOutline = extractJSON(outlineRaw);
        if (parsedOutline) {
          outline.title = parsedOutline.title || idea.title;
          outline.subtitle = parsedOutline.subtitle || idea.angle;
          outline.chapters = parsedOutline.chapters || [];
        }

        // Ensure we have enough chapters
        while (outline.chapters.length < chaptersCount) {
          outline.chapters.push({
            title: `Chapter ${outline.chapters.length + 1}`,
            focus: `Key concepts and strategies for ${idea.title.toLowerCase()}`,
          });
        }

        await sleep(outlineDelay);
        send("progress", { 
  step: isPriority 
    ? "⚡ Writing introduction (Priority mode)..." 
    : "Writing introduction..." 
});

        // STEP 2: Introduction
        const introPrompt = `Write a compelling introduction for "${outline.title}".

AUDIENCE: ${idea.targetAudience}
TONE: ${tone}

Write ${cfg.introParas} paragraphs that:
1. Hook the reader with a relatable problem or desire
2. Explain why solving this matters RIGHT NOW
3. Preview what they'll learn (mention chapter topics)
4. ${cfg.introParas >= 4 ? "Build credibility and trust" : "End with an invitation to begin"}

CRITICAL RULES:
- Each paragraph MUST be unique content - NO repetition
- Each paragraph = 2-4 sentences
- Separate paragraphs with double newlines (\\n\\n)
- NO markdown, NO asterisks, NO bold
- NO phrases like "in this chapter" or "as you'll learn"

Return ONLY the introduction as plain text with double newlines between paragraphs.`;

        let introduction = await callGroq(
          [
            {
              role: "system",
              content:
                "You write engaging, unique content. Never repeat yourself. No markdown. Use double newlines between paragraphs.",
            },
            { role: "user", content: introPrompt },
          ],
          1200,
        );
        introduction = stripMd(introduction)
          .replace(/\*\*/g, "")
          .replace(/\*/g, "");

        await sleep(introDelay);


        // STEP 3: Generate each chapter
        const chapters: any[] = [];

        for (let i = 0; i < chaptersCount; i++) {
          send("progress", {
  step: `Writing chapter ${i + 1} of ${chaptersCount}...${isPriority ? ' ⚡' : ''}`,
  chapter: i + 1,
});

          const ch = outline.chapters[i] || {
            title: `Chapter ${i + 1}`,
            focus: "Practical strategies and insights",
          };
const chapterPrompt = `Write Chapter ${i + 1}: "${ch.title}"

BOOK: "${outline.title}"
AUDIENCE: ${idea.targetAudience}
TONE: ${tone}
CHAPTER FOCUS: ${ch.focus}

CRITICAL REQUIREMENTS:
- You MUST write EXACTLY ${cfg.parasPerChapter} paragraphs
- ${bookLength === 'long' ? 'Each paragraph MUST be 60-80 words (about 5-7 sentences)' : bookLength === 'medium' ? 'Each paragraph MUST be 40-50 words (about 3-4 sentences)' : 'Each paragraph MUST be 25-35 words (about 2-3 sentences)'}
- Total chapter length should be approximately ${cfg.targetWordsPerChapter} words

${bookLength === "long" ? `
For this LONG-FORM ebook:
- Include 2-3 specific real-world examples
- Add actionable frameworks or step-by-step guides
- Include "Key Insight" callouts as paragraphs
- End with practical implementation steps
` : bookLength === "medium" ? `
For this MEDIUM-FORM ebook:
- Include 1-2 examples per chapter
- Focus on actionable advice
` : `
For this SHORT-FORM ebook:
- Be concise and direct
- Focus on key takeaways only
`}

FORMAT RULES:
- NO markdown, NO asterisks, NO bold, NO hashtags
- Separate each paragraph with TWO newlines (\\n\\n)
- Each paragraph should be COMPLETE sentences
- Return ONLY the chapter content, no explanations

Write the chapter now:`


const tokenLimit = cfg.tokenLimit;

          let chapterContent = await callGroq(
            [
              {
                role: "system",
                  content: "You are a professional book author writing HIGH-VOLUME content. Write long, detailed, substantive paragraphs. Each paragraph should be meaty and valuable. Never use markdown. Use double newlines between paragraphs.",
              },
              { role: "user", content: chapterPrompt },
            ],
            tokenLimit,
          );

          chapterContent = stripMd(chapterContent)
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/^#+\s*/gm, "");

          // Generate tips for this chapter
          const tipsPrompt = `Generate ${cfg.tipCount} specific, actionable tips for a chapter titled "${ch.title}" in a book about ${idea.title}.

Each tip must:
- Be a specific action the reader can take TODAY
- Be directly related to "${ch.focus}"
- Be 8-15 words long
- Start with an action verb

Return as JSON array of strings. Example: ["Tip one here", "Tip two here", "Tip three here"]`;

          const tipsRaw = await callGroq(
            [
              {
                role: "system",
                content:
                  "Output only valid JSON array of strings. No markdown, no explanation.",
              },
              { role: "user", content: tipsPrompt },
            ],
            500,
          );

          let tips = [
            `Apply one concept from this chapter within 24 hours`,
            `Share your biggest insight with an accountability partner`,
            `Create a small action plan based on what you learned`,
          ];

          try {
            const tipMatch = tipsRaw.match(/\[[\s\S]*\]/);
            if (tipMatch) {
              const parsedTips = JSON.parse(tipMatch[0]);
              if (Array.isArray(parsedTips) && parsedTips.length >= 3) {
                tips = parsedTips.slice(0, cfg.tipCount);
              }
            }
          } catch (e) {
            console.error("Tips parse error:", e);
          }

          chapters.push({
            title: ch.title,
            content: chapterContent,
            tips: tips,
          });

          if (i < chaptersCount - 1) {
            await sleep(chapterDelay);
          }
        }

        send("progress", { 
  step: isPriority 
    ? "⚡ Writing conclusion (Priority mode)..." 
    : "Writing conclusion..." 
});

        // STEP 4: Conclusion
        const conclusionPrompt = `Write a powerful conclusion for "${outline.title}".

AUDIENCE: ${idea.targetAudience}
TONE: ${tone}

Write ${cfg.conclusionParas} paragraphs that:
1. Recap the transformation journey (without repeating word-for-word)
2. Celebrate the reader's progress and potential
3. Provide ${cfg.conclusionParas >= 3 ? "3" : "2"} specific next steps they can take TODAY
4. ${cfg.conclusionParas >= 4 ? "Address common fears or doubts" : "End with an inspiring call to action"}

CRITICAL RULES:
- Each paragraph UNIQUE content
- NO markdown, NO bold, NO asterisks
- Double newlines between paragraphs
- Make it encouraging and actionable`;

        let conclusion = await callGroq(
          [
            {
              role: "system",
              content:
                "You write encouraging, actionable conclusions. No markdown. Use double newlines between paragraphs.",
            },
            { role: "user", content: conclusionPrompt },
          ],
          1000,
        );
        conclusion = stripMd(conclusion)
          .replace(/\*\*/g, "")
          .replace(/\*/g, "");

        // STEP 5: Call to action
        const ctaPrompt = `Write a short, powerful call to action (2-3 sentences) for the end of "${outline.title}".
Encourage the reader to take immediate action on what they've learned.
Make it urgent, specific, and inspiring.
No markdown, no bold.`;

        let callToAction = await callGroq(
          [
            {
              role: "system",
              content: "Write 2-3 powerful, action-oriented sentences.",
            },
            { role: "user", content: ctaPrompt },
          ],
          300,
        );
        callToAction = stripMd(callToAction)
          .replace(/\*\*/g, "")
          .replace(/\*/g, "");

        // ========== AFTER SUCCESSFUL GENERATION, INCREMENT USAGE ==========
        await incrementUsage(user.id);

        send("done", {
          content: {
            title: outline.title,
            subtitle: outline.subtitle,
            introduction:
              introduction ||
              `Welcome to "${outline.title}". This guide will help you ${idea.angle.toLowerCase()}.`,
            chapters: chapters,
            conclusion:
              conclusion ||
              `You've completed this journey. Now it's time to take action. Start with one small step today.`,
            callToAction:
              callToAction ||
              `Download this guide and implement one strategy today. Your future self will thank you.`,
          },
          usage: {
            remaining: remaining - 1,
            limit: monthlyLimit,
            planId: userPlan,
          },
        });
      } catch (error: any) {
        console.error("Generation error:", error);
        send("error", {
          message: error.message || "Generation failed. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
