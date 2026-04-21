'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeft, ArrowRight, Check, Image as ImageIcon,
  Sparkles, FileText, Download, Edit3, Zap
} from 'lucide-react'

interface Idea {
  title: string
  angle: string
  targetAudience: string
  forgeScore: number
  trend: string
  niche: string
}

interface Chapter {
  title: string
  content: string
  tips: string[]
}

interface PDFContent {
  title: string
  subtitle: string
  introduction: string
  chapters: Chapter[]
  conclusion: string
  callToAction: string
}

const STEPS = [
  { id: 1, label: 'Cover Image', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 2, label: 'Customize',   icon: <Edit3 className="w-4 h-4" /> },
  { id: 3, label: 'Generate',    icon: <Sparkles className="w-4 h-4" /> },
  { id: 4, label: 'Preview',     icon: <FileText className="w-4 h-4" /> },
  { id: 5, label: 'Export',      icon: <Download className="w-4 h-4" /> },
]

const TONES = ['Professional', 'Conversational', 'Motivational', 'Educational', 'Authoritative']

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// Build dynamic generate steps based on chapter count
function buildGenSteps(chapterCount: number): string[] {
  return [
    'Reading your customizations...',
    'Writing introduction...',
    ...Array.from({ length: chapterCount }, (_, i) => `Writing chapter ${i + 1} of ${chapterCount}...`),
    'Writing conclusion...',
    'Finalizing your guide...',
  ]
}

// Build timing for each step in ms from start
function buildStepTimings(chapterCount: number): number[] {
  const timings = [
    500,   // reading
    3500,  // intro
  ]
  let cursor = 7500
  for (let i = 0; i < chapterCount; i++) {
    timings.push(cursor)
    // chapters 3 & 4 need more time due to rate limits
    const delay = i >= 2 && i <= 3 ? 9000 : 6000
    cursor += delay
  }
  timings.push(cursor)         // conclusion
  timings.push(cursor + 3000)  // finalizing
  return timings
}

export default function ForgePage() {
  const router = useRouter()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [step, setStep] = useState(1)

  // Step 1
  const [photos, setPhotos] = useState<any[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)

  // Step 2
  const [customTitle, setCustomTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [tone, setTone] = useState('Professional')
  const [chapterCount, setChapterCount] = useState(6)
  const [targetPrice, setTargetPrice] = useState('$9.99')

  // Step 3 — dynamic
  const [genSteps, setGenSteps] = useState<string[]>(buildGenSteps(6))
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [content, setContent] = useState<PDFContent | null>(null)
  const [genError, setGenError] = useState('')

  // Step 4
  const [editingChapter, setEditingChapter] = useState<number | null>(null)
  const [editedContent, setEditedContent] = useState<PDFContent | null>(null)

  // Step 5
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('forgeIdea')
    if (!stored) { router.push('/dashboard/generate'); return }
    const parsed = JSON.parse(stored)
    setIdea(parsed)
    setCustomTitle(parsed.title)
    setSubtitle(parsed.angle)
    fetchPhotos(parsed.niche || parsed.title)
  }, [])

  // Rebuild gen steps whenever chapterCount changes
  useEffect(() => {
    setGenSteps(buildGenSteps(chapterCount))
  }, [chapterCount])

  const fetchPhotos = async (query: string) => {
    setPhotosLoading(true)
    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setPhotos(data.photos || [])
      if (data.photos?.length) setSelectedPhoto(data.photos[0])
    } catch {}
    finally { setPhotosLoading(false) }
  }

