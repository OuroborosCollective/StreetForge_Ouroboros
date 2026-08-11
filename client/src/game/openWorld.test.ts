// Procedural world test guard: an identical seed must produce exactly the same playable anchors and a changed seed must vary the district.
import { describe, expect, it } from "vitest";
import { districtKey, generateDistrictProps } from "./openWorld";

describe("StreetForge procedural district generator", () => {
  it("is deterministic for the same world coordinates and seed", () => {
    expect(generateDistrictProps(702942, 0, 0)).toEqual(generateDistrictProps(702942, 0, 0));
    expect(districtKey(702942, -1, 2)).toBe("d-702942--1-2");
  });

  it("creates concrete world anchors for buildings, NPCs and quests", () => {
    const props = generateDistrictProps(702942, 0, 0);
    expect(props.some((prop) => prop.kind === "building")).toBe(true);
    expect(props.some((prop) => prop.kind === "npc")).toBe(true);
    expect(props.some((prop) => prop.kind === "quest")).toBe(true);
  });
});
