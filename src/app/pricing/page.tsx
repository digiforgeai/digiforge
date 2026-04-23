// app/pricing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, Check, ArrowRight, Sparkles, X, Star, TrendingUp, Shield, Clock, GitBranch, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId } from '@/lib/pricing/types'

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        if (subscription) setCurrentPlan(subscription.plan_id as PlanId)
      }
    } catch (error) {
      console.error('Failed to fetch current plan:', error)
    }
  }

  const plansForDisplay = [
    {
      ...PLANS.free,
      badge: null,
      cta: 'Get Started Free',
      ctaHref: '/signup',
      highlight: false,
      popular: false,
      comingSoon: false,
    },
    {
      ...PLANS.starter,
      badge: 'Most Popular',
      cta: 'Start Creating',
      ctaHref: '/signup?plan=starter',
      highlight: true,
      popular: true,
      comingSoon: false,
    },
    {
      ...PLANS.pro,
      badge: 'Coming Soon',
      cta: 'Join Waitlist',
      ctaHref: '/signup?plan=pro',
      highlight: false,
      popular: false,
      comingSoon: true,
    },
  ]

  const getYearlyPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return '$0'
    const yearly = Math.round(monthlyPrice * 12 * 0.8)
    return `$${yearly}`
  }

  const comparisonFeatures = [
    { name: 'Monthly ebook generations', free: '2', starter: '10', pro: '30' },
    { name: 'Max chapters per ebook', free: '3', starter: '6', pro: '10' },
    { name: 'PDF templates', free: '3', starter: '3', pro: '3' },
    { name: 'Accent color themes', free: '8', starter: '8', pro: '8' },
    { name: 'Unsplash cover images', free: '✅', starter: '✅', pro: '✅' },
    { name: 'AI trend scoring', free: '✅', starter: '✅', pro: '✅' },
    { name: 'Premium PDF layout', free: '❌', starter: '✅', pro: '✅' },
    { name: 'Chapter images', free: '❌', starter: '✅', pro: '✅' },
    { name: 'No watermark', free: '❌', starter: '✅', pro: '✅' },
    { name: 'Priority generation speed', free: '❌', starter: '❌', pro: '✅' },
    { name: 'Multiple export formats', free: '❌', starter: '❌', pro: '✅' },
    { name: 'Commercial use rights', free: '✅', starter: '✅', pro: '✅' },
    { name: 'Priority support', free: '❌', starter: '❌', pro: '✅' },
  ]

  return (
    <main className="min-h-screen bg-[#0a0b10] text-zinc-200">

      {/* Navbar - Matching Landing Page Style */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl border-b border-white/[0.05] bg-[#0f1117]/80">
        <div className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center overflow-hidden">
              <Image
                src="/digiforge_logo.png"
                alt="DigiForge AI Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">
              DigiForge<span className="text-indigo-500">AI</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Link href="/#features" className="hover:text-indigo-400 transition cursor-pointer">
              Features
            </Link>
            <Link href="/#how-it-works" className="hover:text-indigo-400 transition cursor-pointer">
              The Workflow
            </Link>
            <Link href="/#reviews" className="hover:text-indigo-400 transition cursor-pointer">
              Testimonials
            </Link>
            <Link href="/pricing" className="text-indigo-400 transition cursor-pointer">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer uppercase tracking-widest">
              Login
            </Link>
            <Link href="/signup" className="bg-white text-black text-xs font-black px-6 py-3 rounded-full hover:bg-indigo-50 transition-all active:scale-95 shadow-xl cursor-pointer tracking-widest uppercase">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-zinc-800/40 border border-zinc-700/50 text-indigo-300 text-[11px] font-black px-5 py-2.5 rounded-full mb-8 tracking-[0.1em]">
            <Sparkles className="w-3.5 h-3.5" />
            SIMPLE, TRANSPARENT PRICING
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Forge Without Limits
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready to scale. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-bold transition ${billingInterval === 'month' ? 'text-white' : 'text-zinc-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className="relative w-14 h-7 bg-zinc-700 rounded-full transition-colors duration-300 focus:outline-none"
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  billingInterval === 'year' ? 'translate-x-8 bg-indigo-500' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-bold transition ${billingInterval === 'year' ? 'text-white' : 'text-zinc-600'}`}>
              Yearly
              <span className="ml-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plansForDisplay.map((plan, i) => {
            const isCurrentPlan = currentPlan === plan.id
            const displayPrice = billingInterval === 'year' && plan.price !== 0
              ? getYearlyPrice(plan.price)
              : `$${plan.price}`
            const displayPeriod = billingInterval === 'year' ? '/year' : '/month'
            const isFree = plan.price === 0
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-[2rem] border p-8 transition-all ${
                  plan.highlight
                    ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-600/20 scale-[1.02]'
                    : 'bg-zinc-900/40 border-white/[0.07] hover:border-white/[0.12]'
                } ${plan.comingSoon ? 'opacity-75' : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full flex items-center gap-1 ${
                    plan.highlight ? 'bg-white text-indigo-600' : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    <Star className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-4 right-4 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Current</span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`text-xs font-black uppercase tracking-[0.25em] mb-3 ${plan.highlight ? 'text-indigo-100' : 'text-zinc-500'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className={`text-5xl font-black tracking-tighter ${plan.highlight ? 'text-white' : 'text-white'}`}>
                      {isFree ? 'Free' : displayPrice}
                    </span>
                    {!isFree && (
                      <span className={`text-sm font-medium mb-2 ${plan.highlight ? 'text-indigo-100' : 'text-zinc-600'}`}>
                        {displayPeriod}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${plan.highlight ? 'text-indigo-100' : 'text-zinc-500'}`}>
                    {plan.description}
                  </p>
                </div>

                {isCurrentPlan ? (
                  <div className="w-full flex items-center justify-center gap-2 font-black py-3.5 rounded-xl text-sm mb-8 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default">
                    <Check className="w-3.5 h-3.5" />
                    Current Plan
                  </div>
                ) : (
                  <Link href={plan.ctaHref}
                    className={`w-full flex items-center justify-center gap-2 font-black py-3.5 rounded-xl text-sm transition mb-8 uppercase tracking-widest ${
                      plan.highlight
                        ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    } ${plan.comingSoon ? 'pointer-events-none opacity-50' : ''}`}>
                    {plan.cta}
                    {!plan.comingSoon && <ArrowRight className="w-3.5 h-3.5" />}
                  </Link>
                )}

                <div className={`h-px mb-6 ${plan.highlight ? 'bg-white/20' : 'bg-white/[0.06]'}`} />

                <ul className="space-y-3">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-indigo-400'}`} />
                      <span className={`text-sm ${plan.highlight ? 'text-white' : 'text-zinc-400'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Comparison Table Toggle */}
        <div className="text-center mt-12">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-indigo-400 transition text-sm font-medium"
          >
            <GitBranch className="w-4 h-4" />
            {showComparison ? 'Hide full comparison' : 'View full feature comparison'}
            <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showComparison ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Comparison Table */}
        {showComparison && (
          <div className="mt-8 bg-zinc-900/40 rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="p-6 border-b border-white/[0.07]">
              <h3 className="font-black text-white text-center text-lg">Complete Feature Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                    <th className="text-left p-4 font-bold text-zinc-400">Feature</th>
                    <th className="text-center p-4 font-bold text-zinc-400 w-28">Free</th>
                    <th className="text-center p-4 font-bold text-indigo-400 w-28 bg-indigo-600/5">Starter</th>
                    <th className="text-center p-4 font-bold text-zinc-400 w-28">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="p-4 font-medium text-zinc-300">{row.name}</td>
                      <td className="text-center p-4 text-zinc-500">{row.free}</td>
                      <td className="text-center p-4 text-indigo-300 font-medium bg-indigo-600/5">{row.starter}</td>
                      <td className="text-center p-4 text-zinc-500">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-zinc-600 text-sm">
              <Shield className="w-4 h-4" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Upgrade or downgrade anytime</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 text-sm">
              <Clock className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-zinc-600 text-sm">
            All plans include commercial rights · No hidden fees
          </p>
          <p className="text-zinc-700 text-xs mt-2">
            Questions? <a href="mailto:support@digiforgeai.app" className="text-indigo-500 hover:text-indigo-400 transition">support@digiforgeai.app</a>
          </p>
        </div>
      </section>

    </main>
  )
}