// app/api/docx/route.ts - PREMIUM DOCX EXPORT (PRO ONLY - NO BRANDING)
import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
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

// ── SPLIT INTO PARAGRAPHS ──
function splitIntoParagraphs(text: string): string[] {
  const cleaned = clean(text);
  const sentences = cleaned.match(/[^.!?]+[.!?]+["']?\s*/g) || [cleaned];
  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > 300 && current.length > 0) {
      paragraphs.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim().length > 0) {
    paragraphs.push(current.trim());
  }
  return paragraphs;
}


// Create a lighter version function at the top
function getLightColor(hex: string): string {
  // Convert hex to RGB, lighten it, then back to hex
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Lighten by 70%
  const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.85));
  const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.85));
  const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.85));
  
  return `${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
}

// ── CREATE STYLED PARAGRAPH ──
function createStyledParagraph(
  text: string,
  options: {
    bold?: boolean;
    size?: number;
    color?: string;
    spacing?: number;
    indent?: number;
    alignment?: any;
    italic?: boolean;
  } = {},
): Paragraph {
  const {
    bold = false,
    size = 24,
    color = "2d2d2d",
    spacing = 276,
    indent = 0,
    alignment = AlignmentType.LEFT,
    italic = false,
  } = options;

  const cleaned = clean(text);
  if (!cleaned) return new Paragraph({});

  // Handle bullet points with fancy styling
  if (cleaned.startsWith("✓") || cleaned.startsWith("-") || cleaned.startsWith("•")) {
    return new Paragraph({
      children: [
        new TextRun({
          text: "▸",
          bold: true,
          size: size,
          color: "4c29d1",
        }),
        new TextRun({
          text: " " + cleaned.substring(1).trim(),
          bold,
          size,
          color,
          italics: italic,
        }),
      ],
      spacing: { line: spacing, after: 120 },
      indent: { left: indent * 720 },
    });
  }

  return new Paragraph({
    children: [
      new TextRun({
        text: cleaned,
        bold,
        size,
        color,
        italics: italic,
      }),
    ],
    spacing: { line: spacing, after: 200 },
    indent: { left: indent * 720, firstLine: indent > 0 ? 360 : 0 },
    alignment,
  });
}

// ── CREATE HEADING ──
function createHeading(text: string, level: number, accentColor: string): Paragraph {
  const sizes = { 1: 44, 2: 32, 3: 26, 4: 22 };
  const size = sizes[level as keyof typeof sizes] || 24;

  const heading = new Paragraph({
    children: [
      new TextRun({
        text: clean(text),
        bold: true,
        size,
        color: level === 1 ? accentColor : "1a1a1a",
      }),
    ],
    spacing: { before: level === 1 ? 600 : 400, after: level === 1 ? 300 : 200 },
  });

  // Add decorative line for level 1 headings
  if (level === 1) {
    return new Paragraph({
      children: [
        new TextRun({
          text: clean(text),
          bold: true,
          size,
          color: accentColor,
        }),
      ],
      spacing: { before: 600, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: accentColor },
      },
    });
  }

  return heading;
}

// ── CREATE PREMIUM TIP BOX ──
function createTipBox(tips: string[], accentColor: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Spacing before
  paragraphs.push(new Paragraph({ spacing: { before: 300 } }));

  // Header with icon
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "★ KEY INSIGHTS ★",
          bold: true,
          size: 22,
          color: accentColor,
        }),
      ],
      spacing: { after: 100 },
    }),
  );

  // Decorative line
  paragraphs.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: accentColor },
      },
      spacing: { after: 200 },
    }),
  );

  // Tips with custom bullets
  for (const tip of tips.slice(0, 6)) {
    if (tip && tip.length > 10) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "◆",
              bold: true,
              size: 20,
              color: accentColor,
            }),
            new TextRun({
              text: "  " + clean(tip),
              size: 23,
              color: "444444",
            }),
          ],
          spacing: { after: 120 },
          indent: { left: 360 },
        }),
      );
    }
  }

  // Spacing after
  paragraphs.push(new Paragraph({ spacing: { after: 300 } }));

  return paragraphs;
}

// ── CREATE MODERN HEADER (for each page) - Optional but cool ──
function createChapterHeader(num: number, title: string, accentColor: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${String(num).padStart(2, "0")}`,
        bold: true,
        size: 120,
        color: `${accentColor}20`, // 20% opacity (hex + alpha)
      }),
      new TextRun({
        text: `\n${clean(title)}`,
        bold: true,
        size: 32,
        color: "1a1a1a",
      }),
    ],
    spacing: { before: 400, after: 200 },
  });
}

