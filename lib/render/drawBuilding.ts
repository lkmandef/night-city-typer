import type { Building } from "@/lib/city/types";
import { easeOutCubic } from "@/lib/utils/easing";
import { LETTER_BASELINE, LETTER_CELL } from "@/lib/city/buildings";

// ==========================================
// Konstanta Visual Zona Huruf & Jendela
// ==========================================
export const LETTER_COLOR = "#fff3c4"; // Warna huruf paling terang di fasad
export const LETTER_GLOW_OPACITY = 0.18; // Opacity radial glow per huruf (~0.18)
export const LETTER_GLOW_RADIUS_MULT = 1.6; // Ukuran glow relatif terhadap tinggi huruf (1.6x)
export const STOREFRONT_COLOR = "#ffe8a8"; // Warna jendela toko di lantai podium
export const DIM_WARM_COLOR = "rgba(255, 180, 84, "; // Warna jendela biasa hangat redup (kecerahan 0.25..0.55)
export const DIM_COOL_COLOR = "rgba(95, 184, 230, "; // Warna jendela biasa dingin redup (~10%)

/**
 * Menggambar satu gedung dengan animasi tumbuh, grid jendela fasad hidup,
 * huruf sebagai jendela paling terang, ruang napas halo, variasi siluet atap, dan debu runtuh.
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

  // 1. Glow lembut per huruf (satu radial gradient berukuran ~1.6x tinggi huruf)
  // Digambar di bawah piksel huruf dan sedikit menerangi dinding/udara sekitar
  const hasLitLetters = building.windows.some((w) => w.isLetter && w.lit);
  if (building.glyph && hasLitLetters && building.state !== "collapsing") {
    const letterHeight = 7 * LETTER_CELL; // 77 px
    const glowCenterX = Math.round(drawX + building.width / 2);
    const glowCenterY = Math.round(groundY - (LETTER_BASELINE + 3.5 * LETTER_CELL));
    const glowRadius = Math.round((letterHeight * LETTER_GLOW_RADIUS_MULT) / 2); // ~62 px

    const glowFade = Math.min(1, building.grow);

    const letterGlow = ctx.createRadialGradient(
      glowCenterX,
      glowCenterY,
      8,
      glowCenterX,
      glowCenterY,
      glowRadius
    );
    letterGlow.addColorStop(0, `rgba(255, 238, 175, ${LETTER_GLOW_OPACITY * glowFade})`);
    letterGlow.addColorStop(
      0.5,
      `rgba(255, 205, 110, ${LETTER_GLOW_OPACITY * 0.4 * glowFade})`
    );
    letterGlow.addColorStop(1, "rgba(255, 190, 80, 0)");

    ctx.fillStyle = letterGlow;
    ctx.fillRect(
      glowCenterX - glowRadius,
      glowCenterY - glowRadius,
      glowRadius * 2,
      glowRadius * 2
    );
  } else if (!building.glyph && building.windows.some((w) => w.lit) && currentHeight > 10) {
    // Ambient glow untuk non-glyph building
    const glowCenterX = Math.round(drawX + building.width / 2);
    const glowCenterY = Math.round(topY + currentHeight * 0.55);
    const glowRadius = Math.round(Math.max(building.width * 1.3, currentHeight * 0.75));
    const glowFade =
      building.state === "collapsing" ? 1 - building.collapse : Math.min(1, building.grow);

    const buildingGlow = ctx.createRadialGradient(
      glowCenterX,
      glowCenterY,
      4,
      glowCenterX,
      glowCenterY,
      glowRadius
    );
    buildingGlow.addColorStop(0, `rgba(255, 215, 130, ${0.14 * glowFade})`);
    buildingGlow.addColorStop(0.5, `rgba(255, 185, 90, ${0.04 * glowFade})`);
    buildingGlow.addColorStop(1, "rgba(255, 185, 90, 0)");

    ctx.fillStyle = buildingGlow;
    ctx.fillRect(
      glowCenterX - glowRadius,
      glowCenterY - glowRadius,
      glowRadius * 2,
      glowRadius * 2
    );
  }

  // 2. Badan gedung: dinding fasad gelap (#11172e)
  ctx.fillStyle = "#11172e";
  ctx.fillRect(drawX, topY, building.width, currentHeight);

  // Stroke tepi gedung untuk siluet arsitektur yang tegas
  ctx.strokeStyle = "rgba(42, 54, 88, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(drawX, topY, building.width, currentHeight);

  // 3. Pintu toko di lantai podium dasar (ground level)
  if (building.glyph && building.hasDoor) {
    const letterStartX = drawX + Math.round((building.width - 5 * LETTER_CELL) / 2);
    const doorX = letterStartX + 2 * LETTER_CELL + 1;
    const doorY = groundY - 14;
    if (topY <= doorY) {
      ctx.fillStyle = "#161d31";
      ctx.fillRect(doorX, doorY, 9, 14);
      ctx.fillStyle = "rgba(255, 230, 160, 0.75)";
      ctx.fillRect(doorX + 1.5, doorY + 2, 6, 12);
    }
  }

  // Helper untuk menggambar batch rect
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

  // 4. Jendela & Fasad Hidup
  if (building.glyph) {
    // -------------------------------------------------------------------------
    // A. Gedung Berhuruf: SATU grid terpadu dari podium sampai atap
    // -------------------------------------------------------------------------
    const letterStartX = drawX + Math.round((building.width - 5 * LETTER_CELL) / 2);

    const litLetterRects: Rect[] = [];
    const storefrontRects: Rect[] = [];
    const dimWarmRects: { rect: Rect; alpha: number }[] = [];
    const dimCoolRects: { rect: Rect; alpha: number }[] = [];
    const unlitRects: Rect[] = [];

    for (const win of building.windows) {
      const cellX = letterStartX + win.col * LETTER_CELL;
      const cellY = Math.round(groundY - (5 + win.row * LETTER_CELL + 8));

      if (cellY < topY + 1) continue; // Belum tumbuh mencapai jendela ini

      if (win.isLetter) {
        if (win.lit) {
          // Piksel huruf: warna paling terang (#fff3c4) dan sedikit lebih besar (9x9 px)
          litLetterRects.push({
            x: cellX + 1,
            y: cellY - 0.5,
            w: 9,
            h: 9,
          });
        }
        // Jendela dalam zona huruf yang bukan bagian huruf: padam total
      } else if (win.isStorefront) {
        if (win.lit) {
          storefrontRects.push({
            x: cellX + 1.5,
            y: cellY,
            w: 8,
            h: 8,
          });
        } else {
          unlitRects.push({ x: cellX + 1.5, y: cellY, w: 8, h: 8 });
        }
      } else if (win.lit) {
        const alpha = win.brightness ?? (win.isHalo ? 0.25 : 0.38);
        const rect = { x: cellX + 1.8, y: cellY + 0.3, w: 7.4, h: 7.4 };
        if (win.hue === "cool") {
          dimCoolRects.push({ rect, alpha });
        } else {
          dimWarmRects.push({ rect, alpha });
        }
      } else {
        // Jendela padam digambar sangat samar (alpha 0.04)
        unlitRects.push({ x: cellX + 1.8, y: cellY + 0.3, w: 7.4, h: 7.4 });
      }
    }

    // 1. Jendela padam samar
    if (unlitRects.length > 0) {
      fillRects(unlitRects, "rgba(40, 55, 90, 0.04)");
    }

    // 2. Jendela toko podium
    if (storefrontRects.length > 0) {
      fillRects(storefrontRects, STOREFRONT_COLOR);
    }

    // 3. Jendela biasa hangat redup (kecerahan 0.25..0.55)
    for (const item of dimWarmRects) {
      ctx.fillStyle = `${DIM_WARM_COLOR}${item.alpha})`;
      ctx.fillRect(item.rect.x, item.rect.y, item.rect.w, item.rect.h);
    }

    // 4. Jendela biasa dingin redup (~10%)
    for (const item of dimCoolRects) {
      ctx.fillStyle = `${DIM_COOL_COLOR}${item.alpha})`;
      ctx.fillRect(item.rect.x, item.rect.y, item.rect.w, item.rect.h);
    }

    // 5. Piksel huruf menyala: paling terang di fasad (#fff3c4)
    if (litLetterRects.length > 0) {
      fillRects(litLetterRects, LETTER_COLOR);
    }
  } else if (building.windows.length > 0) {
    // -------------------------------------------------------------------------
    // B. Gedung Tanpa Glyph: Jendela Prosedural Standar
    // -------------------------------------------------------------------------
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

  // 5. Siluet & Hiasan Atap (Setback, Water Tank, Antena, Datar)
  if (building.state !== "collapsing" || building.collapse < 0.3) {
    const roofScale =
      building.state === "collapsing"
        ? 1 - building.collapse / 0.3
        : easeOutCubic(building.grow);

    // A. Setback (Bertingkat / Art Deco crown)
    if (building.roofKind === "setback" && roofScale > 0.6) {
      const step1W = Math.round(building.width * 0.65);
      const step1H = 9 * roofScale;
      const step1X = Math.round(drawX + (building.width - step1W) / 2);
      const step1Y = topY - step1H;

      ctx.fillStyle = "#11172e";
      ctx.fillRect(step1X, step1Y, step1W, step1H);
      ctx.strokeStyle = "rgba(42, 54, 88, 0.6)";
      ctx.strokeRect(step1X, step1Y, step1W, step1H);

      const step2W = Math.round(building.width * 0.35);
      const step2H = 6 * roofScale;
      const step2X = Math.round(drawX + (building.width - step2W) / 2);
      const step2Y = step1Y - step2H;

      ctx.fillRect(step2X, step2Y, step2W, step2H);
      ctx.strokeRect(step2X, step2Y, step2W, step2H);
    }
    // B. Water Tank (Tangki air kayu/metal rooftop)
    else if (building.roofKind === "watertank" && roofScale > 0.7) {
      const tankW = 14;
      const tankH = 10 * roofScale;
      const tankLegH = 6 * roofScale;
      const tankX = Math.round(drawX + building.width * 0.25);
      const tankY = topY - tankLegH - tankH;

      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tankX + 2, topY);
      ctx.lineTo(tankX + 2, topY - tankLegH);
      ctx.moveTo(tankX + tankW - 2, topY);
      ctx.lineTo(tankX + tankW - 2, topY - tankLegH);
      ctx.stroke();

      ctx.fillStyle = "#273248";
      ctx.fillRect(tankX, tankY, tankW, tankH);
      ctx.strokeStyle = "rgba(70, 85, 115, 0.6)";
      ctx.strokeRect(tankX, tankY, tankW, tankH);
    }
    // C. Antena dengan lampu merah berkedip
    else if (building.roofKind === "antenna") {
      const antennaX = Math.round(drawX + building.width / 2);
      const antennaHeight = 22 * roofScale;
      const antennaTipY = topY - antennaHeight;

      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(antennaX, topY);
      ctx.lineTo(antennaX, antennaTipY);
      ctx.stroke();

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
  }

  // 6. Partikel debu kecil saat gedung runtuh
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
