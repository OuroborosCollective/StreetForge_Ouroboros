import { describe, expect, it } from "vitest";
import { chooseMapFilter, filterWorldMapDistricts } from "./mapFilter";

const districts = [
  { control: "neutral", threat: 2, entryAllowed: true },
  { control: "raider", threat: 7, entryAllowed: true },
  { control: "police", threat: 4, entryAllowed: false },
];

describe("world map filters", () => {
  it("filters only the requested server-projected dimension without changing route data", () => {
    expect(filterWorldMapDistricts(districts, "all")).toHaveLength(3);
    expect(filterWorldMapDistricts(districts, "control")).toHaveLength(2);
    expect(filterWorldMapDistricts(districts, "risk")).toHaveLength(1);
    expect(filterWorldMapDistricts(districts, "available")).toHaveLength(2);
    expect(filterWorldMapDistricts(districts, chooseMapFilter("all", "risk"))).toEqual([districts[1]]);
  });
});
