import type { CityAction, CityState, Separator, SeparatorKind } from "./types";
import { LETTER_BUILDING_GAP, makeBuilding } from "./buildings";
import { mulberry32 } from "./rng";
import { currentConfig } from "./config";

/**
 * State awal kota malam.
 */
export function createInitialCityState(seed = 12345): CityState {
  return {
    items: [],
    cursorX: 60,
    cameraX: 0,
    cameraTarget: 0,
    timeOfDay: 0,
    seed,
  };
}

/**
 * Reducer murni untuk memproses aksi kota tanpa efek samping canvas atau React.
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
      return {
        ...state,
        items: [...state.items, building],
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

      const separator: Separator = {
        id: state.items.length,
        x: state.cursorX,
        width,
        kind,
        progress: 0,
        state: "entering",
      };

      return {
        ...state,
        items: [...state.items, separator],
        cursorX: state.cursorX + width,
      };
    }

    case "BACKSPACE": {
      if (state.items.length === 0) return state;

      // Cari item terakhir dari kanan yang BELUM collapsing
      let targetIndex = -1;
      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        if (item.state !== "collapsing") {
          targetIndex = i;
          break;
        }
      }

      // Jika semua item sudah collapsing atau kota kosong, abaikan tanpa error
      if (targetIndex === -1) return state;

      const newItems = [...state.items];
      newItems[targetIndex] = {
        ...newItems[targetIndex],
        state: "collapsing",
      };

      return {
        ...state,
        items: newItems,
      };
    }

    case "RESET": {
      return createInitialCityState(state.seed);
    }

    default:
      return state;
  }
}
