"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CityAction } from "@/lib/city/types";
import { drawGround, drawSky } from "@/lib/render/sky";
import HiddenInput from "@/components/HiddenInput";

export default function CityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const [debugAction, setDebugAction] = useState<string | null>(null);

  // Pelacak aksi terakhir untuk mencegah duplikasi (desktop keydown vs mobile beforeinput)
  const lastActionRef = useRef<{ key: string; source: string; time: number }>({
    key: "",
    source: "",
    time: 0,
  });

  const handleAction = useCallback(
    (action: CityAction, source: "keydown" | "beforeinput") => {
      const now = performance.now();
      const actionKey =
        action.type === "TYPE_CHAR" ? `CHAR_${action.char}` : action.type;

      // Cegah duplikasi jika aksi yang sama datang dari sumber berbeda dalam 100ms
      if (
        lastActionRef.current.key === actionKey &&
        lastActionRef.current.source !== source &&
        now - lastActionRef.current.time < 100
      ) {
        return;
      }

      lastActionRef.current = { key: actionKey, source, time: now };

      // Log aksi di console
      console.log(`[CityInput] (${source})`, action);

      if (process.env.NODE_ENV !== "production") {
        setDebugAction(
          `${action.type}${action.type === "TYPE_CHAR" ? ` ('${action.char}')` : ""} [${source}]`
        );
      }
    },
    []
  );

  // Tangani event keyboard desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika modifier ditekan
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if (e.key === "Backspace") {
        handleAction({ type: "BACKSPACE" }, "keydown");
      } else if (e.key === " ") {
        e.preventDefault();
        handleAction({ type: "SPACE" }, "keydown");
      } else if (e.key === "Enter") {
        handleAction({ type: "ENTER" }, "keydown");
      } else if (e.key.length === 1) {
        handleAction({ type: "TYPE_CHAR", char: e.key }, "keydown");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleAction]);

  // Setup canvas dan game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      sizeRef.current = { width, height, dpr };
    };

    const loop = (currentTime: number) => {
      const _dt = Math.min(50, currentTime - lastTime);
      void _dt;
      lastTime = currentTime;

      const { width, height } = sizeRef.current;
      if (width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);
        drawSky(ctx, width, height);
        drawGround(ctx, width, height);
      }

      rafId = requestAnimationFrame(loop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full block touch-none"
        aria-label="Night City Typer interactive canvas"
      />
      <HiddenInput onAction={handleAction} />
      {process.env.NODE_ENV !== "production" && debugAction && (
        <div className="fixed bottom-3 left-3 z-50 rounded bg-black/80 px-2.5 py-1 font-mono text-xs text-emerald-400 border border-emerald-900 pointer-events-none select-none">
          Aksi terakhir: {debugAction}
        </div>
      )}
    </>
  );
}
