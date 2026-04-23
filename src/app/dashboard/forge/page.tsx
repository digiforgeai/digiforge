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
    id: "modern",
    label: "Modern",
    desc: "Full-bleed image, big bold title overlay",
    preview: (hex: string) => (
      <div className="w-full h-28 rounded-xl overflow-hidden relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <div className="absolute bottom-3 left-3 right-3">
          <div
            className="h-2 rounded mb-1.5"
            style={{ backgroundColor: hex, width: "60%" }}
          />
          <div className="h-4 bg-white rounded mb-1" style={{ width: "90%" }} />
          <div className="h-4 bg-white/80 rounded" style={{ width: "75%" }} />
        </div>
        <div className="absolute top-2 left-3 right-3 flex justify-between">
          <div className="h-1.5 w-16 bg-white/40 rounded" />
          <div className="h-1.5 w-12 bg-white/30 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "bold",
    label: "Bold",
    desc: "Dark top panel with title, image below",
    preview: (hex: string) => (
      <div className="w-full h-28 rounded-xl overflow-hidden relative bg-gray-900 flex flex-col">
        <div
          className="flex-1 flex flex-col justify-center px-3 py-2"
          style={{ background: "#0f0f18" }}
        >
          <div
            className="h-1.5 rounded mb-2"
            style={{ backgroundColor: hex, width: "30%" }}
          />
          <div className="h-3 bg-white rounded mb-1" style={{ width: "85%" }} />
          <div className="h-3 bg-white/70 rounded" style={{ width: "65%" }} />
        </div>
        <div className="h-10 bg-gray-600 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    label: "Minimal",
    desc: "Clean white panel, image accent top",
    preview: (hex: string) => (
      <div className="w-full h-28 rounded-xl overflow-hidden relative bg-white flex flex-col border border-slate-200">
        <div className="h-16 bg-gray-700 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>
        <div className="h-1.5" style={{ backgroundColor: hex }} />
        <div className="flex-1 px-3 py-2">
          <div
            className="h-3 bg-gray-900 rounded mb-1.5"
            style={{ width: "80%" }}
          />
          <div className="h-2.5 bg-gray-400 rounded" style={{ width: "60%" }} />
        </div>
      </div>
    ),
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
  const [pdfTemplate, setPdfTemplate] = useState<"premium" | "classic">(
    "premium",
  );
  const [exportProgress, setExportProgress] = useState(0);
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
  const {
    plan,
    usage,
    loading: subscriptionLoading,
    refresh: refreshUsage,
  } = useSubscription();

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
  // ========== FETCH PHOTOS ==========
  const fetchPhotos = useCallback(async (query: string) => {
    if (!query) return;
    setPhotosLoading(true);
    setPhotos([]);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `/api/unsplash?query=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPhotos(data.photos || []);
      if (data.photos?.length) setSelectedPhoto(data.photos[0]);
    } catch (err) {
      console.error("Unsplash fetch error:", err);
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
        console.log("Restoring from library:", ebook.title);

        // Set flag that this is from library (not a new generation)
        sessionStorage.setItem("isFromLibrary", "true");

        // Restore all the data
        setCustomTitle(ebook.title);
        setSubtitle(ebook.subtitle || "");
        setEditedContent(ebook.content);
        setContent(ebook.content);
        setTheme(ebook.theme || "indigo");
        setPdfTemplate(ebook.template || "premium");
        setChapterCount(ebook.chapterCount || 6);

        if (ebook.coverImageUrl) {
          setSelectedPhoto({
            urls: { regular: ebook.coverImageUrl, small: ebook.coverImageUrl },
          });
        }

        setIdea({
          title: ebook.title,
          angle: ebook.subtitle || "",
          targetAudience: ebook.niche || "Readers",
          forgeScore: 85,
          trend: "Hot",
          niche: ebook.niche || "General",
        });

        // Jump to step 5 (preview & edit)
        setStep(5);

        // Clear the session storage
        sessionStorage.removeItem("forge_restore_ebook");

        toast.success(`Loaded "${ebook.title}" successfully`);
        return;
      } catch (err) {
        console.error("Failed to restore ebook:", err);
        sessionStorage.removeItem("forge_restore_ebook");
        sessionStorage.removeItem("isFromLibrary");
      }
    }

    // Check for regular forge idea (from generate page)
    const stored = sessionStorage.getItem("forgeIdea");
    console.log("forgeIdea:", stored);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log("Found forge idea:", parsed.title);

        // Clear any library flag
        sessionStorage.removeItem("isFromLibrary");

        if (parsed.title) {
          setIdea(parsed);
          setCustomTitle(parsed.title);
          setSubtitle(parsed.angle || "");
          if (parsed.theme) setTheme(parsed.theme);
          if (parsed.niche) fetchPhotos(parsed.niche);
          return; // Success - exit
        }
      } catch (err) {
        console.error("Failed to parse forge idea:", err);
      }
    }

    // If we get here, no valid data found
    console.log("No valid data found, showing error");
    setForgeError(
      "No product selected. Please generate or select an idea first.",
    );
  }, []);

  // Add this useEffect to reset chapter count when plan loads
  useEffect(() => {
    if (plan === "free") {
      setChapterCount(3);
      setBookLength("short"); // ← Force short length for free users
    } else if (plan === "starter") {
      setChapterCount(4);
      setBookLength("medium"); // ← Default to medium for starter
    } else if (plan === "pro") {
      setChapterCount(6);
      setBookLength("medium");
    }
  }, [plan]);

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
  setGenerating(true);
  setGenStep(0);
  setGenError("");
  
  // Update genSteps to show priority messages for Pro users
  if (plan === 'pro') {
    const prioritySteps = [
      "⚡ PRIORITY: Reading your customizations...",
      "⚡ Writing introduction at lightning speed...",
      ...Array.from({ length: chapterCount }, (_, i) => `⚡ Writing chapter ${i + 1} of ${chapterCount} (Priority)...`),
      "⚡ Writing conclusion...",
      "⚡ Finalizing your premium guide..."
    ];
    setGenSteps(prioritySteps);
  } else {
    setGenSteps(buildGenSteps(chapterCount));
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
          chapterCount,
          bookLength,
        },
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
            // For Pro users, handle priority step progression
            if (plan === 'pro') {
              // Progress through steps based on the message content
              const stepMessage = data.step || "";
              
              // Determine which step we're on
              let stepIndex = -1;
              
              if (stepMessage.includes("Planning") || stepMessage.includes("structure")) {
                stepIndex = 0;
              } else if (stepMessage.includes("introduction") || stepMessage.includes("Intro")) {
                stepIndex = 1;
              } else if (stepMessage.includes("chapter")) {
                // Extract chapter number from message
                const chapterMatch = stepMessage.match(/chapter (\d+)/i);
                if (chapterMatch) {
                  const chapterNum = parseInt(chapterMatch[1]);
                  stepIndex = 1 + chapterNum; // intro is 1, chapters start at 2
                }
              } else if (stepMessage.includes("conclusion")) {
                stepIndex = 1 + chapterCount + 1; // after all chapters
              } else if (stepMessage.includes("Finalizing")) {
                stepIndex = 1 + chapterCount + 2; // last step
              }
              
              if (stepIndex !== -1 && stepIndex < genSteps.length) {
                setGenStep(stepIndex);
              } else {
                // Fallback: increment step gradually
                setGenStep((prev) => Math.min(prev + 1, genSteps.length - 1));
              }
            } else {
              // Regular users - use existing logic
              const idx = genSteps.findIndex((s) =>
                s.toLowerCase().includes(
                  data.step?.toLowerCase()?.split(" ").slice(0, 3).join(" ") || ""
                )
              );
              if (idx !== -1) {
                setGenStep(idx);
              } else {
                setGenStep((prev) => Math.min(prev + 1, genSteps.length - 2));
              }
            }
          }
          
          if (data.event === "chapter_done") {
            if (plan === 'pro') {
              // Update to show current chapter progress
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
            
            await refreshUsage();
            
            // ========== SAVE TO DATABASE ONLY ON FIRST GENERATION ==========
            const isFromLibrary = sessionStorage.getItem("isFromLibrary") === "true";
            const isNewGeneration = !isFromLibrary && !sessionStorage.getItem("forge_restore_ebook");
            
            if (isNewGeneration) {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && data.content) {
                  await saveToSupabase({
                    title: data.content.title || customTitle,
                    subtitle: data.content.subtitle || subtitle,
                    niche: idea?.niche || "",
                    theme: theme,
                    template: pdfTemplate || "premium",
                    chapterCount: data.content.chapters?.length || 0,
                    coverImageUrl: selectedPhoto?.urls?.regular || null,
                    content: data.content,
                  });
                  console.log("New ebook saved to library");
                  clearDraft();
                }
              } catch (err) {
                console.error("Could not save to library:", err);
              }
            }
            
            sessionStorage.removeItem("isFromLibrary");
          }
          
          if (data.event === "error") throw new Error(data.message);
        } catch {}
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
      throw new Error(errorData.message || `Export failed: ${response.status}`);
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
      <div className="flex w-full min-h-screen bg-[#f5f6fa]">
        <Sidebar />
        <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">
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
    <div className="flex w-full min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      <main className="flex-1 md:ml-60 px-4 md:px-8 pt-20 md:pt-10 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/dashboard/generate")}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Forge Product
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 truncate max-w-xs md:max-w-md">
              {customTitle}
            </p>
          </div>
        </div>

        {/* Draft Restore Prompt */}
        {showDraftPrompt && draftData && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
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
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Unsaved Draft Found
                </p>
                <p className="text-xs text-amber-600">
                  We found an unfinished ebook from your last session
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={restoreDraft}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition"
              >
                Restore Draft
              </button>
              <button
                onClick={() => {
                  clearDraft();
                  setShowDraftPrompt(false);
                }}
                className="px-4 py-2 border border-amber-300 text-amber-700 text-sm font-bold rounded-lg transition"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      step > s.id
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : step === s.id
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                          : "border-slate-200 text-slate-300 bg-white"
                    }`}
                  >
                    {step > s.id ? <Check className="w-4 h-4" /> : s.icon}
                  </div>
                  <span
                    className={`text-[10px] font-bold hidden sm:block uppercase tracking-wide ${step >= s.id ? "text-slate-600" : "text-slate-300"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-1 rounded transition-all ${step > s.id ? "bg-indigo-600" : "bg-slate-100"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: Style — Theme + Template ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-black text-slate-900 mb-1">
              Choose Your Style
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Select a template and accent color for your ebook.
            </p>

            {/* Template picker - UPDATED with PREMIUM option */}
            <div className="mb-7">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                PDF Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "premium",
                    label: "Premium",
                    desc: "Dark theme with bold typography, ideal for high-ticket products",
                    icon: "👑",
                    preview: "bg-gradient-to-br from-slate-900 to-slate-800",
                  },
                  {
                    id: "classic",
                    label: "Classic",
                    desc: "Clean white background, professional and timeless",
                    icon: "📖",
                    preview: "bg-white border",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      setPdfTemplate(t.id as "premium" | "classic")
                    }
                    className={`text-left rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                      pdfTemplate === t.id
                        ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <p
                            className={`text-sm font-black ${pdfTemplate === t.id ? "text-indigo-700" : "text-slate-800"}`}
                          >
                            {t.label}
                          </p>
                          {pdfTemplate === t.id && (
                            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">
                          {t.desc}
                        </p>
                        <div
                          className={`h-16 rounded-lg ${t.preview} ${t.id === "classic" ? "border border-slate-200" : ""}`}
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
                ))}
              </div>
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
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                      theme === t.id
                        ? "bg-white shadow-md scale-105"
                        : "border-transparent bg-slate-100 hover:bg-white hover:shadow-sm hover:scale-105"
                    }`}
                    style={theme === t.id ? { borderColor: t.hex } : {}}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: t.hex }}
                    />
                    <span
                      className={
                        theme === t.id ? "text-slate-800" : "text-slate-500"
                      }
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

        {/* ── STEP 2: Cover Image ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-black text-slate-900 mb-1">
              Choose a Cover Image
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Pick a photo for your ebook cover. Powered by Unsplash.
            </p>

            {photosLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-video bg-slate-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            )}
            {!photosLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedPhoto?.id === photo.id
                        ? "border-indigo-500 shadow-md shadow-indigo-100"
                        : "border-transparent hover:border-indigo-300"
                    }`}
                  >
                    <img
                      src={photo.urls.small}
                      alt={photo.alt_description}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search different images..."
                className="flex-1 border border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none bg-slate-50 focus:bg-white transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery)
                    fetchPhotos(searchQuery);
                }}
              />
              <button
                onClick={() => searchQuery && fetchPhotos(searchQuery)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* Add this after the search button in Step 2 */}
            {!photosLoading && photos.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-xl mb-6">
                <p className="text-sm text-slate-500 mb-3">
                  Unable to load images right now
                </p>
                <button
                  onClick={() => {
                    setSelectedPhoto(null);
                    setStep(3);
                  }}
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                >
                  Continue without cover image →
                </button>
              </div>
            )}

            {selectedPhoto && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-6">
                <img
                  src={selectedPhoto.urls.thumb}
                  className="w-12 h-8 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-700">Selected</p>
                  <p className="text-xs text-indigo-500 truncate">
                    Photo by {selectedPhoto.user?.name} on Unsplash
                  </p>
                </div>
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:border-slate-300 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedPhoto}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-200"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  {/* BOOK LENGTH SELECTOR - WITH PLAN LIMITS */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Book Length
                      </label>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {bookLength === "short"
                          ? "10-15 pages"
                          : bookLength === "medium"
                            ? "20-30 pages"
                            : "50+ pages"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          id: "short",
                          label: "Short",
                          pages: "10-15 pgs",
                          desc: "Quick read",
                          icon: "⚡",
                          chapters: 4,
                          plan: "all",
                        },
                        {
                          id: "medium",
                          label: "Medium",
                          pages: "20-30 pgs",
                          desc: "Standard",
                          icon: "📘",
                          chapters: 6,
                          plan: "starter",
                        },
                        {
                          id: "long",
                          label: "Long",
                          pages: "50+ pgs",
                          desc: "Premium",
                          icon: "📚",
                          chapters: 10,
                          plan: "pro",
                        },
                      ].map((opt) => {
                        // Check if user has access to this length
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
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left relative ${
                              bookLength === opt.id && !isDisabled
                                ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                                : isDisabled
                                  ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                            disabled={isDisabled}
                          >
                            {isLocked && (
                              <div className="absolute top-2 right-2">
                                <span className="text-[8px] font-black text-amber-500">
                                  LOCKED
                                </span>
                              </div>
                            )}
                            {isProLocked && (
                              <div className="absolute top-2 right-2">
                                <span className="text-[8px] font-black text-purple-500">
                                  PRO
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{opt.icon}</span>
                              <span
                                className={`text-sm font-black ${bookLength === opt.id && !isDisabled ? "text-indigo-700" : isDisabled ? "text-slate-400" : "text-slate-700"}`}
                              >
                                {opt.label}
                              </span>
                            </div>
                            <p
                              className={`text-[10px] font-bold ${bookLength === opt.id && !isDisabled ? "text-indigo-500" : "text-slate-400"}`}
                            >
                              {opt.pages}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">
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

                    {/* Plan limit badge */}
                    <div className="mb-3">
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
                    </div>

                    {/* Slider - Different for each plan */}
                    {plan === "free" ? (
                      // Free plan - static message, no slider
                      <div className="w-full py-3 px-4 bg-slate-100 rounded-xl text-center text-sm font-medium text-slate-500">
                        Free plan limited to 3 chapters
                      </div>
                    ) : plan === "starter" ? (
                      // Starter plan - slider from 4 to 6
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
                          <span>4 chapters</span>
                          <span>5 chapters</span>
                          <span>6 chapters</span>
                        </div>
                      </div>
                    ) : (
                      // Pro plan - slider from 4 to 12
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
                    )}

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
                              to continue creating.
                            </p>
                          </div>
                        ) : usage.remaining === 1 ? (
                          // One generation left
                          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-[10px] text-blue-700 font-medium">
                              ⚡ You have {usage.remaining} generation left this
                              month.{" "}
                              <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="underline font-bold"
                              >
                                Upgrade to Starter
                              </button>{" "}
                              for 10 generations per month.
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
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:border-slate-300 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={async () => {
                  await refreshUsage();
                  if (usage.remaining <= 0 && plan === "free") {
                    setShowUpgradeModal(true);
                    toast.warning(
                      `You've used all ${usage.limit} free generations this month.`,
                    );
                    return;
                  }
                  setStep(4);
                  setTimeout(() => handleGenerate(false), 300);
                }}
                disabled={!customTitle}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-200"
              >
                <Sparkles className="w-4 h-4" />
                Generate{" "}
                {plan === "free"
                  ? Math.min(3, chapterCount)
                  : chapterCount}{" "}
                Chapters
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Generating ── */}
        {step === 4 && (
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
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
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Preview & Edit
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Edit any section, then export your PDF
                </p>
              </div>
{/* // In step 5, replace the export button section with this: */}

<div className="flex gap-2">
  {/* Regenerate button */}
  <button
    onClick={async () => {
      await refreshUsage();
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                Your Product is Ready! 🎉
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                PDF downloaded. Your ebook has been saved to your library.
              </p>
              {/* After PDF downloaded message */}
<p className="text-slate-400 text-sm mb-8">
  PDF downloaded{plan === "pro" ? " (DOCX also available in Pro)" : ""}. 
  Your ebook has been saved to your library.
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
              <div className="flex gap-3 justify-center flex-wrap">
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

            {/* Monetization Panel - Add this right after the success card */}
            <div>
              <button
                onClick={() => setShowMonetization(!showMonetization)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-amber-800">
                      Monetize Your Product
                    </p>
                    <p className="text-xs text-amber-600">
                      Generate sales pages, social content, and more
                    </p>
                  </div>
                </div>
                <span className="text-amber-600 text-xl">
                  {showMonetization ? "−" : "+"}
                </span>
              </button>

              {showMonetization && editedContent && (
                <div className="mt-4">
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
      </main>
    </div>
  );
}
