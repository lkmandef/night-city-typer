import { describe, expect, it } from "vitest";
import { diffText } from "@/lib/input/diff";

describe("Text Diff Logic (lib/input/diff.ts)", () => {
  it("tambah huruf satu per satu", () => {
    expect(diffText("", "a")).toEqual({ removed: 0, added: "a" });
    expect(diffText("a", "ab")).toEqual({ removed: 0, added: "b" });
    expect(diffText("ab", "abc")).toEqual({ removed: 0, added: "c" });
  });

  it("hapus huruf satu per satu (backspace)", () => {
    expect(diffText("abc", "ab")).toEqual({ removed: 1, added: "" });
    expect(diffText("ab", "a")).toEqual({ removed: 1, added: "" });
    expect(diffText("a", "")).toEqual({ removed: 1, added: "" });
  });

  it("ganti saran kata ('hallo' ke 'Halloween')", () => {
    // Penggantian kata saran dari 'hallo' ke 'Halloween' (huruf awal kapital H != h)
    expect(diffText("hallo", "Halloween")).toEqual({
      removed: 5,
      added: "Halloween",
    });

    // Penggantian kata saran di mana prev adalah prefix dari next
    expect(diffText("hallo", "halloween")).toEqual({
      removed: 0,
      added: "ween",
    });

    // Penggantian kata saran dengan sebagian prefix sama (misal 'hal' sama)
    expect(diffText("hallo", "haluan")).toEqual({
      removed: 2, // hapus 'lo'
      added: "uan",
    });
  });

  it("spasi (tambah dan hapus)", () => {
    expect(diffText("halo", "halo ")).toEqual({ removed: 0, added: " " });
    expect(diffText("halo ", "halo")).toEqual({ removed: 1, added: "" });
    expect(diffText("a b", "a b ")).toEqual({ removed: 0, added: " " });
  });

  it("hapus beberapa karakter sekaligus", () => {
    // Cut / select and delete
    expect(diffText("abcdef", "ab")).toEqual({ removed: 4, added: "" });
    expect(diffText("NightCity", "")).toEqual({ removed: 9, added: "" });
    expect(diffText("testing123", "test")).toEqual({ removed: 6, added: "" });
  });

  it("string kosong", () => {
    expect(diffText("", "")).toEqual({ removed: 0, added: "" });
    expect(diffText("", "hello")).toEqual({ removed: 0, added: "hello" });
    expect(diffText("hello", "")).toEqual({ removed: 5, added: "" });
  });
});
