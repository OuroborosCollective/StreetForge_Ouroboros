import { describe, expect, it } from "vitest";
import { deriveDistrictIntelligence } from "./cityService";
import { starterWorld, type DistrictDefinition } from "./catalog";

const baseDistrict: DistrictDefinition = { moduleKey: "district.test", title: "Test", archetype: "yard", x: 0, z: 0, pressure: 2, control: "raider" };

describe("city intelligence", () => {
  it("projects a raider district as a visible high-risk route without client-authored values", () => {
    const intelligence = deriveDistrictIntelligence({ district: baseDistrict, pressure: 4, supply: 30, alertLevel: 3, phase: "volatile", claim: null });
    expect(intelligence.control).toBe("raider");
    expect(intelligence.mapColor).toBe("#ff8a3d");
    expect(intelligence.threat).toBeGreaterThan(70);
    expect(intelligence.routeState).toBe("hot");
  });

  it("elevates a persisted gang claim above the baseline control and locks a police district only during lockdown", () => {
    const guild = deriveDistrictIntelligence({ district: baseDistrict, pressure: 1, supply: 60, alertLevel: 0, phase: "quiet", claim: { gangName: "Forge Union", gangTag: "FGE", displayName: "Union Yard", state: "active" } });
    const police = deriveDistrictIntelligence({ district: { ...baseDistrict, control: "police" }, pressure: 1, supply: 50, alertLevel: 4, phase: "lockdown", claim: null });
    expect(guild.control).toBe("guild");
    expect(guild.claim?.gangTag).toBe("FGE");
    expect(police.entryAllowed).toBe(false);
    expect(police.routeState).toBe("locked");
  });

  it("keeps a claimed risky route enterable until the persisted police lockdown policy explicitly rejects it", () => {
    const claim = { gangName: "Forge Union", gangTag: "FGE", displayName: "Union Yard", state: "contested" as const };
    const claimedRoute = deriveDistrictIntelligence({ district: baseDistrict, pressure: 4, supply: 25, alertLevel: 3, phase: "volatile", claim });
    const lockdown = deriveDistrictIntelligence({ district: { ...baseDistrict, control: "police" }, pressure: 4, supply: 25, alertLevel: 4, phase: "lockdown", claim: null });
    expect(claimedRoute.claim?.displayName).toBe("Union Yard");
    expect(claimedRoute.entryAllowed).toBe(true);
    expect(claimedRoute.routeState).toBe("caution");
    expect(lockdown.entryAllowed).toBe(false);
  });

  it("keeps every non-guild territory class represented in canonical world content", () => {
    const controls = new Set(starterWorld.districts.map((district) => district.control));
    expect(controls).toEqual(new Set(["neutral", "safe", "raider", "enemy", "police"]));
  });
});
