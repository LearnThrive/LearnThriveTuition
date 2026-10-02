"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Brand } from "@/components/Brand";
import { ButtonLink } from "@/components/ButtonLink";
import { Container } from "@/components/Container";
import { navigation } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // "Airy at the top, compact and solid once scrolled", without per-pixel React scroll state:
  // scrollY is read through Motion's own scroll listener, and setState only fires when the
  // boolean threshold actually flips — never once per pixel scrolled.
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 24;
    if (next === scrolledRef.current) return;
    scrolledRef.current = next;
    setScrolled(next);
  });

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.body.classList.toggle("menu-open", open);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("menu-open");
    };
  }, [open]);

  function isCurrent(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className={`site-header${scrolled ? " site-header--scrolled" : ""}`}>
      <Container className="site-header__inner">
        <Brand />
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? "Close main menu" : "Open main menu"}
          onClick={() => setOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
        <div
          className={`navigation-shell ${open ? "navigation-shell--open" : ""}`}
          id="primary-navigation"
        >
          <nav className="primary-navigation" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ButtonLink href="/book" className="header-cta">
            Book a free consultation
          </ButtonLink>
        </div>
      </Container>
      {/* Mobile menu choreography is backdrop -> panel -> links -> CTA. This dims the page behind
          the open menu and gives touch and mouse users an obvious way to dismiss it (keyboard
          users have the Escape handler above). It has no effect outside the mobile menu's own
          breakpoint — see globals.css. */}
      <div
        className={`navigation-backdrop${open ? " navigation-backdrop--open" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
    </header>
  );
}
