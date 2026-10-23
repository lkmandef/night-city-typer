/**
 * Rendering dan cache sprite offscreen untuk perabot jalan (Street Furniture FR-20).
 * Menggunakan Path2D / canvas offscreen tanpa aset gambar eksternal.
 * Catatan arsitektur: file ini hanya menggambar dan tidak mengubah state.
 */

import type { StreetFurniture } from "@/lib/city/ground";

interface CachedFurnitureSprites {
  lamp: HTMLCanvasElement;
  tree: HTMLCanvasElement;
  bench: HTMLCanvasElement;
  car: HTMLCanvasElement;
}

let cachedSprites: CachedFurnitureSprites | null = null;

function initFurnitureSprites(): void {
  if (cachedSprites || typeof document === "undefined") return;

  // 1. Lampu Jalan (~14x24 px dengan glow kepala lampu)
  const lampCanvas = document.createElement("canvas");
  lampCanvas.width = 18;
  lampCanvas.height = 24;
  const lctx = lampCanvas.getContext("2d");
  if (lctx) {
    // Glow radial di kepala lampu
    const glow = lctx.createRadialGradient(9, 6, 1, 9, 6, 8);
    glow.addColorStop(0, "rgba(255, 235, 140, 0.45)");
    glow.addColorStop(0.5, "rgba(255, 215, 100, 0.15)");
    glow.addColorStop(1, "rgba(255, 215, 100, 0)");
    lctx.fillStyle = glow;
    lctx.beginPath();
    lctx.arc(9, 6, 8, 0, Math.PI * 2);
    lctx.fill();

    // Tiang lampu ramping
    lctx.fillStyle = "#334155";
    lctx.fillRect(8.5, 6, 1.2, 17);

    // Dasar tiang
    lctx.fillStyle = "#1e293b";
    lctx.fillRect(7, 22, 4, 2);

    // Kepala lampu bercahaya
    lctx.fillStyle = "#fff4bd";
    lctx.fillRect(7.5, 4.5, 3, 3);
  }

  // 2. Pohon dalam Pot (~14x16 px)
  const treeCanvas = document.createElement("canvas");
  treeCanvas.width = 14;
  treeCanvas.height = 16;
  const tctx = treeCanvas.getContext("2d");
  if (tctx) {
    // Pot tanaman
    tctx.fillStyle = "#1e293b";
    tctx.fillRect(4, 12, 6, 4);

    // Batang pohon
    tctx.fillStyle = "#3e2723";
    tctx.fillRect(6, 8, 2, 4);

    // Dedaunan rimbun kota malam (hijau pinus gelap bersinar lembut)
    tctx.fillStyle = "#164e63";
    tctx.beginPath();
    tctx.arc(7, 6, 5, 0, Math.PI * 2);
    tctx.fill();

    tctx.fillStyle = "#0f766e";
    tctx.beginPath();
    tctx.arc(7, 5, 3.5, 0, Math.PI * 2);
    tctx.fill();
  }

  // 3. Bangku Taman (~16x8 px)
  const benchCanvas = document.createElement("canvas");
  benchCanvas.width = 16;
  benchCanvas.height = 8;
  const bctx = benchCanvas.getContext("2d");
  if (bctx) {
    // Kaki besi bangku
    bctx.fillStyle = "#334155";
    bctx.fillRect(2, 4, 1.5, 4);
    bctx.fillRect(12.5, 4, 1.5, 4);

    // Papan dudukan kayu
    bctx.fillStyle = "#78350f";
    bctx.fillRect(1, 4, 14, 2);

    // Sandaran punggung
    bctx.fillStyle = "#92400e";
    bctx.fillRect(1, 1, 14, 2);
  }

  // 4. Mobil Parkir di Jalan (~26x11 px dengan lampu belakang merah)
  const carCanvas = document.createElement("canvas");
  carCanvas.width = 26;
  carCanvas.height = 11;
  const cctx = carCanvas.getContext("2d");
  if (cctx) {
    // Badan mobil siluet
    cctx.fillStyle = "#0f172a";
    cctx.beginPath();
    cctx.roundRect(1, 3, 24, 7, 2);
    cctx.fill();

    // Atap / kaca mobil
    cctx.fillStyle = "#1e293b";
    cctx.fillRect(6, 1, 12, 4);

    // Roda
    cctx.fillStyle = "#020617";
    cctx.fillRect(4, 9, 4, 2);
    cctx.fillRect(18, 9, 4, 2);

    // Lampu belakang merah menyala lembut di sisi kanan
    cctx.fillStyle = "#ef4444";
    cctx.fillRect(23, 4.5, 2, 2.5);

    // Pendaran merah tipis
    cctx.fillStyle = "rgba(239, 68, 68, 0.35)";
    cctx.beginPath();
    cctx.arc(24, 5.5, 4, 0, Math.PI * 2);
    cctx.fill();
  }

  if (lampCanvas && treeCanvas && benchCanvas && carCanvas) {
    cachedSprites = {
      lamp: lampCanvas,
      tree: treeCanvas,
      bench: benchCanvas,
      car: carCanvas,
    };
  }
}

/**
 * Menggambar daftar perabot jalan yang terlihat di viewport.
 * Memanfaatkan sprite offscreen tanpa alokasi objek baru per frame.
 */
export function drawStreetFurniture(
  ctx: CanvasRenderingContext2D,
  furnitureList: StreetFurniture[],
  groundY: number,
  cameraX: number,
  worldScreenWidth: number
): void {
  if (furnitureList.length === 0) return;
  if (!cachedSprites) initFurnitureSprites();
  if (!cachedSprites) return;

  for (const item of furnitureList) {
    // Culling horizontal: hanya gambar yang terlihat di kamera
    if (item.x + 30 < cameraX || item.x - 30 > cameraX + worldScreenWidth) {
      continue;
    }

    const sprite = cachedSprites[item.kind];
    if (!sprite) continue;

    const posX = Math.round(item.x - sprite.width / 2);
    const posY = Math.round(groundY + item.yOffset - sprite.height);

    ctx.drawImage(sprite, posX, posY);

    // Kolam cahaya kecil di bawah tiang lampu jalan
    if (item.kind === "lamp") {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(item.x, groundY + item.yOffset, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 235, 140, 0.16)";
      ctx.fill();
      ctx.restore();
    }
  }
}
