"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Download,
  Edit3,
  Zap,
  RefreshCw,
  Palette,
  DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MonetizationPanel } from "@/components/MonetizationPanel";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  saveToSupabase,
} from "@/lib/draft-storage";
import { toast } from "sonner";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { ForgeError } from "@/components/ForgeError";
import { Sliders, ChevronDown } from "lucide-react";
import { trackEvent } from '@/lib/analytics'


interface Idea {
  title: string;
  angle: string;
  targetAudience: string;
  forgeScore: number;
  trend: string;
  niche: string;
  theme?: string;
  template?: string;
}
interface Chapter {
  title: string;
  content: string;
  tips: string[];
}
interface PDFContent {
  title: string;
  subtitle: string;
  introduction: string;
  chapters: Chapter[];
  conclusion: string;
  callToAction: string;
}

interface EbookData {
  free_regenerations_used?: number;
}

const STEPS = [
  { id: 1, label: "Style", icon: <Palette className="w-4 h-4" /> },
  { id: 2, label: "Cover", icon: <ImageIcon className="w-4 h-4" /> },
  { id: 3, label: "Customize", icon: <Edit3 className="w-4 h-4" /> },
  { id: 4, label: "Generate", icon: <Sparkles className="w-4 h-4" /> },
  { id: 5, label: "Preview", icon: <FileText className="w-4 h-4" /> },
  { id: 6, label: "Export", icon: <Download className="w-4 h-4" /> },
];

const TONES = [
  "Professional",
  "Conversational",
  "Motivational",
  "Educational",
  "Authoritative",
];

const THEMES = [
  { id: "indigo", label: "Indigo", hex: "#4c29d1" },
  { id: "violet", label: "Violet", hex: "#7c2de6" },
  { id: "rose", label: "Rose", hex: "#e02e52" },
  { id: "emerald", label: "Emerald", hex: "#0d9860" },
  { id: "cyan", label: "Cyan", hex: "#0d99bf" },
  { id: "amber", label: "Amber", hex: "#db8e0f" },
  { id: "orange", label: "Orange", hex: "#e56610" },
  { id: "slate", label: "Slate", hex: "#38465c" },
];

