// StreetForge starter catalog: fictional content modules are data and can later be mirrored into admin-managed database records.
export const weaponCategories = ["melee", "sidearm", "smg", "shotgun", "rifle", "marksman", "heavy", "thrown"] as const;
export type WeaponCategory = (typeof weaponCategories)[number];

/** Canonical territorial controls. Guild control is awarded only by a persisted territory claim. */
export const districtControlTypes = ["neutral", "enemy", "raider", "safe", "police"] as const;
export type DistrictControl = (typeof districtControlTypes)[number];

export type DistrictDefinition = {
  moduleKey: string;
  title: string;
  archetype: "yard" | "market" | "underpass" | "rooftop" | "precinct";
  x: number;
  z: number;
  pressure: number;
  control: DistrictControl;
};

export type WeaponDefinition = {
  moduleKey: string;
  title: string;
  category: WeaponCategory;
  rarity: "common" | "uncommon" | "rare" | "epic";
  baseDamage: number;
  dropDistricts: string[];
};

export const starterWeapons: WeaponDefinition[] = [
  { moduleKey: "weapon.melee.split-bar", title: "Split Bar", category: "melee", rarity: "common", baseDamage: 22, dropDistricts: ["yard", "underpass"] },
  { moduleKey: "weapon.sidearm.cinder-9", title: "Cinder-9", category: "sidearm", rarity: "uncommon", baseDamage: 28, dropDistricts: ["market", "yard"] },
  { moduleKey: "weapon.smg.ratchet-loop", title: "Ratchet Loop", category: "smg", rarity: "uncommon", baseDamage: 17, dropDistricts: ["market", "underpass"] },
  { moduleKey: "weapon.shotgun.breach-light", title: "Breach Light", category: "shotgun", rarity: "rare", baseDamage: 52, dropDistricts: ["yard", "hideout"] },
  { moduleKey: "weapon.rifle.slabline", title: "Slabline", category: "rifle", rarity: "rare", baseDamage: 42, dropDistricts: ["yard", "rooftop"] },
  { moduleKey: "weapon.marksman.long-view", title: "Long View", category: "marksman", rarity: "epic", baseDamage: 74, dropDistricts: ["rooftop"] },
  { moduleKey: "weapon.heavy.forge-driver", title: "Forge Driver", category: "heavy", rarity: "epic", baseDamage: 95, dropDistricts: ["hideout", "yard"] },
  { moduleKey: "weapon.thrown.signal-charge", title: "Signal Charge", category: "thrown", rarity: "uncommon", baseDamage: 38, dropDistricts: ["underpass", "market"] },
];

export const masteryTrees: Record<WeaponCategory, Array<{ nodeKey: string; title: string; effect: string; rankCap: number }>> = {
  melee: [
    { nodeKey: "melee.follow-through", title: "Follow Through", effect: "+3% close-range impact per rank", rankCap: 3 },
    { nodeKey: "melee.guard-break", title: "Guard Break", effect: "+4% stagger chance per rank", rankCap: 3 },
    { nodeKey: "melee.street-form", title: "Street Form", effect: "+6% stamina recovery", rankCap: 1 },
  ],
  sidearm: [
    { nodeKey: "sidearm.quick-draw", title: "Quick Draw", effect: "+4% swap tempo per rank", rankCap: 3 },
    { nodeKey: "sidearm.clean-line", title: "Clean Line", effect: "+2% weak-point output per rank", rankCap: 3 },
    { nodeKey: "sidearm.steady-hand", title: "Steady Hand", effect: "lower recoil bloom", rankCap: 1 },
  ],
  smg: [
    { nodeKey: "smg.pressure-loop", title: "Pressure Loop", effect: "+2% sustained output per rank", rankCap: 3 },
    { nodeKey: "smg.corner-cut", title: "Corner Cut", effect: "+3% move accuracy per rank", rankCap: 3 },
    { nodeKey: "smg.heat-sink", title: "Heat Sink", effect: "+8% control recovery", rankCap: 1 },
  ],
  shotgun: [
    { nodeKey: "shotgun.breach", title: "Breach", effect: "+3% close burst per rank", rankCap: 3 },
    { nodeKey: "shotgun.shock", title: "Shock", effect: "+4% stagger per rank", rankCap: 3 },
    { nodeKey: "shotgun.hard-stop", title: "Hard Stop", effect: "first-shell bonus", rankCap: 1 },
  ],
  rifle: [
    { nodeKey: "rifle.route", title: "Route", effect: "+2% precise output per rank", rankCap: 3 },
    { nodeKey: "rifle.sightline", title: "Sightline", effect: "+3% aim stability per rank", rankCap: 3 },
    { nodeKey: "rifle.clean-break", title: "Clean Break", effect: "lower recovery delay", rankCap: 1 },
  ],
  marksman: [
    { nodeKey: "marksman.hold", title: "Hold", effect: "+3% scoped impact per rank", rankCap: 3 },
    { nodeKey: "marksman.range", title: "Range", effect: "+4% long-line precision per rank", rankCap: 3 },
    { nodeKey: "marksman.dead-air", title: "Dead Air", effect: "slower aim sway", rankCap: 1 },
  ],
  heavy: [
    { nodeKey: "heavy.brace", title: "Brace", effect: "+3% heavy output per rank", rankCap: 3 },
    { nodeKey: "heavy.anchor", title: "Anchor", effect: "+3% damage resistance while braced", rankCap: 3 },
    { nodeKey: "heavy.last-word", title: "Last Word", effect: "low-health impact bonus", rankCap: 1 },
  ],
  thrown: [
    { nodeKey: "thrown.arc", title: "Arc", effect: "+4% throw trajectory control per rank", rankCap: 3 },
    { nodeKey: "thrown.trigger", title: "Trigger", effect: "+3% area effect per rank", rankCap: 3 },
    { nodeKey: "thrown.recycle", title: "Recycle", effect: "small material return chance", rankCap: 1 },
  ],
};

export const starterWorld = {
  worldSeed: 702942,
  districts: [
    { moduleKey: "district.west-end-yard", title: "West End Yard", archetype: "yard", x: 0, z: 0, pressure: 2, control: "neutral" },
    { moduleKey: "district.slate-market", title: "Slate Market", archetype: "market", x: 1, z: 0, pressure: 1, control: "safe" },
    { moduleKey: "district.low-line", title: "Low Line", archetype: "underpass", x: -1, z: 0, pressure: 3, control: "raider" },
    { moduleKey: "district.needle-roofs", title: "Needle Roofs", archetype: "rooftop", x: 0, z: -1, pressure: 4, control: "enemy" },
    { moduleKey: "district.sentinel-precinct", title: "Sentinel Precinct", archetype: "precinct", x: 0, z: 1, pressure: 1, control: "police" },
  ] satisfies DistrictDefinition[],
  npcs: [
    { moduleKey: "npc.mara-vale", name: "Mara Vale", role: "fixer", district: "market" },
    { moduleKey: "npc.torch", name: "Torch", role: "gang-scout", district: "yard" },
    { moduleKey: "npc.needle", name: "Needle", role: "vendor", district: "rooftop" },
    { moduleKey: "npc.warden-iris", name: "Warden Iris", role: "patrol-dispatch", district: "precinct" },
  ],
  quests: [
    { moduleKey: "quest.sweep-the-yard", title: "Sweep the Yard", district: "yard", rewards: ["xp", "street_cred", "weapon_drop"] },
    { moduleKey: "quest.line-of-sight", title: "Line of Sight", district: "rooftop", rewards: ["xp", "mastery_xp", "rare_drop"] },
  ],
};
