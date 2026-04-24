// lib/hooks/useSubscription.ts
import { useEffect, useState, useCallback } from 'react'
import { createClient, getCurrentUser } from '@/lib/supabase/client'
import { PLAN_LIMITS, type PlanId } from '@/lib/subscription/types'

export function useSubscription() {
  const [plan, setPlan] = useState<PlanId>('free')
  const [usage, setUsage] = useState({ used: 0, limit: 5, remaining: 5 })
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        setIsAuthenticated(false)
        setPlan('free')
        setUsage({ used: 0, limit: 5, remaining: 5 })
        setLoading(false)
        return
      }
      
      setIsAuthenticated(true)

      // Get user's plan with error handling for lock errors
      let currentPlan: PlanId = 'free'
      try {
        const { data: planData, error: planError } = await supabase
          .from('user_plans')
          .select('plan_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        
        // Ignore lock errors
        if (planError && (planError.message?.includes('lock') || planError.message?.includes('stole'))) {
          console.warn('Auth lock error ignored - using default plan')
          currentPlan = 'free'
        } else if (planData) {
          currentPlan = planData.plan_id as PlanId
        }
      } catch (err: any) {
        if (err?.message?.includes('lock') || err?.message?.includes('stole')) {
          console.warn('Auth lock error caught - using default plan')
          currentPlan = 'free'
        } else {
          throw err
        }
      }
      
      setPlan(currentPlan)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      // Get usage count with error handling for lock errors
      let used = 0
      try {
        const { count, error: countError } = await supabase
          .from('generated_ebooks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('generated_at', startOfMonth.toISOString())
        
        if (countError && (countError.message?.includes('lock') || countError.message?.includes('stole'))) {
          console.warn('Auth lock error ignored for count - using 0')
          used = 0
        } else {
          used = count || 0
        }
      } catch (err: any) {
        if (err?.message?.includes('lock') || err?.message?.includes('stole')) {
          console.warn('Auth lock error caught for count - using 0')
          used = 0
        } else {
          throw err
        }
      }

      const limit = PLAN_LIMITS[currentPlan].ebookGenerationsPerMonth
      
      setUsage({
        used,
        limit,
        remaining: Math.max(0, limit - used),
      })
    } catch (error: any) {
      // Only log non-lock errors
      if (!error?.message?.includes('lock') && !error?.message?.includes('stole')) {
        console.error('Failed to fetch subscription:', error)
      }
      // Set safe defaults on error
      setIsAuthenticated(false)
      setPlan('free')
      setUsage({ used: 0, limit: 5, remaining: 5 })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSubscription()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription()
    })
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [fetchSubscription, supabase])

  return { plan, usage, loading, refresh: fetchSubscription, isAuthenticated }
}