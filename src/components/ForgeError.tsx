// components/ForgeError.tsx
'use client'

import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function ForgeError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Cannot Access Forge</h2>
      <p className="text-slate-500 mb-8 max-w-md">{message}</p>
      <Link
        href="/dashboard/generate"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Go to Generate Page
      </Link>
    </div>
  )
}