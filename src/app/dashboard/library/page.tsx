// app/dashboard/library/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { 
  BookOpen, Download, Search, 
  Trash2, Clock, Layers, Loader2,
  Inbox, Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Ebook {
  id: string; title: string; subtitle: string; niche: string
  theme: string; template: string; chapter_count: number
  cover_image_url: string; created_at: string; content: any
}

const THEMES: Record<string, string> = {
  indigo: '#4c29d1', violet: '#7c2de6', rose: '#e02e52',
  emerald: '#0d9860', cyan: '#0d99bf', amber: '#db8e0f',
  orange: '#e56610', slate: '#38465c',
}

export default function LibraryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => { fetchEbooks() }, [])

  async function fetchEbooks() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('generated_ebooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setEbooks(data)
    setLoading(false)
  }

  const filteredEbooks = useMemo(() => {
    return ebooks.filter(ebook => 
      ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ebook.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, ebooks])

  // Handle Open - sends to forge page at Step 5 (editing stage)
// In library/page.tsx, update the handleOpen function
// In library/page.tsx - replace the handleOpen function
const handleOpen = (ebook: Ebook) => {
  // Clear any existing forge data
  sessionStorage.removeItem('forgeIdea');
  sessionStorage.removeItem('forge_restore_ebook');
  
  // Store the ebook data
  sessionStorage.setItem('forge_restore_ebook', JSON.stringify({
    id: ebook.id,
    title: ebook.title,
    subtitle: ebook.subtitle || '',
    content: ebook.content,
    theme: ebook.theme,
    template: ebook.template,
    coverImageUrl: ebook.cover_image_url,
    chapterCount: ebook.chapter_count,
    niche: ebook.niche || 'General'
  }));
  
  toast.success(`Loading "${ebook.title}"...`);
  // Force a hard reload to ensure fresh state
  window.location.href = '/dashboard/forge';
}

  const handleDownloadPDF = async (ebook: Ebook) => {
    setDownloadingId(ebook.id)
    const toastId = toast.loading(`Forging PDF for "${ebook.title}"...`)
    
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: ebook.content,
          title: ebook.title,
          coverImageUrl: ebook.cover_image_url,
          theme: ebook.theme,
          template: ebook.template,
        }),
      })
      
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ebook.title.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Download started!", { id: toastId })
    } catch (err) {
      toast.error("Failed to generate PDF", { id: toastId })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    toast(`Delete "${title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm Delete",
        onClick: async () => {
          const { error } = await supabase.from('generated_ebooks').delete().eq('id', id)
          if (!error) {
            setEbooks(prev => prev.filter(e => e.id !== id))
            toast.success("Ebook removed from library")
          } else {
            toast.error("Error deleting ebook")
          }
        },
      },
    })
  }

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Library</h1>
            <p className="text-slate-500 text-sm mt-1">Access and manage your generated products.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by title or niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Ebooks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredEbooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEbooks.map((ebook) => (
              <div key={ebook.id} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 flex flex-col relative">
                
                {/* Delete Trigger */}
                <button 
                  onClick={() => handleDelete(ebook.id, ebook.title)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur rounded-xl text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Cover Preview */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                  {ebook.cover_image_url ? (
                    <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-slate-200" />
                    </div>
                  )}
                  {/* Theme Badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/95 backdrop-blur rounded-lg shadow-sm flex items-center gap-1.5 border border-slate-100">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEMES[ebook.theme] || '#6366f1' }} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{ebook.theme}</span>
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{ebook.niche || 'Digital Asset'}</p>
                    <h3 className="font-bold text-slate-900 leading-tight line-clamp-2 text-sm">{ebook.title}</h3>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{ebook.chapter_count} Chapters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(ebook.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Two buttons: Open (Edit) and Download */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpen(ebook)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Open
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(ebook)}
                        disabled={downloadingId === ebook.id}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                      >
                        {downloadingId === ebook.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <><Download className="w-3.5 h-3.5" /> PDF</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Library is empty</h3>
            <p className="text-slate-400 text-sm mb-8">Generated ebooks will appear here automatically.</p>
            <button 
              onClick={() => router.push('/dashboard/generate')}
              className="bg-indigo-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            >
              Forge New Product
            </button>
          </div>
        )}
      </main>
    </div>
  )
}