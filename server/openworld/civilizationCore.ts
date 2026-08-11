import { KAPPA, absKappa, clampKappa, compareStable, hashKappa, quotient, requireKappaInt } from "./kappa";

export type NpcNeedState = "idle" | "travel" | "reroute" | "flee" | "socialize" | "work" | "eat";
export type FactionPosture = "peace" | "war" | "truce";

export type NpcCoreState = {
  npcKey: string;
  districtKey: string;
  factionKey: string | null;
  positionX: number;
  positionZ: number;
  targetX: number;
  targetZ: number;
  routeCursor: number;
  collisionCount: number;
  state: NpcNeedState;
  hungerKappa: number;
  wealthKappa: number;
  socialKappa: number;
  safetyKappa: number;
};

export type FactionCoreState = {
  factionKey: string;
  leaderNpcKey: string | null;
  foodReserveKappa: number;
  cohesionKappa: number;
  legitimacyKappa: number;
  posture: FactionPosture;
};

export type RelationCoreState = { sourceFactionKey: string; targetFactionKey: string; tensionKappa: number; trustKappa: number; stance: FactionPosture };
export type RectObstacle = { minX: number; maxX: number; minZ: number; maxZ: number };
export type VoteTopic = "war" | "peace" | "leadership";

const STEP_KAPPA = 50_000;
const COLLISION_DISTANCE_KAPPA = 100_000;
const LOW_NEED_KAPPA = 250_000;
const SOCIAL_NEED_KAPPA = 325_000;
const SAFETY_NEED_KAPPA = 300_000;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

const bounded = (value: number) => clampKappa(requireKappaInt(value));
const sign = (value: number) => value < 0 ? -1 : value > 0 ? 1 : 0;
const toward = (position: number, target: number) => position + sign(target - position) * Math.min(STEP_KAPPA, absKappa(target - position));
const distance = (left: NpcCoreState, right: NpcCoreState) => absKappa(left.positionX - right.positionX) + absKappa(left.positionZ - right.positionZ);
const isInside = (x: number, z: number, obstacle: RectObstacle) => x >= obstacle.minX && x <= obstacle.maxX && z >= obstacle.minZ && z <= obstacle.maxZ;

export function decideNpcNeed(agent: NpcCoreState): NpcNeedState {
  if (agent.hungerKappa <= LOW_NEED_KAPPA) return "eat";
  if (agent.safetyKappa <= SAFETY_NEED_KAPPA) return "flee";
  if (agent.wealthKappa <= LOW_NEED_KAPPA) return "work";
  if (agent.socialKappa <= SOCIAL_NEED_KAPPA) return "socialize";
  return "travel";
}

function routeTarget(agent: NpcCoreState, state: NpcNeedState, tick: number, reroute = false) {
  const seed = hashKappa([agent.npcKey, agent.districtKey, String(tick), state, reroute ? "reroute" : "route"]);
  const span = 300_000;
  const xSign = seed % 2 === 0 ? 1 : -1;
  const zSign = seed % 3 === 0 ? 1 : -1;
  if (state === "eat") return { x: xSign * span, z: 0 };
  if (state === "work") return { x: 0, z: zSign * span };
  if (state === "socialize") return { x: xSign * 160_000, z: zSign * 160_000 };
  if (state === "flee") return { x: -xSign * span, z: -zSign * span };
  return { x: xSign * 220_000, z: zSign * 220_000 };
}

function blocked(agent: NpcCoreState, candidateX: number, candidateZ: number, agents: readonly NpcCoreState[], obstacles: readonly RectObstacle[]) {
  if (obstacles.some((obstacle) => isInside(candidateX, candidateZ, obstacle))) return true;
  return agents.filter((other) => other.npcKey !== agent.npcKey).sort((a, b) => compareStable(a.npcKey, b.npcKey)).some((other) => absKappa(candidateX - other.positionX) + absKappa(candidateZ - other.positionZ) < COLLISION_DISTANCE_KAPPA);
}

export function tickNpc(agent: NpcCoreState, agents: readonly NpcCoreState[], obstacles: readonly RectObstacle[], tick: number): NpcCoreState {
  const intended = decideNpcNeed(agent);
  const target = agent.targetX === 0 && agent.targetZ === 0 ? routeTarget(agent, intended, tick) : { x: agent.targetX, z: agent.targetZ };
  const candidateX = toward(agent.positionX, target.x);
  const candidateZ = toward(agent.positionZ, target.z);
  const hasCollision = blocked(agent, candidateX, candidateZ, agents, obstacles);
  const alternate = routeTarget(agent, intended, tick, true);
  const nextX = hasCollision ? toward(agent.positionX, alternate.x) : candidateX;
  const nextZ = hasCollision ? toward(agent.positionZ, alternate.z) : candidateZ;
  const nearby = agents.filter((other) => other.npcKey !== agent.npcKey && distance(agent, other) < 180_000).length;
  const state = hasCollision ? "reroute" : intended;
  return {
    ...agent,
    positionX: requireKappaInt(nextX),
    positionZ: requireKappaInt(nextZ),
    targetX: hasCollision ? alternate.x : target.x,
    targetZ: hasCollision ? alternate.z : target.z,
    routeCursor: agent.routeCursor + 1,
    collisionCount: agent.collisionCount + (hasCollision ? 1 : 0),
    state,
    hungerKappa: bounded(agent.hungerKappa - 130 + (intended === "eat" ? 4_000 : 0)),
    wealthKappa: bounded(agent.wealthKappa + (intended === "work" ? 1_500 : 0)),
    socialKappa: bounded(agent.socialKappa - 75 + (intended === "socialize" ? 3_500 : nearby * 120)),
    safetyKappa: bounded(agent.safetyKappa + (intended === "flee" ? 2_200 : hasCollision ? -800 : 55)),
  };
}

