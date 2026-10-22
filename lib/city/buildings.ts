import type { Building, BuildingKind, BuildingWindow, CityState } from "./types";
import { mulberry32 } from "./rng";

/**
 * Menentukan tipe bangunan berdasarkan karakter:
 * - vokal (a, i, u, e, o) -> "tower"
 * - konsonan -> "block"
 * - angka -> "house"
 * - lainnya (tanda baca, simbol) -> "lamp"
 */
export function pickKind(char: string): BuildingKind {
  const c = char.toLowerCase();
  if (/[aiueo]/.test(c)) return "tower";
  if (/[a-z]/.test(c)) return "block";
  if (/[0-9]/.test(c)) return "house";
  return "lamp";
}

export function isUpper(char: string): boolean {
  return /[A-Z]/.test(char);
}

/**
 * Membuat satu instance Building secara deterministik berdasarkan seed.
 */
export function makeBuilding(
  char: string,
  index: number,
  x: number,
  worldSeed: number
): Building {
  // RNG per karakter dengan kombinasi seed dunia, kode karakter dasar, dan urutan index
  const baseCharCode = char.toLowerCase().charCodeAt(0);
  const seed = worldSeed + baseCharCode * 131 + index * 977;
  const rand = mulberry32(seed);

  const kind = pickKind(char);
  const width = Math.round(36 + rand() * 40); // 36..76 px

  const baseHeight =
    kind === "tower" ? 220 : kind === "block" ? 140 : kind === "house" ? 70 : 45;
  const variation = 0.7 + rand() * 0.7; // 0.7..1.4
  const heightMultiplier = isUpper(char) ? 1.3 : 1.0;
  const height = Math.round(baseHeight * variation * heightMultiplier);

  const cols = kind === "lamp" ? 1 : Math.max(2, Math.floor(width / 14));
  const rows = kind === "lamp" ? 1 : Math.max(2, Math.floor(height / 18));

  // Buat grid jendela
  const windows: BuildingWindow[] = [];
  const windowOrders: { index: number; order: number; stayDark: boolean }[] = [];

  let winIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const stayDark = rand() < 0.15; // 15% dibiarkan padam natural
      const hue = rand() > 0.25 ? "warm" : "cool";

      windows.push({
        col: c,
        row: r,
        lit: false,
        litAt: 0,
        hue,
      });

      windowOrders.push({
        index: winIdx,
        order: rand(),
        stayDark,
      });
      winIdx++;
    }
  }

  // Atur urutan menyala bertahap (jeda 30 - 120 ms per jendela)
  windowOrders.sort((a, b) => a.order - b.order);
  let accumulatedDelay = 0;
  for (const item of windowOrders) {
    if (item.stayDark) {
      windows[item.index].litAt = -1;
    } else {
      accumulatedDelay += Math.round(30 + rand() * 90);
      windows[item.index].litAt = accumulatedDelay;
    }
  }

  return {
    id: index,
    char,
    kind,
    x,
    width,
    height,
    grow: 0,
    windows,
    state: "growing",
    collapse: 0,
    lightTimer: 0,
  };
}

/**
 * Memperbarui status animasi pertumbuhan gedung dan nyala jendela.
 */
export function updateBuilding(building: Building, dt: number): void {
  if (building.state === "growing") {
    // Tumbuh dari 0 ke 1 selama sekitar 600 ms
    building.grow = Math.min(1, building.grow + dt / 600);
    if (building.grow >= 1) {
      building.state = "alive";
    }
  }

  // Setelah grow > 0.6, jendela mulai dinyalakan bertahap
  if (building.grow > 0.6) {
    building.lightTimer = (building.lightTimer ?? 0) + dt;
    for (const win of building.windows) {
      if (!win.lit && win.litAt >= 0 && building.lightTimer >= win.litAt) {
        win.lit = true;
      }
    }
  }
}

/**
 * Memperbarui seluruh item di dalam kota.
 */
export function updateCity(state: CityState, dt: number): void {
  for (const item of state.items) {
    if ("windows" in item) {
      updateBuilding(item, dt);
    }
  }
}
