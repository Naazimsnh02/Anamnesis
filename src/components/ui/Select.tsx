"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string };

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
  className = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  function openMenu() {
    if (disabled || options.length === 0) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScrollOrResize() {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`mono flex items-center justify-between gap-2 rounded-full border border-[var(--line)] bg-transparent px-3 py-1.5 text-xs text-[var(--ink)] transition hover:border-[var(--pen)] disabled:opacity-50 ${className}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
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
            <ul
              role="listbox"
              style={{ position: "fixed", top: rect.top, left: rect.left, minWidth: rect.width }}
              className="z-50 max-h-64 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] py-1 shadow-[var(--shadow-lift)]"
            >
              {options.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className="mono flex w-full items-center px-3 py-1.5 text-left text-xs text-[var(--ink)] transition hover:bg-[var(--paper-2)]"
                    style={o.value === value ? { color: "var(--pen)" } : undefined}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          </>,
          document.body
        )}
    </>
  );
}
