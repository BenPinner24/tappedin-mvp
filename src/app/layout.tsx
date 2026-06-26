import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brand display face (matches the physical card wordmark) + neutral body face.
// Added alongside Geist — nothing existing is removed, so the dashboard and
// landing page are unaffected. These are consumed only by the public profile.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tappedin.uk"),
  title: {
    default: "TAPPED-IN | Premium NFC Business Cards & Digital Profiles",
    template: "%s | TAPPED-IN",
  },
  description:
    "TAPPED-IN makes premium NFC business cards and digital profiles. Tap to share your contact details, links and socials instantly — one card, always up to date.",
  applicationName: "TAPPED-IN",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "TAPPED-IN",
    title: "TAPPED-IN | Premium NFC Business Cards & Digital Profiles",
    description:
      "Premium NFC business cards and digital profiles. Tap to share everything that matters — instantly.",
    url: "https://tappedin.uk",
    locale: "en_GB",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TAPPED-IN",
  legalName: "TAPPEDIN SPACE LTD",
  url: "https://tappedin.uk",
  description:
    "Premium NFC business cards and digital profiles for professionals, creators and businesses.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "66 Paul Street",
    addressLocality: "London",
    postalCode: "EC2A 4NA",
    addressCountry: "GB",
  },
  sameAs: [
    "https://www.instagram.com/tappedinspace",
    "https://www.tiktok.com/@tappedinspace",
    "https://www.linkedin.com/company/tappedinspace",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TAPPED-IN",
  url: "https://tappedin.uk",
  inLanguage: "en-GB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
