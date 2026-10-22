import { mulberry32 } from "@/lib/city/rng";

const STRIP_WIDTH = 2400;

export interface ParallaxRenderer {
  setup: (groundY: number) => void;
  draw: (ctx: CanvasRenderingContext2D, cameraX: number, groundY: number) => void;
}

/**
 * Membuat renderer gedung latar dua lapis dengan parallax dan optimasi offscreen canvas.
 */
export function createParallaxRenderer(): ParallaxRenderer {
  let farCanvas: HTMLCanvasElement | null = null;
  let midCanvas: HTMLCanvasElement | null = null;
  let currentGroundY = 0;

  function renderFarStrip(canvas: HTMLCanvasElement, groundY: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, STRIP_WIDTH, groundY);
    const rand = mulberry32(10101);

    // Lapisan Jauh (Far): siluet kabur & gelap (#101530, opacity ~0.5)
    ctx.fillStyle = "rgba(16, 21, 48, 0.5)";
    let x = 0;
    while (x < STRIP_WIDTH) {
      const w = 45 + rand() * 55;
      const h = 70 + rand() * 110;
      const topY = groundY - h;
      ctx.fillRect(x, topY, w, h);

      // Beberapa jendela redup acak
      const winRows = Math.floor(h / 24);
      const winCols = Math.floor(w / 18);
      ctx.fillStyle = "rgba(255, 215, 130, 0.15)";
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if (rand() < 0.25) {
            ctx.fillRect(x + 5 + c * 16, groundY - 10 - r * 20, 2.5, 3.5);
          }
        }
      }
      ctx.fillStyle = "rgba(16, 21, 48, 0.5)";
      x += w + 2 + rand() * 8;
    }
  }

  function renderMidStrip(canvas: HTMLCanvasElement, groundY: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, STRIP_WIDTH, groundY);
    const rand = mulberry32(20202);

    // Lapisan Menengah (Mid): siluet lebih dekat & kontras (#141a3a, opacity ~0.8)
    ctx.fillStyle = "rgba(20, 26, 58, 0.8)";
    let x = 0;
    while (x < STRIP_WIDTH) {
      const w = 50 + rand() * 65;
      const h = 90 + rand() * 140;
      const topY = groundY - h;
      ctx.fillRect(x, topY, w, h);

      // Jendela redup acak
      const winRows = Math.floor(h / 22);
      const winCols = Math.floor(w / 16);
      ctx.fillStyle = "rgba(255, 210, 120, 0.25)";
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if (rand() < 0.3) {
            ctx.fillRect(x + 6 + c * 15, groundY - 12 - r * 18, 3, 4);
          }
        }
      }
      ctx.fillStyle = "rgba(20, 26, 58, 0.8)";
      x += w + 4 + rand() * 10;
    }
  }

  return {
    setup(groundY: number) {
      if (typeof document === "undefined") return;
      currentGroundY = groundY;

      if (!farCanvas) {
        farCanvas = document.createElement("canvas");
        farCanvas.width = STRIP_WIDTH;
      }
      farCanvas.height = Math.max(10, Math.round(groundY));
      renderFarStrip(farCanvas, farCanvas.height);

      if (!midCanvas) {
        midCanvas = document.createElement("canvas");
        midCanvas.width = STRIP_WIDTH;
      }
      midCanvas.height = Math.max(10, Math.round(groundY));
      renderMidStrip(midCanvas, midCanvas.height);
    },

    draw(ctx: CanvasRenderingContext2D, cameraX: number, groundY: number) {
      if (!farCanvas || !midCanvas || currentGroundY !== groundY) {
        this.setup(groundY);
      }
      if (!farCanvas || !midCanvas) return;

      // 1. Gambar Lapisan 1 (Far): kecepatan 0.2x
      const shiftFar = -((cameraX * 0.2) % STRIP_WIDTH);
      const offsetFar = shiftFar > 0 ? shiftFar - STRIP_WIDTH : shiftFar;
      ctx.drawImage(farCanvas, offsetFar, 0);
      if (offsetFar + STRIP_WIDTH < ctx.canvas.width + STRIP_WIDTH) {
        ctx.drawImage(farCanvas, offsetFar + STRIP_WIDTH, 0);
      }

      // 2. Gambar Lapisan 2 (Mid): kecepatan 0.4x
      const shiftMid = -((cameraX * 0.4) % STRIP_WIDTH);
      const offsetMid = shiftMid > 0 ? shiftMid - STRIP_WIDTH : shiftMid;
      ctx.drawImage(midCanvas, offsetMid, 0);
      if (offsetMid + STRIP_WIDTH < ctx.canvas.width + STRIP_WIDTH) {
        ctx.drawImage(midCanvas, offsetMid + STRIP_WIDTH, 0);
      }
    },
  };
}
