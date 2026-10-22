"use client";

import { useRef } from "react";
import type { CityAction } from "@/lib/city/types";
import { diffText } from "@/lib/input/diff";

export interface InputDebugInfo {
  inputType: string;
  isComposing: boolean;
  data: string;
  valueLength: number;
}

interface HiddenInputProps {
  onAction: (action: CityAction, source: "diff" | "window-keydown") => void;
  onFocusChange?: (info: string) => void;
  onDebugChange?: (info: InputDebugInfo) => void;
}

export default function HiddenInput({
  onAction,
  onFocusChange,
  onDebugChange,
}: HiddenInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prevValueRef = useRef<string>("");
  const isComposingRef = useRef<boolean>(false);
  const lastInputTypeRef = useRef<string>("-");
  const lastDataRef = useRef<string>("-");

  const notifyDebug = () => {
    onDebugChange?.({
      inputType: lastInputTypeRef.current,
      isComposing: isComposingRef.current,
      data: lastDataRef.current,
      valueLength: inputRef.current?.value.length ?? 0,
    });
  };

  const processDiff = () => {
    const nextValue = inputRef.current?.value ?? "";
    const prevValue = prevValueRef.current;
    if (nextValue === prevValue) {
      notifyDebug();
      return;
    }

    const { removed, added } = diffText(prevValue, nextValue);

    // 1. Dispatch BACKSPACE sebanyak karakter yang terhapus
    for (let i = 0; i < removed; i++) {
      onAction({ type: "BACKSPACE" }, "diff");
    }

    // 2. Dispatch karakter baru satu per satu
    for (const char of added) {
      if (char === " ") {
        onAction({ type: "SPACE" }, "diff");
      } else if (char === "\n" || char === "\r") {
        onAction({ type: "ENTER" }, "diff");
      } else {
        onAction({ type: "TYPE_CHAR", char }, "diff");
      }
    }

    prevValueRef.current = nextValue;

    // Reset hanya saat tidak sedang komposisi dan panjang teks melebihi 100 karakter
    if (!isComposingRef.current && nextValue.length > 100 && inputRef.current) {
      inputRef.current.value = "";
      prevValueRef.current = "";
    }

    notifyDebug();
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (nativeEvent) {
      lastInputTypeRef.current = nativeEvent.inputType || "beforeinput";
      lastDataRef.current = nativeEvent.data ?? "";

      // Enter diproses lewat beforeinput jika insertLineBreak atau insertParagraph
      if (
        nativeEvent.inputType === "insertLineBreak" ||
        nativeEvent.inputType === "insertParagraph"
      ) {
        e.preventDefault();
        onAction({ type: "ENTER" }, "diff");
        notifyDebug();
        return;
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (nativeEvent) {
      lastInputTypeRef.current = nativeEvent.inputType || lastInputTypeRef.current;
      lastDataRef.current = nativeEvent.data ?? lastDataRef.current;
    }
    processDiff();
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
    lastInputTypeRef.current = "compositionstart";
    notifyDebug();
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = true;
    lastInputTypeRef.current = "compositionupdate";
    lastDataRef.current = e.data || "";
    processDiff();
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    lastInputTypeRef.current = "compositionend";
    lastDataRef.current = e.data || "";
    processDiff();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lastInputTypeRef.current = "keydown-Enter";
      onAction({ type: "ENTER" }, "diff");
      notifyDebug();
    }
  };

  const handleFocus = () => {
    const active = document.activeElement;
    const tagName = active ? active.tagName : "INPUT";
    const id = active?.id ? `#${active.id}` : "";
    const info = `FOKUS (${tagName}${id})`;
    onFocusChange?.(info);
    notifyDebug();
  };

  const handleBlur = () => {
    setTimeout(() => {
      const active = document.activeElement;
      const tagName = active ? active.tagName : "NONE";
      const id = active?.id ? `#${active.id}` : "";
      const info = `BLUR (direbut: ${tagName}${id})`;
      onFocusChange?.(info);
      notifyDebug();
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
      spellCheck="false"
      enterKeyHint="done"
      tabIndex={0}
      aria-label="Ketik untuk membangun kota"
      className="fixed inset-0 z-10 h-full w-full opacity-0 pointer-events-auto bg-transparent caret-transparent text-base cursor-default select-none border-none outline-none focus:outline-none focus:ring-0"
      style={{
        WebkitTapHighlightColor: "transparent",
        fontSize: "16px", // Mencegah zoom otomatis iOS Safari
      }}
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionUpdate={handleCompositionUpdate}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
