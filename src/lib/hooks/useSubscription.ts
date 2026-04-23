// lib/hooks/useSubscription.ts
import { useEffect, useState, useCallback } from 'react'
import { createClient, getCurrentUser } from '@/lib/supabase/client'
import { PLAN_LIMITS, type PlanId } from '@/lib/subscription/types'

export function useSubscription() {
  const [plan, setPlan] = useState<PlanId>('free')
  const [usage, setUsage] = useState({ used: 0, limit: 2, remaining: 2 })
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    try {
      const user = await getCurrentUser()
      
      // If not authenticated, return default free plan but mark as not authenticated
      if (!user) {
        setIsAuthenticated(false)
        setPlan('free')
        setUsage({ used: 0, limit: 2, remaining: 2 })
        setLoading(false)
        return
      }
      
      setIsAuthenticated(true)

      // Get user's plan
      const { data: planData } = await supabase
        .from('user_plans')
        .select('plan_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      const currentPlan = (planData?.plan_id as PlanId) || 'free'
      setPlan(currentPlan)

      // Get usage count for current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('generated_ebooks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      const used = count || 0
      const limit = PLAN_LIMITS[currentPlan].ebookGenerationsPerMonth
      
      setUsage({
        used,
        limit,
        remaining: Math.max(0, limit - used),
      })
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSubscription()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription()
    })
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [fetchSubscription, supabase])

  return { plan, usage, loading, refresh: fetchSubscription, isAuthenticated }
}