"use client";

import { useEffect, useState } from "react";
import { tailText } from "@/lib/city/text";

interface TypedTextOverlayProps {
  text: string;
  reducedMotion?: boolean;
}

export default function TypedTextOverlay({
  text,
  reducedMotion = false,
}: TypedTextOverlayProps) {
  const [debouncedSrText, setDebouncedSrText] = useState(text);

  // Debounce teks lengkap untuk pembaca layar (screen reader) selama 500 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSrText(text);
    }, 500);
    return () => clearTimeout(timer);
  }, [text]);

  if (!text || text.trim().length === 0) {
    return null;
  }

  const displayed = tailText(text, 36);

  return (
    <>
      {/* Teks lengkap yang dapat diakses oleh screen reader */}
      <div className="sr-only" aria-live="polite">
        {debouncedSrText}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-20 max-w-[90vw] px-4 py-1.5 rounded-full bg-slate-950/50 backdrop-blur-md border border-white/10 shadow-lg text-white/95 font-[family-name:var(--font-playfair)] font-serif text-[17px] tracking-wide whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center gap-1 select-none"
      >
        <span>{displayed}</span>
        {/* Kursor berkedip (tidak berkedip jika prefers-reduced-motion) */}
        <span
          className={`inline-block w-[1.5px] h-4 bg-cyan-300 ml-0.5 motion-reduce:animate-none motion-reduce:opacity-90 ${
            reducedMotion ? "opacity-90" : "animate-pulse"
          }`}
        />
      </div>
    </>
  );
}
