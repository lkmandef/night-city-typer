import { describe, expect, it } from "vitest";
import type { CityAction } from "@/lib/city/types";

describe("Input Handling & Deduplication (Fase 2)", () => {
  function createInputCoordinator(onDispatch: (action: CityAction) => void) {
    let lastKey = "";
    let lastSource = "";
    let lastTime = 0;

    return {
      handleAction(action: CityAction, source: "keydown" | "beforeinput", currentTime: number) {
        const actionKey =
          action.type === "TYPE_CHAR" ? `CHAR_${action.char}` : action.type;

        if (
          lastKey === actionKey &&
          lastSource !== source &&
          currentTime - lastTime < 100
        ) {
          return false; // diduplikasi, diabaikan
        }

        lastKey = actionKey;
        lastSource = source;
        lastTime = currentTime;
        onDispatch(action);
        return true;
      },
    };
  }

  it("menerima aksi huruf, spasi, backspace, dan enter", () => {
    const dispatched: CityAction[] = [];
    const coordinator = createInputCoordinator((a) => dispatched.push(a));

    coordinator.handleAction({ type: "TYPE_CHAR", char: "a" }, "keydown", 100);
    coordinator.handleAction({ type: "SPACE" }, "keydown", 250);
    coordinator.handleAction({ type: "BACKSPACE" }, "keydown", 400);
    coordinator.handleAction({ type: "ENTER" }, "keydown", 550);

    expect(dispatched).toHaveLength(4);
    expect(dispatched[0]).toEqual({ type: "TYPE_CHAR", char: "a" });
    expect(dispatched[1]).toEqual({ type: "SPACE" });
    expect(dispatched[2]).toEqual({ type: "BACKSPACE" });
    expect(dispatched[3]).toEqual({ type: "ENTER" });
  });

  it("mencegah duplikasi jika aksi yang sama dikirim oleh keydown lalu beforeinput dalam 100ms", () => {
    const dispatched: CityAction[] = [];
    const coordinator = createInputCoordinator((a) => dispatched.push(a));

    // Event keydown pada t = 100
    const r1 = coordinator.handleAction({ type: "TYPE_CHAR", char: "k" }, "keydown", 100);
    // Event beforeinput pada t = 105 (duplikat dari keystroke yang sama)
    const r2 = coordinator.handleAction({ type: "TYPE_CHAR", char: "k" }, "beforeinput", 105);

    expect(r1).toBe(true);
    expect(r2).toBe(false);
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({ type: "TYPE_CHAR", char: "k" });
  });

  it("mengizinkan dua karakter sama yang berurutan dari sumber yang sama (misal 'oo')", () => {
    const dispatched: CityAction[] = [];
    const coordinator = createInputCoordinator((a) => dispatched.push(a));

    const r1 = coordinator.handleAction({ type: "TYPE_CHAR", char: "o" }, "keydown", 100);
    const r2 = coordinator.handleAction({ type: "TYPE_CHAR", char: "o" }, "keydown", 180);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(dispatched).toHaveLength(2);
  });

  it("mengizinkan dua karakter berbeda dalam rentang waktu singkat", () => {
    const dispatched: CityAction[] = [];
    const coordinator = createInputCoordinator((a) => dispatched.push(a));

    const r1 = coordinator.handleAction({ type: "TYPE_CHAR", char: "a" }, "keydown", 100);
    const r2 = coordinator.handleAction({ type: "TYPE_CHAR", char: "b" }, "beforeinput", 120);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(dispatched).toHaveLength(2);
  });
});
