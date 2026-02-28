import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import {
  LocalBusinessSchema,
  WebsiteSchema,
} from "@/components/shared/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://sarthaktourandtravels.com"
  ),
  title: {
    default: "Sarthak Tour and Travels - Book Your Journey",
    template: "%s | Sarthak Tour and Travels",
  },
  description:
    "Premium car and bus rental services in Mumbai, Maharashtra. Book sedan, SUV, tempo traveller, and bus for local, outstation, and airport transfers. Reliable, affordable, and comfortable journeys across India.",
  keywords: [
    "sarthak tour and travels",
    "car rental Mumbai",
    "bus booking Mumbai",
    "travel booking India",
    "tempo traveller on rent",
    "outstation cab Mumbai",
    "Mumbai to Pune cab",
    "Mumbai to Shirdi cab",
    "Mumbai to Goa cab",
    "Mumbai to Lonavala cab",
    "Mumbai to Nashik cab",
    "airport transfer Mumbai",
    "SUV rental Mumbai",
    "Innova Crysta on rent",
    "bus hire Mumbai",
    "Maharashtra tour packages",
    "car hire India",
    "wedding car rental Mumbai",
    "corporate car rental",
    "pilgrimage tour Maharashtra",
  ],
  openGraph: {
    title: "Sarthak Tour and Travels - Car & Bus Rental in Mumbai",
    description:
      "Book reliable car and bus rental services in Mumbai. Sedan, SUV, tempo traveller, and bus bookings for local, outstation, and airport transfers across Maharashtra and India.",
    siteName: "Sarthak Tour and Travels",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sarthak Tour and Travels - Premium Car & Bus Rental Services in Mumbai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarthak Tour and Travels - Car & Bus Rental in Mumbai",
    description:
      "Book reliable car and bus rental services in Mumbai. Sedan, SUV, tempo traveller, and bus bookings across Maharashtra and India.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <LocalBusinessSchema />
        <WebsiteSchema />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
