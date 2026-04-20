'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Sword, DollarSign, Flame, Trash2, Zap } from 'lucide-react'
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

function ScoreBadge({ score }: { score: number }) {
  const style = score >= 80
    ? 'bg-green-100 text-green-700'
    : score >= 60
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700'
  const label = score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>{label}</span>
}

function TrendBadge({ trend }: { trend: string }) {
  const styles: Record<string, string> = {
    Hot: 'text-red-500', Rising: 'text-green-500', Stable: 'text-blue-500'
  }
  const icons: Record<string, string> = { Hot: '🔥', Rising: '📈', Stable: '➡️' }
  return <span className={`text-xs font-semibold ${styles[trend] || 'text-gray-400'}`}>{icons[trend]} {trend}</span>
}

export default function SavedIdeasPage() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [forgingId, setForgingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchSaved()
  }, [])

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
    <div className="flex w-full">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 md:px-8 pt-20 md:pt-10 pb-10">

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Saved Ideas</h1>
          <Link
            href="/dashboard/generate"
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            + Generate More
          </Link>
        </div>
        <p className="text-gray-500 text-sm mb-6">Your saved product ideas, ready to forge anytime</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-5" />
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(j => <div key={j} className="h-8 bg-gray-100 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && ideas.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No saved ideas yet</h3>
            <p className="text-gray-500 text-sm mb-6">Generate some ideas and save the ones you like</p>
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
            >
              Generate Ideas
            </Link>
          </div>
        )}

        {/* Ideas grid */}
        {!loading && ideas.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">{ideas.length} saved idea{ideas.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ideas.map(idea => (
                <div
                  key={idea.id}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition p-6 flex flex-col"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="flex-1">
                      <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                        {idea.niche}
                      </span>
                      <h3 className="text-base font-bold text-gray-900">{idea.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      disabled={deletingId === idea.id}
                      className="shrink-0 text-gray-300 hover:text-red-400 transition cursor-pointer disabled:opacity-40 mt-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-indigo-500 text-sm font-medium mb-1">{idea.angle}</p>
                  <p className="text-gray-500 text-xs mb-3">👤 {idea.target_audience}</p>

                  <div className="flex items-center gap-3 mb-4">
                    <ScoreBadge score={idea.demand_score} />
                    <TrendBadge trend={idea.trend} />
                  </div>

                  {/* Score grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Search Interest', value: idea.demand_score },
                      { icon: <Sword className="w-3.5 h-3.5" />, label: 'Competition', value: idea.competition_score },
                      { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Monetization', value: idea.monetization_score },
                      { icon: <Flame className="w-3.5 h-3.5" />, label: 'Virality', value: idea.virality_score },
                    ].map((s, j) => (
                      <div key={j} className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">{s.icon}{s.label}</div>
                        <ScoreBadge score={s.value} />
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    <div>
                      <span className="text-xs text-gray-400">
                        ⚡ Forge Score:{' '}
                        <span className="font-bold text-indigo-600">{idea.forge_score}</span>
                      </span>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleForge(idea)}
                      disabled={forgingId === idea.id}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {forgingId === idea.id ? (
                        <><span className="animate-spin inline-block">⚡</span> Forging...</>
                      ) : (
                        <><Zap className="w-3.5 h-3.5" /> Forge PDF</>
                      )}
                    </button>
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