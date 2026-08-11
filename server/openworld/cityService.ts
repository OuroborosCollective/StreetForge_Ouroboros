import { and, eq } from "drizzle-orm";
import { cityDistrictStates, cityPresence, gangs, npcRoutineStates, territories } from "../../drizzle/schema";
import { getDb } from "../db";
import { starterWorld, type DistrictControl, type DistrictDefinition } from "./catalog";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

type CityPhase = "quiet" | "active" | "volatile" | "lockdown";
type DistrictClaim = { gangName: string; gangTag: string; displayName: string; state: "active" | "contested" | "abandoned" } | null;

const controlVisuals: Record<DistrictControl | "guild", { label: string; color: string; risk: number }> = {
  neutral: { label: "NEUTRAL", color: "#7c91a4", risk: 20 },
  safe: { label: "SAFE", color: "#c6f13d", risk: 4 },
  enemy: { label: "ENEMY", color: "#ff4f5c", risk: 72 },
  raider: { label: "RAIDER", color: "#ff8a3d", risk: 58 },
  police: { label: "POLICE", color: "#4db7ff", risk: 14 },
  guild: { label: "GUILD", color: "#b776ff", risk: 18 },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const claimForDistrict = async (district: DistrictDefinition) => {
  const db = requireDb(await getDb());
  const claim = (await db.select({ displayName: territories.displayName, state: territories.state, gangName: gangs.name, gangTag: gangs.tag }).from(territories).innerJoin(gangs, eq(territories.gangId, gangs.id)).where(and(eq(territories.worldSeed, starterWorld.worldSeed), eq(territories.districtX, district.x), eq(territories.districtZ, district.z))).limit(1))[0];
  return claim ? { gangName: claim.gangName, gangTag: claim.gangTag, displayName: claim.displayName, state: claim.state } : null;
};

/** A pure, reproducible city-intelligence projection; it never accepts client-authored threat values. */
export function deriveDistrictIntelligence(input: { district: DistrictDefinition; pressure: number; supply: number; alertLevel: number; phase: CityPhase; claim: DistrictClaim }) {
  const control = input.claim ? "guild" : input.district.control;
  const visual = controlVisuals[control];
  const pressureRisk = input.pressure * 6 + input.alertLevel * 7;
  const threat = clamp(visual.risk + pressureRisk - Math.floor(input.supply / 12), 0, 100);
  const patrol = control === "police" ? clamp(70 + input.supply / 3 - input.alertLevel * 9, 20, 100) : control === "safe" ? clamp(42 + input.supply / 4, 25, 85) : control === "guild" ? clamp(36 + input.supply / 5, 20, 80) : clamp(12 + input.alertLevel * 7, 8, 60);
  const entryAllowed = !(control === "police" && input.phase === "lockdown");
  const routeState = !entryAllowed ? "locked" : threat >= 78 ? "hot" : threat >= 48 ? "caution" : "open";
  const directive = !entryAllowed
    ? "POLICE LOCKDOWN — ROUTE SUSPENDED"
    : control === "guild" ? `GUILD HOLD — ${input.claim?.gangTag ?? "CREW"} PRESENCE CONFIRMED`
      : control === "raider" ? "RAIDER PRESSURE — USE COVER AND KEEP MOVING"
        : control === "enemy" ? "HOSTILE CONTROL — EXPECT RESISTANCE"
          : control === "safe" ? "SAFE CORRIDOR — MARKET AND RECOVERY AVAILABLE"
            : control === "police" ? "PATROL GRID — COMPLY WITH CHECKPOINT ROUTING"
              : "NEUTRAL GROUND — CITY PULSE MONITORED";
  return {
    control,
    controlLabel: visual.label,
    mapColor: visual.color,
    threat,
    patrol,
    routeState,
    entryAllowed,
    directive,
    claim: input.claim,
  };
}

export function resolveRoutine(now: Date) {
  const hour = now.getUTCHours();
  if (hour >= 2 && hour < 6) return { availability: "offline" as const, phase: "after_hours", nextChangeAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0)) };
  if (hour >= 20 || hour < 2) return { availability: "at_risk" as const, phase: "night_shift", nextChangeAt: new Date(now.getTime() + 60 * 60 * 1000) };
  if (hour >= 16) return { availability: "moving" as const, phase: "late_route", nextChangeAt: new Date(now.getTime() + 60 * 60 * 1000) };
  return { availability: "available" as const, phase: "day_shift", nextChangeAt: new Date(now.getTime() + 60 * 60 * 1000) };
}