const TEMPLATES = [
  {
    id: "premium",
    label: "Premium",
    desc: "Dark theme with bold typography, ideal for high-ticket products",
    icon: "👑",
    preview: "bg-gradient-to-br from-slate-900 to-slate-800",
    plan: "starter", // Available from Starter plan
  },
  {
    id: "classic",
    label: "Classic",
    desc: "Clean white background, professional and timeless",
    icon: "📖",
    preview: "bg-white border",
    plan: "free", // Available for Free plan
  },
  {
    id: "modern",
    label: "Modern",
    desc: "Bold headings, accent color highlights, clean sans-serif",
    icon: "✨",
    preview: "bg-gradient-to-br from-indigo-50 to-white",
    plan: "free", // Available for Free plan
  },
  {
    id: "minimal",
    label: "Minimal",
    desc: "Ultra-clean, large margins, focused readability",
    icon: "🌿",
    preview: "bg-stone-50 border-stone-200",
    plan: "starter", // Available from Starter plan
  },
  {
    id: "editorial",
    label: "Editorial",
    desc: "Magazine-style layout with pull quotes and sidebars",
    icon: "📰",
    preview: "bg-gradient-to-br from-amber-50 to-orange-50",
    plan: "pro", // Pro only
  },
  {
    id: "corporate",
    label: "Corporate",
    desc: "Business professional with structured hierarchy",
    icon: "🏢",
    preview: "bg-gradient-to-br from-blue-50 to-slate-50",
    plan: "pro", // Pro only
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildGenSteps(n: number): string[] {
  return [
    "Reading your customizations...",
    "Writing introduction...",
    ...Array.from(
      { length: n },
      (_, i) => `Writing chapter ${i + 1} of ${n}...`,
    ),
    "Writing conclusion...",
    "Finalizing your guide...",
  ];
}

export default function ForgePage() {
  const router = useRouter();
  const supabase = createClient();

  // ========== ALL STATE ==========
  const [idea, setIdea] = useState<Idea | null>(null);
  const [step, setStep] = useState(1);
  const [bookLength, setBookLength] = useState<"short" | "medium" | "long">(
    () => {
      // Default to 'short' for free plan
      if (typeof window !== "undefined") {
        const userPlan = localStorage.getItem("user-plan") || "free";
        if (userPlan === "free") return "short";
      }
      return "medium";
    },
  );
const [pdfTemplate, setPdfTemplate] = useState<string>(() => {
  // Set default template based on plan
  if (typeof window !== "undefined") {
    const userPlan = localStorage.getItem("user-plan") || "free";
    if (userPlan === "free") return "classic";
    if (userPlan === "starter") return "premium";
    if (userPlan === "pro") return "editorial";
  }
  return "classic";
});  const [exportProgress, setExportProgress] = useState(0);
  const [theme, setTheme] = useState("indigo");
  const [template, setTemplate] = useState("modern");
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tone, setTone] = useState("Professional");
  const [targetPrice, setTargetPrice] = useState("$9.99");
  const [genSteps, setGenSteps] = useState<string[]>(buildGenSteps(6));
  const [genStep, setGenStep] = useState(0);
  const [content, setContent] = useState<PDFContent | null>(null);
  const [genError, setGenError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<PDFContent | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showMonetization, setShowMonetization] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [forgeError, setForgeError] = useState<string | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [currentEbookId, setCurrentEbookId] = useState<string | null>(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [isRestoringFromLibrary, setIsRestoringFromLibrary] = useState(false);
  const [originalChapterCount, setOriginalChapterCount] = useState<number | null>(null);


  const {
    plan,
    usage,
    loading: subscriptionLoading,
    refresh: refreshUsage,
  } = useSubscription();

  // PDF Customization Settings (Pro only)
  const [pdfSettings, setPdfSettings] = useState({
    fontFamily: "sans-serif", // sans-serif or serif
    fontSize: 11,
    lineHeight: 1.4,
    margins: "normal", // compact, normal, spacious
    showPageNumbers: true,
    chapterStartPage: "new", // new or same
  });

  const [includeChapterImages, setIncludeChapterImages] = useState(true);
  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
  const [chapterCount, setChapterCount] = useState(() => {
    // Try to get plan from localStorage or URL if available
    if (typeof window !== "undefined") {
      // Check if we're on a free plan (default)
      const userPlan = localStorage.getItem("user-plan") || "free";
      if (userPlan === "free") return 3;
      if (userPlan === "starter") return 4;
      if (userPlan === "pro") return 6;
    }
    return 3;
  });

  // Create a helper function at the top of your component
  const safeGetUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch (err: any) {
      // Ignore the lock error - it's harmless
      if (err?.message?.includes("lock") || err?.message?.includes("stole")) {
        console.warn("Auth lock error (safe to ignore):", err.message);
        return null;
      }
      throw err;
    }
  };
  // ========== FETCH PHOTOS ==========
  const fetchPhotos = useCallback(async (query: string) => {
    if (!query) return;

    setPhotosLoading(true);
    setPhotos([]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 seconds

      const res = await fetch(
        `/api/unsplash?query=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Unsplash API returned ${res.status}`);
        setPhotos([]);
        setSelectedPhoto(null);
        return;
      }

      const data = await res.json();

      // Check if we got valid photos
      if (data.photos && data.photos.length > 0) {
        setPhotos(data.photos);
        setSelectedPhoto(data.photos[0]);
      } else {
        // No photos found, use a placeholder or just show empty
        setPhotos([]);
        setSelectedPhoto(null);
      }
    } catch (err) {
      // Don't show error to user - just silently fail
      console.warn(
        "Unsplash fetch error:",
        err instanceof Error ? err.message : "Unknown error",
      );
      setPhotos([]);
      setSelectedPhoto(null);
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  // ========== SIMPLE INITIALIZATION - RUNS ONCE ==========
useEffect(() => {
  console.log("=== FORGE PAGE INITIALIZATION ===");

  // Check for library restore first
  const restoredEbook = sessionStorage.getItem("forge_restore_ebook");
  console.log("forge_restore_ebook:", restoredEbook);

  if (restoredEbook) {
    try {
      const ebook = JSON.parse(restoredEbook);
      console.log("Restoring from library:", ebook.title, "Original Chapters:", ebook.chapterCount);
      
      // Set flag and store original chapter count
      setIsRestoringFromLibrary(true);
      setOriginalChapterCount(ebook.chapterCount || 6);
      
      // Set the exact chapter count from the ebook
      setChapterCount(ebook.chapterCount || 6);
      
      // Set other data
      setCustomTitle(ebook.title);
      setSubtitle(ebook.subtitle || "");
      setEditedContent(ebook.content);
      setContent(ebook.content);
      setTheme(ebook.theme || "indigo");
      setPdfTemplate(ebook.template || "premium");
      
      // Set book length based on chapter count
      if (ebook.chapterCount <= 4) setBookLength("short");
      else if (ebook.chapterCount <= 8) setBookLength("medium");
      else setBookLength("long");

      if (ebook.coverImageUrl) {
        setSelectedPhoto({
          urls: { regular: ebook.coverImageUrl, small: ebook.coverImageUrl },
        });
      }

      if (ebook.id) {
        setCurrentEbookId(ebook.id);
      }

      setIdea({
        title: ebook.title,
        angle: ebook.subtitle || "",
        targetAudience: ebook.niche || "Readers",
        forgeScore: 85,
        trend: "Hot",
        niche: ebook.niche || "General",
      });

      setStep(5);
      sessionStorage.removeItem("forge_restore_ebook");
      toast.success(`Loaded "${ebook.title}" successfully`);
      return;
    } catch (err) {
      console.error("Failed to restore ebook:", err);
      sessionStorage.removeItem("forge_restore_ebook");
      setIsRestoringFromLibrary(false);
    }
  }

  // Check for regular forge idea (from generate page)
  const stored = sessionStorage.getItem("forgeIdea");
  console.log("forgeIdea:", stored);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log("Found forge idea:", parsed.title);

      if (parsed.title) {
        setIdea(parsed);
        setCustomTitle(parsed.title);
        setSubtitle(parsed.angle || "");
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.niche) fetchPhotos(parsed.niche);
        return;
      }
    } catch (err) {
      console.error("Failed to parse forge idea:", err);
    }
  }

  // If we get here, no valid data found
  console.log("No valid data found, showing error");
  setForgeError("No product selected. Please generate or select an idea first.");
}, []);

// Add this useEffect to reset chapter count when plan loads (ONLY for new creations)
// Add this useEffect to reset chapter count when plan loads (ONLY for new creations)
useEffect(() => {
  // If we're restoring from library, use the original chapter count
  if (isRestoringFromLibrary && originalChapterCount) {
    console.log("Restoring from library, keeping original chapter count:", originalChapterCount);
    setChapterCount(originalChapterCount);
    // Also set book length based on original chapter count
    if (originalChapterCount <= 4) setBookLength("short");
    else if (originalChapterCount <= 8) setBookLength("medium");
    else setBookLength("long");
    return;
  }
  
  // Only apply to new creations
  if (plan === "free") {
    setChapterCount(3);
    setBookLength("short");
  } else if (plan === "starter") {
    setChapterCount(4);
    setBookLength("medium");
  } else if (plan === "pro") {
    setChapterCount(6);
    setBookLength("medium");
  }
}, [plan, isRestoringFromLibrary, originalChapterCount]);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("pdf-custom-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setPdfSettings(parsed);
      } catch (e) {
        console.error("Failed to load PDF settings:", e);
      }
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    if (plan === "pro") {
      localStorage.setItem("pdf-custom-settings", JSON.stringify(pdfSettings));
    }
  }, [pdfSettings, plan]);

  // Set default template based on plan
  useEffect(() => {
    if (!pdfTemplate) {
      if (plan === "free") {
        setPdfTemplate("classic"); // Free users get Classic as default
      } else if (plan === "starter") {
        setPdfTemplate("premium"); // Starter users get Premium as default
      } else {
        setPdfTemplate("editorial"); // Pro users get Editorial as default
      }
    }
  }, [plan, pdfTemplate]);

  // ========== AUTO-SAVE DRAFT ==========
  useEffect(() => {
    if (generating) return;
    if (!customTitle && step === 1) return;

    const draft = {
      title: customTitle,
      subtitle: subtitle,
      content: editedContent || content,
      theme: theme,
      template: pdfTemplate,
      coverImageUrl: selectedPhoto?.urls?.regular || null,
      step: step,
      chapterCount: chapterCount,
      tone: tone,
      bookLength: bookLength,
    };
    saveDraft(draft);
  }, [
    customTitle,
    subtitle,
    editedContent,
    content,
    theme,
    pdfTemplate,
    selectedPhoto,
    step,
    chapterCount,
    tone,
    bookLength,
    generating,
  ]);

  // ========== DRAFT CHECK ==========
  useEffect(() => {
    if (editedContent || content) return;

    const draft = loadDraft();
    if (
      draft &&
      draft.content &&
      step === 1 &&
      !sessionStorage.getItem("forgeIdea")
    ) {
      const currentUserId = localStorage.getItem("sb-user-id");
      const draftUserId = draft.userId;

      if (currentUserId && draftUserId && currentUserId !== draftUserId) {
        clearDraft();
        return;
      }
      setDraftData(draft);
      setShowDraftPrompt(true);
    }
  }, [editedContent, content, step]);

  // ========== UPDATE GEN STEPS ==========
  useEffect(() => {
    setGenSteps(buildGenSteps(chapterCount));
  }, [chapterCount]);

  // ========== CLEAR DRAFT ON LOGOUT ==========
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") {
        clearDraft();
        setShowDraftPrompt(false);
        setDraftData(null);
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // ========== CLEAR FORGE DATA ON UNMOUNT ==========
  //   useEffect(() => {
  //     return () => {
  //       const isFromLibrary = sessionStorage.getItem('forge_restore_ebook');
  //       if (!isFromLibrary) {
  //         sessionStorage.removeItem('forgeIdea');
  //       }
  //     };
  //   }, []);

  // ========== FUNCTIONS ==========

  const handleGenerate = async (regenerate = false) => {
    if (!idea) return;

    // 🔥 CRITICAL FIX: Enforce chapter limits based on plan
    let effectiveChapterCount = chapterCount;

    if (plan === "free") {
      effectiveChapterCount = Math.min(3, chapterCount);
      if (chapterCount > 3) {
        console.warn(
          `Free user attempted ${chapterCount} chapters, limiting to 3`,
        );
        setChapterCount(3);
      }
    } else if (plan === "starter") {
      effectiveChapterCount = Math.min(6, chapterCount);
    } else if (plan === "pro") {
      effectiveChapterCount = Math.min(12, chapterCount);
    }

    setGenerating(true);
    setGenStep(0);
    setGenError("");

    // Update genSteps with CORRECTED chapter count
    if (plan === "pro") {
      const prioritySteps = [
        "⚡ PRIORITY: Reading your customizations...",
        "⚡ Writing introduction at lightning speed...",
        ...Array.from(
          { length: effectiveChapterCount },
          (_, i) =>
            `⚡ Writing chapter ${i + 1} of ${effectiveChapterCount} (Priority)...`,
        ),
        "⚡ Writing conclusion...",
        "⚡ Finalizing your premium guide...",
      ];
      setGenSteps(prioritySteps);
    } else {
      setGenSteps(buildGenSteps(effectiveChapterCount));
    }

    if (!regenerate) {
      setContent(null);
      setEditedContent(null);
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: {
            title: customTitle,
            angle: subtitle,
            targetAudience: idea.targetAudience,
            tone,
            chapterCount: effectiveChapterCount,
            bookLength,
          },
          isRegenerate: regenerate,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.event === "progress") {
              if (plan === "pro" || plan === "starter") {
                const stepMessage = data.step || "";
                let stepIndex = -1;

                if (
                  stepMessage.includes("Planning") ||
                  stepMessage.includes("structure")
                ) {
                  stepIndex = 0;
                } else if (
                  stepMessage.includes("introduction") ||
                  stepMessage.includes("Intro")
                ) {
                  stepIndex = 1;
                } else if (stepMessage.includes("chapter")) {
                  const chapterMatch = stepMessage.match(/chapter (\d+)/i);
                  if (chapterMatch) {
                    const chapterNum = parseInt(chapterMatch[1]);
                    stepIndex = 1 + chapterNum;
                  }
                } else if (stepMessage.includes("conclusion")) {
                  stepIndex = 1 + chapterCount + 1;
                } else if (stepMessage.includes("Finalizing")) {
                  stepIndex = 1 + chapterCount + 2;
                }

                if (stepIndex !== -1 && stepIndex < genSteps.length) {
                  setGenStep(stepIndex);
                } else {
                  setGenStep((prev) => Math.min(prev + 1, genSteps.length - 1));
                }
              } else {
                const idx = genSteps.findIndex((s) =>
                  s
                    .toLowerCase()
                    .includes(
                      data.step
                        ?.toLowerCase()
                        ?.split(" ")
                        .slice(0, 3)
                        .join(" ") || "",
                    ),
                );
                if (idx !== -1) {
                  setGenStep(idx);
                } else {
                  setGenStep((prev) => Math.min(prev + 1, genSteps.length - 2));
                }
              }
            }

            if (data.event === "chapter_done") {
              if (plan === "pro") {
                const chapterIndex = 1 + (data.chapter || 0);
                if (chapterIndex < genSteps.length) {
                  setGenStep(chapterIndex);
                }
              } else {
                setGenStep(2 + (data.chapter - 1));
              }
            }

            if (data.event === "done") {
              setGenStep(genSteps.length - 1);
              await sleep(600);
              setContent(data.content);
              setEditedContent(data.content);
              setStep(5);

               trackEvent.generateEbook(plan, effectiveChapterCount);

              await refreshUsage();

              // ========== SIMPLIFIED SAVE LOGIC - ALWAYS CREATE NEW RECORD ==========
              const isFromLibrary =
                sessionStorage.getItem("isFromLibrary") === "true";
              const isNewGeneration =
                !isFromLibrary &&
                !sessionStorage.getItem("forge_restore_ebook");

              if (isNewGeneration) {
                try {
                  const user = await safeGetUser();
                  if (user && data.content) {
                    const result = await saveToSupabase({
                      title: data.content.title || customTitle,
                      subtitle: data.content.subtitle || subtitle,
                      niche: idea?.niche || "",
                      theme: theme,
                      template: pdfTemplate || "premium",
                      chapterCount: data.content.chapters?.length || 0,
                      coverImageUrl: selectedPhoto?.urls?.regular || null,
                      content: data.content,
                    });

                    if (result && result.id) {
                      setCurrentEbookId(result.id);
                    }

                    console.log("Ebook saved to library");
                    clearDraft();
                  }
                } catch (err) {
                  console.error("Could not save ebook:", err);
                }
              }

              sessionStorage.removeItem("isFromLibrary");
            }

            if (data.event === "error") throw new Error(data.message);
          } catch (err) {
            // Inner catch for JSON parsing errors - ignore and continue
            console.warn("Error parsing SSE data:", err);
          }
        }
      }
    } catch (err: any) {
      setGenError(err.message || "Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!editedContent) {
      console.error("No content to export");
      setExportError("No content available. Please generate the ebook first.");
      return;
    }
    setExporting(true);
    setExportError("");
    try {
      console.log("📄 Starting PDF export for:", customTitle);
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            title: editedContent.title || customTitle,
            subtitle: editedContent.subtitle || subtitle,
            introduction: editedContent.introduction || "",
            chapters: editedContent.chapters || [],
            conclusion: editedContent.conclusion || "",
            callToAction: editedContent.callToAction || "",
          },
          title: customTitle,
          coverImageUrl: selectedPhoto?.urls?.regular || null,
          theme: theme,
          template: pdfTemplate || "premium",
          includeChapterImages: includeChapterImages,
          userPlan: plan,
          customSettings: plan === "pro" ? pdfSettings : null,
        }),
      });
      console.log("Response status:", response.status);
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === "plan_restricted") {
          setShowUpgradeModal(true);
          setExportError(
            errorData.message || "This feature requires an upgrade",
          );
          setExporting(false);
          return;
        }
        throw new Error(
          errorData.message || `Export failed: ${response.status}`,
        );
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Export failed:", errorText);
        throw new Error(`Export failed: ${response.status}`);
      }
      const blob = await response.blob();
      console.log("PDF blob received, size:", blob.size, "bytes");
      if (blob.size < 1000) {
        console.warn("PDF seems too small:", blob.size);
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${customTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("PDF download triggered successfully");
      trackEvent.exportPDF(plan);
      setStep(6);
    } catch (err: any) {
      console.error("Export error details:", err);
      setExportError(err.message || "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Add this function alongside handleExport
  const handleDocxExport = async () => {
    if (!editedContent) {
      console.error("No content to export");
      setExportError("No content available. Please generate the ebook first.");
      return;
    }

    // Double-check Pro plan
    if (plan !== "pro") {
      setShowUpgradeModal(true);
      toast.error("DOCX export is only available on Pro plans");
      return;
    }

    setExporting(true);
    setExportError("");
    try {
      console.log("📄 Starting DOCX export for:", customTitle);
      const response = await fetch("/api/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            title: editedContent.title || customTitle,
            subtitle: editedContent.subtitle || subtitle,
            introduction: editedContent.introduction || "",
            chapters: editedContent.chapters || [],
            conclusion: editedContent.conclusion || "",
            callToAction: editedContent.callToAction || "",
          },
          title: customTitle,
          coverImageUrl: selectedPhoto?.urls?.regular || null,
          theme: theme,
        }),
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === "plan_restricted") {
          setShowUpgradeModal(true);
          setExportError(errorData.message || "DOCX export requires Pro plan");
          setExporting(false);
          return;
        }
        throw new Error(
          errorData.message || `Export failed: ${response.status}`,
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DOCX export failed:", errorText);
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${customTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackEvent.exportDOCX(plan);

      toast.success("DOCX exported successfully!");
    } catch (err: any) {
      console.error("DOCX export error:", err);
      setExportError(err.message || "DOCX export failed. Please try again.");
      toast.error("DOCX export failed");
    } finally {
      setExporting(false);
    }
  };

  const updateChapter = (idx: number, field: string, value: string) => {
    if (!editedContent) return;
    const updated = { ...editedContent };
    updated.chapters = [...updated.chapters];
    updated.chapters[idx] = { ...updated.chapters[idx], [field]: value };
    setEditedContent(updated);
  };

  const restoreDraft = () => {
    if (draftData) {
      if (draftData.title) setCustomTitle(draftData.title);
      if (draftData.subtitle) setSubtitle(draftData.subtitle);
      if (draftData.content) {
        setContent(draftData.content);
        setEditedContent(draftData.content);
      }
      if (draftData.theme) setTheme(draftData.theme);
      if (draftData.template) setPdfTemplate(draftData.template);
      if (draftData.selectedPhoto) setSelectedPhoto(draftData.selectedPhoto);
      if (draftData.step) setStep(draftData.step);
      if (draftData.chapterCount) setChapterCount(draftData.chapterCount);
      if (draftData.tone) setTone(draftData.tone);
      if (draftData.bookLength) setBookLength(draftData.bookLength);
      setShowDraftPrompt(false);
      clearDraft();
    }
  };

  // ========== CONDITIONAL RETURNS ==========
  if (forgeError) {
    return (
      <div className="flex w-full min-h-screen bg-[#f5f6fa]">
        <Sidebar />
        <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">
          <ForgeError message={forgeError} />
        </main>
      </div>
    );
  }

  if (!idea) {
    return (
  <div className="flex w-full min-h-screen bg-[#f5f6fa] overflow-x-hidden max-w-[100vw]">
    <Sidebar />
    <main className="flex-1 md:ml-60 px-3 sm:px-4 md:px-6 pt-20 md:pt-10 pb-16 w-full max-w-full overflow-x-hidden">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ========== MAIN RETURN ==========
  return (
    <div className="dashboard-page flex w-full min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-8">
          <button
            onClick={() => router.push("/dashboard/generate")}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Forge Product
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 truncate">
              {customTitle}
            </p>
          </div>
        </div>
{/* Draft Restore Prompt - ULTRA COMPACT, NO OVERFLOW */}
{showDraftPrompt && draftData && (
  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg w-full overflow-hidden">
    <div className="p-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <svg
            className="w-3 h-3 text-amber-600 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-[10px] font-medium text-amber-800 truncate">
            Unsaved draft found
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={restoreDraft}
            className="px-2 py-0.5 bg-amber-600 text-white text-[9px] font-bold rounded"
          >
            Restore
          </button>
          <button
            onClick={() => {
              clearDraft();
              setShowDraftPrompt(false);
            }}
            className="px-2 py-0.5 border border-amber-300 text-amber-700 text-[9px] font-bold rounded bg-white"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{/* Steps - Fixed horizontal scroll without breaking layout */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 mb-6 w-full overflow-x-auto">
  <div className="flex items-center justify-between min-w-[400px] sm:min-w-0">
    {STEPS.map((s, i) => (
      <div key={s.id} className="flex items-center flex-1 min-w-0">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
              step > s.id
                ? "bg-indigo-600 border-indigo-600 text-white"
                : step === s.id
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                  : "border-slate-200 text-slate-300 bg-white"
            }`}
          >
            <span className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center">
              {step > s.id ? (
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                s.icon
              )}
            </span>
          </div>
          <span
            className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wide truncate max-w-full px-0.5 ${step >= s.id ? "text-slate-600" : "text-slate-300"}`}
          >
            {s.label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div
            className={`h-[2px] flex-1 mx-0.5 sm:mx-1 rounded transition-all shrink-0 ${step > s.id ? "bg-indigo-600" : "bg-slate-100"}`}
          />
        )}
      </div>
    ))}
  </div>
</div>
{/* Friendly Quota Warning - No overflow */}
{plan !== "pro" && usage.remaining === 0 && (
  <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3 w-full overflow-hidden">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <svg
            className="w-4 h-4 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-800">Limit reached</p>
          <p className="text-[10px] text-amber-700 truncate">
            Used {usage.used}/{usage.limit} generations
          </p>
        </div>
      </div>
      <button
        onClick={() => setShowUpgradeModal(true)}
        className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg w-full sm:w-auto text-center"
      >
        Upgrade
      </button>
    </div>
  </div>
)}
        {/* ── STEP 1: Style — Theme + Template ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-base font-black text-slate-900 mb-1">
              Choose Your Style
            </h2>
            <p className="text-slate-400 text-sm mb-4 sm:mb-6">
              Select a template and accent color for your ebook.
            </p>

            {/* Template picker - filtered by plan with default selection */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  PDF Template
                </label>
                {plan !== "pro" && (
                  <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                    {plan === "free"
                      ? "2 templates available"
                      : "4 templates available"}
                  </span>
                )}
                {plan === "pro" && (
                  <span className="text-[10px] text-purple-500 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                    6 premium templates
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TEMPLATES.filter((t) => {
                  if (plan === "free") return t.plan === "free";
                  if (plan === "starter")
                    return t.plan === "free" || t.plan === "starter";
                  return true; // Pro gets all
                }).map((t) => {
                  const isLocked =
                    (plan === "free" && t.plan !== "free") ||
                    (plan === "starter" && t.plan === "pro");
                  const isSelected = pdfTemplate === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => !isLocked && setPdfTemplate(t.id as any)}
                      className={`relative text-left rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                        isSelected && !isLocked
                          ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100 ring-2 ring-indigo-200"
                          : isLocked
                            ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                      disabled={isLocked}
                    >
                      {isLocked && (
                        <div className="absolute top-2 right-2 bg-slate-200 rounded-full px-2 py-0.5">
                          <span className="text-[8px] font-black text-slate-500 uppercase">
                            {t.plan === "pro" ? "PRO" : "UPGRADE"}
                          </span>
                        </div>
                      )}

                      {isSelected && !isLocked && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <p
                              className={`text-sm font-black ${isSelected && !isLocked ? "text-indigo-700" : isLocked ? "text-slate-400" : "text-slate-800"}`}
                            >
                              {t.label}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400 mb-2">
                            {t.desc}
                          </p>
                          <div
                            className={`h-16 rounded-lg overflow-hidden ${t.preview} ${t.id === "classic" ? "border border-slate-200" : ""}`}
                          >
                            <div className="p-2">
                              <div className="w-8 h-1.5 rounded bg-indigo-500 mb-2" />
                              <div className="w-full h-1.5 bg-slate-300 rounded mb-1 opacity-50" />
                              <div className="w-3/4 h-1.5 bg-slate-300 rounded opacity-30" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Template recommendation message */}
              {pdfTemplate && (
                <div className="mt-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                  <p className="text-[10px] text-indigo-600 text-center">
                    ✓{" "}
                    <span className="font-bold">
                      {TEMPLATES.find((t) => t.id === pdfTemplate)?.label}
                    </span>{" "}
                    template selected
                    {plan === "free" &&
                      pdfTemplate === "classic" &&
                      " — Great choice for clean, professional ebooks"}
                    {plan === "starter" &&
                      pdfTemplate === "premium" &&
                      " — Best for high-converting products"}
                    {plan === "pro" &&
                      pdfTemplate === "editorial" &&
                      " — Perfect for establishing authority"}
                  </p>
                </div>
              )}

              {/* Upgrade message for locked templates */}
              {plan === "free" && (
                <p className="text-center text-xs text-slate-400 mt-3">
                  🔒 Upgrade to Starter for 2 more templates, or Pro for 5+
                  premium templates
                </p>
              )}
              {plan === "starter" && (
                <p className="text-center text-xs text-slate-400 mt-3">
                  🔒 Upgrade to Pro for 2 premium templates (Editorial &
                  Corporate)
                </p>
              )}
            </div>

            {/* Theme picker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: activeTheme.hex }}
                  />
                  <span className="text-xs font-bold text-slate-600">
                    {activeTheme.label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                    className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border-2 ${
                      theme === t.id
                        ? "bg-white shadow-md scale-105"
                        : "border-transparent bg-slate-100 hover:bg-white hover:shadow-sm"
                    }`}
                    style={theme === t.id ? { borderColor: t.hex } : {}}
                  >
                    <span
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shadow-sm shrink-0"
                      style={{ backgroundColor: t.hex }}
                    />
                    <span
                      className={`hidden sm:inline ${theme === t.id ? "text-slate-800" : "text-slate-500"}`}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
              {/* Live preview bar */}
              <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-full w-full transition-all duration-300"
                  style={{
                    background: `linear-gradient(to right, ${activeTheme.hex}, ${activeTheme.hex}80)`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-indigo-200 cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* ── STEP 2: Cover Image - COMPLETE MOBILE FIX ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
            <h2 className="text-lg font-black text-slate-900 mb-1 break-words">
              Choose a Cover Image
            </h2>
            <p className="text-slate-400 text-xs mb-4 break-words">
              Pick a photo for your ebook cover. Powered by Unsplash.
            </p>

            {/* Search Section - Fixed width */}
            <div className="mb-5 w-full">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    idea?.niche ? `Search ${idea.niche}...` : "Search images..."
                  }
                  className="flex-1 min-w-0 w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none bg-slate-50 focus:bg-white transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery) {
                      fetchPhotos(searchQuery);
                    }
                  }}
                />
                <button
                  onClick={() => searchQuery && fetchPhotos(searchQuery)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Loading State */}
            {photosLoading && (
              <div className="mb-5 w-full">
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-video bg-slate-100 rounded-xl animate-pulse w-full"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Photos Grid - MOBILE OPTIMIZED with overflow prevention */}
            {!photosLoading && photos.length > 0 && (
              <div className="mb-5 w-full">
                <div className="grid grid-cols-2 gap-2 w-full max-w-full overflow-hidden">
                  {photos.slice(0, 8).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all w-full ${
                        selectedPhoto?.id === photo.id
                          ? "border-indigo-500 ring-2 ring-indigo-200"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={photo.urls.small}
                        alt={photo.alt_description || "Cover image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedPhoto?.id === photo.id && (
                        <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Images State */}
            {!photosLoading && photos.length === 0 && (
              <div className="text-center py-6 bg-slate-50 rounded-xl mb-5 w-full">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-2">No images found</p>
                <button
                  onClick={() => {
                    if (idea?.niche) {
                      fetchPhotos(idea.niche);
                    } else {
                      fetchPhotos("business");
                    }
                  }}
                  className="text-indigo-600 text-sm font-medium"
                >
                  Try default images
                </button>
              </div>
            )}

            {/* Selected Photo Preview */}
            {selectedPhoto && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-5 w-full overflow-hidden">
                <img
                  src={selectedPhoto.urls.thumb}
                  className="w-12 h-10 object-cover rounded-lg shrink-0"
                  alt="Selected cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-700">
                    ✓ Cover Selected
                  </p>
                  <p className="text-[10px] text-indigo-500 truncate">
                    Photo by {selectedPhoto.user?.name || "Unsplash"}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons - Fixed width */}
            <div className="flex gap-3 mt-2 w-full">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* ── STEP 3: Customize ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-black text-slate-900 mb-1">
              Customize Your Product
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Fine-tune before the AI generates your content.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Guide Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white outline-none transition"
                />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Writing Tone
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition cursor-pointer text-left ${
                          tone === t
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-slate-200 text-slate-600 hover:border-indigo-200 bg-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {/* BOOK LENGTH SELECTOR - MOBILE OPTIMIZED */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Book Length
                      </label>
                      <span className="text-[10px] sm:text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {bookLength === "short"
                          ? "10-15 pages"
                          : bookLength === "medium"
                            ? "20-30 pages"
                            : "50+ pages"}
                      </span>
                    </div>

                    {/* 3 column grid - FIXED for mobile text overflow */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {[
                        {
                          id: "short",
                          label: "Short",
                          pages: "10-15",
                          desc: "Quick read",
                          icon: "⚡",
                          chapters: 4,
                          plan: "all",
                        },
                        {
                          id: "medium",
                          label: "Medium",
                          pages: "20-30",
                          desc: "Standard",
                          icon: "📘",
                          chapters: 6,
                          plan: "starter",
                        },
                        {
                          id: "long",
                          label: "Long",
                          pages: "50+",
                          desc: "Premium",
                          icon: "📚",
                          chapters: 10,
                          plan: "pro",
                        },
                      ].map((opt) => {
                        const isDisabled =
                          (opt.id === "medium" && plan === "free") ||
                          (opt.id === "long" && plan !== "pro");
                        const isLocked = opt.id === "medium" && plan === "free";
                        const isProLocked = opt.id === "long" && plan !== "pro";

                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (isDisabled) {
                                if (isLocked) {
                                  toast.warning(
                                    "Medium length requires Starter plan. Upgrade to access.",
                                  );
                                  setShowUpgradeModal(true);
                                } else if (isProLocked) {
                                  toast.warning(
                                    "Long length requires Pro plan. Upgrade to access.",
                                  );
                                  setShowUpgradeModal(true);
                                }
                                return;
                              }
                              setBookLength(
                                opt.id as "short" | "medium" | "long",
                              );
                              setChapterCount(opt.chapters);
                            }}
                            className={`p-1.5 sm:p-2 md:p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                              bookLength === opt.id && !isDisabled
                                ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                                : isDisabled
                                  ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                            disabled={isDisabled}
                          >
                            {isLocked && (
                              <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                                <span className="text-[6px] sm:text-[8px] font-black text-amber-500">
                                  LOCKED
                                </span>
                              </div>
                            )}
                            {isProLocked && (
                              <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                                <span className="text-[6px] sm:text-[8px] font-black text-purple-500">
                                  PRO
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm sm:text-base md:text-lg">
                                {opt.icon}
                              </span>
                              <span
                                className={`text-[11px] sm:text-xs md:text-sm font-black ${
                                  bookLength === opt.id && !isDisabled
                                    ? "text-indigo-700"
                                    : isDisabled
                                      ? "text-slate-400"
                                      : "text-slate-700"
                                }`}
                              >
                                {opt.label}
                              </span>
                            </div>
                            <p
                              className={`text-[8px] sm:text-[9px] font-bold ${
                                bookLength === opt.id && !isDisabled
                                  ? "text-indigo-500"
                                  : "text-slate-400"
                              }`}
                            >
                              {opt.pages} pgs
                            </p>
                            <p className="text-[7px] sm:text-[8px] text-slate-400 mt-0.5 hidden sm:block">
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CHAPTERS SLIDER - CLEAN VERSION */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Chapters
                      </label>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {plan === "free" ? 3 : chapterCount}
                      </span>
                    </div>

                    {/* // Plan limit badge */}
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        plan === "free"
                          ? "bg-slate-100 text-slate-600"
                          : plan === "starter"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      }`}
                    >
                      {plan === "free"
                        ? "Free: Max 3 chapters"
                        : plan === "starter"
                          ? "Starter: Max 6 chapters"
                          : "Pro: Up to 12 chapters"}
                    </span>

                    {/* Slider - Different for each plan */}
                    {plan === "free" ? (
                      // Free plan - static message, no slider
                      <div className="w-full py-3 px-4 bg-slate-100 rounded-xl text-center text-sm font-medium text-slate-500">
                        Free plan limited to 3 chapters
                      </div>
                    ) : plan === "starter" ? (
                      <div>
                        <input
                          type="range"
                          min={4}
                          max={6}
                          step={1}
                          value={chapterCount}
                          onChange={(e) =>
                            setChapterCount(Number(e.target.value))
                          }
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>4</span>
                          <span>5</span>
                          <span>6</span>
                        </div>
                      </div>
                    ) : plan === "pro" ? (
                      <div>
                        <input
                          type="range"
                          min={4}
                          max={12}
                          step={1}
                          value={chapterCount}
                          onChange={(e) =>
                            setChapterCount(Number(e.target.value))
                          }
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>4</span>
                          <span>6</span>
                          <span>8</span>
                          <span>10</span>
                          <span>12</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Progress bar and page estimate */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-300"
                          style={{
                            width:
                              plan === "free"
                                ? "100%"
                                : plan === "starter"
                                  ? `${((chapterCount - 4) / 2) * 100}%`
                                  : `${((chapterCount - 4) / 8) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
                        ~
                        {(() => {
                          if (plan === "free") return "10-12";
                          if (bookLength === "short") return "12-15";
                          if (bookLength === "medium") return "25-35";
                          return "55-75"; // long
                        })()}{" "}
                        pages
                      </span>
                    </div>

                    {/* Estimated read time - MORE ACCURATE */}
                    <p className="text-xs text-slate-400 mt-2">
                      ⏱ Est.{" "}
                      {(() => {
                        // Base time per chapter based on book length
                        const minutesPerChapter =
                          bookLength === "short"
                            ? 2
                            : bookLength === "medium"
                              ? 3
                              : 5;
                        const totalMinutes =
                          chapterCount * minutesPerChapter + 2; // +2 for intro/conclusion
                        if (totalMinutes < 60) {
                          return `${totalMinutes} min read`;
                        } else {
                          const hours = Math.floor(totalMinutes / 60);
                          const mins = totalMinutes % 60;
                          return mins > 0
                            ? `${hours} hr ${mins} min read`
                            : `${hours} hr read`;
                        }
                      })()}
                    </p>

                    {/* Upgrade prompt for free users - shows only when limit is reached or near limit */}
                    {plan === "free" && (
                      <>
                        {usage.remaining === 0 ? (
                          // No generations left
                          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-[10px] text-amber-700 font-medium">
                              🔒 You've used all {usage.limit} free generations
                              this month.{" "}
                              <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="underline font-bold"
                              >
                                Upgrade to Starter
                              </button>{" "}
                              for 15 generations per month.
                            </p>
                          </div>
                        ) : usage.remaining <= 2 ? (
                          // Low generations left (2 or less)
                          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-[10px] text-blue-700 font-medium">
                              ⚡ You have {usage.remaining} generation
                              {usage.remaining !== 1 ? "s" : ""} left this
                              month.{" "}
                              <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="underline font-bold"
                              >
                                Upgrade to Starter
                              </button>{" "}
                              for 15 generations per month.
                            </p>
                          </div>
                        ) : chapterCount > 3 ? (
                          // User trying to select more than 3 chapters
                          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-[10px] text-amber-700 font-medium">
                              🔒 Free plan limited to 3 chapters.{" "}
                              <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="underline font-bold"
                              >
                                Upgrade to Starter
                              </button>{" "}
                              for up to 6 chapters.
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* Chapter Images Toggle - Only show for Starter/Pro plans */}
                  {(plan === "starter" || plan === "pro") && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          Include Chapter Images
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Add beautiful Unsplash images to each chapter
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeChapterImages}
                          onChange={(e) =>
                            setIncludeChapterImages(e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  )}

                  {/* PDF Customization - PRO ONLY */}
                  {plan === "pro" && (
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <button
                        onClick={() => setShowPdfSettings(!showPdfSettings)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-black text-slate-800">
                            PDF Customization
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                            PRO
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${showPdfSettings ? "rotate-180" : ""}`}
                        />
                      </button>

                      {showPdfSettings && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-4">
                          {/* Font Family */}
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">
                              Font Family
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() =>
                                  setPdfSettings({
                                    ...pdfSettings,
                                    fontFamily: "sans-serif",
                                  })
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition ${
                                  pdfSettings.fontFamily === "sans-serif"
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                Sans-serif (Modern)
                              </button>
                              <button
                                onClick={() =>
                                  setPdfSettings({
                                    ...pdfSettings,
                                    fontFamily: "serif",
                                  })
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition ${
                                  pdfSettings.fontFamily === "serif"
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                Serif (Classic)
                              </button>
                            </div>
                          </div>

                          {/* Font Size Slider */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-xs font-bold text-slate-600">
                                Font Size
                              </label>
                              <span className="text-xs font-bold text-indigo-600">
                                {pdfSettings.fontSize}pt
                              </span>
                            </div>
                            <input
                              type="range"
                              min="9"
                              max="13"
                              step="0.5"
                              value={pdfSettings.fontSize}
                              onChange={(e) =>
                                setPdfSettings({
                                  ...pdfSettings,
                                  fontSize: parseFloat(e.target.value),
                                })
                              }
                              className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                              <span>Small (9pt)</span>
                              <span>Normal (11pt)</span>
                              <span>Large (13pt)</span>
                            </div>
                          </div>

                          {/* Line Height */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-xs font-bold text-slate-600">
                                Line Height
                              </label>
                              <span className="text-xs font-bold text-indigo-600">
                                {pdfSettings.lineHeight}x
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1.2"
                              max="1.8"
                              step="0.1"
                              value={pdfSettings.lineHeight}
                              onChange={(e) =>
                                setPdfSettings({
                                  ...pdfSettings,
                                  lineHeight: parseFloat(e.target.value),
                                })
                              }
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          {/* Margins */}
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">
                              Margins
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                {
                                  id: "compact",
                                  label: "Compact",
                                  desc: "More content",
                                },
                                {
                                  id: "normal",
                                  label: "Normal",
                                  desc: "Balanced",
                                },
                                {
                                  id: "spacious",
                                  label: "Spacious",
                                  desc: "Easy reading",
                                },
                              ].map((margin) => (
                                <button
                                  key={margin.id}
                                  onClick={() =>
                                    setPdfSettings({
                                      ...pdfSettings,
                                      margins: margin.id as any,
                                    })
                                  }
                                  className={`p-2 rounded-lg border-2 transition text-center ${
                                    pdfSettings.margins === margin.id
                                      ? "border-indigo-500 bg-indigo-50"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  }`}
                                >
                                  <p className="text-xs font-bold">
                                    {margin.label}
                                  </p>
                                  <p className="text-[9px] text-slate-400">
                                    {margin.desc}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Toggles */}
                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-sm font-medium text-slate-700">
                              Show Page Numbers
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pdfSettings.showPageNumbers}
                                onChange={(e) =>
                                  setPdfSettings({
                                    ...pdfSettings,
                                    showPageNumbers: e.target.checked,
                                  })
                                }
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-sm font-medium text-slate-700">
                              Start Chapters on New Page
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pdfSettings.chapterStartPage === "new"}
                                onChange={(e) =>
                                  setPdfSettings({
                                    ...pdfSettings,
                                    chapterStartPage: e.target.checked
                                      ? "new"
                                      : "same",
                                  })
                                }
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>

                          {/* Preview Text */}
                          <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Live Preview
                            </p>
                            <p
                              className="text-slate-700"
                              style={{
                                fontFamily:
                                  pdfSettings.fontFamily === "serif"
                                    ? "Georgia, serif"
                                    : "Inter, sans-serif",
                                fontSize: `${pdfSettings.fontSize}pt`,
                                lineHeight: pdfSettings.lineHeight,
                              }}
                            >
                              This is how your text will appear in the exported
                              PDF. Pro users can customize every aspect of their
                              ebook's typography.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TARGET PRICE
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Target Price
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        "$4.99",
                        "$9.99",
                        "$14.99",
                        "$19.99",
                        "$24.99",
                        "$49.99",
                      ].map((p) => (
                        <button
                          key={p}
                          onClick={() => setTargetPrice(p)}
                          className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                            targetPrice === p
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-slate-200 text-slate-600 hover:border-indigo-300"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div> */}
                  {/* Mini preview */}
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    {selectedPhoto && (
                      <img
                        src={selectedPhoto.urls.small}
                        className="w-full h-20 object-cover"
                      />
                    )}
                    <div className="p-3 bg-slate-50">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: activeTheme.hex }}
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {activeTheme.label} ·{" "}
                          {TEMPLATES.find((t) => t.id === template)?.label}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-800 truncate">
                        {customTitle}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 hover:border-slate-300 transition cursor-pointer text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Back
              </button>
              <button
                onClick={async () => {
                  setIsCheckingLimit(true);
                  await refreshUsage();
                  setIsCheckingLimit(false);

                  if (plan !== "pro" && usage.remaining <= 0) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  trackEvent.regenerateEbook(plan);
                  
                  setStep(4);
                  setTimeout(() => handleGenerate(false), 300);
                }}
                disabled={!customTitle || isCheckingLimit}
                className="flex-[1.5] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition cursor-pointer shadow-md shadow-indigo-200 text-xs sm:text-sm"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">
                  Generate{" "}
                  {plan === "free" ? Math.min(3, chapterCount) : chapterCount}{" "}
                  Chapters
                </span>
              </button>
            </div>
          </div>
        )}
        {/* ── STEP 4: Generating ── */}
        {step === 4 && (
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
            {" "}
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-indigo-600 animate-pulse" />
            </div>
            {plan === "pro" && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                PRIORITY
              </div>
            )}
            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
              Forging Your Product
            </h2>
            <p className="text-slate-400 text-sm mb-1">
              Writing your {chapterCount}-chapter guide with AI
            </p>
            <p className="text-xs text-slate-300 mb-8">
              Est.{" "}
              {(() => {
                // AI generation time - more accurate
                const secondsPerChapter =
                  bookLength === "short"
                    ? 15
                    : bookLength === "medium"
                      ? 25
                      : 40;
                const totalSeconds = chapterCount * secondsPerChapter + 10;
                const minutes = Math.ceil(totalSeconds / 60);
                return `${minutes} min — don't close this tab`;
              })()}
            </p>
            <div className="max-w-sm mx-auto space-y-2 mb-8 max-h-72 overflow-y-auto pr-1">
              {genSteps.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 text-left ${
                    i < genStep
                      ? "bg-indigo-50 opacity-70"
                      : i === genStep
                        ? "bg-indigo-100 shadow-sm"
                        : "opacity-20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      i < genStep
                        ? "bg-indigo-600"
                        : i === genStep
                          ? "bg-indigo-400"
                          : "bg-slate-200"
                    }`}
                  >
                    {i < genStep ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : i === genStep ? (
                      <span className="w-2 h-2 bg-white rounded-full animate-ping block" />
                    ) : null}
                  </div>
                  <span
                    className={`text-sm ${i < genStep ? "text-slate-500" : i === genStep ? "text-slate-800 font-semibold" : "text-slate-400"}`}
                  >
                    {s}
                  </span>
                  {i === genStep && (
                    <div className="flex gap-1 ml-auto shrink-0">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="max-w-sm mx-auto">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>{Math.round((genStep / genSteps.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(genStep / genSteps.length) * 100}%` }}
                />
              </div>
            </div>
            {genError && (
              <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl p-4 text-sm mt-6">
                {genError}
                <button
                  onClick={() => {
                    setStep(3);
                    setGenError("");
                  }}
                  className="ml-3 underline cursor-pointer font-bold"
                >
                  Go back
                </button>
              </div>
            )}
          </div>
        )}
        {/* ── STEP 5: Preview & Edit ── */}
        {step === 5 && editedContent && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Preview & Edit
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Edit any section, then export your PDF
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {" "}
                {/* Regenerate button - SIMPLE VERSION */}
                <button
                  onClick={async () => {
                    // Check if user has generation credits left
                    if (usage.remaining <= 0 && plan === "free") {
                      setShowUpgradeModal(true);
                      toast.warning(
                        `You've used all ${usage.limit} free generations this month. Upgrade to continue.`,
                      );
                      return;
                    }
                    setStep(4);
                    setTimeout(() => handleGenerate(true), 300);
                  }}
                  className="flex items-center gap-2 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
                {/* DOCX Export - Pro Only */}
                {plan === "pro" && (
                  <button
                    onClick={handleDocxExport}
                    disabled={exporting}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {exporting ? "..." : "DOCX"}
                  </button>
                )}
                {/* PDF Export */}
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className={`flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer ${
                    exporting
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                  } text-white`}
                >
                  {exporting ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {exportError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4 text-sm font-medium">
                {exportError}
              </div>
            )}

            <div className="space-y-4">
              {/* Cover preview */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {selectedPhoto && (
                  <img
                    src={selectedPhoto.urls.regular}
                    className="w-full h-52 object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeTheme.hex }}
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {activeTheme.label} ·{" "}
                      {TEMPLATES.find((t) => t.id === template)?.label}
                    </span>
                  </div>
                  <input
                    value={editedContent.title}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        title: e.target.value,
                      })
                    }
                    className="w-full text-xl font-black text-slate-900 bg-transparent border-b-2 border-transparent focus:border-indigo-400 outline-none mb-2 pb-1"
                  />
                  <input
                    value={editedContent.subtitle}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        subtitle: e.target.value,
                      })
                    }
                    className="w-full text-sm text-slate-500 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                  />
                </div>
              </div>

              {/* Introduction */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Introduction
                </h3>
                <textarea
                  value={editedContent.introduction}
                  onChange={(e) =>
                    setEditedContent({
                      ...editedContent,
                      introduction: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full text-sm text-slate-700 bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-300 rounded-xl p-3 outline-none resize-none transition"
                />
              </div>

              {/* Chapters */}
              {editedContent.chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-indigo-500 uppercase tracking-wider">
                      Ch. {idx + 1} / {editedContent.chapters.length}
                    </span>
                    <button
                      onClick={() =>
                        setEditingChapter(editingChapter === idx ? null : idx)
                      }
                      className="text-xs text-slate-400 hover:text-indigo-600 transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <Edit3 className="w-3 h-3" />
                      {editingChapter === idx ? "Collapse" : "Edit"}
                    </button>
                  </div>
                  <input
                    value={ch.title}
                    onChange={(e) =>
                      updateChapter(idx, "title", e.target.value)
                    }
                    className="w-full text-sm font-black text-slate-900 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none mb-3 pb-1"
                  />
                  {editingChapter === idx ? (
                    <textarea
                      value={ch.content}
                      onChange={(e) =>
                        updateChapter(idx, "content", e.target.value)
                      }
                      rows={8}
                      className="w-full text-sm text-slate-700 bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-300 rounded-xl p-3 outline-none resize-none transition"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {ch.content}
                    </p>
                  )}
                  {ch.tips?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ch.tips.map((tip, ti) => (
                        <span
                          key={ti}
                          className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium"
                        >
                          ✓ {tip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Conclusion */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Conclusion
                </h3>
                <textarea
                  value={editedContent.conclusion}
                  onChange={(e) =>
                    setEditedContent({
                      ...editedContent,
                      conclusion: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full text-sm text-slate-700 bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-300 rounded-xl p-3 outline-none resize-none transition"
                />
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-200"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>
        )}
        {/* ── STEP 6: Done ── */}
        {step === 6 && (
          <div className="space-y-6">
            {/* Success Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-16 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                Your Product is Ready! 🎉
              </h2>

              {/* After PDF downloaded message */}
              <p className="text-slate-400 text-sm mb-8">
                PDF downloaded
                {plan === "pro" ? " (DOCX also available in Pro)" : ""}. Your
                ebook has been saved to your library.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                {[
                  { label: "Gumroad", emoji: "💰", url: "https://gumroad.com" },
                  { label: "Payhip", emoji: "🛒", url: "https://payhip.com" },
                  { label: "Etsy", emoji: "🏪", url: "https://etsy.com" },
                ].map((p) => (
                  <a
                    key={p.label}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 border border-slate-200 hover:border-indigo-300 rounded-xl transition group"
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition">
                      Sell on {p.label}
                    </span>
                  </a>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={() => router.push("/dashboard/generate")}
                  className="border border-slate-200 hover:border-indigo-300 text-slate-600 font-bold px-6 py-3 rounded-xl transition cursor-pointer text-sm"
                >
                  Generate More Ideas
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-bold px-6 py-3 rounded-xl transition cursor-pointer text-sm"
                >
                  <Edit3 className="w-4 h-4" /> Edit & Re-export
                </button>
                <button
                  onClick={async () => {
                    // Refresh usage data first to ensure we have latest count
                    await refreshUsage();

                    // Check if user can generate before regenerating
                    if (usage.remaining <= 0 && plan === "free") {
                      setShowUpgradeModal(true);
                      toast.warning(
                        `You've used all ${usage.limit} free generations this month. Upgrade to continue.`,
                      );
                      return;
                    }
                    setStep(4);
                    setTimeout(() => handleGenerate(true), 300);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl transition cursor-pointer text-sm shadow-md shadow-indigo-200"
                >
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </button>
              </div>
            </div>

{/* Monetization Panel - FULLY MOBILE OPTIMIZED */}
<div className="mt-6 sm:mt-0">
  <button
    onClick={() => setShowMonetization(!showMonetization)}
    className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:shadow-md transition"
  >
    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-sm sm:text-base font-black text-amber-800 truncate">
          Monetize Your Product
        </p>
        <p className="text-[10px] sm:text-xs text-amber-600 truncate">
          Generate sales pages, social content, and more
        </p>
      </div>
    </div>
    <span className="text-amber-600 text-xl sm:text-2xl ml-2 shrink-0">
      {showMonetization ? "−" : "+"}
    </span>
  </button>

  {showMonetization && editedContent && (
    <div className="mt-3 sm:mt-4">
      <MonetizationPanel
        ebookData={{
          title: editedContent.title || customTitle,
          subtitle: editedContent.subtitle || subtitle,
          chapters: editedContent.chapters || [],
          targetAudience: idea?.targetAudience,
        }}
        userPlan={plan}
      />
    </div>
  )}
</div>
          </div>
        )}
{/* Upgrade Modal - WITH OVERRIDE */}
{showUpgradeModal && (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}
    onClick={() => setShowUpgradeModal(false)}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl"
      style={{
        width: '320px',
        maxWidth: 'calc(100% - 2rem)',
        margin: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-5">
        {/* Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-center font-black text-slate-900 text-base mb-1">
          Upgrade to continue
        </h3>
        <p className="text-center text-xs text-slate-500 mb-4">
          {usage.used}/{usage.limit} generations used
        </p>

        {/* Plan Buttons */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => {
              setShowUpgradeModal(false);
              router.push("/pricing?plan=starter");
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition"
          >
            <span className="font-bold text-slate-800 text-sm">Starter</span>
            <span className="font-bold text-indigo-600 text-sm">$9</span>
          </button>

          <button
            onClick={() => {
              setShowUpgradeModal(false);
              router.push("/pricing?plan=pro");
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition"
          >
            <span className="font-bold text-slate-800 text-sm">Pro</span>
            <span className="font-bold text-purple-600 text-sm">$19</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-slate-100 pt-3 mt-1">
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      </main>
    </div>
  );
}
