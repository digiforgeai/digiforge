'use client'

import Script from 'next/script'

interface StructuredDataProps {
  type: 'WebApplication' | 'Product' | 'Organization'
  data: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getSchema = () => {
    switch (type) {
      case 'WebApplication':
        return {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "DigiForgeAI",
          "description": "AI-powered ebook and digital product generator",
          "applicationCategory": "ContentCreation",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          ...data
        }
      case 'Organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "DigiForgeAI",
          "url": "https://digiforgeai.app",
          "logo": "https://digiforgeai.app/logo.png",
          "sameAs": [
            "https://twitter.com/digiforgeai",
            "https://linkedin.com/company/digiforgeai"
          ],
          ...data
        }
      default:
        return data
    }
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getSchema()) }}
      strategy="afterInteractive"
    />
  )
}