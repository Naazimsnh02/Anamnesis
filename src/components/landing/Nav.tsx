"use client";

import { useEffect, useState } from "react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { NAV } from "./data";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "color-mix(in srgb, var(--paper) 78%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(1.4)" : "none",
        borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
      }}
    >
      <nav className="wrap flex items-center justify-between py-4">
        <a href="#top" className="flex items-baseline gap-2" aria-label="Anamnesis, home">
          <span
            className="display text-[1.35rem] leading-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            Anamnesis
          </span>
          <span
            aria-hidden
            className="mono hidden sm:inline"
            style={{ fontSize: "0.62rem", color: "var(--ink-faint)", letterSpacing: "0.18em" }}
          >
            /əˌnamˈniːsɪs/
          </span>
        </a>

        <div
          className="mono hidden items-center gap-8 md:flex"
          style={{ fontSize: "0.8rem" }}
        >
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="transition-colors"
              style={{ color: "var(--ink-soft)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-soft)")}
            >
              {n.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Show when="signed-out">
            <span className="hidden sm:inline-flex">
              <SignInButton mode="modal">
                <button className="btn btn-ghost">Sign in</button>
              </SignInButton>
            </span>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">
                Get started
                <span aria-hidden>→</span>
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <a href="/remember" className="btn btn-ghost hidden sm:inline-flex">
              Open app
            </a>
            <UserButton />
          </Show>
        </div>
      </nav>
    </header>
  );
}
