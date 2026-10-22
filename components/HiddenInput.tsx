"use client";

import { useRef } from "react";
import type { CityAction } from "@/lib/city/types";

interface HiddenInputProps {
  onAction: (action: CityAction, source: "beforeinput" | "keydown") => void;
  onFocusChange?: (info: string) => void;
}

export default function HiddenInput({ onAction, onFocusChange }: HiddenInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    const inputType = nativeEvent.inputType;

    if (inputType === "deleteContentBackward") {
      e.preventDefault();
      onAction({ type: "BACKSPACE" }, "beforeinput");
    } else if (inputType === "insertText" || inputType === "insertCompositionText") {
      e.preventDefault();
      const data = nativeEvent.data;
      if (data) {
        for (const char of data) {
          if (char === " ") {
            onAction({ type: "SPACE" }, "beforeinput");
          } else {
            onAction({ type: "TYPE_CHAR", char }, "beforeinput");
          }
        }
      }
    } else if (inputType === "insertParagraph" || inputType === "insertLineBreak") {
      e.preventDefault();
      onAction({ type: "ENTER" }, "beforeinput");
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleInput = () => {
    // Selalu pastikan nilai input kosong agar tidak ada akumulasi teks di DOM
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFocus = () => {
    const active = document.activeElement;
    const tagName = active ? active.tagName : "INPUT";
    const id = active?.id ? `#${active.id}` : "";
    const info = `FOKUS (${tagName}${id})`;
    console.log(`[FocusDebug] ${info}`);
    onFocusChange?.(info);
  };

  const handleBlur = () => {
    // Beri jeda 1 tick agar document.activeElement merefleksikan elemen baru yang menerima fokus
    setTimeout(() => {
      const active = document.activeElement;
      const tagName = active ? active.tagName : "NONE";
      const id = active?.id ? `#${active.id}` : "";
      const info = `BLUR (direbut: ${tagName}${id})`;
      console.log(`[FocusDebug] ${info}`);
      onFocusChange?.(info);
    }, 0);
  };

  return (
    <input
      ref={inputRef}
      id="city-full-input"
      type="text"
      inputMode="text"
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      tabIndex={0}
      aria-label="Ketik untuk menumbuhkan kota"
      className="fixed inset-0 z-10 h-full w-full opacity-0 pointer-events-auto bg-transparent caret-transparent text-base cursor-default select-none border-none outline-none focus:outline-none focus:ring-0"
      style={{
        WebkitTapHighlightColor: "transparent",
        fontSize: "16px", // Mencegah auto-zoom di iOS Safari
      }}
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
