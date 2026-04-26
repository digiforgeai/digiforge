// lib/subscription/server.ts
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type PlanId, type UserPlan } from './types'

// Get user's current plan (server-side)
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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
  
  // Get usage from usage_tracking table
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthStr = startOfMonth.toISOString().split('T')[0]
  
  const { data: usageData } = await supabase
    .from('usage_tracking')
    .select('ebook_generations_used')
    .eq('user_id', userId)
    .eq('month', monthStr)
    .single()
  
  const used = usageData?.ebook_generations_used || 0
  const remaining = Math.max(0, limit - used)
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    planId,
  }
}

// SIMPLE WORKING increment usage - NO RPC function needed
export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthStr = startOfMonth.toISOString().split('T')[0]
  
  console.log('Incrementing usage for user:', userId, 'month:', monthStr);
  
  // Get current usage
  const { data: currentUsage } = await supabase
    .from('usage_tracking')
    .select('ebook_generations_used')
    .eq('user_id', userId)
    .eq('month', monthStr)
    .single()
  
  const currentCount = currentUsage?.ebook_generations_used || 0
  const newCount = currentCount + 1
  
  console.log('Current usage:', currentCount, 'New usage:', newCount);
  
  // Upsert - update if exists, insert if not
  const { error } = await supabase
    .from('usage_tracking')
    .upsert(
      {
        user_id: userId,
        month: monthStr,
        ebook_generations_used: newCount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,month',
      }
    )
  
  if (error) {
    console.error('Error incrementing usage:', error);
  } else {
    console.log('Usage incremented successfully to:', newCount);
  }
}