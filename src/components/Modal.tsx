"use client";

import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function Modal({
  title,
  onClose,
  children,
  width = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(backdropRef.current, { opacity: 0 });
      gsap.set(panelRef.current, { opacity: 0, y: 24, scale: 0.95 });
      gsap.to(backdropRef.current, { opacity: 1, duration: 0.2, ease: "power1.out" });
      gsap.to(panelRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-12 sm:pt-20"
    >
      <div ref={panelRef} className={`w-full ${width} card p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-hover)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
