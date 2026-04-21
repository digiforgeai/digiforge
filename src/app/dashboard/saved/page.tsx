'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, Sword, DollarSign, Flame, Trash2, Zap,
  BookMarked, ArrowRight, Info, Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface SavedIdea {
  id: string
  title: string
  angle: string
  target_audience: string
  demand_score: number
  competition_score: number
  monetization_score: number
  virality_score: number
  forge_score: number
  trend: string
  niche: string
  created_at: string
}

function ForgeScoreRing({ score }: { score: number }) {
  const r = 17
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? '#4f46e5' : score >= 50 ? '#7c3aed' : '#94a3b8'
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-slate-700">{score}</span>
      </div>
    </div>
  )
}

function ScoreBar({ score, label, icon }: { score: number; label: string; icon: React.ReactNode }) {
  const color =
    score >= 75 ? 'from-indigo-500 to-indigo-600' :
    score >= 50 ? 'from-violet-400 to-indigo-500' :
    'from-slate-300 to-slate-400'
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 shrink-0 w-4">{icon}</span>
      <span className="text-[11px] font-semibold text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-slate-600 w-7 text-right tabular-nums">{score}</span>
    </div>
  )
}

function TrendPill({ trend }: { trend: string }) {
  const map: Record<string, { bg: string; text: string; dot: string; emoji: string }> = {
    Hot:    { bg: 'bg-rose-50',    text: 'text-rose-500',    dot: 'bg-rose-400',    emoji: '🔥' },
    Rising: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400', emoji: '📈' },
    Stable: { bg: 'bg-sky-50',     text: 'text-sky-500',     dot: 'bg-sky-400',     emoji: '➡️' },
  }
  const s = map[trend] || { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300', emoji: '' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.emoji} {trend}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-16 bg-slate-100 rounded-full" />
          <div className="h-5 bg-slate-100 rounded-lg w-4/5" />
        </div>
        <div className="w-8 h-8 bg-slate-100 rounded-lg ml-3" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
      <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
      <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl mb-4">
        {[1,2,3,4].map(j => (
          <div key={j} className="flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-200 rounded shrink-0" />
            <div className="w-24 h-2 bg-slate-100 rounded shrink-0" />
            <div className="flex-1 h-1.5 bg-slate-100 rounded" />
            <div className="w-6 h-2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-full" />
          <div className="space-y-1.5">
            <div className="w-20 h-3 bg-slate-100 rounded" />
            <div className="w-14 h-2 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="w-24 h-9 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

export default function SavedIdeasPage() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [forgingId, setForgingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchSaved() }, [])

  const fetchSaved = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('saved_ideas')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setIdeas(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('saved_ideas').delete().eq('id', id)
    if (!error) setIdeas(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  const handleForge = async (idea: SavedIdea) => {
    setForgingId(idea.id)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: {
            title: idea.title,
            angle: idea.angle,
            targetAudience: idea.target_audience,
          }
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const pdfRes = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.content, title: idea.title }),
      })
      if (!pdfRes.ok) throw new Error('PDF generation failed')
      const blob = await pdfRes.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${idea.title.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to forge PDF. Try again.')
    } finally {
      setForgingId(null)
    }
  }

  return (
    <div className="flex w-full min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">

        {/* ── Top bar ── */}
        <div className="hidden md:flex items-center justify-between mb-8 pt-2">
          <div className="text-xs font-semibold text-slate-400">
            Dashboard <span className="text-slate-300 mx-1.5">/</span>
            <span className="text-slate-700">Saved Ideas</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Engine Online</span>
          </div>
        </div>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-7 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookMarked className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em]">Library</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Saved Ideas</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Your saved product ideas, ready to forge anytime
            </p>
          </div>
          <Link
            href="/dashboard/generate"
            className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md shadow-indigo-200 cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate More</span>
            <span className="sm:hidden">+</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm font-medium">
            <Info className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && ideas.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 md:p-20 text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BookMarked className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-black text-slate-800 text-lg mb-2 tracking-tight">No saved ideas yet</h3>
            <p className="text-slate-400 text-sm font-medium mb-7 max-w-xs mx-auto">
              Generate some ideas and bookmark the ones worth forging
            </p>
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl text-sm transition shadow-md shadow-indigo-200 cursor-pointer group"
            >
              <Zap className="w-4 h-4" fill="white" />
              Start Generating
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* ── Ideas grid ── */}
        {!loading && ideas.length > 0 && (
          <>
            {/* Results bar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {ideas.length} saved idea{ideas.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5">
                <BookMarked className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Forge Queue</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ideas.map(idea => (
                <div
                  key={idea.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 flex flex-col shadow-sm"
                >
                  <div className="p-5 flex flex-col flex-1">

                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wide">
                            {idea.niche}
                          </span>
                          <TrendPill trend={idea.trend} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug">{idea.title}</h3>
                      </div>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        disabled={deletingId === idea.id}
                        title="Delete idea"
                        className="shrink-0 p-2 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-40 mt-0.5"
                      >
                        {deletingId === idea.id
                          ? <span className="w-4 h-4 inline-block animate-spin text-slate-400">⌛</span>
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>

                    {/* Angle + audience */}
                    <p className="text-slate-500 text-xs leading-relaxed mb-1">{idea.angle}</p>
                    <p className="text-slate-400 text-xs mb-4 font-medium">👤 {idea.target_audience}</p>

                    {/* Score bars */}
                    <div className="space-y-2.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 mb-4">
                      <ScoreBar score={idea.demand_score}       label="Demand"       icon={<TrendingUp className="w-3.5 h-3.5" />} />
                      <ScoreBar score={idea.competition_score}  label="Competition"  icon={<Sword className="w-3.5 h-3.5" />} />
                      <ScoreBar score={idea.monetization_score} label="Monetization" icon={<DollarSign className="w-3.5 h-3.5" />} />
                      <ScoreBar score={idea.virality_score}     label="Virality"     icon={<Flame className="w-3.5 h-3.5" />} />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-3">
                        <ForgeScoreRing score={idea.forge_score} />
                        <div>
                          <p className="text-xs font-black text-slate-700">Forge Score</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {new Date(idea.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleForge(idea)}
                        disabled={forgingId === idea.id}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-200 group-hover:shadow-indigo-300"
                      >
                        {forgingId === idea.id ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Forging...
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" fill="white" />
                            Forge PDF
                          </>
                        )}
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