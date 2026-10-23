/**
 * Fungsi murni pengolahan teks ketikan dan kalkulasi zoom tinjauan kota (FR-18 & FR-19).
 * Catatan arsitektur: file ini murni TypeScript, tidak mengimpor React atau API canvas.
 */

import type { CityItem } from "./types";

/**
 * Menggabungkan karakter dari items kota aktif menjadi satu string teks ketikan:
 * - Gedung berglyph menjadi karakternya.
 * - Separator menjadi satu spasi (" ").
 * - Ghost dan item yang tidak valid diabaikan.
 */
export function buildTypedText(items: CityItem[]): string {
  let result = "";
  for (const item of items) {
    if ("windows" in item) {
      if (item.glyph) {
        result += item.char;
      }
    } else if ("progress" in item) {
      result += " ";
    }
  }
  return result;
}

/**
 * Memotong teks di awal dan memberikan elipsis jika melebihi panjang maksimum.
 * Mengembalikan "…" + akhir teks bila panjang teks lebih dari max.
 */
export function tailText(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return "…" + text.slice(-max);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Menghitung faktor zoom tambahan untuk mode ringkasan:
 * zoomFactor = clamp(0.9 * lebarViewport / lebarTotalKota, 0.2, 1).
 * Kota pendek tidak diperbesar di atas 1.
 */
export function computeZoomFactor(lebarViewport: number, lebarTotalKota: number): number {
  if (lebarTotalKota <= 0 || lebarViewport <= 0) return 1.0;
  const rawRatio = (0.9 * lebarViewport) / lebarTotalKota;
  return clamp(rawRatio, 0.2, 1.0);
}

/**
 * Menghitung faktor zoom tambahan dan skala efektif untuk mode ringkasan ("Lihat semua"):
 * zoomFactor = clamp(0.9 * lebarViewport / lebarTotalKota, 0.2, 1) dikalikan worldScale.
 * Kota pendek tidak diperbesar di atas 1.
 */
export function computeOverviewZoom(
  cityTotalWidth: number,
  viewportWidth: number,
  worldScale: number
): { zoomFactor: number; effectiveScale: number } {
  const worldScreenWidth = viewportWidth > 0 && worldScale > 0 ? viewportWidth / worldScale : 1;
  const zoomFactor = computeZoomFactor(worldScreenWidth, cityTotalWidth);

  return {
    zoomFactor,
    effectiveScale: worldScale * zoomFactor,
  };
}
