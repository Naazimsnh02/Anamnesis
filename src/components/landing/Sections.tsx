import type { SVGProps } from "react";
import { Reveal, Stagger, StaggerItem } from "./primitives";
import { FEATURES, HOW, ADVANTAGES, ROADMAP } from "./data";

/* --- thin line icons for fragmented source types --------------------- */

type IconProps = SVGProps<SVGSVGElement>;

const iconProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function HospitalIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M5 21V5.5a1 1 0 0 1 .55-.9l6-3a1 1 0 0 1 .9 0l6 3a1 1 0 0 1 .55.9V21" />
      <path d="M3 21h18" />
      <path d="M9 21v-4h6v4" />
      <path d="M12 7v4M10 9h4" />
    </svg>
  );
}

function ClinicIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M6 3v7a4 4 0 0 0 8 0V3" />
      <path d="M6 6H4M10 6H8" />
      <path d="M14 10v3a4 4 0 0 0 4 4 4 4 0 0 0 4-4" />
      <circle cx="20" cy="17.5" r="1.6" />
    </svg>
  );
}

function LaboratoryIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M10 3h4" />
      <path d="M10.5 3v6.2L5.7 18a1.6 1.6 0 0 0 1.4 2.4h9.8a1.6 1.6 0 0 0 1.4-2.4l-4.8-8.8V3" />
      <path d="M7.5 15h9" />
    </svg>
  );
}

function ImagingIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 3c-2.8 0-4 2-4 5v6c0 3.5 1.6 7 4 7s4-3.5 4-7V8c0-3-1.2-5-4-5Z" />
      <path d="M8.5 8h7M8 11.5h8M8.3 15h7.4" />
    </svg>
  );
}

function PrescriptionIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M6 3h6.5A3.5 3.5 0 0 1 16 6.5 3.5 3.5 0 0 1 12.5 10H8" />
      <path d="M6 3v18" />
      <path d="M8 10l8 11" />
      <path d="M12.6 15.5h3.4" />
    </svg>
  );
}

function DischargeIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 12.5h5M9.5 15.5h5M9.5 18h3" />
    </svg>
  );
}

function NotesIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9 11h6M9 14h6M9 17h3.5" />
    </svg>
  );
}

const SOURCES = [
  { label: "Hospital", Icon: HospitalIcon },
  { label: "Clinic", Icon: ClinicIcon },
  { label: "Laboratory", Icon: LaboratoryIcon },
  { label: "Imaging center", Icon: ImagingIcon },
  { label: "Prescription", Icon: PrescriptionIcon },
  { label: "Discharge summary", Icon: DischargeIcon },
  { label: "Doctor’s notes", Icon: NotesIcon },
];

/* --- Problem -------------------------------------------------------------- */

export function Problem() {
  return (
    <section id="problem" className="section relative overflow-hidden">
      <div className="wrap relative z-10">
        <Reveal>
          <p className="eyebrow">The problem</p>
          <h2 className="display d-xl mt-5 max-w-[16ch]">
            History arrives in <em>fragments.</em>
          </h2>
          <p className="lede mt-6 max-w-[58ch]">
            A single patient&apos;s story is split across seven systems that never speak.
            Every consultation begins by reconstructing it from scratch — so clinicians
            spend their time searching instead of diagnosing.
          </p>
        </Reveal>

        <Stagger className="mt-16">
          <div className="grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-4 lg:grid-cols-7 lg:gap-x-6">
            {SOURCES.map(({ label, Icon }, i) => (
              <StaggerItem key={label}>
                <div className="flex flex-col items-center gap-4 text-center">
                  <Icon
                    className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
                    style={{ color: "var(--pen)" }}
                    aria-hidden
                  />
                  <span
                    className="mono"
                    style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="display leading-tight"
                    style={{ fontSize: "1.2rem" }}
                  >
                    {label}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.08em", color: "var(--ink-faint)" }}
                  >
                    disconnected
                  </span>
                </div>
              </StaggerItem>
            ))}
          </div>

          <div
            className="mt-10 hidden border-t sm:block"
            style={{ borderColor: "var(--line)" }}
            aria-hidden
          >
            <div className="grid grid-cols-4 gap-x-6 lg:grid-cols-7">
              {SOURCES.map(({ label }) => (
                <div key={label} className="flex justify-center">
                  <span
                    className="-mt-[4px] block h-[8px] w-[8px] shrink-0 rounded-full"
                    style={{ background: "var(--pen)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Stagger>

        <div
          className="mt-14 border-t pt-6"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="max-w-[52ch] text-[0.95rem]" style={{ color: "var(--ink-soft)" }}>
            Traditional EHRs store these documents. None of them connect years of
            events into something that means anything.
          </p>
        </div>
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
    <section id="how" className="section section-alt">
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
                  style={{ fontSize: "2.6rem", color: "var(--ink-faint)", lineHeight: 1 }}
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
          <h2 className="display d-xl mt-5 max-w-[36ch]">
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
    <section id="roadmap" className="section section-alt">
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
