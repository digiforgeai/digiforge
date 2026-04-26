// components/SEO.tsx
import Head from 'next/head'
import { useRouter } from 'next/router'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  author?: string
  tags?: string[]
}

const defaultMeta = {
  title: 'DigiForgeAI - AI-Powered Ebook Generator',
  description: 'Create professional ebooks, guides, and digital products with AI. Research trends, generate content, and export to PDF or DOCX.',
  image: '/og-image.png',
  siteName: 'DigiForgeAI',
  twitterHandle: '@digiforgeai',
}

export default function SEO({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  publishedTime,
  author,
  tags 
}: SEOProps) {
  const router = useRouter()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiforgeai.app'
  const fullUrl = url || `${siteUrl}${router.asPath}`
  const metaTitle = title ? `${title} | DigiForgeAI` : defaultMeta.title
  const metaDescription = description || defaultMeta.description
  const metaImage = image || defaultMeta.image

  return (
    <Head>
      {/* Basic */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={defaultMeta.siteName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={metaTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={metaImage} />
      <meta property="twitter:site" content={defaultMeta.twitterHandle} />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:author" content={author || defaultMeta.siteName} />
          {tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Additional */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#4f46e5" />
    </Head>
  )
}