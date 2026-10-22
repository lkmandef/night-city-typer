import type { Separator } from "@/lib/city/types";
import { easeOutCubic } from "@/lib/utils/easing";

/**
 * Menggambar pemisah (jalan, sungai, atau taman) di antara blok gedung.
 */
export function drawSeparator(
  ctx: CanvasRenderingContext2D,
  sep: Separator,
  groundY: number,
  time: number
): void {
  const p = easeOutCubic(sep.progress);
  if (p <= 0) return;

  const width = sep.width;
  const x = sep.x;

  switch (sep.kind) {
    case "road": {
      // 1. Permukaan aspal sedikit lebih terang dari tanah (#161b33)
      const roadDepth = 26 * p;
      ctx.fillStyle = "#161b33";
      ctx.fillRect(x, groundY, width, roadDepth);

      // Garis tepi batas aspal
      ctx.strokeStyle = "rgba(55, 70, 110, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, groundY, width, roadDepth);

      // 2. Marka jalan putus-putus lebih tebal dan kontras
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(x + 2, groundY + 13);
      ctx.lineTo(x + width - 2, groundY + 13);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Lampu jalan dengan glow radial halus
      const lampCount = width > 70 ? 2 : 1;
      for (let i = 0; i < lampCount; i++) {
        const lampX = Math.round(x + (width / (lampCount + 1)) * (i + 1));
        const lampH = 28 * p;
        const lampTipY = groundY - lampH;

        // Tiang lampu jalan
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lampX, groundY);
        ctx.lineTo(lampX, lampTipY);
        ctx.stroke();

        // Glow radial lampu jalan
        const glowRadius = 16 * p;
        const lampGlow = ctx.createRadialGradient(
          lampX,
          lampTipY,
          1,
          lampX,
          lampTipY,
          glowRadius
        );
        lampGlow.addColorStop(0, "rgba(255, 215, 130, 0.65)");
        lampGlow.addColorStop(0.35, "rgba(255, 185, 80, 0.22)");
        lampGlow.addColorStop(1, "rgba(255, 185, 80, 0)");

        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(lampX, lampTipY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inti lampu pijar terang
        ctx.fillStyle = "#fff8dc";
        ctx.beginPath();
        ctx.arc(lampX, lampTipY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "river": {
      // 1. Warna air biru gelap yang lebih jelas (#0d2340)
      const riverDepth = 38 * p;
      ctx.fillStyle = "#0d2340";
      ctx.fillRect(x, groundY, width, riverDepth);

      // Garis tepian sungai
      ctx.strokeStyle = "rgba(45, 80, 130, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY + riverDepth);
      ctx.moveTo(x + width, groundY);
      ctx.lineTo(x + width, groundY + riverDepth);
      ctx.stroke();

      // 2. Pantulan lampu gedung di sebelah kiri (warm) dan kanan (cool)
      const gradWarm = ctx.createLinearGradient(0, groundY, 0, groundY + riverDepth);
      gradWarm.addColorStop(0, "rgba(255, 210, 122, 0.45)");
      gradWarm.addColorStop(0.6, "rgba(255, 180, 80, 0.2)");
      gradWarm.addColorStop(1, "rgba(255, 180, 80, 0)");
      ctx.fillStyle = gradWarm;
      ctx.fillRect(x + 4, groundY, 14, riverDepth);

      const gradCool = ctx.createLinearGradient(0, groundY, 0, groundY + riverDepth);
      gradCool.addColorStop(0, "rgba(95, 184, 230, 0.4)");
      gradCool.addColorStop(0.6, "rgba(95, 184, 230, 0.18)");
      gradCool.addColorStop(1, "rgba(95, 184, 230, 0)");
      ctx.fillStyle = gradCool;
      ctx.fillRect(x + width - 18, groundY, 14, riverDepth);

      // 3. Gelombang air berombak pelan dan lebih terlihat
      ctx.strokeStyle = "rgba(140, 225, 255, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let rx = x; rx <= x + width; rx += 2) {
        const ry = groundY + 12 + Math.sin(rx * 0.14 + time / 300) * 2.5;
        if (rx === x) {
          ctx.moveTo(rx, ry);
        } else {
          ctx.lineTo(rx, ry);
        }
      }
      ctx.stroke();

      // Lapisan gelombang kedua
      ctx.strokeStyle = "rgba(95, 184, 230, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let rx = x; rx <= x + width; rx += 2) {
        const ry = groundY + 24 + Math.sin(rx * 0.11 - time / 350) * 2;
        if (rx === x) {
          ctx.moveTo(rx, ry);
        } else {
          ctx.lineTo(rx, ry);
        }
      }
      ctx.stroke();
      break;
    }

    case "park": {
      // 1. Dasar rumput taman gelap
      ctx.fillStyle = "#091b12";
      ctx.fillRect(x, groundY, width, 16 * p);

      // Garis batas taman
      ctx.strokeStyle = "rgba(35, 75, 50, 0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, groundY, width, 16 * p);

      // 2. Pohon lebih tinggi dan lebih banyak
      const treeCount = Math.max(3, Math.floor(width / 18));
      for (let i = 0; i < treeCount; i++) {
        const treeX = Math.round(x + (width / (treeCount + 1)) * (i + 1));
        const treeH = (22 + (i % 3) * 6) * p;
        const trunkH = 6 * p;

        // Batang pohon
        ctx.strokeStyle = "#1a2c20";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(treeX, groundY);
        ctx.lineTo(treeX, groundY - trunkH);
        ctx.stroke();

        // Tajuk daun siluet pohon
        ctx.fillStyle = "#0d2a1b";
        ctx.beginPath();
        ctx.arc(treeX, groundY - treeH, 8.5 * p, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(50, 110, 75, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Satu lampu taman yang menyala dengan glow radial
      const lampX = Math.round(x + 10);
      const lampTipY = groundY - 22 * p;

      // Tiang lampu taman
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lampX, groundY);
      ctx.lineTo(lampX, lampTipY);
      ctx.stroke();

      // Glow lampu taman
      const parkGlow = ctx.createRadialGradient(
        lampX,
        lampTipY,
        1,
        lampX,
        lampTipY,
        14 * p
      );
      parkGlow.addColorStop(0, "rgba(255, 235, 170, 0.7)");
      parkGlow.addColorStop(0.4, "rgba(255, 205, 110, 0.25)");
      parkGlow.addColorStop(1, "rgba(255, 205, 110, 0)");

      ctx.fillStyle = parkGlow;
      ctx.beginPath();
      ctx.arc(lampX, lampTipY, 14 * p, 0, Math.PI * 2);
      ctx.fill();

      // Titik bohlam
      ctx.fillStyle = "#fff8e2";
      ctx.beginPath();
      ctx.arc(lampX, lampTipY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

/**
 * Menggambar seluruh pemisah di kota.
 */
export function drawSeparators(
  ctx: CanvasRenderingContext2D,
  separators: Separator[],
  groundY: number,
  time: number
): void {
  for (const sep of separators) {
    drawSeparator(ctx, sep, groundY, time);
  }
}
