// app/api/pdf/route.ts - PREMIUM WORKBOOK EDITION WITH FULL TEMPLATE SUPPORT
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

// ── TEXT CLEANING ───────────────────────────────────────────────────────────
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
    .replace(
      /[^\x00-\x7F]/g,
      (c: string) =>
        (
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
          }) as Record<string, string>
        )[c] || "",
    )
    .replace(/\s+/g, " ")
    .trim();

// ── WORD WRAP ───────────────────────────────────────────────────────────────
function wrapText(
  text: string,
  font: any,
  size: number,
  maxW: number,
): string[] {
  if (!text) return [];
  const words = clean(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    try {
      font.widthOfTextAtSize(test, size) <= maxW
        ? (line = test)
        : (lines.push(line), (line = w));
    } catch {
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ── PARAGRAPH SPLITTER ──────────────────────────────────────────────────────
function splitParagraphs(text: string): string[] {
  if (!text) return [];
  const c = clean(text);
  const byDouble = c
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 20);
  if (byDouble.length > 1) return byDouble;
  const bySingle = c
    .split(/\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
  if (bySingle.length > 1) return bySingle;
  const sentences = c.match(/[^.!?]+[.!?]+["']?\s*/g) || [c];
  const paras: string[] = [];
  let current = "",
    count = 0;
  for (const s of sentences) {
    current += s;
    count++;
    if (count >= 4) {
      paras.push(current.trim());
      current = "";
      count = 0;
    }
  }
  if (current.trim().length > 20) paras.push(current.trim());
  return paras.length > 0 ? paras : [c.slice(0, 500)];
}

// ── IMAGE EMBED ─────────────────────────────────────────────────────────────
async function embedImg(doc: PDFDocument, url: string) {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    try {
      return await doc.embedJpg(buffer);
    } catch {
      return await doc.embedPng(buffer);
    }
  } catch (error) {
    console.error("Image embed error:", error);
    return null;
  }
}

// ── CHAPTER IMAGE FETCH ─────────────────────────────────────────────────────
const usedImages = new Set<string>();

async function getChapterImage(
  chapterTitle: string,
  chapterIndex: number,
): Promise<string | null> {
  if (!chapterTitle) return null;
  const searchTerms = [
    chapterTitle,
    `${chapterTitle} concept`,
    `${chapterTitle} illustration`,
    `${chapterTitle} ideas`,
    `${chapterTitle} strategy`,
  ];
  const searchTerm = searchTerms[chapterIndex % searchTerms.length];
  try {
    const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (!key) return null;
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=5&orientation=landscape&quality=high`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.results?.length > 0) {
      let selected = null;
      for (const photo of data.results) {
        if (photo.width > 2000 && photo.height > 1000 && photo.likes > 20) {
          if (!usedImages.has(photo.id)) {
            selected = photo;
            usedImages.add(photo.id);
            break;
          }
        }
      }
      if (!selected && data.results[0]) selected = data.results[0];
      return selected?.urls?.regular || null;
    }
    return null;
  } catch {
    return null;
  }
}

// ── THEME MAP ───────────────────────────────────────────────────────────────
const THEMES: Record<string, [number, number, number]> = {
  indigo: [0.3, 0.16, 0.82],
  violet: [0.5, 0.18, 0.9],
  rose: [0.88, 0.18, 0.32],
  emerald: [0.05, 0.6, 0.38],
  amber: [0.86, 0.56, 0.06],
  slate: [0.22, 0.28, 0.36],
  cyan: [0.05, 0.6, 0.75],
  orange: [0.9, 0.4, 0.06],
};

// ── TEMPLATE CONFIGURATIONS ────────────────────────────────────────────────
const TEMPLATE_STYLES: Record<string, any> = {
  classic: {
    name: "Classic",
    fontFamily: "serif",
    titleSize: 36,
    headingSize: 24,
    bodySize: 11,
    lineHeight: 19,
    margins: { left: 68, right: 68 },
    showDecorations: false,
    titleColor: "ink",
    paperTone: "cream",
    watermarkOpacity: 0.05,
  },
  modern: {
    name: "Modern",
    fontFamily: "sans-serif",
    titleSize: 40,
    headingSize: 26,
    bodySize: 10.5,
    lineHeight: 18,
    margins: { left: 58, right: 58 },
    showDecorations: true,
    titleColor: "accent",
    paperTone: "light",
    watermarkOpacity: 0.08,
  },
  premium: {
    name: "Premium",
    fontFamily: "sans-serif",
    titleSize: 44,
    headingSize: 28,
    bodySize: 11,
    lineHeight: 20,
    margins: { left: 58, right: 58 },
    showDecorations: true,
    titleColor: "gold",
    paperTone: "dark",
    watermarkOpacity: 0.1,
  },
  minimal: {
    name: "Minimal",
    fontFamily: "sans-serif",
    titleSize: 32,
    headingSize: 20,
    bodySize: 10,
    lineHeight: 17,
    margins: { left: 78, right: 78 },
    showDecorations: false,
    titleColor: "ink",
    paperTone: "white",
    watermarkOpacity: 0.03,
  },
  editorial: {
    name: "Editorial",
    fontFamily: "serif",
    titleSize: 48,
    headingSize: 30,
    bodySize: 11.5,
    lineHeight: 22,
    margins: { left: 48, right: 48 },
    showDecorations: true,
    titleColor: "accent",
    paperTone: "warm",
    watermarkOpacity: 0.12,
  },
  corporate: {
    name: "Corporate",
    fontFamily: "sans-serif",
    titleSize: 38,
    headingSize: 24,
    bodySize: 10.5,
    lineHeight: 18,
    margins: { left: 68, right: 68 },
    showDecorations: false,
    titleColor: "ink",
    paperTone: "cool",
    watermarkOpacity: 0.05,
  },
};

// ── PALETTE BUILDER ─────────────────────────────────────────────────────────
function buildPalette(ar: number, ag: number, ab: number, template: string) {
  const templateStyle = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.premium;

  // Paper tones based on template
  const paperTones = {
    cream: rgb(0.98, 0.96, 0.92),
    light: rgb(0.96, 0.94, 0.92),
    dark: rgb(0.18, 0.15, 0.12),
    white: rgb(1, 1, 1),
    warm: rgb(0.96, 0.93, 0.88),
    cool: rgb(0.94, 0.95, 0.97),
  };

  const paper =
    paperTones[templateStyle.paperTone as keyof typeof paperTones] ||
    paperTones.cream;
  const paperDeep = rgb(
    paper.red * 0.95,
    paper.green * 0.94,
    paper.blue * 0.92,
  );
  const paperDark = rgb(0.18, 0.15, 0.12);

  // Ink colors
  const ink =
    templateStyle.paperTone === "dark"
      ? rgb(0.92, 0.9, 0.88)
      : rgb(0.12, 0.1, 0.08);
  const inkMid =
    templateStyle.paperTone === "dark"
      ? rgb(0.75, 0.73, 0.68)
      : rgb(0.35, 0.32, 0.28);
  const inkLight =
    templateStyle.paperTone === "dark"
      ? rgb(0.55, 0.52, 0.48)
      : rgb(0.55, 0.52, 0.48);

  const accent = rgb(ar, ag, ab);
  const gold =
    template === "premium" ? rgb(0.85, 0.65, 0.25) : rgb(0.72, 0.58, 0.32);

  // Tints
  const tint = rgb(
    Math.min(1, ar * 0.08 + 0.93),
    Math.min(1, ag * 0.06 + 0.93),
    Math.min(1, ab * 0.1 + 0.89),
  );
  const tintMid = rgb(
    Math.min(1, ar * 0.14 + 0.86),
    Math.min(1, ag * 0.1 + 0.88),
    Math.min(1, ab * 0.16 + 0.82),
  );
  const divider = templateStyle.showDecorations
    ? accent
    : rgb(0.82, 0.78, 0.72);

  return {
    paper,
    paperDeep,
    paperDark,
    ink,
    inkMid,
    inkLight,
    accent,
    tint,
    tintMid,
    gold,
    divider,
    templateStyle,
  };
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const {
      content,
      title,
      coverImageUrl,
      theme = "indigo",
      template = "premium",
      includeChapterImages = true,
      customSettings = null,
    } = await req.json();

    // ── Plan check ──
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
    const isFreePlan = userPlan === "free";
    const shouldAddImages = (userPlan === "starter" || userPlan === "pro") && includeChapterImages === true;
    console.log(`📄 PDF Plan: ${userPlan} | Template: ${template} | Images: ${shouldAddImages}`);

    // ── FETCH USER PROFILE EARLY ──
    let userName = "Valued Reader";
    let userEmail = "";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (profile?.full_name && profile.full_name.trim().length > 0) {
        userName = profile.full_name.split(" ")[0];
      } else if (user.email) {
        userEmail = user.email;
        userName = user.email.split("@")[0];
      }
    }

    // ── Document setup ──
    const doc = await PDFDocument.create();

    // Get template styles
    const templateStyle = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.premium;

    // Use different fonts based on template
    const TITLE_FONT = await doc.embedFont(StandardFonts.HelveticaBold);
    const HEADING_FONT = templateStyle.fontFamily === "serif"
      ? await doc.embedFont(StandardFonts.TimesRomanBold)
      : await doc.embedFont(StandardFonts.HelveticaBold);
    const REGULAR_FONT = templateStyle.fontFamily === "serif"
      ? await doc.embedFont(StandardFonts.TimesRoman)
      : await doc.embedFont(StandardFonts.Helvetica);
    const ITALIC_FONT = templateStyle.fontFamily === "serif"
      ? await doc.embedFont(StandardFonts.TimesRomanItalic)
      : await doc.embedFont(StandardFonts.HelveticaOblique);

    // Default values
    let effectiveBodyFont = REGULAR_FONT;
    let effectiveBodySize = templateStyle.bodySize;
    let effectiveBodyLH = templateStyle.lineHeight;
    let effectiveML = templateStyle.margins.left;
    let effectiveMR = templateStyle.margins.right;
    let effectiveShowPageNumbers = true;
    let effectiveChapterStartPage = "new";

    // ── Apply custom settings (Pro only) - AFTER fonts are defined ──
    if (userPlan === "pro" && customSettings) {
      console.log("🎨 Applying Pro PDF customizations:", customSettings);
      
      // Font Family
      if (customSettings.fontFamily === "serif") {
        effectiveBodyFont = await doc.embedFont(StandardFonts.TimesRoman);
      } else {
        effectiveBodyFont = await doc.embedFont(StandardFonts.Helvetica);
      }
      
      // Font Size
      effectiveBodySize = customSettings.fontSize;
      
      // Line Height
      effectiveBodyLH = customSettings.fontSize * customSettings.lineHeight;
      
      // Margins
      const marginMap = {
        compact: { left: 48, right: 48 },
        normal: { left: 58, right: 58 },
        spacious: { left: 78, right: 78 },
      };
      const selectedMargins = marginMap[customSettings.margins as keyof typeof marginMap] || marginMap.normal;
      effectiveML = selectedMargins.left;
      effectiveMR = selectedMargins.right;
      
      // Show Page Numbers
      effectiveShowPageNumbers = customSettings.showPageNumbers;
      
      // Chapter Start Page
      effectiveChapterStartPage = customSettings.chapterStartPage;
    }

    const REG = effectiveBodyFont;
    const BOLD = HEADING_FONT;
    const ITAL = ITALIC_FONT;

    const W = 595, H = 842;
    const ML = effectiveML;
    const MR = effectiveMR;
    const TW = W - ML - MR;
    const FOOTER_Y = 46;

    const [ar, ag, ab] = THEMES[theme] || THEMES.indigo;
    const C = buildPalette(ar, ag, ab, template);

    // Body typography
    const BODY_SIZE = effectiveBodySize;
    const BODY_LH = effectiveBodyLH;
    const PARA_GAP = 12;

    let pageNumber = 0;

    // ── Helpers ─────────────────────────────────────────────────────────────
    const fillPage = (page: any, color = C.paper) => {
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color });

      // Add subtle decorative pattern for certain templates
      if (
        templateStyle.showDecorations &&
        (template === "premium" || template === "editorial")
      ) {
        for (let i = 0; i < 3; i++) {
          page.drawCircle({
            x: W * (0.1 + i * 0.4),
            y: H * 0.05,
            size: 80,
            color: C.accent,
            opacity: 0.03,
          });
        }
      }
    };

    const addWatermark = (page: any) => {
      if (!isFreePlan) return;
      let txt = "GENERATED WITH DIGIFORGE AI";
      if (template === "minimal") txt = "DIGIFORGE AI";
      if (template === "editorial") txt = "PREMIUM CONTENT";
      const sz = template === "editorial" ? 18 : 22;
      const tw = BOLD.widthOfTextAtSize(txt, sz);
      page.drawText(txt, {
        x: W / 2 - tw / 2,
        y: H / 2,
        size: sz,
        font: BOLD,
        color: rgb(0.6, 0.6, 0.6),
        opacity: templateStyle.watermarkOpacity,
      });
    };

    const addPage = (bgColor = C.paper) => {
      pageNumber++;
      const page = doc.addPage([W, H]);
      fillPage(page, bgColor);
      addWatermark(page);
      return { page, y: H - 68 };
    };

    const drawFooter = (page: any, section: string) => {
      page.drawLine({
        start: { x: ML, y: 40 },
        end: { x: W - MR, y: 40 },
        thickness: templateStyle.showDecorations ? 0.8 : 0.5,
        color: C.divider,
      });
      // Only show page numbers if enabled (Pro can disable)
  if (effectiveShowPageNumbers === false && userPlan === "pro") {
    // No page numbers
    if (!isFreePlan) {
      const displaySection = template === "minimal" ? section.slice(0, 25) : section.slice(0, 35);
      page.drawText(displaySection, {
        x: ML,
        y: 26,
        size: 8,
        font: REG,
        color: C.inkLight,
      });
    }
  } else if (isFreePlan) {
        page.drawText(`${pageNumber}`, {
          x: W - MR - 12,
          y: 26,
          size: 8,
          font: REG,
          color: C.inkLight,
        });
      } else {
        const displaySection =
          template === "minimal" ? section.slice(0, 25) : section.slice(0, 35);
        page.drawText(displaySection, {
          x: ML,
          y: 26,
          size: 8,
          font: REG,
          color: C.inkLight,
        });
        page.drawText(`${pageNumber}`, {
          x: W - MR - 12,
          y: 26,
          size: 8,
          font: REG,
          color: C.inkLight,
        });
      }
    };

    const writeParagraph = async (
      pg0: any,
      y0: number,
      text: string,
      font: any,
      size: number,
      color: any,
      lh: number,
      section: string,
      indent = 0,
      bgColor = C.paper,
    ): Promise<{ page: any; y: number }> => {
      if (!text || isNaN(y0)) return { page: pg0, y: y0 || H - 100 };
      let page = pg0,
        y = y0;
      const lines = wrapText(text, font, size, TW - indent);
      for (const line of lines) {
        if (y < FOOTER_Y + lh + 10) {
          drawFooter(page, section);
          ({ page, y } = addPage(bgColor));
        }
        page.drawText(line, { x: ML + indent, y, size, font, color });
        y -= lh;
      }
      return { page, y };
    };

    // ════════════════════════════════════════════════════════════════════════
    // COVER PAGE — Unique design for each template
    // ════════════════════════════════════════════════════════════════════════
    const coverPage = doc.addPage([W, H]);
    pageNumber++;
    if (isFreePlan) addWatermark(coverPage);

    const titleClean = clean(content?.title || title);
    const subtitleText = content?.subtitle ? clean(content.subtitle) : "";

    // ========== CLASSIC TEMPLATE - TIMELESS PROFESSIONAL ==========
    if (template === "classic") {
      // Warm, elegant cream background
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H,
        color: rgb(0.98, 0.96, 0.92),
      });

      // Delicate double border frame
      coverPage.drawRectangle({
        x: 35,
        y: 35,
        width: W - 70,
        height: H - 70,
        color: rgb(0, 0, 0),
        opacity: 0.04,
      });
      coverPage.drawRectangle({
        x: 40,
        y: 40,
        width: W - 80,
        height: H - 80,
        color: rgb(0, 0, 0),
        opacity: 0.02,
      });

      // Top and bottom accent lines
      coverPage.drawRectangle({
        x: ML,
        y: H - 50,
        width: TW,
        height: 1,
        color: C.accent,
        opacity: 0.5,
      });
      coverPage.drawRectangle({
        x: ML,
        y: 36,
        width: TW,
        height: 1,
        color: C.accent,
        opacity: 0.5,
      });

      // Corner decorations
      coverPage.drawLine({
        start: { x: 30, y: H - 30 },
        end: { x: 50, y: H - 30 },
        thickness: 1,
        color: C.accent,
        opacity: 0.4,
      });
      coverPage.drawLine({
        start: { x: 30, y: H - 30 },
        end: { x: 30, y: H - 50 },
        thickness: 1,
        color: C.accent,
        opacity: 0.4,
      });
      coverPage.drawLine({
        start: { x: W - 30, y: H - 30 },
        end: { x: W - 50, y: H - 30 },
        thickness: 1,
        color: C.accent,
        opacity: 0.4,
      });
      coverPage.drawLine({
        start: { x: W - 30, y: H - 30 },
        end: { x: W - 30, y: H - 50 },
        thickness: 1,
        color: C.accent,
        opacity: 0.4,
      });

      // Large framed image at top LEFT
      if (coverImageUrl) {
        const coverImg = await embedImg(doc, coverImageUrl);
        if (coverImg) {
          const { width: iw, height: ih } = coverImg.scale(1);
          const imgSize = 160;
          const imgH = (ih / iw) * imgSize;
          const imgX = ML;
          const imgY = H - 110;

          coverPage.drawRectangle({
            x: imgX - 6,
            y: imgY - imgH - 6,
            width: imgSize + 12,
            height: imgH + 12,
            color: C.accent,
            opacity: 0.2,
          });
          coverPage.drawRectangle({
            x: imgX - 4,
            y: imgY - imgH - 4,
            width: imgSize + 8,
            height: imgH + 8,
            color: rgb(0.98, 0.96, 0.92),
          });
          coverPage.drawRectangle({
            x: imgX - 2,
            y: imgY - imgH - 2,
            width: imgSize + 4,
            height: imgH + 4,
            color: C.accent,
            opacity: 0.1,
          });
          coverPage.drawImage(coverImg, {
            x: imgX,
            y: imgY - imgH,
            width: imgSize,
            height: imgH,
            opacity: 0.95,
          });
        }
      }

      // Title - CENTER ALIGNED, fewer breaks (wider line width)
      const titleWords = titleClean.split(" ");
      let titleLines: string[] = [];
      let currentLine = "";
      for (const word of titleWords) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = TITLE_FONT.widthOfTextAtSize(testLine, 34);
        if (width <= TW - 100) {
          // Wider limit = fewer breaks
          currentLine = testLine;
        } else {
          if (currentLine) titleLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) titleLines.push(currentLine);

      let ty = H * 0.58;
      for (let i = 0; i < titleLines.length; i++) {
        const line = titleLines[i];
        const fontSize = i === 0 ? 34 : 30;
        const lineWidth = TITLE_FONT.widthOfTextAtSize(line, fontSize);
        coverPage.drawText(line, {
          x: (W - lineWidth) / 2,
          y: ty,
          size: fontSize,
          font: TITLE_FONT,
          color: C.ink,
        });
        ty -= fontSize + 12;
      }

      // Elegant divider - CENTER ALIGNED
      const dividerY = ty + 16;
      coverPage.drawRectangle({
        x: (W - 60) / 2,
        y: dividerY,
        width: 60,
        height: 2,
        color: C.accent,
        opacity: 0.6,
      });

      // Subtitle - CENTER ALIGNED
      let subY = dividerY - 20;
      if (subtitleText) {
        const subLines = wrapText(subtitleText, ITAL, 13, TW - 100);
        for (const l of subLines) {
          const lineWidth = ITAL.widthOfTextAtSize(l, 13);
          coverPage.drawText(l, {
            x: (W - lineWidth) / 2,
            y: subY,
            size: 13,
            font: ITAL,
            color: C.inkMid,
          });
          subY -= 22;
        }
      }

      // Chapter count at bottom left
      const chapterCount = content?.chapters?.length || 6;
      coverPage.drawText(`${chapterCount} CHAPTERS`, {
        x: ML,
        y: 50,
        size: 9,
        font: BOLD,
        color: C.inkMid,
      });

      // Optional author name at bottom right
      if (!isFreePlan && userName) {
        coverPage.drawText(userName, {
          x: W - MR - 100,
          y: 50,
          size: 9,
          font: REG,
          color: C.inkMid,
        });
      }

      // Bottom border
      coverPage.drawRectangle({
        x: ML,
        y: 32,
        width: TW,
        height: 1,
        color: C.accent,
        opacity: 0.4,
      });
    }

    // ========== MODERN TEMPLATE ==========
    else if (template === "modern") {
      // Bold gradient background
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H,
        color: rgb(0.98, 0.97, 1),
      });

      // Diagonal accent band
      coverPage.drawLine({
        start: { x: 0, y: H },
        end: { x: W, y: 0 },
        thickness: 80,
        color: C.accent,
        opacity: 0.08,
      });

      // Full-bleed cover image with bold overlay
      if (coverImageUrl) {
        const coverImg = await embedImg(doc, coverImageUrl);
        if (coverImg) {
          const { width: iw, height: ih } = coverImg.scale(1);
          const scale = Math.max(W / iw, H / ih);
          coverPage.drawImage(coverImg, {
            x: (W - iw * scale) / 2,
            y: (H - ih * scale) / 2,
            width: iw * scale,
            height: ih * scale,
            opacity: 0.55,
          });
        }
      }

      // Bold color block for title area
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H * 0.45,
        color: C.accent,
        opacity: 0.85,
      });

      // Title - large, bold, modern
      const titleWords = titleClean.split(" ");
      let tl = "",
        tLines: string[] = [];
      for (const w of titleWords) {
        const test = tl ? `${tl} ${w}` : w;
        TITLE_FONT.widthOfTextAtSize(test, 38) <= TW
          ? (tl = test)
          : (tLines.push(tl), (tl = w));
      }
      if (tl) tLines.push(tl);

      let ty = H * 0.28;
      for (const line of tLines) {
        coverPage.drawText(line, {
          x: ML,
          y: ty,
          size: 38,
          font: TITLE_FONT,
          color: rgb(1, 1, 1),
        });
        ty -= 48;
      }

      // Subtitle on white panel
      if (subtitleText) {
        const subLines = wrapText(subtitleText, REG, 12, TW);
        ty -= 15;
        for (const l of subLines) {
          coverPage.drawText(l, {
            x: ML,
            y: ty,
            size: 12,
            font: REG,
            color: rgb(0.9, 0.9, 0.95),
          });
          ty -= 18;
        }
      }

      // Bottom accent
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: 8,
        color: C.accent,
      });
    }

    // ========== PREMIUM TEMPLATE - CLEAN PROFESSIONAL COVER ==========
    else if (template === "premium") {
      // Clean dark background
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H,
        color: rgb(0.05, 0.05, 0.12),
      });

      // Full-bleed cover image (subtle background)
      if (coverImageUrl) {
        const coverImg = await embedImg(doc, coverImageUrl);
        if (coverImg) {
          const { width: iw, height: ih } = coverImg.scale(1);
          const scale = Math.max(W / iw, H / ih);
          coverPage.drawImage(coverImg, {
            x: (W - iw * scale) / 2,
            y: (H - ih * scale) / 2,
            width: iw * scale,
            height: ih * scale,
            opacity: 0.25,
          });
        }
      }

      // Gradient overlay for text readability
      coverPage.drawRectangle({
        x: 0,
        y: H * 0.3,
        width: W,
        height: H * 0.7,
        color: rgb(0, 0, 0),
        opacity: 0.5,
      });

      // Top accent bar (subtle)
      coverPage.drawRectangle({
        x: 0,
        y: H - 4,
        width: W,
        height: 3,
        color: C.accent,
      });

      // Main Title - large and bold
      const titleWords = titleClean.split(" ");
      let titleLines: string[] = [];
      let currentLine = "";
      for (const word of titleWords) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = TITLE_FONT.widthOfTextAtSize(testLine, 44);
        if (width <= TW - 80) {
          currentLine = testLine;
        } else {
          if (currentLine) titleLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) titleLines.push(currentLine);

      let ty = H * 0.48;
      for (let i = 0; i < titleLines.length; i++) {
        const line = titleLines[i];
        const fontSize = i === 0 ? 44 : 36;
        coverPage.drawText(line, {
          x: ML,
          y: ty,
          size: fontSize,
          font: TITLE_FONT,
          color: rgb(1, 1, 1),
        });
        ty -= fontSize + 8;
      }

      // Accent line under title
      coverPage.drawRectangle({
        x: ML,
        y: ty + 12,
        width: 70,
        height: 3,
        color: C.accent,
      });

      // Subtitle
      if (subtitleText) {
        ty -= 5;
        const subLines = wrapText(subtitleText, REG, 14, TW - 80);
        for (const l of subLines) {
          coverPage.drawText(l, {
            x: ML,
            y: ty,
            size: 14,
            font: REG,
            color: rgb(0.85, 0.82, 0.78),
          });
          ty -= 22;
        }
      }

      // Chapter count (clean, simple)
      const chapterCount = content?.chapters?.length || 6;
      coverPage.drawText(`${chapterCount} CHAPTERS`, {
        x: ML,
        y: 55,
        size: 9,
        font: BOLD,
        color: rgb(0.7, 0.68, 0.64),
      });

      // Bottom accent bar
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: 3,
        color: C.accent,
      });

      // NO footer, NO page number on cover
    }

// ========== MINIMAL TEMPLATE - CLEAN WITH SUBTLE IMAGE ==========
else if (template === "minimal") {
  // Pure white background
  coverPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  
  // Subtle cover image as background watermark (very light)
  if (coverImageUrl) {
    const coverImg = await embedImg(doc, coverImageUrl);
    if (coverImg) {
      const { width: iw, height: ih } = coverImg.scale(1);
      // Large but very transparent
      const scale = Math.max(W / iw, H / ih);
      coverPage.drawImage(coverImg, {
        x: (W - iw * scale) / 2,
        y: (H - ih * scale) / 2,
        width: iw * scale,
        height: ih * scale,
        opacity: 0.08,  // Very subtle - barely visible
      });
    }
  }
  
  // Tiny accent dot (signature style) - top right corner
  coverPage.drawCircle({ x: W - MR, y: H - 50, size: 3, color: C.accent, opacity: 0.5 });
  
  // Ultra clean layout - title centered
  const titleWords = titleClean.split(" ");
  let titleLines: string[] = [];
  let currentLine = "";
  for (const word of titleWords) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = TITLE_FONT.widthOfTextAtSize(testLine, 36);
    if (width <= TW - 100) {
      currentLine = testLine;
    } else {
      if (currentLine) titleLines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) titleLines.push(currentLine);
  
  let ty = H * 0.42;
  for (let i = 0; i < titleLines.length; i++) {
    const line = titleLines[i];
    const fontSize = i === 0 ? 36 : 28;
    const lineWidth = TITLE_FONT.widthOfTextAtSize(line, fontSize);
    coverPage.drawText(line, {
      x: (W - lineWidth) / 2,
      y: ty,
      size: fontSize,
      font: TITLE_FONT,
      color: C.ink,
    });
    ty -= fontSize + 12;
  }
  
  // Thin divider line
  const dividerY = ty + 16;
  coverPage.drawRectangle({
    x: (W - 50) / 2,
    y: dividerY,
    width: 50,
    height: 1,
    color: C.accent,
    opacity: 0.4,
  });
  
  // Subtitle
  let subY = dividerY - 20;
  if (subtitleText) {
    const subLines = wrapText(subtitleText, REG, 11, TW - 100);
    for (const l of subLines) {
      const lineWidth = REG.widthOfTextAtSize(l, 11);
      coverPage.drawText(l, {
        x: (W - lineWidth) / 2,
        y: subY,
        size: 11,
        font: REG,
        color: C.inkMid,
      });
      subY -= 18;
    }
  }
  
  // Chapter count at bottom center
  const chapterCount = content?.chapters?.length || 6;
  coverPage.drawText(`${chapterCount} CHAPTERS`, {
    x: (W - 80) / 2,
    y: 45,
    size: 8,
    font: BOLD,
    color: C.inkLight,
  });
  
  // Small brand text (only for free users)
  if (isFreePlan) {
    coverPage.drawText("DIGIFORGE AI", {
      x: (W - 60) / 2,
      y: 28,
      size: 6,
      font: REG,
      color: C.inkLight,
      opacity: 0.5,
    });
  }
}

// ========== EDITORIAL TEMPLATE - POWERFUL PRO EDITION ==========
else if (template === "editorial") {
  // Bold, sophisticated dark background (like premium magazines)
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: rgb(0.06, 0.06, 0.10),
  });

  // Dramatic full-bleed image with dark overlay
  if (coverImageUrl) {
    const coverImg = await embedImg(doc, coverImageUrl);
    if (coverImg) {
      const { width: iw, height: ih } = coverImg.scale(1);
      const scale = Math.max(W / iw, H / ih);
      coverPage.drawImage(coverImg, {
        x: (W - iw * scale) / 2,
        y: (H - ih * scale) / 2,
        width: iw * scale,
        height: ih * scale,
        opacity: 0.55,
      });
      // Dramatic gradient overlay
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H,
        color: rgb(0.06, 0.06, 0.10),
        opacity: 0.4,
      });
    }
  }

  // Large editorial badge (top left)
  coverPage.drawText("EDITOR'S PICK", {
    x: ML,
    y: H - 45,
    size: 10,
    font: BOLD,
    color: C.accent,
    opacity: 0.8,
  });
  coverPage.drawRectangle({
    x: ML,
    y: H - 50,
    width: 80,
    height: 2,
    color: C.accent,
    opacity: 0.5,
  });

  // Main title - huge, bold, commanding
  const titleWords = titleClean.split(" ");
  let titleLines: string[] = [];
  let currentLine = "";
  for (const word of titleWords) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = TITLE_FONT.widthOfTextAtSize(testLine, 48);
    if (width <= TW - 60) {
      currentLine = testLine;
    } else {
      if (currentLine) titleLines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) titleLines.push(currentLine);

  let ty = H * 0.48;
  for (let i = 0; i < titleLines.length; i++) {
    const line = titleLines[i];
    const fontSize = i === 0 ? 48 : 38;
    const lineWidth = TITLE_FONT.widthOfTextAtSize(line, fontSize);
    coverPage.drawText(line, {
      x: (W - lineWidth) / 2,
      y: ty,
      size: fontSize,
      font: TITLE_FONT,
      color: rgb(1, 1, 1),
    });
    ty -= fontSize + 12;
  }

  // Dramatic accent bar under title
  const barY = ty + 18;
  coverPage.drawRectangle({
    x: (W - 100) / 2,
    y: barY,
    width: 100,
    height: 4,
    color: C.accent,
    opacity: 0.9,
  });
  
  // Small diamond/star accent
  coverPage.drawText("-", {
    x: W / 2 - 4,
    y: barY - 8,
    size: 10,
    font: BOLD,
    color: C.accent,
    opacity: 0.6,
  });

  // Subtitle - impactful, italic
  if (subtitleText) {
    let subY = barY - 30;
    const subLines = wrapText(subtitleText, ITAL, 14, TW - 80);
    for (const l of subLines) {
      const lineWidth = ITAL.widthOfTextAtSize(l, 14);
      coverPage.drawText(l, {
        x: (W - lineWidth) / 2,
        y: subY,
        size: 14,
        font: ITAL,
        color: rgb(0.85, 0.82, 0.78),
      });
      subY -= 22;
    }
  }

  // Bottom section - premium badge styling
  const bottomY = 45;
  
  // Premium badge background
  coverPage.drawRectangle({
    x: ML,
    y: bottomY - 8,
    width: 120,
    height: 28,
    color: C.accent,
    opacity: 0.15,
  });
  coverPage.drawRectangle({
    x: ML,
    y: bottomY - 8,
    width: 4,
    height: 28,
    color: C.accent,
    opacity: 0.8,
  });
  
  const chapterCount = content?.chapters?.length || 6;
  coverPage.drawText(`${chapterCount} COMPLETE CHAPTERS`, {
    x: ML + 12,
    y: bottomY + 5,
    size: 8,
    font: BOLD,
    color: C.accent,
  });

  // Author credit - premium placement
  if (!isFreePlan && userName && userName !== "Pro" && userName !== "Valued Reader") {
    coverPage.drawText(`AUTHOR: ${userName.toUpperCase()}`, {
      x: W - MR - 140,
      y: bottomY + 5,
      size: 7,
      font: BOLD,
      color: rgb(0.65, 0.62, 0.58),
      opacity: 0.7,
    });
  }

  // Bottom accent line
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: 3,
    color: C.accent,
    opacity: 0.6,
  });

  // Top accent line
  coverPage.drawRectangle({
    x: 0,
    y: H - 3,
    width: W,
    height: 3,
    color: C.accent,
    opacity: 0.6,
  });
}

// ========== CORPORATE TEMPLATE - CLEAN PREMIUM BUSINESS ==========
else if (template === "corporate") {
  // Premium dark navy background
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: rgb(0.03, 0.05, 0.10),
  });

  // Subtle diagonal pattern (barely visible)
  for (let i = -H; i < W + H; i += 60) {
    coverPage.drawLine({
      start: { x: i, y: 0 },
      end: { x: i + H, y: H },
      thickness: 0.3,
      color: rgb(1, 1, 1),
      opacity: 0.02,
    });
  }

  // Full-width cover image as background
  if (coverImageUrl) {
    const coverImg = await embedImg(doc, coverImageUrl);
    if (coverImg) {
      const { width: iw, height: ih } = coverImg.scale(1);
      const scale = Math.max(W / iw, H / ih);
      coverPage.drawImage(coverImg, {
        x: (W - iw * scale) / 2,
        y: (H - ih * scale) / 2,
        width: iw * scale,
        height: ih * scale,
        opacity: 0.35,
      });
      // Dark overlay for text readability
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H,
        color: rgb(0, 0, 0),
        opacity: 0.5,
      });
    }
  }

  // Top accent line (subtle gold)
  coverPage.drawRectangle({
    x: 0,
    y: H - 4,
    width: W,
    height: 2,
    color: C.accent,
    opacity: 0.5,
  });

  // NO DIGIFORGE BRANDING FOR PRO - Clean and professional

  // Title - centered, bold, professional
  const titleWords = titleClean.split(" ");
  let titleLines: string[] = [];
  let currentLine = "";
  for (const word of titleWords) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = TITLE_FONT.widthOfTextAtSize(testLine, 38);
    if (width <= TW - 60) {
      currentLine = testLine;
    } else {
      if (currentLine) titleLines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) titleLines.push(currentLine);

  let ty = H * 0.48;
  for (let i = 0; i < titleLines.length; i++) {
    const line = titleLines[i];
    const fontSize = i === 0 ? 38 : 30;
    const lineWidth = TITLE_FONT.widthOfTextAtSize(line, fontSize);
    coverPage.drawText(line, {
      x: (W - lineWidth) / 2,
      y: ty,
      size: fontSize,
      font: TITLE_FONT,
      color: rgb(1, 1, 1),
    });
    ty -= fontSize + 10;
  }

  // Accent bar under title
  const barY = ty + 15;
  coverPage.drawRectangle({
    x: (W - 70) / 2,
    y: barY,
    width: 70,
    height: 3,
    color: C.accent,
    opacity: 0.7,
  });

  // Subtitle
  if (subtitleText) {
    let subY = barY - 25;
    const subLines = wrapText(subtitleText, REG, 12, TW - 80);
    for (const l of subLines) {
      const lineWidth = REG.widthOfTextAtSize(l, 12);
      coverPage.drawText(l, {
        x: (W - lineWidth) / 2,
        y: subY,
        size: 12,
        font: REG,
        color: rgb(0.8, 0.82, 0.9),
      });
      subY -= 20;
    }
  }

  // Bottom accent line
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: 2,
    color: C.accent,
    opacity: 0.5,
  });

  // Bottom left - chapter count
  const chapterCount = content?.chapters?.length || 6;
  coverPage.drawText(`${chapterCount} COMPLETE CHAPTERS`, {
    x: ML,
    y: 35,
    size: 8,
    font: BOLD,
    color: C.accent,
    opacity: 0.7,
  });

  // Bottom right - author name (only for paid users, no "PRO" text)
  if (!isFreePlan && userName && userName !== "Pro" && userName !== "Valued Reader") {
    coverPage.drawText(userName.toUpperCase(), {
      x: W - MR - 100,
      y: 35,
      size: 8,
      font: BOLD,
      color: rgb(0.65, 0.68, 0.8),
      opacity: 0.7,
    });
  }

  // Only show brand for free users
  if (isFreePlan) {
    coverPage.drawText("DIGIFORGE AI", {
      x: W - MR - 80,
      y: 35,
      size: 7,
      font: REG,
      color: rgb(0.5, 0.55, 0.7),
      opacity: 0.5,
    });
  }
}

    // Default fallback
    else {
      // Simple dark cover
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H,
        color: C.paperDark,
      });
      if (coverImageUrl) {
        const coverImg = await embedImg(doc, coverImageUrl);
        if (coverImg) {
          const { width: iw, height: ih } = coverImg.scale(1);
          const scale = Math.max(W / iw, H / ih);
          coverPage.drawImage(coverImg, {
            x: (W - iw * scale) / 2,
            y: (H - ih * scale) / 2,
            width: iw * scale,
            height: ih * scale,
            opacity: 0.4,
          });
        }
      }
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: W,
        height: H * 0.65,
        color: rgb(0, 0, 0),
        opacity: 0.7,
      });

      const titleWords = titleClean.split(" ");
      let tl = "",
        tLines: string[] = [];
      for (const w of titleWords) {
        const test = tl ? `${tl} ${w}` : w;
        TITLE_FONT.widthOfTextAtSize(test, 36) <= TW
          ? (tl = test)
          : (tLines.push(tl), (tl = w));
      }
      if (tl) tLines.push(tl);

      let ty = H * 0.4;
      for (const line of tLines) {
        coverPage.drawText(line, {
          x: ML,
          y: ty,
          size: 36,
          font: TITLE_FONT,
          color: rgb(1, 1, 1),
        });
        ty -= 46;
      }
    }

// ════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS - FIXED WITH BETTER SPACING
// ════════════════════════════════════════════════════════════════════════
let { page: tocPage, y: tocY } = addPage(C.paper);

tocPage.drawText("CONTENTS", {
  x: ML,
  y: H - 68,
  size: template === "minimal" ? 32 : 42,
  font: BOLD,
  color: C.ink,
});

if (templateStyle.showDecorations) {
  tocPage.drawRectangle({
    x: ML,
    y: H - 80,
    width: TW,
    height: 1.5,
    color: C.divider,
  });
}

tocY = H - 114;

// Header row
tocPage.drawText("Section", {
  x: ML,
  y: tocY,
  size: 10,
  font: BOLD,
  color: C.accent,
});
tocPage.drawText("Page", {
  x: W - MR - 26,
  y: tocY,
  size: 10,
  font: BOLD,
  color: C.accent,
});
tocY -= 12;
tocPage.drawRectangle({
  x: ML,
  y: tocY,
  width: TW,
  height: 1,
  color: C.accent,
  opacity: 0.6,
});
tocY -= 28; // More space after header

const tocItems = [
  { title: "Introduction", page: 1 },
  ...(content?.chapters?.map((ch: any, i: number) => ({
    title: ch?.title || `Chapter ${i + 1}`,
    page: i + 2,
  })) || []),
  { title: "Conclusion", page: (content?.chapters?.length || 0) + 2 },
];

for (let idx = 0; idx < tocItems.length; idx++) {
  const item = tocItems[idx];
  const isChapter = idx > 0 && idx < tocItems.length - 1;
  
  // Calculate title width to prevent wrapping
  const titleFont = isChapter ? BOLD : REG;
  const titleSize = 11;
  const chapterNumWidth = isChapter && template !== "minimal" ? 35 : 0;
  const availableWidth = TW - 50 - chapterNumWidth - 40;
  
  // Get title as single line
  let titleText = item.title;
  let titleWidth = titleFont.widthOfTextAtSize(titleText, titleSize);
  
  // If title is too long, truncate with ellipsis
  if (titleWidth > availableWidth) {
    while (titleWidth > availableWidth && titleText.length > 5) {
      titleText = titleText.slice(0, -1);
      titleWidth = titleFont.widthOfTextAtSize(titleText + "...", titleSize);
    }
    titleText = titleText + "...";
  }
  
  // Check if we need a new page (increased threshold)
  if (tocY < 60) {
    drawFooter(tocPage, "Contents");
    ({ page: tocPage, y: tocY } = addPage(C.paper));
    tocY -= 30;
  }
  
  // Draw alternating row background with more height
  if (idx % 2 === 0 && templateStyle.showDecorations) {
    tocPage.drawRectangle({
      x: ML - 6,
      y: tocY - 8,
      width: TW + 12,
      height: 30, // Increased row height
      color: C.paperDeep,
      opacity: 0.4,
    });
  }
  
  // Draw chapter number (for chapters only)
  let startX = ML;
  if (isChapter && template !== "minimal") {
    const chapterNum = String(idx).padStart(2, "0");
    tocPage.drawText(chapterNum, {
      x: ML,
      y: tocY,
      size: 10,
      font: BOLD,
      color: C.accent,
    });
    startX = ML + 38; // Slightly more indent
  } else {
    startX = ML + 12; // More indent for non-chapters
  }
  
  // Draw title (single line)
  tocPage.drawText(titleText, {
    x: startX,
    y: tocY,
    size: titleSize,
    font: titleFont,
    color: C.ink,
  });
  
  // Draw page number
  tocPage.drawText(String(item.page), {
    x: W - MR - 22,
    y: tocY,
    size: 11,
    font: BOLD,
    color: C.accent,
  });
  
  tocY -= 32; // Increased spacing between rows (was 22)
}

drawFooter(tocPage, "Contents");

    // ════════════════════════════════════════════════════════════════════════
    // INTRODUCTION
    // ════════════════════════════════════════════════════════════════════════
    let { page: introPage, y: introY } = addPage(C.paper);

    const introHeadingSize = templateStyle.headingSize;
    introPage.drawText("INTRODUCTION", {
      x: ML,
      y: H - 50,
      size: 9,
      font: BOLD,
      color: C.accent,
    });
    introPage.drawText("Getting Started", {
      x: ML,
      y: H - 80,
      size: introHeadingSize,
      font: BOLD,
      color: C.ink,
    });

    if (templateStyle.showDecorations) {
      introPage.drawRectangle({
        x: ML,
        y: H - 90,
        width: 60,
        height: 3,
        color: C.gold,
      });
    }

    introY = H - 128;

    const introParagraphs = splitParagraphs(content?.introduction || "");
    for (let i = 0; i < introParagraphs.length; i++) {
      if (introY < FOOTER_Y + 30) {
        drawFooter(introPage, "Introduction");
        ({ page: introPage, y: introY } = addPage(C.paper));
      }
      const sz = i === 0 ? BODY_SIZE + 1.5 : BODY_SIZE;
      const lh = i === 0 ? BODY_LH + 2 : BODY_LH;
      const col = i === 0 ? C.ink : C.inkMid;
      const result = await writeParagraph(
        introPage,
        introY,
        introParagraphs[i],
        REG,
        sz,
        col,
        lh,
        "Introduction",
        0,
        C.paper,
      );
      introPage = result.page;
      introY = result.y - PARA_GAP;
    }

    drawFooter(introPage, "Introduction");

    // ════════════════════════════════════════════════════════════════════════
    // CHAPTERS
    // ════════════════════════════════════════════════════════════════════════
    for (let i = 0; i < (content?.chapters?.length || 0); i++) {
      const chapter = content.chapters[i];
      const chapterTitle = clean(chapter?.title || `Chapter ${i + 1}`);
      const chNum = String(i + 1).padStart(2, "0");

      let chapterImageEmbed: any = null;
      if (shouldAddImages) {
        const imgUrl = await getChapterImage(chapterTitle, i);
        if (imgUrl) chapterImageEmbed = await embedImg(doc, imgUrl);
      }

      const chBg = i % 2 === 0 ? C.paper : C.paperDeep;
      let { page: chPage, y: chY } = addPage(chBg);

      // Decorative chapter number (skip for minimal)
      if (template !== "minimal") {
        const bigNumW = BOLD.widthOfTextAtSize(chNum, 120);
        chPage.drawText(chNum, {
          x: W - MR - bigNumW + 10,
          y: H - 160,
          size: 120,
          font: BOLD,
          color: C.accent,
          opacity: 0.1,
        });
      }

      chPage.drawText(`CHAPTER ${i + 1}`, {
        x: ML,
        y: H - 52,
        size: 9,
        font: BOLD,
        color: C.accent,
      });

      const chTitleLines = wrapText(
        chapterTitle,
        BOLD,
        templateStyle.headingSize,
        TW - 40,
      );
      let ctY = H - 82;
      for (const line of chTitleLines) {
        chPage.drawText(line, {
          x: ML,
          y: ctY,
          size: templateStyle.headingSize,
          font: BOLD,
          color: C.ink,
        });
        ctY -= templateStyle.headingSize + 8;
      }

      if (templateStyle.showDecorations) {
        chPage.drawRectangle({
          x: ML,
          y: ctY + 10,
          width: 55,
          height: 3,
          color: C.gold,
        });
      }

      chY = ctY - 8;

      if (chapterImageEmbed) {
        try {
          const imgW = TW;
          const { width: iw, height: ih } = chapterImageEmbed.scale(1);
          const imgH = Math.min(180, (ih / iw) * imgW);
          if (chY - imgH - 16 > FOOTER_Y + 80) {
            chY -= 12;
            chPage.drawRectangle({
              x: ML - 2,
              y: chY - imgH - 2,
              width: imgW + 4,
              height: imgH + 4,
              color: C.divider,
            });
            chPage.drawImage(chapterImageEmbed, {
              x: ML,
              y: chY - imgH,
              width: imgW,
              height: imgH,
            });
            chY -= imgH + 20;
          }
        } catch (err) {
          console.error("Chapter image draw error:", err);
        }
      }

      const contentParas = splitParagraphs(chapter?.content || "");
      for (let p = 0; p < contentParas.length; p++) {
        const para = contentParas[p];
        if (!para || para.length < 15) continue;

        if (chY < FOOTER_Y + 40) {
          drawFooter(chPage, chapterTitle);
          ({ page: chPage, y: chY } = addPage(chBg));
        }

        // Pull quotes (only for editorial template)
        if (
          (template === "editorial" || template === "premium") &&
          p > 0 &&
          p % 4 === 0 &&
          para.length > 100
        ) {
          const firstSent = (para.match(/[^.!?]+[.!?]+/) || [""])[0].trim();
          if (firstSent.length > 60) {
            const qLines = wrapText(firstSent, ITAL, 13, TW - 48).filter(
              Boolean,
            );
            const qH = qLines.length * 22 + 36;
            if (chY - qH > FOOTER_Y + 30) {
              chY -= 12;
              chPage.drawRectangle({
                x: ML,
                y: chY - qH,
                width: TW,
                height: qH,
                color: C.tint,
              });
              chPage.drawRectangle({
                x: ML,
                y: chY - qH,
                width: 4,
                height: qH,
                color: C.accent,
              });
              chPage.drawText("\u201C", {
                x: ML + 14,
                y: chY - 6,
                size: 24,
                font: BOLD,
                color: C.accent,
                opacity: 0.6,
              });
              let qy = chY - 16;
              for (const ql of qLines) {
                chPage.drawText(ql, {
                  x: ML + 32,
                  y: qy,
                  size: 13,
                  font: ITAL,
                  color: C.inkMid,
                });
                qy -= 22;
              }
              chY -= qH + 16;
              continue;
            }
          }
        }

        const isLead = p === 0;
        const sz = isLead ? BODY_SIZE + 1.5 : BODY_SIZE;
        const lh = isLead ? BODY_LH + 2 : BODY_LH;
        const col = isLead ? C.ink : C.inkMid;
        const result = await writeParagraph(
          chPage,
          chY,
          para,
          isLead ? BOLD : REG,
          sz,
          col,
          lh,
          chapterTitle,
          0,
          chBg,
        );
        chPage = result.page;
        chY = result.y - PARA_GAP;
      }

      // ── Key Takeaways box with MUCH BETTER CONTRAST ────────────────────────────────
      if (chapter?.tips?.length > 0 && template !== "minimal") {
        const validTips = chapter.tips.filter(
          (t: string) => t && t.length > 10,
        );
        if (validTips.length > 0) {
          // Calculate box height
          let boxH = 48;
          for (const tip of validTips.slice(0, 5)) {
            boxH += wrapText(tip, REG, 10, TW - 52).length * 17 + 8;
          }
          boxH += 10;

          if (chY - boxH < FOOTER_Y + 20) {
            drawFooter(chPage, chapterTitle);
            ({ page: chPage, y: chY } = addPage(chBg));
          }

          chY -= 18;

          // Box background - use solid white with slight tint for ALL templates
          const boxBg =
            template === "premium"
              ? rgb(0.98, 0.96, 0.94)
              : template === "editorial"
                ? rgb(0.96, 0.94, 0.9)
                : rgb(0.98, 0.98, 0.96);
          chPage.drawRectangle({
            x: ML,
            y: chY - boxH,
            width: TW,
            height: boxH,
            color: boxBg,
          });
          chPage.drawRectangle({
            x: ML,
            y: chY - boxH,
            width: TW,
            height: boxH,
            color: rgb(0, 0, 0),
            opacity: 0.03,
          });

          // Left accent bar
          chPage.drawRectangle({
            x: ML,
            y: chY - boxH,
            width: 4,
            height: boxH,
            color: C.accent,
          });

          // Header row
          chPage.drawRectangle({
            x: ML,
            y: chY - 28,
            width: TW,
            height: 28,
            color: C.accent,
            opacity: 0.15,
          });
          chPage.drawText("KEY INSIGHTS", {
            x: ML + 16,
            y: chY - 18,
            size: 9,
            font: BOLD,
            color: C.accent,
          });

          let tipY = chY - 44;
          for (const tip of validTips.slice(0, 5)) {
            const tipLines = wrapText(tip, REG, 10, TW - 52);
            if (tipY < chY - boxH + 8) break;

            // Use DARK ink color for ALL templates - maximum contrast
            chPage.drawCircle({
              x: ML + 18,
              y: tipY + 4,
              size: 3,
              color: C.accent,
            });
            for (const tl of tipLines) {
              if (tipY < chY - boxH + 6) break;
              // FORCE dark text color for readability
              const textColor = rgb(0.08, 0.06, 0.05); // Very dark brown/black
              chPage.drawText(tl, {
                x: ML + 30,
                y: tipY,
                size: 10,
                font: REG,
                color: textColor,
              });
              tipY -= 17;
            }
            tipY -= 8;
          }
          chY -= boxH + 18;
        }
      }

      drawFooter(chPage, chapterTitle);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONCLUSION
    // ════════════════════════════════════════════════════════════════════════
    let { page: concPage, y: concY } = addPage(C.paper);

    concPage.drawText("CONCLUSION", {
      x: ML,
      y: H - 50,
      size: 9,
      font: BOLD,
      color: C.accent,
    });
    concPage.drawText("Your Journey Forward", {
      x: ML,
      y: H - 80,
      size: templateStyle.headingSize,
      font: BOLD,
      color: C.ink,
    });

    if (templateStyle.showDecorations) {
      concPage.drawRectangle({
        x: ML,
        y: H - 90,
        width: 60,
        height: 3,
        color: C.gold,
      });
    }

    concY = H - 128;

    const concParas = splitParagraphs(content?.conclusion || "");
    for (const para of concParas) {
      if (concY < FOOTER_Y + 40) {
        drawFooter(concPage, "Conclusion");
        ({ page: concPage, y: concY } = addPage(C.paper));
      }
      const result = await writeParagraph(
        concPage,
        concY,
        para,
        REG,
        BODY_SIZE,
        C.inkMid,
        BODY_LH,
        "Conclusion",
        0,
        C.paper,
      );
      concPage = result.page;
      concY = result.y - PARA_GAP;
    }

    // Call to action
    if (
      content?.callToAction &&
      concY > FOOTER_Y + 100 &&
      template !== "minimal"
    ) {
      concY -= 24;
      const ctaLines = wrapText(content.callToAction, BOLD, 12, TW - 48);
      const ctaH = ctaLines.length * 22 + 54;
      concPage.drawRectangle({
        x: ML,
        y: concY - ctaH,
        width: TW,
        height: ctaH,
        color: C.accent,
      });
      concPage.drawRectangle({
        x: ML,
        y: concY - 28,
        width: TW,
        height: 28,
        color: rgb(0, 0, 0),
        opacity: 0.12,
      });
      concPage.drawText("NEXT STEPS", {
        x: ML + 20,
        y: concY - 19,
        size: 8.5,
        font: BOLD,
        color: C.gold,
      });
      let ctaY = concY - 44;
      for (const cl of ctaLines) {
        concPage.drawText(cl, {
          x: ML + 20,
          y: ctaY,
          size: 12,
          font: BOLD,
          color: rgb(1, 1, 1),
        });
        ctaY -= 22;
      }
    }

    drawFooter(concPage, "Conclusion");

    // ════════════════════════════════════════════════════════════════════════
    // BACK COVER — Personalized with user's name/email
    // ════════════════════════════════════════════════════════════════════════
    const backPage = doc.addPage([W, H]);
    backPage.drawRectangle({
      x: 0,
      y: 0,
      width: W,
      height: H,
      color: C.paperDark,
    });

    if (template !== "minimal") {
      backPage.drawCircle({
        x: W * 0.2,
        y: H * 0.65,
        size: 200,
        color: C.accent,
        opacity: 0.05,
      });
      backPage.drawCircle({
        x: W * 0.8,
        y: H * 0.35,
        size: 160,
        color: rgb(1, 1, 1),
        opacity: 0.03,
      });
    }

    backPage.drawRectangle({
      x: 0,
      y: H - 4,
      width: W,
      height: 4,
      color: C.accent,
    });
    backPage.drawRectangle({
      x: 0,
      y: 0,
      width: W,
      height: 4,
      color: C.accent,
    });

    // Personalized quote or message
    const quoteText =
      template === "corporate"
        ? `"${userName}, excellence is not a skill. It's an attitude."`
        : template === "minimal"
          ? `"${userName}, start small. Think big."`
          : `"${userName}, the best investment you can make is in yourself. Knowledge is the currency that never devalues."`;

    const qLines = wrapText(quoteText, ITAL, 14, TW - 30).filter(Boolean);
    let qy = H / 2 + 60;
    for (const l of qLines) {
      backPage.drawText(l, {
        x: ML + 28,
        y: qy,
        size: 14,
        font: ITAL,
        color: rgb(0.85, 0.83, 0.78),
      });
      qy -= 24;
    }

    if (template !== "minimal") {
      backPage.drawRectangle({
        x: ML + 28,
        y: qy - 12,
        width: 48,
        height: 2,
        color: C.gold,
      });
    }

    // Personalized footer - show user's name or email
    qy -= 30;
    if (userEmail) {
      backPage.drawText(`Created by: ${userEmail}`, {
        x: ML + 28,
        y: qy,
        size: 9,
        font: REG,
        color: rgb(0.65, 0.62, 0.58),
      });
    } else {
      backPage.drawText(`Created by: ${userName}`, {
        x: ML + 28,
        y: qy,
        size: 9,
        font: REG,
        color: rgb(0.65, 0.62, 0.58),
      });
    }

    qy -= 20;
    backPage.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
      x: ML + 28,
      y: qy,
      size: 8,
      font: REG,
      color: rgb(0.55, 0.52, 0.48),
    });

    // Small brand mention (optional, not intrusive)
    if (isFreePlan) {
      qy -= 16;
      backPage.drawText("DigiForge AI", {
        x: ML + 28,
        y: qy,
        size: 8,
        font: REG,
        color: rgb(0.45, 0.42, 0.38),
        opacity: 0.6,
      });
    }

    const pdfBytes = await doc.save();
    console.log(
      `✅ PDF generated with ${template} template, size:`,
      pdfBytes.length,
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${clean(title).replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
