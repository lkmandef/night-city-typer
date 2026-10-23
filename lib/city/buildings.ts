import type { Building, BuildingKind, BuildingWindow, CityState, Separator } from "./types";
import { mulberry32 } from "./rng";
import { applySilhouetteCap } from "./camera";
import { getGlyph } from "./glyphs";
import { currentConfig, GHOST_FAST_COLLAPSE_DURATION } from "./config";

// ==========================================
// Konstanta Zona Huruf & Tata Letak Fasad
// ==========================================
export const CELL = currentConfig.CELL; // 11 px dunia
export const PODIUM_ROWS = currentConfig.PODIUM_ROWS; // 5 baris lantai bawah
export const LETTER_ROWS = currentConfig.LETTER_ROWS; // 7 baris zona huruf
export const ROOF_MARGIN_ROWS = currentConfig.ROOF_MARGIN_ROWS; // 2 baris margin atap
export const LETTER_BASELINE = PODIUM_ROWS * CELL; // 55 px jarak dari tanah ke baris huruf paling bawah
export const LETTER_CELL = CELL; // 11 px ukuran sel persegi
export const LETTER_BUILDING_GAP = 6; // Celah default referensi (px)
export const LETTER_MIN_GAP = currentConfig.MIN_GAP; // 4 px
export const LETTER_MAX_GAP = currentConfig.MAX_GAP; // 8 px
export const LETTER_MIN_EXTRA_FLOORS = currentConfig.MIN_EXTRA_FLOORS; // 2 baris
export const LETTER_MAX_EXTRA_FLOORS = currentConfig.MAX_EXTRA_FLOORS; // 10 baris

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
 * Fasad gedung memakai SATU grid jendela persegi seragam (CELL = 11 px) dari podium hingga atap.
 * Semua batas vertikal kelipatan sel: PODIUM_ROWS = 5 (baseline 55 px), zona huruf = 7 baris,
 * margin atap = 2 baris, lantai atas = 2 sampai 10 baris.
 * Lebar gedung memakai jumlah kolom ganjil (5, 7, atau 9 kolom) dengan huruf 5 kolom di tengah.
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

  // 1 warna dominan per gedung (warm amber/oranye atau cool biru) dari seed
  const dominantHue: "warm" | "cool" =
    kind === "tower" ? (rand() < 0.4 ? "warm" : "cool") : rand() < 0.65 ? "warm" : "cool";

  let width: number;
  let height: number;
  let gap: number;
  let roofKind: "flat" | "setback" | "watertank" | "antenna";
  let hasDoor = false;
  let chosenCols = 5;
  let extraFloors = 2;

  const windows: BuildingWindow[] = [];
  const regularWindowOrders: { index: number; order: number }[] = [];
  const letterWindows: BuildingWindow[] = [];

  let winIdx = 0;

  if (glyph) {
    // 1. Jumlah kolom ganjil: HANYA 5 kolom (65%) atau 7 kolom (35%), tidak ada 9 kolom
    const colRand = rand();
    const w5 = currentConfig.COL_WEIGHTS[5];
    if (colRand < w5) {
      chosenCols = 5;
    } else {
      chosenCols = 7;
    }

    // Lebar gedung tepat kelipatan CELL (55 atau 77 px)
    width = chosenCols * CELL;

    // 2. Celah antar gedung berhuruf: 4 sampai 8 px
    const gapRange = currentConfig.MAX_GAP - currentConfig.MIN_GAP;
    gap = Math.round(currentConfig.MIN_GAP + rand() * gapRange);

    // 3. Tambahan lantai atas: acak 2 sampai 10 baris kelipatan sel
    const extraRange = currentConfig.MAX_EXTRA_FLOORS - currentConfig.MIN_EXTRA_FLOORS;
    extraFloors = Math.round(currentConfig.MIN_EXTRA_FLOORS + rand() * extraRange);
    if (kind === "tower") {
      extraFloors += Math.round(2 + rand() * 3); // Tower lebih tinggi
    }
    if (isUpper(char)) {
      extraFloors += 4;
    }

    // Total baris vertikal kelipatan sel: podium 5 + huruf 7 + margin atap 2 + extra
    const totalFloors = PODIUM_ROWS + LETTER_ROWS + ROOF_MARGIN_ROWS + extraFloors;
    height = totalFloors * CELL + 4; // 4 px fondasi dan list atap

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

    // Pintu kecil di lantai podium dasar pada beberapa gedung
    hasDoor = rand() < 0.45;

    // Posisi horizontal kolom huruf 5x7 berada tepat di tengah gedung
    const startCol = Math.floor((chosenCols - 5) / 2);
    const doorCol = Math.floor(chosenCols / 2);

    // SATU grid jendela persegi dari lantai podium (f = 0) sampai lantai teratas
    for (let f = 0; f < totalFloors; f++) {
      for (let c = 0; c < chosenCols; c++) {
        // Jika ada pintu di lantai dasar (f = 0) pada kolom tengah, lewati jendela di sel tersebut
        if (hasDoor && f === 0 && c === doorCol) {
          continue;
        }

        const rawLitRand = rand();
        const rawBrightnessRand = rand();
        const rawColorIndex = rand();

        // A. Zona Huruf 5x7: f dari PODIUM_ROWS (5) s/d PODIUM_ROWS + 6 (11), kolom startCol .. startCol + 4
        const inLetterZone =
          f >= PODIUM_ROWS &&
          f < PODIUM_ROWS + LETTER_ROWS &&
          c >= startCol &&
          c < startCol + 5;

        if (inLetterZone) {
          const glyphRow = PODIUM_ROWS + LETTER_ROWS - 1 - f; // f = 11 -> baris 0 (atas), f = 5 -> baris 6 (bawah)
          const glyphCol = c - startCol; // 0..4
          const isLetterPixel = glyph[glyphRow][glyphCol] === "1";

          if (isLetterPixel) {
            const win: BuildingWindow = {
              col: c,
              row: f,
              lit: false,
              litAt: 0, // diisi nanti berurutan kiri ke kanan
              hue: "warm",
              isLetter: true,
              rawLitRand: 0,
              rawBrightnessRand: 1,
              rawColorIndex: 0,
            };
            windows.push(win);
            letterWindows.push(win);
          } else {
            // Jendela dalam zona huruf yang bukan bagian huruf memakai SATU warna saja (dominantHue)
            const win: BuildingWindow = {
              col: c,
              row: f,
              lit: false,
              litAt: 0,
              hue: dominantHue,
              isLetter: false,
              isZone: true,
              rawLitRand,
              rawBrightnessRand,
              rawColorIndex,
            };
            windows.push(win);
            regularWindowOrders.push({
              index: winIdx,
              order: rand(),
            });
          }
        } else {
          // B. Ruang Napas Halo (1 sel di sekeliling zona 5x7)
          const isHalo =
            ((f === PODIUM_ROWS - 1 || f === PODIUM_ROWS + LETTER_ROWS) &&
              c >= startCol - 1 &&
              c <= startCol + 5) ||
            (f >= PODIUM_ROWS &&
              f < PODIUM_ROWS + LETTER_ROWS &&
              (c === startCol - 1 || c === startCol + 5));

          // C. Podium Toko di Lantai Bawah (f = 0 dan 1)
          const isStorefront = f === 0 || f === 1;

          const win: BuildingWindow = {
            col: c,
            row: f,
            lit: false,
            litAt: 0,
            hue: rawColorIndex < 0.65 ? "warm" : "cool",
            isLetter: false,
            isHalo,
            isStorefront,
            rawLitRand,
            rawBrightnessRand,
            rawColorIndex,
          };
          windows.push(win);
          regularWindowOrders.push({
            index: winIdx,
            order: rand(),
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
      win.litAt = idx * 28; // jeda antar pixel huruf
    });
  } else {
    // Non-glyph building (misalnya lampu jalan atau simbol)
    chosenCols = 4;
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
        const rawLitRand = rand();
        const rawBrightnessRand = rand();
        const rawColorIndex = rand();

        const win: BuildingWindow = {
          col: c,
          row: r,
          lit: false,
          litAt: 0,
          hue: rawColorIndex < 0.7 ? "warm" : "cool",
          isLetter: false,
          rawLitRand,
          rawBrightnessRand,
          rawColorIndex,
        };

        windows.push(win);
        regularWindowOrders.push({
          index: winIdx,
          order: rand(),
        });
        winIdx++;
      }
    }
  }

  // Atur urutan animasi menyala bertahap untuk jendela reguler
  regularWindowOrders.sort((a, b) => a.order - b.order);
  let accumulatedDelay = 0;
  for (const item of regularWindowOrders) {
    accumulatedDelay += Math.round(15 + rand() * 40);
    windows[item.index].litAt = accumulatedDelay;
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
    letterCell: glyph ? CELL : undefined,
    roofKind,
    gap,
    hasDoor,
    cols: chosenCols,
    extraFloors,
    dominantHue,
  };
}

