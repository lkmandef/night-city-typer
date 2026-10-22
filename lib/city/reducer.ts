import type { CityAction, CityState } from "./types";
import { makeBuilding } from "./buildings";

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
      const nextCursorX = state.cursorX + building.width + 4;
      return {
        ...state,
        items: [...state.items, building],
        cursorX: nextCursorX,
      };
    }
    case "RESET": {
      return createInitialCityState(state.seed);
    }
    default:
      return state;
  }
}
