import { describe, expect, it, vi } from "vitest";
import { drawGround, drawSky } from "@/lib/render/sky";

describe("Sky & Ground Rendering (Fase 1)", () => {
  function createMockContext() {
    return {
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }

  it("drawSky menggambar gradien vertikal dari 0 hingga 85% tinggi layar", () => {
    const ctx = createMockContext();
    const width = 1000;
    const height = 600;
    const expectedGroundY = 600 * 0.85; // 510

    drawSky(ctx, width, height);

    expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, expectedGroundY);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, width, expectedGroundY);
  });

  it("drawGround menggambar dasar tanah dari 85% tinggi layar hingga bawah", () => {
    const ctx = createMockContext();
    const width = 1000;
    const height = 600;
    const expectedGroundY = 600 * 0.85; // 510
    const expectedGroundHeight = height - expectedGroundY; // 90

    drawGround(ctx, width, height);

    expect(ctx.fillRect).toHaveBeenCalledWith(0, expectedGroundY, width, expectedGroundHeight);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, expectedGroundY);
    expect(ctx.lineTo).toHaveBeenCalledWith(width, expectedGroundY);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
