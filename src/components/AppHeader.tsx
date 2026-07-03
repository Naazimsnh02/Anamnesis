"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { OrganizationSwitcher, UserButton, useClerk } from "@clerk/nextjs";
import { PatientSwitcher } from "@/components/PatientSwitcher";
import { useOpsLog } from "@/lib/opsLog";

const NAV = [
  { href: "/remember", label: "Remember" },
  { href: "/assistant", label: "Assistant" },
  { href: "/summary", label: "Summary" },
] as const;

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--pen)",
    colorText: "var(--ink)",
    colorTextSecondary: "var(--ink-soft)",
    colorBackground: "var(--paper)",
    colorInputBackground: "var(--paper-2)",
    colorInputText: "var(--ink)",
    colorNeutral: "var(--ink)",
    fontFamily: "var(--font-sans)",
    borderRadius: "0.65rem",
  },
  elements: {
    card: "border border-[var(--line)] shadow-lg rounded-xl",
    popoverBox: "border border-[var(--line)] shadow-lg rounded-xl",
    popoverMain: "rounded-xl",
    userButtonPopoverCard: "border border-[var(--line)] shadow-lg rounded-xl",
    organizationSwitcherPopoverCard: "border border-[var(--line)] shadow-lg rounded-xl",
    organizationPreviewMainIdentifier: "text-[var(--ink)]",
    organizationSwitcherTriggerIcon: "text-[var(--ink-soft)]",
    userPreviewMainIdentifier: "text-[var(--ink)]",
    userPreviewSecondaryIdentifier: "text-[var(--ink-soft)]",
    button: "rounded-md",
    formButtonPrimary: "rounded-full",
    avatarBox: "rounded-full",
  },
};

export function AppHeader() {
  const pathname = usePathname();
  const { openOrganizationProfile } = useClerk();
  const { entries, togglePanel } = useOpsLog();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/remember" className="flex items-center gap-2" aria-label="Anamnesis, home">
            <Image
              src="/logo.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-md mix-blend-multiply"
              priority
            />
            <span className="display text-[1.25rem] leading-none" style={{ letterSpacing: "-0.02em" }}>
              Anamnesis
            </span>
            <span
              aria-hidden
              className="mono hidden sm:inline text-[0.6rem] tracking-[0.18em] text-[var(--ink-faint)]"
            >
              /əˌnamˈniːsɪs/
            </span>
          </Link>
          <nav className="mono hidden items-center gap-5 text-[0.8rem] md:flex">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative py-1 transition-colors"
                  style={{ color: active ? "var(--pen)" : "var(--ink-soft)" }}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-[13px] h-[2px]"
                      style={{ background: "var(--pen)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={togglePanel}
            className="mono flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink-soft)] transition hover:border-[var(--pen)] hover:text-[var(--ink)]"
          >
            activity
            <span
              className="rounded-full px-1.5 text-[0.65rem]"
              style={{ background: "var(--paper-2)", color: "var(--ink)" }}
            >
              {entries.length}
            </span>
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <PatientSwitcher />
            <div className="h-5 w-px bg-[var(--line)]" />
            <button
              onClick={() => openOrganizationProfile({ appearance: clerkAppearance })}
              className="mono text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              invite
            </button>
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/remember"
              afterSelectOrganizationUrl="/remember"
              appearance={clerkAppearance}
            />
            <UserButton appearance={clerkAppearance} />
          </div>

          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="mono rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink-soft)] sm:hidden"
            aria-expanded={mobileNavOpen}
            aria-label="Toggle menu"
          >
            menu
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="flex flex-col gap-4 border-t border-[var(--line)] px-4 py-4 sm:hidden">
          <nav className="mono flex flex-col gap-3 text-sm">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  style={{ color: active ? "var(--pen)" : "var(--ink-soft)" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="h-px bg-[var(--line)]" />
          <PatientSwitcher />
          <div className="flex items-center justify-between">
            <button
              onClick={() => openOrganizationProfile({ appearance: clerkAppearance })}
              className="mono text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              invite a colleague
            </button>
            <div className="flex items-center gap-2">
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/remember"
                afterSelectOrganizationUrl="/remember"
                appearance={clerkAppearance}
              />
              <UserButton appearance={clerkAppearance} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
