import { asc, eq } from "drizzle-orm";
import { civilizationFactions, factionRelations, factionVotes, npcAgents, simulationSettings } from "../../drizzle/schema";
import { getDb } from "../db";
import { starterWorld } from "./catalog";
import { civilizationWorldHash, deriveFactionVote, tickFaction, tickNpc, tickRelation, type FactionCoreState, type NpcCoreState, type RelationCoreState, type VoteTopic } from "./civilizationCore";
import { KAPPA, TICK_RATE_HZ, compareStable, fromKappa, requireKappaInt, toKappa } from "./kappa";
import { buildExternalSimulationEnvelope, type SimulationExecutionMode, validateExternalEndpoint } from "./simulationAdapter";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

const factionSeeds = [
  { factionKey: "faction.civic-slate", displayName: "Slate Civic", kind: "civilian" as const, districtKey: "district.slate-market", leaderNpcKey: "npc.mara-vale" },
  { factionKey: "faction.iron-ward", displayName: "Iron Ward", kind: "npc_gang" as const, districtKey: "district.west-end-yard", leaderNpcKey: "npc.torch" },
  { factionKey: "faction.roof-raiders", displayName: "Roof Raiders", kind: "npc_gang" as const, districtKey: "district.needle-roofs", leaderNpcKey: "npc.needle" },
  { factionKey: "faction.sentinel", displayName: "Sentinel Patrol", kind: "police" as const, districtKey: "district.sentinel-precinct", leaderNpcKey: "npc.warden-iris" },
].sort((left, right) => compareStable(left.factionKey, right.factionKey));

const npcFaction: Record<string, string> = {
  "npc.mara-vale": "faction.civic-slate",
  "npc.torch": "faction.iron-ward",
  "npc.needle": "faction.roof-raiders",
  "npc.warden-iris": "faction.sentinel",
};

const districtObstacles: Record<string, Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>> = {
  "district.west-end-yard": [{ minX: -60_000, maxX: 60_000, minZ: -140_000, maxZ: -70_000 }],
  "district.slate-market": [{ minX: 90_000, maxX: 170_000, minZ: -60_000, maxZ: 60_000 }],
  "district.low-line": [{ minX: -120_000, maxX: -30_000, minZ: 30_000, maxZ: 130_000 }],
  "district.needle-roofs": [{ minX: -50_000, maxX: 50_000, minZ: -50_000, maxZ: 50_000 }],
  "district.sentinel-precinct": [{ minX: 40_000, maxX: 130_000, minZ: 40_000, maxZ: 120_000 }],
};

const toNpcCore = (agent: typeof npcAgents.$inferSelect): NpcCoreState => ({
  npcKey: agent.npcKey,
  districtKey: agent.districtKey,
  factionKey: agent.factionKey,
  positionX: toKappa(agent.positionX),
  positionZ: toKappa(agent.positionZ),
  targetX: toKappa(agent.targetX),
  targetZ: toKappa(agent.targetZ),
  routeCursor: agent.routeCursor,
  collisionCount: agent.collisionCount,
  state: agent.state,
  hungerKappa: toKappa(agent.hungerKappa),
  wealthKappa: toKappa(agent.wealthKappa),
  socialKappa: toKappa(agent.socialKappa),
  safetyKappa: toKappa(agent.safetyKappa),
});

const toFactionCore = (faction: typeof civilizationFactions.$inferSelect): FactionCoreState => ({
  factionKey: faction.factionKey,
  leaderNpcKey: faction.leaderNpcKey,
  foodReserveKappa: toKappa(faction.foodReserveKappa),
  cohesionKappa: toKappa(faction.cohesionKappa),
  legitimacyKappa: toKappa(faction.legitimacyKappa),
  posture: faction.posture,
});

const toRelationCore = (relation: typeof factionRelations.$inferSelect): RelationCoreState => ({
  sourceFactionKey: relation.sourceFactionKey,
  targetFactionKey: relation.targetFactionKey,
  tensionKappa: toKappa(relation.tensionKappa),
  trustKappa: toKappa(relation.trustKappa),
  stance: relation.stance,
});

