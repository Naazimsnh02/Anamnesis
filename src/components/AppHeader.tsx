"use client";

import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/remember", label: "Remember" },
  { href: "/assistant", label: "Assistant" },
  { href: "/summary", label: "Summary" },
] as const;

export function AppHeader() {
  return (
    <header className="border-b border-black/10 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link href="/remember" className="font-medium tracking-tight">
          Anamnesis
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-black/60 hover:text-black">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/remember"
          afterSelectOrganizationUrl="/remember"
        />
        <UserButton />
      </div>
    </header>
  );
}
