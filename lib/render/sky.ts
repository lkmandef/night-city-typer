/**
 * Definisi palet warna untuk suasana waktu (malam, dini hari, fajar).
 */
export interface TimePalette {
  top: [number, number, number];
  mid: [number, number, number];
  horizon1: [number, number, number, number]; // r, g, b, alpha
  horizon2: [number, number, number, number];
  ground: [number, number, number];
  groundLine: [number, number, number, number];
  moonAlpha: number;
  starsAlpha: number;
  windowLitFactor: number;
  phaseName: string;
}

export const TIME_PALETTES: TimePalette[] = [
  // 0: Malam (Night) - langit biru-ungu gelap sinematik, lampu kota menyala penuh
  {
    top: [5, 8, 22],
    mid: [27, 17, 64],
    horizon1: [255, 122, 89, 0.15],
    horizon2: [255, 122, 89, 0.3],
    ground: [11, 15, 30],
    groundLine: [255, 122, 89, 0.25],
    moonAlpha: 1.0,
    starsAlpha: 1.0,
    windowLitFactor: 1.0,
    phaseName: "Malam",
  },
  // 1: Dini Hari (Midnight) - langit biru gelap dingin, lampu gedung banyak padam
  {
    top: [2, 4, 12],
    mid: [9, 14, 36],
    horizon1: [45, 65, 120, 0.18],
    horizon2: [60, 85, 150, 0.28],
    ground: [6, 9, 20],
    groundLine: [70, 100, 170, 0.2],
    moonAlpha: 0.85,
    starsAlpha: 1.05,
    windowLitFactor: 0.5,
    phaseName: "Dini Hari",
  },
  // 2: Fajar (Dawn) - langit semburat fajar ungu dan oranye, bintang & bulan memudar
  {
    top: [12, 16, 44],
    mid: [46, 23, 68],
    horizon1: [180, 70, 95, 0.45],
    horizon2: [245, 130, 85, 0.65],
    ground: [16, 12, 26],
    groundLine: [245, 130, 85, 0.4],
    moonAlpha: 0.25,
    starsAlpha: 0.15,
    windowLitFactor: 0.4,
    phaseName: "Fajar",
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Melakukan interpolasi halus antara dua palet waktu.
 */
export function interpolatePalette(fromIdx: number, toIdx: number, t: number): TimePalette {
  const from = TIME_PALETTES[Math.abs(fromIdx) % TIME_PALETTES.length];
  const to = TIME_PALETTES[Math.abs(toIdx) % TIME_PALETTES.length];
  const clampedT = Math.max(0, Math.min(1, t));

  return {
    top: [
      Math.round(lerp(from.top[0], to.top[0], clampedT)),
      Math.round(lerp(from.top[1], to.top[1], clampedT)),
      Math.round(lerp(from.top[2], to.top[2], clampedT)),
    ],
    mid: [
      Math.round(lerp(from.mid[0], to.mid[0], clampedT)),
      Math.round(lerp(from.mid[1], to.mid[1], clampedT)),
      Math.round(lerp(from.mid[2], to.mid[2], clampedT)),
    ],
    horizon1: [
      Math.round(lerp(from.horizon1[0], to.horizon1[0], clampedT)),
      Math.round(lerp(from.horizon1[1], to.horizon1[1], clampedT)),
      Math.round(lerp(from.horizon1[2], to.horizon1[2], clampedT)),
      lerp(from.horizon1[3], to.horizon1[3], clampedT),
    ],
    horizon2: [
      Math.round(lerp(from.horizon2[0], to.horizon2[0], clampedT)),
      Math.round(lerp(from.horizon2[1], to.horizon2[1], clampedT)),
      Math.round(lerp(from.horizon2[2], to.horizon2[2], clampedT)),
      lerp(from.horizon2[3], to.horizon2[3], clampedT),
    ],
    ground: [
      Math.round(lerp(from.ground[0], to.ground[0], clampedT)),
      Math.round(lerp(from.ground[1], to.ground[1], clampedT)),
      Math.round(lerp(from.ground[2], to.ground[2], clampedT)),
    ],
    groundLine: [
      Math.round(lerp(from.groundLine[0], to.groundLine[0], clampedT)),
      Math.round(lerp(from.groundLine[1], to.groundLine[1], clampedT)),
      Math.round(lerp(from.groundLine[2], to.groundLine[2], clampedT)),
      lerp(from.groundLine[3], to.groundLine[3], clampedT),
    ],
    moonAlpha: lerp(from.moonAlpha, to.moonAlpha, clampedT),
    starsAlpha: lerp(from.starsAlpha, to.starsAlpha, clampedT),
    windowLitFactor: lerp(from.windowLitFactor, to.windowLitFactor, clampedT),
    phaseName: clampedT >= 0.5 ? to.phaseName : from.phaseName,
  };
}

/**
 * Menggambar langit malam / dini hari / fajar.
 */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette?: TimePalette
): void {
  const p = palette ?? TIME_PALETTES[0];
  const groundY = height * 0.85;

  const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGradient.addColorStop(0, `rgb(${p.top[0]}, ${p.top[1]}, ${p.top[2]})`);
  skyGradient.addColorStop(0.55, `rgb(${p.mid[0]}, ${p.mid[1]}, ${p.mid[2]})`);
  skyGradient.addColorStop(
    0.88,
    `rgba(${p.horizon1[0]}, ${p.horizon1[1]}, ${p.horizon1[2]}, ${p.horizon1[3].toFixed(3)})`
  );
  skyGradient.addColorStop(
    1,
    `rgba(${p.horizon2[0]}, ${p.horizon2[1]}, ${p.horizon2[2]}, ${p.horizon2[3].toFixed(3)})`
  );

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, groundY);
}

