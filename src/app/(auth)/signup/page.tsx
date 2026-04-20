'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignup = async () => {
    if (!email || !password || !fullName) return
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  if (success) {
    return (
      <div className="w-full min-h-screen bg-[#f4f6fb] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-gray-700">{email}</span>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="text-indigo-600 font-semibold text-sm hover:underline cursor-pointer"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#f4f6fb] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center cursor-pointer">
          <div className="bg-indigo-600 rounded-lg p-1.5">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">DigiForgeAI</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Start building Digital Products today — free</p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl py-3 flex items-center justify-center gap-3 text-sm font-medium text-gray-700 transition cursor-pointer mb-5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Oscar Nartey"
                className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white outline-none transition cursor-text"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white outline-none transition cursor-text"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignup()}
                placeholder="Min. 8 characters"
                className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white outline-none transition cursor-text"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-2 flex gap-1">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      password.length >= i * 3
                        ? password.length >= 10 ? 'bg-green-400' : password.length >= 7 ? 'bg-yellow-400' : 'bg-red-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {password.length >= 10 ? 'Strong' : password.length >= 7 ? 'Good' : 'Weak'}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSignup}
          disabled={loading || !email || !password || !fullName}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition cursor-pointer"
        >
          {loading ? 'Creating account...' : 'Create Free Account →'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up you agree to our{' '}
          <Link href="/terms" className="text-indigo-600 hover:underline cursor-pointer">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-indigo-600 hover:underline cursor-pointer">Privacy Policy</Link>
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline cursor-pointer">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}