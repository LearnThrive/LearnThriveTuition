import Link from "next/link";
import { BrandIllustration } from "@/components/brand/BrandIllustration";
import { ButtonLink } from "@/components/ButtonLink";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <section className="not-found">
      <Container className="not-found__inner">
        <div>
          <p className="eyebrow">Page not found</p>
          <h1>That page is not here</h1>
          <p>
            The address may have changed, or the page may no longer be available.
            Use the links below to continue.
          </p>
          <div className="button-group">
            <ButtonLink href="/">Return home</ButtonLink>
            <Link className="text-link" href="/subjects">
              See our subjects <span aria-hidden="true">→</span>
            </Link>
            <Link className="text-link" href="/contact">
              Contact LearnThrive <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <BrandIllustration variant="lost" className="not-found__art" />
      </Container>
    </section>
  );
}
