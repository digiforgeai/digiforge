'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0f1117] text-zinc-300 font-sans py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition mb-12 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Forge
        </button>

        <header className="mb-16">
          <div className="bg-emerald-600/10 border border-emerald-500/20 w-fit p-3 rounded-2xl mb-6">
            <Lock className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm tracking-widest uppercase">Last Updated: April 20, 2026</p>
        </header>

        <section className="space-y-12 leading-relaxed text-balance">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">1. Data Collection</h2>
            <p>We collect your email address for account authentication and to send you updates about your forged assets. We do not sell your personal data to third parties.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">2. Usage Data</h2>
            <p>We analyze how you use the platform (e.g., which trends you search) to improve our AI models and user experience. This data is anonymized and aggregated.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">3. Security</h2>
            <p>We use industry-standard encryption to protect your account data. However, no method of transmission over the internet is 100% secure.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">4. Your Rights</h2>
            <p>You can request to delete your account and all associated data at any time by contacting our support team at <span className="text-indigo-400 font-bold">support@digiforge.ai</span>.</p>
          </div>
        </section>

        <footer className="mt-24 pt-12 border-t border-white/5 text-center text-sm text-zinc-600 font-bold tracking-widest uppercase">
          Safe & Secure • DigiForge AI
        </footer>
      </div>
    </main>
  )
}