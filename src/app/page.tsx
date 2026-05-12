"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Star,
  MessageSquare,
  HelpCircle,
  X,
  Globe,
  Zap,
  BookOpen,
  DollarSign,
  Users,
  TrendingUp,
  Download,
  Palette,
  Shield,
  Play,
  ChevronRight,
  Sparkles,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

// ─── Scroll-triggered animation hook ────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Types ───────────────────────────────────────────────────────────────────
type FaqItem = { q: string; a: string };

// ─── FAQ Accordion ───────────────────────────────────────────────────────────
function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
            open === i
              ? "border-indigo-500/50 bg-indigo-500/5"
              : "border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40"
          }`}
          onClick={() => setOpen(open === i ? null : i)}
        >
          <div className="flex items-center justify-between px-8 py-5">
            <h4 className="font-bold text-white text-sm md:text-base">
              {item.q}
            </h4>
            <ChevronRight
              className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-300 ${open === i ? "rotate-90 text-indigo-400" : ""}`}
            />
          </div>
          {open === i && (
            <div className="px-8 pb-6 text-sm text-zinc-400 leading-relaxed">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Who It's For cards ─────────────────────────────────────────────────────
const AUDIENCE = [
  {
    icon: "✍️",
    label: "Content Creators",
    desc: "Turn your knowledge into sellable guides.",
  },
  {
    icon: "🎓",
    label: "Students",
    desc: "Monetize what you're already learning.",
  },
  {
    icon: "💼",
    label: "Freelancers",
    desc: "Add passive income without extra client work.",
  },
  {
    icon: "🏋️",
    label: "Coaches & Experts",
    desc: "Package your expertise into premium products.",
  },
  {
    icon: "💡",
    label: "Side Hustlers",
    desc: "Start a digital product business in one afternoon.",
  },
  {
    icon: "🛒",
    label: "Online Sellers",
    desc: "Expand your store with unlimited digital goods.",
  },
];

// ─── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Find What Sells",
    desc: "Our AI scans real market demand to surface high-potential niches. No more guessing what to create.",
    badge: "Trend Intelligence",
  },
  {
    num: "02",
    icon: <Sparkles className="w-6 h-6" />,
    title: "Generate Your Product",
    desc: "Type your topic, hit generate. Full ebook with chapters, takeaways, and polished formatting — done in 60 seconds.",
    badge: "AI Generation",
  },
  {
    num: "03",
    icon: <Palette className="w-6 h-6" />,
    title: "Design & Customize",
    desc: "Pick a cover from 1M+ Unsplash images, choose your color theme, and preview before you export.",
    badge: "Cover Studio",
  },
  {
    num: "04",
    icon: <DollarSign className="w-6 h-6" />,
    title: "Publish & Earn",
    desc: "Export to PDF, list on Gumroad, Etsy, or your own site. You keep 100% of every sale.",
    badge: "Full Ownership",
  },
];

// ─── Feature Grid ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <TrendingUp className="w-6 h-6 text-indigo-400" />,
    title: "Trend Intelligence",
    desc: "Find high-demand niches before your competitors do. Real market data, scored and ranked for you.",
    pills: ["Market demand scoring", "Competition analysis", "Niche discovery"],
  },
  {
    icon: <Zap className="w-6 h-6 text-indigo-400" />,
    title: "60-Second Ebook Generator",
    desc: "From topic to fully structured ebook with chapters, key takeaways, and polished copy.",
    pills: ["4–12 chapters", "Smart structure", "Key takeaways"],
  },
  {
    icon: <Download className="w-6 h-6 text-indigo-400" />,
    title: "Premium PDF Export",
    desc: "Beautiful, ready-to-sell PDFs that look like they cost $500 to design. Multiple layout templates.",
    pills: ["Multiple templates", "Accent color themes", "Instant download"],
  },
  {
    icon: <BookOpen className="w-6 h-6 text-indigo-400" />,
    title: "Cover Studio",
    desc: "Search 1M+ Unsplash images and apply them with one click. No Canva. No Photoshop.",
    pills: ["1M+ free images", "One-click apply", "Live preview"],
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-indigo-400" />,
    title: "Sales Content Generator",
    desc: "Auto-generate the listing copy, social posts, and email sequences to actually market your product.",
    pills: ["Sales page copy", "Social captions", "Email templates"],
  },
  {
    icon: <Shield className="w-6 h-6 text-indigo-400" />,
    title: "100% Yours to Sell",
    desc: "No royalties. No hidden fees. Everything you create is yours — forever.",
    pills: ["Full commercial rights", "No royalty fees", "Sell anywhere"],
  },
];

