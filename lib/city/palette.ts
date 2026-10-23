/**
 * Preset warna huruf dan utilitas warna untuk Night City Typer (FR-17).
 * Catatan arsitektur: file ini berisi fungsi murni TypeScript tanpa dependensi React atau Canvas DOM.
 */

export interface LetterColorPreset {
  id: string;
  name: string;
  hex: string;
}

export const LETTER_PRESETS: LetterColorPreset[] = [
  { id: "putih", name: "Putih", hex: "#ffffff" },
  { id: "emas", name: "Emas", hex: "#ffd24a" },
  { id: "cyan", name: "Cyan", hex: "#5ff3ff" },
  { id: "hijau", name: "Hijau", hex: "#6dff9c" },
  { id: "pink", name: "Pink", hex: "#ff6fb5" },
  { id: "ungu", name: "Ungu", hex: "#b58cff" },
  { id: "merah", name: "Merah", hex: "#ff5a5a" },
  { id: "oranye", name: "Oranye", hex: "#ff9a3c" },
];

export const VALID_COLOR_IDS = new Set<string>([
  ...LETTER_PRESETS.map((p) => p.id),
  "rainbow",
]);

export function isValidColorId(id: string): boolean {
  return VALID_COLOR_IDS.has(id);
}

/**
 * Konversi HSL ke Hex (#rrggbb).
 */
export function hslToHex(h: number, s: number, l: number): string {
  const normH = ((h % 360) + 360) % 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normL = Math.max(0, Math.min(100, l)) / 100;

  const a = normS * Math.min(normL, 1 - normL);
  const f = (n: number) => {
    const k = (n + normH / 30) % 12;
    const color = normL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Mengurai string warna (#hex atau rgb) menjadi komponen [r, g, b].
 */
export function parseRgb(color: string): { r: number; g: number; b: number } {
  if (color.startsWith("#")) {
    const raw = color.slice(1);
    if (raw.length === 3) {
      return {
        r: parseInt(raw[0] + raw[0], 16),
        g: parseInt(raw[1] + raw[1], 16),
        b: parseInt(raw[2] + raw[2], 16),
      };
    }
    if (raw.length >= 6) {
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
      };
    }
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Fallback default putih
  return { r: 255, g: 255, b: 255 };
}

/**
 * Mendapatkan warna huruf berdasarkan setting yang dipilih dan index gedung.
 * - Jika setting "rainbow", warna huruf dihitung dengan HSL ((indexGedung * 37) % 360, 100%, 70%).
 * - Jika setting merupakan hex langsung (misal dari panel ?tune=1), kembalikan langsung.
 * - Jika id valid pada LETTER_PRESETS, kembalikan hex preset.
 * - Fallback: putih ("#ffffff").
 */
export function getLetterColor(setting: string, indexGedung = 0): string {
  if (setting === "rainbow") {
    const hue = (Math.abs(indexGedung) * 37) % 360;
    return hslToHex(hue, 100, 70);
  }

  if (setting.startsWith("#")) {
    return setting;
  }

  const preset = LETTER_PRESETS.find((p) => p.id === setting);
  if (preset) {
    return preset.hex;
  }

  return "#ffffff";
}

/**
 * Menurunkan warna glow (rgba) dari warna huruf dengan nilai alpha tertentu.
 */
export function getGlowColor(color: string, alpha: number): string {
  const { r, g, b } = parseRgb(color);
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha.toFixed(3)})`;
}

/**
 * Menghitung derajat Hue (0 - 360) dari string warna.
 */
export function getHueFromColor(color: string): number {
  const { r, g, b } = parseRgb(color);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue = 0;
  if (max === rNorm) {
    hue = ((gNorm - bNorm) / delta) % 6;
  } else if (max === gNorm) {
    hue = (bNorm - rNorm) / delta + 2;
  } else {
    hue = (rNorm - gNorm) / delta + 4;
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  return hue;
}

/**
 * Menghitung koefisien luminansi relatif (rumus WCAG) untuk pengujian kontras.
 * Koefisien standar WCAG: 0.2126 * R + 0.7152 * G + 0.0722 * B.
 */
export function getRelativeLuminance(color: string): number {
  const { r, g, b } = parseRgb(color);
  return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
}

export const STORAGE_KEY_LETTER_COLOR = "nct:letter-color";

/**
 * Memuat warna huruf tersimpan:
 * 1. Cek parameter URL ?warna=<id> terlebih dahulu (menang atas localStorage, hanya terima id valid).
 * 2. Cek localStorage ("nct:letter-color").
 * 3. Default "putih".
 */
export function loadSavedLetterColor(customSearch?: string): string {
  // 1. Cek parameter URL ?warna=<id>
  try {
    let search = typeof customSearch === "string" ? customSearch : "";
    if (!search && typeof window !== "undefined" && window.location) {
      search = window.location.search || "";
    }

    if (search) {
      const params = new URLSearchParams(search);
      const urlWarna = params.get("warna");
      if (urlWarna && isValidColorId(urlWarna)) {
        return urlWarna;
      }
    }
  } catch {
    // Abaikan jika parsing URL error
  }

  // 2. Cek localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY_LETTER_COLOR);
      if (saved && isValidColorId(saved)) {
        return saved;
      }
    }
  } catch {
    // Abaikan jika localStorage tidak dapat diakses (misal mode private atau quota)
  }

  return "putih";
}

type ColorListener = () => void;
const colorListeners = new Set<ColorListener>();

export function subscribeLetterColor(listener: ColorListener): () => void {
  colorListeners.add(listener);
  return () => {
    colorListeners.delete(listener);
  };
}

/**
 * Menyimpan warna huruf terpilih ke localStorage dan memberitahu pendengar.
 */
export function saveLetterColor(id: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_LETTER_COLOR, id);
    }
  } catch {
    // Abaikan jika localStorage melempar error
  }
  colorListeners.forEach((fn) => fn());
}
