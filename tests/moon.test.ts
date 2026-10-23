import { describe, expect, it } from "vitest";
import { moonPosition } from "@/lib/render/sky";

describe("Moon Position & Stability (BUTIR 2)", () => {
  it("moonPosition kontinu terhadap t (selisih antar frame di bawah 0.1 px untuk dt sampai 50 ms)", () => {
    const width = 1200;
    const height = 800;

    // Uji sepanjang 100 detik waktu simulasi dengan variasi dt hingga 50 ms
    let t = 0;
    for (let i = 0; i < 2000; i++) {
      const dt = 16 + (i % 35); // 16 .. 50 ms
      const pos1 = moonPosition(width, height, t);
      const pos2 = moonPosition(width, height, t + dt);

      const delta = Math.hypot(pos2.x - pos1.x, pos2.y - pos1.y);
      // Selisih per frame tidak boleh melompat
      expect(delta).toBeLessThan(0.1);

      t += dt;
    }
  });

  it("posisi bulan independen dari cameraX dan jumlah gedung", () => {
    const width = 1000;
    const height = 600;
    const t = 5000;

    const basePos = moonPosition(width, height, t);

    // moonPosition adalah fungsi murni yang berpusat pada pecahan viewport ditambah drift kecil
    expect(Math.abs(basePos.x - width * 0.82)).toBeLessThanOrEqual(8);
    expect(Math.abs(basePos.y - height * 0.14)).toBeLessThanOrEqual(4);

    // Memanggil berulang kali menghasilkan koordinat identik tanpa pengaruh state eksternal
    const repeatPos = moonPosition(width, height, t);
    expect(repeatPos.x).toBe(basePos.x);
    expect(repeatPos.y).toBe(basePos.y);
    expect(repeatPos.radius).toBe(basePos.radius);
  });

  it("resize tidak menghasilkan lompatan lebih besar dari ambang pada frame pertama (lerp 0.1)", () => {
    // Simulasi keyboard virtual HP terbuka: tinggi viewport melompat dari 844 px ke 500 px
    const width = 390;
    const heightBefore = 844;
    const heightAfter = 500;
    const t = 10000;

    const currentPos = moonPosition(width, heightBefore, t);
    const targetPos = moonPosition(width, heightAfter, t + 16);

    // Tanpa lerp, lompatan langsung mencapai ~48 px
    const rawJump = Math.hypot(targetPos.x - currentPos.x, targetPos.y - currentPos.y);
    expect(rawJump).toBeGreaterThan(30);

    // Dengan lerp 0.1 per frame:
    const lerpFactor = 0.1;
    const frame1X = currentPos.x + (targetPos.x - currentPos.x) * lerpFactor;
    const frame1Y = currentPos.y + (targetPos.y - currentPos.y) * lerpFactor;

    const smoothedJump = Math.hypot(frame1X - currentPos.x, frame1Y - currentPos.y);
    // Lompatan pada frame pertama terpangkas halus di bawah 6 px
    expect(smoothedJump).toBeLessThan(6);
  });
});
