import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(req: Request) {
  const { content, title, coverImageUrl } = await req.json()

  try {
    const pdfDoc = await PDFDocument.create()

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 595
    const pageHeight = 842
    const margin = 60

    const primary = rgb(0.35, 0.29, 0.9)
    const dark = rgb(0.12, 0.12, 0.12)
    const gray = rgb(0.45, 0.45, 0.45)
    const light = rgb(0.95, 0.95, 0.98)

    let pageCount = 1

    // -----------------------------
    // CLEAN TEXT (FIXS WINANSI + INVISIBLE CHARACTERS)
    // -----------------------------
    const cleanText = (text: string) => {
      return (text || '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/\t/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/\u200B/g, '')
        .replace(/\u200C/g, '')
        .replace(/\u200D/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // -----------------------------
    // WRAPPING (KINDLE STYLE)
    // -----------------------------
    const wrapText = (text: string, font: any, size: number, maxWidth: number) => {
      const words = cleanText(text).split(' ')
      const lines: string[] = []
      let line = ''

      for (const word of words) {
        if (!word) continue

        const test = line ? `${line} ${word}` : word

        try {
          if (font.widthOfTextAtSize(test, size) < maxWidth) {
            line = test
          } else {
            if (line) lines.push(line)
            line = word
          }
        } catch {
          line = ''
        }
      }

      if (line) lines.push(line)
      return lines
    }

    const drawText = (
      page: any,
      text: string,
      x: number,
      y: number,
      font: any,
      size: number,
      color: any,
      maxWidth: number,
      lineHeight: number
    ) => {
      const paragraphs = cleanText(text).split('\n')

      for (const p of paragraphs) {
        const lines = wrapText(p, font, size, maxWidth)

        for (const line of lines) {
          page.drawText(line, { x, y, size, font, color })
          y -= lineHeight
        }

        y -= lineHeight * 0.6
      }

      return y
    }

    // -----------------------------
    // IMAGE FETCH (UNSPLASH)
    // -----------------------------
    async function fetchImage(query: string) {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
          {
            headers: {
              Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
            },
          }
        )

        const data = await res.json()
        return data?.results?.[0]?.urls?.regular || null
      } catch {
        return null
      }
    }

    // -----------------------------
    // SAFE IMAGE EMBED (PNG + JPG)
    // -----------------------------
    async function safeEmbedImage(pdfDoc: any, url: string) {
      try {
        const res = await fetch(url)
        if (!res.ok) return null

        const bytes = await res.arrayBuffer()

        const jpg = await pdfDoc.embedJpg(bytes).catch(() => null)
        if (jpg) return jpg

        const png = await pdfDoc.embedPng(bytes).catch(() => null)
        return png
      } catch {
        return null
      }
    }

    // -----------------------------
    // IMAGE QUERY BUILDER (SMART)
    // -----------------------------
    const buildImageQuery = (chapterTitle: string, bookTitle: string) => {
      return `${bookTitle} ${chapterTitle}`
        .replace(/chapter|lesson|part|guide/gi, '')
        .trim()
    }

    // -----------------------------
    // COVER PAGE
    // -----------------------------
    const cover = pdfDoc.addPage([pageWidth, pageHeight])

    cover.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.05, 0.05, 0.1),
    })

    // cover image
    if (coverImageUrl) {
      try {
        const img = await safeEmbedImage(pdfDoc, coverImageUrl)
        if (img) {
          cover.drawImage(img, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          })
        }
      } catch {}
    }

    cover.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0, 0, 0),
      opacity: 0.55,
    })

    cover.drawText('DIGIFORGE AI', {
      x: margin,
      y: pageHeight - 80,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    })

    cover.drawText(content.title, {
      x: margin,
      y: pageHeight - 220,
      size: 38,
      font: fontBold,
      color: rgb(1, 1, 1),
    })

    cover.drawText(content.subtitle || '', {
      x: margin,
      y: pageHeight - 270,
      size: 16,
      font: fontRegular,
      color: rgb(0.85, 0.85, 0.85),
    })

    // -----------------------------
    // TOC
    // -----------------------------
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - 80

    page.drawText('TABLE OF CONTENTS', {
      x: margin,
      y,
      size: 18,
      font: fontBold,
      color: dark,
    })

    y -= 40

    content.chapters.forEach((ch: any, i: number) => {
      page.drawText(`${i + 1}. ${ch.title}`, {
        x: margin,
        y,
        size: 12,
        font: fontRegular,
        color: gray,
      })
      y -= 22
    })

    pageCount++

    // -----------------------------
    // INTRO
    // -----------------------------
    page = pdfDoc.addPage([pageWidth, pageHeight])
    y = pageHeight - 80

    page.drawText('INTRODUCTION', {
      x: margin,
      y,
      size: 18,
      font: fontBold,
      color: primary,
    })

    y -= 30

    y = drawText(page, content.introduction, margin, y, fontRegular, 12, dark, pageWidth - margin * 2, 20)

    pageCount++

    // -----------------------------
    // PRELOAD ALL CHAPTER IMAGES (FAST)
    // -----------------------------
    const chapterImages = await Promise.all(
      content.chapters.map(async (ch: any) => {
        const query = buildImageQuery(ch.title, content.title)
        return await fetchImage(query)
      })
    )

    // -----------------------------
    // CHAPTERS
    // -----------------------------
    for (const [i, ch] of content.chapters.entries()) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - 80

      page.drawText(`CHAPTER ${i + 1}`, {
        x: margin,
        y,
        size: 12,
        font: fontBold,
        color: primary,
      })

      y -= 30

      page.drawText(ch.title, {
        x: margin,
        y,
        size: 20,
        font: fontBold,
        color: dark,
      })

      y -= 40

      // IMAGE
      const imageUrl = chapterImages[i]
      const img = imageUrl ? await safeEmbedImage(pdfDoc, imageUrl) : null

      if (img) {
        const imgHeight = 170

        page.drawImage(img, {
          x: margin,
          y: y - imgHeight,
          width: pageWidth - margin * 2,
          height: imgHeight,
        })

        y -= imgHeight + 25
      }

      y = drawText(page, ch.content, margin, y, fontRegular, 12, gray, pageWidth - margin * 2, 20)

      y -= 20

      if (ch.tips?.length) {
        page.drawRectangle({
          x: margin,
          y: y - 10,
          width: pageWidth - margin * 2,
          height: 70,
          color: light,
        })

        y -= 20

        ch.tips.forEach((tip: string) => {
          page.drawText(`• ${cleanText(tip)}`, {
            x: margin + 10,
            y,
            size: 10,
            font: fontRegular,
            color: dark,
          })
          y -= 14
        })
      }

      pageCount++
    }

    // -----------------------------
    // EXPORT
    // -----------------------------
    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    )
  }
}