"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { OPERATIONS } from "./data";
import { Reveal } from "./primitives";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function Memory() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const op = OPERATIONS[active];

  return (
    <section id="memory" className="ink-surface section on-ink">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow on-ink">Four operations, one memory</p>
          <h2 className="display d-xl mt-5 max-w-[16ch]">
            The lifecycle of a <em>remembered</em> patient
          </h2>
          <p className="lede mt-6 max-w-[58ch]">
            Anamnesis is built on four memory operations. Every one is visible in the
            product — not hidden behind the interface, but the interface itself.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* verb selector */}
          <div className="flex flex-col">
            {OPERATIONS.map((o, i) => {
              const on = i === active;
              return (
                <button
                  key={o.verb}
                  onClick={() => setActive(i)}
                  className="group relative flex items-baseline gap-4 border-t py-5 text-left transition-colors"
                  style={{ borderColor: "var(--line-dark)" }}
                  aria-pressed={on}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "0.72rem",
                      color: on ? "var(--ember)" : "var(--ink-faint)",
                      transition: "color .3s",
                    }}
                  >
                    0{i + 1}
                  </span>
                  <span
                    className="display"
                    style={{
                      fontSize: "clamp(1.7rem, 3vw, 2.5rem)",
                      color: on ? "var(--paper-on-ink)" : "#5c6f6c",
                      transition: "color .3s",
                    }}
                  >
                    {o.verb}
                  </span>
                  {on && (
                    <motion.span
                      layoutId="verb-marker"
                      className="absolute left-0 top-0 h-px"
                      style={{ background: "var(--ember)", width: "100%" }}
                      transition={{ duration: 0.4, ease: EASE }}
                    />
                  )}
                </button>
              );
            })}
            <div className="border-t" style={{ borderColor: "var(--line-dark)" }} />
          </div>

          {/* detail panel */}
          <div className="relative min-h-[19rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={op.verb}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div
                  className="mono inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--ember-soft)",
                    background: "color-mix(in srgb, var(--ember) 14%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--ember) 30%, transparent)",
                  }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--ember)" }}
                  />
                  {op.signature}
                </div>

                <h3 className="display mt-6" style={{ fontSize: "clamp(1.6rem,3vw,2.3rem)" }}>
                  {op.title}
                </h3>
                <p className="lede mt-5 max-w-[46ch]">{op.body}</p>

                {/* a node "written" to memory */}
                <div
                  className="mt-9 flex items-center gap-3 rounded-xl p-4"
                  style={{
                    background: "var(--ink-2)",
                    border: "1px solid var(--line-dark)",
                  }}
                >
                  <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)" }}>
                    graph ▸
                  </span>
                  <span
                    className="mono truncate"
                    style={{ fontSize: "0.82rem", color: "var(--paper-on-ink)" }}
                  >
                    {op.node}
                  </span>
                  <motion.span
                    aria-hidden
                    className="ml-auto inline-block h-2 w-2 rounded-full"
                    style={{ background: "var(--ember)" }}
                    animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
