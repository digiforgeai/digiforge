// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import {
  Lightbulb, FileText, TrendingUp, ArrowRight,
  Sparkles, BookMarked, Crown, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Helper to get user's plan and usage
async function getUserPlanAndUsage(userId: string) {
  const supabase = await createClient()
  
  // Get user's plan
  const { data: planData } = await supabase
    .from('user_plans')
    .select('plan_id, status, usage_reset_at, current_period_start')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  const planId = planData?.plan_id || 'free'
  
  // Get plan limits
  const planLimits = {
    free: { limit: 5, name: 'Free', color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
    starter: { limit: 15, name: 'Starter', color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
    pro: { limit: 50, name: 'Pro', color: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white', border: 'border-indigo-300' },
  }
  
  const currentPlan = planLimits[planId as keyof typeof planLimits] || planLimits.free
  
  // ✅ IMPORTANT: Get usage from usage_tracking table, NOT from counting ebooks directly
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { data: usageData } = await supabase
    .from('usage_tracking')
    .select('ebook_generations_used')
    .eq('user_id', userId)
    .eq('month', startOfMonth.toISOString().split('T')[0].split('T')[0])
    .single()
  
  // If no usage record exists, count from generated_ebooks and create one
  let used = usageData?.ebook_generations_used || 0
  
// ✅ Only fallback if NO RECORD exists (not when used === 0)
if (!usageData) {
  const { count } = await supabase
    .from('generated_ebooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('generated_at', startOfMonth.toISOString().split('T')[0].split('T')[0])

  used = count || 0

  await supabase
    .from('usage_tracking')
    .upsert({
      user_id: userId,
      month: startOfMonth.toISOString().split('T')[0].split('T')[0],
      ebook_generations_used: used,
      updated_at: new Date().toISOString(),
    })
}
  
  const remaining = Math.max(0, currentPlan.limit - used)
  const percentUsed = (used / currentPlan.limit) * 100
  
  return {
    planId,
    planName: currentPlan.name,
    planColor: currentPlan.color,
    planBorder: currentPlan.border,
    limit: currentPlan.limit,
    used,
    remaining,
    percentUsed,
    isFree: planId === 'free',
    isStarter: planId === 'starter',
    isPro: planId === 'pro',
  }
}

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // ── Fetch Real Data in Parallel ──
  const [profileRes, savedIdeasRes, ebooksRes, planData] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('saved_ideas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('generated_ebooks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    getUserPlanAndUsage(user.id)
  ])

  const profile = profileRes.data
  const savedCount = savedIdeasRes.count || 0
  const ebooksCount = ebooksRes.count || 0
  const { planName, planColor, limit, used, remaining, percentUsed, isFree, isStarter, isPro } = planData

  const firstName = profile?.full_name?.split(' ')[0] || 'Creator'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Quota status helpers
  const isAtLimit = isFree && remaining === 0
  const isLowQuota = isFree && remaining > 0 && remaining <= 2
  const isHeavyUser = !isFree && used > limit * 0.7

  // Stats Configuration with clickable links
  const stats = [
    {
      label: 'Ideas Saved',
      value: savedCount.toString(),
      icon: Lightbulb,
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-50',
      accent: 'border-indigo-100',
      href: '/dashboard/generate',
    },
    {
      label: 'PDFs Forged',
      value: ebooksCount.toString(),
      icon: FileText,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-50',
      accent: 'border-purple-100',
      href: '/dashboard/library',
    },
    {
      label: 'Monthly Limit',
      value: `${used}/${limit}`,
      icon: isAtLimit ? AlertCircle : TrendingUp,
      iconColor: isAtLimit ? 'text-red-500' : 'text-emerald-600',
      iconBg: isAtLimit ? 'bg-red-50' : 'bg-emerald-50',
      accent: isAtLimit ? 'border-red-100' : 'border-emerald-100',
      href: isAtLimit || isLowQuota ? '/pricing' : undefined,
    },
  ]

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">

        {/* ── Top bar ── */}
        <div className="hidden md:flex items-center justify-between mb-8 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-slate-300 font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Online</span>
          </div>
        </div>

        {/* ── Greeting Header with Plan Badge ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-1">{greeting}</p>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {firstName}, let's forge something great ⚡
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium">
              You've forged {ebooksCount} ebooks and saved {savedCount} ideas.
            </p>
          </div>
          
          {/* Plan Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${planColor} shadow-sm`}>
            <Crown className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">{planName} Plan</span>
          </div>
        </div>

        {/* ── Usage Meter Card with Smart CTAs ── */}
        <div className={`bg-white border rounded-2xl p-5 mb-7 shadow-sm transition-all ${
          isAtLimit ? 'border-amber-300 bg-amber-50/30' : isLowQuota ? 'border-amber-200' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Usage</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {used} / {limit} <span className="text-sm font-normal text-slate-400">ebooks used</span>
              </p>
            </div>
            {isAtLimit && (
              <Link href="/pricing" className="text-xs font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full hover:bg-amber-200 transition">
                ⚠️ Limit reached - Upgrade
              </Link>
            )}
            {isLowQuota && !isAtLimit && (
              <Link href="/pricing" className="text-xs font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full hover:bg-amber-200 transition">
                ⚡ {remaining} generation{remaining !== 1 ? 's' : ''} left - Upgrade
              </Link>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                isAtLimit ? 'bg-amber-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          
          {/* Smart CTAs based on quota */}
          {isAtLimit && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">You've reached your monthly limit</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Upgrade to Starter for 15 ebooks/month or Pro for 50 ebooks/month + unlimited regenerations.
                  </p>
                  <Link 
                    href="/pricing"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 hover:text-amber-800 transition"
                  >
                    View plans <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {isLowQuota && !isAtLimit && (
            <div className="mt-4 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">Running low on generations</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You have {remaining} generation{remaining !== 1 ? 's' : ''} left this month. 
                    Upgrade to Starter for 15/month or Pro for 50/month + unlimited regenerations.
                  </p>
                  <Link 
                    href="/pricing"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 hover:text-amber-800 transition"
                  >
                    Upgrade now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {isHeavyUser && !isPro && (
            <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-800">You're using {planName} power!</p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    You've used {used}/{limit} generations. Pro gives you 50/month + unlimited regenerations + DOCX export.
                  </p>
                  <Link 
                    href="/pricing"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 transition"
                  >
                    Upgrade to Pro <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {isFree && !isAtLimit && !isLowQuota && used > 0 && (
            <Link 
              href="/pricing"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
            >
              Upgrade to Starter for 15 ebooks/month <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* ── Real Stats (Clickable) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            const CardContent = () => (
              <div
                className={`bg-white border ${stat.accent} rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all group ${
                  stat.href ? 'cursor-pointer hover:border-indigo-300' : ''
                }`}
              >
                <div className={`${stat.iconBg} ${stat.iconColor} rounded-2xl p-3 self-start`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{stat.label}</p>
                </div>
              </div>
            )
            
            return stat.href ? (
              <Link key={i} href={stat.href}>
                <CardContent />
              </Link>
            ) : (
              <div key={i}>
                <CardContent />
              </div>
            )
          })}
        </div>

        {/* ── Primary CTAs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
          <Link
            href="/dashboard/generate"
            className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 shadow-xl shadow-indigo-100"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">Start Here</span>
              </div>
              <h3 className="font-black text-white text-lg md:text-xl">Forge New Idea</h3>
              <p className="text-indigo-100/80 text-sm font-medium mt-1">Research trends and score niches</p>
            </div>
            <div className="relative z-10 w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </Link>

          <Link
            href="/dashboard/library"
            className="group bg-white hover:border-indigo-200 border border-slate-200 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookMarked className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Vault</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg md:text-xl">My Library</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Access your generated PDFs</p>
            </div>
            <div className="w-11 h-11 bg-slate-50 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
            </div>
          </Link>
        </div>

        {/* ── Simple Refresh Notice (SaaS Standard) ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-700">
            💡 Plan updated? If you just upgraded, <Link href="/dashboard" className="font-bold underline">click here to refresh</Link> or simply refresh the page.
          </p>
        </div>

        {/* ── Step-by-Step Guide ── */}
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden mt-7">
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div>
              <h2 className="font-black text-slate-900 text-lg tracking-tight">The Forge Workflow</h2>
              <p className="text-slate-400 text-sm font-medium mt-0.5">From blank page to digital asset</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Research', desc: 'Identify high-demand niches with AI analytics.' },
              { step: '02', title: 'Forge', desc: 'Generate structured, high-quality content.' },
              { step: '03', title: 'Publish', desc: 'Download and distribute your digital product.' },
            ].map((item, i) => (
              <div key={i} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all cursor-default">
                <span className="text-[40px] font-black text-slate-200 absolute -top-2 right-4 group-hover:text-indigo-50 transition-colors font-mono">{item.step}</span>
                <h4 className="font-black text-slate-900 mb-2 relative z-10">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}