/**
 * Menggambar bulan lembut di sudut kanan atas dengan pendaran radial.
 */
export function drawMoon(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  alpha = 1.0
): void {
  if (alpha <= 0.02) return;

  const moonX = width * 0.82 - ((time * 0.0015) % 30);
  const moonY = height * 0.2;
  const radius = Math.max(14, Math.min(24, Math.round(width * 0.022)));

  const hasSave = typeof ctx.save === "function";
  if (hasSave) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  }

  // 1. Glow radial lembut
  const glow = ctx.createRadialGradient(
    moonX,
    moonY,
    radius * 0.5,
    moonX,
    moonY,
    radius * 3.2
  );
  glow.addColorStop(0, "rgba(255, 245, 220, 0.32)");
  glow.addColorStop(0.35, "rgba(255, 230, 190, 0.1)");
  glow.addColorStop(1, "rgba(255, 230, 190, 0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, radius * 3.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Lingkaran piringan bulan krem pucat
  ctx.fillStyle = "#fff8ea";
  ctx.beginPath();
  ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
  ctx.fill();

  // 3. Tekstur kawah halus
  ctx.fillStyle = "rgba(225, 218, 200, 0.35)";
  ctx.beginPath();
  ctx.arc(moonX - radius * 0.22, moonY - radius * 0.08, radius * 0.26, 0, Math.PI * 2);
  ctx.arc(moonX + radius * 0.3, moonY + radius * 0.2, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  if (hasSave) {
    ctx.restore();
  }
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette?: TimePalette
): void {
  const p = palette ?? TIME_PALETTES[0];
  const groundY = height * 0.85;

  // Dasar tanah gelap di 85% tinggi layar
  ctx.fillStyle = `rgb(${p.ground[0]}, ${p.ground[1]}, ${p.ground[2]})`;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Garis horizon tipis untuk aksen pemisah
  ctx.strokeStyle = `rgba(${p.groundLine[0]}, ${p.groundLine[1]}, ${p.groundLine[2]}, ${p.groundLine[3].toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();
}

