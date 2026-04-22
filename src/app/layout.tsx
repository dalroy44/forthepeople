/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const metadata: Metadata = {
  title: {
    default: "ForThePeople.in — Your District. Your Data. Your Right.",
    template: "%s | ForThePeople.in",
  },
  description:
    "India's citizen transparency platform. Access district-level government data — budgets, schemes, crop prices, water levels, and more.",
  metadataBase: new URL(BASE_URL),
  keywords: [
    "government data India", "district dashboard", "RTI India",
    "crop prices", "government schemes", "citizen transparency",
    "district dashboard", "Hyderabad", "gram panchayat",
    "India civic data", "public data India", "government transparency",
  ],
  authors: [{ name: "Jayanth M B", url: BASE_URL }],
  creator: "Jayanth M B",
  publisher: "ForThePeople.in",
  other: {
    "original-author": "Jayanth M B",
    "project-inception": "2026-03-17",
    "x-created-by": "Jayanth M B, Karnataka, India",
    "x-project-id": "FTP-JMB-2026-IN",
    "x-repository": "github.com/jayanthmb14/forthepeople",
  },
  openGraph: {
    type: "website",
    siteName: "ForThePeople.in",
    title: "ForThePeople.in — Your District. Your Data. Your Right.",
    description:
      "Access district-level government data for every Indian — budgets, crop prices, water levels, schemes, and more.",
    url: BASE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ForThePeople.in — District Data Platform for India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ForThePeople.in — Your District. Your Data. Your Right.",
    description: "India's citizen transparency platform. Free district-level government data.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
