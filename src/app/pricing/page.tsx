// app/pricing/page.tsx - UPDATED with accurate features
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, Check, ArrowRight, Sparkles, X, Star, TrendingUp, Shield, Clock, GitBranch, Crown, Menu, Palette, FileText, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId } from '@/lib/pricing/types'

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  // Updated plans with accurate data
  const plansForDisplay = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Perfect for trying out DigiForge',
      features: [
        '5 ebook generations per month',
        'Up to 3 chapters per ebook',
        'Basic PDF export',
        'Standard generation speed',
        'Watermark included',
      ],
      badge: null,
      cta: 'Get Started Free',
      ctaHref: '/dashboard/generate',
      highlight: false,
      popular: false,
      comingSoon: false,
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 9,
      description: 'For casual creators ready to publish',
      features: [
        '15 ebook generations per month', // Increased from 10
        'Up to 6 chapters per ebook',
        'Premium PDF layout',
        'Chapter images included',
        'Faster generation',
        'No watermark',
        '8 accent color themes',
      ],
      badge: 'Most Popular',
      cta: 'Start Creating',
      ctaHref: '/signup?plan=starter',
      highlight: true,
      popular: true,
      comingSoon: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      description: 'For serious creators building a business',
      features: [
        '50 ebook generations per month', // Increased from 30
        'Up to 12 chapters per ebook',
        'Premium PDF layout',
        'Chapter images included',
        'Priority generation speed',
        'Unlimited regenerations (free)',
        'PDF customization (fonts, layouts)',
        'Multiple export formats (PDF + DOCX)',
        'Cover image generation',
        'No watermark',
      ],
      badge: null,
      cta: 'Go Pro',
      ctaHref: '/signup?plan=pro',
      highlight: false,
      popular: false,
      comingSoon: false,
    },
  ]

  // Updated comparison table
  const comparisonFeatures = [
    { name: 'Monthly ebook generations', free: '5', starter: '15', pro: '50' },
    { name: 'Max chapters per ebook', free: '3', starter: '6', pro: '12' },
    { name: 'PDF templates', free: '2', starter: '4', pro: '5+' },
    { name: 'Accent color themes', free: '8', starter: '8', pro: '8' },
    { name: 'Unsplash cover images', free: '✅', starter: '✅', pro: '✅' },
    { name: 'AI trend scoring', free: '✅', starter: '✅', pro: '✅' },
    { name: 'Premium PDF layout', free: '❌', starter: '✅', pro: '✅' },
    { name: 'Chapter images', free: '❌', starter: '✅', pro: '✅' },
    { name: 'No watermark', free: '❌', starter: '✅', pro: '✅' },
    { name: 'Priority generation speed', free: '❌', starter: '❌', pro: '✅' },
    { name: 'PDF customization (fonts/layouts)', free: '❌', starter: '❌', pro: '✅' },
    { name: 'Multiple export formats', free: '❌', starter: '❌', pro: '✅' },
    { name: 'Cover image generation', free: '❌', starter: '❌', pro: '✅' },
    { name: 'Unlimited regenerations', free: '❌', starter: '❌', pro: '✅' },
    { name: 'Commercial use rights', free: '✅', starter: '✅', pro: '✅' },
  { name: 'Customer Support', free: 'Community', starter: 'Standard', pro: 'Priority' },  // ← Professional
  ]

  return (
    <main className="min-h-screen bg-[#0a0b10] text-zinc-200">
      {/* Navbar - same as before */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl border-b border-white/[0.05] bg-[#0f1117]/80">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group cursor-pointer shrink-0">
            <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-300">
              <Image src="/digiforge_logo.png" alt="DigiForge AI Logo" width={20} height={20} className="object-contain md:w-6 md:h-6" priority />
            </div>
            <span className="font-black text-lg md:text-2xl tracking-tighter text-white">
              DigiForge<span className="text-indigo-500">AI</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-10 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Link href="/#features" className="hover:text-indigo-400 transition">Features</Link>
            <Link href="/#how-it-works" className="hover:text-indigo-400 transition">Workflow</Link>
            <Link href="/#reviews" className="hover:text-indigo-400 transition">Testimonials</Link>
            <Link href="/pricing" className="text-indigo-400 transition">Pricing</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold text-zinc-400 hover:text-white transition uppercase tracking-widest">Login</Link>
            <Link href="/signup" className="bg-white text-black text-xs font-black px-5 py-2.5 rounded-full hover:bg-indigo-50 transition shadow-xl uppercase tracking-widest">Sign Up Free</Link>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden flex flex-col gap-1.5 p-2">
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0f1117]/95 backdrop-blur-2xl border-t border-white/[0.05] px-4 py-4">
            <div className="flex flex-col gap-4">
              <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-400 hover:text-white transition py-2">Features</Link>
              <Link href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-400 hover:text-white transition py-2">Workflow</Link>
              <Link href="/#reviews" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-400 hover:text-white transition py-2">Testimonials</Link>
              <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-indigo-400 transition py-2">Pricing</Link>
              <div className="pt-4 flex flex-col gap-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-400 hover:text-white transition py-2">Login</Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="bg-white text-black text-sm font-black px-6 py-3 rounded-full hover:bg-indigo-50 transition text-center">Sign Up Free</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Header */}
      <section className="relative max-w-4xl mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-12 md:pb-16 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[500px] h-[200px] md:h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-zinc-800/40 border border-zinc-700/50 text-indigo-300 text-[10px] md:text-[11px] font-black px-4 md:px-5 py-2 md:py-2.5 rounded-full mb-6 md:mb-8 tracking-[0.1em]">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
            SIMPLE, TRANSPARENT PRICING
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter mb-3 md:mb-4">
            Forge Without Limits
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto px-4">
            Start free. Upgrade when you're ready to scale. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {plansForDisplay.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id
            const displayPrice = plan.price === 0 ? 'Free' : `$${plan.price}`
const displayPeriod = plan.price === 0 ? '' : '/month'
            const isFree = plan.price === 0
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl md:rounded-[2rem] border p-5 md:p-8 transition-all ${
                  plan.highlight
                    ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-600/20 scale-[1.01] md:scale-[1.02]'
                    : 'bg-zinc-900/40 border-white/[0.07] hover:border-white/[0.12]'
                } ${plan.comingSoon ? 'opacity-75' : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-3 md:px-4 py-1 md:py-1.5 rounded-full flex items-center gap-1 whitespace-nowrap ${
                    plan.highlight ? 'bg-white text-indigo-600' : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    <Star className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    {plan.badge}
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    <span className="text-[8px] md:text-[9px] font-black text-emerald-400 uppercase">Current</span>
                  </div>
                )}

                <div className="mb-4 md:mb-6">
                  <p className={`text-[11px] md:text-xs font-black uppercase tracking-[0.25em] mb-2 md:mb-3 ${plan.highlight ? 'text-indigo-100' : 'text-zinc-500'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter ${plan.highlight ? 'text-white' : 'text-white'}`}>
                      {isFree ? 'Free' : displayPrice}
                    </span>
                    {!isFree && (
                      <span className={`text-xs md:text-sm font-medium mb-1 md:mb-2 ${plan.highlight ? 'text-indigo-100' : 'text-zinc-600'}`}>
                        {displayPeriod}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs md:text-sm ${plan.highlight ? 'text-indigo-100' : 'text-zinc-500'}`}>
                    {plan.description}
                  </p>
                </div>

                {isCurrentPlan ? (
                  <div className="w-full flex items-center justify-center gap-2 font-black py-3 rounded-xl text-xs md:text-sm mb-6 md:mb-8 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default">
                    <Check className="w-3.5 h-3.5" />
                    Current Plan
                  </div>
                ) : (
                  <Link href={plan.ctaHref}
                    className={`w-full flex items-center justify-center gap-2 font-black py-3 rounded-xl text-xs md:text-sm transition mb-6 md:mb-8 uppercase tracking-widest ${
                      plan.highlight
                        ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    } ${plan.comingSoon ? 'pointer-events-none opacity-50' : ''}`}>
                    {plan.cta}
                    {!plan.comingSoon && <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                  </Link>
                )}

                <div className={`h-px mb-4 md:mb-6 ${plan.highlight ? 'bg-white/20' : 'bg-white/[0.06]'}`} />

                <ul className="space-y-2 md:space-y-3">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2 md:gap-2.5">
                      <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-indigo-400'}`} />
                      <span className={`text-[11px] md:text-xs ${plan.highlight ? 'text-white' : 'text-zinc-400'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Comparison Table Toggle */}
        <div className="text-center mt-10 md:mt-12">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-indigo-400 transition text-xs md:text-sm font-medium"
          >
            <GitBranch className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {showComparison ? 'Hide full comparison' : 'View full feature comparison'}
            <ArrowRight className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform ${showComparison ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Comparison Table */}
        {showComparison && (
          <div className="mt-6 md:mt-8 bg-zinc-900/40 rounded-xl md:rounded-2xl border border-white/[0.07] overflow-x-auto">
            <div className="min-w-[640px] md:min-w-0">
              <div className="p-4 md:p-6 border-b border-white/[0.07]">
                <h3 className="font-black text-white text-center text-base md:text-lg">Complete Feature Comparison</h3>
              </div>
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                    <th className="text-left p-3 md:p-4 font-bold text-zinc-400">Feature</th>
                    <th className="text-center p-3 md:p-4 font-bold text-zinc-400 w-20 md:w-28">Free</th>
                    <th className="text-center p-3 md:p-4 font-bold text-indigo-400 w-20 md:w-28 bg-indigo-600/5">Starter</th>
                    <th className="text-center p-3 md:p-4 font-bold text-zinc-400 w-20 md:w-28">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="p-3 md:p-4 font-medium text-zinc-300 text-[11px] md:text-sm">{row.name}</td>
                      <td className="text-center p-3 md:p-4 text-zinc-500 text-[11px] md:text-sm">{row.free}</td>
                      <td className="text-center p-3 md:p-4 text-indigo-300 font-medium bg-indigo-600/5 text-[11px] md:text-sm">{row.starter}</td>
                      <td className="text-center p-3 md:p-4 text-zinc-500 text-[11px] md:text-sm">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-10 md:mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-zinc-600 text-[11px] md:text-sm">
              <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 text-[11px] md:text-sm">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Upgrade or downgrade anytime</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 text-[11px] md:text-sm">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-zinc-600 text-xs md:text-sm">
            All plans include commercial rights · No hidden fees
          </p>
          <p className="text-zinc-700 text-[10px] md:text-xs mt-2">
            Questions? <a href="mailto:support@digiforgeai.app" className="text-indigo-500 hover:text-indigo-400 transition">support@digiforgeai.app</a>
          </p>
        </div>
      </section>
    </main>
  )
}