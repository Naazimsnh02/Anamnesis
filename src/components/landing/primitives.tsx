"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/* --- scroll reveal, with staggered children ------------------------------ */

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "h2" | "p";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const child: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduce ? undefined : stagger}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? undefined : child}>
      {children}
    </motion.div>
  );
}

/* --- magnetic button ----------------------------------------------------- */

export function Magnetic({
  children,
  className,
  href,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  function move(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  }
  function reset() {
    if (ref.current) ref.current.style.transform = "";
  }

  const props = {
    ref,
    className,
    onMouseMove: move,
    onMouseLeave: reset,
    onClick,
  };
  return href ? (
    <a href={href} {...props}>
      {children}
    </a>
  ) : (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

/* --- parallax wrapper ---------------------------------------------------- */

export function Parallax({
  children,
  amount = 40,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/* --- the signature: a memory trace that draws itself --------------------- */

/**
 * A vitals trace on the left that unspools into a small connected graph on the
 * right, with one node lit warm amber — the same idea as the generated hero
 * art, rendered as live SVG so it animates and works as a no-image fallback.
 */
export function MemoryTrace({
  className,
  play = true,
}: {
  className?: string;
  play?: boolean;
}) {
  const reduce = useReducedMotion();
  const animate = play && !reduce;

  const nodes = [
    { x: 505, cy: 150, r: 3.5, ember: false, d: 1.1 },
    { x: 560, cy: 128, r: 3, ember: false, d: 1.25 },
    { x: 618, cy: 168, r: 4, ember: false, d: 1.4 },
    { x: 676, cy: 138, r: 3, ember: false, d: 1.5 },
    { x: 705, cy: 150, r: 6, ember: true, d: 1.65 },
  ];
  const edges = [
    "M505,150 L560,128",
    "M560,128 L618,168",
    "M505,150 L618,168",
    "M618,168 L676,138",
    "M676,138 L705,150",
    "M560,128 L705,150",
  ];

  const traceD =
    "M0,150 L120,150 L138,150 Q150,150 156,120 L168,150 L176,150 L182,205 L192,150 " +
    "L360,150 Q400,150 420,132 T480,150 L505,150";

  return (
    <svg
      viewBox="0 0 720 300"
      fill="none"
      className={`draw ${className ?? ""}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* baseline */}
      <line x1="0" y1="150" x2="720" y2="150" stroke="var(--line)" strokeWidth="1" />

      {/* the drawn trace */}
      <motion.path
        d={traceD}
        stroke="var(--pen)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : false}
        whileInView={animate ? { pathLength: 1 } : undefined}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: EASE }}
      />

      {/* graph edges */}
      {edges.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--pen)"
          strokeOpacity="0.5"
          strokeWidth="1.25"
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          whileInView={animate ? { pathLength: 1, opacity: 1 } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 1.0 + i * 0.08 }}
        />
      ))}

      {/* nodes */}
      {nodes.map((n) => (
        <motion.circle
          key={n.x}
          cx={n.x}
          cy={n.cy}
          r={n.r}
          fill={n.ember ? "var(--ember)" : "var(--pen)"}
          initial={animate ? { scale: 0, opacity: 0 } : false}
          whileInView={animate ? { scale: 1, opacity: 1 } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: n.d }}
          style={{ transformOrigin: `${n.x}px ${n.cy}px` }}
        />
      ))}

      {/* ember halo pulse */}
      {animate && (
        <motion.circle
          cx={705}
          cy={150}
          r={6}
          fill="none"
          stroke="var(--ember)"
          strokeWidth="1.5"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
          transition={{ duration: 2.2, ease: "easeOut", repeat: Infinity, delay: 2 }}
          style={{ transformOrigin: "705px 150px" }}
        />
      )}
    </svg>
  );
}
