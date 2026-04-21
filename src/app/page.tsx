"use client";

import { useRouter } from "next/navigation";
import {
  Zap,
  TrendingUp,
  Download,
  Sparkles,
  ArrowRight,
  BookOpen,
  DollarSign,
  Image as ImageIcon,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  Globe,
  MousePointer2,
  Layers,
  Cpu,
  Play,
  Star,
  Quote,
  MessageSquare,
  HelpCircle,
  X,
  Terminal,
} from "lucide-react";
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter();

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
          MVP RELEASE: 100% FREE ACCESS FOR THE FIRST 500 USERS ⚡️
        </p>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl border-b border-white/[0.05] bg-[#0f1117]/80">
        <div className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center overflow-hidden">
  <Image 
    src="/digiforge_logo.png" // Next.js looks in the 'public' folder by default
    alt="DigiForge AI Logo"
    width={24}  // Equivalent to w-6
    height={24} // Equivalent to h-6
    className="object-contain"
    priority // This ensures the logo loads instantly
  />
</div>
            <span className="font-black text-2xl tracking-tighter text-white">
              DigiForge<span className="text-indigo-500">AI</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-indigo-400 transition cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-indigo-400 transition cursor-pointer"
            >
              The Workflow
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("reviews")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-indigo-400 transition cursor-pointer"
            >
              Testimonials
            </button>
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
          AUTONOMOUS PRODUCT STUDIO v1.0
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

      {/* Collaboration / Social Proof */}
      <section
        className="max-w-7xl mx-auto px-6 py-20 border-y border-white/[0.03]"
        id="integrations"
      >
        <p className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-12">
          INTEGRATED WITH INDUSTRY GIANTS
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="font-black text-2xl tracking-tighter italic">
            OPENAI
          </div>
          <div className="font-black text-2xl tracking-tighter">UNSPLASH</div>
          <div className="font-black text-2xl tracking-tighter italic">
            GUMROAD
          </div>
          <div className="font-black text-2xl tracking-tighter">STRIPE</div>
          <div className="font-black text-2xl tracking-tighter italic">
            PAYHIP
          </div>
        </div>
      </section>

      {/* Feature Bento Grid (Modified for clarity) */}
      <section className="max-w-7xl mx-auto px-6 py-32" id="features">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-zinc-900/30 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
            <TrendingUp className="w-12 h-12 text-indigo-500 mb-8" />
            <h3 className="text-4xl font-black text-white mb-6">
              Market Alpha Intelligence
            </h3>
            <p className="text-zinc-500 text-lg max-w-lg">
              Don't guess what sells. Our AI analyzes global demand scores to
              ensure your product has a hungry audience before you even hit
              'Forge'.
            </p>
            <div className="absolute right-[-40px] bottom-[-40px] opacity-10 group-hover:rotate-12 transition-all duration-700">
              <Layers className="w-80 h-80 text-indigo-500" />
            </div>
          </div>

          <div className="md:col-span-4 bg-zinc-900/30 border border-white/5 rounded-[3rem] p-12 flex flex-col justify-between">
            <ImageIcon className="w-12 h-12 text-purple-500" />
            <div>
              <h3 className="text-2xl font-black text-white mb-4">
                Studio Visuals
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed text-balance">
                Direct Unsplash API hook. Search and apply high-converting cover
                art in one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why DigiForgeAI - Comparison & Transformation Section */}
      <section className="max-w-7xl mx-auto px-6 py-32" id="how-it-works">
        <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
          {/* Decorative background element for extra "pop" */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                The unfair <br />
                advantage for <br />
                digital creators.
              </h2>
              <p className="text-indigo-100 text-lg opacity-90 mb-12 max-w-md">
                Traditional product creation is dead. We’ve automated the grunt
                work so you can focus on scaling your revenue.
              </p>

              {/* Core Value Props */}
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

            {/* THE COMPARISON CARD (Replacing the testimonial) */}
            <div className="bg-[#0f1117]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-4xl transform lg:rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-10">
                {/* Section: The Old Way */}
                <div>
                  <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />{" "}
                    The Slow Way
                  </h4>
                  <div className="space-y-4">
                    {[
                      "2 weeks of research & writing",
                      "$500+ on ghostwriters",
                      "$200 on cover designers",
                      "Infinite formatting headaches",
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-zinc-400/70 text-sm line-through decoration-red-500/50"
                      >
                        <span className="text-red-500/50">•</span> {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/5 w-full" />

                {/* Section: The DigiForge Way */}
                <div>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
                    The Forge Way
                  </h4>
                  <div className="space-y-5">
                    {[
                      {
                        t: "60-Second Generation",
                        d: "From idea to full draft",
                      },
                      {
                        t: "Zero Cost MVP",
                        d: "No designers or writers needed",
                      },
                      {
                        t: "Auto-Styling Engine",
                        d: "Beautiful PDFs out of the box",
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-black text-white text-sm">
                            {item.t}
                          </p>
                          <p className="text-[11px] text-zinc-500 uppercase tracking-tighter">
                            {item.d}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge for extra 'premium' feel */}
              <div className="absolute -bottom-6 -right-6 bg-white text-black font-black px-6 py-4 rounded-2xl shadow-2xl text-xs tracking-widest uppercase transform -rotate-3">
                10x Faster
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews / Wall of Proof Section */}
      <section className="max-w-7xl mx-auto px-6 py-32" id="reviews">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
            Forged by Creators.
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto font-medium">
            Join hundreds of entrepreneurs who have automated their digital
            product workflow.
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
              text: "The Unsplash integration and auto-PDF formatting saved me at least 10 hours of design work. Best MVP I've seen this year.",
              stars: 5,
              img: "MT",
            },
          ].map((review, i) => (
            <div
              key={i}
              className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 flex flex-col justify-between group hover:border-indigo-500/50 transition-all duration-300"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(review.stars)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-indigo-500 fill-indigo-500"
                    />
                  ))}
                </div>
                <p className="text-zinc-300 leading-relaxed italic mb-8">
                  "{review.text}"
                </p>
              </div>

              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {review.img}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{review.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    {review.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge Below Reviews */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Verified Results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              24/7 Creator Support
            </span>
          </div>
        </div>
      </section>

      {/* MVP Pricing - Simple & Free */}
      <section className="max-w-7xl mx-auto px-6 py-32 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-b from-zinc-800/50 to-transparent border border-white/5 rounded-[3rem] p-16">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8 block">
            THE MVP SPECIAL
          </span>
          <h2 className="text-5xl font-black text-white mb-6">
            Forge for Free.
          </h2>
          <p className="text-zinc-500 mb-12 text-lg">
            We're in early access. No subscriptions. No hidden fees. Just build.
          </p>
          <div className="text-7xl font-black text-white mb-12">
            $0<span className="text-xl text-zinc-700 font-normal">/mo</span>
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-2xl transition-all shadow-3xl cursor-pointer tracking-[0.2em] uppercase text-sm">
            Claim Your Spot Now
          </button>
          <p className="mt-8 text-xs text-zinc-600">
            Limited to first 500 beta users. 412 slots remaining.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 py-32">
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
            <div
              key={i}
              className="bg-zinc-900/20 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">{item.q}</h4>
                <HelpCircle className="w-5 h-5 text-zinc-700 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Closing CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative isolate overflow-hidden bg-zinc-900 px-6 py-24 shadow-2xl rounded-[3rem] sm:px-24 xl:py-32 border border-white/5">
          {/* Decorative Background Glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-black tracking-tighter text-white sm:text-6xl uppercase leading-tight">
              Ready to build your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                Digital Empire?
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-400 font-medium">
              Stop trading time for money. Use the Forge to turn your expertise
              into automated revenue streams in under 60 seconds.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => router.push("/signup")}
                className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group uppercase tracking-widest text-xs cursor-pointer"
              >
                Get Started for Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all uppercase tracking-widest text-xs cursor-pointer"
              >
                Learn more
              </button>
            </div>

            {/* Social Proof Mini-Ticker */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center overflow-hidden"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white">
                  +1k
                </div>
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Join 1000+ creators forging today
              </p>
            </div>
          </div>

          {/* Subtle Grid Pattern Overlay */}
          <div
            className="absolute inset-0 -z-10 opacity-10 [mask-image:radial-gradient(45rem_45rem_at_top,white,transparent)]"
            style={{
              backgroundImage:
                "radial-gradient(#ffffff 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
      </section>

      {/* Final Enhanced Footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-32 pb-12 border-t border-white/[0.03] relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer">
                          <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center overflow-hidden">
  <Image 
    src="/digiforge_logo.png" // Next.js looks in the 'public' folder by default
    alt="DigiForge AI Logo"
    width={24}  // Equivalent to w-6
    height={24} // Equivalent to h-6
    className="object-contain"
    priority // This ensures the logo loads instantly
  />
</div>
              <span className="font-black text-2xl tracking-tighter text-white uppercase">
                DigiForge<span className="text-indigo-500">AI</span>
              </span>
            </div>
            <p className="text-zinc-500 text-lg leading-relaxed font-medium max-w-sm">
              The industrial-grade engine for the next generation of digital
              entrepreneurs. Forge wealth from pure ideas.
            </p>
            <div className="flex gap-5">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                <Globe className="w-5 h-5" />{" "}
                {/* Using Globe as a safe fallback for Github icon issues */}
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          {/* Links Column 1: Platform */}
          <div className="md:col-span-2 space-y-6">
            <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">
              Platform
            </h5>
            <ul className="text-zinc-500 text-sm space-y-4 font-bold">
              <li>
                <button
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Trend Intelligence
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push("/login")}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Studio Editor
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push("/login")}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  AI Templates
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    document
                      .getElementById("integrations")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Integrations
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
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

          {/* Newsletter & Support Column */}
          <div className="md:col-span-4 space-y-8">
            <div className="space-y-4">
              <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">
                Join the Forge
              </h5>
              <div className="flex gap-2 p-1.5 bg-zinc-900/50 border border-white/5 rounded-2xl focus-within:border-indigo-500/50 transition-all">
                <input
                  id="footer-email" // Added ID to grab the value
                  type="email"
                  placeholder="Enter your email"
                  className="bg-transparent border-none outline-none text-sm px-3 flex-1 text-white placeholder:text-zinc-700"
                />
                <button
                  onClick={() => {
                    const email = (
                      document.getElementById(
                        "footer-email",
                      ) as HTMLInputElement
                    ).value;
                    // Redirect to auth page with the email in the query string
                    router.push(`/signup?email=${encodeURIComponent(email)}`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">
                Support & Contact
              </h5>
              <a
                href="mailto:support@digiforge.ai"
                className="group flex items-center gap-3 p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl hover:border-indigo-500/40 transition-all cursor-pointer"
              >
                <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">
                    Email Us
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold">
                    support@digiforgeai.app
                  </p>
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

          <div className="flex items-center gap-6">
            {/* Dynamic Status Indicator */}
            {/* <div className="flex items-center gap-3 bg-zinc-900/80 px-5 py-2.5 rounded-full border border-white/5 shadow-inner">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 relative z-10" />
        </div>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">System: Optimal</span>
      </div> */}
          </div>
        </div>
      </footer>
    </main>
  );
}
