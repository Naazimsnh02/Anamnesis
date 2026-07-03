import Image from "next/image";
import { NAV } from "./data";

const VALUES = ["Connected patient history", "Evidence-linked answers", "Data on infrastructure you control", "Nothing silently deleted"];

export function Footer() {
  return (
    <footer className="ink-surface on-ink border-t" style={{ borderColor: "var(--line-dark)" }}>
      <div className="wrap py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo_white_bg.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-md"
              />
              <span className="display" style={{ fontSize: "2rem" }}>
                Anamnesis
              </span>
            </div>
            <p className="mt-4 max-w-[34ch] leading-relaxed" style={{ color: "#a9bab6" }}>
              A persistent clinical memory that remembers, recalls, improves, and forgets,
              ensuring the patient's whole story is always in the room.
            </p>
          </div>

          <nav aria-label="Sections">
            <p className="mono" style={{ fontSize: "0.66rem", letterSpacing: "0.16em", color: "var(--ink-faint)" }}>
              EXPLORE
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="transition-colors hover:opacity-100"
                    style={{ color: "#a9bab6" }}
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mono" style={{ fontSize: "0.66rem", letterSpacing: "0.16em", color: "var(--ink-faint)" }}>
              WHAT YOU GET
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {VALUES.map((s) => (
                <li key={s} style={{ fontSize: "0.9rem", color: "#a9bab6" }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-14 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--line-dark)" }}
        >
          <p className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
            Anamnesis · /əˌnamˈniːsɪs/ · the recollection of a patient&apos;s history
          </p>
        </div>
      </div>
    </footer>
  );
}
