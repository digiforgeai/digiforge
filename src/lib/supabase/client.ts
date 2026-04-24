// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Always create a new client on server side
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  // Client side - reuse instance but ensure it's initialized
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          detectSessionInUrl: false,
          persistSession: true,
          flowType: 'pkce',
        },
      }
    )
  }
  
  return supabaseInstance
}

// Helper to check if user is logged in with lock error handling
export async function getCurrentUser() {
  const supabase = createClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Ignore lock errors
    if (error) {
      if (error.message?.includes('lock') || error.message?.includes('stole')) {
        console.warn('Auth lock error ignored in getCurrentUser')
        return null
      }
      return null
    }
    return user
  } catch (err: any) {
    // Ignore lock errors
    if (err?.message?.includes('lock') || err?.message?.includes('stole')) {
      console.warn('Auth lock error caught in getCurrentUser')
      return null
    }
    throw err
  }
}