import Link from "next/link";
import { Brand } from "@/components/Brand";
import { Container } from "@/components/Container";
import { MotionToggle } from "@/components/MotionToggle";
import { PhoneContacts } from "@/components/PhoneContacts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/motion/primitives/Reveal";
import { siteConfig, subjects } from "@/lib/site";

// Kept "Privacy" ahead of the rest: the enquiry form links to it ("you agree to our privacy notice"),
// and UK GDPR expects a visible privacy notice link.
const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms", label: "Website Terms" },
  { href: "/tuition-terms", label: "Tuition Terms" },
  { href: "/safeguarding", label: "Safeguarding" },
  { href: "/complaints", label: "Complaints" },
  { href: "/accessibility", label: "Accessibility" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      {/* A static dot-grid + soft glow: the same restrained language the cinematic page heroes
          carry, so the one place every page ends shares that signature too. No motion of its own
          and no scroll listener — a fixed decoration, not a scene. */}
      <div className="footer-atmosphere" aria-hidden="true" />
      {/* A one-time rise-and-fade as the footer scrolls into view, the same Reveal every other
          below-the-fold block uses. It is the last thing on every page, so there is no LCP
          concern here. */}
      <Reveal variant="soft">
        <Container>
          <div className="footer-grid">
            <div className="footer-brand">
              <Brand inverse />
              <p className="footer-tagline">{siteConfig.tagline}</p>
              <p>
                Personalised online tuition built around each student’s needs,
                pace and goals.
              </p>
            </div>
            <div className="footer-column">
              <h2>Subjects</h2>
              <ul>
                <li>
                  <Link href="/subjects">All subjects</Link>
                </li>
                {subjects.map((subject) => (
                  <li key={subject.slug}>
                    <Link href={subject.path}>{subject.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-column">
              <h2>Company</h2>
              <ul>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/trust">Trust and policies</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h2>Support</h2>
              <ul>
                <li>
                  <Link href="/faq">FAQ</Link>
                </li>
                <li>
                  <Link href="/book">Book a free consultation</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column footer-contact">
              <h2>Contact</h2>
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              <PhoneContacts layout="stacked" />
              <div className="footer-social">
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram<span className="sr-only"> (opens in a new tab)</span>
                </a>
                <a
                  href={siteConfig.social.linkedin}
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
              <a
                className="footer-login"
                href={siteConfig.tutorLoginUrl}
                target="_blank"
                rel="noreferrer"
              >
                Tutor login<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <nav aria-label="Legal information">
              {legalLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="footer-appearance">
            <ThemeToggle variant="radio" inverse />
            <MotionToggle inverse />
          </div>
          <p className="footer-registration">
            {siteConfig.legalName} &middot; Company No. {siteConfig.companyNumber} &middot;
            registered in {siteConfig.registeredIn} &middot; Correspondence address:{" "}
            {siteConfig.correspondenceAddress}
          </p>
        </Container>
      </Reveal>
    </footer>
  );
}
