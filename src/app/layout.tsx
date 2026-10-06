import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import { MotionDebugOverlay } from "@/components/motion/MotionDebugOverlay";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteConfig } from "@/lib/site";
import "./globals.css";

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
  themeColor: "#0e2a47",
};

const organisationData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/brand/learnthrive-logo.png`,
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
      className={`${bricolage.variable} ${publicSans.variable} ${ibmPlexMono.variable}`}
    >
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
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          {/* Renders nothing unless `?motionDebug=1` is present in a development build (or a build
              made with NEXT_PUBLIC_MOTION_DEBUG=1) — see lib/motion/debug.ts. */}
          <MotionDebugOverlay />
        </MotionRuntime>
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
