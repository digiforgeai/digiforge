'use client'

import {
  Zap, LayoutDashboard, Lightbulb, BookMarked,
  LogOut, Menu, X, ChevronRight, Rocket, ArrowRight,
  Library, Sparkles, TrendingUp, Star, Settings, Activity
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const links = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, desc: 'Overview & stats', color: 'text-blue-400' },
  { id: 'generate', label: 'Generate Ideas', href: '/dashboard/generate', icon: Lightbulb, desc: 'AI trend engine', color: 'text-amber-400' },
  { id: 'library', label: 'Library', href: '/dashboard/library', icon: Library, desc: 'Generated ebooks', color: 'text-emerald-400' },
  { id: 'saved', label: 'Saved Ideas', href: '/dashboard/saved', icon: BookMarked, desc: 'Your forge queue', color: 'text-purple-400' },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group cursor-pointer">
  <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-900/60 flex items-center justify-center overflow-hidden bg-white/5 group-hover:bg-white/10 transition-all duration-300">
    <Image 
      src="/digiforge_logo.png" 
      alt="DigiForge Logo" 
      width={20} 
      height={20} 
      style={{ width: 'auto', height: 'auto' }}
      className="object-contain md:w-6 md:h-6"
      priority
    />
  </div>
  <div>
    <span className="font-black text-[15px] tracking-tight text-white">
      DigiForge<span className="text-indigo-400">AI</span>
    </span>
    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-0.5">
      Product Studio
    </p>
  </div>
</Link>
  )
}

