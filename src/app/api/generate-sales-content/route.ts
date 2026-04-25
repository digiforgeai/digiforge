// app/api/generate-sales-content/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;

// Helper to clean markdown from text
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")  // Remove **bold**
    .replace(/\*([^*]+)\*/g, "$1")       // Remove *italic*
    .replace(/`([^`]+)`/g, "$1")         // Remove `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove [links](url)
    .replace(/^#+\s+/gm, "")             // Remove headings
    .replace(/^\s*[-*+]\s+/gm, "• ")     // Convert list markers to bullets
    .trim();
}

async function callGroq(messages: any[], maxTokens = 2500) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages,
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
      });
      
      if (!res.ok) {
        const error = await res.text();
        console.error(`Groq API error (attempt ${attempts + 1}):`, error);
        attempts++;
        if (attempts === maxAttempts) throw new Error(`Groq API failed: ${res.status}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      const data = await res.json();
      let content = data.choices?.[0]?.message?.content || "";
      if (!content) throw new Error("Empty response from Groq");
      
      // Clean markdown formatting
      content = cleanMarkdown(content);
      
      return content;
    } catch (err) {
      console.error(`Attempt ${attempts + 1} failed:`, err);
      attempts++;
      if (attempts === maxAttempts) throw err;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const { type, ebookData, userPlan } = await req.json();
    const { title, subtitle, chapters, targetAudience } = ebookData;

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user plan (only Starter or Pro)
    const { data: planData } = await supabase
      .from("user_plans")
      .select("plan_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const userPlanDb = planData?.plan_id || "free";

    if (userPlanDb === "free") {
      return NextResponse.json(
        { error: "plan_restricted", message: "Sales content generation requires Starter or Pro plan" },
        { status: 403 }
      );
    }

    const chapterTitles = chapters?.map((ch: any, i: number) => `${i + 1}. ${ch.title}`).join("\n") || "No chapters available";
    const target = targetAudience || "Entrepreneurs and creators";

    let prompt = "";
    
    switch (type) {
      case "sales-page":
        prompt = `Write a high-converting sales page for an ebook titled "${title}"${subtitle ? `: ${subtitle}` : ""}.

TARGET AUDIENCE: ${target}

CHAPTERS:
${chapterTitles}

Write a compelling sales page with these sections:
1. HEADLINE: Attention-grabbing headline (max 10 words)
2. SUBHEADLINE: Benefit-driven subheadline
3. PAIN POINTS: Describe the reader's current struggles (2-3 sentences)
4. SOLUTION: How this ebook solves their problems
5. WHAT'S INSIDE: List the chapters as bullet points (use • for bullets)
6. BONUSES: Include 2-3 relevant bonuses
7. GUARANTEE: Money-back guarantee statement
8. CALL TO ACTION: Urgent, clear CTA

CRITICAL RULES:
- NO markdown, NO asterisks, NO bold, NO italics
- Use plain text only
- Use • for bullet points
- Use emojis sparingly for visual appeal
- Keep it under 800 words`;
        break;

      case "social-threads":
        prompt = `Create a viral Twitter/X thread promoting an ebook titled "${title}".

TARGET AUDIENCE: ${target}

Write a 10-tweet thread that:
- Hook: Attention-grabbing first tweet (problem + solution)
- Tweet 2-3: Explain the problem in detail
- Tweet 4-6: Introduce the solution (the ebook)
- Tweet 7-9: Share 3 specific takeaways from the book
- Tweet 10: Call to action with link

CRITICAL RULES:
- NO markdown, NO asterisks, NO bold
- Each tweet on new line
- Format as: "1/10 Your tweet here"
- Use plain text only`;
        break;

      case "email-sequence":
        prompt = `Create a 5-email launch sequence for an ebook titled "${title}".

TARGET AUDIENCE: ${target}

Write 5 emails:
1. TEASER: "Something big is coming..." (build curiosity)
2. PROBLEM: Describe the pain point deeply
3. SOLUTION: Introduce the ebook as the answer
4. VALUE: Share 3 specific things they'll learn
5. LAUNCH: Urgent call to action with scarcity

CRITICAL RULES:
- NO markdown, NO asterisks, NO bold
- Each email: "Subject: [subject]" then body
- Use plain text only
- Keep each email 100-150 words`;
        break;

      case "bundle-description":
        prompt = `Write a compelling product bundle description for an ebook titled "${title}".

TARGET AUDIENCE: ${target}

Write a bundle description that includes:
1. HEADLINE: Benefit-driven headline
2. BULLET POINTS: 5-7 value bullets (use •)
3. BONUSES: List 3 exclusive bonuses
4. PRICE ANCHORING: "Value: $X | Today: $Y"
5. URGENCY: Limited-time offer statement
6. CALL TO ACTION

CRITICAL RULES:
- NO markdown, NO asterisks, NO bold
- Use • for bullet points
- Plain text only
- Under 400 words`;
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const content = await callGroq([
      { role: "system", content: "You are a professional copywriter. Write clean, plain text without any markdown formatting. Never use asterisks, double asterisks, or any formatting symbols. Use • for bullet points. Write naturally and persuasively." },
      { role: "user", content: prompt },
    ], 2800);

    if (!content) {
      throw new Error("Failed to generate content");
    }

    return NextResponse.json({ success: true, content });

  } catch (error) {
    console.error("Sales content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}