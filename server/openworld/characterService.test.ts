import { describe, expect, it } from "vitest";
import { normalizeCharacterCallsign, requireOwnedCharacter } from "./characterService";

describe("StreetForge character contract", () => {
  it("normalizes valid callsigns while preserving a readable identity", () => {
    expect(normalizeCharacterCallsign("  Neon   Runner  ")).toBe("Neon Runner");
    expect(normalizeCharacterCallsign("R-09_Forge")).toBe("R-09_Forge");
  });

  it("rejects empty, unsafe or oversized callsigns", () => {
    expect(() => normalizeCharacterCallsign("ab")).toThrow();
    expect(() => normalizeCharacterCallsign("drop; table")).toThrow();
    expect(() => normalizeCharacterCallsign("x".repeat(33))).toThrow();
  });

  it("permits game entry only for a character owned by the active account", () => {
    expect(requireOwnedCharacter({ userId: 9, callsign: "Forge" }, 9).callsign).toBe("Forge");
    expect(() => requireOwnedCharacter({ userId: 10, callsign: "Other" }, 9)).toThrow(/does not belong/);
    expect(() => requireOwnedCharacter(undefined, 9)).toThrow(/does not belong/);
  });
});
