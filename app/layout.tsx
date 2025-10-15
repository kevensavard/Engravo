import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engravo.app - AI-Powered Image Editor for Laser Engraving & CNC",
  description: "Professional image editing platform with AI-powered depth maps, background removal, vectorization, and 20+ tools designed specifically for laser engraving, CNC machines, and digital art. Transform your images into laser-ready files in seconds.",
  keywords: [
    "laser engraving",
    "depth map generator",
    "3D depth map",
    "laser engraving software",
    "CNC image preparation",
    "image to depth map",
    "AI background removal",
    "vectorize image",
    "SVG converter",
    "jigsaw puzzle generator",
    "image editor",
    "laser cutting",
    "engraving tools",
    "photo to laser",
    "grayscale converter",
  ],
  authors: [{ name: "Engravo Team" }],
  creator: "Engravo",
  publisher: "Engravo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://engravo.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Engravo.app - AI Image Editor for Laser Engraving",
    description: "Professional image editing with AI-powered depth maps, background removal, and 20+ tools for laser engraving. Free to start!",
    url: "https://engravo.app",
    siteName: "Engravo.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Engravo.app - AI-Powered Image Editor for Laser Engraving",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engravo.app - AI Image Editor for Laser Engraving",
    description: "Professional image editing with AI-powered depth maps, background removal, and 20+ tools for laser engraving. Free to start!",
    images: ["/og-image.png"],
    creator: "@engravoapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
