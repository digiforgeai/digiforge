// lib/analytics.ts

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Track specific events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Custom events for DigiForgeAI
export const trackEvent = {
  // User actions
  signup: (method: 'email' | 'google') => {
    event({ action: 'signup', category: 'User', label: method })
  },
  login: (method: 'email' | 'google') => {
    event({ action: 'login', category: 'User', label: method })
  },
  
  // Ebook actions
  generateEbook: (plan: string, chapters: number) => {
    event({ action: 'generate_ebook', category: 'Ebook', label: plan, value: chapters })
  },
  exportPDF: (plan: string) => {
    event({ action: 'export_pdf', category: 'Ebook', label: plan })
  },
  exportDOCX: (plan: string) => {
    event({ action: 'export_docx', category: 'Ebook', label: plan })
  },
  regenerateEbook: (plan: string) => {
    event({ action: 'regenerate', category: 'Ebook', label: plan })
  },
  
  // Payments
  checkoutStarted: (plan: string) => {
    event({ action: 'checkout_start', category: 'Payment', label: plan })
  },
  checkoutCompleted: (plan: string) => {
    event({ action: 'checkout_complete', category: 'Payment', label: plan })
  },
  
  // Errors
  error: (type: string, message: string) => {
    event({ action: 'error', category: 'Error', label: type, value: 1 })
  },
}