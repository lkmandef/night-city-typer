import { describe, expect, it } from "vitest";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";
import { updateCity } from "@/lib/city/buildings";
import { interpolatePalette, TIME_PALETTES } from "@/lib/render/sky";
import { easeInOutCubic } from "@/lib/utils/easing";

describe("UI & Feature Polish (Fase 7)", () => {
  it("aksi ENTER mengganti fase waktu secara siklis: malam (0) -> dini hari (1) -> fajar (2) -> malam (0)", () => {
    let state = createInitialCityState(123);
    expect(state.timeOfDay).toBe(0);

    // Enter 1: ke Dini Hari
    state = cityReducer(state, { type: "ENTER" });
    expect(state.timeOfDay).toBe(1);

    // Enter 2: ke Fajar
    state = cityReducer(state, { type: "ENTER" });
    expect(state.timeOfDay).toBe(2);

    // Enter 3: kembali ke Malam
    state = cityReducer(state, { type: "ENTER" });
    expect(state.timeOfDay).toBe(0);
  });

  it("aksi RESET pada kota kosong mengembalikan state awal yang aman", () => {
    const emptyState = createInitialCityState(999);
    const result = cityReducer(emptyState, { type: "RESET" });
    expect(result.items).toHaveLength(0);
    expect(result.cursorX).toBe(emptyState.cursorX);
  });

  it("aksi RESET pada kota berisi gedung meruntuhkan seluruh item beruntun dan mengosongkan kota", () => {
    const initialCursor = 60;
    let state = createInitialCityState(12345);
    state.cursorX = initialCursor;

    // Buat 4 gedung
    state = cityReducer(state, { type: "TYPE_CHAR", char: "k" });
    state = cityReducer(state, { type: "TYPE_CHAR", char: "o" });
    state = cityReducer(state, { type: "TYPE_CHAR", char: "t" });
    state = cityReducer(state, { type: "TYPE_CHAR", char: "a" });
    expect(state.items).toHaveLength(4);

    // Pemicu RESET: items langsung dikosongkan seketika, gedung dipindahkan ke ghosts
    state = cityReducer(state, { type: "RESET" });

    // Items langsung kosong, ghosts berisi seluruh gedung runtuh
    expect(state.items).toHaveLength(0);
    expect(state.ghosts).toHaveLength(4);
    expect(state.ghosts.every((it) => it.state === "collapsing")).toBe(true);

    // Jalankan loop animasi hingga seluruh gedung selesai runtuh
    for (let t = 0; t < 35; t++) {
      updateCity(state, 50, initialCursor);
    }

    // Kota sekarang harus bersih dan cursorX kembali ke awal
    expect(state.items).toHaveLength(0);
    expect(state.ghosts).toHaveLength(0);
    expect(state.cursorX).toBe(initialCursor);
  });

  it("interpolatePalette melakukan interpolasi halus warna dan parameter atmosfer", () => {
    // Pada t = 0 harus sama persis dengan palette awal
    const pal0 = interpolatePalette(0, 1, 0);
    expect(pal0.top).toEqual(TIME_PALETTES[0].top);
    expect(pal0.windowLitFactor).toBe(TIME_PALETTES[0].windowLitFactor);

    // Pada t = 1 harus sama persis dengan palette tujuan
    const pal1 = interpolatePalette(0, 1, 1);
    expect(pal1.top).toEqual(TIME_PALETTES[1].top);
    expect(pal1.windowLitFactor).toBe(TIME_PALETTES[1].windowLitFactor);

    // Pada t = 0.5 harus berada di antara keduanya
    const palHalf = interpolatePalette(0, 1, 0.5);
    expect(palHalf.windowLitFactor).toBeCloseTo(0.75, 2);
    expect(palHalf.top[0]).toBe(Math.round((TIME_PALETTES[0].top[0] + TIME_PALETTES[1].top[0]) / 2));
  });

  it("easeInOutCubic transisi halus pada batas 0, 0.5, dan 1", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 4);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.2)).toBeLessThan(0.2); // mulai perlahan
    expect(easeInOutCubic(0.8)).toBeGreaterThan(0.8); // berakhir perlahan
  });
});
