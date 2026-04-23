// app/api/pdf/route.ts - FIXED chapter titles and removed underline
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
    .replace(/\s+/g, " ")
    .trim();

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
      const width = font.widthOfTextAtSize(test, size);
      if (width <= maxW) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    } catch {
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

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

export async function POST(req: Request) {
  try {
    const {
      content,
      title,
      coverImageUrl,
      theme = "indigo",
      template = "premium",
    } = await req.json();

    console.log("📄 Premium PDF generation started for:", title);

    const doc = await PDFDocument.create();
    const BOLD = await doc.embedFont(StandardFonts.HelveticaBold);
    const REG = await doc.embedFont(StandardFonts.Helvetica);
    const ITAL = await doc.embedFont(StandardFonts.HelveticaOblique);

    const PAGE_W = 595;
    const PAGE_H = 842;
    const LEFT_MARGIN = 56;
    const RIGHT_MARGIN = 56;
    const TEXT_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN;
    const FOOTER_Y = 48;

    const [ar, ag, ab] = THEMES[theme] || THEMES.indigo;
    const ACCENT = rgb(ar, ag, ab);
    const DARK = rgb(0.08, 0.08, 0.12);
    const GRAY_LIGHT = rgb(0.96, 0.96, 0.97);
    const GRAY_MID = rgb(0.5, 0.5, 0.55);
    const PAPER = rgb(0.99, 0.98, 0.95);

    let pageNumber = 0;

    const addPage = () => {
      pageNumber++;
      const newPage = doc.addPage([PAGE_W, PAGE_H]);
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_W,
        height: PAGE_H,
        color: PAPER,
      });
      return { page: newPage, y: PAGE_H - 70 };
    };

    const drawFooter = (page: any, section: string) => {
      page.drawLine({
        start: { x: LEFT_MARGIN, y: 42 },
        end: { x: PAGE_W - RIGHT_MARGIN, y: 42 },
        thickness: 0.3,
        color: rgb(0.85, 0.85, 0.88),
      });
      page.drawText(section.slice(0, 35), {
        x: LEFT_MARGIN,
        y: 28,
        size: 8,
        font: REG,
        color: GRAY_MID,
      });
      page.drawText(`${pageNumber}`, {
        x: PAGE_W - RIGHT_MARGIN - 12,
        y: 28,
        size: 8,
        font: REG,
        color: GRAY_MID,
      });
    };

    const writeParagraph = async (
      pageObj: any,
      yPos: number,
      text: string,
      font: any,
      size: number,
      color: any,
      lineHeight: number,
      section: string,
      indent = 0,
    ): Promise<{ page: any; y: number }> => {
      if (!text || yPos === undefined || isNaN(yPos)) {
        return { page: pageObj, y: yPos || PAGE_H - 100 };
      }

      let currentPage = pageObj;
      let currentY = yPos;
      const lines = wrapText(text, font, size, TEXT_WIDTH - indent);

      for (const line of lines) {
        if (currentY < FOOTER_Y + lineHeight + 10) {
          drawFooter(currentPage, section);
          const newPage = addPage();
          currentPage = newPage.page;
          currentY = newPage.y;
        }

        if (isNaN(currentY)) currentY = PAGE_H - 100;

        currentPage.drawText(line, {
          x: LEFT_MARGIN + indent,
          y: currentY,
          size: size,
          font: font,
          color: color,
        });
        currentY -= lineHeight;
      }
      return { page: currentPage, y: currentY };
    };

    // ========== COVER PAGE ==========
    const coverPage = doc.addPage([PAGE_W, PAGE_H]);
    pageNumber++;

    let coverImg = null;
    if (coverImageUrl) {
      coverImg = await embedImg(doc, coverImageUrl);
    }

    if (coverImg) {
      const { width: iw, height: ih } = coverImg.scale(1);
      const scale = Math.max(PAGE_W / iw, PAGE_H / ih);
      coverPage.drawImage(coverImg, {
        x: (PAGE_W - iw * scale) / 2,
        y: (PAGE_H - ih * scale) / 2,
        width: iw * scale,
        height: ih * scale,
        opacity: 0.4,
      });
    }

    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      color: DARK,
      opacity: 0.65,
    });
    coverPage.drawRectangle({
      x: 0,
      y: PAGE_H - 4,
      width: PAGE_W,
      height: 4,
      color: ACCENT,
    });
    coverPage.drawText("DIGIFORGE", {
      x: LEFT_MARGIN,
      y: PAGE_H - 35,
      size: 9,
      font: BOLD,
      color: ACCENT,
    });

    const titleClean = clean(content?.title || title);
    const titleWords = titleClean.split(" ");
    let titleLine = "";
    const titleLines: string[] = [];
    const titleFontSize =
      titleClean.length > 50 ? 28 : titleClean.length > 35 ? 34 : 40;

    for (const w of titleWords) {
      const test = titleLine ? `${titleLine} ${w}` : w;
      try {
        if (BOLD.widthOfTextAtSize(test, titleFontSize) <= TEXT_WIDTH) {
          titleLine = test;
        } else {
          if (titleLine) titleLines.push(titleLine);
          titleLine = w;
        }
      } catch {
        titleLine = w;
      }
    }
    if (titleLine) titleLines.push(titleLine);

    const titleBlockHeight = titleLines.length * (titleFontSize + 8);
    let titleY = PAGE_H / 2 + titleBlockHeight / 2 + 30;

    for (const line of titleLines) {
      coverPage.drawText(line, {
        x: LEFT_MARGIN,
        y: titleY,
        size: titleFontSize,
        font: BOLD,
        color: rgb(1, 1, 1),
      });
      titleY -= titleFontSize + 8;
    }

    if (content?.subtitle) {
      const subLines = wrapText(clean(content.subtitle), REG, 12, TEXT_WIDTH);
      let subY = titleY - 25;
      for (const line of subLines) {
        coverPage.drawText(line, {
          x: LEFT_MARGIN,
          y: subY,
          size: 12,
          font: REG,
          color: rgb(0.8, 0.8, 0.85),
        });
        subY -= 18;
      }
    }

    coverPage.drawRectangle({
      x: 0,
      y: 80,
      width: PAGE_W,
      height: 80,
      color: ACCENT,
      opacity: 0.1,
    });
    coverPage.drawText(
      `${content?.chapters?.length || 6} CHAPTER COMPLETE GUIDE`,
      {
        x: LEFT_MARGIN,
        y: 50,
        size: 9,
        font: BOLD,
        color: ACCENT,
      },
    );
    coverPage.drawText(new Date().getFullYear().toString(), {
      x: PAGE_W - RIGHT_MARGIN - 30,
      y: 50,
      size: 9,
      font: REG,
      color: GRAY_MID,
    });

    drawFooter(coverPage, "Cover");

    // ========== TABLE OF CONTENTS ==========
    let { page: tocPage, y: tocY } = addPage();

    tocPage.drawRectangle({
      x: 0,
      y: PAGE_H - 80,
      width: PAGE_W,
      height: 80,
      color: ACCENT,
      opacity: 0.05,
    });
    tocPage.drawText("CONTENTS", {
      x: LEFT_MARGIN,
      y: PAGE_H - 42,
      size: 24,
      font: BOLD,
      color: DARK,
    });
    tocPage.drawText("What's inside this guide", {
      x: LEFT_MARGIN,
      y: PAGE_H - 65,
      size: 10,
      font: REG,
      color: GRAY_MID,
    });
    tocPage.drawRectangle({
      x: LEFT_MARGIN,
      y: PAGE_H - 75,
      width: 50,
      height: 3,
      color: ACCENT,
    });

    tocY = PAGE_H - 115;

    tocPage.drawText("Section", {
      x: LEFT_MARGIN,
      y: tocY,
      size: 9,
      font: BOLD,
      color: ACCENT,
    });
    tocPage.drawText("Page", {
      x: PAGE_W - RIGHT_MARGIN - 25,
      y: tocY,
      size: 9,
      font: BOLD,
      color: ACCENT,
    });
    tocY -= 20;
    
    tocPage.drawLine({
      start: { x: LEFT_MARGIN, y: tocY + 8 },
      end: { x: PAGE_W - RIGHT_MARGIN, y: tocY + 8 },
      thickness: 0.5,
      color: ACCENT,
      opacity: 0.5,
    });
    tocY -= 15;

    const tocItems = [
      { title: "Introduction", page: 1 },
      ...(content?.chapters?.map((ch: any, i: number) => ({
        title: ch?.title || `Chapter ${i + 1}`,
        page: i + 2,
      })) || []),
      { title: "Conclusion", page: (content?.chapters?.length || 0) + 2 },
    ];

    for (const item of tocItems) {
      if (tocY < 60) {
        drawFooter(tocPage, "Contents");
        const newPage = addPage();
        tocPage = newPage.page;
        tocY = newPage.y;
      }

      const titleLines = wrapText(item.title, REG, 10, TEXT_WIDTH - 50);
      
      for (let j = 0; j < titleLines.length; j++) {
        const line = titleLines[j];
        tocPage.drawText(line, {
          x: LEFT_MARGIN,
          y: tocY,
          size: 10,
          font: REG,
          color: DARK,
        });
        
        if (j === 0) {
          tocPage.drawText(`${item.page}`, {
            x: PAGE_W - RIGHT_MARGIN - 20,
            y: tocY,
            size: 10,
            font: REG,
            color: ACCENT,
          });
        }
        tocY -= 18;
      }
      tocY -= 4;
    }

    drawFooter(tocPage, "Contents");

    // ========== INTRODUCTION ==========
    let { page: introPage, y: introY } = addPage();

    introPage.drawRectangle({
      x: 0,
      y: PAGE_H - 80,
      width: PAGE_W,
      height: 80,
      color: ACCENT,
      opacity: 0.05,
    });
    introPage.drawText("INTRODUCTION", {
      x: LEFT_MARGIN,
      y: PAGE_H - 42,
      size: 10,
      font: BOLD,
      color: ACCENT,
    });
    introPage.drawText("Getting Started", {
      x: LEFT_MARGIN,
      y: PAGE_H - 65,
      size: 22,
      font: BOLD,
      color: DARK,
    });
    introPage.drawRectangle({
      x: LEFT_MARGIN,
      y: PAGE_H - 75,
      width: 50,
      height: 3,
      color: ACCENT,
    });

    introY = PAGE_H - 125;

    const introParagraphs = splitParagraphs(content?.introduction || "");
    for (const para of introParagraphs) {
      if (introY < FOOTER_Y + 30) {
        drawFooter(introPage, "Introduction");
        const newPage = addPage();
        introPage = newPage.page;
        introY = newPage.y;
      }
      const result = await writeParagraph(
        introPage,
        introY,
        para,
        REG,
        11,
        DARK,
        18,
        "Introduction",
      );
      introPage = result.page;
      introY = result.y - 12;
    }

    drawFooter(introPage, "Introduction");

    // ========== CHAPTERS - FIXED: no word breaking, no underline ==========
    for (let i = 0; i < (content?.chapters?.length || 0); i++) {
      const chapter = content.chapters[i];
      const chapterTitle = clean(chapter?.title || `Chapter ${i + 1}`);
      const chapterNumber = (i + 1).toString().padStart(2, "0");

      let { page: chPage, y: chY } = addPage();

      // Chapter header background
      chPage.drawRectangle({
        x: 0,
        y: PAGE_H - 100,
        width: PAGE_W,
        height: 100,
        color: ACCENT,
        opacity: 0.04,
      });

      // Large chapter number
      chPage.drawText(chapterNumber, {
        x: LEFT_MARGIN,
        y: PAGE_H - 55,
        size: 48,
        font: BOLD,
        color: ACCENT,
        opacity: 0.25,
      });

      // Chapter title - FIXED: wider width to prevent breaking
      // Increased TEXT_WIDTH - 100 to TEXT_WIDTH - 80 for more space
      const chTitleLines = wrapText(chapterTitle, BOLD, 20, TEXT_WIDTH - 80);
      let chTitleY = PAGE_H - 58;
      for (const line of chTitleLines) {
        chPage.drawText(line, {
          x: LEFT_MARGIN + 55,
          y: chTitleY,
          size: 20,
          font: BOLD,
          color: DARK,
        });
        chTitleY -= 28;
      }

      // NO underline - removed completely

      chY = PAGE_H - 140;

      // Chapter content
      const contentParagraphs = splitParagraphs(chapter?.content || "");

      for (let p = 0; p < contentParagraphs.length; p++) {
        const para = contentParagraphs[p];
        if (!para || para.length < 15) continue;

        if (chY < FOOTER_Y + 40) {
          drawFooter(chPage, chapterTitle);
          const newPage = addPage();
          chPage = newPage.page;
          chY = newPage.y;
        }

        if (p === 0) {
          const result = await writeParagraph(
            chPage,
            chY,
            para,
            REG,
            12,
            GRAY_MID,
            19,
            chapterTitle,
          );
          chPage = result.page;
          chY = result.y - 8;
        } else {
          const result = await writeParagraph(
            chPage,
            chY,
            para,
            REG,
            11,
            DARK,
            18,
            chapterTitle,
          );
          chPage = result.page;
          chY = result.y - 10;
        }
      }

      // Key Takeaways box
      if (chapter?.tips && chapter.tips.length > 0) {
        const validTips = chapter.tips.filter(
          (t: string) => t && t.length > 10,
        );
        if (validTips.length > 0) {
          const boxHeight = 55 + validTips.length * 22;

          if (chY - boxHeight < FOOTER_Y + 20) {
            drawFooter(chPage, chapterTitle);
            const newPage = addPage();
            chPage = newPage.page;
            chY = newPage.y;
          }

          chY -= 25;

          chPage.drawRectangle({
            x: LEFT_MARGIN,
            y: chY - boxHeight,
            width: TEXT_WIDTH,
            height: boxHeight,
            color: GRAY_LIGHT,
          });
          chPage.drawRectangle({
            x: LEFT_MARGIN,
            y: chY - boxHeight,
            width: 4,
            height: boxHeight,
            color: ACCENT,
          });

          chPage.drawText("KEY TAKEAWAYS", {
            x: LEFT_MARGIN + 20,
            y: chY - 24,
            size: 9,
            font: BOLD,
            color: ACCENT,
          });

          let tipY = chY - 45;
          for (const tip of validTips.slice(0, 4)) {
            const tipLines = wrapText(tip, REG, 10, TEXT_WIDTH - 60);
            chPage.drawText("•", {
              x: LEFT_MARGIN + 20,
              y: tipY - 2,
              size: 11,
              font: BOLD,
              color: ACCENT,
            });
            for (const line of tipLines) {
              chPage.drawText(line, {
                x: LEFT_MARGIN + 34,
                y: tipY,
                size: 10,
                font: REG,
                color: DARK,
              });
              tipY -= 16;
            }
            tipY -= 6;
          }
          chY -= boxHeight + 20;
        }
      }

      drawFooter(chPage, chapterTitle);
    }

    // ========== CONCLUSION ==========
    let { page: concPage, y: concY } = addPage();

    concPage.drawRectangle({
      x: 0,
      y: PAGE_H - 80,
      width: PAGE_W,
      height: 80,
      color: ACCENT,
      opacity: 0.05,
    });
    concPage.drawText("CONCLUSION", {
      x: LEFT_MARGIN,
      y: PAGE_H - 42,
      size: 10,
      font: BOLD,
      color: ACCENT,
    });
    concPage.drawText("Your Journey Forward", {
      x: LEFT_MARGIN,
      y: PAGE_H - 65,
      size: 22,
      font: BOLD,
      color: DARK,
    });
    concPage.drawRectangle({
      x: LEFT_MARGIN,
      y: PAGE_H - 75,
      width: 50,
      height: 3,
      color: ACCENT,
    });

    concY = PAGE_H - 125;

    const conclusionParagraphs = splitParagraphs(content?.conclusion || "");
    for (const para of conclusionParagraphs) {
      if (concY < FOOTER_Y + 40) {
        drawFooter(concPage, "Conclusion");
        const newPage = addPage();
        concPage = newPage.page;
        concY = newPage.y;
      }
      const result = await writeParagraph(
        concPage,
        concY,
        para,
        REG,
        11,
        DARK,
        18,
        "Conclusion",
      );
      concPage = result.page;
      concY = result.y - 10;
    }

    if (content?.callToAction && concY > FOOTER_Y + 100) {
      concY -= 30;
      const ctaLines = wrapText(
        content.callToAction,
        BOLD,
        12,
        TEXT_WIDTH - 60,
      );
      const ctaHeight = ctaLines.length * 22 + 50;

      concPage.drawRectangle({
        x: LEFT_MARGIN,
        y: concY - ctaHeight,
        width: TEXT_WIDTH,
        height: ctaHeight,
        color: ACCENT,
        opacity: 0.06,
      });
      concPage.drawRectangle({
        x: LEFT_MARGIN,
        y: concY - 30,
        width: 60,
        height: 3,
        color: ACCENT,
      });
      concPage.drawText("NEXT STEPS", {
        x: LEFT_MARGIN + 20,
        y: concY - 22,
        size: 9,
        font: BOLD,
        color: ACCENT,
      });

      let ctaY = concY - 44;
      for (const line of ctaLines) {
        concPage.drawText(line, {
          x: LEFT_MARGIN + 20,
          y: ctaY,
          size: 12,
          font: BOLD,
          color: DARK,
        });
        ctaY -= 22;
      }
    }

    drawFooter(concPage, "Conclusion");

    // ========== BACK COVER ==========
    const backPage = doc.addPage([PAGE_W, PAGE_H]);

    backPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      color: DARK,
    });
    backPage.drawRectangle({
      x: 0,
      y: PAGE_H - 4,
      width: PAGE_W,
      height: 4,
      color: ACCENT,
    });
    backPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: 4,
      color: ACCENT,
    });

    const quoteLines = wrapText(
      "The best investment you can make is in yourself. Knowledge is the currency that never devalues.",
      ITAL,
      13,
      TEXT_WIDTH - 40,
    );

    let quoteY = PAGE_H / 2 + 40;
    backPage.drawText('"', {
      x: LEFT_MARGIN,
      y: quoteY + 20,
      size: 52,
      font: BOLD,
      color: ACCENT,
      opacity: 0.3,
    });

    for (const line of quoteLines) {
      backPage.drawText(line, {
        x: LEFT_MARGIN + 25,
        y: quoteY,
        size: 13,
        font: ITAL,
        color: rgb(0.7, 0.7, 0.75),
      });
      quoteY -= 22;
    }

    backPage.drawRectangle({
      x: LEFT_MARGIN + 25,
      y: quoteY - 20,
      width: 40,
      height: 2,
      color: ACCENT,
    });

    backPage.drawText("DigiForge AI", {
      x: LEFT_MARGIN + 25,
      y: quoteY - 48,
      size: 10,
      font: BOLD,
      color: rgb(1, 1, 1),
    });
    backPage.drawText("Premium Digital Products", {
      x: LEFT_MARGIN + 25,
      y: quoteY - 64,
      size: 8,
      font: REG,
      color: GRAY_MID,
    });

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
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}