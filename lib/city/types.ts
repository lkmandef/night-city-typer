/**
 * Definisi tipe data inti untuk Night City Typer.
 * Catatan arsitektur: file ini murni TypeScript, tidak boleh mengimpor React atau API canvas.
 */

export type CityAction =
  | { type: "TYPE_CHAR"; char: string }
  | { type: "SPACE" }
  | { type: "BACKSPACE" }
  | { type: "ENTER" }
  | { type: "RESET" };

export type BuildingKind = "tower" | "block" | "house" | "lamp";

export type RoofKind = "flat" | "setback" | "watertank" | "antenna";

export interface BuildingWindow {
  col: number;
  row: number;
  lit: boolean;
  litAt: number;
  hue: "warm" | "cool";
  isLetter?: boolean;
  isZone?: boolean;
  isStorefront?: boolean;
  isHalo?: boolean;
  brightness?: number;
  rawLitRand?: number;
  rawBrightnessRand?: number;
  rawColorIndex?: number;
}

export type Window = BuildingWindow;

export interface Building {
  id: number;
  char: string;
  kind: BuildingKind;
  x: number;
  width: number;
  height: number;
  grow: number;
  windows: BuildingWindow[];
  state: "growing" | "alive" | "collapsing";
  collapse: number;
  lightTimer?: number;
  collapseTimer?: number;
  letterTimer?: number;
  isSilhouette?: boolean;
  glyph?: string[];
  letterBaseline?: number;
  letterCell?: number;
  roofKind?: RoofKind;
  gap?: number;
  hasDoor?: boolean;
  cols?: number;
  extraFloors?: number;
  dominantHue?: "warm" | "cool";
}

export type SeparatorKind = "road" | "river" | "park";

export interface Separator {
  id: number;
  x: number;
  width: number;
  kind: SeparatorKind;
  progress: number;
  state?: "entering" | "alive" | "collapsing";
}

export type CityItem = Building | Separator;

export interface CityState {
  items: CityItem[];
  cursorX: number;
  cameraX: number;
  cameraTarget: number;
  timeOfDay: number; // 0 (malam) .. 1 (fajar)
  seed: number;
}
