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

  if (!user) return null

  // ── Fetch Real Data in Parallel ──
  const [profileRes, savedIdeasRes, ebooksRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('saved_ideas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('generated_ebooks').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  ])

  const profile = profileRes.data
  const savedCount = savedIdeasRes.count || 0
  const ebooksCount = ebooksRes.count || 0

  const firstName = profile?.full_name?.split(' ')[0] || 'Creator'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Stats Configuration
  const stats = [
    {
      label: 'Ideas Saved',
      value: savedCount.toString(),
      icon: Lightbulb,
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-50',
      accent: 'border-indigo-100',
    },
    {
      label: 'PDFs Forged',
      value: ebooksCount.toString(),
      icon: FileText,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-50',
      accent: 'border-purple-100',
    },
    {
      label: 'Forge Score Avg',
      value: ebooksCount > 0 ? '92%' : '0%', // You can calculate actual average later
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      accent: 'border-emerald-100',
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
            Manage your {ebooksCount} digital products and {savedCount} saved ideas.
          </p>
        </div>

        {/* ── Real Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className={`bg-white border ${stat.accent} rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all`}
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

        {/* ── Step-by-Step Guide ── */}
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
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