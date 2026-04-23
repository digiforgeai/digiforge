// components/MonetizationPanel.tsx
'use client'

import { useState } from 'react'
import { 
  DollarSign, ShoppingCart, X, Mail, Copy, Check, 
  Sparkles, ExternalLink, Briefcase, FileText, Code, 
  Share2, MessageCircle, Download, Eye, Zap
} from 'lucide-react'

interface MonetizationPanelProps {
  ebookData: {
    title: string
    subtitle: string
    chapters: any[]
    targetAudience?: string
  }
}

export function MonetizationPanel({ ebookData }: MonetizationPanelProps) {
  const [activeTab, setActiveTab] = useState<'sell' | 'sales-page' | 'bundle'>('sell')
  const [salesPage, setSalesPage] = useState<any>(null)
  const [bundle, setBundle] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const suggestedPrices = [
    { value: 7, label: '$7', desc: 'Impulse buy', color: 'bg-green-500' },
    { value: 12, label: '$12', desc: 'Standard', color: 'bg-blue-500' },
    { value: 19, label: '$19', desc: 'Premium', color: 'bg-indigo-500' },
    { value: 29, label: '$29', desc: 'Value pack', color: 'bg-purple-500' }
  ]

  const platforms = [
    { name: 'Gumroad', url: 'https://gumroad.com', icon: '🛒', color: 'bg-pink-500' },
    { name: 'Payhip', url: 'https://payhip.com', icon: '💳', color: 'bg-blue-500' },
    { name: 'Etsy', url: 'https://etsy.com', icon: '🏪', color: 'bg-orange-500' },
    { name: 'Amazon KDP', url: 'https://kdp.amazon.com', icon: '📚', color: 'bg-yellow-600' }
  ]

  const generateSalesPage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sales-page', ebookData })
      })
      const data = await res.json()
      if (data.success && data.data) {
        setSalesPage(data.data)
      }
    } catch (error) {
      console.error('Failed to generate sales page:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateBundle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bundle', ebookData })
      })
      const data = await res.json()
      if (data.success && data.data) {
        setBundle(data.data)
      }
    } catch (error) {
      console.error('Failed to generate bundle:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Generate Gumroad/Payhip ready description
  const getMarketplaceDescription = () => {
    return `${ebookData.title}

${ebookData.subtitle}

What You'll Get:
${ebookData.chapters?.map((ch, i) => `${i + 1}. ${ch.title}`).join('\n')}

Perfect for ${ebookData.targetAudience || 'entrepreneurs'} who want to:
✓ Save time with ready-to-use strategies
✓ Avoid common mistakes
✓ Get results faster
✓ Learn from real examples

Instant PDF Download • Lifetime Access • Money-Back Guarantee`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'sell'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Sell
        </button>
        <button
          onClick={() => {
            setActiveTab('sales-page')
            if (!salesPage) generateSalesPage()
          }}
          className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'sales-page'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code className="w-4 h-4" />
          Sales Page
        </button>
        <button
          onClick={() => {
            setActiveTab('bundle')
            if (!bundle) generateBundle()
          }}
          className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'bundle'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Content Bundle
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'sell' && (
          <div className="space-y-6">
            {/* Suggested Price */}
            <div>
              <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Suggested Price
              </h3>
              <div className="flex gap-3 flex-wrap">
                {suggestedPrices.map(price => (
                  <button
                    key={price.value}
                    className="px-5 py-3 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition text-center min-w-[80px] group"
                  >
                    <span className="text-xl font-black text-slate-800 group-hover:text-indigo-600">
                      {price.label}
                    </span>
                    <p className="text-[10px] text-slate-400">{price.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-green-500" />
                Sell On
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map(platform => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{platform.icon}</span>
                      <span className="font-bold text-slate-700 group-hover:text-indigo-600">
                        {platform.name}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                  </a>
                ))}
              </div>
            </div>

            {/* Ready-to-use Description */}
            <div>
              <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Marketplace Description
              </h3>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {getMarketplaceDescription()}
                </pre>
                <button
                  onClick={() => copyToClipboard(getMarketplaceDescription(), 'description')}
                  className="mt-3 text-xs text-indigo-600 font-bold flex items-center gap-1 hover:text-indigo-700"
                >
                  {copied === 'description' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === 'description' ? 'Copied!' : 'Copy Description'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales-page' && (
          <div className="space-y-5">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500">Building your high-converting sales page...</p>
              </div>
            ) : salesPage ? (
              <>
                {/* Preview/Code Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                      !showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Code className="w-4 h-4 inline mr-1" /> HTML Code
                  </button>
                  <button
                    onClick={() => setShowPreview(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                      showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Eye className="w-4 h-4 inline mr-1" /> Preview
                  </button>
                </div>

                {/* HTML Code View */}
                {!showPreview && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-mono">HTML Code</span>
                      <button
                        onClick={() => copyToClipboard(salesPage.html, 'html')}
                        className="text-white/70 hover:text-white text-xs flex items-center gap-1"
                      >
                        {copied === 'html' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'html' ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <div className="p-4 bg-slate-900 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                        {salesPage.html}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Preview View */}
                {showPreview && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b">
                      <span className="text-xs font-bold text-slate-500">Live Preview</span>
                    </div>
                    <div className="h-96 overflow-y-auto">
                      <iframe
                        srcDoc={salesPage.html}
                        className="w-full h-full border-0"
                        title="Sales Page Preview"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium mb-2">💡 How to Use</p>
                  <p className="text-xs text-amber-600">
                    1. Copy the HTML code above<br />
                    2. Paste into Gumroad's "Custom HTML" section or your website<br />
                    3. Replace the download link with your actual product URL<br />
                    4. Customize colors and text as needed
                  </p>
                </div>
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'bundle' && (
          <div className="space-y-5">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500">Creating your content bundle...</p>
              </div>
            ) : bundle ? (
              <>
                {/* Twitter Thread */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      <span className="text-xs font-bold">Twitter Thread</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bundle.twitterThread, 'twitter')}
                      className="text-white/70 hover:text-white"
                    >
                      {copied === 'twitter' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white max-h-48 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{bundle.twitterThread}</p>
                  </div>
                </div>

                {/* LinkedIn Post */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs font-bold">LinkedIn Post</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bundle.linkedinPost, 'linkedin')}
                      className="text-white/70 hover:text-white"
                    >
                      {copied === 'linkedin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white max-h-48 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{bundle.linkedinPost}</p>
                  </div>
                </div>

                {/* Instagram Caption */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs font-bold">Instagram Caption</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bundle.instagramCaption, 'instagram')}
                      className="text-white/70 hover:text-white"
                    >
                      {copied === 'instagram' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white max-h-48 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{bundle.instagramCaption}</p>
                  </div>
                </div>

                {/* Facebook Post */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-blue-700 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">Facebook Post</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bundle.facebookPost, 'facebook')}
                      className="text-white/70 hover:text-white"
                    >
                      {copied === 'facebook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white max-h-48 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{bundle.facebookPost}</p>
                  </div>
                </div>

                {/* Gumroad Description */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-pink-500 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-xs font-bold">Gumroad Description</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bundle.gumroadDescription, 'gumroad')}
                      className="text-white/70 hover:text-white"
                    >
                      {copied === 'gumroad' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white max-h-48 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{bundle.gumroadDescription}</p>
                  </div>
                </div>

                {/* Email Sequence */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs font-bold">Email Sequence</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bundle.emailSequence, 'email')}
                      className="text-white/70 hover:text-white"
                    >
                      {copied === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white max-h-64 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{bundle.emailSequence}</p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}