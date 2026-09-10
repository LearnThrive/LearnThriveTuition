import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { Container } from "@/components/Container";
import { CtaSection } from "@/components/CtaSection";
import { PageHero } from "@/components/PageHero";
import { SubjectDetail } from "@/components/SubjectDetail";
import { createMetadata } from "@/lib/metadata";
import { subjects } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Subjects",
  description:
    "Explore personalised Maths, English and Science tuition from KS2 to A Level, plus focused 11+ preparation with LearnThrive Tuition.",
  path: "/subjects",
});

export default function SubjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Subjects"
        title="Build understanding, confidence and exam readiness"
        intro="LearnThrive offers personalised tuition in core subjects from KS2 to A Level, alongside focused 11+ preparation."
        aside={
          <nav className="subject-jump" aria-label="Jump to a subject">
            <span>Explore a subject</span>
            {subjects.map((subject) => (
              <Link key={subject.slug} href={`#${subject.slug}`}>
                {subject.title}
                <span aria-hidden="true">↓</span>
              </Link>
            ))}
          </nav>
        }
      />

      <section className="section subject-details-section">
        <Container>
          <div className="subject-details">
            {subjects.map((subject, index) => (
              <SubjectDetail key={subject.slug} {...subject} index={index} />
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--tint subject-support">
        <Container className="simple-action simple-action--wide">
          <div>
            <p className="eyebrow">Not sure where to begin?</p>
            <h2>Start with the learner, not a fixed package</h2>
            <p>
              Share the subject, year group and current challenges. LearnThrive
              can then discuss the level and focus that may be most appropriate.
            </p>
          </div>
          <ButtonLink href="/book">Book a free consultation</ButtonLink>
        </Container>
      </section>

      <CtaSection
        title="Ready to discuss a subject?"
        text="Tell LearnThrive what your child is working on and where they would benefit from extra support."
      />
    </>
  );
}
