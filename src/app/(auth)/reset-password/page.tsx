'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function SetNewPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="w-full min-h-screen bg-[#0d0f14] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 w-full max-w-md shadow-2xl relative z-10">
        <h1 className="text-white font-black text-xl uppercase tracking-tighter mb-2 text-center">New Access Key</h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest text-center mb-8">Update your forge credentials</p>

        {success ? (
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl p-4 text-xs font-bold text-center">
            Key Updated! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="password"
                required
                placeholder="NEW PASSWORD"
                className="w-full bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none transition"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group">
              {loading ? 'Updating...' : 'Update Access Key'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}