import { describe, expect, it } from "vitest";
import { computeGroups, splitBuildingRun, type BuildingGroup } from "@/lib/city/groups";
import {
  createWalker,
  updateWalkers,
  type Walker,
} from "@/lib/city/walkers";
import type { Building, Separator } from "@/lib/city/types";

function mockBuilding(
  id: number,
  x: number = id * 60,
  width: number = 55,
  state: "growing" | "alive" | "collapsing" = "alive",
  hasDoor: boolean = false
): Building {
  return {
    id,
    char: "A",
    kind: "tower",
    x,
    width,
    height: 150,
    grow: 1,
    collapse: 0,
    windows: [],
    state,
    glyph: ["11111"],
    hasDoor,
    cols: 5,
    letterCell: 11,
  };
}

function mockSeparator(id: number, x: number = id * 60): Separator {
  return {
    id,
    x,
    width: 80,
    kind: "road",
    progress: 1,
  };
}

describe("Walker Groups (computeGroups)", () => {
  it("splitBuildingRun memecah array sesuai aturan batas panjang", () => {
    const b4 = Array.from({ length: 4 }, (_, i) => mockBuilding(i + 1));
    expect(splitBuildingRun(b4)).toHaveLength(1);

    const b8 = Array.from({ length: 8 }, (_, i) => mockBuilding(i + 1));
    const chunks8 = splitBuildingRun(b8);
    expect(chunks8).toHaveLength(1);
    expect(chunks8[0]).toHaveLength(8);

    const b9 = Array.from({ length: 9 }, (_, i) => mockBuilding(i + 1));
    const chunks9 = splitBuildingRun(b9);
    expect(chunks9).toHaveLength(2);
    expect(chunks9[0]).toHaveLength(5);
    expect(chunks9[1]).toHaveLength(4);
  });

  it("kata 3 huruf tidak ada kelompok", () => {
    const items = [mockBuilding(1), mockBuilding(2), mockBuilding(3)];
    const groups = computeGroups(items);
    expect(groups).toHaveLength(0);
  });

  it("4, 5, dan 7 menjadi satu kelompok", () => {
    const g4 = computeGroups([
      mockBuilding(1, 0, 50),
      mockBuilding(2, 50, 50),
      mockBuilding(3, 100, 50),
      mockBuilding(4, 150, 50),
    ]);
    expect(g4).toHaveLength(1);
    expect(g4[0].count).toBe(4);
    expect(g4[0].firstId).toBe(1);
    expect(g4[0].lastId).toBe(4);
    expect(g4[0].key).toBe(1);
    expect(g4[0].minX).toBe(6); // 0 + 6
    expect(g4[0].maxX).toBe(194); // 150 + 50 - 6

    const g5 = computeGroups([
      mockBuilding(1),
      mockBuilding(2),
      mockBuilding(3),
      mockBuilding(4),
      mockBuilding(5),
    ]);
    expect(g5).toHaveLength(1);
    expect(g5[0].count).toBe(5);

    const g7 = computeGroups([
      mockBuilding(1),
      mockBuilding(2),
      mockBuilding(3),
      mockBuilding(4),
      mockBuilding(5),
      mockBuilding(6),
      mockBuilding(7),
    ]);
    expect(g7).toHaveLength(1);
    expect(g7[0].count).toBe(7);
  });

  it("9 menjadi 5+4", () => {
    const items = Array.from({ length: 9 }, (_, i) => mockBuilding(i + 1));
    const groups = computeGroups(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].count).toBe(5);
    expect(groups[1].count).toBe(4);
    expect(groups[0].firstId).toBe(1);
    expect(groups[1].firstId).toBe(6);
  });

  it("dua kata dipisah spasi menjadi dua kelompok terpisah", () => {
    const items = [
      mockBuilding(1),
      mockBuilding(2),
      mockBuilding(3),
      mockBuilding(4),
      mockSeparator(99),
      mockBuilding(5),
      mockBuilding(6),
      mockBuilding(7),
      mockBuilding(8),
    ];
    const groups = computeGroups(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].count).toBe(4);
    expect(groups[1].count).toBe(4);
    expect(groups[0].firstId).toBe(1);
    expect(groups[1].firstId).toBe(5);
  });

  it("gedung collapsing tidak dihitung", () => {
    // 5 gedung dengan gedung ke-5 berstatus collapsing -> kelompok 4
    const itemsWithCollapsedEnd = [
      mockBuilding(1),
      mockBuilding(2),
      mockBuilding(3),
      mockBuilding(4),
      mockBuilding(5, 300, 55, "collapsing"),
    ];
    const groupsEnd = computeGroups(itemsWithCollapsedEnd);
    expect(groupsEnd).toHaveLength(1);
    expect(groupsEnd[0].count).toBe(4);

    // 4 gedung dengan gedung ke-4 berstatus collapsing -> sisa 3 gedung -> 0 kelompok
    const itemsTooFew = [
      mockBuilding(1),
      mockBuilding(2),
      mockBuilding(3),
      mockBuilding(4, 200, 55, "collapsing"),
    ];
    expect(computeGroups(itemsTooFew)).toHaveLength(0);

    // Gedung collapsing di tengah memutus rangkaian
    const itemsMiddleCollapsed = [
      mockBuilding(1),
      mockBuilding(2),
      mockBuilding(3),
      mockBuilding(4),
      mockBuilding(5, 300, 55, "collapsing"),
      mockBuilding(6),
      mockBuilding(7),
      mockBuilding(8),
      mockBuilding(9),
    ];
    const groupsMiddle = computeGroups(itemsMiddleCollapsed);
    expect(groupsMiddle).toHaveLength(2);
    expect(groupsMiddle[0].count).toBe(4);
    expect(groupsMiddle[1].count).toBe(4);
  });
});

