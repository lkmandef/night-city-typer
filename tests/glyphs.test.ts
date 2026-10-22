import { describe, expect, it } from "vitest";
import { getGlyph, GLYPHS } from "@/lib/city/glyphs";
import { makeBuilding, updateBuilding } from "@/lib/city/buildings";

describe("Font Piksel 5x7 & Zona Huruf (FR-15)", () => {
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

      const cols = b.windows.reduce((max, w) => Math.max(max, w.col + 1), 0);
      const rows = b.windows.reduce((max, w) => Math.max(max, w.row + 1), 0);

      expect(cols).toBeGreaterThanOrEqual(5);
      expect(rows).toBeGreaterThanOrEqual(9);

      const colStart = Math.floor((cols - 5) / 2);
      const letterRowTop = rows - 2;
      const letterRowBottom = rows - 8;

      // Periksa setiap sel di dalam zona huruf
      for (let r = letterRowBottom; r <= letterRowTop; r++) {
        for (let c = colStart; c < colStart + 5; c++) {
          const win = b.windows.find((w) => w.col === c && w.row === r);
          expect(win).toBeDefined();
          if (!win || !glyph) continue;

          const glyphRow = letterRowTop - r;
          const glyphCol = c - colStart;
          const shouldBeLitPixel = glyph[glyphRow][glyphCol] === "1";

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

  it("makeBuilding dengan karakter ber-glyph menghasilkan output deterministik", () => {
    const b1 = makeBuilding("H", 2, 80, 4242);
    const b2 = makeBuilding("H", 2, 80, 4242);

    expect(b1).toEqual(b2);
    expect(b1.glyph).toEqual(b2.glyph);
    expect(b1.width).toBe(b2.width);
    expect(b1.height).toBe(b2.height);
    expect(b1.windows.length).toBe(b2.windows.length);
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
