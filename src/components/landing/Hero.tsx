"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SignUpButton, Show } from "@clerk/nextjs";
import { MemoryTrace, Magnetic } from "./primitives";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const HEADLINE = ["Every", "patient’s", "story."];

const ART_MASK =
  "radial-gradient(78% 66% at 60% 50%, #000 44%, transparent 88%)";

function ArtImage({ art }: { art: string | null }) {
  if (!art) return <MemoryTrace className="h-auto w-full" />;
  return (
    <Image
      src={art}
      alt="A clinical vitals trace unspooling into a connected graph of a patient's memory, with a single node lit warm amber."
      width={1408}
      height={792}
      sizes="100vw"
      className="h-auto w-full select-none"
      style={{ mixBlendMode: "multiply", maskImage: ART_MASK, WebkitMaskImage: ART_MASK }}
    />
  );
}

export function Hero({ art }: { art: string | null }) {
  const reduce = useReducedMotion();

  return (
    <section
      id="top"
      className="relative isolate flex min-h-[92vh] flex-col justify-center overflow-hidden pt-28 pb-16 sm:pt-32"
    >
      {/* signature artwork — on desktop it's an absolute background *behind* the
          headline (content is z-10), so the hero reads as one composition:
          copy on the left, the memory graph resolving on the open right. */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block" aria-hidden>
        <motion.div
          className="absolute inset-0 flex items-center"
          initial={reduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.35 }}
        >
          <ArtImage art={art} />
        </motion.div>
        {/* left-weighted paper scrim keeps the headline crisp over the art */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, var(--paper) 0%, color-mix(in srgb, var(--paper) 72%, transparent) 30%, color-mix(in srgb, var(--paper) 20%, transparent) 52%, transparent 68%)",
          }}
        />
        {/* soft top/bottom feather into the page */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--paper) 0%, transparent 18%, transparent 82%, var(--paper) 100%)",
          }}
        />
      </div>

      {/* content */}
      <div className="wrap relative z-10">
        <motion.p
          className="eyebrow"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Persistent clinical memory, built for care teams
        </motion.p>

        <h1 className="display d-hero mt-6 max-w-[16ch]">
          {HEADLINE.map((word, i) => (
            <span
              key={word}
              className="inline-block overflow-hidden align-baseline"
              style={{ marginRight: "0.26em" }}
            >
              <motion.span
                className="inline-block"
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.11 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
          <span className="inline-block overflow-hidden align-baseline">
            <motion.em
              className="inline-block"
              style={{ color: "var(--pen)" }}
              initial={reduce ? false : { y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 + HEADLINE.length * 0.11 }}
            >
              Remembered.
            </motion.em>
          </span>
        </h1>

        <motion.p
          className="lede mt-8 max-w-[46ch]"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
        >
          A patient&apos;s history is scattered across hospitals, labs and years of
          paper. Anamnesis turns it into one living memory — connected, reasoned over,
          and always current. Medical records store information. Anamnesis remembers
          the patient.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center gap-3"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.72 }}
        >
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Magnetic className="btn btn-primary">
                Start remembering
                <span aria-hidden>→</span>
              </Magnetic>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Magnetic href="/remember" className="btn btn-primary">
              Open the app
              <span aria-hidden>→</span>
            </Magnetic>
          </Show>
          <Magnetic href="#how" className="btn btn-ghost">
            See how it works
          </Magnetic>
        </motion.div>

        {/* a small clinical readout, tying the hero to the real product surface */}
        <motion.div
          className="mono mt-14 flex flex-wrap items-center gap-x-6 gap-y-2"
          style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.95 }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--ember)" }}
            />
            Remember
          </span>
          <span>Recall</span>
          <span>Improve</span>
          <span>Forget</span>
          <span className="hidden sm:inline">— the four stages of a living patient record</span>
        </motion.div>
      </div>

      {/* mobile: the art flows below the copy as a connected band (no overlap
          with the text). Desktop shows the absolute background layer instead. */}
      <div className="relative mt-8 w-full sm:hidden">
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to bottom, var(--paper) 0%, transparent 22%, transparent 80%, var(--paper) 100%)",
          }}
        />
        <ArtImage art={art} />
      </div>
    </section>
  );
}
