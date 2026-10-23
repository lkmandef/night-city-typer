/**
 * Rendering tanah kota, trotoar, jalan, dan pantulan cahaya basah (FR-20).
 * Menggunakan createPattern offscreen canvas yang digeser mengikuti cameraX.
 * Catatan arsitektur: file ini hanya menggambar dan tidak mengubah state.
 */

import { currentConfig, SIDEWALK_H } from "@/lib/city/config";
import { getLetterColor } from "@/lib/city/palette";
import type { Building } from "@/lib/city/types";
import { type TimePalette, TIME_PALETTES } from "./sky";

// Cache canvas pola paving trotoar dan garis putus-putus jalan
let pavingCanvas: HTMLCanvasElement | null = null;
let roadDashCanvas: HTMLCanvasElement | null = null;

function initGroundPatterns(): void {
  if (typeof document === "undefined") return;

  // 1. Pola paving trotoar (lebar 28 px, tinggi 14 px)
  if (!pavingCanvas) {
    const c = document.createElement("canvas");
    c.width = 28;
    c.height = 14;
    const pctx = c.getContext("2d");
    if (pctx) {
      // Warna dasar trotoar sedikit lebih terang dari aspal
      pctx.fillStyle = "#12192c";
      pctx.fillRect(0, 0, 28, 14);

      // Garis paving tipis tiap 28 px (alpha 0.06)
      pctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      pctx.fillRect(0, 0, 1, 14);
    }
    pavingCanvas = c;
  }

  // 2. Pola garis jalan putus-putus (panjang 18 px, celah 18 px = total 36 px)
  if (!roadDashCanvas) {
    const c = document.createElement("canvas");
    c.width = 36;
    c.height = 2;
    const rctx = c.getContext("2d");
    if (rctx) {
      // Garis tengah putus-putus (alpha 0.35)
      rctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      rctx.fillRect(0, 0, 18, 2);
    }
    roadDashCanvas = c;
  }
}

export interface DrawGroundOptions {
  groundY?: number;
  worldScale?: number;
  cameraX?: number;
  reducedMotion?: boolean;
}

