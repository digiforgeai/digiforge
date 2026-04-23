// components/AuthProvider.tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clearDraft } from '@/lib/draft-storage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

 // In AuthProvider.tsx, update the onAuthStateChange
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: { user: { id: string; }; }) => {
    if (event === 'SIGNED_IN' && session?.user) {
      localStorage.setItem('sb-user-id', session.user.id);
    }
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('sb-user-id');
      // Clear forge data on logout
      sessionStorage.removeItem('forgeIdea');
      sessionStorage.removeItem('forgeContent');
      sessionStorage.removeItem('forge_restore_ebook');
      clearDraft();
    }
  });
  
  return () => {
    subscription?.unsubscribe();
  };
}, []);

  return <>{children}</>;
}