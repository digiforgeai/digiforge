// app/layout.tsx
import Script from 'next/script'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import CookieConsent from "@/components/CookieConsent";
import Analytics from "@/components/Analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://digiforgeai.app'),
  title: {
    default: 'DigiForgeAI - AI-Powered Ebook Generator & Digital Product Studio',
    template: '%s | DigiForgeAI'
  },
  description: 'Create professional ebooks, guides, and digital products with AI. Research trends with AI scoring, generate complete ebooks, and export to PDF or DOCX. Start for free.',
  keywords: [
    'AI ebook generator',
    'digital product creator',
    'ebook creation tool',
    'AI content writer',
    'make money online',
    'digital publishing',
    'passive income',
    'PDF generator',
    'AI writing assistant'
  ],
  authors: [{ name: 'DigiForgeAI', url: 'https://digiforgeai.app' }],
  creator: 'DigiForgeAI',
  publisher: 'DigiForgeAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://digiforgeai.app',
    siteName: 'DigiForgeAI',
    title: 'DigiForgeAI - AI-Powered Ebook Generator',
    description: 'Create professional ebooks and digital products with AI. Research trends, generate content, export to PDF or DOCX.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DigiForgeAI - Forge Your Digital Products with AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@digiforgeai',
    creator: '@digiforgeai',
    title: 'DigiForgeAI - AI-Powered Ebook Generator',
    description: 'Create professional ebooks and digital products with AI.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Script
          src="https://js.paystack.co/v1/inline.js"
          strategy="afterInteractive"
        />
      <body className="root-layout">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <AuthProvider>
          {children}
          <Analytics />
          <CookieConsent />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}