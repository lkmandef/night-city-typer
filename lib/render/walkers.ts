/**
 * Rendering karakter berjalan (Walkers) dan cahaya tanah podium (FR-16).
 * Catatan arsitektur: file ini hanya menggambar dan tidak mengubah state animasi.
 */

import type { BuildingGroup } from "@/lib/city/groups";
import type { Walker } from "@/lib/city/walkers";
import {
  getWalkerDimensions,
  getWalkerFrameName,
  getWalkerSpriteCanvas,
} from "./sprites";

// Cache strip gradien cahaya horizontal podium untuk menghindari alokasi baru per frame
let podiumLightCanvas: HTMLCanvasElement | null = null;

function initPodiumLightCanvas(): void {
  if (podiumLightCanvas || typeof document === "undefined") return;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  const grad = ctx.createLinearGradient(0, 0, 64, 0);
  grad.addColorStop(0, "rgba(255, 200, 120, 0)");
  grad.addColorStop(0.2, "rgba(255, 200, 120, 0.12)");
  grad.addColorStop(0.8, "rgba(255, 200, 120, 0.12)");
  grad.addColorStop(1, "rgba(255, 200, 120, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 1);
  podiumLightCanvas = c;
}

/**
 * Menggambar semua walker dan cahaya podium di tanah.
 * Digambar di area tanah (di bawah baseline groundY), tidak di atas fasad gedung,
 * sehingga tidak pernah menimpa huruf yang menyala.
 */
import { getWalkerDepthScale } from "@/lib/city/ground";

export function drawWalkers(
  ctx: CanvasRenderingContext2D,
  walkers: Walker[],
  groups: BuildingGroup[],
  groundY: number,
  worldScale: number,
  cameraX: number,
  worldScreenWidth: number,
  reducedMotion = false
): void {
  // 1. Gambar gradien cahaya hangat tipis di tanah di bawah tiap kelompok gedung
  if (!podiumLightCanvas) initPodiumLightCanvas();

  if (podiumLightCanvas && groups.length > 0) {
    for (const group of groups) {
      // Culling kelompok yang berada di luar layar kamera
      if (
        group.maxX < cameraX - 20 ||
        group.minX > cameraX + worldScreenWidth + 20
      ) {
        continue;
      }

      const lightWidth = group.maxX - group.minX;
      if (lightWidth > 0) {
        ctx.drawImage(
          podiumLightCanvas,
          group.minX,
          groundY,
          lightWidth,
          14
        );
      }
    }
  }

  if (walkers.length === 0) return;

  // 2. Filter walker yang terlihat di layar kamera, lalu urutkan menurut lajur Y (Y-sorting)
  // Karakter di lajur atas (dekat podium) digambar lebih dulu, lajur bawah (dekat jalan) di depan
  const visibleWalkers = walkers
    .filter(
      (w) =>
        w.alpha > 0 &&
        w.x + 40 >= cameraX &&
        w.x - 40 <= cameraX + worldScreenWidth
    )
    .sort((a, b) => a.laneY - b.laneY);

  for (const walker of visibleWalkers) {
    const depthScale = getWalkerDepthScale(walker.laneIndex ?? 1);
    const { width, height, scale } = getWalkerDimensions(
      walker.kind,
      worldScale,
      depthScale
    );

    const frameName = getWalkerFrameName(walker);
    // Tolehan manusia saat jeda (cermin singkat)
    const renderDir = (walker.lookFlip ? (walker.dir === 1 ? -1 : 1) : walker.dir) as 1 | -1;
    const sprite = getWalkerSpriteCanvas(walker.kind, frameName, renderDir);

    // Gerak naik-turun 1 px pada frame langkah (bobbing)
    const isStepBob =
      !reducedMotion && walker.state === "walk" && walker.frame === 1;
    const footY = groundY + walker.laneY - (isStepBob ? 1 : 0);

    // Bayangan elips lebih tegas di kaki
    ctx.beginPath();
    const shadowRx = walker.kind === "human" ? 4.5 * scale : 6.5 * scale;
    const shadowRy = walker.kind === "human" ? 1.8 * scale : 2.0 * scale;
    ctx.ellipse(walker.x, footY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(5, 8, 16, ${(0.55 * walker.alpha).toFixed(3)})`;
    ctx.fill();

    // Gambar sprite pixel-art tajam (imageSmoothingEnabled = false)
    if (sprite) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = walker.alpha;
      ctx.drawImage(
        sprite,
        walker.x - width / 2,
        footY - height,
        width,
        height
      );
      ctx.restore();
    }
  }
}