async function ensureCivilizationState() {
  const db = requireDb(await getDb());
  const [settings] = await db.select().from(simulationSettings).where(eq(simulationSettings.id, 1)).limit(1);
  if (!settings) await db.insert(simulationSettings).values({ id: 1, executionMode: "embedded", tickRateHz: TICK_RATE_HZ, kappaScale: KAPPA, lastAuthoritativeTick: 0 });
  const currentFactions = await db.select().from(civilizationFactions);
  const factionKeys = new Set(currentFactions.map((faction) => faction.factionKey));
  for (const faction of factionSeeds) if (!factionKeys.has(faction.factionKey)) await db.insert(civilizationFactions).values({ ...faction, treasury: 0, foodReserveKappa: 500_000, cohesionKappa: 500_000, legitimacyKappa: 500_000, posture: "peace", lastTick: 0 });
  const currentAgents = await db.select().from(npcAgents);
  const agentKeys = new Set(currentAgents.map((agent) => agent.npcKey));
  const sortedNpcs = starterWorld.npcs.slice().sort((left, right) => compareStable(left.moduleKey, right.moduleKey));
  for (let index = 0; index < sortedNpcs.length; index += 1) {
    const npc = sortedNpcs[index];
    if (agentKeys.has(npc.moduleKey)) continue;
    const district = starterWorld.districts.find((entry) => entry.archetype === npc.district);
    if (!district) continue;
    const offset = (index + 1) * 120_000;
    await db.insert(npcAgents).values({ npcKey: npc.moduleKey, districtKey: district.moduleKey, factionKey: npcFaction[npc.moduleKey] ?? null, positionX: offset, positionZ: -offset, targetX: 0, targetZ: 0, routeCursor: 0, collisionCount: 0, state: "idle", hungerKappa: KAPPA, wealthKappa: 500_000, socialKappa: 500_000, safetyKappa: 500_000, lastTick: 0 });
  }
  const currentRelations = await db.select().from(factionRelations);
  const relationKeys = new Set(currentRelations.map((relation) => `${relation.sourceFactionKey}:${relation.targetFactionKey}`));
  for (const source of factionSeeds) for (const target of factionSeeds) {
    if (source.factionKey === target.factionKey || relationKeys.has(`${source.factionKey}:${target.factionKey}`)) continue;
    await db.insert(factionRelations).values({ sourceFactionKey: source.factionKey, targetFactionKey: target.factionKey, stance: "peace", tensionKappa: 0, trustKappa: 500_000, lastDecisionTick: 0 });
  }
  return requireDb(await getDb());
}

export async function getSimulationControl() {
  const db = await ensureCivilizationState();
  const settings = (await db.select().from(simulationSettings).where(eq(simulationSettings.id, 1)).limit(1))[0];
  if (!settings) throw new Error("Simulation control plane is unavailable.");
  return settings;
}

export async function configureSimulationControl(userId: number, input: { executionMode: SimulationExecutionMode; externalEndpoint?: string | null }) {
  const db = await ensureCivilizationState();
  const endpoint = input.executionMode === "external" ? validateExternalEndpoint(input.externalEndpoint) : null;
  await db.update(simulationSettings).set({ executionMode: input.executionMode, externalEndpoint: endpoint, tickRateHz: TICK_RATE_HZ, kappaScale: KAPPA, updatedByUserId: userId }).where(eq(simulationSettings.id, 1));
  return getSimulationControl();
}

