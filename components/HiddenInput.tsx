"use client";

import { useEffect, useRef } from "react";
import type { CityAction } from "@/lib/city/types";

interface HiddenInputProps {
  onAction: (action: CityAction, source: "beforeinput" | "keydown") => void;
}

export default function HiddenInput({ onAction }: HiddenInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Fokuskan input saat pengguna menyentuh atau mengklik layar
    const handlePointerDown = () => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

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

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="text"
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      tabIndex={-1}
      aria-hidden="true"
      className="fixed top-0 left-0 h-px w-px opacity-0 pointer-events-none text-base"
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
    />
  );
}
