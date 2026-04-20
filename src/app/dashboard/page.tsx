import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Lightbulb, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="flex w-full">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 md:px-8 pt-20 md:pt-10 pb-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ready to forge your next sellable Digital Product?
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Ideas Generated', value: '0', icon: <Lightbulb className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
            { label: 'PDFs Forged', value: '0', icon: <FileText className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
            { label: 'Ideas Saved', value: '0', icon: <TrendingUp className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
              <div className={`${stat.bg} rounded-xl p-3`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/dashboard/generate"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-6 flex items-center justify-between cursor-pointer transition group"
          >
            <div>
              <h3 className="font-bold text-lg mb-1">Generate PDF Ideas</h3>
              <p className="text-indigo-200 text-sm">Find trending angles with AI scoring</p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/dashboard/saved"
            className="bg-white hover:border-indigo-300 border border-gray-200 text-gray-900 rounded-2xl p-6 flex items-center justify-between cursor-pointer transition group"
          >
            <div>
              <h3 className="font-bold text-lg mb-1">Saved Ideas</h3>
              <p className="text-gray-500 text-sm">View and forge your saved ideas</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        {/* Getting Started */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Get started in 3 steps</h2>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Pick a topic or niche', desc: 'Enter anything — make money online, fitness, real estate, AI tools...', done: false },
              { step: '02', title: 'Review your AI-scored ideas', desc: 'Each idea gets a Forge Score based on demand, competition & monetization', done: false },
              { step: '03', title: 'Forge & download your PDF', desc: 'One click generates a full structured guide ready to sell', done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/generate"
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
          >
            Start Generating <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}