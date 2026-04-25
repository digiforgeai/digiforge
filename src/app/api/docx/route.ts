// app/api/docx/route.ts - PREMIUM DOCX EXPORT (PRO ONLY - FULLY POLISHED)
import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from "docx";
import { createClient } from "@/lib/supabase/server";

// ── TEXT CLEANING ──
const clean = (t: string) =>
  (t || "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s?/g, "")
    .replace(/\t/g, " ")
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\\n\\n/g, "\n\n")
    .replace(/\\\\n/g, "\n")
    .replace(/[^\x00-\x7F]/g, (c: string) =>
      ({
        "\u2018": "'",
        "\u2019": "'",
        "\u201C": '"',
        "\u201D": '"',
        "\u2013": "-",
        "\u2014": "--",
        "\u2026": "...",
        "\u2022": "-",
        "\u00E9": "e",
        "\u00E8": "e",
        "\u00EA": "e",
        "\u00E0": "a",
        "\u00E2": "a",
        "\u00F4": "o",
        "\u00FB": "u",
        "\u00FC": "u",
        "\u00E7": "c",
        "\u00EE": "i",
        "\u00EF": "i",
        "\u00F1": "n",
        "\u00E1": "a",
        "\u00ED": "i",
        "\u00F3": "o",
        "\u00FA": "u",
      }[c] || ""),
    )
    .replace(/\s+/g, " ")
    .trim();

// ── THEME COLORS ──
const THEMES: Record<string, string> = {
  indigo: "4c29d1",
  violet: "7c2de6",
  rose: "e02e52",
  emerald: "0d9860",
  amber: "db8e0f",
  cyan: "0d99bf",
  orange: "e56610",
  slate: "38465c",
};

// ── TEMPLATE STYLES FOR DOCX ──
const TEMPLATE_DOCX_STYLES: Record<string, any> = {
  classic: {
    titleSize: 44,
    headingSize: 28,
    bodySize: 24,
    fontFamily: "Times New Roman",
    titleColor: "1a1a1a",
    showDecorations: true,
  },
  modern: {
    titleSize: 48,
    headingSize: 30,
    bodySize: 24,
    fontFamily: "Arial",
    titleColor: "4c29d1",
    showDecorations: true,
  },
  premium: {
    titleSize: 52,
    headingSize: 32,
    bodySize: 24,
    fontFamily: "Georgia",
    titleColor: "c49a45",
    showDecorations: true,
  },
  minimal: {
    titleSize: 36,
    headingSize: 22,
    bodySize: 22,
    fontFamily: "Calibri",
    titleColor: "333333",
    showDecorations: false,
  },
  editorial: {
    titleSize: 56,
    headingSize: 34,
    bodySize: 24,
    fontFamily: "Garamond",
    titleColor: "8B0000",
    showDecorations: true,
  },
  corporate: {
    titleSize: 42,
    headingSize: 26,
    bodySize: 23,
    fontFamily: "Calibri",
    titleColor: "0a2540",
    showDecorations: false,
  },
};

