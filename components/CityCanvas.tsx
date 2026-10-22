"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Building, CityAction, CityState, Separator } from "@/lib/city/types";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";
import { updateCity } from "@/lib/city/buildings";
import {
  computeCameraTarget,
  computeWorldScale,
  isItemVisible,
  updateCamera,
} from "@/lib/city/camera";
import { generateStars } from "@/lib/render/stars";
import { createParallaxRenderer } from "@/lib/render/parallax";
import { renderScene } from "@/lib/render/pipeline";
import HiddenInput, { type InputDebugInfo } from "@/components/HiddenInput";
import TuningPanel from "@/components/TuningPanel";

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
  const starsRef = useRef(generateStars(140, 8888));
  const parallaxRef = useRef(createParallaxRenderer());

  const [debugAction, setDebugAction] = useState<string | null>(null);
  const [lastActionSource, setLastActionSource] = useState<string>("-");
  const [inputDebug, setInputDebug] = useState<InputDebugInfo>({
    inputType: "-",
    isComposing: false,
    data: "-",
    valueLength: 0,
  });
  const [focusDebugInfo, setFocusDebugInfo] = useState<string>("Belum ada event fokus");
  const [buildingCount, setBuildingCount] = useState<number>(0);
  const [cameraDebugInfo, setCameraDebugInfo] = useState<string>("");

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
    (
      action: CityAction,
      source: "diff" | "window-keydown" | "keydown" | "beforeinput"
    ) => {
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
        setLastActionSource(source);
        setDebugAction(
          `${action.type}${action.type === "TYPE_CHAR" ? ` ('${action.char}')` : ""}`
        );
      }
    },
    [isDebug]
  );

  // Tangani event keyboard desktop (diabaikan jika HiddenInput sedang fokus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika modifier ditekan
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Handler keydown di window harus diabaikan jika document.activeElement adalah HiddenInput
      const active = document.activeElement;
      if (active && (active.id === "city-full-input" || active.tagName === "INPUT")) {
        return;
      }

      if (e.key === "Backspace") {
        handleAction({ type: "BACKSPACE" }, "window-keydown");
      } else if (e.key === " ") {
        e.preventDefault();
        handleAction({ type: "SPACE" }, "window-keydown");
      } else if (e.key === "Enter") {
        handleAction({ type: "ENTER" }, "window-keydown");
      } else if (e.key.length === 1) {
        handleAction({ type: "TYPE_CHAR", char: e.key }, "window-keydown");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleAction]);

  // Setup canvas, game loop, kamera, dan skala dunia responsif
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

      const groundY = height * 0.85;
      parallaxRef.current.setup(groundY);

      const worldScale = computeWorldScale(width);
      const worldScreenWidth = width / worldScale;

      // Set titik awal kota (sekitar 15% lebar layar) jika kota masih kosong
      if (cityStateRef.current.items.length === 0) {
        cityStateRef.current.cursorX = Math.round(worldScreenWidth * 0.15);
      } else {
        // Hitung ulang target kamera saat resize tanpa menghapus kota
        const targetX = computeCameraTarget(cityStateRef.current.cursorX, worldScreenWidth);
        cityStateRef.current.cameraTarget = targetX;
        cityStateRef.current.cameraX = targetX;
      }
    };

    const loop = (currentTime: number) => {
      const dt = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;

      const { width, height } = sizeRef.current;
      const worldScale = computeWorldScale(width);
      const worldScreenWidth = width > 0 ? width / worldScale : 1;

      // 1. Update target dan lerp kamera mengikuti gedung terbaru
      const targetX = computeCameraTarget(cityStateRef.current.cursorX, worldScreenWidth);
      cityStateRef.current.cameraTarget = targetX;
      cityStateRef.current.cameraX = updateCamera(
        cityStateRef.current.cameraX,
        targetX,
        dt
      );

      // 2. Update animasi tumbuh, jendela, pemisah, dan penghapusan item runtuh
      const initialX = Math.round(worldScreenWidth * 0.15);
      updateCity(cityStateRef.current, dt, initialX);

      if (width > 0 && height > 0) {
        const groundY = height * 0.85;
        const cameraX = cityStateRef.current.cameraX;

        ctx.clearRect(0, 0, width, height);

        // Culling: hanya gambar pemisah dan gedung yang terlihat di area kamera
        const allSeparators = cityStateRef.current.items.filter(
          (item): item is Separator => "progress" in item
        );
        const visibleSeparators = allSeparators.filter((s) =>
          isItemVisible(s.x, s.width, cameraX, worldScreenWidth)
        );

        const allBuildings = cityStateRef.current.items.filter(
          (item): item is Building => "windows" in item
        );
        const visibleBuildings = allBuildings.filter((b) =>
          isItemVisible(b.x, b.width, cameraX, worldScreenWidth)
        );

        // 3. Render pemandangan lengkap melalui pipeline
        renderScene({
          ctx,
          width,
          height,
          groundY,
          worldScale,
          cameraX,
          stars: starsRef.current,
          parallax: parallaxRef.current,
          visibleSeparators,
          visibleBuildings,
          time: currentTime,
        });

        // Debug info update
        if (isDebug && Math.floor(currentTime) % 10 === 0) {
          setCameraDebugInfo(
            `Cam: ${Math.round(cameraX)} | Skala: ${worldScale.toFixed(2)} | Vis: ${visibleBuildings.length}/${allBuildings.length}`
          );
        }
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
  }, [isDebug]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full block pointer-events-none"
        aria-label="Night City Typer interactive canvas"
      />
      <HiddenInput
        onAction={handleAction}
        onFocusChange={setFocusDebugInfo}
        onDebugChange={setInputDebug}
      />
      <TuningPanel />
      {isDebug && (
        <div className="fixed bottom-3 left-3 z-50 rounded bg-black/90 p-2.5 font-mono text-xs text-emerald-400 border border-emerald-800 pointer-events-none select-none max-w-sm space-y-1">
          <div>
            Aksi: {debugAction || "(belum ada)"} [{lastActionSource}]
          </div>
          <div>
            Input: type={inputDebug.inputType} | comp={String(inputDebug.isComposing)} | data=&quot;{inputDebug.data}&quot; | len={inputDebug.valueLength}
          </div>
          <div>Fokus: {focusDebugInfo}</div>
          <div>Gedung: {buildingCount}</div>
          <div>{cameraDebugInfo || "Memuat info kamera..."}</div>
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
