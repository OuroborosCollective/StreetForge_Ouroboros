// Gang rule guard: compact validation keeps territorial names readable and makes every city claim addressable.
export function validateGangIdentity(name: string, tag: string) {
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const normalizedTag = tag.trim().toUpperCase();
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{2,63}$/.test(normalizedName)) throw new Error("Gang name must be 3–64 readable characters.");
  if (!/^[A-Z0-9]{2,6}$/.test(normalizedTag)) throw new Error("Gang tag must be 2–6 uppercase letters or digits.");
  return { name: normalizedName, tag: normalizedTag };
}

export function territoryDistrictKey(worldSeed: number, x: number, z: number) {
  if (!Number.isInteger(worldSeed) || !Number.isInteger(x) || !Number.isInteger(z)) throw new Error("Territory coordinates must be integer grid values.");
  return `d-${worldSeed}-${x}-${z}`;
}

