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
      // Aspal gelap
      const roadDepth = 22 * p;
      ctx.fillStyle = "#090d19";
      ctx.fillRect(x, groundY, width, roadDepth);

      // Garis jalan putus-putus
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, groundY + 11);
      ctx.lineTo(x + width, groundY + 11);
      ctx.stroke();
      ctx.setLineDash([]);

      // 1 sampai 2 lampu jalan kecil
      const lampCount = width > 65 ? 2 : 1;
      for (let i = 0; i < lampCount; i++) {
        const lampX = Math.round(x + (width / (lampCount + 1)) * (i + 1));
        const lampH = 26 * p;
        const lampTipY = groundY - lampH;

        // Tiang lampu
        ctx.strokeStyle = "#3e485e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lampX, groundY);
        ctx.lineTo(lampX, lampTipY);
        ctx.stroke();

        // Cahaya lampu jalan hangat
        ctx.fillStyle = "rgba(255, 210, 122, 0.25)";
        ctx.beginPath();
        ctx.arc(lampX, lampTipY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffd27a";
        ctx.beginPath();
        ctx.arc(lampX, lampTipY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "river": {
      // Air gelap kebiruan di bawah tanah
      const riverDepth = 35 * p;
      ctx.fillStyle = "#071224";
      ctx.fillRect(x, groundY, width, riverDepth);

      // Pantulan lampu gedung di sebelahnya (garis vertikal kabur)
      const gradWarm = ctx.createLinearGradient(0, groundY, 0, groundY + riverDepth);
      gradWarm.addColorStop(0, "rgba(255, 210, 122, 0.2)");
      gradWarm.addColorStop(1, "rgba(255, 210, 122, 0)");
      ctx.fillStyle = gradWarm;
      ctx.fillRect(x + 2, groundY, 8, riverDepth);

      const gradCool = ctx.createLinearGradient(0, groundY, 0, groundY + riverDepth);
      gradCool.addColorStop(0, "rgba(127, 214, 255, 0.18)");
      gradCool.addColorStop(1, "rgba(127, 214, 255, 0)");
      ctx.fillStyle = gradCool;
      ctx.fillRect(x + width - 10, groundY, 8, riverDepth);

      // Gelombang tipis berombak pelan
      ctx.strokeStyle = "rgba(127, 214, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let rx = x; rx <= x + width; rx += 2) {
        const ry = groundY + 12 + Math.sin(rx * 0.12 + time / 350) * 2;
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
      // Dasar rumput gelap
      ctx.fillStyle = "#08140e";
      ctx.fillRect(x, groundY, width, 14 * p);

      // Pohon-pohon siluet kecil
      const treeCount = Math.max(2, Math.floor(width / 22));
      for (let i = 0; i < treeCount; i++) {
        const treeX = Math.round(x + (width / (treeCount + 1)) * (i + 1));
        const treeH = 18 * p;
        const trunkH = 5 * p;

        // Batang pohon
        ctx.strokeStyle = "#1b261e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(treeX, groundY);
        ctx.lineTo(treeX, groundY - trunkH);
        ctx.stroke();

        // Tajuk daun siluet gelap
        ctx.fillStyle = "#0c2017";
        ctx.beginPath();
        ctx.arc(treeX, groundY - treeH, 7 * p, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(40, 80, 55, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Satu lampu taman kecil di pinggir
      const lampX = Math.round(x + 8);
      const lampTipY = groundY - 20 * p;
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lampX, groundY);
      ctx.lineTo(lampX, lampTipY);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 230, 160, 0.35)";
      ctx.beginPath();
      ctx.arc(lampX, lampTipY, 4, 0, Math.PI * 2);
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
