// app/api/unsplash/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'business'

  try {
    // Add timeout to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
      { 
        headers: { Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}` },
        signal: controller.signal
      }
    )
    
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.error('Unsplash API error:', res.status)
      // Return empty array instead of failing
      return NextResponse.json({ photos: [] })
    }

    const data = await res.json()
    return NextResponse.json({ photos: data.results || [] })
    
  } catch (error) {
    console.error('Unsplash fetch error:', error)
    // Return empty array on error - don't break the app
    return NextResponse.json({ photos: [] })
  }
}