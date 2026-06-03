import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ea580c",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://mbg.sumedangkab.go.id'),
  title: {
    default: "Makan Bergizi Gratis - Program Nasional di Kabupaten Sumedang",
    template: "%s | MBG Sumedang"
  },
  applicationName: "MBG Sumedang",
  description: "Program Makan Bergizi Gratis (MBG) - Program prioritas nasional Pemerintah Indonesia untuk memastikan anak-anak mendapat nutrisi berkualitas. Pantau distribusi makanan bergizi gratis real-time dari SPPG dan sekolah di Kabupaten Sumedang.",
  keywords: [
    "makan bergizi gratis",
    "mbg indonesia",
    "program prabowo gibran",
    "mbg sumedang",
    "nutrisi anak sekolah",
    "sekolah sumedang",
    "SPPG sumedang",
    "dapur satelit modular",
    "program gizi nasional",
    "makanan sekolah gratis",
    "kesehatan anak indonesia",
    "badan gizi nasional",
    "mbg.sumedangkab.go.id"
  ],
  authors: [
    { name: "Badan Gizi Nasional", url: "https://gizi.go.id" },
    { name: "Pemkab Sumedang", url: "https://sumedangkab.go.id" }
  ],
  creator: "Badan Gizi Nasional - Pemerintah Indonesia",
  publisher: "Pemerintah Kabupaten Sumedang",
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
  icons: {
    icon: "/images/logo-sumedang.png",
    shortcut: "/images/logo-sumedang.png",
    apple: "/images/logo-sumedang.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Makan Bergizi Gratis - Program Nasional di Kabupaten Sumedang",
    description: "Program Makan Bergizi Gratis (MBG) - Program prioritas nasional Pemerintah Indonesia untuk memastikan anak-anak mendapat nutrisi berkualitas. Pantau distribusi makanan bergizi gratis real-time dari SPPG dan sekolah di Kabupaten Sumedang.",
    url: "https://mbg.sumedangkab.go.id",
    siteName: "MBG Sumedang",
    type: "website",
    locale: "id_ID",
    images: [
      {
        url: "/images/logo-sumedang.png",
        width: 1200,
        height: 630,
        alt: "Logo Kabupaten Sumedang - Program Makan Bergizi Gratis",
        type: "image/png",
      },
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Banner Makan Bergizi Gratis - MBG Sumedang",
        type: "image/png",
      },
    ],
    localeAlternate: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Makan Bergizi Gratis - Program Nasional di Kabupaten Sumedang",
    description: "Program Makan Bergizi Gratis (MBG) - Program prioritas nasional Pemerintah Indonesia. Pantau distribusi real-time dari SPPG dan sekolah di Kabupaten Sumedang.",
    images: ["/opengraph-image"],
    creator: "@setkabgoid",
    site: "@setkabgoid",
  },
  category: "government",
  other: {
    "geo.region": "ID-JB",
    "geo.placename": "Kabupaten Sumedang",
    "geo.position": "-6.83;107.92",
    "ICBM": "-6.83, 107.92",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GovernmentOrganization",
  "name": "Program Makan Bergizi Gratis Kabupaten Sumedang",
  "url": "https://mbg.sumedangkab.go.id",
  "logo": "https://mbg.sumedangkab.go.id/images/logo-sumedang.png",
  "description": "Program Makan Bergizi Gratis (MBG) - Program prioritas nasional Pemerintah Indonesia untuk memastikan anak-anak mendapat nutrisi berkualitas di Kabupaten Sumedang.",
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "Kabupaten Sumedang",
    "addressCountry": "ID"
  },
  "sameAs": [
    "https://www.sumedangkab.go.id"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
