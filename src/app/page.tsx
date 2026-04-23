"use client";

import { useRouter } from "next/navigation";
import {
  Zap,
  TrendingUp,
  Download,
  Sparkles,
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Layers,
  Cpu,
  Play,
  Star,
  MessageSquare,
  HelpCircle,
  X,
  Palette,
  FileText,
  Rocket,
  Brain,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();

  // Add this inside your component, after the other useEffects
useEffect(() => {
  const carousel = document.getElementById('tech-carousel');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  
  if (prevBtn && nextBtn && carousel) {
    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -200, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: 200, behavior: 'smooth' });
    });
  }
}, []);

  return (
    <main className="min-h-screen bg-[#0f1117] text-zinc-200 selection:bg-indigo-500/30 font-sans cursor-default">
      {/* Background Lighting & Textures */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Dynamic Top Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-2.5 text-center relative z-[60]">
        <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.3em]">
          ✨ START FOR FREE • NO CREDIT CARD NEEDED ✨
        </p>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl border-b border-white/[0.05] bg-[#0f1117]/80">
        <div className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center overflow-hidden">
              <Image
                src="/digiforge_logo.png"
                alt="DigiForge AI Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">
              DigiForge<span className="text-indigo-500">AI</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Link href="#features" className="hover:text-indigo-400 transition cursor-pointer">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-indigo-400 transition cursor-pointer">
              Workflow
            </Link>
            <Link href="#reviews" className="hover:text-indigo-400 transition cursor-pointer">
              Testimonials
            </Link>
            <Link href="/pricing" className="hover:text-indigo-400 transition cursor-pointer">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="hidden sm:block text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer uppercase tracking-widest"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="bg-white text-black text-xs font-black px-6 py-3 rounded-full hover:bg-indigo-50 transition-all active:scale-95 shadow-xl cursor-pointer tracking-widest uppercase"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-800/30 border border-zinc-700/50 text-indigo-300 text-[10px] font-black px-5 py-2.5 rounded-full mb-12 shadow-2xl tracking-[0.1em]">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          AUTONOMOUS PRODUCT STUDIO
        </div>

        <h1 className="text-6xl md:text-[110px] font-black leading-[0.85] mb-10 tracking-tighter text-white">
          FORGE IDEAS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-500">
            INTO ASSETS.
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-2xl max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
          The all-in-one engine to find viral trends, design covers, and
          generate premium digital products in 60 seconds.
        </p>

        {/* Demo Video Section */}
        <div className="max-w-5xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#161922] border border-white/5 rounded-[2.5rem] aspect-video overflow-hidden flex items-center justify-center group cursor-pointer shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-transparent to-transparent" />

            <div className="z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
              <span className="mt-6 font-black text-xs tracking-[0.3em] text-white">
                WATCH 60s FORGE DEMO
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - UPDATED with REAL features */}
      <section className="max-w-7xl mx-auto px-6 py-32" id="features">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
            What's Inside the Forge
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto font-medium">
            Everything you need to go from idea to published product
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 - Trend Intelligence */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group">
            <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Trend Intelligence</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              AI-powered demand scoring that tells you exactly what to create. No more guessing what will sell.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-center gap-2">✓ Real-time market analysis</li>
              <li className="flex items-center gap-2">✓ Competition scoring</li>
              <li className="flex items-center gap-2">✓ Monetization potential</li>
            </ul>
          </div>

          {/* Feature 2 - AI Ebook Generation */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group">
            <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Brain className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-3">AI Ebook Generation</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Generate complete ebooks with chapters, key takeaways, and polished formatting in under 2 minutes.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-center gap-2">✓ 4-12 chapters per ebook</li>
              <li className="flex items-center gap-2">✓ Smart chapter structuring</li>
              <li className="flex items-center gap-2">✓ Key takeaways included</li>
            </ul>
          </div>

          {/* Feature 3 - Premium PDF Export */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group">
            <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Premium PDF Export</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Beautifully formatted, ready-to-sell PDFs with professional layouts and cover designs.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-center gap-2">✓ Multiple templates</li>
              <li className="flex items-center gap-2">✓ Accent color themes</li>
              <li className="flex items-center gap-2">✓ Unsplash cover images</li>
            </ul>
          </div>

          {/* Feature 4 - Cover Studio */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group">
            <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Cover Studio</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Direct Unsplash integration. Search millions of high-quality images and apply them instantly.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-center gap-2">✓ 1M+ free images</li>
              <li className="flex items-center gap-2">✓ One-click apply</li>
              <li className="flex items-center gap-2">✓ Preview before export</li>
            </ul>
          </div>

          {/* Feature 5 - Sales Content Generator */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group">
            <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Sales Content Generator</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Generate complete sales pages, social media posts, and email sequences for your products.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-center gap-2">✓ HTML sales pages</li>
              <li className="flex items-center gap-2">✓ Social media content</li>
              <li className="flex items-center gap-2">✓ Email marketing copy</li>
            </ul>
          </div>

          {/* Feature 6 - Commercial Rights */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group">
            <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Full Commercial Rights</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              You own 100% of everything you create. Sell on Gumroad, Amazon, Etsy, or your own store.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-center gap-2">✓ Keep 100% of profits</li>
              <li className="flex items-center gap-2">✓ No royalty fees</li>
              <li className="flex items-center gap-2">✓ Sell anywhere</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why DigiForgeAI - Comparison Section */}
      <section className="max-w-7xl mx-auto px-6 py-32" id="how-it-works">
        <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                The unfair <br />
                advantage for <br />
                digital creators.
              </h2>
              <p className="text-indigo-100 text-lg opacity-90 mb-12 max-w-md">
                Traditional product creation is dead. We've automated the grunt
                work so you can focus on scaling your revenue.
              </p>

              <div className="space-y-6">
                {[
                  "AI-Driven Trend Analysis — Target high-demand niches.",
                  "Instant Visual Studio — Pro covers via Unsplash API.",
                  "Autonomous PDF Engine — Export in seconds, not weeks.",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="bg-white/20 p-1.5 rounded-full group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white text-lg">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Card */}
            <div className="bg-[#0f1117]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-4xl transform lg:rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-10">
                <div>
                  <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> 
                    The Slow Way
                  </h4>
                  <div className="space-y-4">
                    {[
                      "2 weeks of research & writing",
                      "$500+ on ghostwriters",
                      "$200 on cover designers",
                      "Infinite formatting headaches",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-zinc-400/70 text-sm line-through decoration-red-500/50">
                        <span className="text-red-500/50">•</span> {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full" />

                <div>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 
                    The Forge Way
                  </h4>
                  <div className="space-y-5">
                    {[
                      { t: "60-Second Generation", d: "From idea to full draft" },
                      { t: "Zero Cost MVP", d: "No designers or writers needed" },
                      { t: "Auto-Styling Engine", d: "Beautiful PDFs out of the box" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-black text-white text-sm">{item.t}</p>
                          <p className="text-[11px] text-zinc-500 uppercase tracking-tighter">{item.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white text-black font-black px-6 py-4 rounded-2xl shadow-2xl text-xs tracking-widest uppercase transform -rotate-3">
                10x Faster
              </div>
            </div>
          </div>
        </div>
      </section>

{/* Trusted Platforms - Auto-scrolling Carousel */}
<section className="max-w-7xl mx-auto px-6 py-20 overflow-hidden">
  <div className="text-center mb-8">
    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3">
      SELL ANYWHERE
    </p>
    <h2 className="text-xl md:text-2xl font-black text-white">
      Publish Wherever You Want
    </h2>
  </div>

  {/* Auto-scrolling carousel */}
  <div className="relative">
    <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-[#0f1117] to-transparent z-10 pointer-events-none" />
    <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-[#0f1117] to-transparent z-10 pointer-events-none" />
    
    <div className="overflow-hidden">
      <div className="flex gap-12 animate-scroll" style={{ width: 'max-content' }}>
        {/* First set */}
        {[...Array(2)].map((_, setIdx) => (
          <div key={setIdx} className="flex gap-12">
            {[
              { name: "Gumroad", icon: "🛒", bg: "bg-pink-500/10" },
              { name: "Payhip", icon: "💳", bg: "bg-blue-500/10" },
              { name: "Etsy", icon: "🏪", bg: "bg-orange-500/10" },
              { name: "Amazon KDP", icon: "📚", bg: "bg-yellow-500/10" },
              { name: "Your Website", icon: "🌐", bg: "bg-indigo-500/10" },
              { name: "Social Media", icon: "📱", bg: "bg-purple-500/10" },
              { name: "Gumroad", icon: "🛒", bg: "bg-pink-500/10" },
              { name: "Payhip", icon: "💳", bg: "bg-blue-500/10" },
              { name: "Etsy", icon: "🏪", bg: "bg-orange-500/10" },
              { name: "Amazon KDP", icon: "📚", bg: "bg-yellow-500/10" },
              { name: "Your Website", icon: "🌐", bg: "bg-indigo-500/10" },
              { name: "Social Media", icon: "📱", bg: "bg-purple-500/10" },
            ].map((platform, i) => (
              <div
                key={`${setIdx}-${i}`}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl ${platform.bg} border border-white/5 min-w-[120px] transition-all hover:scale-105 hover:border-indigo-500/30`}
              >
                <span className="text-3xl mb-2">{platform.icon}</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Simple Stats */}
  <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/5">
    <div className="text-center">
      <p className="text-2xl font-black text-white">1,000+</p>
      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Active Creators</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-black text-white">5,000+</p>
      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Ebooks Forged</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-black text-white">$50K+</p>
      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Creator Revenue</p>
    </div>
  </div>
</section>

      {/* Reviews Section */}
      <section className="max-w-7xl mx-auto px-6 py-32" id="reviews">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
            Forged by Creators.
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto font-medium">
            Join hundreds of entrepreneurs who have automated their digital product workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Sarah Jenkins",
              role: "Gumroad Seller",
              text: "I used to spend $400 per guide on ghostwriters. I forged my last 3 guides in one afternoon for free. The quality is insane.",
              stars: 5,
              img: "SJ",
            },
            {
              name: "David Kpodo",
              role: "Niche Marketer",
              text: "The Trend Intelligence tool is a cheat code. It found a sub-niche in 'Accounting' I never would have thought of.",
              stars: 5,
              img: "DK",
            },
            {
              name: "Marcus Thorne",
              role: "SaaS Founder",
              text: "The Unsplash integration and auto-PDF formatting saved me at least 10 hours of design work. Best Platform I've seen this year.",
              stars: 5,
              img: "MT",
            },
          ].map((review, i) => (
            <div key={i} className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 flex flex-col justify-between group hover:border-indigo-500/50 transition-all duration-300">
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(review.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                  ))}
                </div>
                <p className="text-zinc-300 leading-relaxed italic mb-8">"{review.text}"</p>
              </div>

              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {review.img}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{review.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN CTA SECTION - Only ONE */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative isolate overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-24 shadow-2xl rounded-[3rem] sm:px-24 xl:py-32">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/20 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-black tracking-tighter text-white sm:text-6xl uppercase leading-tight">
              Ready to Start <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-white">
                Forging?
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100 font-medium">
              Join thousands of creators using DigiForge to build their digital product empire.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/dashboard/generate"
                className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-indigo-50 text-indigo-600 font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
              >
                Start Forging Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/pricing"
                className="w-full sm:w-auto px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border border-white/20 transition-all uppercase tracking-widest text-xs"
              >
                View Pricing →
              </Link>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-indigo-600 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  +1k
                </div>
              </div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">
                Join 1000+ creators forging today
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-center text-3xl font-black text-white mb-16 uppercase tracking-widest">
          Questions?
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Is the content truly unique?",
              a: "Yes. Every 'Forge' cycle uses dynamic AI prompts to ensure your guide is one-of-a-kind.",
            },
            {
              q: "Can I sell these PDFs on Gumroad?",
              a: "Absolutely. You own 100% of the rights to any product you forge.",
            },
            {
              q: "Do I need design skills?",
              a: "Zero. Our studio handles layouts, typography, and imagery automatically.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-zinc-900/20 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900/40 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">{item.q}</h4>
                <HelpCircle className="w-5 h-5 text-zinc-700 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-20 pb-12 border-t border-white/[0.03] relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center overflow-hidden">
                <Image
                  src="/digiforge_logo.png"
                  alt="DigiForge AI Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-black text-2xl tracking-tighter text-white uppercase">
                DigiForge<span className="text-indigo-500">AI</span>
              </span>
            </div>
            <p className="text-zinc-500 text-lg leading-relaxed font-medium max-w-sm">
              The industrial-grade engine for the next generation of digital entrepreneurs. Forge wealth from pure ideas.
            </p>
            <div className="flex gap-5">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="md:col-span-2 space-y-6">
            <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">Platform</h5>
            <ul className="text-zinc-500 text-sm space-y-4 font-bold">
              <li><Link href="#features" className="hover:text-indigo-400 transition-colors">Trend Intelligence</Link></li>
              <li><Link href="/dashboard/generate" className="hover:text-indigo-400 transition-colors">Studio Editor</Link></li>
              <li><Link href="/dashboard/generate" className="hover:text-indigo-400 transition-colors">AI Templates</Link></li>
              <li><Link href="#integrations" className="hover:text-indigo-400 transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-2 space-y-6">
            <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">
              Company
            </h5>
            <ul className="text-zinc-500 text-sm space-y-4 font-bold">
              <li className="hover:text-indigo-400 transition-colors cursor-pointer">
                Our Vision
              </li>
              <li
                onClick={() => router.push("/affiliates")}
                className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
              >
                Affiliates
              </li>
              <li
                onClick={() => router.push("/privacy")}
                className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
              >
                Privacy Policy
              </li>
              <li
                onClick={() => router.push("/terms")}
                className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
              >
                Terms of Service
              </li>
            </ul>
          </div>
          {/* Support Column */}
          <div className="md:col-span-4 space-y-8">
            <div className="space-y-4">
              <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">Join the Forge</h5>
              <div className="flex gap-2 p-1.5 bg-zinc-900/50 border border-white/5 rounded-2xl focus-within:border-indigo-500/50 transition-all">
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-transparent border-none outline-none text-sm px-3 flex-1 text-white placeholder:text-zinc-700"
                />
                <button
                  onClick={() => {
                    const email = (document.getElementById("footer-email") as HTMLInputElement).value;
                    router.push(`/signup?email=${encodeURIComponent(email)}`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">Support & Contact</h5>
              <a href="mailto:support@digiforgeai.app" className="group flex items-center gap-3 p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl hover:border-indigo-500/40 transition-all cursor-pointer">
                <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Email Us</p>
                  <p className="text-[10px] text-zinc-500 font-bold">support@digiforgeai.app</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-zinc-900/50 gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] font-black text-zinc-700 tracking-[0.4em] uppercase">
              © 2026 DIGIFORGE AI. ALL RIGHTS RESERVED.
            </p>
            <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">
              Built with love in Accra • Ghana
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}