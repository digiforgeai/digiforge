'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Cookie, Shield, BarChart3, Target, Save } from 'lucide-react'
import Link from 'next/link'

export default function CookieSettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState({
    essential: true, // Always on, can't be disabled
    analytics: true,
    marketing: false,
  })

  useEffect(() => {
    const saved = localStorage.getItem('cookie-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (e) {}
    }
  }, [])

  const savePreferences = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences))
    localStorage.setItem('cookie-consent', 'custom')
    alert('Preferences saved!')
    router.back()
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-zinc-300 font-sans py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition mb-12 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <header className="mb-10">
          <div className="bg-amber-600/10 border border-amber-500/20 w-fit p-3 rounded-2xl mb-6">
            <Cookie className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Cookie Preferences</h1>
          <p className="text-zinc-500 text-sm">Manage how we use cookies on DigiForgeAI</p>
        </header>

        <div className="space-y-4">
          {/* Essential Cookies - Always On */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-bold text-white">Essential Cookies</p>
                  <p className="text-xs text-zinc-500">Required for login and core functionality</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                Always Active
              </div>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="font-bold text-white">Analytics Cookies</p>
                  <p className="text-xs text-zinc-500">Help us improve the platform</p>
                </div>
              </div>
              <button
                onClick={() => setPreferences({...preferences, analytics: !preferences.analytics})}
                className={`w-10 h-5 rounded-full transition-all ${
                  preferences.analytics ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all mt-0.5 ${
                  preferences.analytics ? 'ml-5' : 'ml-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-bold text-white">Marketing Cookies</p>
                  <p className="text-xs text-zinc-500">Used for relevant promotions</p>
                </div>
              </div>
              <button
                onClick={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                className={`w-10 h-5 rounded-full transition-all ${
                  preferences.marketing ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all mt-0.5 ${
                  preferences.marketing ? 'ml-5' : 'ml-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={savePreferences}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
          <Link
            href="/privacy"
            className="flex-1 border border-white/10 hover:bg-white/5 text-zinc-400 font-bold py-3 rounded-xl text-sm text-center"
          >
            Privacy Policy
          </Link>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8">
          You can change your cookie preferences at any time from this page.
        </p>
      </div>
    </main>
  )
}