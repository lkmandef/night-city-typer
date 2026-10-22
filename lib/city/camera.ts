import type { CityItem } from "./types";

/**
 * Menghitung skala dunia (worldScale) responsif berdasarkan lebar viewport.
 * Rumus: clamp(lebarViewport / 1100, 0.6, 1.0).
 */
export function computeWorldScale(viewportWidth: number): number {
  if (viewportWidth <= 0) return 1.0;
  const scale = viewportWidth / 1100;
  return Math.max(0.6, Math.min(1.0, scale));
}

/**
 * Menghitung target posisi kamera (cameraTarget).
 * - Ambang batas: saat cursorX melebihi 70% dari lebar layar dunia.
 * - Target: menggeser kamera agar gedung terbaru berada di sekitar 60% layar dunia.
 * - Saat backspace / kota pendek: kamera mundur kembali hingga 0.
 */
export function computeCameraTarget(
  cursorX: number,
  worldScreenWidth: number
): number {
  if (worldScreenWidth <= 0) return 0;
  const threshold = worldScreenWidth * 0.7;
  const desiredScreenPos = worldScreenWidth * 0.6;

  if (cursorX > threshold) {
    return Math.max(0, cursorX - desiredScreenPos);
  }
  return 0;
}

/**
 * Menggerakkan kamera (cameraX) mendekati cameraTarget secara halus menggunakan lerp (0.08 per frame).
 */
export function updateCamera(
  currentX: number,
  targetX: number,
  dt: number
): number {
  if (currentX === targetX) return targetX;

  // Sesuaikan lerp factor (0.08 per 16.67ms frame) berdasarkan delta time (dt)
  const baseFrameMs = 16.67;
  const lerpRate = 0.08;
  const factor = 1 - Math.pow(1 - lerpRate, Math.max(1, dt) / baseFrameMs);

  const nextX = currentX + (targetX - currentX) * factor;

  // Snap jika sudah sangat dekat
  if (Math.abs(targetX - nextX) < 0.2) {
    return targetX;
  }
  return nextX;
}

/**
 * Culling: memeriksa apakah suatu item berada di dalam area pandang kamera (+ margin).
 */
export function isItemVisible(
  itemX: number,
  itemWidth: number,
  cameraX: number,
  worldScreenWidth: number,
  margin = 80
): boolean {
  const viewLeft = cameraX - margin;
  const viewRight = cameraX + worldScreenWidth + margin;
  return itemX + itemWidth >= viewLeft && itemX <= viewRight;
}

/**
 * Membatasi jumlah item aktif maksimal 200.
 * Item-item tertua yang melewati batas dipadatkan menjadi siluet tanpa jendela.
 */
export function applySilhouetteCap(items: CityItem[], maxActive = 200): void {
  if (items.length <= maxActive) return;

  const excess = items.length - maxActive;
  for (let i = 0; i < excess; i++) {
    const item = items[i];
    if ("windows" in item && !item.isSilhouette) {
      item.isSilhouette = true;
    }
  }
}
