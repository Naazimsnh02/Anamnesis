import Image from "next/image";
import { Reveal, Stagger, StaggerItem } from "./primitives";
import { FEATURES, HOW, ADVANTAGES, ROADMAP } from "./data";

const SOURCES = [
  "Hospital",
  "Clinic",
  "Laboratory",
  "Imaging center",
  "Prescription",
  "Discharge summary",
  "Doctor’s notes",
];

/* --- Problem -------------------------------------------------------------- */

export function Problem({ art }: { art: string | null }) {
  return (
    <section id="problem" className="section relative overflow-hidden">
      {art && (
        <div className="pointer-events-none absolute inset-0 z-0 hidden sm:flex sm:items-center" aria-hidden>
          <Image
            src={art}
            alt=""
            width={1512}
            height={648}
            sizes="100vw"
            className="h-auto w-full select-none opacity-80"
            style={{ mixBlendMode: "multiply" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, var(--paper) 0%, transparent 32%, transparent 68%, var(--paper) 100%)",
            }}
          />
        </div>
      )}
      <div className="wrap relative z-10 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow">The problem</p>
          <h2 className="display d-xl mt-5 max-w-[14ch]">
            History arrives in <em>fragments.</em>
          </h2>
          <p className="lede mt-6 max-w-[46ch]">
            A single patient&apos;s story is split across seven systems that never speak.
            Every consultation begins by reconstructing it from scratch — so clinicians
            spend their time searching instead of diagnosing.
          </p>
        </Reveal>

        <Stagger className="flex flex-col justify-center">
          {SOURCES.map((s, i) => (
            <StaggerItem key={s}>
              <div
                className="group flex items-baseline justify-between border-t py-4"
                style={{ borderColor: "var(--line)" }}
              >
                <span className="mono" style={{ fontSize: "0.7rem", color: "var(--ink-faint)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="display flex-1 pl-6"
                  style={{ fontSize: "clamp(1.3rem, 2.4vw, 1.9rem)" }}
                >
                  {s}
                </span>
                <span className="mono" style={{ fontSize: "0.7rem", color: "var(--ink-faint)" }}>
                  disconnected
                </span>
              </div>
            </StaggerItem>
          ))}
          <div className="border-t" style={{ borderColor: "var(--line)" }} />
          <StaggerItem>
            <p className="mt-6 max-w-[42ch] text-[0.95rem]" style={{ color: "var(--ink-soft)" }}>
              Traditional EHRs store these documents. None of them connect years of
              events into something that means anything.
            </p>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

/* --- Features ------------------------------------------------------------- */

export function Features() {
  return (
    <section id="features" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">What you get</p>
          <h2 className="display d-xl mt-5 max-w-[18ch]">
            One memory, seen from every angle
          </h2>
        </Reveal>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <StaggerItem key={f.k}>
              <article className="card h-full p-8">
                <span
                  className="mono inline-block rounded-full px-2.5 py-1"
                  style={{
                    fontSize: "0.66rem",
                    letterSpacing: "0.14em",
                    color: "var(--pen)",
                    background: "color-mix(in srgb, var(--pen) 8%, transparent)",
                  }}
                >
                  {f.k.toUpperCase()}
                </span>
                <h3 className="display mt-6" style={{ fontSize: "1.6rem" }}>
                  {f.title}
                </h3>
                <p className="mt-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  {f.body}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* --- How it works (genuinely sequential → numbered) ----------------------- */

export function How() {
  return (
    <section id="how" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="display d-xl mt-5 max-w-[16ch]">
            From a stack of paper to a living record
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {HOW.map((h, i) => (
            <Reveal key={h.step} delay={i * 0.06}>
              <div className="flex gap-6">
                <span
                  className="display shrink-0"
                  style={{ fontSize: "2.6rem", color: "var(--line)", lineHeight: 1 }}
                >
                  {h.step}
                </span>
                <div className="border-t pt-4" style={{ borderColor: "var(--ink)" }}>
                  <h3 className="display" style={{ fontSize: "1.7rem" }}>
                    {h.title}
                  </h3>
                  <p className="mt-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {h.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- Advantages / Benefits ------------------------------------------------ */

export function Advantages() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">Why it&apos;s different</p>
          <h2 className="display d-xl mt-5 max-w-[16ch]">
            Most clinical AI reads documents. Anamnesis <em>remembers</em> the patient.
          </h2>
        </Reveal>

        <Stagger className="mt-14 grid gap-x-14 gap-y-12 sm:grid-cols-2">
          {ADVANTAGES.map((a) => (
            <StaggerItem key={a.title}>
              <div className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: "var(--ember)" }}
                />
                <div>
                  <h3 className="display" style={{ fontSize: "1.5rem" }}>
                    {a.title}
                  </h3>
                  <p className="mt-2.5 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {a.body}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* --- Roadmap -------------------------------------------------------------- */

export function Roadmap() {
  return (
    <section id="roadmap" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">Roadmap</p>
          <h2 className="display d-xl mt-5 max-w-[16ch]">Where the memory goes next</h2>
        </Reveal>

        <div className="mt-14">
          {ROADMAP.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.05}>
              <div
                className="grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-1 border-t py-7 sm:grid-cols-[7rem_1fr_1.4fr] sm:gap-x-10"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="mono inline-flex items-center gap-2"
                  style={{ fontSize: "0.72rem", color: r.live ? "var(--ember)" : "var(--ink-faint)" }}
                >
                  {r.live && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--ember)" }} />
                  )}
                  {r.when}
                </span>
                <h3 className="display" style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)" }}>
                  {r.title}
                </h3>
                <p className="col-span-2 mt-1 sm:col-span-1 sm:mt-0" style={{ color: "var(--ink-soft)" }}>
                  {r.body}
                </p>
              </div>
            </Reveal>
          ))}
          <div className="border-t" style={{ borderColor: "var(--line)" }} />
        </div>
      </div>
    </section>
  );
}
