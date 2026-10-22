import type { Building, BuildingKind, BuildingWindow, CityState, Separator } from "./types";
import { mulberry32 } from "./rng";
import { applySilhouetteCap } from "./camera";
import { getGlyph } from "./glyphs";

// ==========================================
// Konstanta Zona Huruf & Tata Letak Fasad
// ==========================================
export const LETTER_BASELINE = 60; // Jarak dari tanah ke baris huruf paling bawah (px dunia sebelum worldScale)
export const LETTER_CELL = 11; // Ukuran sel persegi (px dunia sebelum worldScale)
export const LETTER_SIDE_MARGIN = 6; // Margin samping gedung berhuruf (px dunia)
export const LETTER_ROOF_MARGIN = 22; // Margin atap di atas zona huruf (~2 sel = 22 px)
export const LETTER_BUILDING_GAP = 6; // Celah antar gedung berhuruf bersebelahan (px dunia)
export const LETTER_DIM_WINDOW_RATIO = 0.12; // Hanya ~12% jendela di luar zona huruf menyala

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
 * Untuk karakter berhuruf/ber-glyph, garis dasar huruf berada pada LETTER_BASELINE
 * yang seragam di seluruh gedung, dengan ukuran sel persegi LETTER_CELL.
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
  const glyph = getGlyph(char);

  let width: number;
  let height: number;

  if (glyph) {
    // 2. Lebar gedung berhuruf = 5*LETTER_CELL + 2*margin samping; variasi maksimal ±10%
    const baseWidth = 5 * LETTER_CELL + 2 * LETTER_SIDE_MARGIN; // 67 px
    const randW = rand();
    width = Math.round(baseWidth * (0.95 + randW * 0.1)); // 64..70 px (±5% dari 67 px)

    // 1. Tinggi minimum = LETTER_BASELINE + 7*LETTER_CELL + margin atap (22 px) = 159 px
    const minHeight = LETTER_BASELINE + 7 * LETTER_CELL + LETTER_ROOF_MARGIN;
    // Variasi tinggi hanya boleh menambah lantai DI ATAS zona huruf (jendela acak redup)
    const extraFloors =
      kind === "tower"
        ? Math.round(50 + rand() * 50) // tower lebih tinggi
        : kind === "block"
        ? Math.round(rand() * 30)
        : 0; // house/pendek

    const heightMultiplier = isUpper(char) ? 1.3 : 1.0;
    height = Math.round((minHeight + extraFloors) * heightMultiplier);
  } else {
    // Karakter tanpa glyph (simbol atau tanda baca tanpa font piksel)
    const minWidth = 36;
    width = Math.round(minWidth + rand() * 40); // 36..76 px
    const baseHeight =
      kind === "tower" ? 220 : kind === "block" ? 140 : kind === "house" ? 70 : 45;
    const variation = 0.7 + rand() * 0.7; // 0.7..1.4
    const heightMultiplier = isUpper(char) ? 1.3 : 1.0;
    height = Math.round(baseHeight * variation * heightMultiplier);
  }

  // Buat grid jendela
  const windows: BuildingWindow[] = [];
  const regularWindowOrders: { index: number; order: number; stayDark: boolean }[] = [];
  const letterWindows: BuildingWindow[] = [];

  let winIdx = 0;

  if (glyph) {
    // A. Zona huruf 5x7:
    // row 0..6 (glyphRow 0 di atas sampai 6 di bawah), col 0..4 (kiri ke kanan)
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        const isLetterPixel = glyph[r][c] === "1";

        const win: BuildingWindow = {
          col: c,
          row: r, // 0 di atas, 6 di bawah
          lit: false,
          litAt: isLetterPixel ? 0 : -1,
          hue: "warm",
          isLetter: isLetterPixel,
        };

        windows.push(win);
        if (isLetterPixel) {
          letterWindows.push(win);
        }
        winIdx++;
      }
    }

    // Urutkan jendela huruf menyala berurutan dari kiri ke kanan (kolom c, lalu baris r)
    letterWindows.sort((a, b) => {
      if (a.col !== b.col) return a.col - b.col;
      return a.row - b.row;
    });
    letterWindows.forEach((win, idx) => {
      win.litAt = idx * 30; // jeda 30 ms per jendela
    });

    // B. Jendela di luar zona huruf (bawah & atas):
    // 1. Lantai bawah (di bawah LETTER_BASELINE = 60 px)
    const lowerFloors = 2;
    const colsOutside = 3;
    for (let f = 0; f < lowerFloors; f++) {
      for (let c = 0; c < colsOutside; c++) {
        const stayDark = rand() > LETTER_DIM_WINDOW_RATIO; // hanya ~12% menyala
        const win: BuildingWindow = {
          col: c,
          row: 10 + f, // penanda lantai bawah
          lit: false,
          litAt: 0,
          hue: "warm",
          isLetter: false,
        };
        windows.push(win);
        regularWindowOrders.push({
          index: winIdx,
          order: rand(),
          stayDark,
        });
        winIdx++;
      }
    }

    // 2. Lantai atas (di atas zona huruf: > 137 px hingga height)
    const extraHeight = height - (LETTER_BASELINE + 7 * LETTER_CELL + 10);
    const upperFloors = Math.max(0, Math.floor(extraHeight / 16));
    for (let f = 0; f < upperFloors; f++) {
      for (let c = 0; c < colsOutside; c++) {
        const stayDark = rand() > LETTER_DIM_WINDOW_RATIO; // hanya ~12% menyala
        const win: BuildingWindow = {
          col: c,
          row: 30 + f, // penanda lantai atas
          lit: false,
          litAt: 0,
          hue: "warm",
          isLetter: false,
        };
        windows.push(win);
        regularWindowOrders.push({
          index: winIdx,
          order: rand(),
          stayDark,
        });
        winIdx++;
      }
    }
  } else {
    // Non-glyph building (misalnya lampu jalan)
    const cols = kind === "lamp" ? 1 : Math.max(2, Math.floor(width / 14));
    const rows = kind === "lamp" ? 1 : Math.max(2, Math.floor(height / 18));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stayDark = rand() < 0.15;
        const hue = rand() > 0.25 ? "warm" : "cool";

        const win: BuildingWindow = {
          col: c,
          row: r,
          lit: false,
          litAt: 0,
          hue,
          isLetter: false,
        };

        windows.push(win);
        regularWindowOrders.push({
          index: winIdx,
          order: rand(),
          stayDark,
        });
        winIdx++;
      }
    }
  }

  // Atur urutan menyala bertahap untuk jendela reguler di luar zona huruf (jeda 30 - 120 ms)
  regularWindowOrders.sort((a, b) => a.order - b.order);
  let accumulatedDelay = 0;
  for (const item of regularWindowOrders) {
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
    collapseTimer: 0,
    letterTimer: 0,
    glyph,
    letterBaseline: glyph ? LETTER_BASELINE : undefined,
    letterCell: glyph ? LETTER_CELL : undefined,
  };
}