/**
 * Menggambar seluruh lapisan tanah dari atas ke bawah:
 * (a) Kabut tipis di horizon (16 px)
 * (b) Trotoar setinggi SIDEWALK_H dengan pola paving tipis dan curb
 * (c) Jalan bergradien sampai dasar canvas dengan garis tengah putus-putus
 */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette?: TimePalette,
  options?: DrawGroundOptions
): void {
  const p = palette ?? TIME_PALETTES[0];
  const groundY = options?.groundY ?? height * 0.85;
  const worldScale = options?.worldScale ?? 1.0;
  const cameraX = options?.cameraX ?? 0;
  const groundHeight = height - groundY;

  if (groundHeight <= 0 || width <= 0) return;

  // 1. Dasar tanah gelap (kompatibel dengan tes Vitest sky.test.ts)
  ctx.fillStyle = `rgb(${p.ground[0]}, ${p.ground[1]}, ${p.ground[2]})`;
  ctx.fillRect(0, groundY, width, groundHeight);

  // 2. Trotoar (Sidewalk)
  const sidewalkScreenH = Math.max(4, Math.round(SIDEWALK_H * worldScale));
  initGroundPatterns();

  if (pavingCanvas) {
    const pattern = ctx.createPattern(pavingCanvas, "repeat");
    if (pattern) {
      const shiftX = -(cameraX * worldScale) % 28;
      ctx.save();
      ctx.translate(shiftX, 0);
      ctx.fillStyle = pattern;
      ctx.fillRect(-shiftX, groundY, width + 56, sidewalkScreenH);
      ctx.restore();
    }
  }

  // 3. Garis tepi jalan (Curb) satu piksel di bawah trotoar
  ctx.fillStyle = currentConfig.CURB_COLOR;
  ctx.fillRect(0, groundY + sidewalkScreenH, width, 1);

  // 4. Jalan (Road) sampai dasar canvas dengan gradien ROAD_COLOR_TOP ke ROAD_COLOR_BOTTOM
  const roadStartY = groundY + sidewalkScreenH + 1;
  const roadHeight = height - roadStartY;

  if (roadHeight > 0) {
    const roadGrad = ctx.createLinearGradient(0, roadStartY, 0, height);
    roadGrad.addColorStop(0, currentConfig.ROAD_COLOR_TOP);
    roadGrad.addColorStop(1, currentConfig.ROAD_COLOR_BOTTOM);
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadStartY, width, roadHeight);

    // Garis tengah jalan putus-putus (alpha 0.35)
    if (roadDashCanvas && roadHeight > 8) {
      const dashPattern = ctx.createPattern(roadDashCanvas, "repeat");
      if (dashPattern) {
        const roadCenterY = Math.round(roadStartY + roadHeight * 0.45);
        const dashShiftX = -(cameraX * worldScale) % 36;
        ctx.save();
        ctx.translate(dashShiftX, 0);
        ctx.fillStyle = dashPattern;
        ctx.fillRect(-dashShiftX, roadCenterY, width + 72, 2);
        ctx.restore();
      }
    }
  }

  // 5. Kabut tipis di horizon (16 px) dari warna horizon langit (alpha 0.25) ke transparan
  const hazeH = currentConfig.GROUND_HAZE_H;
  const hazeGrad = ctx.createLinearGradient(0, groundY - hazeH, 0, groundY);
  hazeGrad.addColorStop(
    0,
    `rgba(${p.horizon2[0]}, ${p.horizon2[1]}, ${p.horizon2[2]}, 0)`
  );
  hazeGrad.addColorStop(
    1,
    `rgba(${p.horizon2[0]}, ${p.horizon2[1]}, ${p.horizon2[2]}, 0.25)`
  );
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, groundY - hazeH, width, hazeH);

  // Garis horizon tipis pemisah (kompatibel dengan tests/sky.test.ts)
  ctx.strokeStyle = `rgba(${p.groundLine[0]}, ${p.groundLine[1]}, ${p.groundLine[2]}, ${p.groundLine[3].toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();
}

/**
 * Menggambar kolam cahaya trotoar dan pantulan jalan basah:
 * - Dibuat SATU gradien per gedung (bukan per jendela).
 * - (a) Kolam cahaya hangat di trotoar di bawah podium (POOL_ALPHA).
 * - (b) Pantulan vertikal jalan basah (REFLECTION_ALPHA).
 * - (c) Pantulan tipis warna huruf untuk gedung berhuruf (alpha 0.08).
 * - Intensitas mengikuti suasana waktu (palette.windowLitFactor).
 */
export function drawReflectionsAndPools(
  ctx: CanvasRenderingContext2D,
  buildings: Building[],
  groundY: number,
  palette: TimePalette | undefined,
  cameraX: number,
  worldScreenWidth: number
): void {
  if (buildings.length === 0) return;

  const timeFactor = palette?.windowLitFactor ?? 1.0;
  if (timeFactor <= 0.05) return;

  const sidewalkH = SIDEWALK_H;
  const poolMaxAlpha = currentConfig.POOL_ALPHA * timeFactor;
  const reflectMaxAlpha = currentConfig.REFLECTION_ALPHA * timeFactor;

  for (const b of buildings) {
    if (b.grow < 0.3) continue;

    // Culling gedung di luar area layar
    if (b.x + b.width < cameraX || b.x > cameraX + worldScreenWidth) {
      continue;
    }

    const isWarm = b.dominantHue !== "cool";
    const rgb = isWarm ? "255, 185, 85" : "110, 200, 255";
    const midX = b.x + b.width / 2;

    // (a) Kolam cahaya di trotoar di bawah podium
    const poolGrad = ctx.createRadialGradient(
      midX,
      groundY + sidewalkH * 0.45,
      2,
      midX,
      groundY + sidewalkH * 0.45,
      b.width * 0.65
    );
    poolGrad.addColorStop(0, `rgba(${rgb}, ${poolMaxAlpha.toFixed(3)})`);
    poolGrad.addColorStop(0.6, `rgba(${rgb}, ${(poolMaxAlpha * 0.35).toFixed(3)})`);
    poolGrad.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.save();
    ctx.fillStyle = poolGrad;
    ctx.fillRect(b.x - 10, groundY, b.width + 20, sidewalkH);
    ctx.restore();

    // (b) Pantulan jalan basah (vertikal memudar ke bawah selebar gedung)
    const roadTopY = groundY + sidewalkH;
    const reflectHeight = Math.min(b.height * 0.55, 80);

    const reflectGrad = ctx.createLinearGradient(0, roadTopY, 0, roadTopY + reflectHeight);
    reflectGrad.addColorStop(0, `rgba(${rgb}, ${reflectMaxAlpha.toFixed(3)})`);
    reflectGrad.addColorStop(0.7, `rgba(${rgb}, ${(reflectMaxAlpha * 0.25).toFixed(3)})`);
    reflectGrad.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.save();
    ctx.fillStyle = reflectGrad;
    ctx.fillRect(b.x, roadTopY, b.width, reflectHeight);

    // (c) Pantulan tipis berwarna huruf untuk gedung berhuruf
    if (b.glyph && b.grow >= 1) {
      const letterHex = getLetterColor(currentConfig.letterColorId, b.id);
      const letterAlpha = 0.08 * timeFactor;

      // Konversi hex ke rgb sederhana
      let lr = 255, lg = 255, lb = 255;
      if (letterHex.startsWith("#") && letterHex.length === 7) {
        lr = parseInt(letterHex.slice(1, 3), 16);
        lg = parseInt(letterHex.slice(3, 5), 16);
        lb = parseInt(letterHex.slice(5, 7), 16);
      }

      const letterReflectGrad = ctx.createLinearGradient(
        0,
        roadTopY,
        0,
        roadTopY + reflectHeight * 0.8
      );
      letterReflectGrad.addColorStop(
        0,
        `rgba(${lr}, ${lg}, ${lb}, ${letterAlpha.toFixed(3)})`
      );
      letterReflectGrad.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0)`);

      const letterWidth = Math.min(b.width * 0.6, 35);
      ctx.fillStyle = letterReflectGrad;
      ctx.fillRect(midX - letterWidth / 2, roadTopY, letterWidth, reflectHeight * 0.8);
    }

    ctx.restore();
  }
}
