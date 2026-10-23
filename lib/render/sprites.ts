/**
 * Pixel-art sprite rendering dan cache offscreen untuk Walkers (FR-16).
 * Dibuat sekali ke offscreen canvas, digambar dengan imageSmoothingEnabled = false.
 */

import { WALKER_SPRITE_PX } from "@/lib/city/config";
import type { Walker, WalkerKind } from "@/lib/city/walkers";

// 1. Matriks Piksel Manusia (~5x9 piksel)
// '1' = badan (#b8c4ff)
// '2' = garis cahaya tipis di tepi (#ffffff)
// '.' = transparan
const HUMAN_SPRITES: Record<string, string[]> = {
  idle: [
    ".212.",
    ".111.",
    "..1..",
    ".211.",
    ".211.",
    ".111.",
    ".1.1.",
    ".1.1.",
    ".1.1.",
  ],
  walk0: [
    ".212.",
    ".111.",
    "..1..",
    "2111.",
    ".211.",
    ".111.",
    ".1.1.",
    "1...1",
    "1...1",
  ],
  walk1: [
    ".212.",
    ".111.",
    "..1..",
    ".2112",
    ".211.",
    ".111.",
    "..1..",
    ".11..",
    ".1.1.",
  ],
};

// 2. Matriks Piksel Kucing (~9x6 piksel)
// '1' = bulu (#d9cfc0)
// 'E' = mata kuning (#ffd24a)
// '.' = transparan
const CAT_SPRITES: Record<string, string[]> = {
  idle: [
    ".....1.1.",
    "....1E1E1",
    "1..111111",
    ".1111111.",
    "..111111.",
    "..1.1.1.1",
  ],
  walk0: [
    ".....1.1.",
    "....1E1E1",
    "1..111111",
    ".1111111.",
    "..111111.",
    ".1..1..1.",
  ],
  walk1: [
    ".....1.1.",
    "....1E1E1",
    ".1.111111",
    "..1111111.",
    "..111111.",
    "...1.11..",
  ],
  sit: [
    "......1.1",
    ".....1E1E",
    ".....1111",
    "...111111",
    ".11111111",
    "111111111",
  ],
};

const HUMAN_COLORS: Record<string, string> = {
  "1": "#b8c4ff",
  "2": "#ffffff",
};

const CAT_COLORS: Record<string, string> = {
  "1": "#d9cfc0",
  E: "#ffd24a",
};

function renderToCanvas(
  lines: string[],
  colors: Record<string, string>,
  flipX: boolean
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;

  const h = lines.length;
  const w = lines[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (flipX) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  for (let y = 0; y < h; y++) {
    const row = lines[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      const color = colors[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas;
}

// Cache offscreen canvas untuk tiap (jenis, frame, arah)
let spriteCache: Map<string, HTMLCanvasElement> | null = null;

function initSpriteCache(): void {
  if (spriteCache || typeof document === "undefined") return;
  spriteCache = new Map();

  const dirs = [1, -1] as const;

  // Manusia
  for (const [frameKey, lines] of Object.entries(HUMAN_SPRITES)) {
    for (const dir of dirs) {
      const flipX = dir === -1;
      const cvs = renderToCanvas(lines, HUMAN_COLORS, flipX);
      if (cvs) spriteCache.set(`human_${frameKey}_${dir}`, cvs);
    }
  }

  // Kucing
  for (const [frameKey, lines] of Object.entries(CAT_SPRITES)) {
    for (const dir of dirs) {
      const flipX = dir === -1;
      const cvs = renderToCanvas(lines, CAT_COLORS, flipX);
      if (cvs) spriteCache.set(`cat_${frameKey}_${dir}`, cvs);
    }
  }
}

/**
 * Mengambil canvas sprite untuk jenis, frame, dan arah yang sesuai.
 */
export function getWalkerSpriteCanvas(
  kind: WalkerKind,
  frameName: string,
  dir: 1 | -1
): HTMLCanvasElement | null {
  if (!spriteCache) initSpriteCache();
  if (!spriteCache) return null;

  const key = `${kind}_${frameName}_${dir}`;
  return spriteCache.get(key) ?? null;
}

/**
 * Menghitung ukuran dimensi world (lebar, tinggi) untuk walker,
 * memastikan manusia memiliki tinggi minimum 10 CSS px di layar (termasuk di HP).
 */
export function getWalkerDimensions(
  kind: WalkerKind,
  worldScale: number
): { width: number; height: number; scale: number } {
  // Tinggi minimum manusia di HP = 10 CSS px
  const minHumanWorldHeight = 10 / Math.max(0.01, worldScale);
  const baseHumanWorldHeight = 9 * WALKER_SPRITE_PX;
  const effectiveHumanHeight = Math.max(baseHumanWorldHeight, minHumanWorldHeight);
  const scale = effectiveHumanHeight / 9;

  if (kind === "human") {
    return { width: 5 * scale, height: 9 * scale, scale };
  } else {
    return { width: 9 * scale, height: 6 * scale, scale };
  }
}

/**
 * Menentukan nama frame untuk sprite berdasarkan state walker.
 */
export function getWalkerFrameName(walker: Walker): string {
  if (walker.state === "walk") {
    return walker.frame === 1 ? "walk1" : "walk0";
  }
  if (walker.state === "sit" && walker.kind === "cat") {
    return "sit";
  }
  return "idle";
}