/**
 * Memperbarui status animasi pertumbuhan, nyala jendela, atau runtuhnya gedung.
 */
export function updateBuilding(building: Building, dt: number): void {
  // 0. Tunda mulai tumbuh jika ada spawnDelay (agar tidak bertumpuk dengan ghost yang sedang runtuh cepat)
  if (building.spawnDelay && building.spawnDelay > 0) {
    building.spawnDelay -= dt;
    if (building.spawnDelay > 0) {
      return;
    }
  }

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

  // Animasi runtuh (collapsing)
  if (building.state === "collapsing") {
    building.collapseTimer = (building.collapseTimer ?? 0) + dt;

    // 1. Huruf padam seketika
    for (const win of building.windows) {
      if (win.isLetter) {
        win.lit = false;
      }
    }

    if (building.fastCollapse) {
      // Keruntuhan dipercepat (150 ms) jika ada elemen baru yang menempati posisinya
      building.collapse = Math.min(
        1,
        Math.max(0, building.collapseTimer) / GHOST_FAST_COLLAPSE_DURATION
      );
      for (const win of building.windows) {
        win.lit = false;
      }
    } else {
      // 2. Jendela lain padam berurutan dari atas ke bawah selama ~200 ms
      const maxRow = building.windows.reduce((max, w) => Math.max(max, w.row), 0);
      const fadeRatio = Math.min(1, Math.max(0, building.collapseTimer) / 200);
      for (const win of building.windows) {
        if (!win.isLetter && win.row >= Math.floor((1 - fadeRatio) * (maxRow + 1))) {
          win.lit = false;
        }
      }

      // 3. Collapse gedung naik dari 0 ke 1 selama ~700 ms setelah tunda 150 ms
      if (building.collapseTimer > 150) {
        building.collapse = Math.min(1, (building.collapseTimer - 150) / 700);
      }
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
    const duration = sep.fastCollapse ? GHOST_FAST_COLLAPSE_DURATION : 300;
    sep.progress = Math.max(0, sep.progress - dt / duration);
  }
}

/**
 * Memperbarui seluruh item aktif dan ghost di dalam kota serta membersihkan ghost yang selesai runtuh.
 */
export function updateCity(state: CityState, dt: number, initialCursorX = 60): void {
  // 1. Update item aktif
  for (const item of state.items) {
    if ("windows" in item) {
      updateBuilding(item, dt);
    } else {
      updateSeparator(item, dt);
    }
  }

  // 2. Update ghost item (gedung/pemisah runtuh)
  if (state.ghosts && state.ghosts.length > 0) {
    for (const ghost of state.ghosts) {
      if ("windows" in ghost) {
        updateBuilding(ghost, dt);
      } else {
        updateSeparator(ghost, dt);
      }
    }

    // Bersihkan ghost yang sudah selesai runtuh
    state.ghosts = state.ghosts.filter((ghost) => {
      if ("windows" in ghost) {
        return ghost.collapse < 1;
      } else {
        return ghost.progress > 0;
      }
    });
  }

  // Batasi item aktif maksimal 200, sisanya dipadatkan jadi siluet
  applySilhouetteCap(state.items, 200);

  // Jika items kosong, posisikan cursorX ke initialCursorX
  if (state.items.length === 0) {
    state.cursorX = initialCursorX;
  }
}
