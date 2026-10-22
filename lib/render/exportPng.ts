/**
 * Ekspor canvas ke gambar PNG dengan watermark "night-city-typer" di pojok kanan bawah.
 */
export function exportCanvasToPng(canvas: HTMLCanvasElement): void {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) return;

  // 1. Gambar canvas pemandangan kota saat ini
  ctx.drawImage(canvas, 0, 0);

  // 2. Tambahkan watermark kecil teks "night-city-typer" di pojok kanan bawah
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const fontSize = Math.round(13 * dpr);
  ctx.save();
  ctx.font = `500 ${fontSize}px sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  const marginX = Math.round(18 * dpr);
  const marginY = Math.round(14 * dpr);
  const posX = exportCanvas.width - marginX;
  const posY = exportCanvas.height - marginY;

  // Sedikit bayangan gelap agar terbaca di segala warna latar
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 4 * dpr;
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.fillText("night-city-typer", posX, posY);
  ctx.restore();

  // 3. Picu unduhan berkas PNG
  const dataUrl = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "night-city-typer.png";
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
