"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const YEAR_PAGE_SIZE = 12;

type ViewMode = "days" | "months" | "years";

function parseISO(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

function yearPageStart(year: number): number {
  return Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const selected = parseISO(value);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("days");
  const triggerRef = useRef<HTMLButtonElement>(null);

  function openPicker() {
    if (disabled) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom + 6, left: r.left });
    setViewDate(selected ?? new Date());
    setViewMode("days");
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const yearsStart = yearPageStart(year);
  const yearsRange = Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearsStart + i);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`mono flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-transparent px-3 py-1.5 text-xs text-[var(--ink)] transition hover:border-[var(--pen)] disabled:opacity-50 ${className}`}
      >
        <span className={selected ? "" : "text-[var(--ink-faint)]"}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <span aria-hidden className="text-[var(--ink-faint)]">
          ▾
        </span>
      </button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="dialog"
              aria-label="Choose date"
              style={{ position: "fixed", top: rect.top, left: rect.left }}
              className="z-50 w-64 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === "days") setViewDate(new Date(year, month - 1, 1));
                    else if (viewMode === "months") setViewDate(new Date(year - 1, month, 1));
                    else setViewDate(new Date(year - YEAR_PAGE_SIZE, month, 1));
                  }}
                  className="mono px-2 py-1 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  aria-label="Previous"
                >
                  ‹
                </button>

                {viewMode === "days" && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("months")}
                      className="mono rounded px-1.5 py-0.5 text-xs text-[var(--ink)] hover:bg-[var(--paper-2)]"
                    >
                      {MONTHS[month]}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("years")}
                      className="mono rounded px-1.5 py-0.5 text-xs text-[var(--ink)] hover:bg-[var(--paper-2)]"
                    >
                      {year}
                    </button>
                  </div>
                )}
                {viewMode === "months" && (
                  <button
                    type="button"
                    onClick={() => setViewMode("years")}
                    className="mono rounded px-1.5 py-0.5 text-xs text-[var(--ink)] hover:bg-[var(--paper-2)]"
                  >
                    {year}
                  </button>
                )}
                {viewMode === "years" && (
                  <p className="mono text-xs text-[var(--ink)]">
                    {yearsStart}–{yearsStart + YEAR_PAGE_SIZE - 1}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === "days") setViewDate(new Date(year, month + 1, 1));
                    else if (viewMode === "months") setViewDate(new Date(year + 1, month, 1));
                    else setViewDate(new Date(year + YEAR_PAGE_SIZE, month, 1));
                  }}
                  className="mono px-2 py-1 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  aria-label="Next"
                >
                  ›
                </button>
              </div>

              {viewMode === "days" && (
                <>
                  <div className="mono mt-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] text-[var(--ink-faint)]">
                    {WEEKDAYS.map((w) => (
                      <span key={w}>{w}</span>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                      if (!day) return <span key={i} />;
                      const isSelected = selected && toISO(day) === toISO(selected);
                      const isToday = toISO(day) === toISO(today);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            onChange(toISO(day));
                            setOpen(false);
                          }}
                          className="mono flex h-7 w-7 items-center justify-center rounded-full text-xs transition hover:bg-[var(--paper-2)]"
                          style={
                            isSelected
                              ? { background: "var(--pen)", color: "var(--paper)" }
                              : isToday
                              ? { border: "1px solid var(--ember)", color: "var(--ink)" }
                              : { color: "var(--ink)" }
                          }
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {viewMode === "months" && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {MONTHS_SHORT.map((m, i) => {
                    const isCurrent = i === month;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setViewDate(new Date(year, i, 1));
                          setViewMode("days");
                        }}
                        className="mono rounded-lg py-2 text-xs transition hover:bg-[var(--paper-2)]"
                        style={
                          isCurrent
                            ? { background: "var(--pen)", color: "var(--paper)" }
                            : { color: "var(--ink)" }
                        }
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}

              {viewMode === "years" && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {yearsRange.map((y) => {
                    const isCurrent = y === year;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setViewDate(new Date(y, month, 1));
                          setViewMode("months");
                        }}
                        className="mono rounded-lg py-2 text-xs transition hover:bg-[var(--paper-2)]"
                        style={
                          isCurrent
                            ? { background: "var(--pen)", color: "var(--paper)" }
                            : { color: "var(--ink)" }
                        }
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              )}

              {selected && viewMode === "days" && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="mono mt-2 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
                >
                  Clear
                </button>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
