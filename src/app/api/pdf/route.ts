import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// ── CLEAN TEXT ──────────────────────────────────────────
const clean = (t: string) =>
  (t || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#+\s?/g, '')
    .replace(/\t/g, ' ').replace(/\r/g, '')
    .replace(/\u00A0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\x00-\x7F]/g, (c: string) => ({
      '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
      '\u2013': '-', '\u2014': '--', '\u2026': '...', '\u2022': '-',
      '\u00B7': '-', '\u00E9': 'e', '\u00E8': 'e', '\u00EA': 'e',
      '\u00E0': 'a', '\u00E2': 'a', '\u00F4': 'o', '\u00FB': 'u',
      '\u00FC': 'u', '\u00E7': 'c', '\u00EE': 'i', '\u00EF': 'i',
      '\u00F1': 'n', '\u00E1': 'a', '\u00ED': 'i', '\u00F3': 'o',
      '\u00FA': 'u',
    } as Record<string, string>)[c] || '')
    .replace(/\s+/g, ' ').trim()

// ── WRAP TEXT INTO LINES ─────────────────────────────────
function wrapLines(text: string, font: any, size: number, maxW: number): string[] {
  const out: string[] = []
  const paragraphs = clean(text).split('\n')
  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) { out.push(''); continue }
    const words = trimmed.split(' ').filter(Boolean)
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      try {
        if (font.widthOfTextAtSize(test, size) <= maxW) { line = test }
        else { if (line) out.push(line); line = w }
      } catch { line = w }
    }
    if (line) out.push(line)
  }
  return out
}

function splitParagraphs(text: string): string[] {
  const cleaned = clean(text)
  
  // First try splitting on newlines
  const byNewline = cleaned.split(/\n+/).map(p => p.trim()).filter(p => p.length > 15)
  if (byNewline.length > 1) return byNewline

  // No newlines — split on sentence groups (every ~3 sentences = 1 paragraph)
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned]
  const paras: string[] = []
  let current = ''
  let count = 0
  for (const s of sentences) {
    current += s.trim() + ' '
    count++
    if (count >= 3) {
      paras.push(current.trim())
      current = ''
      count = 0
    }
  }
  if (current.trim()) paras.push(current.trim())
  return paras.filter(p => p.length > 15)
}

// ── SAFE IMAGE EMBED ─────────────────────────────────────
async function safeEmbed(doc: PDFDocument, url: string) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const jpg = await doc.embedJpg(buf).catch(() => null)
    if (jpg) return jpg
    return await doc.embedPng(buf).catch(() => null)
  } catch { return null }
}

// ── FETCH UNSPLASH IMAGE ─────────────────────────────────
async function fetchUnsplashImage(query: string): Promise<string | null> {
  try {
    const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    if (!key) return null
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    return data?.results?.[0]?.urls?.regular || null
  } catch { return null }
}

