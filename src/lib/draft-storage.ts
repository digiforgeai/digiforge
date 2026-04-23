// lib/draft-storage.ts
import { createClient } from '@/lib/supabase/client'

export interface EbookDraft {
  title: string
  subtitle: string
  content: any
  theme: string
  template: string
  coverImageUrl: string | null
  selectedPhoto?: any
  step: number
  chapterCount: number
  tone: string
  bookLength: string
  userId?: string
  savedAt?: string
  isFromLibrary?: boolean  // Add this to track library imports
}

// Save draft to localStorage
export function saveDraft(draft: Partial<EbookDraft>) {
  if (typeof window === 'undefined') return
  
  // Don't save if this is a library restore
  if (draft.isFromLibrary) return
  
  const userId = localStorage.getItem('sb-user-id');
  
  localStorage.setItem('forge_draft', JSON.stringify({
    ...draft,
    userId: userId,
    savedAt: new Date().toISOString()
  }))
}

// Load draft from localStorage
export function loadDraft(): Partial<EbookDraft> | null {
  if (typeof window === 'undefined') return null
  const draft = localStorage.getItem('forge_draft')
  if (!draft) return null
  
  try {
    const data = JSON.parse(draft)
    // If this is from library, ignore it
    if (data.isFromLibrary) return null
    
    const savedAt = new Date(data.savedAt)
    const hoursDiff = (new Date().getTime() - savedAt.getTime()) / (1000 * 60 * 60)
    if (hoursDiff > 24) {
      localStorage.removeItem('forge_draft')
      return null
    }
    return data
  } catch {
    return null
  }
}

// Clear draft
export function clearDraft() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('forge_draft')
}

// Save to Supabase
export async function saveToSupabase(ebookData: {
  title: string
  subtitle: string
  niche?: string
  theme: string
  template: string
  chapterCount: number
  coverImageUrl: string | null
  content: any
}) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('generated_ebooks')
    .insert({
      user_id: user.id,
      title: ebookData.title,
      subtitle: ebookData.subtitle,
      niche: ebookData.niche || null,
      theme: ebookData.theme,
      template: ebookData.template,
      chapter_count: ebookData.chapterCount,
      cover_image_url: ebookData.coverImageUrl,
      content: ebookData.content
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}