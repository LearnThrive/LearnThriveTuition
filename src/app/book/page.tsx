import type { Metadata } from "next";
import { BodyClass } from "@/components/BodyClass";
import { ScrollReveal } from "@/components/ScrollReveal";
import { EnquiryForm } from "@/components/EnquiryForm";
import { createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import styles from "./book.module.css";

export const metadata: Metadata = createMetadata({
  title: "Book a Free Consultation",
  description:
    "Tell LearnThrive Tuition about your child’s year group, subject and support needs to begin a free consultation enquiry.",
  path: "/book",
});

const guidanceItems = [
  "The student’s current year group",
  "The subject or subjects they need help with",
  "Any current challenges or near-term goals",
  "Your preferred way to be contacted",
];

export default function BookPage() {
  return (
    <div className={styles.page}>
      <BodyClass className="is-book" />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroDots} aria-hidden="true" />
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={`${styles.heroInner} ${styles.shell}`}>
          <div>
            <p className={styles.eyebrow}>Free consultation</p>
            <h1 className={styles.heroTitle}>
              Tell us how we can{" "}
              <span className={styles.heroMark}>
                <span className={styles.heroMarkBg} aria-hidden="true" />
                <span className={styles.heroMarkText}>support</span>
              </span>{" "}
              your child
            </h1>
            <p className={styles.heroLead}>
              Share a few details about your child and what they need.
              We&apos;ll get back to you within 24 hours &mdash; no pressure, no
              obligation.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.heroButton} href="#enquiry-form">
                <span>Start your enquiry</span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 4v11M6 11l4 4 4-4" />
                </svg>
              </a>
              <span className={styles.heroReply}>Takes about two minutes.</span>
            </div>
          </div>

          <div className={styles.heroCard}>
            <p className={styles.heroCardTitle}>Or contact us directly</p>
            <ul className={styles.heroContact}>
              <li className={styles.heroContactItem}>
                <span className={styles.heroContactDot} aria-hidden="true" />
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              </li>
              {siteConfig.phoneContacts.map((contact) => (
                <li key={contact.phoneHref} className={styles.heroContactItem}>
                  <span className={styles.heroContactDot} aria-hidden="true" />
                  <a href={`tel:${contact.phoneHref}`}>
                    {contact.name}: {contact.phoneDisplay}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Guidance + privacy ─────────────────────── */}
      <section className={styles.infoBand}>
        <ScrollReveal>
          <div className={`${styles.infoBandGrid} ${styles.shell}`}>
            <div className={styles.sideCard}>
              <h2>Helpful to include</h2>
              <ul className={styles.sideList}>
                {guidanceItems.map((item) => (
                  <li key={item}>
                    <span className={styles.sideTick} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.infoNote}>
              <svg viewBox="0 0 24 24" fill="none" width={22} height={22} style={{ color: "#075f52", flexShrink: 0, marginTop: 4 }} aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <h2>Your information is safe</h2>
                <p>
                  Your details are sent directly to LearnThrive and used only to
                  respond to your enquiry. See our privacy notice for full details.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Booking Layout ────────────────────────────── */}
      <div className={`${styles.bookingLayout} ${styles.shell}`} id="enquiry-form">
        <ScrollReveal>
          <div className={styles.formSection}>
            <p className={`${styles.eyebrow} ${styles.eyebrowDark}`}>
              Consultation enquiry
            </p>
            <div className={styles.formWrapper}>
              <div className={styles.formHead}>
                <div className={styles.formHeadDots} aria-hidden="true" />
                <h2>A few details to get started</h2>
                <p>
                  All fields are required except the phone number, unless phone
                  is your preferred contact method.
                </p>
              </div>
              <div className={styles.formBody}>
                <EnquiryForm />
              </div>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
