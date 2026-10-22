import { describe, expect, it } from "vitest";
import { getGlyph, GLYPHS } from "@/lib/city/glyphs";
import {
  LETTER_BASELINE,
  LETTER_BUILDING_GAP,
  LETTER_CELL,
  makeBuilding,
  updateBuilding,
} from "@/lib/city/buildings";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";

describe("Font Piksel 5x7 & Zona Huruf Fasad (FR-15)", () => {
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

  it("makeBuilding mengisi zona huruf sesuai matriks glyph H, A, L, O", () => {
    const testChars = ["H", "A", "L", "O", "h", "a", "l", "o"];

    for (const char of testChars) {
      const b = makeBuilding(char, 0, 0, 777);
      const glyph = getGlyph(char);

      expect(b.glyph).toBeDefined();
      expect(b.glyph).toEqual(glyph);

      // Periksa setiap sel di dalam zona huruf 5x7 (r = 0..6, c = 0..4)
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          const win = b.windows.find((w) => w.col === c && w.row === r);
          expect(win).toBeDefined();
          if (!win || !glyph) continue;

          const shouldBeLitPixel = glyph[r][c] === "1";

          if (shouldBeLitPixel) {
            expect(win.isLetter).toBe(true);
            expect(win.hue).toBe("warm");
            expect(win.litAt).toBeGreaterThanOrEqual(0);
          } else {
            // Jendela lain di dalam zona huruf harus padam
            expect(win.isLetter).toBe(false);
            expect(win.litAt).toBe(-1);
          }
        }
      }
    }
  });

  it("semua gedung berhuruf memiliki garis dasar seragam dan sel zona huruf persegi", () => {
    const sampleChars = ["A", "b", "C", "1", "9", "Z", "k", "o"];

    for (let i = 0; i < sampleChars.length; i++) {
      const char = sampleChars[i];
      const b = makeBuilding(char, i, i * 80, 12345);

      // 1. Garis dasar seragam di LETTER_BASELINE (60 px dari tanah)
      expect(b.letterBaseline).toBe(LETTER_BASELINE);
      expect(b.letterBaseline).toBe(60);

      // 2. Sel zona huruf persegi berukuran LETTER_CELL (11 px)
      expect(b.letterCell).toBe(LETTER_CELL);
      expect(b.letterCell).toBe(11);

      // 3. Tinggi minimum gedung harus mencakup baseline + 7 cell + margin atap
      const minRequiredHeight = LETTER_BASELINE + 7 * LETTER_CELL + 22; // 159 px
      expect(b.height).toBeGreaterThanOrEqual(minRequiredHeight);

      // 4. Lebar gedung berhuruf berkisar 5 * LETTER_CELL + 2 * margin ± 10%
      const baseExpectedWidth = 5 * LETTER_CELL + 12; // 67 px
      expect(b.width).toBeGreaterThanOrEqual(Math.floor(baseExpectedWidth * 0.9));
      expect(b.width).toBeLessThanOrEqual(Math.ceil(baseExpectedWidth * 1.1));
    }
  });

  it("kata 'HALO' menghasilkan empat zona huruf yang sejajar", () => {
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

    // Seluruh gedung memiliki baseline 60 px
    expect(baselines).toEqual([60, 60, 60, 60]);
    // Seluruh gedung memiliki ukuran sel persegi 11 px
    expect(cellSizes).toEqual([11, 11, 11, 11]);
    // Ketinggian puncak huruf pada keempat gedung sejajar persis pada y = 137 px
    expect(topOfLetters).toEqual([137, 137, 137, 137]);

    // Celah antar gedung berurutan konstan seragam (LETTER_BUILDING_GAP = 6 px)
    for (let i = 0; i < state.items.length - 1; i++) {
      const current = state.items[i];
      const next = state.items[i + 1];
      const gap = next.x - (current.x + current.width);
      expect(gap).toBe(LETTER_BUILDING_GAP);
      expect(gap).toBe(6);
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
});
