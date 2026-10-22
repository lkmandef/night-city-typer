"use client";

import { useState, useSyncExternalStore } from "react";
import {
  currentConfig,
  defaultConfig,
  resetConfig,
  subscribeConfig,
  updateConfig,
} from "@/lib/city/config";

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

export function isTuneRequested(search?: string): boolean {
  if (typeof search === "string") {
    return new URLSearchParams(search).get("tune") === "1";
  }
  if (typeof window === "undefined" || !window.location) return false;
  return new URLSearchParams(window.location.search).get("tune") === "1";
}

function getTuneSnapshot(): boolean {
  return isTuneRequested();
}

function getTuneServerSnapshot(): boolean {
  return false;
}

export default function TuningPanel() {
  const isTune = useSyncExternalStore(
    subscribeToLocation,
    getTuneSnapshot,
    getTuneServerSnapshot
  );

  const config = useSyncExternalStore(
    subscribeConfig,
    () => currentConfig,
    () => defaultConfig
  );

  const [copied, setCopied] = useState(false);

  if (!isTune) {
    return null;
  }

  const keepTypingFocus = () => {
    if (typeof document === "undefined") return;
    const typingInput =
      document.querySelector<HTMLInputElement>("input#hidden-typing-input") ||
      document.querySelector<HTMLInputElement>("input[type='text']");
    if (typingInput && document.activeElement !== typingInput) {
      typingInput.focus({ preventScroll: true });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback jika clipboard permission diblokir
    }
    keepTypingFocus();
  };

  const handleReset = () => {
    resetConfig();
    keepTypingFocus();
  };

  return (
    <aside
      aria-label="Panel Penyetel Visual"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onPointerUpCapture={keepTypingFocus}
      className="fixed top-3 right-3 z-50 flex max-h-[90vh] w-80 flex-col gap-2.5 overflow-y-auto rounded-xl border border-white/20 bg-slate-950/85 p-3.5 font-mono text-xs text-slate-100 shadow-2xl backdrop-blur-md select-none"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="font-semibold text-emerald-400">Night City Tuner</span>
        <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] text-emerald-300 border border-emerald-700/50">
          ?tune=1
        </span>
      </div>

      <div className="space-y-3 pr-1">
        {/* Rasio Jendela Menyala */}
        <section className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Rasio Jendela Menyala
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Fasad (OTHER_LIT):</span>
              <span className="text-emerald-400">{config.OTHER_LIT_RATIO.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.OTHER_LIT_RATIO}
              onChange={(e) => {
                updateConfig({ OTHER_LIT_RATIO: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Zona Huruf (ZONE_LIT):</span>
              <span className="text-emerald-400">{config.ZONE_LIT_RATIO.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.ZONE_LIT_RATIO}
              onChange={(e) => {
                updateConfig({ ZONE_LIT_RATIO: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>
        </section>

        {/* Kecerahan Jendela */}
        <section className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Kecerahan Jendela
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Fasad Min:</span>
              <span className="text-emerald-400">{config.BG_BRIGHTNESS_MIN.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={config.BG_BRIGHTNESS_MIN}
              onChange={(e) => {
                updateConfig({ BG_BRIGHTNESS_MIN: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Fasad Max:</span>
              <span className="text-emerald-400">{config.BG_BRIGHTNESS_MAX.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={config.BG_BRIGHTNESS_MAX}
              onChange={(e) => {
                updateConfig({ BG_BRIGHTNESS_MAX: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Zona Huruf Min:</span>
              <span className="text-emerald-400">{config.ZONE_BRIGHTNESS_MIN.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={config.ZONE_BRIGHTNESS_MIN}
              onChange={(e) => {
                updateConfig({ ZONE_BRIGHTNESS_MIN: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Zona Huruf Max:</span>
              <span className="text-emerald-400">{config.ZONE_BRIGHTNESS_MAX.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={config.ZONE_BRIGHTNESS_MAX}
              onChange={(e) => {
                updateConfig({ ZONE_BRIGHTNESS_MAX: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Halo (HALO_BRIGHTNESS):</span>
              <span className="text-emerald-400">{config.HALO_BRIGHTNESS.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.HALO_BRIGHTNESS}
              onChange={(e) => {
                updateConfig({ HALO_BRIGHTNESS: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>
        </section>

        {/* Warna & Glow Huruf */}
        <section className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Huruf & Glow
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Warna Huruf:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={config.LETTER_COLOR}
                onChange={(e) => {
                  updateConfig({ LETTER_COLOR: e.target.value });
                  keepTypingFocus();
                }}
                className="h-6 w-8 cursor-pointer rounded border border-white/30 bg-transparent p-0"
              />
              <span className="text-[11px] text-slate-300">{config.LETTER_COLOR}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Glow Opacity:</span>
              <span className="text-emerald-400">{config.LETTER_GLOW_OPACITY.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.6"
              step="0.02"
              value={config.LETTER_GLOW_OPACITY}
              onChange={(e) => {
                updateConfig({ LETTER_GLOW_OPACITY: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Warna Dominan Gedung:</span>
              <span className="text-emerald-400">{(config.DOMINANT_COLOR_RATIO * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={config.DOMINANT_COLOR_RATIO}
              onChange={(e) => {
                updateConfig({ DOMINANT_COLOR_RATIO: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Warna Minor (Maks 2%):</span>
              <span className="text-emerald-400">{(config.ACCENT_COLOR_RATIO * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.02"
              step="0.005"
              value={config.ACCENT_COLOR_RATIO}
              onChange={(e) => {
                updateConfig({ ACCENT_COLOR_RATIO: parseFloat(e.target.value) });
                keepTypingFocus();
              }}
              className="accent-emerald-400 h-1.5 cursor-pointer bg-slate-800 rounded"
            />
          </div>
        </section>

        {/* Bobot Kolom Lebar Gedung */}
        <section className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Bobot Kolom Gedung (5 / 7 Kolom)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center rounded bg-slate-900 p-1.5 border border-white/5">
              <span className="text-[10px] text-slate-400">5 Kolom (65%)</span>
              <span className="text-emerald-400 font-bold">{config.COL_WEIGHTS[5]}</span>
              <input
                type="range"
                min="0.2"
                max="0.9"
                step="0.05"
                value={config.COL_WEIGHTS[5]}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateConfig({
                    COL_WEIGHTS: { 5: val, 7: parseFloat((1 - val).toFixed(2)) },
                  });
                  keepTypingFocus();
                }}
                className="w-full accent-emerald-400 h-1 mt-1 cursor-pointer"
              />
            </div>
            <div className="flex flex-col items-center rounded bg-slate-900 p-1.5 border border-white/5">
              <span className="text-[10px] text-slate-400">7 Kolom (35%)</span>
              <span className="text-emerald-400 font-bold">{config.COL_WEIGHTS[7]}</span>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={config.COL_WEIGHTS[7]}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateConfig({
                    COL_WEIGHTS: { 5: parseFloat((1 - val).toFixed(2)), 7: val },
                  });
                  keepTypingFocus();
                }}
                className="w-full accent-emerald-400 h-1 mt-1 cursor-pointer"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCopy}
          className="flex-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-center font-semibold text-white transition hover:bg-emerald-500 active:scale-95"
        >
          {copied ? "✓ Tersalin!" : "Salin nilai"}
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleReset}
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
