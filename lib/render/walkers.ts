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
export function drawWalkers(
  ctx: CanvasRenderingContext2D,
  walkers: Walker[],
  groups: BuildingGroup[],
  groundY: number,
  worldScale: number,
  cameraX: number,
  worldScreenWidth: number
): void {
  // 1. Gambar gradien cahaya hangat tipis (opacity ~0.12) di tanah di bawah tiap kelompok gedung
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

  // 2. Gambar karakter dan bayangan kaki
  for (const walker of walkers) {
    if (walker.alpha <= 0) continue;

    // Culling walker yang berada di luar layar
    if (
      walker.x + 40 < cameraX ||
      walker.x - 40 > cameraX + worldScreenWidth
    ) {
      continue;
    }

    const { width, height, scale } = getWalkerDimensions(
      walker.kind,
      worldScale
    );

    const frameName = getWalkerFrameName(walker);
    const sprite = getWalkerSpriteCanvas(walker.kind, frameName, walker.dir);

    const footY = groundY + walker.laneY;

    // Bayangan elips kecil di kaki
    ctx.beginPath();
    const shadowRx = walker.kind === "human" ? 4 * scale : 6 * scale;
    const shadowRy = walker.kind === "human" ? 1.5 * scale : 1.8 * scale;
    ctx.ellipse(walker.x, footY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(10, 14, 26, ${(0.38 * walker.alpha).toFixed(3)})`;
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
