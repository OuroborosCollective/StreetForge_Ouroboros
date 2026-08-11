// Gang rule tests ensure every territory claim and gang identity is normalized before it reaches persistence.
import { describe, expect, it } from "vitest";
import { territoryDistrictKey, validateGangIdentity } from "./gangRules";

describe("StreetForge gang rules", () => {
  it("normalizes a valid gang identity", () => {
    expect(validateGangIdentity("  West  End  ", " we ")).toEqual({ name: "West End", tag: "WE" });
  });

  it("rejects invalid tags and creates deterministic territory keys", () => {
    expect(() => validateGangIdentity("West End", "too-long")).toThrow();
    expect(territoryDistrictKey(702942, -1, 2)).toBe("d-702942--1-2");
  });
});

