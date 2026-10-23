/**
 * Sumber konfigurasi tunggal untuk parameter tampilan dan penyetelan visual Night City Typer.
 * Objek ini dapat diubah saat runtime oleh TuningPanel (?tune=1).
 * Catatan arsitektur: file ini murni TypeScript tanpa dependensi React atau Canvas DOM.
 */

export interface CityConfig {
  // Grid & Struktur Bangunan
  CELL: number; // Ukuran sel jendela persegi (px dunia)
  PODIUM_ROWS: number; // Jumlah baris podium bawah (baseline = PODIUM_ROWS * CELL)
  LETTER_ROWS: number; // Baris zona huruf (7 baris)
  ROOF_MARGIN_ROWS: number; // Margin atap di atas zona huruf (2 baris)
  MIN_EXTRA_FLOORS: number; // Tambahan lantai atas minimum (baris)
  MAX_EXTRA_FLOORS: number; // Tambahan lantai atas maksimum (baris)
  MIN_GAP: number; // Celah minimum antar gedung berhuruf (px)
  MAX_GAP: number; // Celah maksimum antar gedung berhuruf (px)
  COL_WEIGHTS: { 5: number; 7: number }; // Bobot jumlah kolom ganjil (hanya 5 dan 7 kolom)

  // Rasio Jendela, Dominansi & Kecerahan
  DOMINANT_COLOR_RATIO: number; // Rasio jendela ber-warna dominan gedung (~0.75)
  OTHER_LIT_RATIO: number; // Rasio jendela non-huruf menyala (~0.8)
  ZONE_LIT_RATIO: number; // Rasio jendela non-huruf di zona 5x7 menyala (~0.60)
  BG_BRIGHTNESS_MIN: number; // Kecerahan minimum jendela latar (0.50)
  BG_BRIGHTNESS_MAX: number; // Kecerahan maksimum jendela latar (0.75)
  ZONE_BRIGHTNESS_MIN: number; // Kecerahan minimum non-huruf di zona huruf (0.20)
  ZONE_BRIGHTNESS_MAX: number; // Kecerahan maksimum non-huruf di zona huruf (0.32)
  HALO_BRIGHTNESS: number; // Pengali kecerahan zona 1 sel sekitar huruf (0.50)
  ACCENT_COLOR_RATIO: number; // Rasio warna aksen minor (teal/magenta) maksimal 2% (0.02)
  ACCENT_BRIGHTNESS_MAX: number; // Kecerahan maksimal warna aksen minor (0.40)

  // Warna & Glow Huruf
  LETTER_COLOR: string; // Warna piksel huruf ("#ffffff")
  letterColorId: string; // Id preset warna huruf ("putih", "emas", dsb) atau "rainbow"
  LETTER_GLOW_COLOR: string; // Warna glow huruf
  LETTER_GLOW_OPACITY: number; // Opacity radial glow per huruf (0.22)
  LETTER_GLOW_RADIUS_MULT: number; // Ukuran glow relatif terhadap tinggi huruf (1.6x)
  WARM_ZONE_BRIGHTNESS_MULT: number; // Pengali kecerahan non-huruf di zona huruf jika warna huruf hangat (0.7)
  WARM_ZONE_SATURATION_MULT: number; // Pengali saturasi non-huruf di zona huruf jika warna huruf hangat (0.7)

  // Pemisah (Separators)
  RIVER_PARK_MIN_WIDTH: number; // Lebar minimum sungai dan taman (70 px)
  RIVER_PARK_MAX_WIDTH: number; // Lebar maksimum sungai dan taman (110 px)
  ROAD_MIN_WIDTH: number; // Lebar minimum jalan (65 px)
  ROAD_MAX_WIDTH: number; // Lebar maksimum jalan (95 px)
}

export const defaultConfig: Readonly<CityConfig> = {
  CELL: 11,
  PODIUM_ROWS: 5,
  LETTER_ROWS: 7,
  ROOF_MARGIN_ROWS: 2,
  MIN_EXTRA_FLOORS: 2,
  MAX_EXTRA_FLOORS: 10,
  MIN_GAP: 4,
  MAX_GAP: 8,
  COL_WEIGHTS: { 5: 0.65, 7: 0.35 },

  DOMINANT_COLOR_RATIO: 0.75,
  OTHER_LIT_RATIO: 0.8,
  ZONE_LIT_RATIO: 0.6,
  BG_BRIGHTNESS_MIN: 0.5,
  BG_BRIGHTNESS_MAX: 0.75,
  ZONE_BRIGHTNESS_MIN: 0.2,
  ZONE_BRIGHTNESS_MAX: 0.32,
  HALO_BRIGHTNESS: 0.5,
  ACCENT_COLOR_RATIO: 0.02,
  ACCENT_BRIGHTNESS_MAX: 0.4,

  LETTER_COLOR: "#ffffff",
  letterColorId: "putih",
  LETTER_GLOW_COLOR: "rgba(210, 230, 255, 0.22)",
  LETTER_GLOW_OPACITY: 0.22,
  LETTER_GLOW_RADIUS_MULT: 1.6,
  WARM_ZONE_BRIGHTNESS_MULT: 0.7,
  WARM_ZONE_SATURATION_MULT: 0.7,

  RIVER_PARK_MIN_WIDTH: 70,
  RIVER_PARK_MAX_WIDTH: 110,
  ROAD_MIN_WIDTH: 65,
  ROAD_MAX_WIDTH: 95,
};

// Singleton runtime config yang dapat dimodifikasi saat live preview (?tune=1)
export const currentConfig: CityConfig = { ...defaultConfig };

type ConfigListener = (config: CityConfig) => void;
const listeners = new Set<ConfigListener>();

export function updateConfig(partial: Partial<CityConfig>): void {
  Object.assign(currentConfig, partial);
  listeners.forEach((fn) => fn(currentConfig));
}

export function resetConfig(): void {
  Object.assign(currentConfig, defaultConfig);
  listeners.forEach((fn) => fn(currentConfig));
}

export function subscribeConfig(listener: ConfigListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