// ── MAIN EXPORT ──
export async function POST(req: Request) {
  try {
    const { content, title, theme = "indigo" } = await req.json();

    // ── PRO PLAN CHECK ──
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
      return NextResponse.json(
        {
          error: "plan_restricted",
          message: "DOCX export requires a Pro plan.",
        },
        { status: 403 },
      );
    }

    const accentColor = THEMES[theme] || THEMES.indigo;
    console.log(`📄 DOCX Export: Pro user, theme: ${theme}`);

    const sections: any[] = [];

    // ═══════════════════════════════════════════════════════════════
    // COVER SECTION - PREMIUM LAYOUT
    // ═══════════════════════════════════════════════════════════════
    const coverParagraphs: Paragraph[] = [];

    // Large accent bar at top
    coverParagraphs.push(
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: accentColor },
        },
        spacing: { before: 400, after: 400 },
      }),
    );

    // Main title
    coverParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: clean(title || content?.title || "Untitled"),
            bold: true,
            size: 52,
            color: accentColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      }),
    );

    // Subtitle
    if (content?.subtitle) {
      coverParagraphs.push(
        createStyledParagraph(content.subtitle, {
          size: 28,
          color: "666666",
          alignment: AlignmentType.CENTER,
          italic: true,
        }),
      );
    }

    // Decorative divider
    coverParagraphs.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: accentColor },
        },
        spacing: { before: 300, after: 300 },
      }),
    );

    // Metadata (NO BRANDING - just date and chapter count)
    const chapterCount = content?.chapters?.length || 0;
    coverParagraphs.push(
      createStyledParagraph(`${chapterCount} CHAPTERS  |  ${new Date().getFullYear()}`, {
        size: 20,
        color: "999999",
        alignment: AlignmentType.CENTER,
      }),
    );

    // Bottom accent bar
    coverParagraphs.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: accentColor },
        },
        spacing: { before: 400, after: 200 },
      }),
    );

    sections.push({ children: coverParagraphs });
    sections.push({ children: [new Paragraph({ pageBreakBefore: true })] });

    // ═══════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS - CLEAN & PROFESSIONAL
    // ═══════════════════════════════════════════════════════════════
    const tocParagraphs: Paragraph[] = [];

    tocParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CONTENTS",
            bold: true,
            size: 40,
            color: accentColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      }),
    );

    const tocItems = [
      { title: "Introduction", page: 3 },
      ...(content?.chapters?.map((ch: any, i: number) => ({
        title: `Chapter ${i + 1}: ${ch?.title || ""}`,
        page: i + 4,
      })) || []),
      { title: "Conclusion", page: (content?.chapters?.length || 0) + 4 },
    ];

    for (let i = 0; i < tocItems.length; i++) {
      const item = tocItems[i];
      tocParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clean(item.title),
              size: 24,
              color: i === 0 ? accentColor : "444444",
              bold: i === 0,
            }),
            new TextRun({
              text: " ............................................ ",
              size: 24,
              color: "cccccc",
              bold: false,
            }),
            new TextRun({
              text: String(item.page),
              size: 24,
              color: accentColor,
              bold: true,
            }),
          ],
          spacing: { after: 120 },
        }),
      );
    }

    sections.push({ children: tocParagraphs });
    sections.push({ children: [new Paragraph({ pageBreakBefore: true })] });

    // ═══════════════════════════════════════════════════════════════
    // INTRODUCTION
    // ═══════════════════════════════════════════════════════════════
    const introParagraphs: Paragraph[] = [];

    introParagraphs.push(createHeading("INTRODUCTION", 1, accentColor));
    
    const introTexts = splitIntoParagraphs(content?.introduction || "");
    for (let i = 0; i < introTexts.length; i++) {
      introParagraphs.push(
        createStyledParagraph(introTexts[i], {
          size: 24,
          bold: i === 0,
          indent: 0.2,
        }),
      );
    }

    sections.push({ children: introParagraphs });
    sections.push({ children: [new Paragraph({ pageBreakBefore: true })] });

    // ═══════════════════════════════════════════════════════════════
    // CHAPTERS - PREMIUM
    // ═══════════════════════════════════════════════════════════════
    for (let i = 0; i < (content?.chapters?.length || 0); i++) {
      const chapter = content.chapters[i];
      const chapterTitle = clean(chapter?.title || `Chapter ${i + 1}`);
      const chapterParagraphs: Paragraph[] = [];

      // Modern header with large background number
      const lightColor = getLightColor(accentColor);
      chapterParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${String(i + 1).padStart(2, "0")}`,
              bold: true,
              size: 160,
              color: lightColor, // Very light opacity
            }),
          ],
          spacing: { before: 200, after: -280 },
        }),
      );

      chapterParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `CHAPTER ${String(i + 1).padStart(2, "0")}`,
              bold: true,
              size: 18,
              color: accentColor,
            }),
          ],
          spacing: { after: 100 },
        }),
      );

      chapterParagraphs.push(
        createHeading(chapterTitle, 1, accentColor),
      );

      // Chapter content
      const chapterTexts = splitIntoParagraphs(chapter?.content || "");
      for (let j = 0; j < chapterTexts.length; j++) {
        chapterParagraphs.push(
          createStyledParagraph(chapterTexts[j], {
            size: 24,
            indent: 0.2,
          }),
        );
      }

      // Tips section
      if (chapter?.tips?.length > 0) {
        chapterParagraphs.push(...createTipBox(chapter.tips, accentColor));
      }

      sections.push({ children: chapterParagraphs });
      sections.push({ children: [new Paragraph({ pageBreakBefore: true })] });
    }

    // ═══════════════════════════════════════════════════════════════
    // CONCLUSION
    // ═══════════════════════════════════════════════════════════════
    const conclusionParagraphs: Paragraph[] = [];

    conclusionParagraphs.push(createHeading("CONCLUSION", 1, accentColor));
    
    const conclusionTexts = splitIntoParagraphs(content?.conclusion || "");
    for (const text of conclusionTexts) {
      conclusionParagraphs.push(
        createStyledParagraph(text, {
          size: 24,
          indent: 0.2,
        }),
      );
    }

    // Call to action
    if (content?.callToAction) {
      conclusionParagraphs.push(new Paragraph({ spacing: { before: 300 } }));
      conclusionParagraphs.push(
        createStyledParagraph(content.callToAction, {
          bold: true,
          size: 26,
          color: accentColor,
          alignment: AlignmentType.CENTER,
        }),
      );
    }

    sections.push({ children: conclusionParagraphs });

    // ═══════════════════════════════════════════════════════════════
    // NO BACK MATTER - NO BRANDING FOR PRO USERS!
    // ═══════════════════════════════════════════════════════════════

    // ── BUILD DOCUMENT ──
    const doc = new Document({
      sections: sections.map((section) => ({
        properties: {},
        children: section.children,
      })),
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            basedOn: "Normal",
            quickFormat: true,
          },
        ],
      },
    });

    const buffer = await Packer.toBuffer(doc);
    const safeTitle = clean(title || content?.title || "ebook")
      .replace(/[^a-z0-9]/gi, "_")
      .slice(0, 50);

    console.log("✅ Premium DOCX (No Branding) generated, size:", buffer.length);

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
      },
    });

  } catch (error) {
    console.error("❌ DOCX generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate DOCX",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}