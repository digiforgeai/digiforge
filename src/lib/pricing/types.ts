// lib/pricing/types.ts
export type PlanId = 'free' | 'starter' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  price: number
  priceAnnual: number
  description: string
  features: string[]
  limits: {
    ebookGenerationsPerMonth: number
    maxChapters: number
    maxImagesPerEbook: number
    prioritySpeed: boolean
    watermark: boolean
    premiumStyling: boolean
    trendingIdeas: 'basic' | 'full'
  }
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceAnnual: 0,
    description: 'Perfect for trying out DigiForge',
    features: [
      '5 ebook generations per month',  // ← Changed from 2
      'Up to 3 chapters per ebook',
      'Basic PDF export',
      'Standard generation speed',
      'Watermark included'
    ],
    limits: {
      ebookGenerationsPerMonth: 5,  // ← Changed from 2
      maxChapters: 3,
      maxImagesPerEbook: 0,
      prioritySpeed: false,
      watermark: true,
      premiumStyling: false,
      trendingIdeas: 'basic'
    }
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    priceAnnual: 90,
    description: 'For casual creators ready to publish',
    features: [
      '15 ebook generations per month',  // ← Changed from 10
      'Up to 6 chapters per ebook',
      'Premium PDF layout',
      'Chapter images included',
      'Faster generation',
      'No watermark',
      'Access to trending ideas'
    ],
    limits: {
      ebookGenerationsPerMonth: 15,  // ← Changed from 10
      maxChapters: 6,
      maxImagesPerEbook: 6,
      prioritySpeed: false,
      watermark: false,
      premiumStyling: true,
      trendingIdeas: 'basic'
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    priceAnnual: 190,
    description: 'For serious creators building a business',
    features: [
      '50 ebook generations per month',  // ← Changed from 30
      'Up to 12 chapters per ebook',  // ← Changed from 10
      'Premium PDF layout',
      'Chapter images included',
      'Priority generation speed',
      'PDF customization (fonts, layouts)',
      'Multiple export formats (PDF + DOCX)',
      'AI cover image generation'
    ],
    limits: {
      ebookGenerationsPerMonth: 50,  // ← Changed from 30
      maxChapters: 12,  // ← Changed from 10
      maxImagesPerEbook: 12,
      prioritySpeed: true,
      watermark: false,
      premiumStyling: true,
      trendingIdeas: 'full'
    }
  }
}