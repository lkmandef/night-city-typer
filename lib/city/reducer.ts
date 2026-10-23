import type { CityAction, CityState, GhostItem, Separator, SeparatorKind } from "./types";
import { LETTER_BUILDING_GAP, makeBuilding } from "./buildings";
import { mulberry32 } from "./rng";
import {
  BUILDING_SPAWN_DELAY_ON_GHOST,
  currentConfig,
} from "./config";

/**
 * State awal kota malam.
 */
export function createInitialCityState(seed = 12345): CityState {
  return {
    items: [],
    ghosts: [],
    cursorX: 60,
    cameraX: 0,
    cameraTarget: 0,
    timeOfDay: 0,
    seed,
  };
}

/**
 * Reducer murni untuk memproses aksi kota tanpa efek samping canvas atau React.
 * Logika kota memisahkan `items` (model logis untuk tata letak dan teks)
 * dari `ghosts` (elemen yang sedang runtuh/memudar untuk animasi visual).
 */
export function cityReducer(state: CityState, action: CityAction): CityState {
  switch (action.type) {
    case "TYPE_CHAR": {
      const building = makeBuilding(
        action.char,
        state.items.length,
        state.cursorX,
        state.seed
      );
      const gap = building.gap ?? (building.glyph ? LETTER_BUILDING_GAP : 4);
      const nextCursorX = state.cursorX + building.width + gap;

      // Cek apakah ada ghost di area x yang sama ([state.cursorX, nextCursorX])
      const newX1 = state.cursorX;
      const newX2 = nextCursorX;
      let hasOverlappingGhost = false;

      const nextGhosts = state.ghosts.map((ghost) => {
        const gx1 = ghost.x;
        const gx2 = ghost.x + ghost.width;
        // Overlap jika kedua rentang saling memotong
        if (gx1 < newX2 && gx2 > newX1) {
          hasOverlappingGhost = true;
          return {
            ...ghost,
            fastCollapse: true,
          };
        }
        return ghost;
      });

      if (hasOverlappingGhost) {
        building.spawnDelay = BUILDING_SPAWN_DELAY_ON_GHOST;
      }

      return {
        ...state,
        items: [...state.items, building],
        ghosts: nextGhosts,
        cursorX: nextCursorX,
      };
    }

    case "SPACE": {
      // Jika kota kosong, abaikan spasi
      if (state.items.length === 0) return state;

      // Dua spasi berturut-turut tidak boleh menambah dua pemisah (abaikan yang kedua)
      const lastItem = state.items[state.items.length - 1];
      if (
        "kind" in lastItem &&
        (lastItem.kind === "road" || lastItem.kind === "river" || lastItem.kind === "park")
      ) {
        return state;
      }

      const kinds: SeparatorKind[] = ["road", "river", "park"];
      const rand = mulberry32(state.seed + state.items.length * 359);
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const width =
        kind === "road"
          ? Math.round(
              currentConfig.ROAD_MIN_WIDTH +
                rand() * (currentConfig.ROAD_MAX_WIDTH - currentConfig.ROAD_MIN_WIDTH)
            )
          : Math.round(
              currentConfig.RIVER_PARK_MIN_WIDTH +
                rand() *
                  (currentConfig.RIVER_PARK_MAX_WIDTH - currentConfig.RIVER_PARK_MIN_WIDTH)
            );

      const nextCursorX = state.cursorX + width;
      const separator: Separator = {
        id: state.items.length,
        x: state.cursorX,
        width,
        kind,
        progress: 0,
        state: "entering",
      };

      // Cek apakah ada ghost di area pemisah baru
      const nextGhosts = state.ghosts.map((ghost) => {
        const gx1 = ghost.x;
        const gx2 = ghost.x + ghost.width;
        if (gx1 < nextCursorX && gx2 > state.cursorX) {
          return {
            ...ghost,
            fastCollapse: true,
          };
        }
        return ghost;
      });

      return {
        ...state,
        items: [...state.items, separator],
        ghosts: nextGhosts,
        cursorX: nextCursorX,
      };
    }

    case "BACKSPACE": {
      if (state.items.length === 0) return state;

      const newItems = [...state.items];
      const popped = newItems.pop()!;
      const collapsingGhost: GhostItem = {
        ...popped,
        state: "collapsing",
        collapseTimer: 0,
      };

      // Pastikan lampu huruf langsung padam pada ghost
      if ("windows" in collapsingGhost) {
        collapsingGhost.windows = collapsingGhost.windows.map((w) =>
          w.isLetter ? { ...w, lit: false } : w
        );
      }

      return {
        ...state,
        items: newItems,
        ghosts: [...state.ghosts, collapsingGhost],
        cursorX: popped.x,
      };
    }

    case "ENTER": {
      // Ganti fase waktu: 0 (malam) -> 1 (dini hari) -> 2 (fajar) -> 0 ...
      const nextTime = ((state.timeOfDay ?? 0) + 1) % 3;
      return {
        ...state,
        timeOfDay: nextTime,
      };
    }

    case "RESET": {
      if (state.items.length === 0 && state.ghosts.length === 0) {
        return {
          ...createInitialCityState(state.seed),
          timeOfDay: state.timeOfDay,
        };
      }

      // Animasi runtuh beruntun cepat dari kanan ke kiri untuk seluruh items yang tersisa
      const count = state.items.length;
      const stepDelay = Math.min(30, Math.max(8, Math.floor(300 / Math.max(1, count))));

      const newGhosts: GhostItem[] = state.items.map((item, index) => {
        const reverseIdx = count - 1 - index;
        if ("windows" in item) {
          const windows = item.windows.map((w) => (w.isLetter ? { ...w, lit: false } : w));
          return {
            ...item,
            windows,
            state: "collapsing",
            collapseTimer: -reverseIdx * stepDelay,
          };
        } else {
          return {
            ...item,
            state: "collapsing",
          };
        }
      });

      return {
        ...state,
        items: [],
        ghosts: [...state.ghosts, ...newGhosts],
        cursorX: 60,
      };
    }

    default:
      return state;
  }
}