// ─── Reviews ─────────────────────────────────────────────────────────────────
const REVIEWS = [
  {
    name: "Sarah Jenkins",
    role: "Gumroad Seller",
    text: "I used to spend $400 per guide on ghostwriters. I made 3 ebooks in one afternoon with DigiForge. The quality? Genuinely insane.",
    stars: 5,
    initials: "SJ",
    earned: "$1,200+",
  },
  {
    name: "David Kpodo",
    role: "Niche Marketer",
    text: "The Trend Intelligence tool found a sub-niche I never would've thought of. First ebook made $340 in the first week.",
    stars: 5,
    initials: "DK",
    earned: "$340",
  },
  {
    name: "Marcus Thorne",
    role: "SaaS Founder",
    text: "Unsplash integration + auto-formatting saved me 10+ hours. Best digital product tool I've found. Period.",
    stars: 5,
    initials: "MT",
    earned: "$780+",
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS: FaqItem[] = [
  {
    q: "Do I need any writing or design skills?",
    a: "None at all. Just type in your topic, click generate, and DigiForge handles everything — structure, writing, formatting, and design. You go from idea to download-ready PDF in minutes.",
  },
  {
    q: "Can I actually sell what I create?",
    a: "Yes — you own 100% of every product you generate. Sell on Gumroad, Etsy, Payhip, Amazon KDP, your own website, or anywhere else. Keep every dollar.",
  },
  {
    q: "Is the content unique or will it be the same as others?",
    a: "Every generation uses dynamic, context-specific AI prompts. No two outputs are the same, and your products won't match anyone else's.",
  },
  {
    q: "How long does it take to create an ebook?",
    a: "Most ebooks are ready in under 2 minutes. You spend more time choosing your cover image than you do generating the content.",
  },
  {
    q: "What platforms can I sell on?",
    a: "Anywhere you like. Gumroad, Payhip, Etsy, Amazon KDP, your own Shopify/Webflow store — or even directly via social media. There are no restrictions.",
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax for hero blob
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.15}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0b0f] text-zinc-200 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      <title>DigiForgeAI — Create & Sell Digital Products With AI</title>
      <meta
        name="description"
        content="Turn your ideas into sellable ebooks and digital products in 60 seconds. No writing skills needed. Start free today."
      />

      {/* ── Background Atmosphere ────────────────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          ref={heroRef}
          className="absolute top-[-20%] right-[-15%] w-[80%] h-[80%] rounded-full bg-indigo-600/8 blur-[140px]"
        />
        <div className="absolute bottom-[5%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/5 blur-[120px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Launch Banner ────────────────────────────────────────────────── */}
      <div className="relative z-50 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 py-2.5 text-center">
        <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.3em]">
          🎉 Free to start — no credit card required
        </p>
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/[0.04] bg-[#0a0b0f]/80">
        <div className="flex items-center justify-between px-5 md:px-8 py-4 max-w-7xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer shrink-0"
          >
            <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/30 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center overflow-hidden">
              <Image
                src="/digiforge_logo.png"
                alt="DigiForge AI"
                width={20}
                height={20}
                className="object-contain md:w-6 md:h-6"
                priority
              />
            </div>
            <span className="font-black text-lg md:text-xl tracking-tight text-white">
              DigiForge<span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
            {[
              ["#how-it-works", "How It Works"],
              ["#features", "Features"],
              ["#reviews", "Reviews"],
              ["/pricing", "Pricing"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer uppercase tracking-widest"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer tracking-wide"
            >
              Start Free →
            </button>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0b0f]/98 backdrop-blur-2xl border-t border-white/[0.04] px-5 py-5">
            <div className="flex flex-col gap-4">
              {[
                ["#how-it-works", "How It Works"],
                ["#features", "Features"],
                ["#reviews", "Reviews"],
                ["/pricing", "Pricing"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-bold text-zinc-400 hover:text-white transition py-1.5"
                >
                  {label}
                </Link>
              ))}
              <div className="pt-3 flex flex-col gap-3 border-t border-white/5">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/login");
                  }}
                  className="text-sm font-bold text-zinc-400 hover:text-white transition py-2"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/signup");
                  }}
                  className="bg-indigo-600 text-white text-sm font-black px-6 py-3 rounded-full hover:bg-indigo-500 transition text-center"
                >
                  Start Free →
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
        {/* Social proof pill */}
        <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-bold px-5 py-2.5 rounded-full mb-8">
          <div className="flex -space-x-2 mr-1">
            {["AB", "CK", "MT"].map((i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-[7px] font-bold text-indigo-300"
              >
                {i}
              </div>
            ))}
          </div>
          <span className="text-zinc-400">
            Join 500+ creators already earning
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-[90px] lg:text-[108px] font-black leading-[0.88] mb-7 tracking-tighter">
          <span className="text-white block">Create & Sell</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-violet-400 to-indigo-500 block">
            Digital Products
          </span>
          <span className="text-white block">With AI.</span>
        </h1>

        {/* Sub */}
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Generate ebooks, guides, and digital products in minutes — even if
          you're starting from scratch. No writing or design skills needed.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            onClick={() => router.push("/signup")}
            className="w-full sm:w-auto group bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            Generate Your First Ebook Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="w-full sm:w-auto text-zinc-400 hover:text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            View Pricing
          </button>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600 font-bold uppercase tracking-widest">
          {[
            "No credit card",
            "Free to start",
            "100% yours to sell",
            "Cancel anytime",
          ].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {t}
            </span>
          ))}
        </div>

        {/* Demo video */}
        <div className="max-w-5xl mx-auto mt-20 relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/30 to-violet-500/30 rounded-[2.5rem] blur-sm" />
          <div className="relative bg-[#13141a] border border-white/[0.06] rounded-[2.5rem] aspect-video overflow-hidden shadow-2xl">
            <iframe
              src="https://player.vimeo.com/video/1187928532?autoplay=1&muted=1&loop=1"
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0b0f]/50 via-transparent to-transparent" />
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white text-black font-black px-6 py-2.5 rounded-full text-xs tracking-widest uppercase shadow-2xl whitespace-nowrap">
            ⚡ From idea to PDF in 60 seconds
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-20 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 500, suffix: "+", label: "Active Creators" },
            { value: 2000, suffix: "+", label: "Ebooks Generated" },
            { value: 10000, suffix: "+", label: "Creator Revenue $" },
            { value: 60, suffix: "s", label: "Avg. Generation Time" },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
            >
              <p className="text-3xl md:text-4xl font-black text-white mb-1.5">
                <Counter end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section
        className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-24"
        id="how-it-works"
      >
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.25em] mb-3">
            Simple 4-step process
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            From Idea to Income
            <br />
            <span className="text-zinc-500">in 4 Simple Steps</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="group relative bg-zinc-900/30 border border-white/[0.05] rounded-[1.75rem] p-7 hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all duration-300"
              >
                {/* Step number */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-zinc-800 group-hover:text-zinc-700 transition-colors">
                    {step.num}
                  </span>
                </div>

                <span className="inline-block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-3">
                  {step.badge}
                </span>
                <h3 className="text-lg font-black text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Visual flow arrow */}
        <div className="flex items-center justify-center gap-3 mt-12 flex-wrap">
          {[
            "Idea",
            "→",
            "AI Generation",
            "→",
            "Cover & Design",
            "→",
            "Sell & Earn",
          ].map((item, i) => (
            <span
              key={i}
              className={`text-sm font-black ${item === "→" ? "text-zinc-700" : "text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-4 py-2 rounded-full"}`}
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/[0.05] rounded-[3rem] p-10 md:p-16">
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.25em] mb-3">
              This was made for you
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Who DigiForgeAI Is For
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AUDIENCE.map((a, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl hover:border-indigo-500/25 hover:bg-indigo-500/[0.03] transition-all duration-300"
              >
                <span className="text-2xl shrink-0 mt-0.5">{a.icon}</span>
                <div>
                  <h4 className="font-black text-white mb-1 text-sm">
                    {a.label}
                  </h4>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-600 text-sm mt-10 font-bold">
            If you have an idea and want to make money from it — DigiForgeAI is
            for you.
          </p>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section
        className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-24"
        id="features"
      >
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.25em] mb-3">
            Everything you need
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            One Platform. Infinite Products.
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Every tool you need to go from idea to income — built into one
            place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group bg-zinc-900/30 border border-white/[0.05] rounded-[2rem] p-7 hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-600/15 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-black text-white mb-3">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-5">
                {f.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {f.pills.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-bold text-zinc-500 bg-white/[0.03] border border-white/[0.05] px-3 py-1 rounded-full"
                  >
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE BIG SHIFT / COMPARISON ───────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-12">
        <div className="bg-indigo-600 rounded-[3.5rem] p-10 md:p-20 relative overflow-hidden">
          <div className="absolute top-[-15%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.25em] mb-4">
                The smarter way to create
              </p>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                Stop trading time for money. Start creating once, earning
                forever.
              </h2>
              <p className="text-indigo-100 text-base opacity-90 mb-10 max-w-md leading-relaxed">
                The old way of creating digital products is slow, expensive, and
                exhausting. DigiForgeAI changes everything.
              </p>
              <button
                onClick={() => router.push("/signup")}
                className="bg-white text-indigo-700 font-black px-8 py-4 rounded-full hover:bg-indigo-50 transition-all active:scale-95 text-sm uppercase tracking-wide shadow-xl"
              >
                Start Creating Free
              </button>
            </div>

            {/* Comparison card */}
            <div className="bg-[#0a0b0f]/65 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
              <div className="space-y-8">
                <div>
                  <h4 className="text-[9px] font-black text-red-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    Without DigiForgeAI
                  </h4>
                  <div className="space-y-3">
                    {[
                      "2+ weeks writing an ebook",
                      "$400 on ghostwriters",
                      "$200 on cover designers",
                      "Hours formatting in Word",
                      "Still not sure it'll sell",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-zinc-500 text-sm line-through decoration-red-500/50"
                      >
                        <span className="text-red-500/60 shrink-0">✗</span>{" "}
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div>
                  <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    With DigiForgeAI
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        t: "60 seconds to generate",
                        d: "Full ebook, structured & polished",
                      },
                      {
                        t: "Zero upfront cost",
                        d: "Start free, scale as you earn",
                      },
                      {
                        t: "Market research built in",
                        d: "Know it'll sell before you create",
                      },
                      {
                        t: "Beautiful PDFs instantly",
                        d: "Ready to list on any platform",
                      },
                    ].map((item) => (
                      <div key={item.t} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-white text-sm">
                            {item.t}
                          </p>
                          <p className="text-[11px] text-zinc-600">{item.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -right-5 bg-white text-black font-black px-5 py-3 rounded-2xl shadow-2xl text-xs tracking-wider uppercase">
                10× Faster
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SELL ANYWHERE ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-20 overflow-hidden">
        <div className="text-center mb-10">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">
            Your product, your rules
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Sell on Any Platform You Want
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#0a0b0f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#0a0b0f] to-transparent z-10 pointer-events-none" />
          <div className="overflow-hidden">
            <div
              className="flex gap-8 animate-scroll"
              style={{ width: "max-content" }}
            >
              {[...Array(2)].map((_, si) =>
                [
                  { name: "Gumroad", icon: "🛒", bg: "bg-pink-500/8" },
                  { name: "Payhip", icon: "💳", bg: "bg-blue-500/8" },
                  { name: "Etsy", icon: "🏪", bg: "bg-orange-500/8" },
                  { name: "Amazon KDP", icon: "📚", bg: "bg-yellow-500/8" },
                  { name: "Your Website", icon: "🌐", bg: "bg-indigo-500/8" },
                  { name: "Social Media", icon: "📱", bg: "bg-purple-500/8" },
                  { name: "Shopify", icon: "🏬", bg: "bg-green-500/8" },
                  { name: "Ko-fi", icon: "☕", bg: "bg-red-500/8" },
                ].map((p, j) => (
                  <div
                    key={`${si}-${j}`}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl ${p.bg} border border-white/[0.04] min-w-[110px]`}
                  >
                    <span className="text-2xl mb-2">{p.icon}</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                      {p.name}
                    </span>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
      <section
        className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-24"
        id="reviews"
      >
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.25em] mb-3">
            Real results
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Creators Are Already Earning
          </h2>
          <p className="text-zinc-500 mt-4 max-w-xl mx-auto">
            Real people, real products, real income — built with DigiForgeAI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className="group p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/[0.05] flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-1">
                    {[...Array(r.stars)].map((_, si) => (
                      <Star
                        key={si}
                        className="w-4 h-4 text-indigo-400 fill-indigo-400"
                      />
                    ))}
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-1 rounded-full">
                    Earned {r.earned}
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed text-sm mb-7 italic">
                  "{r.text}"
                </p>
              </div>
              <div className="flex items-center gap-4 border-t border-white/[0.05] pt-5">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {r.initials}
                </div>
                <div>
                  <p className="font-black text-white text-sm">{r.name}</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                    {r.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAIN CTA ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-12">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 rounded-[3rem] px-8 py-20 md:px-20 md:py-28 shadow-2xl text-center">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/15 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.25em] mb-5">
              Your digital product business starts now
            </p>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
              Your First Ebook
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white">
                Could Be Live Today.
              </span>
            </h2>
            <p className="text-indigo-100 text-lg mb-12 leading-relaxed max-w-lg mx-auto">
              Stop waiting. Stop overthinking. Generate your first digital
              product right now — for free.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group w-full sm:w-auto px-10 py-4 bg-white hover:bg-indigo-50 text-indigo-700 font-black rounded-full transition-all shadow-2xl flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                Generate My First Ebook Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-full border border-white/20 transition-all text-sm uppercase tracking-wide"
              >
                View Pricing →
              </Link>
            </div>

            <div className="mt-12 flex flex-col items-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="w-9 h-9 rounded-full bg-indigo-400/30 border-2 border-indigo-500 flex items-center justify-center overflow-hidden"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400/30 to-violet-500/30" />
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                  +500
                </div>
              </div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">
                500+ creators already building
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 py-20">
        <h2 className="text-center text-3xl font-black text-white mb-12 tracking-tight">
          Got Questions?
        </h2>
        <FaqAccordion items={FAQS} />
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-16 pb-12 border-t border-white/[0.04]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          {/* Brand */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-1.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center overflow-hidden">
                <Image
                  src="/digiforge_logo.png"
                  alt="DigiForge AI"
                  width={22}
                  height={22}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-black text-xl tracking-tight text-white">
                DigiForge<span className="text-indigo-400">AI</span>
              </span>
            </div>
            <p className="text-zinc-500 leading-relaxed max-w-sm">
              The fastest way to create, design, and sell digital products —
              powered by AI.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/digiforgeai"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-zinc-900 border border-white/[0.05] text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </a>
              <a
                href="/"
                className="p-2.5 rounded-full bg-zinc-900 border border-white/[0.05] text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2 space-y-5">
            <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">
              Platform
            </h5>
            <ul className="text-zinc-500 text-sm space-y-3 font-medium">
              {[
                ["#features", "Features"],
                ["#how-it-works", "How It Works"],
                ["/pricing", "Pricing"],
                ["/dashboard/generate", "Start Creating"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-5">
            <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">
              Company
            </h5>
            <ul className="text-zinc-500 text-sm space-y-3 font-medium">
              {[
                ["#", "Our Vision"],
                ["/affiliates", "Affiliates"],
                ["/privacy", "Privacy Policy"],
                ["/terms", "Terms of Service"],
              ].map(([href, label]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Email signup */}
          <div className="md:col-span-4 space-y-6">
            <h5 className="text-white font-black text-xs uppercase tracking-[0.2em]">
              Join the Creator List
            </h5>
            <div className="flex gap-2 p-1.5 bg-zinc-900/60 border border-white/[0.06] rounded-xl focus-within:border-indigo-500/50 transition-all">
              <input
                id="footer-email"
                type="email"
                placeholder="Enter your email"
                className="bg-transparent border-none outline-none text-sm px-3 flex-1 text-white placeholder:text-zinc-700"
              />
              <button
                onClick={() => {
                  const email = (
                    document.getElementById("footer-email") as HTMLInputElement
                  ).value;
                  router.push(`/signup?email=${encodeURIComponent(email)}`);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <a
              href="mailto:support@digiforgeai.app"
              className="group flex items-center gap-3 p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-xl hover:border-indigo-500/30 transition-all"
            >
              <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">
                  Email Support
                </p>
                <p className="text-[10px] text-zinc-500">
                  support@digiforgeai.app
                </p>
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-zinc-900/60 gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.3em]">
              © 2026 DigiForge AI. All Rights Reserved.
            </p>
            <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">
              Built with ❤️ in Accra, Ghana
            </p>
          </div>
        </div>
      </footer>

      {/* ── Global Styles ─────────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 28s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </main>
  );
}
