"use client";

import { useEffect, useRef } from "react";
import { drawGround, drawSky } from "@/lib/render/sky";

export default function CityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      sizeRef.current = { width, height, dpr };
    };

    const loop = (currentTime: number) => {
      // Hitung delta time dengan batas atas 50ms (mencegah lonjakan saat tab tidak aktif)
      const _dt = Math.min(50, currentTime - lastTime);
      void _dt;
      lastTime = currentTime;

      const { width, height } = sizeRef.current;
      if (width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);
        drawSky(ctx, width, height);
        drawGround(ctx, width, height);
      }

      rafId = requestAnimationFrame(loop);
    };

    // Inisialisasi ukuran dan mulai render loop
    handleResize();
    window.addEventListener("resize", handleResize);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full block touch-none"
      aria-label="Night City Typer interactive canvas"
    />
  );
}
