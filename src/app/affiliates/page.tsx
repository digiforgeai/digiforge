'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Megaphone, Coins, Users, Rocket } from 'lucide-react'

export default function AffiliatesPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0f1117] text-zinc-300 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10 text-center">
        <button 
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition mb-12 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to DigiForge
        </button>

        <div className="bg-indigo-600/10 border border-indigo-500/20 w-fit p-4 rounded-3xl mb-8 mx-auto shadow-2xl">
          <Megaphone className="w-8 h-8 text-indigo-500" />
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase">
          The Partner <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Program</span>
        </h1>
        
        <div className="inline-flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 text-indigo-300 text-[10px] font-black px-4 py-2 rounded-full mb-10 tracking-[0.2em]">
          <Rocket className="w-3 h-3 animate-bounce" />
          LAUNCHING
        </div>

        <p className="text-zinc-400 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
          We're currently refining our "Forge & Earn" engine. Soon, you'll be able to earn high-ticket commissions by helping creators automate their income.
        </p>

        {/* Preview of what's coming */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-12">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <Coins className="w-5 h-5 text-emerald-500 mb-3" />
            <h3 className="text-white font-bold mb-1">30% Lifetime</h3>
            <p className="text-xs text-zinc-500 font-medium">Recurring commissions on every referral you bring to the forge.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <Users className="w-5 h-5 text-blue-500 mb-3" />
            <h3 className="text-white font-bold mb-1">Creator Tools</h3>
            <p className="text-xs text-zinc-500 font-medium">Get exclusive access to marketing assets and early trend reports.</p>
          </div>
        </div>

        {/* <button 
          onClick={() => router.push('/auth')}
          className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-xl tracking-widest uppercase text-xs"
        >
          Join the waitlist
        </button> */}
      </div>
    </main>
  )
}