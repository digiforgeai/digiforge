// app/api/pdf/route.ts - PREMIUM WORKBOOK EDITION
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
    .replace(/\t/g, " ").replace(/\r/g, "")
    .replace(/\u00A0/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x00-\x7F]/g, (c: string) => ({
      "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"',
      "\u2013": "-", "\u2014": "--", "\u2026": "...", "\u2022": "-",
      "\u00E9": "e", "\u00E8": "e", "\u00EA": "e", "\u00E0": "a",
      "\u00E2": "a", "\u00F4": "o", "\u00FB": "u", "\u00FC": "u",
      "\u00E7": "c", "\u00EE": "i", "\u00EF": "i", "\u00F1": "n",
      "\u00E1": "a", "\u00ED": "i", "\u00F3": "o", "\u00FA": "u",
    } as Record<string, string>)[c] || "")
    .replace(/\s+/g, " ").trim();

// ── WORD WRAP ───────────────────────────────────────────────────────────────
function wrapText(text: string, font: any, size: number, maxW: number): string[] {
  if (!text) return [];
  const words = clean(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    try {
      font.widthOfTextAtSize(test, size) <= maxW ? (line = test) : (lines.push(line), line = w);
    } catch { line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

// ── PARAGRAPH SPLITTER ──────────────────────────────────────────────────────
function splitParagraphs(text: string): string[] {
  if (!text) return [];
  const c = clean(text);
  const byDouble = c.split(/\n\n+/).map(p => p.replace(/\n/g, " ").trim()).filter(p => p.length > 20);
  if (byDouble.length > 1) return byDouble;
  const bySingle = c.split(/\n/).map(p => p.trim()).filter(p => p.length > 20);
  if (bySingle.length > 1) return bySingle;
  const sentences = c.match(/[^.!?]+[.!?]+["']?\s*/g) || [c];
  const paras: string[] = [];
  let current = "", count = 0;
  for (const s of sentences) {
    current += s; count++;
    if (count >= 4) { paras.push(current.trim()); current = ""; count = 0; }
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
    try { return await doc.embedJpg(buffer); } catch { return await doc.embedPng(buffer); }
  } catch (error) {
    console.error("Image embed error:", error);
    return null;
  }
}

// ── CHAPTER IMAGE FETCH ─────────────────────────────────────────────────────
const usedImages = new Set<string>();

async function getChapterImage(chapterTitle: string, chapterIndex: number): Promise<string | null> {
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
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.results?.length > 0) {
      let selected = null;
      for (const photo of data.results) {
        if (photo.width > 2000 && photo.height > 1000 && photo.likes > 20) {
          if (!usedImages.has(photo.id)) { selected = photo; usedImages.add(photo.id); break; }
        }
      }
      if (!selected && data.results[0]) selected = data.results[0];
      return selected?.urls?.regular || null;
    }
    return null;
  } catch { return null; }
}

// ── THEME MAP ───────────────────────────────────────────────────────────────
const THEMES: Record<string, [number, number, number]> = {
  indigo:  [0.30, 0.16, 0.82],
  violet:  [0.50, 0.18, 0.90],
  rose:    [0.88, 0.18, 0.32],
  emerald: [0.05, 0.60, 0.38],
  amber:   [0.86, 0.56, 0.06],
  slate:   [0.22, 0.28, 0.36],
  cyan:    [0.05, 0.60, 0.75],
  orange:  [0.90, 0.40, 0.06],
};

// ── PALETTE BUILDER ─────────────────────────────────────────────────────────
function buildPalette(ar: number, ag: number, ab: number) {
  // Warm cream paper — matches reference workbook
  const paper      = rgb(0.98, 0.96, 0.92);   // warm off-white
  const paperDeep  = rgb(0.94, 0.91, 0.86);   // slightly darker cream for alternating sections
  const paperDark  = rgb(0.18, 0.15, 0.12);   // rich near-black for cover/back
  const ink        = rgb(0.12, 0.10, 0.08);   // warm near-black body text
  const inkMid     = rgb(0.35, 0.32, 0.28);   // medium body
  const inkLight   = rgb(0.55, 0.52, 0.48);   // captions, footers
  const accent     = rgb(ar, ag, ab);
  // Muted tint of accent for backgrounds
  const tint       = rgb(Math.min(1, ar*0.08+0.93), Math.min(1, ag*0.06+0.93), Math.min(1, ab*0.10+0.89));
  const tintMid    = rgb(Math.min(1, ar*0.14+0.86), Math.min(1, ag*0.10+0.88), Math.min(1, ab*0.16+0.82));
  const gold       = rgb(0.72, 0.58, 0.32);   // warm gold — matches cream aesthetic
  const divider    = rgb(0.82, 0.78, 0.72);   // warm grey rule
  return { paper, paperDeep, paperDark, ink, inkMid, inkLight, accent, tint, tintMid, gold, divider };
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const {
      content, title, coverImageUrl,
      theme = "indigo",
      template = "premium",
      includeChapterImages = true,
    } = await req.json();

    // ── Plan check ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userPlan = "free";
    if (user) {
      const { data: planData } = await supabase
        .from("user_plans").select("plan_id")
        .eq("user_id", user.id).eq("status", "active").single();
      if (planData) userPlan = planData.plan_id;
    }
    const isFreePlan = userPlan === "free";
    const shouldAddImages = (userPlan === "starter" || userPlan === "pro") && includeChapterImages === true;
    console.log(`📄 PDF Plan: ${userPlan} | Images: ${shouldAddImages}`);

    // ── Document setup ──
    const doc  = await PDFDocument.create();
    const BOLD = await doc.embedFont(StandardFonts.HelveticaBold);
    const REG  = await doc.embedFont(StandardFonts.Helvetica);
    const ITAL = await doc.embedFont(StandardFonts.HelveticaOblique);

    const W = 595, H = 842;
    const ML = 58, MR = 58, TW = W - ML - MR;
    const FOOTER_Y = 46;

    const [ar, ag, ab] = THEMES[theme] || THEMES.indigo;
    const C = buildPalette(ar, ag, ab);

    // Body typography
    const BODY_SIZE = 11;
    const BODY_LH   = 19;
    const PARA_GAP  = 14;

    let pageNumber = 0;

    // ── Helpers ─────────────────────────────────────────────────────────────

    // Fill entire page with warm paper color
    const fillPage = (page: any, color = C.paper) => {
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color });
    };

    const addWatermark = (page: any) => {
      if (!isFreePlan) return;
      const txt = "GENERATED WITH DIGIFORGE AI";
      const sz  = 22;
      const tw  = BOLD.widthOfTextAtSize(txt, sz);
      page.drawText(txt, {
        x: W / 2 - tw / 2, y: H / 2,
        size: sz, font: BOLD,
        color: rgb(0.6, 0.6, 0.6), opacity: 0.10,
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
      // Warm rule
      page.drawLine({
        start: { x: ML, y: 40 }, end: { x: W - MR, y: 40 },
        thickness: 0.5, color: C.divider,
      });
      if (isFreePlan) {
        page.drawText(`${pageNumber}`, {
          x: W - MR - 12, y: 26, size: 8, font: REG, color: C.inkLight,
        });
      } else {
        page.drawText(section.slice(0, 35), {
          x: ML, y: 26, size: 8, font: REG, color: C.inkLight,
        });
        page.drawText(`${pageNumber}`, {
          x: W - MR - 12, y: 26, size: 8, font: REG, color: C.inkLight,
        });
      }
    };

    // Write a single paragraph — returns { page, y }
    const writeParagraph = async (
      pg0: any, y0: number, text: string,
      font: any, size: number, color: any, lh: number,
      section: string, indent = 0, bgColor = C.paper,
    ): Promise<{ page: any; y: number }> => {
      if (!text || isNaN(y0)) return { page: pg0, y: y0 || H - 100 };
      let page = pg0, y = y0;
      const lines = wrapText(text, font, size, TW - indent);
      for (const line of lines) {
        if (y < FOOTER_Y + lh + 10) {
          drawFooter(page, section);
          ;({ page, y } = addPage(bgColor));
        }
        page.drawText(line, { x: ML + indent, y, size, font, color });
        y -= lh;
      }
      return { page, y };
    };

    // ════════════════════════════════════════════════════════════════════════
    // COVER PAGE — full-bleed photo + dark overlay + large title
    // ════════════════════════════════════════════════════════════════════════
    const coverPage = doc.addPage([W, H]); pageNumber++;
    if (isFreePlan) addWatermark(coverPage);

    // Base: dark warm background
    coverPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.paperDark });

    // Cover image — full bleed
    if (coverImageUrl) {
      const coverImg = await embedImg(doc, coverImageUrl);
      if (coverImg) {
        const { width: iw, height: ih } = coverImg.scale(1);
        const scale = Math.max(W / iw, H / ih);
        coverPage.drawImage(coverImg, {
          x: (W - iw * scale) / 2, y: (H - ih * scale) / 2,
          width: iw * scale, height: ih * scale, opacity: 0.38,
        });
      }
    }

    // Dark gradient overlay for legibility
    coverPage.drawRectangle({ x: 0, y: 0, width: W, height: H * 0.70, color: rgb(0,0,0), opacity: 0.72 });
    coverPage.drawRectangle({ x: 0, y: H * 0.70, width: W, height: H * 0.30, color: rgb(0,0,0), opacity: 0.18 });

    // Top accent line
    coverPage.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: C.accent });

    // Top label
    coverPage.drawText("DIGIFORGE AI", {
      x: ML, y: H - 30, size: 9, font: BOLD, color: C.accent, opacity: 0.85,
    });
    coverPage.drawText("Digital Product Studio", {
      x: W - MR - 130, y: H - 30, size: 8, font: REG, color: rgb(1,1,1), opacity: 0.45,
    });

    // Large title
    const titleClean  = clean(content?.title || title);
    const titleFontSz = titleClean.length > 50 ? 28 : titleClean.length > 35 ? 34 : 40;
    const titleWords  = titleClean.split(" ");
    let tl = "", tLines: string[] = [];
    for (const w of titleWords) {
      const test = tl ? `${tl} ${w}` : w;
      try {
        BOLD.widthOfTextAtSize(test, titleFontSz) <= TW ? (tl = test) : (tLines.push(tl), tl = w);
      } catch { tl = w; }
    }
    if (tl) tLines.push(tl);

    const titleBlockH = tLines.length * (titleFontSz + 10);
    let ty = H / 2 + titleBlockH / 2 + 20;

    // Gold accent bar above title
    coverPage.drawRectangle({ x: ML, y: ty + 16, width: 50, height: 3, color: C.gold });
    for (const line of tLines) {
      coverPage.drawText(line, { x: ML, y: ty, size: titleFontSz, font: BOLD, color: rgb(1,1,1) });
      ty -= titleFontSz + 10;
    }

    // Subtitle
    if (content?.subtitle) {
      ty -= 8;
      for (const l of wrapText(clean(content.subtitle), REG, 12, TW)) {
        coverPage.drawText(l, { x: ML, y: ty, size: 12, font: REG, color: rgb(0.82, 0.80, 0.76) });
        ty -= 18;
      }
    }

    // Bottom badge strip
    coverPage.drawRectangle({ x: 0, y: 0, width: W, height: 56, color: rgb(0,0,0), opacity: 0.75 });
    coverPage.drawRectangle({ x: ML, y: 17, width: 122, height: 22, color: C.accent, opacity: 0.90 });
    coverPage.drawText(`${content?.chapters?.length || 6} CHAPTERS`, {
      x: ML + 14, y: 26, size: 8, font: BOLD, color: rgb(1,1,1),
    });
    coverPage.drawRectangle({ x: ML + 134, y: 17, width: 80, height: 22, color: rgb(1,1,1), opacity: 0.08 });
    coverPage.drawText("FULL GUIDE", { x: ML + 148, y: 26, size: 8, font: BOLD, color: rgb(1,1,1), opacity: 0.65 });
    coverPage.drawText(new Date().getFullYear().toString(), {
      x: W - MR - 30, y: 26, size: 8, font: REG, color: rgb(0.5,0.5,0.5),
    });

    drawFooter(coverPage, "Cover");

    // ════════════════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS — cream bg, large decorative "CONTENTS" heading
    // ════════════════════════════════════════════════════════════════════════
    let { page: tocPage, y: tocY } = addPage(C.paper);

    // Full-page subtle watercolor blob (decorative — simulated with large faint circle)
    tocPage.drawCircle({ x: W * 0.78, y: H * 0.60, size: 160, color: C.tint, opacity: 0.55 });
    tocPage.drawCircle({ x: W * 0.15, y: H * 0.25, size: 100, color: C.tintMid, opacity: 0.40 });

    // Big display heading
    tocPage.drawText("CONTENTS", {
      x: ML, y: H - 68, size: 42, font: BOLD, color: C.ink,
    });
    // Accent underline
    tocPage.drawRectangle({ x: ML, y: H - 80, width: TW, height: 1.5, color: C.divider });

    tocY = H - 114;

    // Column headers
    tocPage.drawText("Section", { x: ML, y: tocY, size: 9, font: BOLD, color: C.accent });
    tocPage.drawText("Page", { x: W - MR - 26, y: tocY, size: 9, font: BOLD, color: C.accent });
    tocY -= 8;
    tocPage.drawRectangle({ x: ML, y: tocY, width: TW, height: 1, color: C.accent, opacity: 0.6 });
    tocY -= 20;

    const tocItems = [
      { title: "Introduction", page: 1 },
      ...(content?.chapters?.map((ch: any, i: number) => ({
        title: ch?.title || `Chapter ${i + 1}`, page: i + 2,
      })) || []),
      { title: "Conclusion", page: (content?.chapters?.length || 0) + 2 },
    ];

    for (let idx = 0; idx < tocItems.length; idx++) {
      const item = tocItems[idx];
      if (tocY < 70) {
        drawFooter(tocPage, "Contents");
        ;({ page: tocPage, y: tocY } = addPage(C.paper));
      }

      const isChapter = idx > 0 && idx < tocItems.length - 1;
      const chNum = isChapter ? idx : null;
      const titleLines2 = wrapText(item.title, isChapter ? BOLD : REG, 11, TW - 60);

      // Alternating subtle row background
      if (idx % 2 === 0) {
        tocPage.drawRectangle({
          x: ML - 6, y: tocY - 6,
          width: TW + 12, height: titleLines2.length * 18 + 10,
          color: C.paperDeep, opacity: 0.7,
        });
      }

      // Chapter number accent
      if (chNum !== null) {
        tocPage.drawText(String(chNum).padStart(2, "0"), {
          x: ML, y: tocY, size: 10, font: BOLD, color: C.accent,
        });
      }

      const textX = chNum !== null ? ML + 32 : ML + 8;
      for (let j = 0; j < titleLines2.length; j++) {
        tocPage.drawText(titleLines2[j], {
          x: textX, y: tocY - j * 18, size: 11,
          font: isChapter ? BOLD : REG, color: C.ink,
        });
      }
      // Dotted leader + page number
      const pageNumStr = String(item.page);
      tocPage.drawText(pageNumStr, {
        x: W - MR - 22, y: tocY, size: 11, font: BOLD, color: C.accent,
      });

      tocY -= titleLines2.length * 18 + 16;
    }

    drawFooter(tocPage, "Contents");

    // ════════════════════════════════════════════════════════════════════════
    // INTRODUCTION — warm tint accent band, readable body
    // ════════════════════════════════════════════════════════════════════════
    let { page: introPage, y: introY } = addPage(C.paper);

    // Decorative background blob
    introPage.drawCircle({ x: W * 0.85, y: H * 0.15, size: 120, color: C.tint, opacity: 0.50 });

    // Section label + large title
    introPage.drawText("INTRODUCTION", {
      x: ML, y: H - 50, size: 9, font: BOLD, color: C.accent,
    });
    introPage.drawText("Getting Started", {
      x: ML, y: H - 80, size: 26, font: BOLD, color: C.ink,
    });
    // Gold underline accent
    introPage.drawRectangle({ x: ML, y: H - 90, width: 60, height: 3, color: C.gold });

    introY = H - 128;

    const introParagraphs = splitParagraphs(content?.introduction || "");
    for (let i = 0; i < introParagraphs.length; i++) {
      if (introY < FOOTER_Y + 30) {
        drawFooter(introPage, "Introduction");
        ;({ page: introPage, y: introY } = addPage(C.paper));
      }
      // First paragraph slightly larger
      const sz = i === 0 ? 12.5 : BODY_SIZE;
      const lh = i === 0 ? 21 : BODY_LH;
      const col = i === 0 ? C.ink : C.inkMid;
      const result = await writeParagraph(introPage, introY, introParagraphs[i], REG, sz, col, lh, "Introduction", 0, C.paper);
      introPage = result.page;
      introY = result.y - PARA_GAP;
    }

    drawFooter(introPage, "Introduction");

    // ════════════════════════════════════════════════════════════════════════
    // CHAPTERS — each chapter has its own visual style
    // ════════════════════════════════════════════════════════════════════════
    for (let i = 0; i < (content?.chapters?.length || 0); i++) {
      const chapter = content.chapters[i];
      const chapterTitle = clean(chapter?.title || `Chapter ${i + 1}`);
      const chNum = String(i + 1).padStart(2, "0");

      // Chapter image (paid plans)
      let chapterImageEmbed: any = null;
      if (shouldAddImages) {
        const imgUrl = await getChapterImage(chapterTitle, i);
        if (imgUrl) chapterImageEmbed = await embedImg(doc, imgUrl);
      }

      // ── Chapter opener page ──────────────────────────────────────────────
      // Alternate between paper and paperDeep for variety
      const chBg = i % 2 === 0 ? C.paper : C.paperDeep;
      let { page: chPage, y: chY } = addPage(chBg);

      // Decorative large chapter number — watermark style
      const bigNumW = BOLD.widthOfTextAtSize(chNum, 120);
      chPage.drawText(chNum, {
        x: W - MR - bigNumW + 10, y: H - 160, size: 120, font: BOLD,
        color: C.accent, opacity: 0.10,
      });

      // Small "MODULE N" label top-left
      chPage.drawText(`CHAPTER ${i + 1}`, {
        x: ML, y: H - 52, size: 9, font: BOLD, color: C.accent,
      });

      // Chapter title — large and bold
      const chTitleLines = wrapText(chapterTitle, BOLD, 24, TW - 40);
      let ctY = H - 82;
      for (const line of chTitleLines) {
        chPage.drawText(line, { x: ML, y: ctY, size: 24, font: BOLD, color: C.ink });
        ctY -= 32;
      }
      // Gold accent bar under title
      chPage.drawRectangle({ x: ML, y: ctY + 10, width: 55, height: 3, color: C.gold });

      chY = ctY - 8;

      // Chapter image (full width, proportional height) — only on paid plans
      if (chapterImageEmbed) {
        try {
          const imgW = TW;
          const { width: iw, height: ih } = chapterImageEmbed.scale(1);
          const imgH = Math.min(190, (ih / iw) * imgW);
          if (chY - imgH - 16 > FOOTER_Y + 80) {
            chY -= 12;
            // Rounded-look: draw warm border frame behind image
            chPage.drawRectangle({ x: ML - 2, y: chY - imgH - 2, width: imgW + 4, height: imgH + 4, color: C.divider });
            chPage.drawImage(chapterImageEmbed, { x: ML, y: chY - imgH, width: imgW, height: imgH });
            chY -= imgH + 20;
          }
        } catch (err) {
          console.error("Chapter image draw error:", err);
        }
      }

      // ── Chapter body paragraphs ──────────────────────────────────────────
      const contentParas = splitParagraphs(chapter?.content || "");

      for (let p = 0; p < contentParas.length; p++) {
        const para = contentParas[p];
        if (!para || para.length < 15) continue;

        if (chY < FOOTER_Y + 40) {
          drawFooter(chPage, chapterTitle);
          ;({ page: chPage, y: chY } = addPage(chBg));
        }

        // Pull quote on every 4th paragraph (not first)
        if (p > 0 && p % 4 === 0 && para.length > 100) {
          const firstSent = (para.match(/[^.!?]+[.!?]+/) || [""])[0].trim();
          if (firstSent.length > 60) {
            const qLines = wrapText(firstSent, ITAL, 13, TW - 48).filter(Boolean);
            const qH = qLines.length * 22 + 36;
            if (chY - qH > FOOTER_Y + 30) {
              chY -= 12;
              // Warm tinted pull-quote box
              chPage.drawRectangle({ x: ML, y: chY - qH, width: TW, height: qH, color: C.tint });
              chPage.drawRectangle({ x: ML, y: chY - qH, width: 4, height: qH, color: C.accent });
              // Decorative open-quote mark
              chPage.drawText("\u201C", {
                x: ML + 14, y: chY - 6, size: 24, font: BOLD, color: C.accent, opacity: 0.60,
              });
              let qy = chY - 16;
              for (const ql of qLines) {
                chPage.drawText(ql, { x: ML + 32, y: qy, size: 13, font: ITAL, color: C.inkMid });
                qy -= 22;
              }
              chY -= qH + 16;
              continue;
            }
          }
        }

        // Body text — first para larger/bolder lead
        const isLead = p === 0;
        const sz = isLead ? 12.5 : BODY_SIZE;
        const lh = isLead ? 21  : BODY_LH;
        const col = isLead ? C.ink : C.inkMid;
        const result = await writeParagraph(chPage, chY, para, isLead ? BOLD : REG, sz, col, lh, chapterTitle, 0, chBg);
        chPage = result.page;
        chY = result.y - PARA_GAP;
      }

      // ── Key Takeaways box ────────────────────────────────────────────────
      if (chapter?.tips?.length > 0) {
        const validTips = chapter.tips.filter((t: string) => t && t.length > 10);
        if (validTips.length > 0) {
          // Calculate box height
          let boxH = 48;
          for (const tip of validTips.slice(0, 5)) {
            boxH += wrapText(tip, REG, 10, TW - 52).length * 17 + 8;
          }
          boxH += 10;

          if (chY - boxH < FOOTER_Y + 20) {
            drawFooter(chPage, chapterTitle);
            ;({ page: chPage, y: chY } = addPage(chBg));
          }

          chY -= 18;

          // Box background — slightly deeper tint
          chPage.drawRectangle({ x: ML, y: chY - boxH, width: TW, height: boxH, color: C.tintMid });
          // Left accent bar
          chPage.drawRectangle({ x: ML, y: chY - boxH, width: 4, height: boxH, color: C.accent });
          // Header row
          chPage.drawRectangle({ x: ML, y: chY - 28, width: TW, height: 28, color: C.accent, opacity: 0.10 });
          chPage.drawText("KEY TAKEAWAYS", {
            x: ML + 16, y: chY - 18, size: 8.5, font: BOLD, color: C.accent,
          });

          let tipY = chY - 44;
          for (const tip of validTips.slice(0, 5)) {
            const tipLines = wrapText(tip, REG, 10, TW - 52);
            if (tipY < chY - boxH + 8) break;
            // Dot bullet — accent color
            chPage.drawCircle({ x: ML + 18, y: tipY + 4, size: 3, color: C.accent });
            for (const tl of tipLines) {
              if (tipY < chY - boxH + 6) break;
              chPage.drawText(tl, { x: ML + 30, y: tipY, size: 10, font: REG, color: C.ink });
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
    // CONCLUSION — deeper accent band, warm body
    // ════════════════════════════════════════════════════════════════════════
    let { page: concPage, y: concY } = addPage(C.paper);

    // Decorative blobs
    concPage.drawCircle({ x: W * 0.80, y: H * 0.80, size: 130, color: C.tint, opacity: 0.50 });

    concPage.drawText("CONCLUSION", {
      x: ML, y: H - 50, size: 9, font: BOLD, color: C.accent,
    });
    concPage.drawText("Your Journey Forward", {
      x: ML, y: H - 80, size: 26, font: BOLD, color: C.ink,
    });
    concPage.drawRectangle({ x: ML, y: H - 90, width: 60, height: 3, color: C.gold });

    concY = H - 128;

    const concParas = splitParagraphs(content?.conclusion || "");
    for (const para of concParas) {
      if (concY < FOOTER_Y + 40) {
        drawFooter(concPage, "Conclusion");
        ;({ page: concPage, y: concY } = addPage(C.paper));
      }
      const result = await writeParagraph(concPage, concY, para, REG, BODY_SIZE, C.inkMid, BODY_LH, "Conclusion", 0, C.paper);
      concPage = result.page;
      concY = result.y - PARA_GAP;
    }

    // Call to action box
    if (content?.callToAction && concY > FOOTER_Y + 100) {
      concY -= 24;
      const ctaLines = wrapText(content.callToAction, BOLD, 12, TW - 48);
      const ctaH = ctaLines.length * 22 + 54;
      // Solid accent CTA block
      concPage.drawRectangle({ x: ML, y: concY - ctaH, width: TW, height: ctaH, color: C.accent });
      concPage.drawRectangle({ x: ML, y: concY - 28, width: TW, height: 28, color: rgb(0,0,0), opacity: 0.12 });
      concPage.drawText("NEXT STEPS", {
        x: ML + 20, y: concY - 19, size: 8.5, font: BOLD, color: C.gold,
      });
      let ctaY = concY - 44;
      for (const cl of ctaLines) {
        concPage.drawText(cl, { x: ML + 20, y: ctaY, size: 12, font: BOLD, color: rgb(1,1,1) });
        ctaY -= 22;
      }
    }

    drawFooter(concPage, "Conclusion");

    // ════════════════════════════════════════════════════════════════════════
    // BACK COVER — dark rich background, quote
    // ════════════════════════════════════════════════════════════════════════
    const backPage = doc.addPage([W, H]);
    backPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.paperDark });

    // Decorative faint circles
    backPage.drawCircle({ x: W * 0.20, y: H * 0.65, size: 200, color: C.accent, opacity: 0.05 });
    backPage.drawCircle({ x: W * 0.80, y: H * 0.35, size: 160, color: rgb(1,1,1), opacity: 0.03 });

    // Top + bottom accent bars
    backPage.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: C.accent });
    backPage.drawRectangle({ x: 0, y: 0,     width: W, height: 4, color: C.accent });

    // Large decorative quote mark
    backPage.drawText("\u201C", {
      x: ML - 8, y: H / 2 + 120, size: 110, font: BOLD, color: C.accent, opacity: 0.12,
    });

    const quoteText = "The best investment you can make is in yourself. Knowledge is the currency that never devalues.";
    const qLines = wrapText(quoteText, ITAL, 14, TW - 30).filter(Boolean);
    let qy = H / 2 + 60;
    for (const l of qLines) {
      backPage.drawText(l, { x: ML + 28, y: qy, size: 14, font: ITAL, color: rgb(0.78, 0.76, 0.70) });
      qy -= 24;
    }

    // Gold rule + branding
    backPage.drawRectangle({ x: ML + 28, y: qy - 12, width: 48, height: 2, color: C.gold });

    if (isFreePlan) {
      backPage.drawText("DigiForge AI", { x: ML + 28, y: qy - 40, size: 12, font: BOLD, color: rgb(1,1,1) });
      backPage.drawText("AI Digital Product Studio", { x: ML + 28, y: qy - 58, size: 8.5, font: REG, color: rgb(0.55, 0.52, 0.48) });
      backPage.drawText("digiforgeai.app", { x: ML + 28, y: qy - 74, size: 8.5, font: REG, color: C.accent, opacity: 0.70 });
    } else {
      backPage.drawText("DigiForge AI", { x: ML + 28, y: qy - 40, size: 11, font: BOLD, color: rgb(0.75, 0.73, 0.68) });
      backPage.drawText("digiforgeai.app", { x: ML + 28, y: qy - 56, size: 8.5, font: REG, color: C.accent, opacity: 0.60 });
    }

    // ── Export ──────────────────────────────────────────────────────────────
    const pdfBytes = await doc.save();
    console.log("✅ Premium PDF generated, size:", pdfBytes.length);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${clean(title).replace(/\s+/g, "-")}.pdf"`,
      },
    });

  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}