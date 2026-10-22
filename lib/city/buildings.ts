import type { Building, BuildingKind, BuildingWindow, CityState, Separator } from "./types";
import { mulberry32 } from "./rng";
import { applySilhouetteCap } from "./camera";
import { getGlyph } from "./glyphs";

// ==========================================
// Konstanta Zona Huruf & Tata Letak Fasad
// ==========================================
export const LETTER_BASELINE = 60; // Jarak dari tanah ke baris huruf paling bawah (px dunia sebelum worldScale)
export const LETTER_CELL = 11; // Ukuran sel persegi (px dunia sebelum worldScale)
export const LETTER_SIDE_MARGIN = 6; // Margin samping dasar gedung berhuruf (px dunia)
export const LETTER_OTHER_LIT_RATIO = 0.4; // ~40% jendela di luar zona huruf menyala
export const LETTER_HALO_LIT_RATIO = 0.12; // ~12% jendela di zona ruang napas (1 sel sekitar huruf)
export const LETTER_MIN_EXTRA_FLOORS = 2; // Tambahan lantai minimum di atas zona huruf
export const LETTER_MAX_EXTRA_FLOORS = 8; // Tambahan lantai maksimum di atas zona huruf
export const LETTER_MIN_GAP = 4; // Celah minimum antar gedung berhuruf (px)
export const LETTER_MAX_GAP = 10; // Celah maksimum antar gedung berhuruf (px)
export const LETTER_BUILDING_GAP = 6; // Celah default referensi (px)
export const LETTER_WIDTH_VARIATION = 0.1; // Variasi lebar gedung berhuruf (±10%)

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
 * Fasad gedung memakai SATU grid jendela persegi (LETTER_CELL = 11 px) dari podium
 * hingga atap. Huruf adalah jendela paling terang di fasad yang hidup, dengan zona
 * ruang napas (halo) redup di sekelilingnya, podium toko di jalan, dan variasi atap.
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
  let gap: number;
  let roofKind: "flat" | "setback" | "watertank" | "antenna";
  let hasDoor = false;

  const windows: BuildingWindow[] = [];
  const regularWindowOrders: { index: number; order: number; stayDark: boolean }[] = [];
  const letterWindows: BuildingWindow[] = [];

  let winIdx = 0;

  if (glyph) {
    // 1. Lebar gedung: 5*LETTER_CELL + 2*margin samping (67 px), variasi ±10% (60..74 px)
    const baseWidth = 5 * LETTER_CELL + 2 * LETTER_SIDE_MARGIN;
    const randW = rand();
    width = Math.round(
      baseWidth * (1 - LETTER_WIDTH_VARIATION + randW * (2 * LETTER_WIDTH_VARIATION))
    );

    // 2. Celah antar gedung bervariasi kecil: 4 sampai 10 px
    gap = Math.round(LETTER_MIN_GAP + rand() * (LETTER_MAX_GAP - LETTER_MIN_GAP));

    // 3. Tambahan lantai di atas zona huruf: acak 2 sampai 8 lantai (plus ekstra jika tower/vokal)
    const extraFloorsRange = LETTER_MAX_EXTRA_FLOORS - LETTER_MIN_EXTRA_FLOORS;
    let extraFloors = Math.round(LETTER_MIN_EXTRA_FLOORS + rand() * extraFloorsRange);
    if (kind === "tower") {
      extraFloors += Math.round(3 + rand() * 4); // Tower lebih tinggi
    }

    // Grid total lantai: 5 lantai bawah (0..4) + 7 lantai huruf (5..11) + 1 lantai halo atas (12) + ekstra
    const totalFloors = 13 + extraFloors;
    // Tinggi fisik gedung
    height = Math.round(5 + totalFloors * LETTER_CELL + 6);
    if (isUpper(char)) {
      height = Math.round(height * 1.15);
    }

    // 4. Bentuk atap acak: flat, setback, watertank, antenna
    const roofRand = rand();
    if (kind === "tower") {
      roofKind = "antenna";
    } else if (roofRand < 0.3) {
      roofKind = "flat";
    } else if (roofRand < 0.6) {
      roofKind = "setback";
    } else if (roofRand < 0.85) {
      roofKind = "watertank";
    } else {
      roofKind = "antenna";
    }

    // Pintu masuk toko di lantai dasar
    hasDoor = rand() > 0.35;

    // SATU grid jendela persegi dari lantai dasar hingga atap
    for (let f = 0; f < totalFloors; f++) {
      for (let c = 0; c < 5; c++) {
        // A. Zona Huruf 5x7 (lantai 5 sampai 11, dari y = 60 px sampai y = 126 px)
        if (f >= 5 && f <= 11) {
          const letterFloor = f - 5; // 0..6 dari bawah ke atas
          const glyphRow = 6 - letterFloor; // 0 di atas, 6 di bawah
          const isLetterPixel = glyph[glyphRow][c] === "1";

          const win: BuildingWindow = {
            col: c,
            row: f,
            lit: false,
            litAt: isLetterPixel ? 0 : -1, // dihitung nanti untuk yang isLetterPixel
            hue: "warm",
            isLetter: isLetterPixel,
          };

          windows.push(win);
          if (isLetterPixel) {
            letterWindows.push(win);
          }
        }
        // B. Ruang Napas / Halo (lantai 4 tepat di bawah huruf, dan lantai 12 tepat di atas huruf)
        else if (f === 4 || f === 12) {
          const stayDark = rand() > LETTER_HALO_LIT_RATIO; // hanya ~12% menyala
          const brightness = Math.round((0.18 + rand() * 0.12) * 100) / 100; // redup maksimal 0.30

          const win: BuildingWindow = {
            col: c,
            row: f,
            lit: false,
            litAt: 0,
            hue: "warm",
            isLetter: false,
            isHalo: true,
            brightness,
          };

          windows.push(win);
          regularWindowOrders.push({
            index: winIdx,
            order: rand(),
            stayDark,
          });
        }
        // C. Podium Toko di Dasar (lantai 0 dan 1: y = 5..26 px)
        else if (f === 0 || f === 1) {
          const stayDark = rand() > 0.75; // ~75% menyala hangat
          const win: BuildingWindow = {
            col: c,
            row: f,
            lit: false,
            litAt: 0,
            hue: "warm",
            isLetter: false,
            isStorefront: true,
            brightness: 0.85,
          };

          windows.push(win);
          regularWindowOrders.push({
            index: winIdx,
            order: rand(),
            stayDark,
          });
        }
        // D. Jendela Biasa Gedung (lantai 2-3 dan lantai atas >= 13)
        else {
          const stayDark = rand() > LETTER_OTHER_LIT_RATIO; // ~40% menyala
          const isCool = rand() < 0.10; // ~10% warna dingin
          const brightness = Math.round((0.25 + rand() * 0.30) * 100) / 100; // 0.25..0.55

          const win: BuildingWindow = {
            col: c,
            row: f,
            lit: false,
            litAt: 0,
            hue: isCool ? "cool" : "warm",
            isLetter: false,
            brightness,
          };

          windows.push(win);
          regularWindowOrders.push({
            index: winIdx,
            order: rand(),
            stayDark,
          });
        }

        winIdx++;
      }
    }

    // Urutkan jendela huruf menyala berurutan dari kiri ke kanan (kolom c, lalu baris dari atas ke bawah)
    letterWindows.sort((a, b) => {
      if (a.col !== b.col) return a.col - b.col;
      return b.row - a.row;
    });
    letterWindows.forEach((win, idx) => {
      win.litAt = idx * 30; // 30 ms jeda antar jendela huruf
    });
  } else {
    // Non-glyph building (misalnya lampu jalan atau simbol)
    width = Math.round(36 + rand() * 40);
    gap = 4;
    roofKind = kind === "tower" ? "antenna" : "flat";
    const baseHeight =
      kind === "tower" ? 220 : kind === "block" ? 140 : kind === "house" ? 70 : 45;
    const variation = 0.7 + rand() * 0.7;
    const heightMultiplier = isUpper(char) ? 1.3 : 1.0;
    height = Math.round(baseHeight * variation * heightMultiplier);

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

  // Atur urutan menyala bertahap untuk jendela non-huruf
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
    roofKind,
    gap,
    hasDoor,
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
        "gap" in last && last.gap !== undefined
          ? last.gap
          : "glyph" in last && last.glyph
          ? LETTER_BUILDING_GAP
          : ("windows" in last ? 4 : 0);
      state.cursorX = last.x + last.width + gap;
    }
  }
}
