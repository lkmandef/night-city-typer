/**
 * Logika murni simulasi karakter berjalan (Walkers FR-16).
 * Catatan arsitektur: file ini murni TypeScript, tidak mengimpor React atau API canvas.
 */

import type { BuildingGroup } from "./groups";
import {
  WALKER_CAT_SIT_CHANCE,
  WALKER_CAT_SPEED_MAX,
  WALKER_CAT_SPEED_MIN,
  WALKER_HUMAN_SPEED_MAX,
  WALKER_HUMAN_SPEED_MIN,
} from "./config";

import { getWalkerLaneY } from "./ground";

export type WalkerKind = "cat" | "human";
export type WalkerState = "enter" | "walk" | "pause" | "sit" | "exit";

export interface Walker {
  id: number;
  groupKey: number;
  kind: WalkerKind;
  x: number;
  laneIndex: number;
  laneY: number;
  dir: 1 | -1;
  state: WalkerState;
  stateTimer: number;
  frame: number;
  frameTimer: number;
  alpha: number;
  speed: number;
  currentSpeed?: number;
  rngState: number;
  exitDuration?: number;
  lookFlip?: boolean;
  isTailWag?: boolean;
}

/**
 * Satu langkah PRNG deterministik mulberry32 yang mengembalikan nilai [0, 1) dan state berikutnya.
 */
export function nextRng(s: number): [number, number] {
  const nextS = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(nextS ^ (nextS >>> 15), 1 | nextS);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const val = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [val, nextS];
}

/**
 * Helper untuk mengambil angka acak deterministik berikutnya dari state RNG walker.
 */
export function stepWalkerRand(w: Walker): number {
  const [val, nextS] = nextRng(w.rngState);
  w.rngState = nextS;
  return val;
}

let walkerIdCounter = 1;

/**
 * Membuat walker baru untuk sebuah kelompok gedung.
 * Jenis deterministik dari mulberry32(worldSeed + groupKey * 7919): 50% kucing, 50% manusia.
 */
export function createWalker(
  group: BuildingGroup,
  worldSeed: number
): Walker {
  let s = (worldSeed + group.key * 7919) | 0;

  // 1. Jenis karakter (50% kucing, 50% manusia)
  let r: number;
  [r, s] = nextRng(s);
  const kind: WalkerKind = r < 0.5 ? "cat" : "human";

  // 2. Kecepatan acak per karakter
  [r, s] = nextRng(s);
  const speed =
    kind === "cat"
      ? WALKER_CAT_SPEED_MIN + r * (WALKER_CAT_SPEED_MAX - WALKER_CAT_SPEED_MIN)
      : WALKER_HUMAN_SPEED_MIN + r * (WALKER_HUMAN_SPEED_MAX - WALKER_HUMAN_SPEED_MIN);

  // 3. Posisi lajur trotoar (3 lajur: 0=dekat podium, 1=tengah, 2=dekat curb)
  [r, s] = nextRng(s);
  const laneIndex = r < 0.333 ? 0 : r < 0.666 ? 1 : 2;
  const laneY = getWalkerLaneY(laneIndex);

  // 4. Arah jalan awal (-1 atau 1)
  [r, s] = nextRng(s);
  const dir: 1 | -1 = r < 0.5 ? 1 : -1;

  // 5. Posisi awal x: jika ada pintu podium, di pintu itu; jika tidak, di tengah rentang
  const spawnX =
    group.doorX !== undefined ? group.doorX : (group.minX + group.maxX) / 2;
  const clampedX = Math.max(group.minX, Math.min(group.maxX, spawnX));

  return {
    id: walkerIdCounter++,
    groupKey: group.key,
    kind,
    x: clampedX,
    laneIndex,
    laneY,
    dir,
    state: "enter",
    stateTimer: 0.5, // fade-in 500 ms
    frame: 0,
    frameTimer: 0,
    alpha: 0,
    speed,
    currentSpeed: 0,
    rngState: s,
    exitDuration: 0.5,
  };
}

/**
 * Memperbarui posisi, animasi, dan status semua walker.
 * Fungsi murni tanpa efek samping React atau Canvas.
 */
