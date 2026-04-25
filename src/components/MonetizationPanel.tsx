// components/MonetizationPanel.tsx
'use client'

import { useState } from 'react'
import { 
  FileText, 
  Copy, 
  Check, 
  Loader2,
  Mail,
  Package,
  Sparkles,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  ShoppingBag
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface MonetizationPanelProps {
  ebookData: {
    title: string
    subtitle: string
    chapters: any[]
    targetAudience?: string
  }
  userPlan: string
}

type ContentType = 'sales-page' | 'social-threads' | 'email-sequence' | 'bundle-description'

export function MonetizationPanel({ ebookData, userPlan }: MonetizationPanelProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('sales-page')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<Record<ContentType, string>>({
    'sales-page': '',
    'social-threads': '',
    'email-sequence': '',
    'bundle-description': '',
  })
  const [copied, setCopied] = useState<ContentType | null>(null)

  // Only show for Starter and Pro users
  if (userPlan === 'free') {
    return (
      <div className="relative bg-white rounded-xl border border-slate-200 p-4 sm:p-6 text-center">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">Unlock Monetization Tools</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 px-2">
              Generate sales pages, social media content, and email sequences to sell your ebook.
            </p>
            <Link 
              href="/pricing" 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition text-sm"
            >
              Upgrade to Starter
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
        <div className="blur-sm opacity-50 pointer-events-none">
          <div className="h-24 sm:h-32 bg-slate-100 rounded-lg mb-4" />
          <div className="h-16 sm:h-20 bg-slate-100 rounded-lg" />
        </div>
      </div>
    )
  }

  const generateContent = async (type: ContentType) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/generate-sales-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          ebookData,
          userPlan,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedContent(prev => ({ ...prev, [type]: data.content }))
        toast.success(`${getTypeLabel(type)} generated successfully!`)
      } else {
        toast.error(data.message || 'Generation failed')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate content')
    } finally {
      setGenerating(false)
    }
  }

  const getTypeLabel = (type: ContentType): string => {
    const labels = {
      'sales-page': 'Sales Page',
      'social-threads': 'Social Media Threads',
      'email-sequence': 'Email Sequence',
      'bundle-description': 'Bundle Description',
    }
    return labels[type]
  }

  const copyToClipboard = async (type: ContentType) => {
    const content = generatedContent[type]
    if (!content) return
    
    await navigator.clipboard.writeText(content)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copied to clipboard!')
  }

  const tabs = [
    { id: 'sales-page' as ContentType, label: 'Sales Page', icon: ShoppingBag, description: 'High-converting sales copy' },
    { id: 'social-threads' as ContentType, label: 'Social Threads', icon: MessageSquare, description: 'Twitter/LinkedIn threads' },
    { id: 'email-sequence' as ContentType, label: 'Email Sequence', icon: Mail, description: '5-part nurture sequence' },
    { id: 'bundle-description' as ContentType, label: 'Bundle Description', icon: Package, description: 'Product bundle copy' },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">Monetization Suite</h3>
            <p className="text-amber-100 text-[11px] sm:text-sm">Generate ready-to-use sales content for your ebook</p>
          </div>
          {userPlan === 'pro' && (
            <div className="bg-white/20 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 self-start sm:self-auto">
              <span className="text-[10px] sm:text-xs font-bold text-white">PRO FEATURE</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs - Mobile Optimized with horizontal scroll */}
      <div className="border-b border-slate-200 px-2 sm:px-4 overflow-x-auto">
        <div className="flex gap-0.5 sm:gap-1 min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const hasContent = generatedContent[tab.id]
            const isGenerating = generating && activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                {hasContent && !isGenerating && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full" />
                )}
                {isGenerating && (
                  <Loader2 className="w-2 h-2 sm:w-3 sm:h-3 animate-spin ml-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area - Mobile Optimized */}
      <div className="p-3 sm:p-6">
        {!generatedContent[activeTab] && !generating ? (
          // Empty State - Mobile Optimized
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 mb-2">
              Generate {getTypeLabel(activeTab)}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4 sm:mb-6 px-2">
              {activeTab === 'sales-page' && 'Create a high-converting sales page that showcases your ebook\'s value proposition and drives purchases.'}
              {activeTab === 'social-threads' && 'Generate viral-ready Twitter/LinkedIn threads that build anticipation and engagement.'}
              {activeTab === 'email-sequence' && 'Create a 5-part email sequence for launching your ebook to your list.'}
              {activeTab === 'bundle-description' && 'Write compelling bundle copy for selling on Gumroad, Etsy, or Shopify.'}
            </p>
            <button
              onClick={() => generateContent(activeTab)}
              disabled={generating}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition text-sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Generate {getTypeLabel(activeTab)}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          // Generated Content View - Mobile Optimized
          <div>
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                  AI Generated
                </span>
                <span className="text-[9px] sm:text-xs text-slate-400">
                  Ready to copy & paste
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(activeTab)}
                className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition py-1"
              >
                {copied === activeTab ? (
                  <>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                    <span className="text-[10px] sm:text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs">Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 sm:p-5 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-[11px] sm:text-sm text-slate-700 leading-relaxed">
                {generatedContent[activeTab]}
              </pre>
            </div>

            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => generateContent(activeTab)}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-2 sm:py-2.5 rounded-lg transition text-xs sm:text-sm"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                Regenerate
              </button>
              <button
                onClick={() => copyToClipboard(activeTab)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 sm:py-2.5 rounded-lg transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                Copy & Use
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips Section - Mobile Optimized */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-800">Pro Tips</p>
            <p className="text-[10px] sm:text-xs text-slate-500 break-words">
              {activeTab === 'sales-page' && 'Add social proof and urgency to increase conversion rates. Test different headlines.'}
              {activeTab === 'social-threads' && 'Post one thread per day for 3 days before launch. Reply to comments to boost engagement.'}
              {activeTab === 'email-sequence' && 'Personalize the emails with your brand voice. Send every 24-48 hours.'}
              {activeTab === 'bundle-description' && 'Highlight the value vs price. Compare to similar products in your niche.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}