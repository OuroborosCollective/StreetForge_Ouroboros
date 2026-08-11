import { describe, expect, it } from "vitest";
import { districtForKey } from "./worldInteractionService";

describe("StreetForge world content contract", () => {
  it("resolves only known district identities from the authored content contract", () => {
    expect(districtForKey("district.west-end-yard").archetype).toBe("yard");
    expect(() => districtForKey("district.unknown")).toThrow(/Unknown StreetForge district/);
  });
});
