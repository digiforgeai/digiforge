'use client'

import { Zap, LayoutDashboard, Lightbulb, BookMarked, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const links = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'generate', label: 'Generate PDF Ideas', href: '/dashboard/generate', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'saved', label: 'Saved Ideas', href: '/dashboard/saved', icon: <BookMarked className="w-4 h-4" /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <div className="bg-indigo-600 rounded-lg p-1.5">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-sm">DigiForgeAI</span>
          <p className="text-xs text-gray-400">Digital Product Studio</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => (
          <Link
            key={link.id}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              pathname === link.href
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 rounded-lg p-1.5">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">DigiForgeAI</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
{mobileOpen && (
  <div className="md:hidden fixed inset-0 z-40">
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setMobileOpen(false)}
    />
    <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col">
      {/* Close button row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 rounded-lg p-1.5">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">DigiForgeAI</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => (
          <Link
            key={link.id}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              pathname === link.href
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  </div>
)}
    </>
  )
}