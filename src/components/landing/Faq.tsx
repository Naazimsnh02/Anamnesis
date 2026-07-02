"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FAQ } from "./data";
import { Reveal } from "./primitives";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="section">
      <div className="wrap grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 className="display d-lg mt-5 max-w-[12ch]">
            The questions worth asking
          </h2>
        </Reveal>

        <div>
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.04}>
                <div className="border-t" style={{ borderColor: "var(--line)" }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="display" style={{ fontSize: "clamp(1.25rem, 2vw, 1.6rem)" }}>
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors"
                      style={{
                        border: "1px solid var(--line)",
                        background: isOpen ? "var(--ink)" : "transparent",
                        color: isOpen ? "var(--paper)" : "var(--ink)",
                      }}
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{ lineHeight: 1, fontSize: "1.1rem" }}
                      >
                        +
                      </motion.span>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={reduce ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[62ch] pb-7 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
          <div className="border-t" style={{ borderColor: "var(--line)" }} />
        </div>
      </div>
    </section>
  );
}
