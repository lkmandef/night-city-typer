import type { Building } from "@/lib/city/types";
import { easeOutCubic } from "@/lib/utils/easing";

/**
 * Menggambar satu gedung dengan animasi tumbuh, antena tower, dan jendela menyala.
 */
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  building: Building,
  groundY: number,
  time: number
): void {
  const currentHeight = building.height * easeOutCubic(building.grow);
  if (currentHeight <= 0) return;

  const topY = groundY - currentHeight;

  // 1. Badan gedung: persegi panjang gelap (#0e1327)
  ctx.fillStyle = "#11172e";
  ctx.fillRect(building.x, topY, building.width, currentHeight);

  // Stroke tepi gedung untuk siluet yang jelas
  ctx.strokeStyle = "rgba(42, 54, 88, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(building.x, topY, building.width, currentHeight);

  // 2. Tower aksen: Antena dan lampu merah berkedip
  if (building.kind === "tower") {
    const antennaX = Math.round(building.x + building.width / 2);
    const antennaHeight = 22 * easeOutCubic(building.grow);
    const antennaTipY = topY - antennaHeight;

    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(antennaX, topY);
    ctx.lineTo(antennaX, antennaTipY);
    ctx.stroke();

    // Lampu merah berkedip di puncak antena (berkedip tiap ~200ms)
    const isBlinking = Math.sin(time / 200) > 0;
    if (isBlinking && building.grow > 0.8) {
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

  // 3. Jendela: Kelompokkan jendela per warna dalam satu path sebelum fill
  if (building.windows.length > 0) {
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

    const warmRects: { x: number; y: number; w: number; h: number }[] = [];
    const coolRects: { x: number; y: number; w: number; h: number }[] = [];

    for (const win of building.windows) {
      if (!win.lit) continue;

      const winX = Math.round(building.x + padX + win.col * stepX);
      const winYFromBottom = padY + win.row * stepY;
      const winY = Math.round(groundY - winYFromBottom - winH);

      // Pastikan jendela berada dalam bagian gedung yang sudah tumbuh
      if (winY >= topY + 2) {
        if (win.hue === "warm") {
          warmRects.push({ x: winX, y: winY, w: winW, h: winH });
        } else {
          coolRects.push({ x: winX, y: winY, w: winW, h: winH });
        }
      }
    }

    // Gambar seluruh jendela warm (#ffd27a) sekaligus dalam satu path
    if (warmRects.length > 0) {
      ctx.beginPath();
      for (const r of warmRects) {
        ctx.rect(r.x, r.y, r.w, r.h);
      }
      ctx.fillStyle = "#ffd27a";
      ctx.fill();
    }

    // Gambar seluruh jendela cool (#7fd6ff) sekaligus dalam satu path
    if (coolRects.length > 0) {
      ctx.beginPath();
      for (const r of coolRects) {
        ctx.rect(r.x, r.y, r.w, r.h);
      }
      ctx.fillStyle = "#7fd6ff";
      ctx.fill();
    }
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
