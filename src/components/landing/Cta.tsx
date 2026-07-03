"use client";

import { SignUpButton, Show } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import { Magnetic, MemoryTrace } from "./primitives";

export function Cta() {
  const reduce = useReducedMotion();
  return (
    <section className="ink-surface on-ink relative overflow-hidden">
      <div className="section wrap relative z-10 text-center">
        <motion.p
          className="eyebrow on-ink"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Every patient&apos;s story. Remembered.
        </motion.p>

        <h2 className="display mx-auto mt-6 max-w-[18ch]" style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}>
          Give the record a <em style={{ color: "var(--ember)" }}>memory.</em>
        </h2>

        <p className="lede mx-auto mt-7 max-w-[52ch]">
          Turn years of scattered documents into one connected clinical memory
          on infrastructure you control, built entirely on open source.
        </p>

        <div className="mt-11 flex flex-wrap items-center justify-center gap-3">
          <Show when="signed-out">
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <Magnetic className="btn btn-primary">
                Start remembering
                <span aria-hidden>→</span>
              </Magnetic>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Magnetic href="/dashboard" className="btn btn-primary">
              Open the app
              <span aria-hidden>→</span>
            </Magnetic>
          </Show>
          <Magnetic href="#memory" className="btn btn-ghost">
            Revisit the memory model
          </Magnetic>
        </div>
      </div>

      {/* ambient trace, low and quiet */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.14]"
        aria-hidden
        style={{ maskImage: "linear-gradient(to top, black, transparent)" }}
      >
        <MemoryTrace className="h-auto w-full" play={false} />
      </div>
    </section>
  );
}
