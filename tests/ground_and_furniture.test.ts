import { describe, it, expect } from "vitest";
import {
  computeAdaptiveGround,
  getBuildingFurniture,
  getWalkerDepthScale,
  getWalkerLaneY,
} from "@/lib/city/ground";
import { SIDEWALK_H, WALKER_LANES } from "@/lib/city/config";
import type { Building } from "@/lib/city/types";

function mockBuilding(id: number, x = 100, width = 60): Building {
  return {
    id,
    char: "A",
    kind: "block",
    x,
    width,
    height: 140,
    grow: 1,
    state: "alive",
    windows: [],
    collapse: 0,
    glyph: ["11111", "10001", "11111", "10001", "10001", "00000", "00000"],
  };
}

describe("Street Furniture (FR-20)", () => {
  it("deterministik per seed: input gedung dan seed yang sama menghasilkan perabot yang sama", () => {
    const building = mockBuilding(42, 200, 70);
    const seed = 12345;

    const f1 = getBuildingFurniture(building, seed);
    const f2 = getBuildingFurniture(building, seed);

    expect(f1).not.toBeNull();
    expect(f1).toEqual(f2);
  });

  it("perabot selalu berada dalam batas horizontal gedungnya", () => {
    const seed = 98765;
    for (let id = 1; id <= 100; id++) {
      const bX = id * 80;
      const bWidth = 55;
      const b = mockBuilding(id, bX, bWidth);
      const f = getBuildingFurniture(b, seed);

      if (f) {
        expect(f.x).toBeGreaterThanOrEqual(b.x);
        expect(f.x).toBeLessThanOrEqual(b.x + b.width);
        expect(["lamp", "tree", "bench", "car"]).toContain(f.kind);
      }
    }
  });

  it("gedung yang sedang runtuh tidak memunculkan perabot baru", () => {
    const building = mockBuilding(10, 100, 60);
    building.state = "collapsing";

    const f = getBuildingFurniture(building, 123);
    expect(f).toBeNull();
  });
});

describe("Lajur Karakter & Skala Kedalaman (FR-20)", () => {
  it("lajur karakter selalu berada dalam rentang trotoar (0 sampai SIDEWALK_H)", () => {
    for (let lane = 0; lane < WALKER_LANES; lane++) {
      const laneY = getWalkerLaneY(lane);
      expect(laneY).toBeGreaterThanOrEqual(0);
      expect(laneY).toBeLessThanOrEqual(SIDEWALK_H);
    }
  });

  it("posisi y lajur berurutan dari dekat podium hingga dekat curb", () => {
    const lane0 = getWalkerLaneY(0);
    const lane1 = getWalkerLaneY(1);
    const lane2 = getWalkerLaneY(2);

    expect(lane0).toBeLessThan(lane1);
    expect(lane1).toBeLessThan(lane2);
  });

  it("faktor skala kedalaman berada dalam rentang [0.9, 1.15]", () => {
    const scale0 = getWalkerDepthScale(0);
    const scale1 = getWalkerDepthScale(1);
    const scale2 = getWalkerDepthScale(2);

    expect(scale0).toBeCloseTo(0.9, 2);
    expect(scale2).toBeCloseTo(1.15, 2);
    expect(scale1).toBeGreaterThan(scale0);
    expect(scale2).toBeGreaterThan(scale1);

    for (let lane = 0; lane < WALKER_LANES; lane++) {
      const scale = getWalkerDepthScale(lane);
      expect(scale).toBeGreaterThanOrEqual(0.9);
      expect(scale).toBeLessThanOrEqual(1.15);
    }
  });
});

describe("Tinggi Tanah Adaptif (FR-20)", () => {
  it("perhitungan tinggi tanah adaptif benar untuk viewport 900 px (layar desktop/laptop)", () => {
    const res = computeAdaptiveGround(900, 1.0);
    expect(res.groundHeight).toBe(135); // 900 * 0.15 = 135 px >= 60 px
    expect(res.showDecorations).toBe(true);
    expect(res.groundY).toBe(765);
  });

  it("perhitungan tinggi tanah adaptif benar untuk viewport 488 px (HP vertikal sedang)", () => {
    const res = computeAdaptiveGround(488, 0.8);
    // 488 * 0.15 = 73.2 -> dibulatkan 73 px
    expect(res.groundHeight).toBeGreaterThanOrEqual(60);
    expect(res.showDecorations).toBe(true);
  });

  it("perhitungan tinggi tanah adaptif benar untuk viewport 300 px (HP dengan keyboard terbuka)", () => {
    const res = computeAdaptiveGround(300, 0.6);
    // 300 * 0.15 = 45 px < 60 px -> dekorasi disembunyikan
    expect(res.groundHeight).toBeLessThan(60);
    expect(res.showDecorations).toBe(false);
  });

  it("memastikan groundY menyisakan ruang aman sehingga tidak pernah menutupi baris huruf", () => {
    const resSmall = computeAdaptiveGround(200, 1.0);
    // Gedung berhuruf membutuhkan ruang vertikal minimal
    expect(resSmall.groundY).toBeGreaterThanOrEqual(132);
  });
});
