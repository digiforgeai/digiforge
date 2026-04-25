// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DigiforgeAI – Create High-Converting eBooks in Minutes with AI",
  description:
    "Generate professional, high-quality eBooks, guides, and digital products in minutes using AI. Perfect for creators, entrepreneurs, and marketers looking to monetize fast.",

  keywords: [
    "AI ebook generator",
    "create ebook with AI",
    "digital product generator",
    "ebook creator tool",
    "make money with ebooks",
    "AI content generator",
    "ebook business tools",
    "self publishing AI",
    "sell digital products",
    "ebook automation",
  ],

  authors: [{ name: "DigiforgeAI" }],
  creator: "DigiforgeAI",

  openGraph: {
    title: "Create & Sell eBooks with AI – DigiforgeAI",
    description:
      "Turn ideas into profitable eBooks in minutes. Generate, design, and export professional digital products effortlessly with AI.",
    url: "https://www.digiforgeai.app",
    siteName: "DigiforgeAI",
    images: [
      {
        url: "https://www.digiforgeai.app/digiforge_logo.png",
        width: 1200,
        height: 630,
        alt: "DigiforgeAI Ebook Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Create eBooks with AI in Minutes",
    description:
      "Generate, design, and export high-quality eBooks instantly with DigiforgeAI.",
    images: ["https://www.digiforgeai.app/digiforge_logo.png"],
  },

  metadataBase: new URL("https://www.digiforgeai.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="root-layout">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}