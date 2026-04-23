"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Sparkles,
  TrendingUp,
  Sword,
  DollarSign,
  Flame,
  BookMarked,
  ArrowRight,
  ChevronDown,
  Zap,
  Info,
  CheckCircle2,
  DollarSign as SellIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";

interface Idea {
  title: string;
  angle: string;
  targetAudience: string;
  whyItSells: string;
  searchTerms: string[];
  demandScore: number;
  competitionScore: number;
  monetizationScore: number;
  viralityScore: number;
  forgeScore: number;
  trend: "Rising" | "Stable" | "Hot";
}

const LOADING_STEPS = [
  "Scanning trending topics...",
  "Analyzing market demand...",
  "Scoring monetization potential...",
  "Ranking virality signals...",
  "Finalizing your ideas...",
];

function useLoadingStep(loading: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!loading) {
      setStep(0);
      return;
    }
    setStep(0);
    const iv = setInterval(
      () => setStep((p) => (p < LOADING_STEPS.length - 1 ? p + 1 : p)),
      1800,
    );
    return () => clearInterval(iv);
  }, [loading]);
  return LOADING_STEPS[step];
}

function TrendPill({ trend }: { trend: string }) {
  const map: Record<
    string,
    { bg: string; text: string; dot: string; emoji: string }
  > = {
    Hot: {
      bg: "bg-rose-50",
      text: "text-rose-500",
      dot: "bg-rose-400",
      emoji: "🔥",
    },
    Rising: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      dot: "bg-emerald-400",
      emoji: "📈",
    },
    Stable: {
      bg: "bg-sky-50",
      text: "text-sky-500",
      dot: "bg-sky-400",
      emoji: "➡️",
    },
  };
  const s = map[trend] || {
    bg: "bg-slate-50",
    text: "text-slate-500",
    dot: "bg-slate-300",
    emoji: "",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.emoji} {trend}
    </span>
  );
}

function ForgeScoreRing({ score }: { score: number }) {
  const r = 17,
    circ = 2 * Math.PI * r,
    dash = (score / 100) * circ;
  const color = score >= 75 ? "#4f46e5" : score >= 50 ? "#7c3aed" : "#94a3b8";
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-slate-700">{score}</span>
      </div>
    </div>
  );
}

