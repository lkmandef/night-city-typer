import type { Building, BuildingKind, BuildingWindow, CityState, Separator } from "./types";
import { mulberry32 } from "./rng";
import { applySilhouetteCap } from "./camera";
import { getGlyph } from "./glyphs";

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
 * Jika karakter memiliki glyph piksel 5x7, fasad atas gedung akan dialokasikan
 * sebagai zona huruf dengan grid jendela minimal 5 kolom dan 9 baris.
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

  // Lebar: 36..76 px. Untuk karakter ber-glyph minimal 52 px agar muat 5 kolom jendela
  const randWidth = rand();
  const minWidth = glyph ? 52 : 36;
  const width = Math.round(minWidth + randWidth * (76 - minWidth));

  // Tinggi: tower 220, block 140, house 70, lamp 45.
  // Untuk karakter ber-glyph, pastikan minimal cukup tinggi untuk 9 baris jendela (>= 120 px)
  const randVariation = rand();
  const variation = 0.7 + randVariation * 0.7; // 0.7..1.4
  const heightMultiplier = isUpper(char) ? 1.3 : 1.0;

  const baseHeight = glyph
    ? (kind === "tower" ? 220 : kind === "block" ? 140 : 130)
    : (kind === "tower" ? 220 : kind === "block" ? 140 : kind === "house" ? 70 : 45);

  let height = Math.round(baseHeight * variation * heightMultiplier);
  if (glyph && height < 120) {
    height = 120;
  }

  // Grid jendela: minimal 5 kolom dan 9 baris jika karakter memiliki glyph
  const cols = glyph
    ? Math.max(5, Math.floor(width / 11))
    : (kind === "lamp" ? 1 : Math.max(2, Math.floor(width / 14)));

  const rows = glyph
    ? Math.max(9, Math.floor(height / 13))
    : (kind === "lamp" ? 1 : Math.max(2, Math.floor(height / 18)));

  // Zona huruf: 7 baris jendela di bagian atas (di bawah atap margin 1 baris), 5 kolom di tengah
  const colStart = Math.floor((cols - 5) / 2);
  const letterRowTop = rows - 2; // baris atas glyph (margin 1 baris dari atap rows - 1)
  const letterRowBottom = rows - 8; // baris bawah glyph

  // Buat grid jendela
  const windows: BuildingWindow[] = [];
  const regularWindowOrders: { index: number; order: number; stayDark: boolean }[] = [];
  const letterWindows: BuildingWindow[] = [];

  let winIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const inLetterZone =
        glyph !== undefined &&
        r >= letterRowBottom &&
        r <= letterRowTop &&
        c >= colStart &&
        c < colStart + 5;

      if (inLetterZone && glyph) {
        const glyphRow = letterRowTop - r; // 0 di atas sampai 6 di bawah
        const glyphCol = c - colStart; // 0 di kiri sampai 4 di kanan
        const isLetterPixel = glyph[glyphRow][glyphCol] === "1";

        const win: BuildingWindow = {
          col: c,
          row: r,
          lit: false,
          litAt: isLetterPixel ? 0 : -1,
          hue: "warm",
          isLetter: isLetterPixel,
        };

        windows.push(win);
        if (isLetterPixel) {
          letterWindows.push(win);
        }
      } else {
        const stayDark = rand() < 0.15; // 15% dibiarkan padam natural
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
      }
      winIdx++;
    }
  }

  // 1. Urutkan jendela huruf menyala berurutan dari kiri ke kanan (jeda 30 ms per jendela)
  letterWindows.sort((a, b) => {
    if (a.col !== b.col) return a.col - b.col;
    return b.row - a.row; // dari atas ke bawah dalam kolom yang sama
  });
  letterWindows.forEach((win, idx) => {
    win.litAt = idx * 30; // 30 ms jeda antar jendela
  });

  // 2. Atur urutan menyala bertahap untuk jendela reguler di luar zona huruf (jeda 30 - 120 ms)
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
      state.cursorX = last.x + last.width + ("windows" in last ? 4 : 0);
    }
  }
}