export async function POST(req: Request) {
  const { content, title, coverImageUrl } = await req.json()

  const doc  = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg  = await doc.embedFont(StandardFonts.Helvetica)
  const ital = await doc.embedFont(StandardFonts.HelveticaOblique)

  // Page dimensions
  const W = 595, H = 842
  const ML = 68, MR = 68          // wider margins = more readable
  const TW = W - ML - MR          // text width = 459
  const BOTTOM = 65               // footer clearance

  // Typography scale
  const T = {
    body:        { size: 11, lh: 19 },   // main body text
    bodyLead:    { size: 12, lh: 21 },   // first paragraph of section
    caption:     { size: 9,  lh: 14 },
    label:       { size: 8,  lh: 12 },
    chTitle:     { size: 20, lh: 28 },   // chapter heading on page
    sectionHead: { size: 13, lh: 20 },   // section labels
    tip:         { size: 10, lh: 16 },
    toc:         { size: 11, lh: 18 },
    introTitle:  { size: 16, lh: 24 },
    coverTitle:  { size: 30, lh: 40 },
    coverSub:    { size: 12, lh: 18 },
  }

  // Paragraph spacing (after each paragraph block)
  const PARA_GAP = 14

  // Color palette
  const C = {
    ink:    rgb(0.10, 0.10, 0.13),   // near-black body text
    body:   rgb(0.22, 0.22, 0.26),   // slightly lighter body
    muted:  rgb(0.48, 0.48, 0.52),   // metadata, captions
    faint:  rgb(0.68, 0.68, 0.72),   // very light labels
    accent: rgb(0.30, 0.16, 0.82),   // indigo brand
    a2:     rgb(0.18, 0.10, 0.68),   // darker indigo
    white:  rgb(1, 1, 1),
    tint:   rgb(0.96, 0.94, 1.00),   // soft indigo tint
    tint2:  rgb(0.92, 0.89, 0.98),   // slightly deeper tint
    dark:   rgb(0.05, 0.04, 0.14),   // near-black bg
    gold:   rgb(0.94, 0.74, 0.18),
    line:   rgb(0.88, 0.86, 0.94),   // divider lines
    rule:   rgb(0.92, 0.91, 0.95),   // light rule
  }

  let pg = 0
  const addPage = () => {
    pg++
    return { page: doc.addPage([W, H]), y: H - 60 }
  }

  const drawFooter = (page: any, label: string) => {
    page.drawLine({
      start: { x: ML, y: 46 },
      end: { x: W - MR, y: 46 },
      thickness: 0.5,
      color: C.rule,
    })
    page.drawText('DigiForgeAI', { x: ML, y: 30, size: 7.5, font: bold, color: C.faint })
    page.drawText(clean(label).slice(0, 52), { x: ML + 68, y: 30, size: 7.5, font: reg, color: C.faint })
    page.drawText(`${pg}`, { x: W - MR - 12, y: 30, size: 7.5, font: reg, color: C.faint })
  }

  // ── Write a single paragraph, returns new {page, y} ──
  const writeParagraph = (
    initPage: any,
    initY: number,
    text: string,
    font: any,
    size: number,
    color: any,
    lh: number,
    label: string,
    indent = 0,
  ): { page: any; y: number } => {
    let page = initPage, y = initY
    const lines = wrapLines(text, font, size, TW - indent)
    for (const line of lines) {
      if (y < BOTTOM + lh + 10) {
        drawFooter(page, label)
        ;({ page, y } = addPage())
      }
      page.drawText(line, { x: ML + indent, y, size, font, color })
      y -= lh
    }
    return { page, y }
  }

  // ── Write a full block of paragraphs ──
  const writeBlock = (
    initPage: any,
    initY: number,
    text: string,
    font: any,
    size: number,
    color: any,
    lh: number,
    label: string,
    isLead = false,   // first paragraph gets slightly larger treatment
  ): { page: any; y: number } => {
    let page = initPage, y = initY
    const paras = splitParagraphs(text)

    for (let i = 0; i < paras.length; i++) {
      const useFont  = (isLead && i === 0) ? bold : font
      const useSize  = (isLead && i === 0) ? T.bodyLead.size : size
      const useLh    = (isLead && i === 0) ? T.bodyLead.lh : lh
      const useColor = (isLead && i === 0) ? C.ink : color

      const result = writeParagraph(page, y, paras[i], useFont, useSize, useColor, useLh, label)
      page = result.page
      y = result.y - PARA_GAP   // paragraph gap
    }
    return { page, y }
  }

  // ════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════
  const cover = doc.addPage([W, H]); pg++
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.dark })

  if (coverImageUrl) {
    const img = await safeEmbed(doc, coverImageUrl)
    if (img) {
      cover.drawImage(img, { x: 0, y: H * 0.38, width: W, height: H * 0.62 })
      cover.drawRectangle({ x: 0, y: H * 0.38, width: W, height: H * 0.62, color: rgb(0,0,0), opacity: 0.45 })
    }
  }

  // Bottom text area
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H * 0.42, color: C.dark })

  // Top bar
  cover.drawRectangle({ x: 0, y: H - 46, width: W, height: 46, color: rgb(0,0,0), opacity: 0.55 })
  cover.drawText('DIGIFORGE AI', { x: ML, y: H - 29, size: 9, font: bold, color: C.white, opacity: 0.85 })
  cover.drawText('Digital Product Studio', { x: W - MR - 122, y: H - 29, size: 8.5, font: reg, color: C.white, opacity: 0.50 })

  // Gold accent bar
  cover.drawRectangle({ x: ML, y: H * 0.42 + 2, width: 44, height: 3.5, color: C.gold })

  // Cover title — large, white, wrapped
  const titleWords = clean(content.title).split(' ')
  let tl = '', tLines: string[] = []
  for (const w of titleWords) {
    const test = tl ? `${tl} ${w}` : w
    try {
      bold.widthOfTextAtSize(test, T.coverTitle.size) <= TW ? (tl = test) : (tLines.push(tl), tl = w)
    } catch { tl = w }
  }
  if (tl) tLines.push(tl)

  let ty = H * 0.39 - 8
  for (const line of tLines) {
    cover.drawText(line, { x: ML, y: ty, size: T.coverTitle.size, font: bold, color: C.white })
    ty -= T.coverTitle.lh + 4
  }

  // Subtitle
  if (content.subtitle) {
    ty -= 6
    const subLines = wrapLines(content.subtitle, reg, T.coverSub.size, TW)
    for (const l of subLines) {
      if (!l) continue
      cover.drawText(l, { x: ML, y: ty, size: T.coverSub.size, font: reg, color: rgb(0.76, 0.74, 0.88) })
      ty -= T.coverSub.lh + 2
    }
  }

  // Bottom badges
  cover.drawRectangle({ x: ML, y: 46, width: 128, height: 24, color: C.accent, opacity: 0.90 })
  cover.drawText(`${content.chapters.length} CHAPTERS`, { x: ML + 14, y: 57, size: 8.5, font: bold, color: C.white })
  cover.drawRectangle({ x: ML + 140, y: 46, width: 80, height: 24, color: rgb(1,1,1), opacity: 0.08 })
  cover.drawText('FULL GUIDE', { x: ML + 155, y: 57, size: 8.5, font: bold, color: C.white, opacity: 0.65 })
  cover.drawText(new Date().getFullYear().toString(), { x: W - MR - 28, y: 26, size: 8.5, font: reg, color: rgb(0.4,0.4,0.5) })

  // ════════════════════════════════════════
  // TABLE OF CONTENTS
  // ════════════════════════════════════════
  let { page, y } = addPage()

  // Header band
  page.drawRectangle({ x: 0, y: H - 88, width: W, height: 88, color: C.dark })
  page.drawText('TABLE OF CONTENTS', { x: ML, y: H - 44, size: 16, font: bold, color: C.white })
  page.drawText(`${content.chapters.length} chapters`, { x: ML, y: H - 64, size: 9, font: reg, color: rgb(0.52, 0.50, 0.68) })

  y = H - 106

  // Introduction row
  page.drawLine({ start: { x: ML, y: y - 2 }, end: { x: W - MR, y: y - 2 }, thickness: 0.5, color: C.rule })
  page.drawText('Introduction', { x: ML + 4, y: y - 14, size: T.toc.size, font: reg, color: C.ink })
  y -= 34

  // Chapter rows
  for (const [i, ch] of content.chapters.entries()) {
    page.drawLine({ start: { x: ML, y: y - 2 }, end: { x: W - MR, y: y - 2 }, thickness: 0.5, color: C.rule })

    // Number circle
    page.drawCircle({ x: ML + 14, y: y - 9, size: 12, color: C.accent })
    const numStr = String(i + 1)
    page.drawText(numStr, {
      x: i < 9 ? ML + 10 : ML + 7,
      y: y - 13,
      size: 8.5, font: bold, color: C.white,
    })

    // Real chapter title — strip any "Chapter N:" prefix
    const rawTitle = clean(ch.title || `Chapter ${i + 1}`)
    const chapterTitle = rawTitle
      .replace(/^chapter\s*\d+[\s:\-–]*/i, '')
      .trim()
    const displayTitle = chapterTitle.length > 3 ? chapterTitle : `Chapter ${i + 1}`

    page.drawText(displayTitle.slice(0, 58), {
      x: ML + 34, y: y - 13,
      size: T.toc.size,
      font: i === 0 ? bold : reg,
      color: C.ink,
    })
    y -= 30
  }

  // Conclusion row
  page.drawLine({ start: { x: ML, y: y - 2 }, end: { x: W - MR, y: y - 2 }, thickness: 0.5, color: C.rule })
  page.drawText('Conclusion', { x: ML + 4, y: y - 14, size: T.toc.size, font: reg, color: C.ink })
  page.drawLine({ start: { x: ML, y: y - 28 }, end: { x: W - MR, y: y - 28 }, thickness: 0.5, color: C.rule })

  drawFooter(page, 'Contents')

  // ════════════════════════════════════════
  // INTRODUCTION
  // ════════════════════════════════════════
  ;({ page, y } = addPage())

  // Header band
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: C.accent })
  page.drawText('INTRODUCTION', { x: ML, y: H - 38, size: 9, font: bold, color: rgb(1,1,1), opacity: 0.60 })

  const introTitleLines = wrapLines(clean(content.title), bold, T.introTitle.size, TW)
  let iy = H - 60
  for (const l of introTitleLines) {
    if (!l) continue
    page.drawText(l, { x: ML, y: iy, size: T.introTitle.size, font: bold, color: C.white })
    iy -= T.introTitle.lh + 2
  }

  y = H - 114

  // Introduction body — first paragraph is slightly larger/bolder lead-in
  const introParas = splitParagraphs(content.introduction)
  for (let i = 0; i < introParas.length; i++) {
    if (y < BOTTOM + 30) {
      drawFooter(page, 'Introduction')
      ;({ page, y } = addPage())
    }

    if (i === 0) {
      // Lead paragraph — slightly larger, regular weight (NOT bold)
      const result = writeParagraph(page, y, introParas[i], reg, T.bodyLead.size, C.ink, T.bodyLead.lh, 'Introduction')
      page = result.page
      y = result.y - PARA_GAP - 4
    } else {
      const result = writeParagraph(page, y, introParas[i], reg, T.body.size, C.body, T.body.lh, 'Introduction')
      page = result.page
      y = result.y - PARA_GAP
    }
  }

  drawFooter(page, 'Introduction')

  // ════════════════════════════════════════
  // CHAPTERS
  // ════════════════════════════════════════
  for (const [ci, ch] of content.chapters.entries()) {
    ;({ page, y } = addPage())

    // Clean chapter title
    const rawChTitle = clean(ch.title || '')
    const chapterTitle = rawChTitle.replace(/^chapter\s*\d+[\s:\-–]*/i, '').trim()
    const displayChTitle = chapterTitle.length > 3 ? chapterTitle : `Chapter ${ci + 1}`

    // ── Header image area ──
    const headerH = 185
    page.drawRectangle({ x: 0, y: H - headerH, width: W, height: headerH, color: C.dark })

    // Fetch image based on chapter title keywords (not book title)
    const imageQuery = displayChTitle.split(' ').slice(0, 3).join(' ')
    try {
      const chImgUrl = await fetchUnsplashImage(imageQuery)
      if (chImgUrl) {
        const chImg = await safeEmbed(doc, chImgUrl)
        if (chImg) {
          page.drawImage(chImg, { x: 0, y: H - headerH, width: W, height: headerH })
          page.drawRectangle({ x: 0, y: H - headerH, width: W, height: headerH, color: rgb(0,0,0), opacity: 0.48 })
          // Gradient at bottom of image for text legibility
          page.drawRectangle({ x: 0, y: H - headerH, width: W, height: 60, color: rgb(0,0,0), opacity: 0.30 })
        }
      }
    } catch { /* continue without image */ }

    // Chapter badge
    page.drawRectangle({ x: ML, y: H - 38, width: 90, height: 19, color: C.accent, opacity: 0.88 })
    page.drawText(`CHAPTER ${ci + 1}`, { x: ML + 10, y: H - 30, size: 7.5, font: bold, color: C.white })

    // Chapter title on image — clean, white
    const chTitleLines = wrapLines(displayChTitle, bold, T.chTitle.size, TW)
    let cty = H - 70
    for (const l of chTitleLines) {
      if (!l) continue
      page.drawText(l, { x: ML, y: cty, size: T.chTitle.size, font: bold, color: C.white })
      cty -= T.chTitle.lh
    }

    y = H - headerH - 28

    // ── Chapter body ──
    const chParas = splitParagraphs(ch.content || '')

    for (let pi = 0; pi < chParas.length; pi++) {
      if (y < BOTTOM + 24) {
        drawFooter(page, displayChTitle)
        ;({ page, y } = addPage())
      }

      // Pull quote: every 4th paragraph (not first), only if long enough
      if (pi > 0 && pi % 4 === 0 && chParas[pi].length > 100) {
        // Pick a meaningful excerpt (first sentence)
        const firstSentence = chParas[pi].split(/[.!?]/)[0]?.trim() || ''
        if (firstSentence.length > 40) {
          const qLines = wrapLines(firstSentence, ital, 11.5, TW - 40).filter(l => l)
          const qH = qLines.length * 19 + 36

          if (y - qH > BOTTOM + 20) {
            y -= 6
            page.drawRectangle({ x: ML, y: y - qH, width: TW, height: qH, color: C.tint2 })
            page.drawRectangle({ x: ML, y: y - qH, width: 3.5, height: qH, color: C.accent })
            // Quote mark
            page.drawText('\u201C', { x: ML + 14, y: y - 6, size: 20, font: bold, color: C.accent, opacity: 0.7 })

            let qy = y - 14
            for (const ql of qLines) {
              page.drawText(ql, { x: ML + 28, y: qy, size: 11.5, font: ital, color: rgb(0.26, 0.20, 0.44) })
              qy -= 19
            }
            y -= qH + 12
          }
        }
      }

      // Body paragraph — first para of chapter: bold lead sentence
      if (pi === 0) {
        // First sentence bold, rest regular
        const sentences = chParas[pi].split(/(?<=[.!?])\s+/)
        const leadSentence = sentences[0] || ''
        const rest = sentences.slice(1).join(' ')

        if (leadSentence) {
          const result = writeParagraph(page, y, leadSentence, bold, T.body.size, C.ink, T.body.lh, displayChTitle)
          page = result.page
          y = result.y
        }
        if (rest) {
          const result = writeParagraph(page, y, rest, reg, T.body.size, C.body, T.body.lh, displayChTitle)
          page = result.page
          y = result.y
        }
        y -= PARA_GAP
      } else {
        const result = writeParagraph(page, y, chParas[pi], reg, T.body.size, C.body, T.body.lh, displayChTitle)
        page = result.page
        y = result.y - PARA_GAP
      }
    }

    // ── Key Takeaways ──
    if (ch.tips?.length) {
      const validTips = ch.tips
        .map((t: string) => clean(String(t)))
        .filter((t: string) => t.length > 8)

      if (validTips.length > 0) {
        // Calculate box height
        let boxH = 40  // header
        for (const tip of validTips) {
          const lines = wrapLines(tip, reg, T.tip.size, TW - 38).filter(l => l)
          boxH += lines.length * T.tip.lh + 8
        }
        boxH += 8 // bottom padding

        // Force new page if not enough room
        if (y - boxH < BOTTOM + 16) {
          drawFooter(page, displayChTitle)
          ;({ page, y } = addPage())
        }

        y -= 12
        page.drawRectangle({ x: ML, y: y - boxH, width: TW, height: boxH, color: C.tint })
        page.drawRectangle({ x: ML, y: y - boxH, width: 3.5, height: boxH, color: C.accent })

        // Header
        page.drawRectangle({ x: ML, y: y - 26, width: TW, height: 26, color: C.accent, opacity: 0.08 })
        page.drawText('KEY TAKEAWAYS', { x: ML + 14, y: y - 17, size: 8, font: bold, color: C.accent })

        let ty2 = y - 38
        for (const tip of validTips) {
          const tipLines = wrapLines(tip, reg, T.tip.size, TW - 38).filter(l => l)
          if (ty2 < y - boxH + 6) break

          // Dot instead of dash
          page.drawCircle({ x: ML + 16, y: ty2 + 3, size: 2.5, color: C.accent })

          for (let li = 0; li < tipLines.length; li++) {
            page.drawText(tipLines[li], {
              x: ML + 26,
              y: ty2,
              size: T.tip.size,
              font: reg,
              color: C.ink,
            })
            ty2 -= T.tip.lh
          }
          ty2 -= 8
        }
        y -= boxH + 16
      }
    }

    drawFooter(page, displayChTitle)
  }

  // ════════════════════════════════════════
  // CONCLUSION
  // ════════════════════════════════════════
  const lastChTitle = clean(content.chapters[content.chapters.length - 1]?.title || '').toLowerCase()
  const lastIsConclusion = lastChTitle.includes('conclusion') || lastChTitle.includes('final') || lastChTitle.includes('putting it')

  if (!lastIsConclusion) {
    ;({ page, y } = addPage())

    page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: C.a2 })
    page.drawText('CONCLUSION', { x: ML, y: H - 38, size: 9, font: bold, color: rgb(1,1,1), opacity: 0.60 })
    page.drawText('Final Thoughts', { x: ML, y: H - 68, size: 20, font: bold, color: C.white })

    y = H - 114

    const concParas = splitParagraphs(content.conclusion)
    for (let i = 0; i < concParas.length; i++) {
      if (y < BOTTOM + 24) {
        drawFooter(page, 'Conclusion')
        ;({ page, y } = addPage())
      }
      const result = writeParagraph(page, y, concParas[i], reg, T.body.size, C.body, T.body.lh, 'Conclusion')
      page = result.page
      y = result.y - PARA_GAP
    }

    // Call to action box
    if (content.callToAction && y > BOTTOM + 90) {
      y -= 20
      const ctaLines = wrapLines(content.callToAction, bold, 11.5, TW - 36).filter(l => l)
      const ctaH = ctaLines.length * 20 + 44

      page.drawRectangle({ x: ML, y: y - ctaH, width: TW, height: ctaH, color: C.accent })
      page.drawRectangle({ x: ML, y: y - ctaH, width: TW, height: ctaH, color: C.accent })
      page.drawText('YOUR NEXT STEP', { x: ML + 18, y: y - 18, size: 7.5, font: bold, color: C.gold })

      let cy = y - 32
      for (const cl of ctaLines) {
        page.drawText(cl, { x: ML + 18, y: cy, size: 11.5, font: bold, color: C.white })
        cy -= 20
      }
    }

    drawFooter(page, 'Conclusion')
  }

  // ════════════════════════════════════════
  // BACK COVER
  // ════════════════════════════════════════
  const back = doc.addPage([W, H])
  back.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.dark })
  back.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: C.accent })
  back.drawRectangle({ x: 0, y: 0, width: W, height: 5, color: C.accent })

  // Large decorative quote mark
  back.drawText('\u201C', {
    x: ML - 10, y: H / 2 + 110,
    size: 100, font: bold, color: C.accent, opacity: 0.10,
  })

  const bq = 'The best investment you can make is in yourself. Knowledge is the currency that never devalues.'
  const bqLines = wrapLines(bq, ital, 15, TW).filter(l => l)
  let by2 = H / 2 + 72
  for (const l of bqLines) {
    back.drawText(l, { x: ML, y: by2, size: 15, font: ital, color: C.white, opacity: 0.80 })
    by2 -= 24
  }

  back.drawRectangle({ x: ML, y: H / 2 - 32, width: 44, height: 3, color: C.gold })
  back.drawText('DIGIFORGE AI', { x: ML, y: H / 2 - 52, size: 12, font: bold, color: C.white })
  back.drawText('AI Digital Product Studio', { x: ML, y: H / 2 - 68, size: 9.5, font: reg, color: rgb(0.48, 0.46, 0.62) })
  back.drawText('digiforgeai.app', { x: ML, y: H / 2 - 84, size: 9.5, font: reg, color: rgb(0.38, 0.36, 0.54) })

  // ── EXPORT ──
  const bytes = await doc.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${clean(title).replace(/\s+/g, '_')}.pdf"`,
    },
  })
}