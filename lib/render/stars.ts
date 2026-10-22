import { mulberry32 } from "@/lib/city/rng";

export interface Star {
  x: number; // 0..1 fraksi lebar layar
  y: number; // 0..1 fraksi tinggi langit
  size: number; // 0.5..1.8 px
  phase: number; // 0..2PI
  speed: number; // kecepatan kedip
  brightness: number; // 0.6..1.0
  color: string;
}

/**
 * Menghasilkan kumpulan bintang secara deterministik berdasarkan seed.
 */
export function generateStars(count = 130, seed = 42424): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
    // Sekitar 12% bintang sedikit lebih terang dan besar
    const isBright = rand() < 0.12;
    const size = isBright ? 1.4 + rand() * 0.4 : 0.6 + rand() * 0.7;
    const color = isBright && rand() > 0.4 ? "rgba(225, 240, 255," : "rgba(255, 245, 220,";

    stars.push({
      x: rand(),
      // Bintang hanya berada di langit atas (0 sampai 72% tinggi layar)
      y: rand() * 0.72,
      size,
      phase: rand() * Math.PI * 2,
      speed: 0.8 + rand() * 1.6,
      brightness: isBright ? 1.0 : 0.6 + rand() * 0.35,
      color,
    });
  }

  return stars;
}

/**
 * Menggambar bintang-bintang malam yang berkedip pelan.
 */
export function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  width: number,
  height: number,
  time: number
): void {
  for (const s of stars) {
    const sx = Math.round(s.x * width);
    const sy = Math.round(s.y * height);

    // Osilasi kedip halus
    const flicker = 0.5 + 0.5 * Math.sin((time / 1000) * s.speed + s.phase);
    const alpha = (0.2 + 0.8 * flicker) * s.brightness;

    ctx.fillStyle = `${s.color} ${alpha.toFixed(2)})`;
    ctx.fillRect(sx, sy, s.size, s.size);
  }
}
