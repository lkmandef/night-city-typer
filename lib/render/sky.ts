/**
 * Menggambar langit malam dan garis horizon.
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
