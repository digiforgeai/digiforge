'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, KeyRound, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full min-h-screen bg-[#0d0f14] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 w-full max-w-md shadow-2xl relative z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-10 justify-center">
          <div className="rounded-2xl p-2 shadow-lg shadow-indigo-600/20">
            <Image 
              src="/digiforge_logo.png" 
              alt="DigiForge Logo" 
              width={28} 
              height={28} 
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <span className="font-black text-white text-xl tracking-tighter uppercase">
              DigiForge<span className="text-indigo-500">AI</span>
            </span>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1">Access Recovery</p>
          </div>
        </div>

        {!success ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-white font-bold text-lg mb-2">Lost your Access Key?</h1>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Enter your Forge ID (email) below. We'll dispatch a secure link to reset your credentials.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">Forge ID</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="EMAIL ADDRESS"
                    className="w-full bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-700 outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-xs font-bold text-center tracking-wide">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-indigo-600 hover:bg-indigo-50 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-xs transition-all cursor-pointer uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group"
              >
                {loading ? 'Dispatching...' : (
                  <>
                    Send Recovery Link
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
              <KeyRound className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">Email Sent</h2>
            <p className="text-zinc-500 text-xs leading-relaxed mb-8 font-medium">
              Check <span className="text-indigo-300">{email}</span> for your recovery instructions.
            </p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition group"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            Back to Entry
          </Link>
        </div>
      </div>
    </div>
  )
}