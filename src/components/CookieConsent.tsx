'use client'

import { useState, useEffect } from 'react'
import { Cookie, X, Check } from 'lucide-react'
import Link from 'next/link'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all')
    setShowBanner(false)
    // You can add analytics initialization here
    console.log('Cookies accepted: All')
  }

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential')
    setShowBanner(false)
    console.log('Cookies accepted: Essential only')
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShowBanner(false)
    console.log('Cookies declined')
  }

  if (!showBanner) return null

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-500">
        <div className="bg-[#1a1d2b] border border-indigo-500/20 rounded-2xl shadow-2xl shadow-indigo-900/30 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Cookie className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white mb-1">We value your privacy</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We use cookies to enhance your experience, analyze site traffic, and serve personalized content.
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-indigo-400 hover:text-indigo-300 underline ml-1"
                  >
                    {showDetails ? 'Less details' : 'Learn more'}
                  </button>
                </p>
                
                {/* Detailed info */}
                {showDetails && (
                  <div className="mt-3 p-3 bg-white/5 rounded-xl text-xs text-zinc-400 space-y-2">
                    <p>• <span className="text-white font-medium">Essential cookies</span> - Required for login and core features</p>
                    <p>• <span className="text-white font-medium">Analytics cookies</span> - Help us improve the platform</p>
                    <p>• <span className="text-white font-medium">Marketing cookies</span> - Used for relevant promotions (never sold)</p>
                    <p className="mt-2 pt-1 border-t border-white/10">
                      <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>
                      {' • '}
                      <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>
                    </p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 pt-1">
              <button
                onClick={acceptAll}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3 h-3" />
                Accept All
              </button>
              <button
                onClick={acceptEssential}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-bold py-2 rounded-xl transition"
              >
                Essential Only
              </button>
              <button
                onClick={decline}
                className="flex-1 text-zinc-500 hover:text-red-400 text-xs font-bold py-2 rounded-xl transition"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}