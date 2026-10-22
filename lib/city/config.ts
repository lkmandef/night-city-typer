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
  COL_WEIGHTS: { 5: number; 7: number; 9: number }; // Bobot jumlah kolom ganjil

  // Rasio Jendela & Kecerahan
  OTHER_LIT_RATIO: number; // Rasio jendela non-huruf menyala (~0.8)
  ZONE_LIT_RATIO: number; // Rasio jendela non-huruf di zona 5x7 menyala (~0.65)
  BG_BRIGHTNESS_MIN: number; // Kecerahan minimum jendela latar (0.45)
  BG_BRIGHTNESS_MAX: number; // Kecerahan maksimum jendela latar (0.80)
  ZONE_BRIGHTNESS_MIN: number; // Kecerahan minimum non-huruf di zona huruf (0.25)
  ZONE_BRIGHTNESS_MAX: number; // Kecerahan maksimum non-huruf di zona huruf (0.45)
  HALO_BRIGHTNESS: number; // Pengali kecerahan zona 1 sel sekitar huruf (0.50)

  // Warna & Glow Huruf
  LETTER_COLOR: string; // Warna piksel huruf ("#ffffff")
  LETTER_GLOW_COLOR: string; // Warna glow huruf
  LETTER_GLOW_OPACITY: number; // Opacity radial glow per huruf (0.22)
  LETTER_GLOW_RADIUS_MULT: number; // Ukuran glow relatif terhadap tinggi huruf (1.6x)
  COOL_COLOR_RATIO: number; // Rasio jendela warna dingin/biru (~0.30)
  ACCENT_COLOR_RATIO: number; // Rasio warna aksen teal/magenta (~0.05)
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
  COL_WEIGHTS: { 5: 0.6, 7: 0.3, 9: 0.1 },

  OTHER_LIT_RATIO: 0.8,
  ZONE_LIT_RATIO: 0.65,
  BG_BRIGHTNESS_MIN: 0.45,
  BG_BRIGHTNESS_MAX: 0.8,
  ZONE_BRIGHTNESS_MIN: 0.25,
  ZONE_BRIGHTNESS_MAX: 0.45,
  HALO_BRIGHTNESS: 0.5,

  LETTER_COLOR: "#ffffff",
  LETTER_GLOW_COLOR: "rgba(210, 230, 255, 0.22)",
  LETTER_GLOW_OPACITY: 0.22,
  LETTER_GLOW_RADIUS_MULT: 1.6,
  COOL_COLOR_RATIO: 0.3,
  ACCENT_COLOR_RATIO: 0.05,
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
