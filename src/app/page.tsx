import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { Container } from "@/components/Container";
import { CtaSection } from "@/components/CtaSection";
import { FeatureCard } from "@/components/FeatureCard";
import { FaqList } from "@/components/FaqList";
import { Icon } from "@/components/Icon";
import { SectionHeading } from "@/components/SectionHeading";
import { SubjectCard } from "@/components/SubjectCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { createMetadata } from "@/lib/metadata";
import { featuredFaqs } from "@/lib/faqs";
import {
  howItWorks,
  learningFeatures,
  subjects,
  testimonials,
  trustPoints,
} from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Personalised Online Tuition",
  description:
    "Personalised online Maths, English and Science tuition from KS2 to A Level, plus 11+ preparation. Help your child build confidence with LearnThrive Tuition.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <Container className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="eyebrow">Personalised online tuition</p>
            <h1>
              Helping students <span>learn, grow &amp; thrive</span>
            </h1>
            <p className="home-hero__lead">
              One-to-one tuition in Maths, English and Science, shaped around
              each student’s strengths, challenges and goals—from KS2 to A Level,
              with focused 11+ preparation.
            </p>
            <div className="button-group">
              <ButtonLink href="/book">Book a free consultation</ButtonLink>
              <ButtonLink href="/subjects" variant="secondary">
                Explore our subjects
              </ButtonLink>
            </div>
            <ul className="hero-assurances" aria-label="Tuition overview">
              <li>Personalised lessons</li>
              <li>Interactive online teaching</li>
              <li>Clear parent updates</li>
            </ul>
          </div>
          <div className="home-hero__visual">
            <div className="hero-image-frame">
              <Image
                src="/images/online-tuition.webp"
                alt="Laptop and notebook set up for an online tuition lesson"
                width={1280}
                height={853}
                priority
                sizes="(max-width: 800px) 100vw, 45vw"
              />
              <div className="hero-image-frame__label">
                <span className="live-dot" aria-hidden="true" />
                Interactive online lessons
              </div>
            </div>
            <div className="hero-subject-note">
              <span>Subjects</span>
              <strong>Maths · English · Science · 11+</strong>
            </div>
          </div>
        </Container>
      </section>

      <section className="trust-strip" aria-label="What LearnThrive provides">
        <Container className="trust-strip__grid">
          {trustPoints.map((point) => (
            <div className="trust-point" key={point.title}>
              <Icon name={point.icon} />
              <div>
                <strong>{point.title}</strong>
                <span>{point.text}</span>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <section className="section learning-section">
        <Container>
          <SectionHeading
            eyebrow="Learning made simple"
            title="Focused support, built around the learner"
            intro="Good tuition starts with understanding what a student needs now—and where they want to go next."
          />
          <div className="feature-grid">
            {learningFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                index={index + 1}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--navy personalised-section">
        <Container className="split-layout">
          <div>
            <SectionHeading
              eyebrow="Personalised tuition"
              title="A learning plan that responds to your child"
              intro="No two learners begin in the same place. LearnThrive adapts the pace, explanations and practice around the individual student while keeping school and exam goals in view."
              theme="inverse"
            />
            <ul className="tick-list tick-list--inverse">
              <li>Customised learning paths based on current needs</li>
              <li>Regular progress reporting for parents</li>
              <li>Interactive tools that keep lessons active</li>
            </ul>
            <ButtonLink href="/about" variant="light">
              Learn about our approach
            </ButtonLink>
          </div>
          <div className="learning-path" aria-label="Personalised learning cycle">
            <div className="learning-path__header">
              <span>Individual learning plan</span>
              <strong>Built to adapt</strong>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Understand</strong>
                  <p>Strengths, gaps, pace and goals</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Teach</strong>
                  <p>Clear explanations and active practice</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Review</strong>
                  <p>Progress, feedback and useful next steps</p>
                </div>
              </li>
            </ol>
          </div>
        </Container>
      </section>

      <section className="section subjects-preview">
        <Container>
          <div className="section-title-row">
            <SectionHeading
              eyebrow="Subjects"
              title="Support through every stage"
              intro="From strong foundations to more advanced study, teaching is shaped around the learner and the work in front of them."
            />
            <Link className="text-link" href="/subjects">
              View all subject details
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="subject-grid">
            {subjects.map((subject) => (
              <SubjectCard key={subject.slug} {...subject} />
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--tint how-section">
        <Container>
          <SectionHeading
            eyebrow="How LearnThrive works"
            title="A clear route from enquiry to learning"
            intro="Start with a conversation. LearnThrive will use what you share to understand the support your child needs."
            align="centre"
          />
          <ol className="steps-grid">
            {howItWorks.map((step, index) => (
              <li key={step.title}>
                <span className="step-number">{index + 1}</span>
                <Icon name={step.icon} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="section testimonials-section">
        <Container>
          <SectionHeading
            eyebrow="Parent feedback"
            title="What families say about LearnThrive"
            intro="These testimonials are preserved from the existing LearnThrive Tuition website, with spelling and punctuation corrected for clarity."
          />
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.title}
                {...testimonial}
                featured={index === 0}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--tint faq-preview-section">
        <Container className="faq-preview-layout">
          <div className="faq-preview-copy">
            <SectionHeading
              eyebrow="Questions and answers"
              title="Useful details before you enquire"
              intro="Read quick answers about lessons, subjects, personalisation and parent updates."
            />
            <Link className="text-link" href="/faq">
              View all FAQs
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <FaqList items={featuredFaqs} compact />
        </Container>
      </section>

      <CtaSection />
    </>
  );
}
