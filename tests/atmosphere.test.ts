import { describe, expect, it, vi } from "vitest";
import { drawStars, generateStars } from "@/lib/render/stars";
import { drawMoon } from "@/lib/render/sky";
import { renderScene } from "@/lib/render/pipeline";
import { createParallaxRenderer } from "@/lib/render/parallax";

describe("Atmosphere & Pipeline (Fase 6)", () => {
  it("generateStars menghasilkan jumlah bintang deterministik di langit atas", () => {
    const s1 = generateStars(100, 12345);
    const s2 = generateStars(100, 12345);

    expect(s1).toHaveLength(100);
    expect(s1).toEqual(s2);

    // Semua bintang harus berada di y <= 0.72 dan ukuran 0.5..1.8
    for (const star of s1) {
      expect(star.y).toBeLessThanOrEqual(0.72);
      expect(star.size).toBeGreaterThanOrEqual(0.5);
      expect(star.size).toBeLessThanOrEqual(1.9);
    }
  });

  it("drawStars dan drawMoon menggambar tanpa error", () => {
    const mockCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    } as unknown as CanvasRenderingContext2D;

    const stars = generateStars(20, 999);
    expect(() => drawStars(mockCtx, stars, 1000, 600, 1000)).not.toThrow();
    expect(() => drawMoon(mockCtx, 1000, 600, 1000)).not.toThrow();
  });

  it("renderScene menjalankan pipeline seluruh layer atmosfer tanpa error", () => {
    const mockCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      setLineDash: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    } as unknown as CanvasRenderingContext2D;

    const stars = generateStars(10, 555);
    const parallax = createParallaxRenderer();

    expect(() =>
      renderScene({
        ctx: mockCtx,
        width: 1200,
        height: 700,
        groundY: 700 * 0.85,
        worldScale: 1.0,
        cameraX: 100,
        stars,
        parallax,
        visibleSeparators: [],
        visibleBuildings: [],
        time: 500,
      })
    ).not.toThrow();
  });
});
