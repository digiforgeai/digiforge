'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { Sparkles, TrendingUp, Sword, DollarSign, Flame, BookMarked, Zap, ArrowRight, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Idea {
  title: string
  angle: string
  targetAudience: string
  demandScore: number
  competitionScore: number
  monetizationScore: number
  viralityScore: number
  forgeScore: number
  trend: 'Rising' | 'Stable' | 'Hot'
}

const LOADING_STEPS = [
  'Scanning trending topics...',
  'Analyzing market demand...',
  'Scoring monetization potential...',
  'Ranking virality signals...',
  'Finalizing your ideas...',
]

function useLoadingStep(loading: boolean) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!loading) { setStep(0); return }
    setStep(0)
    const interval = setInterval(() => {
      setStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 1800)
    return () => clearInterval(interval)
  }, [loading])
  return LOADING_STEPS[step]
}

function ScoreRow({ score, label, icon }: { score: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-[3px] bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-7 text-right tabular-nums">{score}</span>
    </div>
  )
}

function TrendPill({ trend }: { trend: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    Hot:    { bg: 'bg-rose-50',    text: 'text-rose-500',    dot: 'bg-rose-400' },
    Rising: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
    Stable: { bg: 'bg-sky-50',     text: 'text-sky-500',     dot: 'bg-sky-400' },
  }
  const icons: Record<string, string> = { Hot: '🔥', Rising: '📈', Stable: '➡️' }
  const s = map[trend] || { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {icons[trend]} {trend}
    </span>
  )
}

function ForgeScoreRing({ score }: { score: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? '#8b5cf6' : score >= 50 ? '#6366f1' : '#94a3b8'
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-700">{score}</span>
      </div>
    </div>
  )
}

function SkeletonCard({ step }: { step: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
      {/* Top badges */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
      </div>
      {/* Title */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded-lg w-full animate-pulse" />
        <div className="h-4 bg-slate-100 rounded-lg w-4/5 animate-pulse" />
      </div>
      {/* Subtitle */}
      <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
      {/* Score rows */}
      <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl">
        {[1,2,3,4].map(j => (
          <div key={j} className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 bg-slate-200 rounded animate-pulse shrink-0" />
            <div className="w-24 h-2.5 bg-slate-100 rounded animate-pulse shrink-0" />
            <div className="flex-1 h-[3px] bg-slate-100 rounded animate-pulse" />
            <div className="w-6 h-2.5 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-full animate-pulse" />
          <div className="space-y-1.5">
            <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
            <div className="w-16 h-2.5 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-20 h-8 bg-slate-100 rounded-xl animate-pulse" />
      </div>

      {/* Loading label */}
      <div className="flex items-center gap-2 justify-center pt-1">
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400 italic">{step}</span>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  const [topic, setTopic] = useState('')
  const [niche, setNiche] = useState('General')
  const [count, setCount] = useState(6)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [savingId, setSavingId] = useState<number | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const loadingStep = useLoadingStep(loading)

  const niches = ['General', 'Fitness', 'Finance', 'Business', 'Marketing', 'Tech', 'Self Help', 'Parenting', 'Food', 'Travel', 'Real Estate', 'Education']

  const handleGenerate = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    setIdeas([])
    setSavedIds([])
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, niche, count }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setIdeas(data.ideas)
    } catch {
      setError('Failed to generate ideas. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (idea: Idea, index: number) => {
    setSavingId(index)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('saved_ideas').insert({
        user_id: user!.id,
        title: idea.title,
        angle: idea.angle,
        target_audience: idea.targetAudience,
        demand_score: idea.demandScore,
        competition_score: idea.competitionScore,
        monetization_score: idea.monetizationScore,
        virality_score: idea.viralityScore,
        forge_score: idea.forgeScore,
        trend: idea.trend,
        niche,
      })
      if (!error) setSavedIds(prev => [...prev, index])
    } catch {
      setError('Failed to save idea.')
    } finally {
      setSavingId(null)
    }
  }

  const handleForge = (idea: Idea) => {
    sessionStorage.setItem('forgeIdea', JSON.stringify({ ...idea, niche }))
    router.push('/dashboard/forge')
  }

  return (
    <div className="flex w-full min-h-screen bg-[#f8f9fc]">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 md:px-10 pt-20 md:pt-10 pb-16">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Generate Product Ideas</h1>
          <p className="text-slate-400 text-sm mt-0.5">Discover trending digital product angles with AI-powered scoring</p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">

          {/* Topic input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              What topic do you want ideas for?
              <span className="text-slate-300 font-normal normal-case ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. healthy meal planning, passive income, AI tools..."
              className="w-full border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:bg-white outline-none transition cursor-text"
            />
          </div>

          {/* Niche + Slider row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Niche <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  className="w-full appearance-none border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer transition"
                >
                  {niches.map(n => <option key={n}>{n}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Number of Ideas
                </label>
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">{count}</span>
              </div>
              <input
                type="range" min={3} max={12} value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="w-full accent-violet-600 mt-2 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-300 mt-1"><span>3</span><span>12</span></div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2.5 transition shadow-sm shadow-violet-100 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span>{loadingStep}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Ideas
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        {/* Skeleton cards while loading */}
        {loading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} step={loadingStep} />
              ))}
            </div>
          </>
        )}

        {/* Results */}
        {!loading && ideas.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">{ideas.length} Ideas Generated</h2>
                <p className="text-xs text-slate-400 mt-0.5">Click Forge to build your digital product</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-50 transition-all duration-200 flex flex-col group"
                >
                  <div className="p-6 flex flex-col flex-1">

                    {/* Top */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{niche}</span>
                        <TrendPill trend={idea.trend} />
                      </div>
                      <button
                        onClick={() => !savedIds.includes(i) && handleSave(idea, i)}
                        disabled={savingId === i || savedIds.includes(i)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          savedIds.includes(i)
                            ? 'text-violet-600 bg-violet-50'
                            : 'text-slate-300 hover:text-violet-500 hover:bg-violet-50'
                        }`}
                        title="Save idea"
                      >
                        <BookMarked className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title & details */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">{idea.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-1">{idea.angle}</p>
                    <p className="text-slate-400 text-xs mb-4">👤 {idea.targetAudience}</p>

                    {/* Score bars */}
                    <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl mb-5">
                      <ScoreRow score={idea.demandScore} label="Demand" icon={<TrendingUp className="w-3.5 h-3.5" />} />
                      <ScoreRow score={idea.competitionScore} label="Competition" icon={<Sword className="w-3.5 h-3.5" />} />
                      <ScoreRow score={idea.monetizationScore} label="Monetization" icon={<DollarSign className="w-3.5 h-3.5" />} />
                      <ScoreRow score={idea.viralityScore} label="Virality" icon={<Flame className="w-3.5 h-3.5" />} />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-3">
                        <ForgeScoreRing score={idea.forgeScore} />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Forge Score</p>
                          <p className="text-xs text-slate-400">
                            {idea.forgeScore >= 75 ? '🔥 High potential' : idea.forgeScore >= 50 ? '👍 Worth trying' : '⚠️ Low priority'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleForge(idea)}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        Forge <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}