export async function getCivilizationSnapshot() {
  const db = await ensureCivilizationState();
  const [settings, agents, factions, relations, votes] = await Promise.all([
    db.select().from(simulationSettings).where(eq(simulationSettings.id, 1)).limit(1),
    db.select().from(npcAgents).orderBy(asc(npcAgents.npcKey)),
    db.select().from(civilizationFactions).orderBy(asc(civilizationFactions.factionKey)),
    db.select().from(factionRelations).orderBy(asc(factionRelations.sourceFactionKey), asc(factionRelations.targetFactionKey)),
    db.select().from(factionVotes).orderBy(asc(factionVotes.factionKey), asc(factionVotes.proposalKey)),
  ]);
  const coreAgents = agents.map(toNpcCore);
  const coreFactions = factions.map(toFactionCore);
  const coreRelations = relations.map(toRelationCore);
  const tick = settings[0]?.lastAuthoritativeTick ?? 0;
  return { settings: settings[0], agents, factions, relations, votes, worldHash: civilizationWorldHash(tick, coreAgents, coreFactions, coreRelations) };
}

function voteKey(factionKey: string, targetFactionKey: string | null, topic: VoteTopic, tick: number) {
  return `vote.${factionKey}.${targetFactionKey ?? "internal"}.${topic}.${tick}`;
}