function ScoreBar({
  score,
  label,
  icon,
}: {
  score: number;
  label: string;
  icon: React.ReactNode;
}) {
  const color =
    score >= 75
      ? "from-indigo-500 to-indigo-600"
      : score >= 50
        ? "from-violet-400 to-indigo-500"
        : "from-slate-300 to-slate-400";
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <span className="text-[11px] text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-slate-600 w-6 text-right tabular-nums">
        {score}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
        </div>
        <div className="h-5 w-5 bg-slate-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded w-11/12" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
      {/* why it sells skeleton */}
      <div className="h-8 bg-slate-50 rounded-xl" />
      <div className="space-y-2 pt-1">
        {[1, 2, 3, 4].map((j) => (
          <div key={j} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-slate-200 rounded shrink-0" />
            <div className="w-20 h-2 bg-slate-100 rounded shrink-0" />
            <div className="flex-1 h-1.5 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

const niches = [
  "General",
  "Fitness",
  "Finance",
  "Business",
  "Marketing",
  "Tech",
  "Self Help",
  "Parenting",
  "Food",
  "Travel",
  "Real Estate",
  "Education",
];

export default function GeneratePage() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("General");
  const [count, setCount] = useState(6);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { plan, usage, loading: subscriptionLoading } = useSubscription();

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const loadingStep = useLoadingStep(loading);

  const handleGenerate = async () => {
    if (subscriptionLoading) return;
    if (usage.remaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setSaveError(null);
    setIdeas([]);
    setSavedIds(new Set());
    try {
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, niche, count }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeas(data.ideas);
    } catch {
      setError("Failed to generate ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (idea: Idea, index: number) => {
    if (savedIds.has(index) || savingId !== null) return;
    setSavingId(index);
    setSaveError(null);
    try {
      const {
        data: { user },
        error: ae,
      } = await supabase.auth.getUser();
      if (ae || !user) throw new Error("Not authenticated.");
      const { error: ie } = await supabase.from("saved_ideas").insert({
        user_id: user.id,
        title: idea.title,
        angle: idea.angle,
        target_audience: idea.targetAudience,
        demand_score: Math.round(idea.demandScore),
        competition_score: Math.round(idea.competitionScore),
        monetization_score: Math.round(idea.monetizationScore),
        virality_score: Math.round(idea.viralityScore),
        forge_score: Math.round(idea.forgeScore),
        trend: idea.trend,
        niche,
      });
      if (ie) throw new Error(ie.message || "Database error.");
      setSavedIds((prev) => new Set([...prev, index]));
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSavingId(null);
    }
  };

const handleForge = (idea: Idea) => {
  // Check if user can forge (has remaining generations)
  if (usage.remaining <= 0 && plan === 'free') {
    setShowUpgradeModal(true);
    return;
  }
  
  // Add timestamp to track when idea was created
  sessionStorage.setItem('forgeIdea', JSON.stringify({ 
    ...idea, 
    niche,
    timestamp: Date.now()  // ← Add this
  }));
  
  router.push('/dashboard/forge');
}

  return (
    <div className="flex w-full min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between mb-8 pt-2">
          <p className="text-xs font-semibold text-slate-400">
            Dashboard <span className="text-slate-300 mx-1.5">/</span>
            <span className="text-slate-700">Generate Ideas</span>
          </p>
          {/* <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              AI Engine Online
            </span>
          </div> */}
        </div>

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em]">
              Trend Engine
            </p>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Generate Product Ideas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Discover trending digital product angles with AI-powered scoring
          </p>
        </div>

        {/* ── Input Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-8">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5">
            Configure Your Forge
          </p>

          {/* Topic */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Topic{" "}
              <span className="text-slate-400 font-normal normal-case">
                (optional — leave blank for AI picks)
              </span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. passive income, AI tools, fitness for busy moms..."
              className="w-full border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 bg-slate-50/50 focus:bg-white outline-none transition"
            />
          </div>

          {/* Niche + Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Niche <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full appearance-none border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50/50 focus:bg-white outline-none cursor-pointer transition"
                >
                  {niches.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600">
                  Number of Ideas
                </label>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full tabular-nums">
                  {count}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={12}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-300 mt-1.5">
                <span>3</span>
                <span>12</span>
              </div>
            </div>
          </div>

          {niche === "General" && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
              <Zap className="w-3.5 h-3.5 fill-indigo-500" />
              <span className="font-medium">
                🔥 General mode = Only high-potential, money-making ideas (75+
                score minimum)
              </span>
            </div>
          )}
          <br></br>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition shadow-md shadow-indigo-200 cursor-pointer text-sm"
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                {loadingStep}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" fill="white" /> Forge Ideas
              </>
            )}
          </button>
        </div>

        {/* Errors */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {saveError && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 mb-6 text-sm">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-black mb-0.5">Save failed</p>
              <p>{saveError}</p>
            </div>
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {!loading && ideas.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {ideas.length} Ideas Ready
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by Forge Score · highest first
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Generated
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/60 transition-all duration-200 flex flex-col shadow-sm"
                >
                  <div className="p-5 flex flex-col flex-1">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wide">
                          {niche}
                        </span>
                        <TrendPill trend={idea.trend} />
                      </div>
                      <button
                        onClick={() => !savedIds.has(i) && handleSave(idea, i)}
                        disabled={savingId === i || savedIds.has(i)}
                        title={savedIds.has(i) ? "Saved!" : "Save idea"}
                        className={`shrink-0 p-1.5 rounded-xl transition cursor-pointer ${
                          savedIds.has(i)
                            ? "text-indigo-600 bg-indigo-50"
                            : savingId === i
                              ? "text-indigo-400 bg-indigo-50 animate-pulse"
                              : "text-slate-300 hover:text-indigo-500 hover:bg-indigo-50"
                        }`}
                      >
                        {savingId === i ? (
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                        ) : savedIds.has(i) ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <BookMarked className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Title + audience */}
                    <h3 className="text-sm font-black text-slate-900 leading-snug mb-1">
                      {idea.title}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-3">
                      {idea.angle}
                    </p>
                    <p className="text-[11px] text-slate-400 mb-3">
                      👤 {idea.targetAudience}
                    </p>

                    {/* ── Why it sells ── */}
                    {idea.whyItSells && (
                      <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 mb-4">
                        <span className="text-emerald-500 shrink-0 mt-0.5">
                          💰
                        </span>
                        <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                          {idea.whyItSells}
                        </p>
                      </div>
                    )}

                    {/* ── Search Terms (what people are searching) ── */}
                    {idea.searchTerms && idea.searchTerms.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          PEOPLE ARE SEARCHING FOR
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {idea.searchTerms.map((term: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full shadow-sm"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Score bars */}
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                      <ScoreBar
                        score={idea.demandScore}
                        label="Demand"
                        icon={<TrendingUp className="w-3.5 h-3.5" />}
                      />
                      <ScoreBar
                        score={idea.competitionScore}
                        label="Competition"
                        icon={<Sword className="w-3.5 h-3.5" />}
                      />
                      <ScoreBar
                        score={idea.monetizationScore}
                        label="Monetization"
                        icon={<DollarSign className="w-3.5 h-3.5" />}
                      />
                      <ScoreBar
                        score={idea.viralityScore}
                        label="Virality"
                        icon={<Flame className="w-3.5 h-3.5" />}
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-3">
                        <ForgeScoreRing score={idea.forgeScore} />
                        <div>
                          <p className="text-xs font-black text-slate-700">
                            Forge Score
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {idea.forgeScore >= 75
                              ? "🔥 High potential"
                              : idea.forgeScore >= 50
                                ? "👍 Worth trying"
                                : "⚠️ Lower priority"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleForge(idea)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-200"
                      >
                        <Zap className="w-3.5 h-3.5" fill="white" />
                        Forge
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && ideas.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-black text-slate-700 text-base mb-1">
              Ready to forge
            </h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Pick a niche and hit "Forge Ideas" to discover high-potential
              digital product angles.
            </p>
          </div>
        )}
      </main>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={plan}
        remainingGenerations={usage.remaining}
      />
    </div>
  );
}