export function updateWalkers(
  walkers: Walker[],
  groups: BuildingGroup[],
  dt: number,
  worldSeed: number,
  reducedMotion: boolean = false
): Walker[] {
  // dt dibatasi maksimal 50 ms
  const dtSec = dt > 1 ? Math.min(dt, 50) / 1000 : Math.min(dt, 0.05);
  if (dtSec <= 0) return walkers;

  const groupMap = new Map<number, BuildingGroup>();
  for (const g of groups) {
    groupMap.set(g.key, g);
  }

  const updated: Walker[] = [];

  for (const w of walkers) {
    const group = groupMap.get(w.groupKey);

    if (group) {
      // Kelompok masih ada
      if (w.state === "exit") {
        // Pulihkan jika sebelumnya berstatus exit
        w.state = "walk";
        w.stateTimer = 1.0;
        w.alpha = 1;
      }

      // Penyesuaian batas jika rentang berubah (kelompok menyusut atau bertambah)
      // Dipindahkan halus ke dalam [minX, maxX] dengan kecepatan 40 px/s
      if (w.x < group.minX) {
        w.x = Math.min(group.minX, w.x + 40 * dtSec);
        w.dir = 1;
      } else if (w.x > group.maxX) {
        w.x = Math.max(group.maxX, w.x - 40 * dtSec);
        w.dir = -1;
      } else {
        // Walker berada di dalam rentang normal [minX, maxX]
        switch (w.state) {
          case "enter": {
            w.stateTimer -= dtSec;
            w.alpha = Math.min(1, 1 - Math.max(0, w.stateTimer) / 0.5);
            if (w.stateTimer <= 0) {
              w.alpha = 1;
              w.state = "walk";
              w.stateTimer = 2.0 + stepWalkerRand(w) * 3.0;
              w.frame = 0;
              w.frameTimer = 0;
            }
            break;
          }

          case "walk": {
            // Percepatan halus saat mulai berjalan (~0.3 detik untuk mencapai kecepatan penuh)
            const accel = w.speed / 0.3;
            w.currentSpeed = Math.min(w.speed, (w.currentSpeed ?? 0) + accel * dtSec);

            const effectiveSpeed = (reducedMotion ? 0.4 : 1.0) * w.currentSpeed;
            w.x += w.dir * effectiveSpeed * dtSec;

            w.lookFlip = false;
            w.isTailWag = false;

            // Frame animasi jalan (0 dan 1) berganti tiap ~150 ms
            w.frameTimer += dtSec;
            if (w.frameTimer >= 0.15) {
              w.frameTimer = 0;
              w.frame = (w.frame + 1) % 2;
            }

            // Batas rentang kelompok
            if (w.dir === -1 && w.x <= group.minX) {
              w.x = group.minX;
              w.dir = 1;
              w.state = "pause";
              w.currentSpeed = 0;
              // Jeda pendek saat berbalik di batas (0.3 .. 0.6 detik)
              w.stateTimer = 0.3 + stepWalkerRand(w) * 0.3;
              w.frame = 0;
            } else if (w.dir === 1 && w.x >= group.maxX) {
              w.x = group.maxX;
              w.dir = -1;
              w.state = "pause";
              w.currentSpeed = 0;
              // Jeda pendek saat berbalik di batas (0.3 .. 0.6 detik)
              w.stateTimer = 0.3 + stepWalkerRand(w) * 0.3;
              w.frame = 0;
            } else {
              w.stateTimer -= dtSec;
              if (w.stateTimer <= 0) {
                w.currentSpeed = 0;
                // Jeda acak atau kucing duduk
                if (
                  w.kind === "cat" &&
                  !reducedMotion &&
                  stepWalkerRand(w) < WALKER_CAT_SIT_CHANCE
                ) {
                  w.state = "sit";
                  w.stateTimer = 2.0 + stepWalkerRand(w) * 3.0; // 2..5 detik
                  w.frame = 0;
                } else {
                  w.state = "pause";
                  w.stateTimer = 0.8 + stepWalkerRand(w) * 2.2; // 0.8..3 detik
                  w.frame = 0;
                }
              }
            }
            break;
          }

          case "pause": {
            w.frame = 0;
            w.stateTimer -= dtSec;

            // Kucing menggoyang ekor saat jeda (frame tambahan idle_wag)
            if (w.kind === "cat" && !reducedMotion) {
              w.frameTimer += dtSec;
              if (w.frameTimer >= 0.35) {
                w.frameTimer = 0;
                w.isTailWag = !w.isTailWag;
              }
            } else {
              w.isTailWag = false;
            }

            // Manusia sesekali menoleh (cermin singkat) saat jeda
            if (w.kind === "human" && !reducedMotion) {
              if (w.stateTimer > 0.6 && w.stateTimer < 1.2) {
                w.lookFlip = true;
              } else {
                w.lookFlip = false;
              }
            } else {
              w.lookFlip = false;
            }

            if (w.stateTimer <= 0) {
              w.lookFlip = false;
              w.isTailWag = false;
              w.state = "walk";
              w.stateTimer = 2.0 + stepWalkerRand(w) * 3.0;
              w.frame = 0;
              w.frameTimer = 0;
              w.currentSpeed = 0;
            }
            break;
          }

          case "sit": {
            w.frame = 0;
            w.lookFlip = false;
            w.isTailWag = false;
            w.stateTimer -= dtSec;
            if (w.stateTimer <= 0) {
              w.state = "walk";
              w.stateTimer = 2.0 + stepWalkerRand(w) * 3.0;
              w.frame = 0;
              w.frameTimer = 0;
              w.currentSpeed = 0;
            }
            break;
          }
        }

        // Pastikan tidak pernah berada di luar rentang setelah berada di dalam
        w.x = Math.max(group.minX, Math.min(group.maxX, w.x));
      }

      updated.push(w);
    } else {
      // Kelompok hilang (jumlah gedung < 4 atau runtuh)
      if (w.state !== "exit") {
        w.state = "exit";
        w.exitDuration = 0.5;
        w.stateTimer = 0.5;
      }

      w.stateTimer -= dtSec;
      const duration = w.exitDuration ?? 0.5;
      w.alpha = Math.max(0, w.stateTimer / duration);

      // Pertahankan hingga fade-out selesai
      if (w.stateTimer > 0 && w.alpha > 0) {
        updated.push(w);
      }
    }
  }

  // Cek kelompok baru yang belum memiliki walker
  for (const group of groups) {
    const hasWalker = updated.some(
      (w) => w.groupKey === group.key && w.state !== "exit"
    );
    if (!hasWalker) {
      updated.push(createWalker(group, worldSeed));
    }
  }

  return updated;
}