const handleGenerate = async () => {
  if (!idea) return
  setGenerating(true)
  setGenStep(0)
  setGenError('')

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: {
          title: customTitle,
          angle: subtitle,
          targetAudience: idea.targetAudience,
          tone,
          chapterCount,
        }
      }),
    })

    if (!res.ok) throw new Error('Request failed')
    if (!res.body) throw new Error('No stream')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))

          if (data.event === 'progress') {
            // Find matching step index
            const idx = genSteps.findIndex(s =>
              s.toLowerCase().includes(data.step.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase())
            )
            if (idx !== -1) setGenStep(idx)
            else setGenStep(prev => Math.min(prev + 1, genSteps.length - 2))
          }

          if (data.event === 'chapter_done') {
            // Move to exact chapter step
            const chapterStepIdx = 2 + (data.chapter - 1) // intro is index 1, chapters start at 2
            setGenStep(chapterStepIdx)
          }

          if (data.event === 'done') {
            setGenStep(genSteps.length - 1)
            await sleep(600)
            setContent(data.content)
            setEditedContent(data.content)
            setStep(4)
          }

          if (data.event === 'error') {
            throw new Error(data.message)
          }
        } catch (parseErr) {
          // skip malformed lines
        }
      }
    }
  } catch (err: any) {
    setGenError(err.message || 'Generation failed. Try again.')
  } finally {
    setGenerating(false)
  }
}

  const handleExport = async () => {
    if (!editedContent) return
    setExporting(true)
    try {
      const pdfRes = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedContent,
          title: customTitle,
          coverImageUrl: selectedPhoto?.urls?.regular || null,
        }),
      })
      if (!pdfRes.ok) throw new Error('Export failed')
      const blob = await pdfRes.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${customTitle.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setStep(5)
    } catch {
      setGenError('Export failed. Try again.')
    } finally {
      setExporting(false)
    }
  }

  const updateChapter = (idx: number, field: string, value: string) => {
    if (!editedContent) return
    const updated = { ...editedContent }
    updated.chapters = [...updated.chapters]
    updated.chapters[idx] = { ...updated.chapters[idx], [field]: value }
    setEditedContent(updated)
  }

  if (!idea) return null

  return (
    <div className="flex w-full min-h-screen bg-[#f8f9fc]">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 md:px-10 pt-20 md:pt-10 pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/dashboard/generate')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:border-violet-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Forge Product</h1>
            <p className="text-slate-400 text-xs mt-0.5 truncate max-w-md">{customTitle}</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    step > s.id
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : step === s.id
                      ? 'border-violet-600 text-violet-600 bg-violet-50'
                      : 'border-slate-200 text-slate-300 bg-white'
                  }`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : s.icon}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    step >= s.id ? 'text-slate-700' : 'text-slate-300'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-2 rounded transition-all ${
                    step > s.id ? 'bg-violet-600' : 'bg-slate-100'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: Cover Image ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">Choose a Cover Image</h2>
            <p className="text-slate-400 text-sm mb-6">Pick an image that represents your product. Powered by Unsplash.</p>

            {photosLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-video bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!photosLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedPhoto?.id === photo.id
                        ? 'border-violet-500 shadow-md shadow-violet-100'
                        : 'border-transparent hover:border-violet-300'
                    }`}
                  >
                    <img src={photo.urls.small} alt={photo.alt_description} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Search different images..."
                className="flex-1 border border-slate-200 focus:border-violet-400 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none bg-slate-50 focus:bg-white transition"
                onKeyDown={e => { if (e.key === 'Enter') fetchPhotos((e.target as HTMLInputElement).value) }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Search different images..."]') as HTMLInputElement
                  if (input?.value) fetchPhotos(input.value)
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Search
              </button>
            </div>

            {selectedPhoto && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl mb-6">
                <img src={selectedPhoto.urls.thumb} className="w-12 h-8 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-violet-700">Selected</p>
                  <p className="text-xs text-violet-500 truncate">Photo by {selectedPhoto.user?.name} on Unsplash</p>
                </div>
                <Check className="w-4 h-4 text-violet-600 shrink-0" />
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedPhoto}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Customize ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">Customize Your Product</h2>
            <p className="text-slate-400 text-sm mb-6">Fine-tune the details before AI generates your content.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Guide Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Writing Tone</label>
                  <div className="grid grid-cols-1 gap-2">
                    {TONES.map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition cursor-pointer text-left ${
                          tone === t
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'border-slate-200 text-slate-600 hover:border-violet-300 bg-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Chapter count */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chapters</label>
                      <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">{chapterCount}</span>
                    </div>
                    <input
                      type="range" min={4} max={10} value={chapterCount}
                      onChange={e => setChapterCount(Number(e.target.value))}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-300 mt-1"><span>4</span><span>10</span></div>
                    <p className="text-xs text-slate-400 mt-1">
                      ⏱ Est. {Math.round((chapterCount * 6 + 20) / 60)} min generation time
                    </p>
                  </div>

                  {/* Target price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Price</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['$4.99', '$9.99', '$14.99', '$19.99', '$24.99', '$49.99'].map(p => (
                        <button
                          key={p}
                          onClick={() => setTargetPrice(p)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            targetPrice === p
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'border-slate-200 text-slate-600 hover:border-violet-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mini preview */}
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    {selectedPhoto && (
                      <img src={selectedPhoto.urls.small} className="w-full h-24 object-cover" />
                    )}
                    <div className="p-3 bg-slate-50">
                      <p className="text-xs font-bold text-slate-800 truncate">{customTitle}</p>
                      <p className="text-xs text-slate-400 truncate">{subtitle}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-violet-600 font-semibold">{targetPrice}</span>
                        <span className="text-xs text-slate-400">{chapterCount} chapters</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => { setStep(3); setTimeout(handleGenerate, 300) }}
                disabled={!customTitle}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Generate {chapterCount} Chapters
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Generating ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-violet-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Forging Your Product</h2>
            <p className="text-slate-400 text-sm mb-2">
              AI is writing your complete {chapterCount}-chapter guide
            </p>
            <p className="text-xs text-slate-300 mb-8">
              Est. {Math.round((chapterCount * 6 + 20) / 60)} min — please don't close this tab
            </p>

            {/* Scrollable step list */}
            <div className="max-w-sm mx-auto space-y-2 mb-8 max-h-80 overflow-y-auto pr-1">
              {genSteps.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 text-left ${
                    i < genStep
                      ? 'bg-violet-50 opacity-70'
                      : i === genStep
                      ? 'bg-violet-100 shadow-sm'
                      : 'opacity-20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    i < genStep
                      ? 'bg-violet-600'
                      : i === genStep
                      ? 'bg-violet-400'
                      : 'bg-slate-200'
                  }`}>
                    {i < genStep
                      ? <Check className="w-3 h-3 text-white" />
                      : i === genStep
                      ? <span className="w-2 h-2 bg-white rounded-full animate-ping block" />
                      : null
                    }
                  </div>
                  <span className={`text-sm ${
                    i < genStep
                      ? 'text-slate-500'
                      : i === genStep
                      ? 'text-slate-800 font-semibold'
                      : 'text-slate-400'
                  }`}>{s}</span>
                  {i === genStep && (
                    <div className="flex gap-1 ml-auto shrink-0">
                      {[0,1,2].map(d => (
                        <span
                          key={d}
                          className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="max-w-sm mx-auto">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>{Math.round((genStep / genSteps.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(genStep / genSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {genError && (
              <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl p-4 text-sm mt-6">
                {genError}
                <button
                  onClick={() => { setStep(2); setGenError('') }}
                  className="ml-3 underline cursor-pointer"
                >
                  Go back
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Preview & Edit ── */}
        {step === 4 && editedContent && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Preview & Edit</h2>
                <p className="text-slate-400 text-xs mt-0.5">Click any section to edit before exporting</p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                {exporting
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Exporting...</>
                  : <><Download className="w-4 h-4" /> Export PDF</>
                }
              </button>
            </div>

            <div className="space-y-4">
              {/* Cover */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {selectedPhoto && <img src={selectedPhoto.urls.regular} className="w-full h-48 object-cover" />}
                <div className="p-6">
                  <input
                    value={editedContent.title}
                    onChange={e => setEditedContent({ ...editedContent, title: e.target.value })}
                    className="w-full text-xl font-bold text-slate-900 bg-transparent border-b-2 border-transparent focus:border-violet-400 outline-none mb-2 pb-1 cursor-text"
                  />
                  <input
                    value={editedContent.subtitle}
                    onChange={e => setEditedContent({ ...editedContent, subtitle: e.target.value })}
                    className="w-full text-sm text-slate-500 bg-transparent border-b border-transparent focus:border-violet-300 outline-none cursor-text"
                  />
                </div>
              </div>

              {/* Introduction */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Introduction</h3>
                <textarea
                  value={editedContent.introduction}
                  onChange={e => setEditedContent({ ...editedContent, introduction: e.target.value })}
                  rows={4}
                  className="w-full text-sm text-slate-700 bg-slate-50 focus:bg-white border border-transparent focus:border-violet-300 rounded-xl p-3 outline-none resize-none transition cursor-text"
                />
              </div>

              {/* Chapters */}
              {editedContent.chapters.map((ch, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider">
                      Chapter {idx + 1} of {editedContent.chapters.length}
                    </span>
                    <button
                      onClick={() => setEditingChapter(editingChapter === idx ? null : idx)}
                      className="text-xs text-slate-400 hover:text-violet-600 transition cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      {editingChapter === idx ? 'Collapse' : 'Edit'}
                    </button>
                  </div>
                  <input
                    value={ch.title}
                    onChange={e => updateChapter(idx, 'title', e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-violet-300 outline-none mb-3 pb-1 cursor-text"
                  />
                  {editingChapter === idx ? (
                    <textarea
                      value={ch.content}
                      onChange={e => updateChapter(idx, 'content', e.target.value)}
                      rows={8}
                      className="w-full text-sm text-slate-700 bg-slate-50 focus:bg-white border border-transparent focus:border-violet-300 rounded-xl p-3 outline-none resize-none transition cursor-text"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 line-clamp-3">{ch.content}</p>
                  )}
                  {ch.tips?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ch.tips.map((tip, ti) => (
                        <span key={ti} className="text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full">
                          ✓ {tip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Conclusion */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Conclusion</h3>
                <textarea
                  value={editedContent.conclusion}
                  onChange={e => setEditedContent({ ...editedContent, conclusion: e.target.value })}
                  rows={4}
                  className="w-full text-sm text-slate-700 bg-slate-50 focus:bg-white border border-transparent focus:border-violet-300 rounded-xl p-3 outline-none resize-none transition cursor-text"
                />
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Done ── */}
        {step === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Product is Ready! 🎉</h2>
            <p className="text-slate-400 text-sm mb-8">Your PDF has been downloaded. Time to list it and start selling.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              {[
                { label: 'Gumroad', emoji: '💰', url: 'https://gumroad.com' },
                { label: 'Payhip',  emoji: '🛒', url: 'https://payhip.com' },
                { label: 'Etsy',    emoji: '🏪', url: 'https://etsy.com' },
              ].map(p => (
                <a key={p.label} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 border border-slate-200 hover:border-violet-300 rounded-xl transition cursor-pointer">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-sm font-semibold text-slate-700">Sell on {p.label}</span>
                </a>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard/generate')}
                className="border border-slate-200 hover:border-violet-300 text-slate-600 font-semibold px-6 py-3 rounded-xl transition cursor-pointer text-sm"
              >
                Generate More Ideas
              </button>
              <button
                onClick={() => { setStep(4) }}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl transition cursor-pointer text-sm"
              >
                Edit & Re-export
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}