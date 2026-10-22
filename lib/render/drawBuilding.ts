import type { Building } from "@/lib/city/types";
import { easeOutCubic } from "@/lib/utils/easing";
import { LETTER_BASELINE, LETTER_CELL } from "@/lib/city/buildings";

// ==========================================
// Konstanta Visual Zona Huruf & Jendela
// ==========================================
export const LETTER_COLOR = "#fff3c4"; // Warna huruf lebih terang dari jendela mana pun
export const LETTER_PANEL_COLOR = "#0a0e1c"; // Panel dinding lebih gelap agar huruf tampak seperti papan
export const LETTER_UNLIT_DOT_COLOR = "rgba(20, 26, 46, 0.7)"; // Jendela padam dalam zona huruf
export const LETTER_DIM_WINDOW_COLOR = "rgba(200, 160, 90, 0.42)"; // Jendela di luar zona huruf redup (kecerahan 0.35 - 0.5)

/**
 * Menggambar satu gedung dengan animasi tumbuh, antena tower, jendela menyala,
 * glow radial halus per gedung, goyangan horizontal saat runtuh, dan partikel debu.
 */
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  building: Building,
  groundY: number,
  time: number
): void {
  // Hitung tinggi saat ini berdasarkan fase tumbuh atau runtuh
  let currentHeight = building.height * easeOutCubic(building.grow);
  if (building.state === "collapsing") {
    currentHeight = building.height * (1 - easeOutCubic(building.collapse));
  }

  if (currentHeight <= 0.5) return;

  // Goyangan horizontal halus (maksimal 2 px) saat runtuh
  const jitterX =
    building.state === "collapsing" && building.collapse > 0 && building.collapse < 1
      ? Math.sin(time / 15 + building.id * 10) * 2 * (1 - building.collapse)
      : 0;

  const drawX = building.x + jitterX;
  const topY = groundY - currentHeight;

  // Jika gedung berstatus siluet (melewati batas 200 item), gambar siluet sederhana tanpa jendela
  if (building.isSilhouette) {
    ctx.fillStyle = "#0c1020";
    ctx.fillRect(drawX, topY, building.width, currentHeight);
    ctx.strokeStyle = "rgba(35, 45, 75, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(drawX, topY, building.width, currentHeight);
    return;
  }

  // 1. Glow halus per gedung (satu radial gradient overlay, efisien tanpa shadowBlur)
  const hasLitWindows = building.windows.some((w) => w.lit);
  if (hasLitWindows && currentHeight > 10) {
    const isGlyphBuilding = Boolean(building.glyph);
    const glowCenterX = Math.round(drawX + building.width / 2);
    const glowCenterY = isGlyphBuilding
      ? Math.round(groundY - (LETTER_BASELINE + 3.5 * LETTER_CELL))
      : Math.round(topY + currentHeight * 0.55);
    const glowRadius = isGlyphBuilding
      ? Math.round(LETTER_CELL * 4.5)
      : Math.round(Math.max(building.width * 1.3, currentHeight * 0.75));

    const glowFade =
      building.state === "collapsing"
        ? 1 - building.collapse
        : Math.min(1, building.grow);

    if (glowCenterY >= topY - 10) {
      const buildingGlow = ctx.createRadialGradient(
        glowCenterX,
        glowCenterY,
        4,
        glowCenterX,
        glowCenterY,
        glowRadius
      );
      if (isGlyphBuilding) {
        buildingGlow.addColorStop(0, `rgba(255, 243, 196, ${0.24 * glowFade})`);
        buildingGlow.addColorStop(0.5, `rgba(255, 215, 120, ${0.07 * glowFade})`);
        buildingGlow.addColorStop(1, "rgba(255, 200, 100, 0)");
      } else {
        buildingGlow.addColorStop(0, `rgba(255, 215, 130, ${0.14 * glowFade})`);
        buildingGlow.addColorStop(0.5, `rgba(255, 185, 90, ${0.04 * glowFade})`);
        buildingGlow.addColorStop(1, "rgba(255, 185, 90, 0)");
      }

      ctx.fillStyle = buildingGlow;
      ctx.fillRect(
        glowCenterX - glowRadius,
        glowCenterY - glowRadius,
        glowRadius * 2,
        glowRadius * 2
      );
    }
  }

  // 2. Badan gedung: persegi panjang gelap (#11172e)
  ctx.fillStyle = "#11172e";
  ctx.fillRect(drawX, topY, building.width, currentHeight);

  // Stroke tepi gedung untuk siluet yang tegas
  ctx.strokeStyle = "rgba(42, 54, 88, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(drawX, topY, building.width, currentHeight);

  // 3. Tower aksen: Antena dan lampu merah berkedip (hanya saat belum runtuh)
  if (building.kind === "tower" && building.collapse < 0.3) {
    const antennaX = Math.round(drawX + building.width / 2);
    const antennaScale = (1 - building.collapse / 0.3) * easeOutCubic(building.grow);
    const antennaHeight = 22 * antennaScale;
    const antennaTipY = topY - antennaHeight;

    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(antennaX, topY);
    ctx.lineTo(antennaX, antennaTipY);
    ctx.stroke();

    // Lampu merah berkedip di puncak antena
    const isBlinking = Math.sin(time / 200) > 0;
    if (isBlinking && building.grow > 0.8 && building.state !== "collapsing") {
      ctx.fillStyle = "rgba(255, 77, 109, 0.4)";
      ctx.beginPath();
      ctx.arc(antennaX, antennaTipY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff4d6d";
      ctx.beginPath();
      ctx.arc(antennaX, antennaTipY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Jendela & Zona Huruf
  type Rect = { x: number; y: number; w: number; h: number };

  const fillRects = (rects: Rect[], fillStyle: string) => {
    if (rects.length === 0) return;
    ctx.beginPath();
    for (const r of rects) {
      ctx.rect(r.x, r.y, r.w, r.h);
    }
    ctx.fillStyle = fillStyle;
    ctx.fill();
  };

  if (building.glyph) {
    // ----------------------------------------------------
    // A. Gedung Berhuruf: Panel papan gelap + sel persegi
    // ----------------------------------------------------
    const panelW = 5 * LETTER_CELL + 4; // 59 px
    const panelH = 7 * LETTER_CELL + 4; // 81 px
    const panelX = Math.round(drawX + (building.width - panelW) / 2);
    const panelY = Math.round(groundY - (LETTER_BASELINE + 7 * LETTER_CELL) - 2);

    // Gambar panel dinding gelap (#0a0e1c) jika gedung sudah tumbuh menutupinya
    const visiblePanelTop = Math.max(topY, panelY);
    const visiblePanelBottom = Math.min(groundY, panelY + panelH);
    if (visiblePanelBottom > visiblePanelTop) {
      ctx.fillStyle = LETTER_PANEL_COLOR;
      ctx.fillRect(panelX, visiblePanelTop, panelW, visiblePanelBottom - visiblePanelTop);
      ctx.strokeStyle = "rgba(30, 40, 70, 0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX, visiblePanelTop, panelW, visiblePanelBottom - visiblePanelTop);
    }

    // Grid sel persegi zona huruf (LETTER_CELL = 11 px)
    const letterStartX = drawX + Math.round((building.width - 5 * LETTER_CELL) / 2);
    const pixelPad = 1.5;
    const pixelSize = LETTER_CELL - pixelPad * 2; // 8 px x 8 px

    const litLetterRects: Rect[] = [];
    const unlitLetterRects: Rect[] = [];
    const dimOutsideRects: Rect[] = [];

    // Iterasi 7 baris x 5 kolom zona huruf
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        const cellX = letterStartX + c * LETTER_CELL;
        const cellY = Math.round(groundY - (LETTER_BASELINE + (7 - r) * LETTER_CELL));
        const px = cellX + pixelPad;
        const py = cellY + pixelPad;

        if (py >= topY + 1) {
          const win = building.windows.find((w) => w.col === c && w.row === r);
          if (win?.isLetter && win.lit) {
            litLetterRects.push({ x: px, y: py, w: pixelSize, h: pixelSize });
          } else {
            // Jendela padam di dalam zona huruf
            unlitLetterRects.push({ x: px, y: py, w: pixelSize, h: pixelSize });
          }
        }
      }
    }

    // Jendela redup di luar zona huruf (lantai bawah dan atas)
    for (const win of building.windows) {
      if (win.isLetter || !win.lit) continue;

      if (win.row >= 10 && win.row < 20) {
        // Lantai bawah
        const floor = win.row - 10;
        const winY = Math.round(groundY - 16 - floor * 18);
        const winX = Math.round(drawX + 8 + win.col * ((building.width - 16 - 7) / 2));
        if (winY >= topY + 2) {
          dimOutsideRects.push({ x: winX, y: winY, w: 7, h: 8 });
        }
      } else if (win.row >= 30) {
        // Lantai atas
        const floor = win.row - 30;
        const winY = Math.round(groundY - (LETTER_BASELINE + 7 * LETTER_CELL + 16 + floor * 18));
        const winX = Math.round(drawX + 8 + win.col * ((building.width - 16 - 7) / 2));
        if (winY >= topY + 2) {
          dimOutsideRects.push({ x: winX, y: winY, w: 7, h: 8 });
        }
      }
    }

    // Gambar seluruh rect dalam batch efisien
    fillRects(unlitLetterRects, LETTER_UNLIT_DOT_COLOR);
    fillRects(dimOutsideRects, LETTER_DIM_WINDOW_COLOR);
    fillRects(litLetterRects, LETTER_COLOR);
  } else if (building.windows.length > 0) {
    // ----------------------------------------------------
    // B. Gedung Tanpa Glyph: Jendela Prosedural Standar
    // ----------------------------------------------------
    const cols = building.windows.reduce((max, w) => Math.max(max, w.col + 1), 1);
    const rows = building.windows.reduce((max, w) => Math.max(max, w.row + 1), 1);

    const padX = 6;
    const padY = 8;
    const availW = building.width - padX * 2;
    const availH = building.height - padY * 2;

    const winW = Math.max(2.5, Math.floor((availW - (cols - 1) * 3) / cols));
    const winH = Math.max(3.5, Math.floor((availH - (rows - 1) * 4) / rows));

    const stepX = cols > 1 ? (availW - winW) / (cols - 1) : 0;
    const stepY = rows > 1 ? (availH - winH) / (rows - 1) : 0;

    const warmBright: Rect[] = [];
    const warmMid: Rect[] = [];
    const warmDim: Rect[] = [];

    const coolBright: Rect[] = [];
    const coolMid: Rect[] = [];
    const coolDim: Rect[] = [];

    for (const win of building.windows) {
      if (!win.lit) continue;

      const winX = Math.round(drawX + padX + win.col * stepX);
      const winYFromBottom = padY + win.row * stepY;
      const winY = Math.round(groundY - winYFromBottom - winH);

      if (winY >= topY + 2) {
        const rect = { x: winX, y: winY, w: winW, h: winH };
        const raw =
          Math.sin(win.col * 12.9898 + win.row * 78.233 + building.id * 37.719) * 43758.5453;
        const norm = Math.abs(raw - Math.floor(raw));

        if (win.hue === "warm") {
          if (norm < 0.15) {
            warmDim.push(rect);
          } else if (norm < 0.55) {
            warmMid.push(rect);
          } else {
            warmBright.push(rect);
          }
        } else {
          if (norm < 0.15) {
            coolDim.push(rect);
          } else if (norm < 0.55) {
            coolMid.push(rect);
          } else {
            coolBright.push(rect);
          }
        }
      }
    }

    fillRects(warmBright, "#ffd27a");
    fillRects(warmMid, "rgba(255, 200, 105, 0.72)");
    fillRects(warmDim, "rgba(205, 150, 75, 0.32)");

    fillRects(coolBright, "#5fb8e6");
    fillRects(coolMid, "rgba(95, 184, 230, 0.70)");
    fillRects(coolDim, "rgba(65, 130, 175, 0.30)");
  }

  // 5. Partikel debu kecil saat gedung runtuh
  if (building.state === "collapsing" && building.collapse > 0.05 && building.collapse < 1) {
    const dustCount = 6;
    const dustAlpha = (1 - building.collapse) * 0.4;
    ctx.fillStyle = `rgba(180, 195, 220, ${dustAlpha})`;
    ctx.beginPath();
    for (let i = 0; i < dustCount; i++) {
      const px =
        drawX + (building.width / (dustCount + 1)) * (i + 1) + Math.sin(i * 17 + time / 40) * 5;
      const py = groundY - (1 - building.collapse) * ((i % 3) + 1) * 6;
      ctx.moveTo(px, py);
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}

/**
 * Menggambar seluruh gedung di dalam kota.
 */
export function drawBuildings(
  ctx: CanvasRenderingContext2D,
  buildings: Building[],
  groundY: number,
  time: number
): void {
  for (const b of buildings) {
    drawBuilding(ctx, b, groundY, time);
  }
}
