/**
 * Logika pengelompokan gedung untuk karakter berjalan (Walkers FR-16).
 * Catatan arsitektur: file ini murni TypeScript tanpa dependensi React atau Canvas DOM.
 */

import type { Building, CityItem } from "./types";
import {
  WALKER_BOUNDS_MARGIN,
  WALKER_CHUNK,
  WALKER_MIN_GROUP,
  WALKER_MAX_GROUP,
} from "./config";

export interface BuildingGroup {
  key: number;
  firstId: number;
  lastId: number;
  minX: number;
  maxX: number;
  count: number;
  doorX?: number;
}

/**
 * Memecah rangkaian gedung berurutan:
 * - Panjang < 4: tidak ada kelompok.
 * - Panjang 4..7: menjadi 1 kelompok.
 * - Panjang > 7: dipecah per 5, dan sisa < 4 digabung ke kelompok sebelumnya.
 */
export function splitBuildingRun(run: Building[]): Building[][] {
  const n = run.length;
  if (n < WALKER_MIN_GROUP) return [];
  if (n <= WALKER_MAX_GROUP) return [run];

  const chunks: Building[][] = [];
  for (let i = 0; i < n; i += WALKER_CHUNK) {
    chunks.push(run.slice(i, i + WALKER_CHUNK));
  }

  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1];
    if (last.length < WALKER_MIN_GROUP) {
      chunks.pop();
      chunks[chunks.length - 1] = chunks[chunks.length - 1].concat(last);
    }
  }

  return chunks;
}

/**
 * Menghitung kelompok gedung dari daftar item kota.
 * Kelompok adalah rangkaian Building bersebelahan tanpa Separator di antaranya.
 * Gedung dengan state "collapsing" tidak dihitung.
 */
export function computeGroups(
  items: CityItem[],
  margin: number = WALKER_BOUNDS_MARGIN
): BuildingGroup[] {
  const groups: BuildingGroup[] = [];
  let currentRun: Building[] = [];

  const processRun = (run: Building[]) => {
    if (run.length < WALKER_MIN_GROUP) return;
    const chunks = splitBuildingRun(run);
    for (const chunk of chunks) {
      const first = chunk[0];
      const last = chunk[chunk.length - 1];

      let doorX: number | undefined;
      for (const b of chunk) {
        if (b.glyph && b.hasDoor) {
          const cols = b.cols ?? 5;
          const doorCol = Math.floor(cols / 2);
          const cell = b.letterCell ?? 11;
          doorX = b.x + doorCol * cell + 5.5;
          break;
        }
      }

      groups.push({
        key: first.id,
        firstId: first.id,
        lastId: last.id,
        minX: first.x + margin,
        maxX: last.x + last.width - margin,
        count: chunk.length,
        doorX,
      });
    }
  };

  for (const item of items) {
    if ("windows" in item && item.state !== "collapsing") {
      currentRun.push(item);
    } else {
      if (currentRun.length > 0) {
        processRun(currentRun);
        currentRun = [];
      }
    }
  }

  if (currentRun.length > 0) {
    processRun(currentRun);
  }

  return groups;
}
