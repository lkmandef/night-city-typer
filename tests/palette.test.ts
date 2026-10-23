import { describe, expect, it, vi } from "vitest";
import {
  getGlowColor,
  getHueFromColor,
  getLetterColor,
  getRelativeLuminance,
  LETTER_PRESETS,
  loadSavedLetterColor,
  saveLetterColor,
} from "@/lib/city/palette";

describe("Palette & Letter Color (FR-17)", () => {
  it("getLetterColor deterministik untuk preset dan id yang sama", () => {
    for (const preset of LETTER_PRESETS) {
      const color1 = getLetterColor(preset.id, 0);
      const color2 = getLetterColor(preset.id, 0);
      expect(color1).toBe(preset.hex);
      expect(color1).toBe(color2);
    }
  });

  it("semua preset memiliki luminansi relatif minimal 0.4 (rumus WCAG)", () => {
    for (const preset of LETTER_PRESETS) {
      const luminance = getRelativeLuminance(preset.hex);
      expect(luminance).toBeGreaterThanOrEqual(0.4);
    }
  });

  it("?warna dengan id tidak valid jatuh ke putih, sedangkan id valid diterima", () => {
    // ID tidak valid
    expect(loadSavedLetterColor("?warna=invalid_color")).toBe("putih");
    expect(loadSavedLetterColor("?warna=hitam")).toBe("putih");
    expect(loadSavedLetterColor("?warna=")).toBe("putih");

    // ID valid
    expect(loadSavedLetterColor("?warna=emas")).toBe("emas");
    expect(loadSavedLetterColor("?warna=cyan")).toBe("cyan");
    expect(loadSavedLetterColor("?warna=rainbow")).toBe("rainbow");
  });

  it("mode pelangi menghasilkan warna berbeda untuk index gedung berbeda", () => {
    const c0 = getLetterColor("rainbow", 0);
    const c1 = getLetterColor("rainbow", 1);
    const c2 = getLetterColor("rainbow", 2);
    const c3 = getLetterColor("rainbow", 3);

    // Masing-masing index harus menghasilkan hex yang valid dan berbeda
    expect(c0).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c1).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c2).toMatch(/^#[0-9a-f]{6}$/i);

    expect(c0).not.toBe(c1);
    expect(c1).not.toBe(c2);
    expect(c2).not.toBe(c3);

    // Deterministik untuk index yang sama
    expect(getLetterColor("rainbow", 5)).toBe(getLetterColor("rainbow", 5));
  });

  it("localStorage yang melempar error tidak membuat aplikasi crash", () => {
    const originalWindow = (globalThis as unknown as { window?: unknown }).window;

    // Simulasikan window dengan localStorage yang melempar error
    (globalThis as unknown as { window: unknown }).window = {
      location: { search: "" },
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("SecurityError: Access is denied for this document");
        }),
        setItem: vi.fn(() => {
          throw new Error("QuotaExceededError: DOM Exception 22");
        }),
      },
    };

    expect(() => {
      const loaded = loadSavedLetterColor("");
      expect(loaded).toBe("putih");
    }).not.toThrow();

    expect(() => {
      saveLetterColor("emas");
    }).not.toThrow();

    // Kembalikan window asli
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  });

  it("getGlowColor menurunkan rgba secara tepat dari warna huruf", () => {
    expect(getGlowColor("#ffffff", 0.22)).toBe("rgba(255, 255, 255, 0.220)");
    expect(getGlowColor("#ffd24a", 0.5)).toBe("rgba(255, 210, 74, 0.500)");
    expect(getGlowColor("#5ff3ff", 0)).toBe("rgba(95, 243, 255, 0.000)");
  });

  it("getHueFromColor mendeteksi warna hangat emas dan oranye dalam rentang 20-55 derajat", () => {
    const hueEmas = getHueFromColor("#ffd24a");
    const hueOranye = getHueFromColor("#ff9a3c");
    const hueCyan = getHueFromColor("#5ff3ff");
    const huePutih = getHueFromColor("#ffffff");

    expect(hueEmas).toBeGreaterThanOrEqual(20);
    expect(hueEmas).toBeLessThanOrEqual(55);

    expect(hueOranye).toBeGreaterThanOrEqual(20);
    expect(hueOranye).toBeLessThanOrEqual(55);

    // Cyan dan putih berada di luar rentang hangat 20-55
    expect(hueCyan >= 20 && hueCyan <= 55).toBe(false);
    expect(huePutih >= 20 && huePutih <= 55).toBe(false);
  });
});
