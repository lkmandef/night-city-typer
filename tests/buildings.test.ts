import { describe, expect, it } from "vitest";
import {
  isUpper,
  LETTER_BUILDING_GAP,
  makeBuilding,
  pickKind,
  updateBuilding,
} from "@/lib/city/buildings";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";
import { easeOutCubic } from "@/lib/utils/easing";

describe("Buildings & Generator (Fase 3)", () => {
  it("makeBuilding dengan input sama menghasilkan output sama (deterministik)", () => {
    const b1 = makeBuilding("a", 0, 100, 42);
    const b2 = makeBuilding("a", 0, 100, 42);

    expect(b1).toEqual(b2);
    expect(b1.width).toBe(b2.width);
    expect(b1.height).toBe(b2.height);
    expect(b1.windows.length).toBe(b2.windows.length);
  });

  it("vokal menghasilkan tower, konsonan block, angka house, tanda baca lamp", () => {
    expect(pickKind("a")).toBe("tower");
    expect(pickKind("E")).toBe("tower");
    expect(pickKind("u")).toBe("tower");

    expect(pickKind("b")).toBe("block");
    expect(pickKind("Z")).toBe("block");
    expect(pickKind("k")).toBe("block");

    expect(pickKind("0")).toBe("house");
    expect(pickKind("5")).toBe("house");
    expect(pickKind("9")).toBe("house");

    expect(pickKind(".")).toBe("lamp");
    expect(pickKind("!")).toBe("lamp");
  });

  it("huruf kapital menghasilkan gedung yang lebih tinggi (faktor 1.3x)", () => {
    expect(isUpper("A")).toBe(true);
    expect(isUpper("a")).toBe(false);

    // Ambil beberapa sampel untuk memastikan rasio rata-rata konsisten
    const small = makeBuilding("k", 1, 0, 999);
    const capital = makeBuilding("K", 1, 0, 999);

    // Karena seed berbeda hanya di charCode, bandingkan base multiplier
    expect(capital.height).toBeGreaterThan(small.height * 1.1);
  });

  it("lebar gedung selalu dalam rentang 36 sampai 78 px", () => {
    for (let i = 0; i < 50; i++) {
      const b = makeBuilding(String.fromCharCode(65 + (i % 26)), i, i * 40, 12345);
      expect(b.width).toBeGreaterThanOrEqual(36);
      expect(b.width).toBeLessThanOrEqual(78);
    }
  });

  it("updateBuilding menaikkan grow dan menyalakan jendela setelah grow > 0.6", () => {
    const b = makeBuilding("h", 0, 0, 123);
    expect(b.grow).toBe(0);
    expect(b.windows.some((w) => w.lit)).toBe(false);

    // Update 300 ms -> grow sekitar 0.5
    updateBuilding(b, 300);
    expect(b.grow).toBeCloseTo(0.5, 1);
    expect(b.windows.some((w) => w.lit)).toBe(false);

    // Update lagi 300 ms -> grow = 1 (alive), lightTimer mulai berjalan
    updateBuilding(b, 300);
    expect(b.grow).toBe(1);
    expect(b.state).toBe("alive");

    // Lanjutkan waktu 1500 ms agar jeda jendela menyala tercapai
    updateBuilding(b, 1500);
    const litWindows = b.windows.filter((w) => w.lit);
    expect(litWindows.length).toBeGreaterThan(0);
  });
});

describe("City Reducer (Fase 3)", () => {
  it("cityReducer menambah 1 item untuk 1 karakter dan menggeser cursorX", () => {
    const initialState = createInitialCityState(100);
    expect(initialState.items).toHaveLength(0);

    const startX = initialState.cursorX;
    const nextState = cityReducer(initialState, { type: "TYPE_CHAR", char: "h" });

    expect(nextState.items).toHaveLength(1);
    const building = nextState.items[0];
    expect("windows" in building).toBe(true);
    if ("windows" in building) {
      expect(building.char).toBe("h");
      expect(nextState.cursorX).toBe(
        startX + building.width + (building.gap ?? LETTER_BUILDING_GAP)
      );
    }
  });

  it("mengetik 'halo' menghasilkan 4 gedung secara berurutan", () => {
    let state = createInitialCityState(12345);
    const word = "halo";

    for (const char of word) {
      state = cityReducer(state, { type: "TYPE_CHAR", char });
    }

    expect(state.items).toHaveLength(4);
    const resultChars = state.items
      .map((item) => ("char" in item ? item.char : ""))
      .join("");
    expect(resultChars).toBe("halo");
    expect(state.cursorX).toBeGreaterThan(60);
  });
});

describe("Easing Utility (Fase 3)", () => {
  it("easeOutCubic menghitung transisi 0 ke 1 dengan benar", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 3);
  });
});
