import { describe, expect, it } from "vitest";
import { cityReducer, createInitialCityState } from "@/lib/city/reducer";
import { LETTER_BUILDING_GAP, updateCity } from "@/lib/city/buildings";
import { mulberry32 } from "@/lib/city/rng";
import type { Building, CityAction, CityItem } from "@/lib/city/types";

function getLogicalText(items: CityItem[]): string {
  return items
    .map((item) => {
      if ("windows" in item) {
        return item.char;
      } else {
        return " ";
      }
    })
    .join("");
}

describe("Model-Based & Fast Backspace Tests (BUTIR 1)", () => {
  it("skenario eksplisit: 'halo' + BACKSPACE + 'x' menghasilkan 'halx' dan ghost hilang kemudian", () => {
    let state = createInitialCityState(12345);

    // Ketik 'h', 'a', 'l', 'o'
    for (const ch of "halo") {
      state = cityReducer(state, { type: "TYPE_CHAR", char: ch });
    }
    expect(getLogicalText(state.items)).toBe("halo");
    expect(state.ghosts).toHaveLength(0);

    const oPositionX = state.items[3].x;

    // Tekan BACKSPACE sekali
    state = cityReducer(state, { type: "BACKSPACE" });
    expect(getLogicalText(state.items)).toBe("hal");
    expect(state.cursorX).toBe(oPositionX);
    expect(state.ghosts).toHaveLength(1);
    expect(state.ghosts[0].state).toBe("collapsing");

    // Langsung ketik 'x' sebelum animasi runtuh selesai (< 700 ms)
    state = cityReducer(state, { type: "TYPE_CHAR", char: "x" });
    expect(getLogicalText(state.items)).toBe("halx");
    expect(state.items[3].x).toBe(oPositionX);
    // Gedung baru 'x' menunda tumbuh (spawnDelay) dan ghost 'o' dipercepat
    expect((state.items[3] as Building).spawnDelay).toBeGreaterThan(0);
    expect(state.ghosts[0].fastCollapse).toBe(true);

    // Jalankan updateCity selama 200 ms (cukup untuk ghost runtuh cepat 150 ms)
    for (let t = 0; t < 5; t++) {
      updateCity(state, 50);
    }

    // Ghost telah hilang sepenuhnya dan gedung 'x' tetap berdiri tegak
    expect(state.ghosts).toHaveLength(0);
    expect(getLogicalText(state.items)).toBe("halx");
    expect(state.items[3].state).toBe("growing");
  });

  it("tiga backspace beruntun lalu kata baru", () => {
    let state = createInitialCityState(12345);

    for (const ch of "malam") {
      state = cityReducer(state, { type: "TYPE_CHAR", char: ch });
    }
    expect(getLogicalText(state.items)).toBe("malam");

    // Tiga backspace beruntun
    state = cityReducer(state, { type: "BACKSPACE" });
    state = cityReducer(state, { type: "BACKSPACE" });
    state = cityReducer(state, { type: "BACKSPACE" });

    expect(getLogicalText(state.items)).toBe("ma");
    expect(state.ghosts).toHaveLength(3);

    // Ketik kata baru 'nado'
    for (const ch of "nado") {
      state = cityReducer(state, { type: "TYPE_CHAR", char: ch });
    }

    expect(getLogicalText(state.items)).toBe("manado");

    // Update sampai semua ghost bersih
    for (let t = 0; t < 15; t++) {
      updateCity(state, 50);
    }
    expect(state.ghosts).toHaveLength(0);
    expect(getLogicalText(state.items)).toBe("manado");
  });

  it("menahan backspace melewati kosong tetap aman", () => {
    let state = createInitialCityState(12345);

    state = cityReducer(state, { type: "TYPE_CHAR", char: "a" });
    expect(state.items).toHaveLength(1);

    // Backspace pertama menghapus 'a'
    state = cityReducer(state, { type: "BACKSPACE" });
    expect(state.items).toHaveLength(0);
    expect(state.cursorX).toBe(60);

    // 10 kali backspace saat kota sudah kosong
    for (let i = 0; i < 10; i++) {
      state = cityReducer(state, { type: "BACKSPACE" });
      expect(state.items).toHaveLength(0);
      expect(state.cursorX).toBe(60);
    }
  });

  it("mengetik saat RESET berlangsung tetap benar", () => {
    let state = createInitialCityState(12345);

    for (const ch of "kota") {
      state = cityReducer(state, { type: "TYPE_CHAR", char: ch });
    }
    expect(state.items).toHaveLength(4);

    // Trigger RESET
    state = cityReducer(state, { type: "RESET" });
    expect(state.items).toHaveLength(0);
    expect(state.ghosts).toHaveLength(4);
    expect(state.cursorX).toBe(60);

    // Langsung ketik saat reset masih berjalan
    state = cityReducer(state, { type: "TYPE_CHAR", char: "a" });
    state = cityReducer(state, { type: "TYPE_CHAR", char: "p" });
    state = cityReducer(state, { type: "TYPE_CHAR", char: "i" });

    expect(getLogicalText(state.items)).toBe("api");
    expect(state.items[0].x).toBe(60); // Gedung pertama langsung mulai dari cursorX awal

    // Jalankan animasi runtuh
    for (let t = 0; t < 20; t++) {
      updateCity(state, 50);
    }

    // Seluruh reset ghosts selesai runtuh, dan 'api' tetap utuh
    expect(state.ghosts).toHaveLength(0);
    expect(getLogicalText(state.items)).toBe("api");
  });

  it("cursorX selalu sama dengan jumlah lebar dan celah items", () => {
    let state = createInitialCityState(12345);

    const chars = "abcdef";
    for (const ch of chars) {
      state = cityReducer(state, { type: "TYPE_CHAR", char: ch });
      const last = state.items[state.items.length - 1];
      const gap = "gap" in last && last.gap !== undefined ? last.gap : LETTER_BUILDING_GAP;
      expect(state.cursorX).toBe(last.x + last.width + gap);
    }

    // Mundur 3 kali
    for (let i = 0; i < 3; i++) {
      state = cityReducer(state, { type: "BACKSPACE" });
      const last = state.items[state.items.length - 1];
      const gap = "gap" in last && last.gap !== undefined ? last.gap : LETTER_BUILDING_GAP;
      expect(state.cursorX).toBe(last.x + last.width + gap);
    }
  });

  it("pengujian berbasis model dengan 200 aksi acak dan pembaruan frame", () => {
    const rand = mulberry32(54321);
    let state = createInitialCityState(777);

    // Reference model sederhana
    let modelText = "";

    const alphabet = "abcdefghijklmnopqrstuvwxyz";

    for (let step = 0; step < 200; step++) {
      const roll = rand();
      let action: CityAction;

      if (roll < 0.55) {
        // TYPE_CHAR
        const char = alphabet[Math.floor(rand() * alphabet.length)];
        action = { type: "TYPE_CHAR", char };
        modelText += char;
      } else if (roll < 0.7) {
        // SPACE
        action = { type: "SPACE" };
        if (modelText.length > 0 && !modelText.endsWith(" ")) {
          modelText += " ";
        }
      } else if (roll < 0.95) {
        // BACKSPACE
        action = { type: "BACKSPACE" };
        if (modelText.length > 0) {
          modelText = modelText.slice(0, -1);
        }
      } else {
        // RESET
        action = { type: "RESET" };
        modelText = "";
      }

      state = cityReducer(state, action);

      // Verifikasi konsistensi teks logis
      expect(getLogicalText(state.items)).toBe(modelText);

      // Kadang jalankan frame update dengan dt acak 16..50 ms
      if (rand() < 0.5) {
        const dt = 16 + Math.floor(rand() * 34);
        updateCity(state, dt);
      }

      // Pastikan tidak ada ghost yang collapse >= 1 atau progress <= 0 yang tertinggal
      for (const ghost of state.ghosts) {
        if ("windows" in ghost) {
          expect(ghost.collapse).toBeLessThan(1);
        } else {
          expect(ghost.progress).toBeGreaterThan(0);
        }
      }
    }
  });
});
