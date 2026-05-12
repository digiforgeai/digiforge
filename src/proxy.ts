import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // ========== ADMIN ROUTE PROTECTION (UPDATED FOR RBAC) ==========
  if (pathname.startsWith('/admin')) {
    // Exclude login page and public assets from protection
    if (pathname === '/admin/login' || pathname.startsWith('/admin/_next') || pathname.includes('.')) {
      return supabaseResponse
    }

    // Check if user is logged in
    if (!user) {
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is an admin using the NEW admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, status, locked_until, role_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Check if account is locked
    if (admin?.locked_until && new Date(admin.locked_until) > new Date()) {
      await supabase.auth.signOut()
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('locked', 'true')
      return NextResponse.redirect(redirectUrl)
    }

    // Check if admin exists and is active
    if (adminError || !admin || admin.status !== 'active') {
      console.log(`❌ [ADMIN] Unauthorized access attempt by user: ${user.id}`)
      
      // Log unauthorized attempt to admin_logs
      try {
        await supabase
          .from('admin_logs')
          .insert({
            admin_id: admin?.id || null,
            action: 'unauthorized_access_attempt',
            resource_type: 'route',
            resource_id: pathname,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
            new_data: { user_id: user.id, email: user.email }
          })
      } catch (err) {
        console.error('Failed to log unauthorized access:', err)
      }

      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Update last activity
    await supabase
      .from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id)

    // Log page view for audit (optional - can comment out if too noisy)
    if (!pathname.startsWith('/admin/api') && pathname !== '/admin') {
      try {
        await supabase
          .from('admin_logs')
          .insert({
            admin_id: admin.id,
            action: 'page_view',
            resource_type: 'page',
            resource_id: pathname,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent')
          })
      } catch (err) {
        // Silent fail for page views
      }
    }
  }

  // ========== YOUR EXISTING AUTHENTICATION CHECKS (UNCHANGED) ==========
  
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

  // ========== YOUR EXISTING SUBSCRIPTION CHECKS (UNCHANGED) ==========
  
  const endpointConfig = Object.entries(PLAN_ENDPOINT_LIMITS).find(([route]) =>
    pathname.startsWith(route)
  )

  if (endpointConfig && user) {
    const [route, config] = endpointConfig
    
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const userPlanId = (!planError && userPlan) ? userPlan.plan_id : 'free'
    
    if (!config.allowedPlans.includes(userPlanId)) {
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
      
      const redirectUrl = new URL('/pricing', request.url)
      redirectUrl.searchParams.set('upgrade', 'true')
      redirectUrl.searchParams.set('reason', encodeURIComponent(config.message || 'Upgrade to access this feature'))
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ========== YOUR EXISTING RATE LIMITING (UNCHANGED) ==========
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
        
      if (count && count >= 5) {
        console.log(`❌ [PROXY] Blocking free user - count ${count} >= 5`)
        return NextResponse.json(
          { 
            error: 'monthly_limit_reached',
            message: 'You have reached your monthly limit of 5 free ebooks. Upgrade to Starter for 15 generations per month!',
            limit: 5,
            used: count,
          },
          { status: 429 }
        )
      }
    }
  }

  // ========== YOUR EXISTING SECURITY HEADERS (UNCHANGED) ==========
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}