function getLightColor(hex: string, percent: number = 0.9): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lightR = Math.min(255, Math.floor(r + (255 - r) * percent));
  const lightG = Math.min(255, Math.floor(g + (255 - g) * percent));
  const lightB = Math.min(255, Math.floor(b + (255 - b) * percent));
  return `${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
}

function splitIntoParagraphs(text: string): string[] {
  const cleaned = clean(text);
  const sentences = cleaned.match(/[^.!?]+[.!?]+["']?\s*/g) || [cleaned];
  const paragraphs: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > 400 && current.length > 0) {
      paragraphs.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim().length > 0) paragraphs.push(current.trim());
  return paragraphs;
}

function createStyledParagraph(text: string, options: any = {}): Paragraph {
  const {
    bold = false,
    size = 24,
    color = "2d2d2d",
    spacing = 276,
    indent = 0,
    alignment = AlignmentType.LEFT,
    italic = false,
    fontFamily = "Calibri",
  } = options;

  const cleaned = clean(text);
  if (!cleaned) return new Paragraph({});

  const textRun = new TextRun({
    text: cleaned,
    bold,
    size,
    color,
    italics: italic,
    font: fontFamily,
  });

  return new Paragraph({
    children: [textRun],
    spacing: { line: spacing, after: 120 },
    indent: { left: indent * 720, firstLine: indent > 0 ? 360 : 0 },
    alignment,
  });
}

function createHeading(text: string, level: number, accentColor: string, templateStyle: any): Paragraph {
  const sizes = { 1: templateStyle.headingSize, 2: 28, 3: 24, 4: 20 };
  const size = sizes[level as keyof typeof sizes] || 24;

  const heading = new Paragraph({
    children: [
      new TextRun({
        text: clean(text),
        bold: true,
        size,
        color: level === 1 ? accentColor : "1a1a1a",
        font: templateStyle.fontFamily,
      }),
    ],
    spacing: { before: level === 1 ? 400 : 300, after: level === 1 ? 200 : 120 },
  });

  if (level === 1 && templateStyle.showDecorations) {
    return new Paragraph({
      children: [
        new TextRun({
          text: clean(text),
          bold: true,
          size,
          color: accentColor,
          font: templateStyle.fontFamily,
        }),
      ],
      spacing: { before: 400, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: accentColor } },
    });
  }
  return heading;
}

function createTipBox(tips: string[], accentColor: string, templateStyle: any): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  paragraphs.push(new Paragraph({ spacing: { before: 200 } }));
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "◆ KEY INSIGHTS ◆",
          bold: true,
          size: 20,
          color: accentColor,
          font: templateStyle.fontFamily,
        }),
      ],
      spacing: { after: 80 },
    }),
  );
  paragraphs.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: accentColor } },
      spacing: { after: 120 },
    }),
  );
  for (const tip of tips.slice(0, 6)) {
    if (tip && tip.length > 10) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "•", bold: true, size: 18, color: accentColor }),
            new TextRun({ text: "  " + clean(tip), size: 22, color: "444444", font: templateStyle.fontFamily }),
          ],
          spacing: { after: 80 },
          indent: { left: 360 },
        }),
      );
    }
  }
  paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
  return paragraphs;
}

async function fetchUserProfile(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();
  if (profile?.full_name && profile.full_name.trim().length > 0) {
    return profile.full_name;
  }
  return null;
}

// ── MAIN EXPORT ──
export async function POST(req: Request) {
  try {
    const { content, title, theme = "indigo", template = "premium" } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userPlan = "free";
    if (user) {
      const { data: planData } = await supabase
        .from("user_plans")
        .select("plan_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      if (planData) userPlan = planData.plan_id;
    }

    if (userPlan !== "pro") {
      return NextResponse.json({ error: "plan_restricted", message: "DOCX export requires a Pro plan." }, { status: 403 });
    }

    const userFullName = await fetchUserProfile(supabase, user!.id);
    const accentColor = THEMES[theme] || THEMES.indigo;
    const templateStyle = TEMPLATE_DOCX_STYLES[template] || TEMPLATE_DOCX_STYLES.premium;
    console.log(`📄 DOCX Export: ${template} template, theme: ${theme}`);

    const sections: any[] = [];
    let currentPage = 2; // Track page numbers for TOC

    // ═══════════════════════════════════════════════════════════════
    // COVER SECTION
    // ═══════════════════════════════════════════════════════════════
    const coverParagraphs: Paragraph[] = [];
    
    if (templateStyle.showDecorations) {
      coverParagraphs.push(new Paragraph({ 
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: accentColor } }, 
        spacing: { before: 300, after: 300 } 
      }));
    }
    
    coverParagraphs.push(
      new Paragraph({
        children: [new TextRun({ 
          text: clean(title || content?.title || "Untitled"), 
          bold: true, 
          size: templateStyle.titleSize, 
          color: templateStyle.titleColor, 
          font: templateStyle.fontFamily 
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );
    
    if (content?.subtitle) {
      coverParagraphs.push(
        createStyledParagraph(content.subtitle, { 
          size: 26, 
          color: "666666", 
          alignment: AlignmentType.CENTER, 
          italic: true, 
          fontFamily: templateStyle.fontFamily 
        })
      );
    }
    
    if (templateStyle.showDecorations) {
      coverParagraphs.push(new Paragraph({ 
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: accentColor } }, 
        spacing: { before: 200, after: 200 } 
      }));
    }
    
    const chapterCount = content?.chapters?.length || 0;
    coverParagraphs.push(
      createStyledParagraph(`${chapterCount} CHAPTERS  |  ${new Date().getFullYear()}`, { 
        size: 18, 
        color: "999999", 
        alignment: AlignmentType.CENTER, 
        fontFamily: templateStyle.fontFamily 
      })
    );
    
    if (userFullName) {
      coverParagraphs.push(
        createStyledParagraph(`Created by ${userFullName}`, { 
          size: 16, 
          color: "aaaaaa", 
          alignment: AlignmentType.CENTER, 
          italic: true, 
          fontFamily: templateStyle.fontFamily 
        })
      );
    }
    
    if (templateStyle.showDecorations) {
      coverParagraphs.push(new Paragraph({ 
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: accentColor } }, 
        spacing: { before: 300, after: 100 } 
      }));
    }
    
    sections.push({ children: coverParagraphs });
    sections.push({ children: [new Paragraph({ pageBreakBefore: true })] });

    // ═══════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS - PROPERLY ALIGNED
    // ═══════════════════════════════════════════════════════════════
    const tocParagraphs: Paragraph[] = [];
    
    tocParagraphs.push(new Paragraph({ 
      children: [new TextRun({ text: "CONTENTS", bold: true, size: 38, color: accentColor, font: templateStyle.fontFamily })], 
      alignment: AlignmentType.CENTER, 
      spacing: { before: 300, after: 300 } 
    }));
    
    // TOC Header
    tocParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Section", bold: true, size: 20, color: accentColor, font: templateStyle.fontFamily }),
          new TextRun({ text: " ", size: 20 }),
          new TextRun({ text: "Page", bold: true, size: 20, color: accentColor, font: templateStyle.fontFamily }),
        ],
        spacing: { after: 80 },
      })
    );
    
    tocParagraphs.push(new Paragraph({ 
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: accentColor } }, 
      spacing: { after: 100 } 
    }));
    
    const tocItems = [
      { title: "Introduction", page: currentPage++ },
      ...(content?.chapters?.map((ch: any, i: number) => ({ 
        title: ch?.title || `Chapter ${i + 1}`, 
        page: currentPage++ 
      })) || []),
      { title: "Conclusion", page: currentPage++ },
    ];
    
    for (let i = 0; i < tocItems.length; i++) {
      const item = tocItems[i];
      const titleText = clean(item.title);
      const titleLength = titleText.length;
      const dotsCount = Math.max(1, 50 - titleLength);
      const dots = ".".repeat(dotsCount);
      
      tocParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: titleText, size: 22, color: i === 0 ? accentColor : "333333", bold: i === 0, font: templateStyle.fontFamily }),
            new TextRun({ text: dots, size: 22, color: "cccccc", font: templateStyle.fontFamily }),
            new TextRun({ text: String(item.page), size: 22, color: accentColor, bold: true, font: templateStyle.fontFamily }),
          ],
          spacing: { after: 60 },
        })
      );
    }
    
    sections.push({ children: tocParagraphs });
    sections.push({ children: [new Paragraph({ pageBreakBefore: true })] });

    // ═══════════════════════════════════════════════════════════════
    // INTRODUCTION - NO PAGE BREAK AFTER
    // ═══════════════════════════════════════════════════════════════
    const introParagraphs: Paragraph[] = [];
    introParagraphs.push(createHeading("INTRODUCTION", 1, accentColor, templateStyle));
    
    const introTexts = splitIntoParagraphs(content?.introduction || "");
    for (let i = 0; i < introTexts.length; i++) {
      introParagraphs.push(
        createStyledParagraph(introTexts[i], { 
          size: templateStyle.bodySize, 
          bold: i === 0, 
          indent: 0.2, 
          fontFamily: templateStyle.fontFamily 
        })
      );
    }
    
    sections.push({ children: introParagraphs });

    // ═══════════════════════════════════════════════════════════════
    // CHAPTERS - NO EXTRA PAGE BREAKS BETWEEN CHAPTERS
    // ═══════════════════════════════════════════════════════════════
    for (let i = 0; i < (content?.chapters?.length || 0); i++) {
      const chapter = content.chapters[i];
      const chapterParagraphs: Paragraph[] = [];
      
      // Add page break BEFORE each chapter (except first, which follows intro)
      if (i > 0) {
        chapterParagraphs.push(new Paragraph({ pageBreakBefore: true }));
      }
      
      const lightColor = getLightColor(accentColor, 0.92);
      chapterParagraphs.push(
        new Paragraph({
          children: [new TextRun({ 
            text: `${String(i + 1).padStart(2, "0")}`, 
            bold: true, 
            size: 140, 
            color: lightColor, 
            font: templateStyle.fontFamily 
          })],
          spacing: { before: 100, after: -240 },
        })
      );
      
      chapterParagraphs.push(
        new Paragraph({ 
          children: [new TextRun({ 
            text: `CHAPTER ${String(i + 1).padStart(2, "0")}`, 
            bold: true, 
            size: 16, 
            color: accentColor, 
            font: templateStyle.fontFamily 
          })], 
          spacing: { after: 60 } 
        })
      );
      
      chapterParagraphs.push(createHeading(chapter?.title || `Chapter ${i + 1}`, 1, accentColor, templateStyle));
      
      const chapterTexts = splitIntoParagraphs(chapter?.content || "");
      for (const text of chapterTexts) {
        chapterParagraphs.push(
          createStyledParagraph(text, { 
            size: templateStyle.bodySize, 
            indent: 0.2, 
            fontFamily: templateStyle.fontFamily 
          })
        );
      }
      
      if (chapter?.tips?.length > 0) {
        chapterParagraphs.push(...createTipBox(chapter.tips, accentColor, templateStyle));
      }
      
      sections.push({ children: chapterParagraphs });
    }

    // ═══════════════════════════════════════════════════════════════
    // CONCLUSION
    // ═══════════════════════════════════════════════════════════════
    const conclusionParagraphs: Paragraph[] = [];
    conclusionParagraphs.push(createHeading("CONCLUSION", 1, accentColor, templateStyle));
    
    const conclusionTexts = splitIntoParagraphs(content?.conclusion || "");
    for (const text of conclusionTexts) {
      conclusionParagraphs.push(
        createStyledParagraph(text, { 
          size: templateStyle.bodySize, 
          indent: 0.2, 
          fontFamily: templateStyle.fontFamily 
        })
      );
    }
    
    if (content?.callToAction) {
      conclusionParagraphs.push(new Paragraph({ spacing: { before: 200 } }));
      conclusionParagraphs.push(
        createStyledParagraph(content.callToAction, { 
          bold: true, 
          size: 22, 
          color: accentColor, 
          alignment: AlignmentType.CENTER, 
          fontFamily: templateStyle.fontFamily 
        })
      );
    }
    
    sections.push({ children: conclusionParagraphs });

    // ═══════════════════════════════════════════════════════════════
    // BACK MATTER - NO BRANDING FOR PRO, JUST THANK YOU
    // ═══════════════════════════════════════════════════════════════
    const backParagraphs: Paragraph[] = [];
    backParagraphs.push(new Paragraph({ pageBreakBefore: true }));
    backParagraphs.push(new Paragraph({ spacing: { before: 400 } }));
    
    if (userFullName) {
      backParagraphs.push(
        createStyledParagraph(`Thank you, ${userFullName}`, { 
          size: 28, 
          color: accentColor, 
          alignment: AlignmentType.CENTER, 
          bold: true,
          fontFamily: templateStyle.fontFamily 
        })
      );
      backParagraphs.push(new Paragraph({ spacing: { after: 100 } }));
      backParagraphs.push(
        createStyledParagraph(`Your journey to mastering AI-powered content starts here.`, { 
          size: 18, 
          color: "666666", 
          alignment: AlignmentType.CENTER, 
          italic: true,
          fontFamily: templateStyle.fontFamily 
        })
      );
    }
    
    sections.push({ children: backParagraphs });

    // ── BUILD DOCUMENT ──
    const doc = new Document({
      sections: sections.map((section) => ({ 
        properties: {}, 
        children: section.children 
      })),
      styles: {
        paragraphStyles: [
          { id: "Normal", name: "Normal", basedOn: "Normal", quickFormat: true },
        ],
      },
    });

    const buffer = await Packer.toBuffer(doc);
    const safeTitle = clean(title || content?.title || "ebook")
      .replace(/[^a-z0-9]/gi, "_")
      .slice(0, 50);

    console.log(`✅ DOCX generated with ${template} template`);

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
      },
    });

  } catch (error) {
    console.error("❌ DOCX generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}