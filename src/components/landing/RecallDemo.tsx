"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./primitives";

const EASE = [0.2, 0.8, 0.2, 1] as const;

type Demo = {
  q: string;
  chain: string[];
  answer: string;
};

const DEMOS: Demo[] = [
  {
    q: "Why is kidney function declining?",
    chain: [
      "Creatinine ↑ (1.1 → 1.9 mg/dL)",
      "eGFR ↓ over 18 months",
      "Persistent hypertension",
      "Amlodipine adherence gaps",
      "2 dehydration admissions",
    ],
    answer:
      "Kidney function has declined alongside rising creatinine and falling eGFR, against a background of poorly controlled hypertension and two dehydration-related admissions — consistent with hypertensive nephropathy, not an acute event.",
  },
  {
    q: "When did diabetes first appear?",
    chain: [
      "Fasting glucose 118 mg/dL · Mar 2023",
      "HbA1c 6.1% · Sep 2023",
      "HbA1c 7.8% · Jan 2025",
      "Metformin started · Jan 2025",
    ],
    answer:
      "The earliest signal was borderline fasting glucose in March 2023, well before the formal diagnosis in January 2025. Anamnesis linked that early reading forward once the diagnosis landed.",
  },
  {
    q: "Which medication caused the nausea?",
    chain: [
      "Metformin started · Jan 2025",
      "Nausea reported · Feb 2025",
      "Dose held · Feb 2025",
      "Symptom resolved · Mar 2025",
    ],
    answer:
      "The timeline points to metformin: nausea began weeks after initiation and resolved when the dose was held — a likely side-effect relationship the graph surfaced automatically.",
  },
];

export function RecallDemo() {
  const [active, setActive] = useState(0);
  const [asked, setAsked] = useState(false);
  const reduce = useReducedMotion();
  const demo = DEMOS[active];

  function ask(i: number) {
    setActive(i);
    setAsked(true);
  }

  return (
    <section id="recall-demo" className="section section-alt">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">Recall, live</p>
          <h2 className="display d-xl mt-5 max-w-[15ch]">
            Ask the history. See the <em>reasoning.</em>
          </h2>
          <p className="lede mt-6 max-w-[56ch]">
            Not a document search that hands back a passage — a walk across the patient&apos;s
            graph, returned with the evidence it stepped through. Pick a question.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="card overflow-hidden" style={{ borderRadius: 22 }}>
            <div className="grid md:grid-cols-[1fr_1.25fr]">
              {/* questions */}
              <div
                className="flex flex-col gap-2 p-6 sm:p-8"
                style={{ background: "var(--paper-2)", borderRight: "1px solid var(--line)" }}
              >
                <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)" }}>
                  SAMPLE QUERIES
                </span>
                {DEMOS.map((d, i) => (
                  <button
                    key={d.q}
                    onClick={() => ask(i)}
                    className="rounded-xl px-4 py-3 text-left text-[0.95rem] transition-all"
                    style={{
                      background: i === active && asked ? "var(--paper)" : "transparent",
                      border: `1px solid ${i === active && asked ? "var(--pen)" : "var(--line)"}`,
                      color: "var(--ink)",
                    }}
                  >
                    {d.q}
                  </button>
                ))}
                <p className="mt-2 text-[0.8rem]" style={{ color: "var(--ink-faint)" }}>
                  A demonstration using a sample patient record.
                </p>
              </div>

              {/* answer + evidence chain */}
              <div className="relative min-h-[24rem] p-6 sm:p-9">
                {!asked ? (
                  <div className="flex h-full min-h-[20rem] flex-col items-start justify-center">
                    <span
                      className="mono inline-flex items-center gap-2"
                      style={{ fontSize: "0.78rem", color: "var(--pen)" }}
                    >
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--ember)" }} />
                      Ready to recall
                    </span>
                    <p className="lede mt-4">Select a question to traverse the memory graph.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={demo.q}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduce ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)" }}>
                        EVIDENCE CHAIN
                      </span>
                      <ol className="mt-4 flex flex-col gap-0">
                        {demo.chain.map((node, i) => (
                          <motion.li
                            key={node}
                            className="relative flex items-center gap-3 py-2"
                            initial={reduce ? false : { opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, ease: EASE, delay: i * 0.14 }}
                          >
                            <span className="relative flex h-6 w-6 items-center justify-center">
                              {i < demo.chain.length - 1 && (
                                <motion.span
                                  className="absolute left-1/2 top-1/2 w-px"
                                  style={{ background: "var(--pen)", height: "2.3rem", transformOrigin: "top" }}
                                  initial={reduce ? false : { scaleY: 0 }}
                                  animate={{ scaleY: 1 }}
                                  transition={{ duration: 0.3, delay: i * 0.14 + 0.1 }}
                                />
                              )}
                              <span
                                className="relative z-10 h-2.5 w-2.5 rounded-full"
                                style={{
                                  background: i === demo.chain.length - 1 ? "var(--ember)" : "var(--pen)",
                                  boxShadow:
                                    i === demo.chain.length - 1
                                      ? "0 0 0 4px color-mix(in srgb, var(--ember) 22%, transparent)"
                                      : "none",
                                }}
                              />
                            </span>
                            <span className="mono" style={{ fontSize: "0.82rem", color: "var(--ink)" }}>
                              {node}
                            </span>
                          </motion.li>
                        ))}
                      </ol>

                      <motion.div
                        className="mt-6 border-t pt-5"
                        style={{ borderColor: "var(--line)" }}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: demo.chain.length * 0.14 }}
                      >
                        <span className="eyebrow">Answer</span>
                        <p className="mt-3 text-[1.02rem] leading-relaxed" style={{ color: "var(--ink)" }}>
                          {demo.answer}
                        </p>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