function NavLinks({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href
        return (
          <Link
            key={link.id}
            href={link.href}
            onClick={onClose}
            className={`
              group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden
              ${isActive
                ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }
            `}
          >
            {/* Active indicator bar */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
            )}
            
            <span className={`shrink-0 transition-all duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : link.color}`} />
            </span>
            
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                {link.label}
              </p>
              <p className={`text-[10px] truncate mt-0.5 transition-colors duration-200 ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                {link.desc}
              </p>
            </div>
            
            {isActive && (
              <ChevronRight className="w-3.5 h-3.5 text-indigo-300 shrink-0 animate-pulse" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({ onClose, hideLogo }: { onClose?: () => void; hideLogo?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState({ name: 'User', email: '', avatar: '' })
  const [usage, setUsage] = useState({ used: 0, limit: 15, plan: 'starter', remaining: 15 })
  const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchUserData() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error?.message?.includes("lock") || error?.message?.includes("stole")) {
        console.warn("Auth lock error ignored")
        return
      }
      
      if (user) {
        // Get profile data
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        
        // Get user plan
        const { data: planData } = await supabase
          .from('user_plans')
          .select('plan_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        
        const plan = planData?.plan_id || 'free'
        
        // Set limits based on plan
        let limit = 5 // free default
        if (plan === 'starter') limit = 15
        if (plan === 'pro') limit = 50
        
        // ✅ Get used count from usage_tracking table
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        const monthStr = startOfMonth.toISOString().split('T')[0]
        
        const { data: usageData } = await supabase
          .from('usage_tracking')
          .select('ebook_generations_used')
          .eq('user_id', user.id)
          .eq('month', monthStr)
          .single()
        
        const used = usageData?.ebook_generations_used || 0
        const remaining = Math.max(0, limit - used)
        
        setProfile({
          name: data?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar: data?.avatar_url || ''
        })
        
        setUsage({
          used: used,
          limit: limit,
          plan: plan,
          remaining: remaining
        })
        
        console.log('Sidebar usage:', { plan, used, limit, remaining });
      }
    } catch (err: any) {
      if (err?.message?.includes("lock") || err?.message?.includes("stole")) {
        console.warn("Auth lock error caught and ignored")
        return
      }
      console.error("Failed to fetch user:", err)
    } finally {
      setLoading(false)
    }
  }
  fetchUserData()
}, [])

  const handleLogout = async () => {
    const supabase = createClient()
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const getUsageText = () => {
    if (usage.remaining === 0) {
      return "⚠️ No generations left this month"
    }
    if (usage.remaining <= 3) {
      return `⚡ ${usage.remaining} generation${usage.remaining !== 1 ? 's' : ''} left`
    }
    return `${usage.used}/${usage.limit} used this month`
  }

  const getBorderColor = () => {
    if (usage.remaining === 0) return 'border-amber-500/30 bg-amber-500/5'
    if (usage.remaining <= 3) return 'border-amber-500/20 bg-amber-500/5'
    return 'border-indigo-500/20 bg-indigo-500/5'
  }

  const getTextColor = () => {
    if (usage.remaining === 0) return 'text-amber-400'
    if (usage.remaining <= 3) return 'text-amber-400'
    return 'text-indigo-400'
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0f1119] to-[#13151f] backdrop-blur-sm">
      {!hideLogo && (
        <div className="flex items-center px-5 py-5 border-b border-white/[0.05]">
          <Logo />
        </div>
      )}

      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Main Menu</p>
        </div>
      </div>

      <NavLinks pathname={pathname} onClose={onClose} />

      {/* Monthly Usage - Simple Text Card */}
      {/* <div className={`mx-3 my-2 rounded-xl border ${getBorderColor()} p-3`}>
        <div className="flex items-center gap-2 mb-1.5">
          <Activity className={`w-3 h-3 ${getTextColor()}`} />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly Usage</span>
        </div>
        <p className={`text-xs font-medium ${getTextColor()}`}>
          {getUsageText()}
        </p>
        <p className="text-[8px] text-slate-500 mt-1">
          {usage.plan === 'free' && 'Free: 5/month'}
          {usage.plan === 'starter' && 'Starter: 15/month'}
          {usage.plan === 'pro' && 'Pro: 50/month • Unlimited'}
        </p>
        {usage.remaining <= 3 && usage.plan !== 'pro' && (
          <Link 
            href="/pricing" 
            className="flex items-center justify-between w-full mt-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg px-2 py-1 transition-all group"
          >
            <span className="text-[7px] font-black text-amber-400 uppercase tracking-wide">
              {usage.remaining === 0 ? 'Upgrade to continue' : 'Low on credits'}
            </span>
            <ArrowRight className="w-2 h-2 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div> */}

      {/* Upgrade Card - Only show for non-pro users or when low on credits */}
      {(usage.plan !== 'pro' || usage.remaining <= 3) && (
        <div className="mx-3 my-2 relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(white,transparent_50%)]" />
          
          <div className="relative z-10 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
              <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">
                {usage.plan === 'pro' ? 'Pro Member ✓' : 'Upgrade Available'}
              </span>
            </div>
            <p className="text-[9px] text-white/90 leading-relaxed mb-1.5 font-medium">
              {usage.plan === 'pro' 
                ? '✨ You have unlimited access to all features'
                : usage.remaining === 0
                  ? `You've used all ${usage.limit} generations this month`
                  : `${usage.remaining} generation${usage.remaining !== 1 ? 's' : ''} remaining`
              }
            </p>
            {usage.plan !== 'pro' && (
              <Link 
                href="/pricing" 
                onClick={onClose} 
                className="flex items-center justify-between w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg px-2 py-1 transition-all group"
              >
                <span className="text-[7px] font-black text-white uppercase tracking-wide">
                  {usage.remaining === 0 ? 'Upgrade Now' : 'Upgrade to Pro'}
                </span>
                <ArrowRight className="w-2 h-2 text-white group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* User Profile Section */}
      <div className="px-3 pb-4 mt-auto">
        <div className="pt-4 border-t border-white/[0.05]">
          <Link 
            href="/dashboard/profile" 
            onClick={onClose} 
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all duration-300 group"
          >
            <div className="relative">
              {profile.avatar ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden relative border-2 border-indigo-500/30">
                  <Image src={profile.avatar} alt="Profile" fill sizes="40px" className="object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm uppercase shadow-lg shadow-indigo-500/30">
                  {profile.name[0]}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#13151f] rounded-full animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate uppercase tracking-tight">
                {profile.name}
              </p>
              <p className="text-[9px] text-slate-500 truncate font-medium">
                {profile.email}
              </p>
            </div>
            
            <Settings className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:rotate-90 transition-all duration-300" />
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full mt-2 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-bold">Sign Out</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col z-30 border-r border-white/[0.03] shadow-2xl shadow-black/30 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#0f1119]/95 backdrop-blur-xl border-b border-white/[0.06] z-30 flex items-center justify-between px-4 py-3.5">
        <Logo />
        <button 
          onClick={() => setMobileOpen(true)} 
          className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-indigo-600/20 transition-all"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300" 
            onClick={() => setMobileOpen(false)} 
          />
          <aside className="absolute left-0 top-0 h-full w-72 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0f1119]">
              <Logo />
              <button 
                onClick={() => setMobileOpen(false)} 
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent hideLogo onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}