export function tickFaction(faction: FactionCoreState, agents: readonly NpcCoreState[], tick: number): FactionCoreState {
  const members = agents.filter((agent) => agent.factionKey === faction.factionKey).sort((a, b) => compareStable(a.npcKey, b.npcKey));
  if (members.length === 0) return faction;
  const hungerAverage = quotient(members.reduce((sum, agent) => sum + agent.hungerKappa, 0), members.length);
  const socialAverage = quotient(members.reduce((sum, agent) => sum + agent.socialKappa, 0), members.length);
  const safetyAverage = quotient(members.reduce((sum, agent) => sum + agent.safetyKappa, 0), members.length);
  const foodReserveKappa = bounded(faction.foodReserveKappa - members.length * 220 + (hungerAverage < LOW_NEED_KAPPA ? -2_000 : 180));
  const cohesionKappa = bounded(faction.cohesionKappa + quotient(socialAverage - 500_000, 250) - (hungerAverage < LOW_NEED_KAPPA ? 2_100 : 0));
  const legitimacyKappa = bounded(faction.legitimacyKappa + quotient(safetyAverage - 500_000, 300) + (foodReserveKappa < LOW_NEED_KAPPA ? -1_700 : 90));
  const shouldOverthrow = legitimacyKappa < LOW_NEED_KAPPA && cohesionKappa < 350_000;
  const candidateIndex = Number(hashKappa([faction.factionKey, String(tick)]) % members.length);
  const leaderNpcKey = shouldOverthrow ? members[candidateIndex].npcKey : faction.leaderNpcKey ?? members[0].npcKey;
  const posture: FactionPosture = foodReserveKappa < 110_000 || legitimacyKappa < 150_000 ? "truce" : faction.posture;
  return { ...faction, leaderNpcKey, foodReserveKappa, cohesionKappa, legitimacyKappa, posture };
}

export function tickRelation(relation: RelationCoreState, source: FactionCoreState, target: FactionCoreState): RelationCoreState {
  const scarcity = (source.foodReserveKappa < LOW_NEED_KAPPA ? 2_000 : 0) + (target.foodReserveKappa < LOW_NEED_KAPPA ? 2_000 : 0);
  const tensionKappa = bounded(relation.tensionKappa + scarcity - (relation.stance === "truce" ? 120 : 20));
  const trustKappa = bounded(relation.trustKappa + (relation.stance === "truce" ? 300 : relation.stance === "war" ? -650 : 80));
  const stance: FactionPosture = tensionKappa >= 800_000 && trustKappa < 350_000 ? "war" : tensionKappa <= 250_000 && trustKappa >= 600_000 ? "peace" : "truce";
  return { ...relation, tensionKappa, trustKappa, stance };
}

/** Vote weights are derived only from needs and political state, never a client-supplied preference. */
export function deriveFactionVote(topic: VoteTopic, faction: FactionCoreState, relation: RelationCoreState | null) {
  const scarcity = faction.foodReserveKappa < 250_000 ? 180_000 : 0;
  const disorder = KAPPA - faction.legitimacyKappa + (KAPPA - faction.cohesionKappa);
  const tension = relation?.tensionKappa ?? 0;
  const trust = relation?.trustKappa ?? 0;
  if (topic === "war") return { yesWeightKappa: clampKappa(scarcity + tension + quotient(disorder, 3)), noWeightKappa: clampKappa(trust + faction.legitimacyKappa) };
  if (topic === "peace") return { yesWeightKappa: clampKappa(trust + quotient(disorder, 2)), noWeightKappa: clampKappa(tension + quotient(faction.cohesionKappa, 2)) };
  return { yesWeightKappa: clampKappa(disorder), noWeightKappa: clampKappa(faction.legitimacyKappa + faction.cohesionKappa) };
}

/** A compact exact hash suitable for replay comparisons and external-runner receipts. */
export function civilizationWorldHash(tick: number, agents: readonly NpcCoreState[], factions: readonly FactionCoreState[], relations: readonly RelationCoreState[]) {
  const parts = [String(tick), ...agents.slice().sort((a, b) => compareStable(a.npcKey, b.npcKey)).map((agent) => `${agent.npcKey}:${agent.positionX}:${agent.positionZ}:${agent.hungerKappa}:${agent.socialKappa}:${agent.safetyKappa}`), ...factions.slice().sort((a, b) => compareStable(a.factionKey, b.factionKey)).map((faction) => `${faction.factionKey}:${faction.leaderNpcKey ?? ""}:${faction.cohesionKappa}:${faction.legitimacyKappa}`), ...relations.slice().sort((a, b) => compareStable(`${a.sourceFactionKey}:${a.targetFactionKey}`, `${b.sourceFactionKey}:${b.targetFactionKey}`)).map((relation) => `${relation.sourceFactionKey}:${relation.targetFactionKey}:${relation.stance}:${relation.tensionKappa}`)];
  const hash = hashKappa(parts);
  return hash <= MAX_SAFE_INTEGER ? hash : hash % MAX_SAFE_INTEGER;
}
