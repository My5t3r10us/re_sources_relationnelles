import { describe, it, expect } from "vitest";
import { EMOJI_CATEGORIES } from "@/lib/emojis";

describe("emojis", () => {
  it("exports at least one category", () => {
    expect(EMOJI_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("every category has a name and items", () => {
    for (const cat of EMOJI_CATEGORIES) {
      expect(cat.name).toMatch(/.+/);
      expect(cat.items.length).toBeGreaterThan(0);
    }
  });

  it("every item has a non-empty emoji and search name", () => {
    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.items) {
        expect(item.emoji).toMatch(/.+/);
        expect(item.name).toMatch(/.+/);
      }
    }
  });

  it("contains expected canonical categories", () => {
    const names = EMOJI_CATEGORIES.map((c) => c.name);
    for (const must of ["Visages", "Santé", "Nature", "Symboles"]) {
      expect(names).toContain(must);
    }
  });

  it("Symboles category contains the validation emoji ✅", () => {
    const symboles = EMOJI_CATEGORIES.find((c) => c.name === "Symboles")!;
    expect(symboles.items.some((i) => i.emoji === "✅")).toBe(true);
  });
});