export async function refreshCityPulse(now = new Date()) {
  const db = requireDb(await getDb());
  for (const district of starterWorld.districts) {
    const phase = district.pressure >= 4 ? "volatile" : district.pressure >= 3 ? "active" : "quiet";
    await db.insert(cityDistrictStates).values({ districtKey: district.moduleKey, control: district.control, pressure: district.pressure, supply: Math.max(15, 70 - district.pressure * 9), alertLevel: Math.max(0, district.pressure - 1), phase, lastPulseAt: now }).onDuplicateKeyUpdate({ set: { control: district.control, pressure: district.pressure, supply: Math.max(15, 70 - district.pressure * 9), alertLevel: Math.max(0, district.pressure - 1), phase, lastPulseAt: now } });
  }
  const routine = resolveRoutine(now);
  for (const npc of starterWorld.npcs) {
    const district = starterWorld.districts.find((entry) => entry.archetype === npc.district);
    if (!district) continue;
    await db.insert(npcRoutineStates).values({ npcKey: npc.moduleKey, districtKey: district.moduleKey, availability: routine.availability, routinePhase: routine.phase, nextChangeAt: routine.nextChangeAt }).onDuplicateKeyUpdate({ set: { availability: routine.availability, routinePhase: routine.phase, nextChangeAt: routine.nextChangeAt } });
  }
  return { districtCount: starterWorld.districts.length, npcCount: starterWorld.npcs.length, refreshedAt: now };
}

export async function getCityOverview() {
  const db = requireDb(await getDb());
  await refreshCityPulse();
  const [districts, npcs] = await Promise.all([db.select().from(cityDistrictStates), db.select().from(npcRoutineStates)]);
  return { districts, npcs, refreshedAt: new Date() };
}

export async function getDistrictEntryPolicy(district: DistrictDefinition) {
  const db = requireDb(await getDb());
  await refreshCityPulse();
  const state = (await db.select().from(cityDistrictStates).where(eq(cityDistrictStates.districtKey, district.moduleKey)).limit(1))[0];
  if (!state) throw new Error("District pulse is unavailable.");
  const claim = await claimForDistrict(district);
  return deriveDistrictIntelligence({ district: { ...district, control: state.control }, pressure: state.pressure, supply: state.supply, alertLevel: state.alertLevel, phase: state.phase, claim });
}

/** Returns the player-specific map projection; claims and city pulse are read from persisted server state. */
export async function getWorldMap(userId: number) {
  const db = requireDb(await getDb());
  await refreshCityPulse();
  const [states, claimedTerritories, presence] = await Promise.all([
    db.select().from(cityDistrictStates),
    db.select({ districtX: territories.districtX, districtZ: territories.districtZ, worldSeed: territories.worldSeed, displayName: territories.displayName, state: territories.state, gangName: gangs.name, gangTag: gangs.tag }).from(territories).innerJoin(gangs, eq(territories.gangId, gangs.id)),
    db.select().from(cityPresence).where(eq(cityPresence.userId, userId)).limit(1),
  ]);
  const stateByDistrict = new Map(states.map((state) => [state.districtKey, state]));
  const claimByCoordinate = new Map(claimedTerritories.filter((claim) => claim.worldSeed === starterWorld.worldSeed).map((claim) => [`${claim.districtX}:${claim.districtZ}`, claim]));
  const districts = starterWorld.districts.map((district) => {
    const state = stateByDistrict.get(district.moduleKey);
    if (!state) throw new Error("District pulse is unavailable.");
    const rawClaim = claimByCoordinate.get(`${district.x}:${district.z}`);
    const claim: DistrictClaim = rawClaim ? { gangName: rawClaim.gangName, gangTag: rawClaim.gangTag, displayName: rawClaim.displayName, state: rawClaim.state } : null;
    return {
      ...district,
      pressure: state.pressure,
      supply: state.supply,
      alertLevel: state.alertLevel,
      phase: state.phase,
      ...deriveDistrictIntelligence({ district: { ...district, control: state.control }, pressure: state.pressure, supply: state.supply, alertLevel: state.alertLevel, phase: state.phase, claim }),
      isCurrent: presence[0]?.districtKey === district.moduleKey,
    };
  });
  return { worldSeed: starterWorld.worldSeed, districts, currentDistrictKey: presence[0]?.districtKey ?? null, refreshedAt: new Date() };
}
