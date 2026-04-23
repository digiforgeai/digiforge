// app/dashboard/saved/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, Sword, DollarSign, Flame, Trash2, Zap,
  BookMarked, ArrowRight, Info, Sparkles, Eye, Download,
  RefreshCw, AlertCircle, CheckCircle2, Clock, Target, TrendingDown
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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
  sales_rationale?: string
  target_platform?: string
}

function ForgeScoreRing({ score }: { score: number }) {
  const r = 17
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? '#4f46e5' : score >= 50 ? '#7c3aed' : '#94a3b8'
  const label = score >= 75 ? 'High Potential' : score >= 50 ? 'Medium Potential' : 'Low Priority'
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
  
  let recommendation = ''
  if (label === 'Demand' && score >= 75) recommendation = '🔥 High demand'
  if (label === 'Demand' && score < 50) recommendation = '⚠️ Low demand'
  if (label === 'Competition' && score <= 40) recommendation = '✅ Low competition'
  if (label === 'Competition' && score > 70) recommendation = '⚠️ High competition'
  if (label === 'Monetization' && score >= 75) recommendation = '💰 Strong monetization'
  if (label === 'Virality' && score >= 75) recommendation = '📈 Viral potential'
  
  return (
    <div className="flex flex-col gap-1">
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
      {recommendation && (
        <p className="text-[9px] text-slate-400 ml-7">{recommendation}</p>
      )}
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
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')
  const supabase = createClient()

  useEffect(() => { fetchSaved() }, [])

  const fetchSaved = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    const { data, error } = await supabase
      .from('saved_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order(sortBy === 'date' ? 'created_at' : 'forge_score', { ascending: sortBy === 'date' ? false : false })
    if (!error && data) setIdeas(data)
    setLoading(false)
  }

  const handleDelete = async (id: string, title: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('saved_ideas').delete().eq('id', id)
    if (!error) {
      setIdeas(prev => prev.filter(i => i.id !== id))
      toast.success(`"${title}" removed from saved ideas`)
    } else {
      toast.error('Failed to delete idea')
    }
    setDeletingId(null)
  }

  const handleForge = async (idea: SavedIdea) => {
    setForgingId(idea.id)
    setError('')
    
    const toastId = toast.loading(`Forging "${idea.title}"...`)
    
    try {
      // Store idea in sessionStorage for the forge page
      sessionStorage.setItem('forgeIdea', JSON.stringify({
        title: idea.title,
        angle: idea.angle,
        targetAudience: idea.target_audience,
        niche: idea.niche,
        forgeScore: idea.forge_score,
        trend: idea.trend
      }))
      
      // Redirect to forge page
      window.location.href = '/dashboard/forge'
      
      toast.success('Redirecting to forge...', { id: toastId })
    } catch (err) {
      toast.error('Failed to start forging', { id: toastId })
      setError('Failed to start forging. Please try again.')
    } finally {
      setForgingId(null)
    }
  }

  // Filter ideas based on forge score
  const filteredIdeas = ideas.filter(idea => {
    if (filter === 'all') return true
    if (filter === 'high') return idea.forge_score >= 75
    if (filter === 'medium') return idea.forge_score >= 50 && idea.forge_score < 75
    if (filter === 'low') return idea.forge_score < 50
    return true
  })

  const stats = {
    total: ideas.length,
    highPotential: ideas.filter(i => i.forge_score >= 75).length,
    avgScore: ideas.length > 0 ? Math.round(ideas.reduce((a, b) => a + b.forge_score, 0) / ideas.length) : 0
  }

  return (
    <div className="flex w-full min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">

        {/* Top bar */}
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

        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-7">
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
          
          {/* Stats Cards */}
          <div className="flex gap-3">
            <div className="bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
              <p className="text-xl font-black text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">High Potential</p>
              <p className="text-xl font-black text-emerald-600">{stats.highPotential}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</p>
              <p className="text-xl font-black text-indigo-600">{stats.avgScore}</p>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All Ideas
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'high' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🔥 High (75+)
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'medium' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              📈 Medium (50-74)
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'low' ? 'bg-slate-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              ⚠️ Low (&lt;50)
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                sortBy === 'date' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Latest First
            </button>
            <button
              onClick={() => setSortBy('score')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                sortBy === 'score' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Highest Score
            </button>
            <button
              onClick={fetchSaved}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm font-medium">
            <Info className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredIdeas.length === 0 && ideas.length === 0 && (
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

        {/* No results after filter */}
        {!loading && filteredIdeas.length === 0 && ideas.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-black text-slate-800 text-lg mb-2 tracking-tight">No ideas match this filter</h3>
            <p className="text-slate-400 text-sm mb-5">Try changing your filter criteria</p>
            <button
              onClick={() => setFilter('all')}
              className="text-indigo-600 font-bold text-sm hover:text-indigo-700"
            >
              View all ideas →
            </button>
          </div>
        )}

        {/* Ideas grid */}
        {!loading && filteredIdeas.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {filteredIdeas.length} saved idea{filteredIdeas.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5">
                <BookMarked className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Forge Queue</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredIdeas.map(idea => (
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
                            {idea.niche || 'General'}
                          </span>
                          <TrendPill trend={idea.trend} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug">{idea.title}</h3>
                      </div>
                      <button
                        onClick={() => handleDelete(idea.id, idea.title)}
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
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-slate-400 text-xs font-medium">👤 {idea.target_audience}</p>
                      {idea.forge_score >= 75 && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                          High Potential
                        </span>
                      )}
                    </div>

                    {/* Score bars */}
                    <div className="space-y-2.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 mb-4">
                      <ScoreBar score={idea.demand_score} label="Demand" icon={<TrendingUp className="w-3.5 h-3.5" />} />
                      <ScoreBar score={100 - idea.competition_score} label="Opportunity" icon={<Target className="w-3.5 h-3.5" />} />
                      <ScoreBar score={idea.monetization_score} label="Monetization" icon={<DollarSign className="w-3.5 h-3.5" />} />
                      <ScoreBar score={idea.virality_score} label="Virality" icon={<Flame className="w-3.5 h-3.5" />} />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-3">
                        <ForgeScoreRing score={idea.forge_score} />
                        <div>
                          <p className="text-xs font-black text-slate-700">Forge Score</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(idea.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleForge(idea)}
                        disabled={forgingId === idea.id}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-200"
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