/**
 * Memperbarui status animasi pertumbuhan, nyala jendela, atau runtuhnya gedung.
 */
export function updateBuilding(building: Building, dt: number): void {
  if (building.state === "growing") {
    // Tumbuh dari 0 ke 1 selama sekitar 600 ms
    building.grow = Math.min(1, building.grow + dt / 600);
    if (building.grow >= 1) {
      building.state = "alive";
    }
  }

  // Setelah grow > 0.6 dan belum collapsing:
  if (building.grow > 0.6 && building.state !== "collapsing") {
    building.lightTimer = (building.lightTimer ?? 0) + dt;

    // 1. Jendela reguler di luar zona huruf menyala bertahap
    for (const win of building.windows) {
      if (!win.isLetter && !win.lit && win.litAt >= 0 && building.lightTimer >= win.litAt) {
        win.lit = true;
      }
    }

    // 2. Jendela huruf menyala berurutan (kiri ke kanan) setelah gedung selesai tumbuh (grow >= 1)
    if (building.grow >= 1) {
      building.letterTimer = (building.letterTimer ?? 0) + dt;
      for (const win of building.windows) {
        if (win.isLetter && !win.lit && win.litAt >= 0 && building.letterTimer >= win.litAt) {
          win.lit = true;
        }
      }
    }
  }

  // Animasi runtuh (collapsing) saat tombol backspace ditekan
  if (building.state === "collapsing") {
    building.collapseTimer = (building.collapseTimer ?? 0) + dt;

    // 1. Huruf padam lebih dulu sebelum gedung runtuh
    for (const win of building.windows) {
      if (win.isLetter) {
        win.lit = false;
      }
    }

    // 2. Jendela lain padam berurutan dari atas ke bawah selama ~200 ms
    const maxRow = building.windows.reduce((max, w) => Math.max(max, w.row), 0);
    const fadeRatio = Math.min(1, building.collapseTimer / 200);
    for (const win of building.windows) {
      if (!win.isLetter && win.row >= Math.floor((1 - fadeRatio) * (maxRow + 1))) {
        win.lit = false;
      }
    }

    // 3. Collapse gedung naik dari 0 ke 1 selama ~700 ms
    if (building.collapseTimer > 150) {
      building.collapse = Math.min(1, (building.collapseTimer - 150) / 700);
    }
  }
}

/**
 * Memperbarui status pemisah (muncul atau mundur saat backspace).
 */
export function updateSeparator(sep: Separator, dt: number): void {
  if (sep.state === "entering" || sep.state === undefined) {
    sep.progress = Math.min(1, sep.progress + dt / 400);
    if (sep.progress >= 1) {
      sep.state = "alive";
    }
  } else if (sep.state === "collapsing") {
    sep.progress = Math.max(0, sep.progress - dt / 300);
  }
}

/**
 * Memperbarui seluruh item di dalam kota serta menghapus item yang sudah selesai runtuh.
 */
export function updateCity(state: CityState, dt: number, initialCursorX = 60): void {
  for (const item of state.items) {
    if ("windows" in item) {
      updateBuilding(item, dt);
    } else {
      updateSeparator(item, dt);
    }
  }

  // Batasi item aktif maksimal 200, sisanya dipadatkan jadi siluet
  applySilhouetteCap(state.items, 200);

  // Hapus item dari ujung kanan jika sudah selesai runtuh
  let removedAny = false;
  while (state.items.length > 0) {
    const last = state.items[state.items.length - 1];
    const isFinishedBuilding =
      "windows" in last && last.state === "collapsing" && last.collapse >= 1;
    const isFinishedSeparator =
      "progress" in last && last.state === "collapsing" && last.progress <= 0;

    if (isFinishedBuilding || isFinishedSeparator) {
      state.items.pop();
      removedAny = true;
    } else {
      break;
    }
  }

  // Kembalikan posisi cursorX ke ujung item terakhir setelah penghapusan
  if (removedAny) {
    if (state.items.length === 0) {
      state.cursorX = initialCursorX;
    } else {
      const last = state.items[state.items.length - 1];
      const gap =
        "glyph" in last && last.glyph
          ? LETTER_BUILDING_GAP
          : ("windows" in last ? 4 : 0);
      state.cursorX = last.x + last.width + gap;
    }
  }
}
