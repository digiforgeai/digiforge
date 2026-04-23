// app/logout/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const performLogout = async () => {
      // Clear client-side storage
      sessionStorage.clear()
      localStorage.removeItem('supabase-auth-token')
      localStorage.removeItem('sb-user-id')
      localStorage.removeItem('forge_draft')
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Redirect to login
      router.push('/login')
      router.refresh()
    }
    
    performLogout()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Logging out...</p>
      </div>
    </div>
  )
}