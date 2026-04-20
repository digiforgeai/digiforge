'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
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
          <div className="bg-indigo-600/10 border border-indigo-500/20 w-fit p-3 rounded-2xl mb-6">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Terms of Service</h1>
          <p className="text-zinc-500 text-sm tracking-widest uppercase">Last Updated: April 20, 2026</p>
        </header>

        <section className="space-y-12 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing DigiForgeAI, you agree to be bound by these terms. If you are under 18, you may only use this service under the supervision of a guardian.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">2. AI-Generated Content</h2>
            <p>You own the rights to the PDF guides and assets you "forge" using our platform. However, you are responsible for ensuring that the final output does not violate any third-party copyrights.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">3. Prohibited Use</h2>
            <p>You may not use DigiForgeAI to generate illegal content, hate speech, or deceptive financial advice. Abuse of our API or automated scraping of our trend data is strictly prohibited.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">4. Limitation of Liability</h2>
            <p>DigiForgeAI provides tools for "ideas to revenue," but we do not guarantee specific financial results. Use the platform and its trend data at your own risk.</p>
          </div>
        </section>

        <footer className="mt-24 pt-12 border-t border-white/5 text-center text-sm text-zinc-600 font-bold tracking-widest uppercase">
          © 2026 DigiForge AI Legal
        </footer>
      </div>
    </main>
  )
}