// lib/subscription/server.ts - SERVER-SIDE ONLY
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type PlanId, type UserPlan } from './types'

// Get user's current plan (server-side)
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  const supabase = await createClient()  // ← ADD AWAIT HERE
  
  const { data, error } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) return null
  return data as UserPlan
}

// Check if user can generate an ebook
export async function canGenerateEbook(userId: string): Promise<{
  allowed: boolean
  remaining: number
  limit: number
  planId: PlanId
}> {
  const supabase = await createClient()  // ← ADD AWAIT HERE
  
  // Get user's plan
  let planId: PlanId = 'free'
  const { data: planData } = await supabase
    .from('user_plans')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (planData) planId = planData.plan_id as PlanId
  
  const limit = PLAN_LIMITS[planId].ebookGenerationsPerMonth
  
  // Get usage for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count } = await supabase
    .from('generated_ebooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
  
  const used = count || 0
  const remaining = Math.max(0, limit - used)
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    planId,
  }
}

// Increment usage after generation
export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient()  // ← ADD AWAIT HERE
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)
  
  await supabase.rpc('increment_ebook_usage', {
    p_user_id: userId,
    p_month: currentMonth.toISOString(),
  })
}