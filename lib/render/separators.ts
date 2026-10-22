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
      // 1. Permukaan aspal jalan malam (#181e38)
      const roadDepth = 28 * p;
      ctx.fillStyle = "#181e38";
      ctx.fillRect(x, groundY, width, roadDepth);

      // Garis tepi batas aspal/trotoar
      ctx.strokeStyle = "rgba(70, 88, 135, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, groundY, width, roadDepth);

      // 2. Marka jalan putus-putus lebih tebal dan sangat kontras
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(x + 3, groundY + 14);
      ctx.lineTo(x + width - 3, groundY + 14);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Lampu jalan dengan tiang kokoh dan glow radial jelas
      const lampCount = width > 75 ? 2 : 1;
      for (let i = 0; i < lampCount; i++) {
        const lampX = Math.round(x + (width / (lampCount + 1)) * (i + 1));
        const lampH = 30 * p;
        const lampTipY = groundY - lampH;

        // Tiang lampu jalan metalik
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lampX, groundY);
        ctx.lineTo(lampX, lampTipY);
        ctx.stroke();

        // Lengan lampu atas
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lampX, lampTipY);
        ctx.lineTo(lampX + 4, lampTipY - 2);
        ctx.stroke();

        // Glow radial lampu jalan terang
        const glowRadius = 18 * p;
        const lampGlow = ctx.createRadialGradient(
          lampX + 2,
          lampTipY - 1,
          1,
          lampX + 2,
          lampTipY - 1,
          glowRadius
        );
        lampGlow.addColorStop(0, "rgba(255, 225, 140, 0.8)");
        lampGlow.addColorStop(0.35, "rgba(255, 190, 85, 0.3)");
        lampGlow.addColorStop(1, "rgba(255, 190, 85, 0)");

        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(lampX + 2, lampTipY - 1, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inti lampu pijar terang
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(lampX + 2, lampTipY - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "river": {
      // 1. Warna air biru lebih jelas (#142d54 ke #0c1d38)
      const riverDepth = 40 * p;
      const waterGrad = ctx.createLinearGradient(0, groundY, 0, groundY + riverDepth);
      waterGrad.addColorStop(0, "#142d54");
      waterGrad.addColorStop(1, "#0c1d38");
      ctx.fillStyle = waterGrad;
      ctx.fillRect(x, groundY, width, riverDepth);

      // Garis tepian dermaga sungai
      ctx.strokeStyle = "rgba(70, 120, 185, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY + riverDepth);
      ctx.moveTo(x + width, groundY);
      ctx.lineTo(x + width, groundY + riverDepth);
      ctx.stroke();

      // 2. Pantulan lampu gedung di sebelah kiri (warm) dan kanan (cool)
      const gradWarm = ctx.createLinearGradient(0, groundY, 0, groundY + riverDepth);
      gradWarm.addColorStop(0, "rgba(255, 215, 130, 0.55)");
      gradWarm.addColorStop(0.5, "rgba(255, 185, 90, 0.28)");
      gradWarm.addColorStop(1, "rgba(255, 185, 90, 0)");
      ctx.fillStyle = gradWarm;
      ctx.fillRect(x + 4, groundY, 16, riverDepth);

      const gradCool = ctx.createLinearGradient(0, groundY, 0, groundY + riverDepth);
      gradCool.addColorStop(0, "rgba(110, 200, 255, 0.5)");
      gradCool.addColorStop(0.5, "rgba(75, 175, 240, 0.25)");
      gradCool.addColorStop(1, "rgba(75, 175, 240, 0)");
      ctx.fillStyle = gradCool;
      ctx.fillRect(x + width - 20, groundY, 16, riverDepth);

      // 3. Gelombang air berombak pelan dan lebih terlihat jelas
      ctx.strokeStyle = "rgba(165, 235, 255, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let rx = x; rx <= x + width; rx += 2) {
        const ry = groundY + 12 + Math.sin(rx * 0.14 + time / 280) * 2.8;
        if (rx === x) {
          ctx.moveTo(rx, ry);
        } else {
          ctx.lineTo(rx, ry);
        }
      }
      ctx.stroke();

      // Lapisan gelombang kedua
      ctx.strokeStyle = "rgba(105, 195, 245, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let rx = x; rx <= x + width; rx += 2) {
        const ry = groundY + 26 + Math.sin(rx * 0.11 - time / 320) * 2.2;
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
      // 1. Dasar rumput taman gelap (#0a2016)
      ctx.fillStyle = "#0a2016";
      ctx.fillRect(x, groundY, width, 18 * p);

      // Garis batas taman batu
      ctx.strokeStyle = "rgba(45, 90, 60, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, groundY, width, 18 * p);

      // 2. Pohon lebih besar dan lebih banyak
      const treeCount = Math.max(4, Math.floor(width / 16));
      for (let i = 0; i < treeCount; i++) {
        const treeX = Math.round(x + (width / (treeCount + 1)) * (i + 1));
        const treeH = (26 + (i % 3) * 7) * p;
        const trunkH = 8 * p;

        // Batang pohon kayu
        ctx.strokeStyle = "#27382b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(treeX, groundY);
        ctx.lineTo(treeX, groundY - trunkH);
        ctx.stroke();

        // Tajuk daun siluet pohon berlapis
        ctx.fillStyle = "#0f3320";
        ctx.beginPath();
        ctx.arc(treeX, groundY - treeH * 0.85, 9.5 * p, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#15442b";
        ctx.beginPath();
        ctx.arc(treeX, groundY - treeH, 6.5 * p, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(60, 130, 85, 0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. 1 sampai 2 lampu taman yang menyala dengan glow radial
      const parkLamps: number[] = [];
      if (width >= 85) {
        parkLamps.push(Math.round(x + 14), Math.round(x + width - 14));
      } else {
        parkLamps.push(Math.round(x + width * 0.35));
      }

      for (const lampX of parkLamps) {
        const lampTipY = groundY - 24 * p;

        // Tiang lampu taman metalik
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lampX, groundY);
        ctx.lineTo(lampX, lampTipY);
        ctx.stroke();

        // Glow lampu taman hangat
        const glowR = 15 * p;
        const parkGlow = ctx.createRadialGradient(
          lampX,
          lampTipY,
          1,
          lampX,
          lampTipY,
          glowR
        );
        parkGlow.addColorStop(0, "rgba(255, 235, 170, 0.8)");
        parkGlow.addColorStop(0.4, "rgba(255, 205, 110, 0.3)");
        parkGlow.addColorStop(1, "rgba(255, 205, 110, 0)");

        ctx.fillStyle = parkGlow;
        ctx.beginPath();
        ctx.arc(lampX, lampTipY, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Bohlam pijar
        ctx.fillStyle = "#fff8e2";
        ctx.beginPath();
        ctx.arc(lampX, lampTipY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
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
