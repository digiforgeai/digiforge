// lib/hooks/useUsage.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId } from '@/lib/pricing/types'

interface Usage {
  generationsThisMonth: number
  limit: number
  planId: PlanId
  isPremium: boolean
  canGenerate: boolean
  remainingGenerations: number
}

export function useUsage() {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get user's subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      const planId = (subscription?.plan_id as PlanId) || 'free'
      const plan = PLANS[planId]

      // Get usage count for this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('generated_ebooks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      const generationsThisMonth = count || 0
      const remainingGenerations = Math.max(0, plan.limits.ebookGenerationsPerMonth - generationsThisMonth)
      const canGenerate = remainingGenerations > 0 || plan.limits.ebookGenerationsPerMonth === -1

      setUsage({
        generationsThisMonth,
        limit: plan.limits.ebookGenerationsPerMonth,
        planId,
        isPremium: planId !== 'free',
        canGenerate,
        remainingGenerations
      })
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackGeneration = async () => {
    if (!usage) return false
    if (!usage.canGenerate) return false
    
    // Just refresh the usage count
    await fetchUsage()
    return true
  }

  return { usage, loading, trackGeneration, refreshUsage: fetchUsage }
}