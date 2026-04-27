"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  // Catch the email if it was passed from the footer newsletter
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else {
      trackEvent.login("email");
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#0d0f14] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Glows to match landing page */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 w-full max-w-md shadow-2xl relative z-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex flex-col items-center gap-4 mb-10 justify-center cursor-pointer group"
        >
          <div className="rounded-2xl p-2 shadow-lg shadow-indigo-600/20 group-hover:rotate-6 transition-transform">
            <Image
              src="/digiforge_logo.png"
              alt="DigiForge Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <span className="font-black text-white text-xl tracking-tighter uppercase">
              DigiForge<span className="text-indigo-500">AI</span>
            </span>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1">
              Login
            </p>
          </div>
        </Link>

        {/* Google Login - The "Social" Button */}
        <button
          onClick={handleGoogle}
          className="w-full bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 rounded-2xl py-4 flex items-center justify-center gap-3 text-xs font-black text-white transition-all cursor-pointer mb-6 uppercase tracking-widest"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Account
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
            Secure Email Entry
          </span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Input Fields */}
        <div className="space-y-5 mb-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="w-full bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-700 outline-none transition"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] text-zinc-600 hover:text-indigo-400 font-black uppercase tracking-widest transition"
              >
                Lost Key?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="PASSWORD"
                className="w-full bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder:text-zinc-700 outline-none transition"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-xs font-bold mb-6 text-center tracking-wide">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-xs transition-all cursor-pointer uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group"
        >
          {loading ? (
            "Validating..."
          ) : (
            <>
              Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-10">
          New to the system?{" "}
          <Link
            href="/signup"
            className="text-indigo-400 hover:text-indigo-300 transition underline underline-offset-4"
          >
            Create Free Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
