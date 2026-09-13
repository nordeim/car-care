import type { Metadata } from "next";
import { Oswald, Archivo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BUSINESS, SERVICE_AREAS } from "@/data/wcc/content";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://car-care.jesspete.shop";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Auto Detailing & Ceramic Coating | Framingham MA — We Care Car Care",
  description:
    "Top-rated auto detailing, ceramic coating & paint protection in Framingham and MetroWest MA. 16+ years experience, 5-star rated. Book today!",
  keywords: [
    "auto detailing near me",
    "ceramic coating near me",
    "car detailing Framingham MA",
    "paint protection Massachusetts",
    "eco-friendly car detailing",
    "mobile detailing near me",
  ],
  authors: [{ name: BUSINESS.name }],
  openGraph: {
    title: "Auto Detailing & Ceramic Coating | Framingham MA",
    description:
      "Professional eco-friendly auto detailing & ceramic coating in Framingham, MA. 16+ years, 5-star rated. Book today!",
    siteName: BUSINESS.name,
    type: "website",
    images: [{ url: "/images/hero-car.webp", width: 1344, height: 768 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auto Detailing & Ceramic Coating | Framingham MA",
    description:
      "Professional eco-friendly auto detailing & ceramic coating in Framingham, MA. 16+ years, 5-star rated.",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AutoWash",
  name: BUSINESS.name,
  description:
    "Top-rated auto detailing, ceramic coating, and paint protection services in Framingham and MetroWest Massachusetts. Mobile, shop, and pickup/delivery options.",
  telephone: "+1-508-290-7476",
  email: "info@WeCareCarCare.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "874 Edgell Rd",
    addressLocality: "Framingham",
    addressRegion: "MA",
    postalCode: "01701",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 42.3186,
    longitude: -71.4167,
  },
  foundingDate: "2010",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: String(BUSINESS.stats.reviewCount),
    bestRating: "5",
  },
  priceRange: "$$",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "18:00",
    },
  ],
  areaServed: SERVICE_AREAS.map((city) => ({
    "@type": "City",
    name: city,
    containedInPlace: { "@type": "State", name: "Massachusetts" },
  })),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${oswald.variable} ${archivo.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
