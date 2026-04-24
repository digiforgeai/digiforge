import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { freemem } from 'os';

// Plan limits for quick reference (also validated server-side)
const PLAN_ENDPOINT_LIMITS: Record<string, { allowedPlans: string[]; message?: string }> = {
  '/api/generate': {
    allowedPlans: ['free', 'starter', 'pro'],
    message: 'Upgrade your plan to generate more ebooks'
  },
  '/api/pdf': {
    allowedPlans: ['free', 'starter', 'pro'],
    message: 'PDF export requires at least Starter plan'
  },
  '/api/trends': {
    allowedPlans: ['free', 'starter', 'pro'],
    message: 'Login to access trending ideas'
  },
  '/api/sales-content': {
    allowedPlans: ['starter', 'pro'],
    message: 'Sales content generation requires Starter or Pro plan'
  },
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ========== AUTHENTICATION CHECKS ==========
  
  // Protect dashboard routes - require login
  if (pathname.startsWith('/dashboard') && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ========== SUBSCRIPTION CHECKS FOR API ROUTES ==========
  
  // Check if this API endpoint has plan restrictions
  const endpointConfig = Object.entries(PLAN_ENDPOINT_LIMITS).find(([route]) =>
    pathname.startsWith(route)
  )

  if (endpointConfig && user) {
    const [route, config] = endpointConfig
    
    // Get user's current plan from database
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    // Default to 'free' if no plan found
    const userPlanId = (!planError && userPlan) ? userPlan.plan_id : 'free'
    
    // Check if user's plan is allowed for this endpoint
    if (!config.allowedPlans.includes(userPlanId)) {
      // Return JSON error for API requests
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: 'plan_restricted',
            message: config.message || 'Your current plan does not have access to this feature',
            currentPlan: userPlanId,
            requiredPlans: config.allowedPlans,
          },
          { status: 403 }
        )
      }
      
      // For non-API routes, redirect to pricing page
      const redirectUrl = new URL('/pricing', request.url)
      redirectUrl.searchParams.set('upgrade', 'true')
      redirectUrl.searchParams.set('reason', encodeURIComponent(config.message || 'Upgrade to access this feature'))
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ========== RATE LIMITING FOR FREE USERS (Basic) ==========
  // This is a simple check - full rate limiting should be in the API itself
  
if (pathname === '/api/generate' && user) {
  const { data: userPlan } = await supabase
    .from('user_plans')
    .select('plan_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
  
  const planId = userPlan?.plan_id || 'free'
  
  
if (planId === 'free') {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count } = await supabase
    .from('generated_ebooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('generated_at', startOfMonth.toISOString())
    
  if (count && count >= 5) {  // ← Changed from 2 to 5
    console.log(`❌ [PROXY] Blocking free user - count ${count} >= 5`)  // ← Updated message
    return NextResponse.json(
      { 
        error: 'monthly_limit_reached',
        message: 'You have reached your monthly limit of 5 free ebooks. Upgrade to Starter for 15 generations per month!',
        limit: 5,  // ← Changed from 2 to 5
        used: count,
      },
      { status: 429 }
    )
  }
}
}

  // ========== SECURITY HEADERS ==========
  // Add security headers to all responses
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Optional: Add CSP header (adjust as needed)
  // supabaseResponse.headers.set(
  //   'Content-Security-Policy',
  //   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  // )

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}