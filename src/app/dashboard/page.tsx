import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import {
  Lightbulb, FileText, TrendingUp, ArrowRight,
  Zap, Sparkles, BookMarked, ChevronRight, Clock3
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'Creator'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex w-full">
      <Sidebar />

      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">

        {/* ── Top bar / breadcrumb ── */}
        <div className="hidden md:flex items-center justify-between mb-8 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-slate-300 font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Engine Online</span>
          </div>
        </div>

        {/* ── Greeting Header ── */}
        <div className="mb-8">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-1">{greeting}</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {firstName}, let's forge something great ⚡
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Your AI-powered digital product studio is ready.
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-7">
          {[
            {
              label: 'Ideas Generated',
              value: '0',
              icon: Lightbulb,
              iconColor: 'text-indigo-500',
              iconBg: 'bg-indigo-50',
              accent: 'border-indigo-100',
            },
            {
              label: 'PDFs Forged',
              value: '0',
              icon: FileText,
              iconColor: 'text-purple-500',
              iconBg: 'bg-purple-50',
              accent: 'border-purple-100',
            },
            {
              label: 'Ideas Saved',
              value: '0',
              icon: BookMarked,
              iconColor: 'text-emerald-600',
              iconBg: 'bg-emerald-50',
              accent: 'border-emerald-100',
            },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className={`bg-white border ${stat.accent} rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className={`${stat.iconBg} ${stat.iconColor} rounded-xl p-2.5 self-start`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</p>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Primary CTAs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
          {/* Forge CTA */}
          <Link
            href="/dashboard/generate"
            className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 rounded-2xl p-5 md:p-6 flex items-center justify-between transition-all duration-200 shadow-lg shadow-indigo-200"
          >
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">AI-Powered</span>
              </div>
              <h3 className="font-black text-white text-base md:text-lg leading-tight">Generate PDF Ideas</h3>
              <p className="text-indigo-200/80 text-xs md:text-sm font-medium mt-0.5">Find trending angles with AI scoring</p>
            </div>
            <div className="relative z-10 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all shrink-0 ml-4">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </Link>

          {/* Saved */}
          <Link
            href="/dashboard/saved"
            className="group bg-white hover:border-indigo-200 border border-slate-200 rounded-2xl p-5 md:p-6 flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookMarked className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Library</span>
              </div>
              <h3 className="font-black text-slate-900 text-base md:text-lg leading-tight">Saved Ideas</h3>
              <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">View and forge your saved ideas</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 group-hover:bg-indigo-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-all shrink-0 ml-4">
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </div>
          </Link>
        </div>

        {/* ── Getting Started ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-black text-slate-900 text-sm md:text-base tracking-tight">Get started in 3 steps</h2>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Your path from idea to income</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Clock3 className="w-3.5 h-3.5" />
              ~60s
            </div>
          </div>

          <div className="p-5 md:p-6 space-y-3">
            {[
              {
                step: '01',
                title: 'Pick a topic or niche',
                desc: 'Enter anything — make money online, fitness, real estate, AI tools...',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                border: 'border-indigo-100',
                dot: 'bg-indigo-500',
              },
              {
                step: '02',
                title: 'Review your AI-scored ideas',
                desc: 'Each idea gets a Forge Score based on demand, competition & monetization',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                border: 'border-purple-100',
                dot: 'bg-purple-500',
              },
              {
                step: '03',
                title: 'Forge & download your PDF',
                desc: 'One click generates a full structured guide ready to sell',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                dot: 'bg-emerald-500',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`group flex items-start gap-4 p-4 rounded-xl border ${item.border} ${item.bg} hover:scale-[1.01] transition-transform duration-150 cursor-default`}
              >
                <div className={`${item.color} text-xs font-black px-2 py-1 rounded-lg bg-white/70 border ${item.border} shrink-0 font-mono`}>
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${item.color} opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5`} />
              </div>
            ))}
          </div>

          <div className="px-5 md:px-6 pb-5 md:pb-6">
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-200 group cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" fill="white" />
              Start Forging
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}