// components/UpgradeModal.tsx
'use client'

import { useState } from 'react'
import { X, Zap, Crown, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  remainingGenerations: number
  feature?: string
}

export function UpgradeModal({ isOpen, onClose, currentPlan, remainingGenerations }: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Upgrade to Pro</h2>
          <p className="text-zinc-400 text-sm mt-2">
            You've used {remainingGenerations === 0 ? 'all' : `${2 - remainingGenerations}`} of your free generations this month
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm">Free Plan</span>
            <span className="text-zinc-600 text-sm">→</span>
            <span className="text-white font-bold">Pro Plan</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />
          </div>
          <div className="flex justify-between text-xs text-zinc-600 mt-2">
            <span>2 ebooks/month</span>
            <span>30 ebooks/month</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            '30 ebook generations per month',
            'Up to 10 chapters per ebook',
            'No watermark on exports',
            'Priority generation speed',
            'Premium PDF layouts',
            'Priority support',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-zinc-300">{feature}</span>
            </div>
          ))}
        </div>

        <Link
          href="/pricing"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition"
        >
          Upgrade to Pro - $19/month
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-center text-[10px] text-zinc-600 mt-4">
          Cancel anytime • 30-day money-back guarantee
        </p>
      </div>
    </div>
  )
}