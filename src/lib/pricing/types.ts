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
      '2 ebook generations per month',
      'Up to 3 chapters per ebook',
      'Basic PDF export',
      'Standard generation speed',
      'Watermark included'
    ],
    limits: {
      ebookGenerationsPerMonth: 2,
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
      '10 ebook generations per month',
      'Up to 6 chapters per ebook',
      'Premium PDF layout',
      'Chapter images included',
      'Faster generation',
      'No watermark',
      'Access to trending ideas'
    ],
    limits: {
      ebookGenerationsPerMonth: 10,
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
      '30 ebook generations per month',
      'Up to 10 chapters per ebook',
      'Advanced Kindle-style layout',
      'Smart AI structuring',
      'Cover image generation',
      'Full access to trending ideas',
      'Priority generation speed',
      'Export to multiple formats'
    ],
    limits: {
      ebookGenerationsPerMonth: 30,
      maxChapters: 10,
      maxImagesPerEbook: 12,
      prioritySpeed: true,
      watermark: false,
      premiumStyling: true,
      trendingIdeas: 'full'
    }
  }
}