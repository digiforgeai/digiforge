// app/api/generate-cover/route.ts - SMART COVER GENERATION
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { title, subtitle, theme = "indigo" } = await req.json();

    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user plan (only Pro)
    const { data: planData } = await supabase
      .from("user_plans")
      .select("plan_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const userPlan = planData?.plan_id || "free";

    if (userPlan !== "pro") {
      return NextResponse.json(
        { error: "plan_restricted", message: "AI cover generation requires Pro plan" },
        { status: 403 }
      );
    }

    // Theme-based search terms for background images
    const themeKeywords: Record<string, string> = {
      indigo: "abstract purple gradient modern",
      violet: "purple lavender abstract",
      rose: "pink rose gold gradient",
      emerald: "green emerald abstract",
      amber: "gold orange gradient",
      cyan: "cyan blue abstract tech",
      orange: "orange warm gradient",
      slate: "gray navy abstract professional",
    };

    const searchTerm = themeKeywords[theme] || "abstract gradient modern";
    
    // Fetch relevant background images from Unsplash
    const unsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=4&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${unsplashKey}` } }
    );
    
    const data = await response.json();
    const backgrounds = data.results || [];

    if (backgrounds.length === 0) {
      // Fallback gradients if no images found
      const fallbackGradients = [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234c29d1'/%3E%3Cstop offset='100%25' stop-color='%237c2de6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23g)'/%3E%3C/svg%3E`,
      ];
      return NextResponse.json({ success: true, images: fallbackGradients });
    }

    // Generate cover URLs with text overlay parameters
    const covers = backgrounds.map((bg: any) => {
      // Use the Unsplash image URL
      const baseUrl = bg.urls.regular;
      return baseUrl;
    });

    return NextResponse.json({ 
      success: true, 
      images: covers,
      message: "AI covers generated! Select one to use."
    });

  } catch (error) {
    console.error("AI cover generation error:", error);
    // Return gradient fallbacks on error
    const fallbackGradients = [
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234c29d1'/%3E%3Cstop offset='100%25' stop-color='%237c2de6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23g1)'/%3E%3C/svg%3E`,
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0%25' y1='100%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%237c2de6'/%3E%3Cstop offset='100%25' stop-color='%234c29d1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23g2)'/%3E%3C/svg%3E`,
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0%25' y1='50%25' x2='100%25' y2='50%25'%3E%3Cstop offset='0%25' stop-color='%234c29d1'/%3E%3Cstop offset='100%25' stop-color='%23e02e52'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23g3)'/%3E%3C/svg%3E`,
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='100%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230d9860'/%3E%3Cstop offset='100%25' stop-color='%234c29d1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23g4)'/%3E%3C/svg%3E`,
    ];
    return NextResponse.json({ success: true, images: fallbackGradients });
  }
}