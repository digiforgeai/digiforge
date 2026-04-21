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
    out.push('') // paragraph break
  }
  return out
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

  const W = 595, H = 842
  const ML = 62, MR = 62
  const TW = W - ML - MR
  const BOTTOM = 58

  const C = {
    ink:    rgb(0.10, 0.10, 0.13),
    body:   rgb(0.25, 0.25, 0.28),
    muted:  rgb(0.50, 0.50, 0.55),
    accent: rgb(0.33, 0.18, 0.84),
    a2:     rgb(0.20, 0.12, 0.70),
    white:  rgb(1, 1, 1),
    tint:   rgb(0.96, 0.94, 1.00),
    tint2:  rgb(0.91, 0.88, 0.98),
    dark:   rgb(0.05, 0.04, 0.14),
    gold:   rgb(0.94, 0.74, 0.18),
    line:   rgb(0.88, 0.86, 0.94),
  }

  let pg = 0

  const addPage = () => {
    pg++
    return { page: doc.addPage([W, H]), y: H - 65 }
  }

  const drawFooter = (page: any, label: string) => {
    page.drawLine({ start: { x: ML, y: 44 }, end: { x: W - MR, y: 44 }, thickness: 0.4, color: C.line })
    page.drawText('DigiForgeAI', { x: ML, y: 28, size: 8, font: bold, color: C.muted })
    page.drawText(clean(label).slice(0, 48), { x: ML + 74, y: 28, size: 8, font: reg, color: C.muted })
    page.drawText(`${pg}`, { x: W - MR - 14, y: 28, size: 8, font: reg, color: C.muted })
  }

  // ── WRITE BLOCK: plain paragraphs, auto-paginate ──────
  const writeBlock = (
    initPage: any, initY: number, text: string,
    font: any, size: number, color: any, lh: number,
    label: string, paraSpacing = 10
  ): { page: any; y: number } => {
    let page = initPage, y = initY
    // Split into paragraphs first, write each separately
    const paragraphs = clean(text).split('\n').filter(p => p.trim())

    for (let pi = 0; pi < paragraphs.length; pi++) {
      const lines = wrapLines(paragraphs[pi], font, size, TW).filter(l => l !== '')

      for (const line of lines) {
        if (y < BOTTOM + lh + 16) {
          drawFooter(page, label)
          ;({ page, y } = addPage())
        }
        page.drawText(line, { x: ML, y, size, font, color })
        y -= lh
      }
      // Paragraph spacing
      y -= paraSpacing
    }
    return { page, y }
  }

  // ═══════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════
  const cover = doc.addPage([W, H]); pg++
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.dark })

  if (coverImageUrl) {
    const img = await safeEmbed(doc, coverImageUrl)
    if (img) {
      cover.drawImage(img, { x: 0, y: H * 0.36, width: W, height: H * 0.64 })
      cover.drawRectangle({ x: 0, y: H * 0.36, width: W, height: H * 0.64, color: rgb(0,0,0), opacity: 0.42 })
    }
  }

  cover.drawRectangle({ x: 0, y: 0, width: W, height: H * 0.43, color: C.dark })
  cover.drawRectangle({ x: 0, y: H - 48, width: W, height: 48, color: rgb(0,0,0), opacity: 0.5 })
  cover.drawText('DIGIFORGE AI', { x: ML, y: H - 31, size: 10, font: bold, color: C.white, opacity: 0.9 })
  cover.drawText('Digital Product Studio', { x: W - MR - 118, y: H - 31, size: 9, font: reg, color: C.white, opacity: 0.55 })
  cover.drawRectangle({ x: ML, y: H * 0.43 - 2, width: 48, height: 3, color: C.gold })

  // Title wrapping
  const titleWords = clean(content.title).split(' ')
  let tl = '', tLines: string[] = []
  for (const w of titleWords) {
    const test = tl ? `${tl} ${w}` : w
    bold.widthOfTextAtSize(test, 32) <= TW ? (tl = test) : (tLines.push(tl), tl = w)
  }
  if (tl) tLines.push(tl)

  let ty = H * 0.36 - 10
  for (const line of tLines) {
    cover.drawText(line, { x: ML, y: ty, size: 32, font: bold, color: C.white })
    ty -= 42
  }

  if (content.subtitle) {
    const subLines = wrapLines(content.subtitle, reg, 13, TW).filter(l => l)
    ty -= 4
    for (const l of subLines) {
      cover.drawText(l, { x: ML, y: ty, size: 13, font: reg, color: rgb(0.78, 0.76, 0.88) })
      ty -= 20
    }
  }

  cover.drawRectangle({ x: ML, y: 50, width: 130, height: 26, color: C.accent, opacity: 0.92 })
  cover.drawText(`${content.chapters.length} CHAPTERS`, { x: ML + 14, y: 60, size: 9, font: bold, color: C.white })
  cover.drawRectangle({ x: ML + 142, y: 50, width: 80, height: 26, color: rgb(1,1,1), opacity: 0.10 })
  cover.drawText('FULL GUIDE', { x: ML + 156, y: 60, size: 9, font: bold, color: C.white, opacity: 0.75 })
  cover.drawText(new Date().getFullYear().toString(), { x: W - MR - 28, y: 28, size: 9, font: reg, color: rgb(0.5,0.5,0.6) })

  // ═══════════════════════════════════════
  // TABLE OF CONTENTS
  // ═══════════════════════════════════════
  let { page, y } = addPage()
  page.drawRectangle({ x: 0, y: H - 90, width: W, height: 90, color: C.dark })
  page.drawText('TABLE OF CONTENTS', { x: ML, y: H - 46, size: 18, font: bold, color: C.white })
  page.drawText(`${content.chapters.length} chapters`, { x: ML, y: H - 66, size: 10, font: reg, color: rgb(0.55, 0.52, 0.70) })

  y = H - 112
  page.drawRectangle({ x: ML, y: y - 8, width: TW, height: 28, color: C.tint })
  page.drawText('Introduction', { x: ML + 14, y, size: 12, font: reg, color: C.ink })
  y -= 34

  for (const [i, ch] of content.chapters.entries()) {
    if (i % 2 === 0) page.drawRectangle({ x: ML, y: y - 8, width: TW, height: 28, color: C.tint })
    page.drawCircle({ x: ML + 13, y: y + 5, size: 11, color: C.accent })
    page.drawText(`${i + 1}`, { x: i < 9 ? ML + 9 : ML + 6, y: y + 1, size: 9, font: bold, color: C.white })

    // Get real chapter title
    const rawTitle = clean(ch.title || '')
    const stripped = rawTitle.replace(/^chapter\s*\d+[:\s\-–]*/i, '').trim()
    const isGeneric = !stripped || stripped.toLowerCase() === 'key strategies' || stripped.length < 4
    const tocTitle = isGeneric ? `Chapter ${i + 1}` : stripped

    page.drawText(tocTitle.slice(0, 54), { x: ML + 32, y, size: 12, font: i < 3 ? bold : reg, color: C.ink })
    y -= 32
  }

  y -= 2
  page.drawRectangle({ x: ML, y: y - 8, width: TW, height: 28, color: C.tint })
  page.drawText('Conclusion', { x: ML + 14, y, size: 12, font: reg, color: C.ink })
  drawFooter(page, 'Contents')

  // ═══════════════════════════════════════
  // INTRODUCTION
  // ═══════════════════════════════════════
  ;({ page, y } = addPage())
  page.drawRectangle({ x: 0, y: H - 100, width: W, height: 100, color: C.accent })
  page.drawText('INTRODUCTION', { x: ML, y: H - 42, size: 10, font: bold, color: rgb(1,1,1), opacity: 0.65 })

  const introTitleLines = wrapLines(clean(content.title), bold, 18, TW).filter(l => l)
  let iy = H - 64
  for (const l of introTitleLines) {
    page.drawText(l, { x: ML, y: iy, size: 18, font: bold, color: C.white })
    iy -= 24
  }

  y = H - 118

  const introParas = clean(content.introduction).split('\n').filter(Boolean)
  for (let i = 0; i < introParas.length; i++) {
    const isFirst = i === 0
    const result = writeBlock(page, y, introParas[i], isFirst ? bold : reg, 12, isFirst ? C.ink : C.body, 20, 'Introduction', 8)
    page = result.page; y = result.y
  }

  drawFooter(page, 'Introduction')

  // ═══════════════════════════════════════
  // CHAPTERS
  // ═══════════════════════════════════════
  for (const [ci, ch] of content.chapters.entries()) {
    ;({ page, y } = addPage())

    // Clean chapter title
    const rawChTitle = clean(ch.title || '')
    const chTitle = rawChTitle.replace(/^chapter\s*\d+[:\s\-–]*/i, '').trim()
    const isGenericTitle = !chTitle || chTitle.toLowerCase() === 'key strategies' || chTitle.length < 4
    const displayChTitle = isGenericTitle ? `Chapter ${ci + 1}` : chTitle

    // ── Header image ──
    const headerH = 195
    page.drawRectangle({ x: 0, y: H - headerH, width: W, height: headerH, color: C.dark })

    // Use chapter title keywords for image search
    const searchKeywords = isGenericTitle
      ? clean(content.title).split(' ').slice(0, 3).join(' ')
      : chTitle.split(' ').slice(0, 3).join(' ')

    try {
      const chImgUrl = await fetchUnsplashImage(searchKeywords)
      if (chImgUrl) {
        const chImg = await safeEmbed(doc, chImgUrl)
        if (chImg) {
          page.drawImage(chImg, { x: 0, y: H - headerH, width: W, height: headerH })
          page.drawRectangle({ x: 0, y: H - headerH, width: W, height: headerH, color: rgb(0,0,0), opacity: 0.52 })
          page.drawRectangle({ x: 0, y: H - headerH, width: W, height: 70, color: rgb(0,0,0), opacity: 0.35 })
        }
      }
    } catch { /* silently continue without image */ }

    // Chapter badge
    page.drawRectangle({ x: ML, y: H - 44, width: 86, height: 20, color: C.accent, opacity: 0.92 })
    page.drawText(`CHAPTER ${ci + 1}`, { x: ML + 10, y: H - 37, size: 8, font: bold, color: C.white })

    // Chapter title on image
    const chTitleLines = wrapLines(displayChTitle, bold, 19, TW).filter(l => l)
    let cty = H - 76
    for (const l of chTitleLines) {
      page.drawText(l, { x: ML, y: cty, size: 19, font: bold, color: C.white })
      cty -= 26
    }

    y = H - headerH - 22

    // ── Chapter content ──
    const rawContent = clean(ch.content || '')
    // Split into proper paragraphs — handle both \n and ., separators from Groq
    const paras = rawContent
      .split('\n')
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 10)

    for (let pi = 0; pi < paras.length; pi++) {
      const para = paras[pi]
      const isFirst = pi === 0

      // Pull quote every 3rd paragraph (not first)
      if (!isFirst && pi % 3 === 0 && para.length > 80) {
        if (y < BOTTOM + 100) {
          drawFooter(page, displayChTitle)
          ;({ page, y } = addPage())
        }
        const qText = para.slice(0, 150)
        const qLines = wrapLines(qText, ital, 12, TW - 32).filter((l: string) => l)
        const qH = qLines.length * 20 + 32
        page.drawRectangle({ x: ML, y: y - qH, width: TW, height: qH, color: C.tint2 })
        page.drawRectangle({ x: ML, y: y - qH, width: 4, height: qH, color: C.accent })
        page.drawText('\u201C', { x: ML + 12, y: y - 8, size: 18, font: bold, color: C.accent })
        let qy = y - 12
        for (const ql of qLines) {
          if (qy < y - qH + 8) break
          page.drawText(ql, { x: ML + 28, y: qy, size: 12, font: ital, color: rgb(0.28, 0.22, 0.48) })
          qy -= 20
        }
        y -= qH + 16
        continue
      }

      // First para: bold lead-in. Rest: regular
      if (y < BOTTOM + 20) {
        drawFooter(page, displayChTitle)
        ;({ page, y } = addPage())
      }

      const result = writeBlock(
        page, y, para,
        isFirst ? bold : reg,
        12,
        isFirst ? C.ink : C.body,
        20,
        displayChTitle,
        12
      )
      page = result.page
      y = result.y
    }

    // ── Key Takeaways box ──
    if (ch.tips?.length) {
      const validTips = ch.tips
        .map((t: string) => clean(t))
        .filter((t: string) => t.length > 5 && !t.toLowerCase().includes('practice the techniques'))

      if (validTips.length > 0) {
        // Calculate real box height
        let totalH = 46 // header space
        for (const tip of validTips) {
          const tipLines = wrapLines(tip, reg, 10, TW - 32).filter(l => l)
          totalH += tipLines.length * 17 + 6
        }

        if (y - totalH < BOTTOM + 16) {
          drawFooter(page, displayChTitle)
          ;({ page, y } = addPage())
        }

        y -= 14
        page.drawRectangle({ x: ML, y: y - totalH, width: TW, height: totalH, color: C.tint })
        page.drawRectangle({ x: ML, y: y - totalH, width: 4, height: totalH, color: C.accent })
        page.drawRectangle({ x: ML, y: y - 24, width: TW, height: 24, color: C.accent, opacity: 0.10 })
        page.drawText('KEY TAKEAWAYS', { x: ML + 14, y: y - 16, size: 8, font: bold, color: C.accent })

        let ty2 = y - 36
        for (const tip of validTips) {
          const tipLines = wrapLines(tip, reg, 10, TW - 32).filter(l => l)
          if (ty2 < y - totalH + 8) break
          page.drawText('-', { x: ML + 14, y: ty2, size: 10, font: bold, color: C.accent })
          for (const tl of tipLines) {
            page.drawText(tl, { x: ML + 26, y: ty2, size: 10, font: reg, color: C.ink })
            ty2 -= 17
          }
          ty2 -= 5
        }
        y -= totalH + 14
      }
    }

    drawFooter(page, displayChTitle)
  }

  // ═══════════════════════════════════════
  // CONCLUSION
  // ═══════════════════════════════════════
  const lastChTitle = clean(content.chapters[content.chapters.length - 1]?.title || '').toLowerCase()
  const lastIsConclusion = lastChTitle.includes('conclusion') || lastChTitle.includes('final') || lastChTitle.includes('putting')

  if (!lastIsConclusion) {
    ;({ page, y } = addPage())
    page.drawRectangle({ x: 0, y: H - 100, width: W, height: 100, color: C.a2 })
    page.drawText('CONCLUSION', { x: ML, y: H - 42, size: 10, font: bold, color: rgb(1,1,1), opacity: 0.65 })
    page.drawText('Final Thoughts', { x: ML, y: H - 72, size: 22, font: bold, color: C.white })

    y = H - 118

    const concParas = clean(content.conclusion).split('\n').filter(Boolean)
    for (const p of concParas) {
      const result = writeBlock(page, y, p, reg, 12, C.body, 20, 'Conclusion', 10)
      page = result.page; y = result.y
    }

    if (content.callToAction && y > BOTTOM + 80) {
      y -= 16
      const ctaLines = wrapLines(content.callToAction, bold, 12, TW - 36).filter(l => l)
      const ctaH = ctaLines.length * 20 + 40
      page.drawRectangle({ x: ML, y: y - ctaH, width: TW, height: ctaH, color: C.accent })
      page.drawText('YOUR NEXT STEP', { x: ML + 18, y: y - 18, size: 8, font: bold, color: C.gold })
      let cy = y - 32
      for (const cl of ctaLines) {
        page.drawText(cl, { x: ML + 18, y: cy, size: 12, font: bold, color: C.white })
        cy -= 20
      }
    }

    drawFooter(page, 'Conclusion')
  }

  // ═══════════════════════════════════════
  // BACK COVER
  // ═══════════════════════════════════════
  const back = doc.addPage([W, H])
  back.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.dark })
  back.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: C.accent })
  back.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: C.accent })
  back.drawText('\u201C', { x: ML - 8, y: H / 2 + 100, size: 90, font: bold, color: C.accent, opacity: 0.12 })

  const bq = 'The best investment you can make is in yourself. Knowledge is the currency that never devalues.'
  const bqLines = wrapLines(bq, ital, 16, TW).filter(l => l)
  let by2 = H / 2 + 68
  for (const l of bqLines) {
    back.drawText(l, { x: ML, y: by2, size: 16, font: ital, color: C.white, opacity: 0.82 })
    by2 -= 25
  }

  back.drawRectangle({ x: ML, y: H / 2 - 38, width: 42, height: 3, color: C.gold })
  back.drawText('DIGIFORGE AI', { x: ML, y: H / 2 - 58, size: 13, font: bold, color: C.white })
  back.drawText('AI Digital Product Studio', { x: ML, y: H / 2 - 76, size: 10, font: reg, color: rgb(0.50, 0.48, 0.62) })
  back.drawText('digiforgeai.app', { x: ML, y: H / 2 - 94, size: 10, font: reg, color: rgb(0.40, 0.38, 0.55) })

  // ── EXPORT ──
  const bytes = await doc.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${clean(title).replace(/\s+/g, '_')}.pdf"`,
    },
  })
}