/** Executes exact 100ms logical steps. The caller owns real-time pacing; this function never reads a clock. */
export async function advanceCivilizationTicks(input: { ticks: number }) {
  const ticks = requireKappaInt(input.ticks);
  if (ticks < 1 || ticks > 600) throw new Error("Advance between 1 and 600 deterministic ticks per request.");
  const db = await ensureCivilizationState();
  const snapshot = await getCivilizationSnapshot();
  if (snapshot.settings.executionMode === "external") {
    return { mode: "external" as const, envelope: buildExternalSimulationEnvelope({ fromTick: snapshot.settings.lastAuthoritativeTick, tickCount: ticks, stateHash: snapshot.worldHash }) };
  }
  let agents = snapshot.agents.map(toNpcCore).sort((left, right) => compareStable(left.npcKey, right.npcKey));
  let factions = snapshot.factions.map(toFactionCore).sort((left, right) => compareStable(left.factionKey, right.factionKey));
  let relations = snapshot.relations.map(toRelationCore).sort((left, right) => compareStable(`${left.sourceFactionKey}:${left.targetFactionKey}`, `${right.sourceFactionKey}:${right.targetFactionKey}`));
  let tick = snapshot.settings.lastAuthoritativeTick;
  for (let count = 0; count < ticks; count += 1) {
    tick = requireKappaInt(tick + 1);
    const beforeMove = agents;
    agents = beforeMove.map((agent) => tickNpc(agent, beforeMove.filter((other) => other.districtKey === agent.districtKey), districtObstacles[agent.districtKey] ?? [], tick));
    factions = factions.map((faction) => tickFaction(faction, agents, tick));
    const factionByKey = new Map(factions.map((faction) => [faction.factionKey, faction]));
    relations = relations.map((relation) => {
      const source = factionByKey.get(relation.sourceFactionKey);
      const target = factionByKey.get(relation.targetFactionKey);
      return source && target ? tickRelation(relation, source, target) : relation;
    });
  }
  for (const agent of agents) await db.update(npcAgents).set({ positionX: fromKappa(agent.positionX), positionZ: fromKappa(agent.positionZ), targetX: fromKappa(agent.targetX), targetZ: fromKappa(agent.targetZ), routeCursor: agent.routeCursor, collisionCount: agent.collisionCount, state: agent.state, hungerKappa: fromKappa(agent.hungerKappa), wealthKappa: fromKappa(agent.wealthKappa), socialKappa: fromKappa(agent.socialKappa), safetyKappa: fromKappa(agent.safetyKappa), lastTick: tick }).where(eq(npcAgents.npcKey, agent.npcKey));
  for (const faction of factions) await db.update(civilizationFactions).set({ leaderNpcKey: faction.leaderNpcKey, foodReserveKappa: fromKappa(faction.foodReserveKappa), cohesionKappa: fromKappa(faction.cohesionKappa), legitimacyKappa: fromKappa(faction.legitimacyKappa), posture: faction.posture, lastTick: tick }).where(eq(civilizationFactions.factionKey, faction.factionKey));
  for (const relation of relations) await db.update(factionRelations).set({ stance: relation.stance, tensionKappa: fromKappa(relation.tensionKappa), trustKappa: fromKappa(relation.trustKappa), lastDecisionTick: tick }).where(eq(factionRelations.id, snapshot.relations.find((entry) => entry.sourceFactionKey === relation.sourceFactionKey && entry.targetFactionKey === relation.targetFactionKey)?.id ?? -1));
  const factionByKey = new Map(factions.map((faction) => [faction.factionKey, faction]));
  const relationByKey = new Map(relations.map((relation) => [`${relation.sourceFactionKey}:${relation.targetFactionKey}`, relation]));
  const openVoteKeys = new Set(snapshot.votes.filter((vote) => vote.state === "open").map((vote) => `${vote.factionKey}:${vote.topic}`));
  if (tick % 100 === 0) {
    for (const faction of factions) {
      const topic: VoteTopic | null = faction.legitimacyKappa < 250_000 && faction.cohesionKappa < 350_000 ? "leadership" : null;
      if (!topic || openVoteKeys.has(`${faction.factionKey}:${topic}`)) continue;
      const members = agents.filter((agent) => agent.factionKey === faction.factionKey).sort((left, right) => compareStable(left.npcKey, right.npcKey));
      const proposer = members[0];
      if (!proposer) continue;
      const weights = deriveFactionVote(topic, faction, null);
      await db.insert(factionVotes).values({ factionKey: faction.factionKey, proposalKey: voteKey(faction.factionKey, null, topic, tick), proposerNpcKey: proposer.npcKey, topic, yesWeightKappa: weights.yesWeightKappa, noWeightKappa: weights.noWeightKappa, startsTick: tick, resolvesTick: tick + 100, state: "open" });
    }
    for (const relation of relations) {
      const source = factionByKey.get(relation.sourceFactionKey);
      if (!source) continue;
      const topic: VoteTopic | null = relation.stance === "war" ? "peace" : relation.tensionKappa >= 800_000 && relation.trustKappa < 350_000 ? "war" : null;
      if (!topic || openVoteKeys.has(`${source.factionKey}:${topic}`)) continue;
      const weights = deriveFactionVote(topic, source, relation);
      await db.insert(factionVotes).values({ factionKey: source.factionKey, proposalKey: voteKey(source.factionKey, relation.targetFactionKey, topic, tick), proposerNpcKey: source.leaderNpcKey ?? source.factionKey, topic, yesWeightKappa: weights.yesWeightKappa, noWeightKappa: weights.noWeightKappa, startsTick: tick, resolvesTick: tick + 100, state: "open" });
    }
  }
  const resolvableVotes = snapshot.votes.filter((vote) => vote.state === "open" && vote.resolvesTick <= tick).sort((left, right) => compareStable(left.proposalKey, right.proposalKey));
  for (const vote of resolvableVotes) {
    const accepted = vote.yesWeightKappa > vote.noWeightKappa;
    await db.update(factionVotes).set({ state: accepted ? "accepted" : "rejected" }).where(eq(factionVotes.id, vote.id));
    if (!accepted) continue;
    if (vote.topic === "leadership") await db.update(civilizationFactions).set({ leaderNpcKey: vote.proposerNpcKey }).where(eq(civilizationFactions.factionKey, vote.factionKey));
    const relation = relations.find((entry) => entry.sourceFactionKey === vote.factionKey);
    if (relation && vote.topic !== "leadership") await db.update(factionRelations).set({ stance: vote.topic === "war" ? "war" : "peace", lastDecisionTick: tick }).where(eq(factionRelations.id, snapshot.relations.find((entry) => entry.sourceFactionKey === relation.sourceFactionKey && entry.targetFactionKey === relation.targetFactionKey)?.id ?? -1));
  }
  await db.update(simulationSettings).set({ lastAuthoritativeTick: tick }).where(eq(simulationSettings.id, 1));
  return { mode: "embedded" as const, tick, worldHash: civilizationWorldHash(tick, agents, factions, relations), agents: agents.length, factions: factions.length };
}
