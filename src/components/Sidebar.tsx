'use client'

import {
  Zap, LayoutDashboard, Lightbulb, BookMarked,
  LogOut, Menu, X, ChevronRight, Rocket, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Image from 'next/image'

const links = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    desc: 'Overview & stats',
  },
  {
    id: 'generate',
    label: 'Generate Ideas',
    href: '/dashboard/generate',
    icon: Lightbulb,
    desc: 'AI trend engine',
  },
  {
    id: 'saved',
    label: 'Saved Ideas',
    href: '/dashboard/saved',
    icon: BookMarked,
    desc: 'Your forge queue',
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-900/60 flex items-center justify-center overflow-hidden">
        <Image 
          src="/digiforge_logo.png" 
          alt="DigiForge Logo" 
          width={20} 
          height={20} 
          className="object-contain"
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
    </div>
  )
}

function NavLinks({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-3 space-y-0.5">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href
        return (
          <Link
            key={link.id}
            href={link.href}
            onClick={onClose}
            className={`
              group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
              ${isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.07]'
              }
            `}
          >
            <span className={`shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
              <Icon className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${isActive ? 'text-white' : ''}`}>{link.label}</p>
              <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-600 group-hover:text-slate-500'}`}>
                {link.desc}
              </p>
            </div>
            {isActive && <ChevronRight className="w-3 h-3 text-indigo-300 shrink-0" />}
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-[#13151f]">
      {/* Logo — skipped in drawer since drawer header already has it */}
      {!hideLogo && (
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <Logo />
        </div>
      )}

      {/* Section label */}
      <div className="px-5 pt-5 pb-1.5">
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.25em]">Workspace</p>
      </div>

      <NavLinks pathname={pathname} onClose={onClose} />

      {/* ── CTA Card ── */}
      <div className="mx-3 mb-4 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
              First Forge Free
            </span>
          </div>
          <p className="text-[11px] text-indigo-100 leading-relaxed mb-3">
            Generate your first digital product today. No credit card. No limits.
          </p>
          <Link
            href="/dashboard/generate"
            onClick={onClose}
            className="flex items-center justify-between w-full bg-white/20 hover:bg-white/30 border border-white/20 rounded-xl px-3 py-2 transition-all group cursor-pointer"
          >
            <span className="text-[11px] font-black text-white uppercase tracking-wide">
              Start Forging
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/[0.05] pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-30 border-r border-white/[0.04] shadow-xl shadow-black/20">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#13151f] border-b border-white/[0.06] z-30 flex items-center justify-between px-4 py-3.5">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 shadow-2xl flex flex-col">
            {/* Drawer header — only place logo appears on mobile */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#13151f]">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* hideLogo prevents the second logo from rendering */}
            <SidebarContent hideLogo onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}