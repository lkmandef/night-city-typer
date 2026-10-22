import { describe, expect, it } from "vitest";
import {
  applySilhouetteCap,
  computeCameraTarget,
  computeWorldScale,
  isItemVisible,
  updateCamera,
} from "@/lib/city/camera";
import { makeBuilding } from "@/lib/city/buildings";
import type { CityItem } from "@/lib/city/types";

describe("Camera & World Scaling (Fase 5)", () => {
  it("computeWorldScale membatasi skala dalam rentang 0.6 sampai 1.0", () => {
    // Layar desktop besar (>= 1100 px) menghasilkan skala 1.0
    expect(computeWorldScale(1100)).toBe(1.0);
    expect(computeWorldScale(1440)).toBe(1.0);
    expect(computeWorldScale(1920)).toBe(1.0);

    // Layar HP sempit (~390 px) menghasilkan batas bawah 0.6
    expect(computeWorldScale(390)).toBe(0.6);
    expect(computeWorldScale(320)).toBe(0.6);

    // Layar tablet menengah
    expect(computeWorldScale(880)).toBeCloseTo(0.8, 2);
  });

  it("computeCameraTarget tidak bergeser saat kota pendek dan bergeser saat cursorX melewati 70%", () => {
    const worldWidth = 1000;
    const threshold70 = worldWidth * 0.7; // 700

    // Kota masih pendek di bawah 70% lebar layar
    expect(computeCameraTarget(200, worldWidth)).toBe(0);
    expect(computeCameraTarget(500, worldWidth)).toBe(0);
    expect(computeCameraTarget(threshold70, worldWidth)).toBe(0);

    // Saat cursorX melewati 70%, cameraTarget bergeser agar cursor berada di 60% layar
    const cursor = 850;
    const expectedTarget = cursor - worldWidth * 0.6; // 850 - 600 = 250
    expect(computeCameraTarget(cursor, worldWidth)).toBe(expectedTarget);

    // Saat backspace mundur ke bawah 60% layar, target kembali ke 0
    expect(computeCameraTarget(550, worldWidth)).toBe(0);
  });

  it("updateCamera mengejar target secara halus dengan lerp", () => {
    let currentX = 0;
    const targetX = 300;

    // Langkah awal frame 16.67ms
    currentX = updateCamera(currentX, targetX, 16.67);
    expect(currentX).toBeGreaterThan(0);
    expect(currentX).toBeLessThan(targetX);

    // Jalankan beberapa frame: currentX harus semakin mendekati target
    for (let f = 0; f < 30; f++) {
      currentX = updateCamera(currentX, targetX, 16.67);
    }
    expect(currentX).toBeGreaterThan(250);

    // Ketika sangat dekat (<0.2), kamera harus snap tepat ke target
    const nearTarget = updateCamera(299.9, targetX, 16.67);
    expect(nearTarget).toBe(targetX);
  });

  it("isItemVisible melakukan culling secara tepat pada item di luar area kamera", () => {
    const cameraX = 500;
    const worldWidth = 800;
    const margin = 80;

    // Viewport mencakup [500 - 80, 500 + 800 + 80] = [420, 1380]

    // Item tepat di tengah viewport -> visible
    expect(isItemVisible(700, 50, cameraX, worldWidth, margin)).toBe(true);

    // Item tepat di batas kiri dalam margin -> visible
    expect(isItemVisible(400, 40, cameraX, worldWidth, margin)).toBe(true);

    // Item jauh di sebelah kiri -> culled (false)
    expect(isItemVisible(100, 50, cameraX, worldWidth, margin)).toBe(false);

    // Item jauh di sebelah kanan -> culled (false)
    expect(isItemVisible(1600, 50, cameraX, worldWidth, margin)).toBe(false);
  });

  it("applySilhouetteCap membatasi maksimal 200 item aktif dan memadatkan yang tertua jadi siluet", () => {
    const items: CityItem[] = [];

    // Buat 205 gedung
    for (let i = 0; i < 205; i++) {
      items.push(makeBuilding("a", i, i * 40, 100));
    }

    // Sebelum dipadatkan, semua gedung belum berstatus siluet
    expect(items.some((it) => "isSilhouette" in it && it.isSilhouette)).toBe(false);

    applySilhouetteCap(items, 200);

    // 5 gedung tertua (index 0 sampai 4) menjadi siluet
    for (let i = 0; i < 5; i++) {
      const b = items[i];
      expect("isSilhouette" in b && b.isSilhouette).toBe(true);
    }

    // Gedung setelah index 4 tetap aktif dan bukan siluet
    for (let i = 5; i < items.length; i++) {
      const b = items[i];
      expect("isSilhouette" in b && b.isSilhouette).toBeFalsy();
    }
  });
});
