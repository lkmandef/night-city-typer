/**
 * Logika murni untuk tanah kota, trotoar, lajur karakter, dan perabot jalan (FR-20).
 * Catatan arsitektur: file ini murni TypeScript, tidak boleh mengimpor React atau Canvas DOM.
 */

import {
  FURNITURE_RATIOS,
  SIDEWALK_H,
  WALKER_DEPTH_SCALE,
  WALKER_LANES,
} from "./config";
import type { Building } from "./types";
import { nextRng } from "./walkers";

export type FurnitureKind = "lamp" | "tree" | "bench" | "car";

export interface StreetFurniture {
  kind: FurnitureKind;
  x: number; // posisi x dunia
  yOffset: number; // offset y relatif terhadap groundY
  buildingId: number;
}

/**
 * Menghitung tinggi tanah adaptif dan status dekorasi:
 * - groundY dasar = 85% dari tinggi viewport.
 * - Jika groundHeight di layar kurang dari 60 CSS px (misalnya keyboard virtual HP terbuka),
 *   sembunyikan perabot dan pantulan (showDecorations = false).
 * - Menjaga agar tanah tidak menutupi zona huruf.
 */
export function computeAdaptiveGround(
  viewportHeight: number,
  worldScale = 1.0
): { groundY: number; groundHeight: number; showDecorations: boolean } {
  if (viewportHeight <= 0) {
    return { groundY: 0, groundHeight: 0, showDecorations: false };
  }

  const baseGroundY = Math.round(viewportHeight * 0.85);
  const groundHeight = viewportHeight - baseGroundY;

  // Jika groundHeight < 60 CSS px, sembunyikan dekorasi perabot dan pantulan
  const showDecorations = groundHeight >= 60;

  // Pastikan groundY menyisakan ruang minimal untuk fasad gedung berhuruf (~132 px dunia)
  const minRequiredWorldY = 132 * worldScale;
  const safeGroundY = Math.max(minRequiredWorldY, baseGroundY);

  return {
    groundY: safeGroundY,
    groundHeight: viewportHeight - safeGroundY,
    showDecorations,
  };
}

/**
 * Menghitung offset y lajur walker di trotoar (0 <= laneIndex < WALKER_LANES).
 * Trotoar setinggi SIDEWALK_H (14 px dunia).
 * Semua lajur berada dalam rentang trotoar.
 */
export function getWalkerLaneY(laneIndex: number): number {
  const lanes = Math.max(1, WALKER_LANES);
  const clampedIndex = Math.max(0, Math.min(lanes - 1, laneIndex));
  const minOffset = 3;
  const maxOffset = SIDEWALK_H - 3;

  if (lanes === 1) return (minOffset + maxOffset) / 2;
  return minOffset + (clampedIndex / (lanes - 1)) * (maxOffset - minOffset);
}

/**
 * Menghitung faktor skala kedalaman walker berdasarkan indeks lajur:
 * Lajur lebih dekat ke jalan (indeks lebih tinggi) sedikit lebih besar (0.90 .. 1.15).
 */
export function getWalkerDepthScale(laneIndex: number): number {
  const lanes = Math.max(1, WALKER_LANES);
  const clampedIndex = Math.max(0, Math.min(lanes - 1, laneIndex));
  const { min, max } = WALKER_DEPTH_SCALE;

  if (lanes === 1) return (min + max) / 2;
  return min + (clampedIndex / (lanes - 1)) * (max - min);
}

/**
 * Menghasilkan perabot jalan deterministik untuk sebuah gedung dari seed:
 * - Paling banyak satu perabot per gedung.
 * - Berada di dalam rentang koordinat gedung [b.x, b.x + b.width].
 * - Tidak menghalangi pintu (hasDoor).
 * - Lampu: ~35%, Pohon: ~20%, Bangku: ~10%, Mobil: ~10%, Kosong: ~25%.
 */
export function getBuildingFurniture(
  building: Building,
  worldSeed: number,
  ratios = FURNITURE_RATIOS
): StreetFurniture | null {
  // Hanya gedung dengan lebar cukup (minimal 30 px) dan bukan yang sedang runtuh
  if (building.width < 30 || building.state === "collapsing") {
    return null;
  }

  let s = (worldSeed ^ Math.imul(building.id, 7919)) | 0;

  // 1. Tentukan jenis perabot berdasarkan rasio probabilitas
  let r: number;
  [r, s] = nextRng(s);

  let kind: FurnitureKind;
  const pLamp = ratios.lamp;
  const pTree = pLamp + ratios.tree;
  const pBench = pTree + ratios.bench;
  const pCar = pBench + ratios.car;

  if (r < pLamp) {
    kind = "lamp";
  } else if (r < pTree) {
    kind = "tree";
  } else if (r < pBench) {
    kind = "bench";
  } else if (r < pCar) {
    kind = "car";
  } else {
    // 25% kosong
    return null;
  }

  // 2. Tentukan posisi x dan yOffset
  let x: number;
  let yOffset: number;

  const minX = building.x + 8;
  const maxX = building.x + building.width - 8;
  const midX = building.x + building.width / 2;

  switch (kind) {
    case "lamp": {
      // Lampu jalan di dekat tepi trotoar / curb
      [r, s] = nextRng(s);
      x = r < 0.5 ? minX : maxX;
      yOffset = SIDEWALK_H - 2;
      break;
    }
    case "tree": {
      // Pohon pot di trotoar
      yOffset = 4;
      x = midX;
      if (building.hasDoor) {
        // Jangan tutupi pintu di tengah
        [r, s] = nextRng(s);
        x = r < 0.5 ? minX + 2 : maxX - 2;
      }
      break;
    }
    case "bench": {
      // Bangku di dekat fasad podium
      yOffset = 2;
      x = midX;
      if (building.hasDoor) {
        [r, s] = nextRng(s);
        x = r < 0.5 ? minX + 2 : maxX - 2;
      }
      break;
    }
    case "car": {
      // Mobil parkir di jalan (di bawah curb, tidak menutupi trotoar)
      yOffset = SIDEWALK_H + 4;
      x = midX;
      break;
    }
  }

  // Pastikan posisi x selalu di dalam rentang gedung
  const clampedX = Math.max(building.x + 4, Math.min(building.x + building.width - 4, x));

  return {
    kind,
    x: clampedX,
    yOffset,
    buildingId: building.id,
  };
}