describe("Walkers Simulation (updateWalkers)", () => {
  const testGroup: BuildingGroup = {
    key: 100,
    firstId: 100,
    lastId: 104,
    minX: 50,
    maxX: 350,
    count: 5,
  };

  it("walker tidak pernah keluar [minX, maxX] selama 10.000 langkah update", () => {
    let walkers: Walker[] = updateWalkers([], [testGroup], 16, 9999);
    expect(walkers).toHaveLength(1);

    for (let step = 0; step < 10000; step++) {
      // Variasi dt hingga batas maksimal 50 ms
      const dt = 16 + (step % 3) * 10;
      walkers = updateWalkers(walkers, [testGroup], dt, 9999);

      const w = walkers[0];
      expect(w.x).toBeGreaterThanOrEqual(testGroup.minX);
      expect(w.x).toBeLessThanOrEqual(testGroup.maxX);
    }
  });

  it("jenis walker deterministik dari seed", () => {
    const group: BuildingGroup = {
      key: 10,
      firstId: 10,
      lastId: 14,
      minX: 0,
      maxX: 200,
      count: 5,
    };

    const w1 = createWalker(group, 12345);
    const w2 = createWalker(group, 12345);
    expect(w1.kind).toBe(w2.kind);
    expect(w1.speed).toBe(w2.speed);
    expect(w1.laneY).toBe(w2.laneY);

    // Verifikasi bahwa kedua jenis (cat dan human) dapat muncul tergantung seed
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      kinds.add(createWalker(group, seed).kind);
    }
    expect(kinds.has("cat")).toBe(true);
    expect(kinds.has("human")).toBe(true);
  });

  it("saat kelompok menyusut walker tetap dalam rentang baru", () => {
    const initialGroup: BuildingGroup = {
      key: 1,
      firstId: 1,
      lastId: 6,
      minX: 50,
      maxX: 500,
      count: 6,
    };

    let walkers = updateWalkers([], [initialGroup], 16, 42);
    // Jalankan agar walker masuk state 'walk' dan bergerak ke kanan
    walkers[0].state = "walk";
    walkers[0].x = 480;
    walkers[0].dir = 1;

    // Kelompok menyusut (misal backspace): maxX berkurang menjadi 300
    const shrunkenGroup: BuildingGroup = {
      ...initialGroup,
      maxX: 300,
    };

    // Langkah demi langkah: walker bergerak halus ke arah 300 dengan kecepatan 40 px/s
    // Pada saat x > 300, dir harus -1
    walkers = updateWalkers(walkers, [shrunkenGroup], 50, 42);
    expect(walkers[0].dir).toBe(-1);
    expect(walkers[0].x).toBeLessThan(480);

    // Berikan cukup waktu (misal 5 detik) untuk kembali ke dalam rentang [50, 300]
    for (let i = 0; i < 100; i++) {
      walkers = updateWalkers(walkers, [shrunkenGroup], 50, 42);
    }

    // Sekarang walker sudah berada di dalam rentang baru [50, 300]
    expect(walkers[0].x).toBeLessThanOrEqual(shrunkenGroup.maxX);
    expect(walkers[0].x).toBeGreaterThanOrEqual(shrunkenGroup.minX);

    // Lanjutkan 1.000 langkah lagi, pastikan walker tidak pernah keluar lagi
    for (let i = 0; i < 1000; i++) {
      walkers = updateWalkers(walkers, [shrunkenGroup], 16, 42);
      expect(walkers[0].x).toBeGreaterThanOrEqual(shrunkenGroup.minX);
      expect(walkers[0].x).toBeLessThanOrEqual(shrunkenGroup.maxX);
    }
  });

  it("walker dihapus setelah kelompok kurang dari 4", () => {
    let walkers = updateWalkers([], [testGroup], 16, 777);
    expect(walkers).toHaveLength(1);

    // Kelompok hilang (gedung tersisa < 4)
    walkers = updateWalkers(walkers, [], 16, 777);
    expect(walkers).toHaveLength(1);
    expect(walkers[0].state).toBe("exit");

    // Lanjutkan hingga fade-out 500 ms selesai
    for (let i = 0; i < 15; i++) {
      walkers = updateWalkers(walkers, [], 40, 777);
    }

    // Walker dihapus setelah fade-out selesai
    expect(walkers).toHaveLength(0);
  });

  it("mode reduced-motion memperlambat", () => {
    const wideGroup: BuildingGroup = {
      key: 1,
      firstId: 1,
      lastId: 5,
      minX: 0,
      maxX: 1000,
      count: 5,
    };

    const wNormal = createWalker(wideGroup, 555);
    wNormal.state = "walk";
    wNormal.dir = 1;
    wNormal.x = 100;
    wNormal.stateTimer = 10;

    const wReduced = { ...wNormal };

    // Update 1 detik (1000 ms = 20 langkah @ 50 ms)
    let listNormal = [wNormal];
    let listReduced = [wReduced];

    for (let i = 0; i < 20; i++) {
      listNormal = updateWalkers(listNormal, [wideGroup], 50, 555, false);
      listReduced = updateWalkers(listReduced, [wideGroup], 50, 555, true);
    }

    const distNormal = listNormal[0].x - 100;
    const distReduced = listReduced[0].x - 100;

    // Kecepatan reduced motion adalah 0.4x normal
    expect(distReduced / distNormal).toBeCloseTo(0.4, 2);
  });
});
