// lib/subscription/types.ts
export type PlanId = 'free' | 'starter' | 'pro'

export const PLAN_LIMITS = {
  free: {
    ebookGenerationsPerMonth: 5,
    maxChapters: 3,
    maxImagesPerEbook: 0,
    prioritySpeed: false,
    watermark: true,
    premiumStyling: false,
    trendingIdeas: 'basic' as const,
  },
  starter: {
    ebookGenerationsPerMonth: 15,
    maxChapters: 6,
    maxImagesPerEbook: 6,
    prioritySpeed: false,
    watermark: false,
    premiumStyling: true,
    trendingIdeas: 'basic' as const,
  },
  pro: {
    ebookGenerationsPerMonth: 50,
    maxChapters: 12,
    maxImagesPerEbook: 12,
    prioritySpeed: true,
    watermark: false,
    premiumStyling: true,
    trendingIdeas: 'full' as const,
  },
}

export interface UserPlan {
  id: string
  user_id: string
  plan_id: PlanId
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end: string
}