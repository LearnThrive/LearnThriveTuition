import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { MobileEnquiryBar } from "@/components/MobileEnquiryBar";
import { MotionDebugGate } from "@/components/motion/MotionDebugGate";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { PageTransition } from "@/components/motion/PageTransition";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SpotlightPointer } from "@/components/motion/SpotlightPointer";
import { NavigationProgress } from "@/components/NavigationProgress";
import { PaletteHost } from "@/components/palette/PaletteHost";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/site";
import { THEME_COLOURS, THEME_INIT_SCRIPT, THEMES_ENABLED } from "@/lib/theme";
import { webSiteData } from "@/lib/structuredData";
import "./globals.css";
import "./tokens.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Personalised Online Tuition | LearnThrive Tuition",
    template: "%s | LearnThrive Tuition",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: "education",
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Icons come from the file conventions in this folder (icon.svg, favicon.ico, apple-icon.png), all
  // generated from the vector mark.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // One theme-color per scheme: the browser's own chrome follows the device scheme. Without the themes
  // flag there is only the light site, so only the light colour.
  themeColor: THEMES_ENABLED
    ? [
        { media: "(prefers-color-scheme: light)", color: THEME_COLOURS.light },
        { media: "(prefers-color-scheme: dark)", color: THEME_COLOURS.dark },
      ]
    : THEME_COLOURS.light,
  // Lets the browser paint native UI (scrollbars, form controls, the canvas behind the page) in the
  // visitor's scheme from the first byte, before any stylesheet loads.
  colorScheme: THEMES_ENABLED ? "light dark" : "light",
};

const organisationData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/icons/icon-512.png`,
  description: siteConfig.description,
  email: siteConfig.email,
  telephone: siteConfig.phoneContacts.map((contact) => contact.phoneHref),
  sameAs: [siteConfig.social.instagram, siteConfig.social.linkedin],
  contactPoint: siteConfig.phoneContacts.map((contact) => ({
    "@type": "ContactPoint",
    name: contact.name,
    telephone: contact.phoneHref,
    email: siteConfig.email,
    contactType: "customer enquiries",
    availableLanguage: "English",
  })),
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // data-scroll-behavior tells Next.js this document opts into `scroll-behavior: smooth`
  // (globals.css, for in-page anchor links) so it can suspend it for the duration of a route
  // change and restore it afterwards, rather than animating every navigation's scroll-to-top.
  return (
    <html
      lang="en-GB"
      data-scroll-behavior="smooth"
      data-themes={THEMES_ENABLED ? "on" : undefined}
      // The init script below sets data-theme before React hydrates; React must keep what the DOM
      // says rather than flag it (see node_modules/next/dist/docs/01-app/02-guides/
      // preventing-flash-before-hydration.md). On <html> only.
      suppressHydrationWarning
      className={`${bricolage.variable} ${publicSans.variable} ${ibmPlexMono.variable}`}
    >
      {/* The pre-paint preference script: a saved theme choice (a no-op unless the themes are on) and a
          saved motion choice. It reads the visitor's own browser storage and nothing else. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {/* A reveal server-renders its content in its *start* state (Motion writes an inline
            `opacity: 0` and a transform), so a visitor whose JavaScript never runs — blocked,
            failed to load, an extension, a text browser — would get the hero, the marquee and the
            footer, and pure background where everything below the fold should be. <noscript> is
            the one mechanism that can answer that without JavaScript itself: it is parsed only when
            scripting is disabled, so it costs a scripted visitor nothing and never flashes, and
            `!important` is what beats an inline style. Reduced motion gets the same treatment from
            Reveal.module.css. */}
        <noscript>
          <style>{`[data-reveal], [data-reveal-inner] { opacity: 1 !important; transform: none !important; } [data-reveal-rule], [data-underline-draw] { transform: none !important; } [data-masked-text-inner] { clip-path: none !important; opacity: 1 !important; }`}</style>
        </noscript>
        {/* The one Motion runtime for the whole site (LazyMotion + MotionConfig). It wraps the
            pages without making them client-rendered — see MotionRuntime.tsx. */}
        <MotionRuntime>
          {/* A slim branded progress bar for navigations that take longer than ~150ms. */}
          <NavigationProgress />
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <AnnouncementBar />
          <SiteHeader />
          <main id="main-content">
            <PageTransition>{children}</PageTransition>
          </main>
          <SiteFooter />
          {/* Phones: a dismissible "Book a free consultation" bar after the first screen. */}
          <MobileEnquiryBar />
          {/* Smooth scrolling (full/standard tier, fine pointer only; see the component). */}
          <SmoothScroll />
          {/* One delegated pointer listener for every [data-spotlight] card (full tier, fine pointer). */}
          <SpotlightPointer />
          {/* The Ctrl/Cmd+K site search: a tiny host here, the palette itself a lazy chunk. */}
          <PaletteHost />
          {/* Renders nothing unless `?motionDebug=1` is present in a development build (or a build
              made with NEXT_PUBLIC_MOTION_DEBUG=1) — see lib/motion/debug.ts. */}
          <MotionDebugGate />
        </MotionRuntime>
        <JsonLd data={webSiteData()} />
        <Script
          id="learnthrive-organisation-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organisationData).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
