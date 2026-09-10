import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ButtonLink";
import { Container } from "@/components/Container";
import { createMetadata } from "@/lib/metadata";
import styles from "./about.module.css";

export const metadata: Metadata = createMetadata({
  title: "About LearnThrive",
  description:
    "Meet the founders of LearnThrive Tuition and the mission behind it: giving every student support that fits them, whatever their ability or background.",
  path: "/about",
});

function GrowthArrow() {
  return (
    <svg className={styles.growthArrow} viewBox="0 0 200 400" fill="none" aria-hidden="true">
      <path d="M20 380 L80 250 L120 300 L180 60" />
      <path d="M150 60 L180 40 L192 78" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className={styles.about}>
      <section className={styles.hero} aria-labelledby="about-title">
        <GrowthArrow />
        <Container className={styles.container}>
          <p className={styles.eyebrow}>About us</p>
          <h1 id="about-title">Built for every kind of learner</h1>
          <p className={styles.lead}>
            LearnThrive Tuition exists to give every student the support that
            fits them — whatever their ability or background.
          </p>
        </Container>
      </section>

      <section className={styles.section} id="story" aria-labelledby="story-title">
        <Container className={styles.story}>
          <p className={styles.eyebrow}>Our story</p>
          <h2 id="story-title">Why we started LearnThrive</h2>
          <p>
            LearnThrive Tuition began with a simple belief: every student deserves
            support that fits them — whatever their starting point, their learning
            ability, or their background.
          </p>
          <p>
            Founders — and childhood friends — <strong>Abdurrahman Mustafa</strong>{" "}
            and <strong>Tahasin Hasan</strong> set out to make great tuition
            genuinely accessible: the kind that adapts to how each student learns,
            rather than expecting every child to learn the same way. That belief
            still drives everything we do.
          </p>
        </Container>
      </section>

      <section
        className={[styles.section, styles.founders].join(" ")}
        aria-labelledby="founders-title"
      >
        <Container className={styles.container}>
          <p className={styles.eyebrow}>Meet the founders</p>
          <h2 id="founders-title">The people behind LearnThrive</h2>
          <div className={styles.foundersGrid}>
            <article className={styles.founderCard} aria-labelledby="abdurrahman-name">
              <Image
                className={styles.portrait}
                src="/images/abdurrahman-mustafa.jpg"
                alt="Abdurrahman Mustafa"
                width={64}
                height={64}
                sizes="64px"
              />
              <h3 id="abdurrahman-name">Abdurrahman Mustafa</h3>
              <p className={styles.role}>Co-founder</p>
              <p>
                I&apos;m Abdurrahman Mustafa, co-founder of LearnThrive Tuition.
                Ever since I was young, I despised the idea of tutoring and dreaded
                attending sessions every Sunday. Then, at 17, I became the very
                thing I&apos;d dreaded — and realised that teaching and helping
                people who are struggling to progress is one of the most beautiful
                things in life.
              </p>
              <p>
                Over the years, as I questioned what I wanted to do and how I
                wanted to build my future, my childhood friend Tahasin and I
                decided to start our own tutoring service. At LearnThrive,
                you&apos;ll do more than raise your grades — you&apos;ll grow, and
                learn to love the very subject you&apos;re studying.
              </p>
            </article>
            <article className={styles.founderCard} aria-labelledby="tahasin-name">
              <Image
                className={styles.portrait}
                src="/images/tahasin-hasan.jpg"
                alt="Tahasin Hasan"
                width={64}
                height={64}
                sizes="64px"
              />
              <h3 id="tahasin-name">Tahasin Hasan</h3>
              <p className={styles.role}>Co-founder</p>
              <p>
                Hi, I&apos;m Tahasin Hasan — and yes, Hasan is actually my surname,
                not me introducing myself twice 😂. I started tutoring at 16,
                carried it through A-levels, survived university while still
                tutoring, and somehow ended up making mock exams for students
                while stressing over my own exams too.
              </p>
              <p>
                Over the years, I realised that most students don&apos;t struggle
                because they &quot;can&apos;t do it&quot; — sometimes they just need
                it explained in a way that actually makes sense to them. Now, as
                co-founder of LearnThrive Tuition, I get to take everything
                I&apos;ve learned from tutoring, studying and many questionable
                sleep schedules, and use it to make education more personal,
                enjoyable and effective.
              </p>
            </article>
          </div>
        </Container>
      </section>

      <section
        className={[styles.section, styles.mission].join(" ")}
        aria-labelledby="mission-title"
      >
        <GrowthArrow />
        <Container className={styles.container}>
          <p className={styles.eyebrow}>Our mission</p>
          <h2 id="mission-title">A global platform where every student is understood</h2>
          <p>
            We&apos;re building a platform that matches students with tutors who
            truly understand them — tutors who shape every lesson around how that
            student learns best. Wherever a child is, and whatever they need, we
            want the right support to be within reach.
          </p>
        </Container>
      </section>

      <section className={styles.cta} aria-labelledby="about-cta-title">
        <Container className={styles.container}>
          <h2 id="about-cta-title">Want to be part of it?</h2>
          <p>
            Tell us about your child and we&apos;ll help them learn, grow and
            thrive — one step at a time.
          </p>
          <ButtonLink href="/contact">Get in touch</ButtonLink>
        </Container>
      </section>
    </div>
  );
}
