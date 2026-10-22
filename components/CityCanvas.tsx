"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Building, CityAction, CityState } from "@/lib/city/types";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";
import { updateCity } from "@/lib/city/buildings";
import { drawGround, drawSky } from "@/lib/render/sky";
import { drawBuildings } from "@/lib/render/drawBuilding";
import HiddenInput from "@/components/HiddenInput";

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getDebugSnapshot() {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function getDebugServerSnapshot() {
  return false;
}

export default function CityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const cityStateRef = useRef<CityState>(createInitialCityState());
  const [debugAction, setDebugAction] = useState<string | null>(null);
  const [focusDebugInfo, setFocusDebugInfo] = useState<string>("Belum ada event fokus");
  const [buildingCount, setBuildingCount] = useState<number>(0);

  // Langganan ke URL query ?debug=1 menggunakan useSyncExternalStore
  const isDebug = useSyncExternalStore(
    subscribeToLocation,
    getDebugSnapshot,
    getDebugServerSnapshot
  );

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

      // Perbarui state kota di ref (tanpa re-render React)
      const nextState = cityReducer(cityStateRef.current, action);
      cityStateRef.current = nextState;

      // Log aksi di console
      console.log(`[CityInput] (${source})`, action);

      if (isDebug) {
        setBuildingCount(nextState.items.length);
        setDebugAction(
          `${action.type}${action.type === "TYPE_CHAR" ? ` ('${action.char}')` : ""} [${source}]`
        );
      }
    },
    [isDebug]
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

      // Set titik awal cursorX jika kota masih kosong
      if (cityStateRef.current.items.length === 0) {
        cityStateRef.current.cursorX = Math.max(40, Math.round(width * 0.1));
      }
    };

    const loop = (currentTime: number) => {
      const dt = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;

      // Update animasi tumbuh dan jendela menyala
      updateCity(cityStateRef.current, dt);

      const { width, height } = sizeRef.current;
      if (width > 0 && height > 0) {
        const groundY = height * 0.85;

        ctx.clearRect(0, 0, width, height);

        // 1. Gambar latar langit
        drawSky(ctx, width, height);

        // 2. Gambar gedung yang tumbuh
        const buildings = cityStateRef.current.items.filter(
          (item): item is Building => "windows" in item
        );
        drawBuildings(ctx, buildings, groundY, currentTime);

        // 3. Gambar dasar tanah
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
        className="fixed inset-0 h-full w-full block pointer-events-none"
        aria-label="Night City Typer interactive canvas"
      />
      <HiddenInput onAction={handleAction} onFocusChange={setFocusDebugInfo} />
      {isDebug && (
        <div className="fixed bottom-3 left-3 z-50 rounded bg-black/90 p-2.5 font-mono text-xs text-emerald-400 border border-emerald-800 pointer-events-none select-none max-w-sm space-y-1">
          <div>Aksi: {debugAction || "(belum ada)"}</div>
          <div>Fokus: {focusDebugInfo}</div>
          <div>Gedung: {buildingCount}</div>
          <div>
            ActiveElement:{" "}
            {typeof document !== "undefined"
              ? `${document.activeElement?.tagName || "NONE"}${
                  document.activeElement?.id ? `#${document.activeElement.id}` : ""
                }`
              : "-"}
          </div>
        </div>
      )}
    </>
  );
}
