/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import QueryProvider from "@/components/providers/QueryProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DisclaimerBar from "@/components/layout/DisclaimerBar";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Plus_Jakarta_Sans, JetBrains_Mono, Noto_Sans_Kannada } from "next/font/google";
import Script from "next/script";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  weight: ["400", "600"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ForThePeople.in",
  "url": BASE_URL,
  "description": "India's Citizen Transparency Platform — Free, real-time district-level government data dashboards",
  "applicationCategory": "GovernmentService",
  "operatingSystem": "Web",
  "dateCreated": "2026-03-17",
  "license": "https://opensource.org/licenses/MIT",
  "isAccessibleForFree": true,
  "inLanguage": ["en", "kn"],
  "author": {
    "@type": "Person",
    "name": "Jayanth M B",
    "url": "https://www.instagram.com/jayanth_m_b/",
    "nationality": "Indian",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Karnataka",
      "addressCountry": "IN",
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${plusJakarta.variable} ${jetBrains.variable} ${notoKannada.variable}`}
    >
      <head>
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ForThePeople" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <DisclaimerBar />
            <Header locale={locale} />
            <a href="#main-content" className="skip-nav">
              Skip to main content
            </a>
            <Script
              id="webapp-jsonld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
            />
            {children}
            <Footer />
            <script
              dangerouslySetInnerHTML={{
                __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`,
              }}
            />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
