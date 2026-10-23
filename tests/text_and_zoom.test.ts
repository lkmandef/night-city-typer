import { describe, it, expect } from "vitest";
import {
  buildTypedText,
  tailText,
  computeZoomFactor,
  computeOverviewZoom,
} from "@/lib/city/text";
import type { Building, Separator, CityItem } from "@/lib/city/types";

let nextId = 1;

function mockBuilding(char: string, hasGlyph = true): Building {
  return {
    id: nextId++,
    char,
    kind: "block",
    x: 0,
    width: 60,
    height: 120,
    grow: 1,
    state: "alive",
    windows: [],
    collapse: 0,
    glyph: hasGlyph ? ["11111", "10001", "11111", "10001", "10001", "00000", "00000"] : undefined,
  };
}

function mockSeparator(): Separator {
  return {
    id: nextId++,
    kind: "road",
    x: 0,
    width: 40,
    progress: 1,
    state: "alive",
  };
}

describe("buildTypedText (FR-18)", () => {
  it("menggabungkan karakter dari items aktif dan spasi dari separator", () => {
    const items: CityItem[] = [
      mockBuilding("H"),
      mockBuilding("a"),
      mockBuilding("l"),
      mockBuilding("o"),
      mockSeparator(),
      mockBuilding("D"),
      mockBuilding("u"),
      mockBuilding("n"),
      mockBuilding("i"),
      mockBuilding("a"),
    ];

    const result = buildTypedText(items);
    expect(result).toBe("Halo Dunia");
  });

  it("mengabaikan ghost atau item yang berada di luar array items", () => {
    // buildTypedText hanya menerima array items aktif
    const activeItems: CityItem[] = [
      mockBuilding("B"),
      mockBuilding("y"),
      mockBuilding("e"),
    ];
    const ghostItem = mockBuilding("X"); // ini tidak dimasukkan ke activeItems

    expect(buildTypedText(activeItems)).toBe("Bye");
    expect(buildTypedText(activeItems)).not.toContain(ghostItem.char);
  });

  it("menghasilkan string kosong untuk array items kosong", () => {
    expect(buildTypedText([])).toBe("");
  });

  it("mengabaikan gedung yang tidak memiliki glyph", () => {
    const items: CityItem[] = [
      mockBuilding("A", true),
      mockBuilding("?", false),
      mockBuilding("B", true),
    ];
    expect(buildTypedText(items)).toBe("AB");
  });
});

describe("tailText (FR-18)", () => {
  it("mengembalikan teks utuh jika panjangnya kurang dari atau sama dengan max", () => {
    expect(tailText("Halo", 10)).toBe("Halo");
    expect(tailText("12345", 5)).toBe("12345");
    expect(tailText("", 10)).toBe("");
  });

  it("mengembalikan '…' + akhiran teks jika panjangnya melebihi max", () => {
    const longText = "Malam ini di Night City Typer sangat indah sekali";
    const max = 15;
    const result = tailText(longText, max);

    expect(result.startsWith("…")).toBe(true);
    expect(result).toBe("…" + longText.slice(-max));
    expect(result.length).toBe(max + 1); // "…" (1 char) + max chars
  });

  it("memotong dengan benar pada batas tailText 36 karakter", () => {
    const text50 = "A".repeat(50);
    const result = tailText(text50, 36);
    expect(result).toBe("…" + "A".repeat(36));
  });
});

describe("computeZoomFactor & computeOverviewZoom (FR-19)", () => {
  it("kota pendek tidak diperbesar di atas 1 (maksimal 1.0)", () => {
    const viewportWidth = 1200;
    const shortCityWidth = 400; // 0.9 * 1200 / 400 = 2.7 -> harus di-clamp ke 1.0

    const zoom = computeZoomFactor(viewportWidth, shortCityWidth);
    expect(zoom).toBe(1.0);

    const overview = computeOverviewZoom(shortCityWidth, viewportWidth, 1.0);
    expect(overview.zoomFactor).toBe(1.0);
    expect(overview.effectiveScale).toBe(1.0);
  });

  it("hasil zoom berada dalam rentang [0.2, 1.0]", () => {
    const viewportWidth = 1000;

    // Kota sedang (masih butuh zoom out moderat)
    const midCityWidth = 2000; // 0.9 * 1000 / 2000 = 0.45
    const midZoom = computeZoomFactor(viewportWidth, midCityWidth);
    expect(midZoom).toBeCloseTo(0.45, 2);
    expect(midZoom).toBeGreaterThanOrEqual(0.2);
    expect(midZoom).toBeLessThanOrEqual(1.0);

    // Kota sangat panjang (melebihi batas bawah 0.2)
    const veryLongCityWidth = 10000; // 0.9 * 1000 / 10000 = 0.09 -> clamp ke 0.2
    const minZoom = computeZoomFactor(viewportWidth, veryLongCityWidth);
    expect(minZoom).toBe(0.2);
  });

  it("mengalikan zoomFactor dengan worldScale dengan benar", () => {
    const viewportWidth = 1000;
    const cityTotalWidth = 2000;
    const baseWorldScale = 0.8;

    const overview = computeOverviewZoom(cityTotalWidth, viewportWidth, baseWorldScale);
    expect(overview.zoomFactor).toBeCloseTo(0.5625, 2);
    expect(overview.effectiveScale).toBeCloseTo(baseWorldScale * overview.zoomFactor, 4);
    expect(overview.zoomFactor).toBeGreaterThanOrEqual(0.2);
    expect(overview.zoomFactor).toBeLessThanOrEqual(1.0);
  });

  it("menangani nilai lebar tidak valid (0 atau negatif) dengan aman", () => {
    expect(computeZoomFactor(0, 1000)).toBe(1.0);
    expect(computeZoomFactor(1000, 0)).toBe(1.0);
    expect(computeZoomFactor(-500, 1000)).toBe(1.0);
    expect(computeOverviewZoom(0, 0, 1.0).zoomFactor).toBe(1.0);
  });
});
