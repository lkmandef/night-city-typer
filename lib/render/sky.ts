/**
 * Menggambar langit malam, bulan, dan garis horizon.
 */

export function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const groundY = height * 0.85;

  // Gradien vertikal: #050816 (atas) -> #1b1140 (tengah) -> semburat oranye tipis di horizon
  const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGradient.addColorStop(0, "#050816");
  skyGradient.addColorStop(0.55, "#1b1140");
  skyGradient.addColorStop(0.88, "rgba(255, 122, 89, 0.15)");
  skyGradient.addColorStop(1, "rgba(255, 122, 89, 0.3)");

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
  time: number
): void {
  const moonX = width * 0.82 - ((time * 0.0015) % 30);
  const moonY = height * 0.2;
  const radius = Math.max(14, Math.min(24, Math.round(width * 0.022)));

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
}

export function drawGround(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const groundY = height * 0.85;

  // Dasar tanah gelap di 85% tinggi layar
  ctx.fillStyle = "#0b0f1e";
  ctx.fillRect(0, groundY, width, height - groundY);

  // Garis horizon tipis untuk aksen pemisah
  ctx.strokeStyle = "rgba(255, 122, 89, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();
}
