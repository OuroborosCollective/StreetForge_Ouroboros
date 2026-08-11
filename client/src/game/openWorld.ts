// StreetForge procedural city grammar: stable integer seeds yield repeatable blocks, encounter props, NPC anchors and quest markers.
export type DistrictArchetype = "market" | "yard" | "underpass" | "rooftop" | "hideout";

export type GeneratedProp = { id: string; kind: "building" | "crate" | "lamp" | "npc" | "quest"; x: number; z: number; scale: number; accent: "lime" | "orange" | "neutral" };

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function districtKey(worldSeed: number, x: number, z: number) {
  return `d-${worldSeed}-${x}-${z}`;
}

export function districtArchetype(worldSeed: number, x: number, z: number): DistrictArchetype {
  const index = Math.abs((worldSeed * 31 + x * 17 + z * 43) % 5);
  return ["market", "yard", "underpass", "rooftop", "hideout"][index] as DistrictArchetype;
}

export function generateDistrictProps(worldSeed: number, x: number, z: number): GeneratedProp[] {
  const rng = random(worldSeed ^ (x * 73856093) ^ (z * 19349663));
  const archetype = districtArchetype(worldSeed, x, z);
  const props: GeneratedProp[] = [];
  for (let index = 0; index < 6; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    props.push({ id: `${districtKey(worldSeed, x, z)}-building-${index}`, kind: "building", x: side * (8.8 + rng() * 2.8), z: -12 + index * 4.4 + rng() * 2, scale: 2.2 + rng() * 2.3, accent: "neutral" });
  }
  for (let index = 0; index < 5; index += 1) props.push({ id: `${districtKey(worldSeed, x, z)}-crate-${index}`, kind: "crate", x: (rng() - .5) * 11, z: -11 + rng() * 21, scale: .6 + rng() * .65, accent: rng() > .6 ? "orange" : "neutral" });
  for (let index = 0; index < 3; index += 1) props.push({ id: `${districtKey(worldSeed, x, z)}-lamp-${index}`, kind: "lamp", x: index % 2 ? 6.3 : -6.3, z: -10 + index * 8.2, scale: 1, accent: "lime" });
  props.push({ id: `${districtKey(worldSeed, x, z)}-npc`, kind: "npc", x: archetype === "market" ? -4.8 : 4.8, z: -5.3, scale: 1, accent: archetype === "yard" ? "orange" : "lime" });
  props.push({ id: `${districtKey(worldSeed, x, z)}-quest`, kind: "quest", x: archetype === "rooftop" ? 1.2 : -1.2, z: -10.8, scale: 1, accent: "lime" });
  return props;
}

