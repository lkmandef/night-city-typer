import { describe, expect, it } from "vitest";
import { getGlyph, GLYPHS } from "@/lib/city/glyphs";
import {
  CELL,
  LETTER_BASELINE,
  LETTER_CELL,
  LETTER_MAX_GAP,
  LETTER_MIN_GAP,
  makeBuilding,
  PODIUM_ROWS,
  updateBuilding,
} from "@/lib/city/buildings";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";
import TuningPanel, { isTuneRequested } from "@/components/TuningPanel";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("Font Piksel 5x7 & Fasad Hidup (FR-15)", () => {
  it("glyph H, A, L, O berbentuk benar sesuai matriks 5x7", () => {
    const expectedH = [
      "10001",
      "10001",
      "10001",
      "11111",
      "10001",
      "10001",
      "10001",
    ];
    const expectedA = [
      "01110",
      "10001",
      "10001",
      "11111",
      "10001",
      "10001",
      "10001",
    ];
    const expectedL = [
      "10000",
      "10000",
      "10000",
      "10000",
      "10000",
      "10000",
      "11111",
    ];
    const expectedO = [
      "01110",
      "10001",
      "10001",
      "10001",
      "10001",
      "10001",
      "01110",
    ];

    expect(GLYPHS["H"]).toEqual(expectedH);
    expect(GLYPHS["A"]).toEqual(expectedA);
    expect(GLYPHS["L"]).toEqual(expectedL);
    expect(GLYPHS["O"]).toEqual(expectedO);

    // Pastikan getGlyph menangani huruf kecil dan kapital
    expect(getGlyph("h")).toEqual(expectedH);
    expect(getGlyph("H")).toEqual(expectedH);
    expect(getGlyph("a")).toEqual(expectedA);
    expect(getGlyph("l")).toEqual(expectedL);
    expect(getGlyph("o")).toEqual(expectedO);
  });

  it("getGlyph mengembalikan undefined untuk karakter tak dikenal", () => {
    expect(getGlyph("~")).toBeUndefined();
    expect(getGlyph(" ")).toBeUndefined();
    expect(getGlyph("")).toBeUndefined();
  });

  it("makeBuilding mengisi zona huruf pada satu grid fasad terpadu sesuai matriks glyph", () => {
    const testChars = ["H", "A", "L", "O", "h", "a", "l", "o"];

    for (const char of testChars) {
      const b = makeBuilding(char, 0, 0, 777);
      const glyph = getGlyph(char);

      expect(b.glyph).toBeDefined();
      expect(b.glyph).toEqual(glyph);

      const cols = b.cols ?? 5;
      const startCol = Math.floor((cols - 5) / 2);

      // Zona huruf berada pada lantai f = 5..11 (y = 55 px s/d 132 px)
      for (let f = 5; f <= 11; f++) {
        const glyphRow = 11 - f; // f = 11 baris atas (0), f = 5 baris bawah (6)
        for (let c = 0; c < 5; c++) {
          const col = startCol + c;
          const win = b.windows.find((w) => w.col === col && w.row === f);
          expect(win).toBeDefined();
          if (!win || !glyph) continue;

          const shouldBeLitPixel = glyph[glyphRow][c] === "1";

          if (shouldBeLitPixel) {
            expect(win.isLetter).toBe(true);
            expect(win.hue).toBe("warm");
          } else {
            // Jendela dalam zona huruf yang bukan bagian huruf adalah isZone = true (redup)
            expect(win.isLetter).toBe(false);
            expect(win.isZone).toBe(true);
          }
        }
      }
    }
  });

  it("semua jendela di satu gedung memakai ukuran sel sama dan huruf selalu bagian dari grid", () => {
    const sampleChars = ["W", "M", "E", "3", "7", "x"];

    for (let i = 0; i < sampleChars.length; i++) {
      const char = sampleChars[i];
      const b = makeBuilding(char, i, i * 80, 54321);
      const cols = b.cols ?? 5;
      const startCol = Math.floor((cols - 5) / 2);

      // 1. Seluruh gedung berhuruf memiliki letterCell = 11 px
      expect(b.letterCell).toBe(CELL);
      expect(b.letterCell).toBe(11);

      // 2. Setiap jendela memiliki koordinat baris dan kolom bilangan bulat
      const coordinateSet = new Set<string>();
      for (const win of b.windows) {
        expect(win.col).toBeGreaterThanOrEqual(0);
        expect(win.col).toBeLessThan(cols);
        expect(win.row).toBeGreaterThanOrEqual(0);

        const key = `${win.col},${win.row}`;
        expect(coordinateSet.has(key)).toBe(false); // Tidak ada jendela tumpang tindih
        coordinateSet.add(key);

        // 3. Huruf selalu bagian dari grid di zona huruf 5x7
        if (win.isLetter) {
          expect(win.row).toBeGreaterThanOrEqual(PODIUM_ROWS);
          expect(win.row).toBeLessThan(PODIUM_ROWS + 7);
          expect(win.col).toBeGreaterThanOrEqual(startCol);
          expect(win.col).toBeLessThan(startCol + 5);
        }
      }
    }
  });

  it("semua gedung berhuruf memiliki garis dasar seragam, sel persegi, dan variasi siluet", () => {
    const sampleChars = ["A", "b", "C", "1", "9", "Z", "k", "o"];

    for (let i = 0; i < sampleChars.length; i++) {
      const char = sampleChars[i];
      const b = makeBuilding(char, i, i * 80, 12345);

      // 1. Garis dasar seragam di LETTER_BASELINE (55 px dari tanah = PODIUM_ROWS * CELL)
      expect(b.letterBaseline).toBe(LETTER_BASELINE);
      expect(b.letterBaseline).toBe(55);

      // 2. Sel zona huruf persegi berukuran CELL (11 px)
      expect(b.letterCell).toBe(CELL);
      expect(b.letterCell).toBe(11);

      // 3. Tinggi minimum gedung mencakup baseline + 7 cell + lantai ekstra
      expect(b.height).toBeGreaterThanOrEqual(150);

      // 4. Lebar gedung berhuruf adalah kelipatan sel dengan kolom ganjil (hanya 5 atau 7 kolom)
      expect([55, 77]).toContain(b.width);
      expect([5, 7]).toContain(b.cols);

      // 5. Celah antar gedung berada dalam rentang nyaman (4 sampai 8 px)
      expect(b.gap).toBeGreaterThanOrEqual(LETTER_MIN_GAP);
      expect(b.gap).toBeLessThanOrEqual(LETTER_MAX_GAP);

      // 6. Memiliki bentuk atap yang terdefinisi
      expect(["flat", "setback", "watertank", "antenna"]).toContain(b.roofKind);
    }
  });

  it("kata 'HALO' menghasilkan empat zona huruf yang sejajar pada ketinggian yang sama", () => {
    let state = createInitialCityState(42);
    const word = "HALO";

    for (const char of word) {
      state = cityReducer(state, { type: "TYPE_CHAR", char });
    }

    expect(state.items).toHaveLength(4);

    const baselines: number[] = [];
    const cellSizes: number[] = [];
    const topOfLetters: number[] = [];

    for (const item of state.items) {
      if ("glyph" in item && item.glyph) {
        expect(item.letterBaseline).toBe(LETTER_BASELINE);
        expect(item.letterCell).toBe(LETTER_CELL);

        baselines.push(item.letterBaseline ?? 0);
        cellSizes.push(item.letterCell ?? 0);
        topOfLetters.push((item.letterBaseline ?? 0) + 7 * (item.letterCell ?? 0));
      }
    }

    // Seluruh gedung memiliki baseline 55 px
    expect(baselines).toEqual([55, 55, 55, 55]);
    // Seluruh gedung memiliki ukuran sel persegi 11 px
    expect(cellSizes).toEqual([11, 11, 11, 11]);
    // Ketinggian puncak huruf pada keempat gedung sejajar persis pada y = 132 px (55 + 77)
    expect(topOfLetters).toEqual([132, 132, 132, 132]);

    // Celah antar gedung berurutan berada dalam rentang serasi (4 sampai 8 px)
    for (let i = 0; i < state.items.length - 1; i++) {
      const current = state.items[i];
      const next = state.items[i + 1];
      const gap = next.x - (current.x + current.width);
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(8);
      if ("gap" in current && current.gap !== undefined) {
        expect(gap).toBe(current.gap);
      }
    }
  });

  it("makeBuilding dengan karakter ber-glyph menghasilkan output deterministik", () => {
    const b1 = makeBuilding("H", 2, 80, 4242);
    const b2 = makeBuilding("H", 2, 80, 4242);

    expect(b1).toEqual(b2);
    expect(b1.glyph).toEqual(b2.glyph);
    expect(b1.width).toBe(b2.width);
    expect(b1.height).toBe(b2.height);
    expect(b1.windows.length).toBe(b2.windows.length);
    expect(b1.letterBaseline).toBe(b2.letterBaseline);
    expect(b1.letterCell).toBe(b2.letterCell);
    expect(b1.roofKind).toBe(b2.roofKind);
    expect(b1.gap).toBe(b2.gap);
    expect(b1.cols).toBe(b2.cols);
  });

  it("huruf menyala setelah gedung selesai tumbuh dan padam seketika saat backspace (collapsing)", () => {
    const b = makeBuilding("A", 0, 0, 1234);

    // 1. Saat baru dibuat, belum ada jendela yang menyala
    expect(b.windows.some((w) => w.lit)).toBe(false);

    // 2. Selama tumbuh (grow < 1), jendela huruf belum menyala
    updateBuilding(b, 500); // grow ~ 0.83
    const letterWindowsBeforeGrow = b.windows.filter((w) => w.isLetter && w.lit);
    expect(letterWindowsBeforeGrow.length).toBe(0);

    // 3. Setelah selesai tumbuh (grow = 1, alive), jendela huruf menyala berurutan
    updateBuilding(b, 200); // grow = 1, state alive
    expect(b.grow).toBe(1);
    expect(b.state).toBe("alive");

    // Lanjutkan waktu 1000 ms agar seluruh jendela huruf menyala
    updateBuilding(b, 1000);
    const letterWindows = b.windows.filter((w) => w.isLetter);
    expect(letterWindows.length).toBeGreaterThan(0);
    expect(letterWindows.every((w) => w.lit)).toBe(true);

    // 4. Saat collapsing (backspace), huruf padam lebih dulu sebelum badan gedung runtuh
    b.state = "collapsing";
    updateBuilding(b, 50); // runtuh baru 50ms (sebelum collapse gedung > 150ms)

    const letterWindowsAfterCollapse = b.windows.filter((w) => w.isLetter && w.lit);
    expect(letterWindowsAfterCollapse.length).toBe(0); // Huruf langsung padam seketika
    expect(b.collapse).toBe(0); // Badan gedung belum runtuh (jeda 150ms)
  });

  it("panel penyetel tidak dirender tanpa ?tune=1 dan aktif saat ?tune=1", () => {
    // 1. Verifikasi deteksi query parameter URL
    expect(isTuneRequested("")).toBe(false);
    expect(isTuneRequested("?debug=1")).toBe(false);
    expect(isTuneRequested("?tune=0")).toBe(false);
    expect(isTuneRequested("?tune=1")).toBe(true);
    expect(isTuneRequested("?foo=bar&tune=1")).toBe(true);

    // 2. Render komponen TuningPanel tanpa ?tune=1 menghasilkan markup kosong (null)
    if (typeof window !== "undefined") {
      window.location.search = "";
    }
    const htmlWithoutTune = renderToStaticMarkup(React.createElement(TuningPanel));
    expect(htmlWithoutTune).toBe("");
  });

  it("tidak ada gedung berhuruf dengan 9 kolom (hanya 5 atau 7 kolom dengan bobot 65% dan 35%)", () => {
    for (let i = 0; i < 50; i++) {
      const b = makeBuilding(String.fromCharCode(65 + (i % 26)), i, i * 70, 9988);
      expect(b.cols).not.toBe(9);
      expect([5, 7]).toContain(b.cols);
      expect([55, 77]).toContain(b.width);
    }
  });

  it("jendela non-huruf di zona huruf 5x7 memakai SATU warna saja (warna dominan gedung)", () => {
    const chars = ["H", "A", "L", "O", "X", "Y"];
    for (const char of chars) {
      const b = makeBuilding(char, 0, 0, 789);
      const zoneNonLetterWindows = b.windows.filter((w) => w.isZone);
      expect(zoneNonLetterWindows.length).toBeGreaterThan(0);
      const hues = new Set(zoneNonLetterWindows.map((w) => w.hue));
      expect(hues.size).toBe(1); // Mono / satu warna seragam
      expect(hues.has(b.dominantHue ?? "warm")).toBe(true);
    }
  });

  it("warna minor (aksen) dibatasi maksimal 2% dari jendela fasad non-huruf", () => {
    let totalWindows = 0;
    let accentCount = 0;
    for (let i = 0; i < 100; i++) {
      const b = makeBuilding(String.fromCharCode(65 + (i % 26)), i, i * 60, 1122 + i);
      for (const w of b.windows) {
        if (!w.isLetter && !w.isZone) {
          totalWindows++;
          if ((w.rawColorIndex ?? 0) < 0.02) {
            accentCount++;
          }
        }
      }
    }
    const ratio = accentCount / totalWindows;
    expect(ratio).toBeLessThanOrEqual(0.025); // ~2%, di bawah batas toleransi
  });

  it("lebar pemisah taman dan sungai berkisar antara 70 sampai 110 px", () => {
    let state = createInitialCityState(777);
    state = cityReducer(state, { type: "TYPE_CHAR", char: "a" });
    for (let i = 0; i < 30; i++) {
      state = cityReducer(state, { type: "SPACE" });
      const last = state.items[state.items.length - 1];
      if ("kind" in last && (last.kind === "river" || last.kind === "park")) {
        expect(last.width).toBeGreaterThanOrEqual(70);
        expect(last.width).toBeLessThanOrEqual(110);
      }
      state = cityReducer(state, { type: "TYPE_CHAR", char: "b" });
    }
  });
});
