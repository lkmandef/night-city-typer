import { describe, expect, it, vi } from "vitest";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";
import { updateCity } from "@/lib/city/buildings";
import { drawSeparator } from "@/lib/render/separators";
import type { Separator } from "@/lib/city/types";

describe("Separators & Backspace (Fase 4)", () => {
  it("SPACE ganda berturut-turut tidak menambah 2 pemisah", () => {
    let state = createInitialCityState(100);

    // Ketik satu karakter dulu
    state = cityReducer(state, { type: "TYPE_CHAR", char: "a" });
    expect(state.items).toHaveLength(1);

    // Spasi pertama
    state = cityReducer(state, { type: "SPACE" });
    expect(state.items).toHaveLength(2);
    expect("progress" in state.items[1]).toBe(true);

    // Spasi kedua (harus diabaikan)
    const stateAfterSecondSpace = cityReducer(state, { type: "SPACE" });
    expect(stateAfterSecondSpace.items).toHaveLength(2);
    expect(stateAfterSecondSpace.cursorX).toBe(state.cursorX);
  });

  it("BACKSPACE di kota kosong aman dan tidak menimbulkan error", () => {
    const emptyState = createInitialCityState(100);
    expect(() => {
      const result = cityReducer(emptyState, { type: "BACKSPACE" });
      expect(result.items).toHaveLength(0);
    }).not.toThrow();
  });

  it("mengetik 3 huruf lalu 3 backspace dan memproses animasi: items kosong dan cursorX kembali ke awal", () => {
    const initialCursor = 60;
    let state = createInitialCityState(12345);
    state.cursorX = initialCursor;

    // 1. Ketik 3 huruf
    state = cityReducer(state, { type: "TYPE_CHAR", char: "a" });
    state = cityReducer(state, { type: "TYPE_CHAR", char: "b" });
    state = cityReducer(state, { type: "TYPE_CHAR", char: "c" });
    expect(state.items).toHaveLength(3);
    expect(state.cursorX).toBeGreaterThan(initialCursor);

    // 2. Beri 3 kali backspace (mengantrekan status collapsing)
    state = cityReducer(state, { type: "BACKSPACE" });
    state = cityReducer(state, { type: "BACKSPACE" });
    state = cityReducer(state, { type: "BACKSPACE" });

    // Semua item sekarang berstatus collapsing
    expect(state.items.every((it) => it.state === "collapsing")).toBe(true);

    // 3. Jalankan loop animasi runtuh (~1000ms cukup untuk menyelesaikan collapse 700ms)
    // Gunakan beberapa langkah frame 50ms
    for (let t = 0; t < 30; t++) {
      updateCity(state, 50, initialCursor);
    }

    // 4. Setelah selesai runtuh, seluruh item harus terhapus dan cursorX kembali ke awal
    expect(state.items).toHaveLength(0);
    expect(state.cursorX).toBe(initialCursor);
  });

  it("backspace pada pemisah (separator) memundurkan progress lalu menghapusnya", () => {
    const initialCursor = 60;
    let state = createInitialCityState(12345);
    state.cursorX = initialCursor;

    state = cityReducer(state, { type: "TYPE_CHAR", char: "k" });
    state = cityReducer(state, { type: "SPACE" });
    expect(state.items).toHaveLength(2);

    // Tekan backspace pada separator
    state = cityReducer(state, { type: "BACKSPACE" });
    expect(state.items[1].state).toBe("collapsing");

    // Jalankan update sampai separator terhapus (300ms cukup)
    for (let t = 0; t < 10; t++) {
      updateCity(state, 50, initialCursor);
    }

    // Separator terhapus, tersisa 1 gedung
    expect(state.items).toHaveLength(1);
    expect("windows" in state.items[0]).toBe(true);
  });

  it("drawSeparator dapat menggambar road, river, dan park tanpa error", () => {
    const mockCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      setLineDash: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    } as unknown as CanvasRenderingContext2D;

    const kinds: ("road" | "river" | "park")[] = ["road", "river", "park"];
    for (const kind of kinds) {
      const sep: Separator = {
        id: 1,
        x: 100,
        width: 70,
        kind,
        progress: 1,
      };
      expect(() => drawSeparator(mockCtx, sep, 400, 1000)).not.toThrow();
    }
  });
});
