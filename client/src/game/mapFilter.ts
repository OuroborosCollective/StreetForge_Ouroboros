export type MapFilter = "all" | "control" | "risk" | "available";
export type MapDistrictFilterable = { control: string; threat: number; entryAllowed: boolean };

export const chooseMapFilter = (_current: MapFilter, requested: MapFilter): MapFilter => requested;

export function filterWorldMapDistricts<T extends MapDistrictFilterable>(districts: readonly T[], filter: MapFilter) {
  if (filter === "control") return districts.filter((district) => district.control !== "neutral");
  if (filter === "risk") return districts.filter((district) => district.threat >= 6);
  if (filter === "available") return districts.filter((district) => district.entryAllowed);
  return districts;
}
