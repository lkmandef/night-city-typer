import type { Building, Separator } from "@/lib/city/types";
import { drawGround, drawMoon, drawSky, type TimePalette } from "./sky";
import { drawStars, type Star } from "./stars";
import { type ParallaxRenderer } from "./parallax";
import { drawSeparators } from "./separators";
import { drawBuildings } from "./drawBuilding";

export interface RenderPipelineOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  groundY: number;
  worldScale: number;
  cameraX: number;
  stars: Star[];
  parallax: ParallaxRenderer;
  visibleSeparators: Separator[];
  visibleBuildings: Building[];
  time: number;
  palette?: TimePalette;
}

/**
 * Menggambar kunang-kunang kecil yang melayang di sekitar taman.
 */
function drawFireflies(
  ctx: CanvasRenderingContext2D,
  separators: Separator[],
  groundY: number,
  time: number
) {
  for (const sep of separators) {
    if (sep.kind !== "park" || sep.progress < 0.5) continue;

    const count = 4;
    for (let i = 0; i < count; i++) {
      const fx =
        sep.x + 8 + ((sep.width - 16) / count) * i + Math.sin(time / 450 + i * 2.1) * 7;
      const fy = groundY - 14 - Math.cos(time / 550 + i * 1.8) * 14;
      const alpha = 0.35 + 0.5 * Math.sin(time / 280 + i * 3.4);

      if (alpha > 0) {
        ctx.fillStyle = `rgba(200, 255, 130, ${alpha.toFixed(2)})`;
        ctx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
      }
    }
  }
}

/**
 * Pipeline rendering lengkap kota malam sesuai urutan lapisan visual.
 * 1. Langit
 * 2. Bintang
 * 3. Bulan
 * 4. Gedung latar (Parallax 0.2x & 0.4x)
 * 5. Dasar tanah
 * 6. Objek dunia (Pemisah & Gedung Utama)
 * 7. Partikel suasana (Kunang-kunang taman)
 */
export function renderScene(options: RenderPipelineOptions): void {
  const {
    ctx,
    width,
    height,
    groundY,
    worldScale,
    cameraX,
    stars,
    parallax,
    visibleSeparators,
    visibleBuildings,
    time,
    palette,
  } = options;

  // 1. Langit malam / dini hari / fajar
  drawSky(ctx, width, height, palette);

  // 2. Bintang berkedip
  drawStars(ctx, stars, width, height, time, palette?.starsAlpha ?? 1.0);

  // 3. Bulan dengan pendaran radial lembut
  drawMoon(ctx, width, height, time, palette?.moonAlpha ?? 1.0);

  // 4. Gedung latar (dua lapis parallax 0.2x dan 0.4x)
  parallax.draw(ctx, cameraX, groundY);

  // 5. Dasar tanah
  drawGround(ctx, width, height, palette);

  // 6. Objek dunia (Pemisah, Gedung, Partikel) dengan skala dan kamera
  ctx.save();
  ctx.translate(0, groundY);
  ctx.scale(worldScale, worldScale);
  ctx.translate(-cameraX, -groundY);

  drawSeparators(ctx, visibleSeparators, groundY, time);
  drawBuildings(ctx, visibleBuildings, groundY, time, palette?.windowLitFactor ?? 1.0);
  drawFireflies(ctx, visibleSeparators, groundY, time);

  ctx.restore();
}
