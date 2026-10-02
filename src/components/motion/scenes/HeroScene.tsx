"use client";

import Image from "next/image";
import Link from "next/link";
import * as m from "framer-motion/m";
import { useReducedMotion, useTransform } from "framer-motion";
import { useScene } from "@/lib/motion/scroll";
import { useMotionTier } from "@/lib/motion/capabilities";
import { ParallaxLayer } from "@/components/motion/primitives/ParallaxLayer";
import styles from "@/app/home.module.css";

/**
 * The homepage hero as a layered scene: as it scrolls past, the headline moves up slightly,
 * supporting copy fades toward ~0.6, the photo shifts on its own depth plane and the background
 * grid moves more slowly than the foreground. The CSS `lt-rise` entrance sequence
 * (home.module.css) is untouched — this only adds scroll-linked behaviour on top of the
 * "assembled, not faded in" load choreography.
 *
 * The headline/copy/CTA transforms are skipped outright on the "reduced" and "light" tiers
 * (capabilities.ts): under prefers-reduced-motion nothing here should move, and on touch/narrow
 * devices smaller-scale movement is wanted rather than the full desktop depth effect. The
 * background/photo/chip layers use the shared `ParallaxLayer`, which scales its own distance by
 * tier internally — an independent gating mechanism from `active`, not a conflict.
 *
 * Deliberately no WebGL atmosphere here: the static `.heroGlow` is what every tier gets, and a
 * CSS glow carries the same brand atmosphere without a canvas, a shader or a pointer listener.
 */
export function HeroScene() {
  const { ref, smoothProgress } = useScene(["start start", "end start"]);
  const tier = useMotionTier();
  const reduceMotion = useReducedMotion();
  const active = tier === "full" && !reduceMotion;

  const headlineY = useTransform(smoothProgress, [0, 1], active ? [0, -34] : [0, 0]);
  const copyOpacity = useTransform(smoothProgress, [0, 1], active ? [1, 0.6] : [1, 1]);
  const ctaOpacity = useTransform(smoothProgress, [0, 0.6], active ? [1, 0.85] : [1, 1]);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={styles.hero} data-motion-scene="hero">
      {/* Background/detail layer: a small, bounded offset (8-20px), scaled further by tier. */}
      <ParallaxLayer progress={smoothProgress} from={0} to={16} className={styles.heroDots} aria-hidden />
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroGrid}>
        <m.div style={{ y: headlineY }}>
          <div className={styles.heroCopy}>
            <div className={styles.heroChip}>
              <span className={styles.heroChipDot} aria-hidden="true" />
              Online &middot; one-to-one &middot; Y1 to A-Level
            </div>
            <h1 className={styles.heroTitle}>
              Strong foundations.
              <br />
              <span className={styles.heroMark}>
                <span className={styles.heroMarkBg} aria-hidden="true" />
                <span className={styles.heroMarkText}>Brighter futures.</span>
              </span>
            </h1>
            <m.p className={styles.heroLead} style={{ opacity: copyOpacity }}>
              Tailored tuition that helps your child learn, grow and thrive
              &mdash; from the early years right through to their A-Level exams.
            </m.p>
            <m.div className={styles.heroButtons} style={{ opacity: ctaOpacity }}>
              <Link href="/book" className={styles.btnPrimary}>
                Send an enquiry &rarr;
              </Link>
              <a href="#how" className={styles.btnSecondary}>
                How it works
              </a>
            </m.div>
            <m.ul
              className={styles.heroAssurances}
              aria-label="Tuition overview"
              style={{ opacity: copyOpacity }}
            >
              <li>40+ students supported</li>
              <li>Through our first academic year</li>
              <li>Never in groups</li>
            </m.ul>
          </div>
        </m.div>
        {/* Photo layer: a translate-only offset (no scale) so the photo and its floating chip move
            together as one rigid group with no distortion. */}
        <ParallaxLayer progress={smoothProgress} from={0} to={18} className={styles.heroPhoto}>
          <div className={styles.heroPhotoImg}>
            <Image
              src="/images/hero-tutor-student.jpg"
              alt="Tutor and student working together during an online one-to-one lesson"
              fill
              sizes="(max-width: 1100px) 100vw, 50vw"
              priority
              style={{ objectFit: "cover" }}
            />
          </div>
          {/* Foreground chip layer, deeper than the photo. The entrance animation stays on the
              outer element and the scroll transform goes on a nested one: a CSS animation's value
              for `transform` wins over an inline style on the *same* element, so they must be two
              different elements for both to apply. */}
          <div className={styles.heroFloatChip}>
            <ParallaxLayer progress={smoothProgress} from={0} to={-26} axis="x">
              <div className={styles.heroFloatChipTitle}>One-to-one, 60 min</div>
              <div className={styles.heroFloatChipSub}>TIMED AROUND SCHOOL</div>
            </ParallaxLayer>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}
