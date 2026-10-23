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
import { interpolatePalette, moonPosition, type MoonPosition, TIME_PALETTES } from "@/lib/render/sky";
import { exportCanvasToPng } from "@/lib/render/exportPng";
import { easeInOutCubic } from "@/lib/utils/easing";
import {
  loadSavedLetterColor,
  saveLetterColor,
  subscribeLetterColor,
} from "@/lib/city/palette";
import { updateConfig } from "@/lib/city/config";
import { computeGroups, type BuildingGroup } from "@/lib/city/groups";
import { computeAdaptiveGround } from "@/lib/city/ground";
import { updateWalkers, type Walker } from "@/lib/city/walkers";
import { buildTypedText, computeOverviewZoom } from "@/lib/city/text";
import TypedTextOverlay from "@/components/TypedTextOverlay";
import HiddenInput, { type InputDebugInfo } from "@/components/HiddenInput";
import TuningPanel from "@/components/TuningPanel";
import HintOverlay from "@/components/HintOverlay";
import Toolbar from "@/components/Toolbar";

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
  const walkersRef = useRef<Walker[]>([]);
  const groupsRef = useRef<BuildingGroup[]>([]);
  const reducedMotionRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);
  const fpsRef = useRef(60);

  // Posisi bulan halus dan tracking selisih frame
  const moonTimeRef = useRef(0);
  const moonPosRef = useRef<MoonPosition | null>(null);
  const moonDeltaHistoryRef = useRef<{ time: number; delta: number }[]>([]);
  const maxMoonDelta5sRef = useRef<number>(0);

  const [isCityEmpty, setIsCityEmpty] = useState(true);
  const wasEmptyRef = useRef(true);
  const [timePhaseName, setTimePhaseName] = useState("Malam");
  const [walkerCount, setWalkerCount] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>("");
  const [isOverviewMode, setIsOverviewMode] = useState(false);
  const isOverviewModeRef = useRef(false);
  const currentZoomRef = useRef(1);
  const targetZoomRef = useRef(1);

  // Baca preferensi warna via useSyncExternalStore (client-side murni, bebas hydration mismatch)
  const selectedColorId = useSyncExternalStore(
    subscribeLetterColor,
    () => loadSavedLetterColor(),
    () => "putih"
  );

  // Sinkronkan ke runtime config saat selectedColorId berubah
  useEffect(() => {
    updateConfig({ letterColorId: selectedColorId });
  }, [selectedColorId]);

  // Pantau preferensi reduced motion dari sistem operasi
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener?.("change", handler);
    return () => {
      mq.removeEventListener?.("change", handler);
    };
  }, []);

  const timeTransitionRef = useRef({
    fromPhase: 0,
    toPhase: 0,
    progress: 1,
    duration: 1200,
  });

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

      // Update string teks yang diketik untuk overlay
      setTypedText(buildTypedText(nextState.items));

      // Mengetik atau aksi tombol apapun mengembalikan kamera dari mode ringkasan ke fokus gedung
      if (
        (action.type === "TYPE_CHAR" ||
          action.type === "SPACE" ||
          action.type === "BACKSPACE" ||
          action.type === "RESET") &&
        isOverviewModeRef.current
      ) {
        isOverviewModeRef.current = false;
        setIsOverviewMode(false);
      }

      // Tangani aksi RESET: buat semua walker exit cepat (300 ms)
      if (action.type === "RESET") {
        for (const w of walkersRef.current) {
          w.state = "exit";
          w.stateTimer = 0.3;
          w.exitDuration = 0.3;
        }
      }

      // Tangani transisi waktu saat aksi ENTER
      if (action.type === "ENTER") {
        timeTransitionRef.current = {
          fromPhase: timeTransitionRef.current.toPhase,
          toPhase: nextState.timeOfDay,
          progress: 0,
          duration: 1200,
        };
        setTimePhaseName(TIME_PALETTES[nextState.timeOfDay].phaseName);
      }

      // Langsung sembunyikan petunjuk saat ada karakter baru
      if (
        (action.type === "TYPE_CHAR" || action.type === "SPACE") &&
        wasEmptyRef.current
      ) {
        wasEmptyRef.current = false;
        setIsCityEmpty(false);
      }

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

  const handleSavePng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportCanvasToPng(canvas);
  }, []);

  const handleReset = useCallback(() => {
    handleAction({ type: "RESET" }, "diff");
    if (typeof document !== "undefined") {
      document.getElementById("city-full-input")?.focus();
    }
  }, [handleAction]);

  const handleEnter = useCallback(() => {
    handleAction({ type: "ENTER" }, "diff");
    if (typeof document !== "undefined") {
      document.getElementById("city-full-input")?.focus();
    }
  }, [handleAction]);

  const handleSelectColor = useCallback((colorId: string) => {
    saveLetterColor(colorId);
    updateConfig({ letterColorId: colorId });
    if (typeof document !== "undefined") {
      document.getElementById("city-full-input")?.focus();
    }
  }, []);

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

      const worldScale = computeWorldScale(width);
      const { groundY } = computeAdaptiveGround(height, worldScale);
      parallaxRef.current.setup(groundY);

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
      const baseWorldScale = computeWorldScale(width);
      const items = cityStateRef.current.items;

      // Hitung rentang kota untuk mode tinjauan (Overview Mode FR-19)
      const firstX = items.length > 0 ? items[0].x : 60;
      const lastX = items.length > 0 ? items[items.length - 1].x + items[items.length - 1].width : 60;
      const totalCityWidth = Math.max(1, lastX - firstX);
      const cityCenterX = firstX + totalCityWidth / 2;

      if (isOverviewModeRef.current && items.length > 0) {
        const { zoomFactor } = computeOverviewZoom(totalCityWidth, width, baseWorldScale);
        targetZoomRef.current = zoomFactor;
      } else {
        targetZoomRef.current = 1.0;
      }

      // Transisi zoom halus ~400 ms
      const zoomEase = 1 - Math.exp(-dt / 80);
      currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * zoomEase;

      const effectiveScale = baseWorldScale * currentZoomRef.current;
      const worldScreenWidth = width > 0 ? width / effectiveScale : 1;

      // 1. Update target dan lerp kamera (berpusat di tengah kota jika mode tinjauan, atau ikuti gedung terbaru)
      let targetX: number;
      if (isOverviewModeRef.current && items.length > 0) {
        targetX = cityCenterX - worldScreenWidth / 2;
      } else {
        targetX = computeCameraTarget(cityStateRef.current.cursorX, worldScreenWidth);
      }

      cityStateRef.current.cameraTarget = targetX;
      cityStateRef.current.cameraX = updateCamera(
        cityStateRef.current.cameraX,
        targetX,
        dt
      );

      // 2. Update animasi tumbuh, jendela, pemisah, dan penghapusan item runtuh
      const initialX = Math.round(worldScreenWidth * 0.15);
      updateCity(cityStateRef.current, dt, initialX);

      // 2b. Update kelompok gedung dan karakter berjalan (Walkers FR-16)
      const groups = computeGroups(cityStateRef.current.items);
      groupsRef.current = groups;
      walkersRef.current = updateWalkers(
        walkersRef.current,
        groups,
        dt,
        cityStateRef.current.seed,
        reducedMotionRef.current
      );

      // Hitung FPS untuk debug monitor
      frameCountRef.current++;
      const nowTime = performance.now();
      if (lastFpsTimeRef.current === 0) {
        lastFpsTimeRef.current = nowTime;
      } else if (nowTime - lastFpsTimeRef.current >= 500) {
        fpsRef.current = Math.round(
          (frameCountRef.current * 1000) / (nowTime - lastFpsTimeRef.current)
        );
        frameCountRef.current = 0;
        lastFpsTimeRef.current = nowTime;
      }

      // Periksa apakah kota kosong untuk menampilkan kembali HintOverlay
      const empty = cityStateRef.current.items.length === 0;
      if (empty !== wasEmptyRef.current) {
        wasEmptyRef.current = empty;
        setIsCityEmpty(empty);
      }

      // Update progres transisi suasana waktu (malam, dini hari, fajar)
      if (timeTransitionRef.current.progress < 1) {
        timeTransitionRef.current.progress = Math.min(
          1,
          timeTransitionRef.current.progress + dt / timeTransitionRef.current.duration
        );
      }
      const easeT = easeInOutCubic(timeTransitionRef.current.progress);
      const currentPalette = interpolatePalette(
        timeTransitionRef.current.fromPhase,
        timeTransitionRef.current.toPhase,
        easeT
      );

      if (width > 0 && height > 0) {
        const { groundY, showDecorations } = computeAdaptiveGround(height, effectiveScale);
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

        // Filter ghosts yang terlihat di layar
        const allGhostSeparators = (cityStateRef.current.ghosts ?? []).filter(
          (item): item is Separator => "progress" in item
        );
        const visibleGhostSeparators = allGhostSeparators.filter((s) =>
          isItemVisible(s.x, s.width, cameraX, worldScreenWidth)
        );

        const allGhostBuildings = (cityStateRef.current.ghosts ?? []).filter(
          (item): item is Building => "windows" in item
        );
        const visibleGhostBuildings = allGhostBuildings.filter((b) =>
          isItemVisible(b.x, b.width, cameraX, worldScreenWidth)
        );

        // Posisi bulan: mengejar target dengan interpolasi halus (lerp 0.1 per frame) saat ukuran kanvas berubah
        const clampedMoonDt = Math.min(50, Math.max(0, dt));
        moonTimeRef.current += clampedMoonDt;

        const targetMoon = moonPosition(width, height, moonTimeRef.current);
        if (!moonPosRef.current) {
          moonPosRef.current = { ...targetMoon };
        } else {
          const prevX = moonPosRef.current.x;
          const prevY = moonPosRef.current.y;
          const lerpFactor = 0.1;
          moonPosRef.current.x = prevX + (targetMoon.x - prevX) * lerpFactor;
          moonPosRef.current.y = prevY + (targetMoon.y - prevY) * lerpFactor;
          moonPosRef.current.radius = targetMoon.radius;

          const frameDelta = Math.hypot(
            moonPosRef.current.x - prevX,
            moonPosRef.current.y - prevY
          );
          moonDeltaHistoryRef.current.push({ time: currentTime, delta: frameDelta });
          const cutoff = currentTime - 5000;
          while (
            moonDeltaHistoryRef.current.length > 0 &&
            moonDeltaHistoryRef.current[0].time < cutoff
          ) {
            moonDeltaHistoryRef.current.shift();
          }
          let maxD = 0;
          for (const item of moonDeltaHistoryRef.current) {
            if (item.delta > maxD) maxD = item.delta;
          }
          maxMoonDelta5sRef.current = maxD;
        }

        // 3. Render pemandangan lengkap melalui pipeline
        renderScene({
          ctx,
          width,
          height,
          groundY,
          worldScale: effectiveScale,
          cameraX: cityStateRef.current.cameraX,
          stars: starsRef.current,
          parallax: parallaxRef.current,
          visibleSeparators,
          visibleBuildings,
          visibleGhostSeparators,
          visibleGhostBuildings,
          time: currentTime,
          palette: currentPalette,
          walkers: walkersRef.current,
          groups: groupsRef.current,
          moonPos: moonPosRef.current ?? undefined,
          showDecorations,
          reducedMotion: reducedMotionRef.current,
          seed: cityStateRef.current.seed,
        });

        // Debug info update
        if (isDebug && Math.floor(currentTime) % 10 === 0) {
          setWalkerCount(walkersRef.current.length);
          setCameraDebugInfo(
            `FPS: ${fpsRef.current} | Bulan Δmax: ${maxMoonDelta5sRef.current.toFixed(2)}px | Cam: ${Math.round(cityStateRef.current.cameraX)} | Skala: ${effectiveScale.toFixed(2)} | Vis: ${visibleBuildings.length}/${allBuildings.length} | Walkers: ${walkersRef.current.length} (${groups.length} grp) | Waktu: ${currentPalette.phaseName}`
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
      <HintOverlay visible={isCityEmpty} />
      <TypedTextOverlay text={typedText} />
      <Toolbar
        onSavePng={handleSavePng}
        onReset={handleReset}
        onEnter={handleEnter}
        timePhaseName={timePhaseName}
        selectedColorId={selectedColorId}
        onSelectColor={handleSelectColor}
        isOverviewMode={isOverviewMode}
        onToggleOverview={() => {
          setIsOverviewMode((prev) => {
            const next = !prev;
            isOverviewModeRef.current = next;
            return next;
          });
        }}
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
          <div>Gedung: {buildingCount} | Walkers: {walkerCount}</div>
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
