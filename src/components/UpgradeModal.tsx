// components/UpgradeModal.tsx
'use client'

import { useState } from 'react'
import { X, Zap, Crown, Check, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  remainingGenerations: number
  feature?: string
}

export function UpgradeModal({ isOpen, onClose, currentPlan, remainingGenerations, feature }: UpgradeModalProps) {
  if (!isOpen) return null

  // Show different content based on current plan
  const isFree = currentPlan === 'free'
  const isStarter = currentPlan === 'starter'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isFree 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}>
            {isFree ? <Crown className="w-8 h-8 text-white" /> : <Sparkles className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-2xl font-black text-white">
            {isFree ? 'Upgrade to Starter' : isStarter ? 'Upgrade to Pro' : 'Upgrade Your Plan'}
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            {feature 
              ? `"${feature}" requires an upgrade`
              : remainingGenerations === 0 
                ? `You've used all your ${currentPlan} plan generations this month`
                : `You have ${remainingGenerations} generation${remainingGenerations !== 1 ? 's' : ''} left`}
          </p>
        </div>

        {/* Comparison Bar */}
        <div className="bg-zinc-900/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm capitalize">{currentPlan} Plan</span>
            <span className="text-zinc-600 text-sm">→</span>
            <span className="text-white font-bold">{isFree ? 'Starter' : 'Pro'} Plan</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full ${
              isFree ? 'w-1/5' : 'w-1/2'
            }`} />
          </div>
          <div className="flex justify-between text-xs text-zinc-600 mt-2">
            {isFree ? (
              <>
                <span>5 ebooks/month</span>
                <span>15 ebooks/month</span>
              </>
            ) : (
              <>
                <span>15 ebooks/month</span>
                <span>50 ebooks/month</span>
              </>
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-6">
          {isFree ? (
            // Free → Starter features
            [
              '15 ebook generations per month (vs 5 on Free)',
              'Up to 6 chapters per ebook (vs 3 on Free)',
              'Premium PDF layout',
              'Chapter images included',
              'No watermark on exports',
              'Faster generation speed',
              '8 accent color themes',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-zinc-300">{feature}</span>
              </div>
            ))
          ) : (
            // Starter → Pro features
            [
              '50 ebook generations per month (vs 15)',
              'Up to 12 chapters per ebook (vs 6)',
              'Priority generation speed',
              'PDF customization (fonts & layouts)',
              'Multiple export formats (PDF + DOCX)',
              'AI cover image generation',
              'Priority support',
              'Unlimited regenerations (free)'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-zinc-300">{feature}</span>
              </div>
            ))
          )}
        </div>

        {/* CTA Button */}
        <Link
          href="/pricing"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition"
        >
          {isFree ? 'Upgrade to Starter - $9/month' : isStarter ? 'Upgrade to Pro - $19/month' : 'View Pricing'}
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-center text-[10px] text-zinc-600 mt-4">
          Cancel anytime • 30-day money-back guarantee
        </p>
      </div>
    </div>
  )
}