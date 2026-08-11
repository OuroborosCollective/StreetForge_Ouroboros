// StreetForge truth core: integer-only reducer; render code may observe state but never decide damage, loot or XP.
import type { AbilityId, EnemySnapshot, GameSnapshot, PickupSnapshot } from "./types";

export const FP = 100;
export const TICK_MS = 50;

export type Intent =
  | { type: "tick" }
  | { type: "move"; x: number; z: number }
  | { type: "attack" }
  | { type: "dash"; x: number; z: number }
  | { type: "heavy" }
  | { type: "collect" };

export type GameEvent =
  | { type: "hit"; target: string; damage: number }
  | { type: "playerHit"; damage: number }
  | { type: "enemyDown"; enemy: string }
  | { type: "loot"; amount: number }
  | { type: "questComplete" }
  | { type: "toast"; text: string };

interface EnemyState {
  id: string;
  label: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  attackCooldown: number;
  phase: number;
}

interface PickupState {
  id: string;
  x: number;
  z: number;
  kind: "shard" | "weapon";
  label: string;
}

export interface GameState {
  active: boolean;
  tick: number;
  player: { x: number; z: number; hp: number; maxHp: number; stamina: number; maxStamina: number };
  enemies: EnemyState[];
  pickups: PickupState[];
  cooldowns: Record<AbilityId, number>;
  kills: number;
  loot: number;
  xp: number;
  level: number;
  equipped: string;
  lastToast: string | null;
  toastTicks: number;
  respawnTicks: number;
}

const initialEnemies = (): EnemyState[] => [
  { id: "rivet", label: "RIVET", x: -220, z: 260, hp: 58, maxHp: 58, alive: true, attackCooldown: 12, phase: 0 },
  { id: "brass", label: "BRASS", x: 190, z: 40, hp: 74, maxHp: 74, alive: true, attackCooldown: 20, phase: 1 },
  { id: "fuse", label: "FUSE", x: -80, z: -280, hp: 92, maxHp: 92, alive: true, attackCooldown: 28, phase: 2 },
];

export const createInitialState = (): GameState => ({
  active: false,
  tick: 0,
  player: { x: 0, z: 780, hp: 120, maxHp: 120, stamina: 100, maxStamina: 100 },
  enemies: initialEnemies(),
  pickups: [],
  cooldowns: { quick: 0, dash: 0, heavy: 0 },
  kills: 0,
  loot: 0,
  xp: 0,
  level: 3,
  equipped: "SPLIT BAR",
  lastToast: null,
  toastTicks: 0,
  respawnTicks: 0,
});

const square = (n: number) => n * n;
const distanceSq = (ax: number, az: number, bx: number, bz: number) => square(ax - bx) + square(az - bz);
const nearbyEnemy = (state: GameState, range: number) =>
  state.enemies
    .filter((enemy) => enemy.alive && distanceSq(enemy.x, enemy.z, state.player.x, state.player.z) <= square(range))
    .sort((a, b) => distanceSq(a.x, a.z, state.player.x, state.player.z) - distanceSq(b.x, b.z, state.player.x, state.player.z))[0];

const withToast = (state: GameState, text: string, events: GameEvent[]) => {
  state.lastToast = text;
  state.toastTicks = 36;
  events.push({ type: "toast", text });
};

const knockDown = (state: GameState, enemy: EnemyState, events: GameEvent[]) => {
  enemy.alive = false;
  state.kills += 1;
  state.xp += 40;
  state.pickups.push({ id: `shard-${enemy.id}`, x: enemy.x, z: enemy.z, kind: "shard", label: "FORGE SHARD" });
  const weaponDrops = ["CINDER-9 // SIDEARM", "RATCHET LOOP // SMG", "BREACH LIGHT // SHOTGUN"];
  const weaponLabel = weaponDrops[enemy.phase % weaponDrops.length];
  state.pickups.push({ id: `weapon-${enemy.id}`, x: enemy.x + 48, z: enemy.z - 36, kind: "weapon", label: weaponLabel });
  events.push({ type: "enemyDown", enemy: enemy.id });
  withToast(state, `${enemy.label} DOWN — SHARD + WEAPON CACHE DROPPED`, events);
  if (state.kills === 3) {
    events.push({ type: "questComplete" });
    withToast(state, "BLOCK SECURED — CLEAN UP THE SHARDS", events);
  }
};

const strike = (state: GameState, ability: AbilityId, damage: number, range: number, events: GameEvent[]) => {
  if (state.cooldowns[ability] > 0 || state.player.hp <= 0) return;
  const target = nearbyEnemy(state, range);
  if (!target) {
    state.cooldowns[ability] = ability === "quick" ? 7 : ability === "dash" ? 20 : 28;
    withToast(state, "NO TARGET IN RANGE", events);
    return;
  }
  target.hp = Math.max(0, target.hp - damage);
  state.cooldowns[ability] = ability === "quick" ? 7 : ability === "dash" ? 20 : 28;
  events.push({ type: "hit", target: target.id, damage });
  if (target.hp === 0) knockDown(state, target, events);
};

const normalizeAxis = (value: number) => (value > 0 ? 1 : value < 0 ? -1 : 0);

export function reduce(state: GameState, intent: Intent): { state: GameState; events: GameEvent[] } {
  const next: GameState = {
    ...state,
    player: { ...state.player },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    pickups: state.pickups.map((pickup) => ({ ...pickup })),
    cooldowns: { ...state.cooldowns },
  };
  const events: GameEvent[] = [];
  if (!next.active && intent.type !== "tick") return { state: next, events };

  if (intent.type === "move" && next.player.hp > 0) {
    const x = normalizeAxis(intent.x);
    const z = normalizeAxis(intent.z);
    const diagonal = x !== 0 && z !== 0;
    next.player.x = Math.max(-640, Math.min(640, next.player.x + x * (diagonal ? 14 : 20)));
    next.player.z = Math.max(-1320, Math.min(980, next.player.z + z * (diagonal ? 14 : 20)));
  }

  if (intent.type === "attack") strike(next, "quick", 22, 250, events);
  if (intent.type === "heavy" && next.player.stamina >= 25) {
    next.player.stamina -= 25;
    strike(next, "heavy", 38, 290, events);
  }
  if (intent.type === "dash" && next.player.stamina >= 18 && next.cooldowns.dash === 0) {
    next.player.stamina -= 18;
    const x = normalizeAxis(intent.x);
    const z = normalizeAxis(intent.z);
    next.player.x = Math.max(-640, Math.min(640, next.player.x + x * 145));
    next.player.z = Math.max(-1320, Math.min(980, next.player.z + z * 145));
    strike(next, "dash", 31, 305, events);
  }
  if (intent.type === "collect") {
    const pickup = next.pickups
      .filter((item) => distanceSq(item.x, item.z, next.player.x, next.player.z) <= square(190))
      .sort((a, b) => distanceSq(a.x, a.z, next.player.x, next.player.z) - distanceSq(b.x, b.z, next.player.x, next.player.z))[0];
    if (pickup) {
      next.pickups = next.pickups.filter((item) => item.id !== pickup.id);
      next.loot += 1;
      next.xp += pickup.kind === "weapon" ? 45 : 20;
      events.push({ type: "loot", amount: 1 });
      withToast(next, pickup.kind === "weapon" ? `${pickup.label} SECURED +45 XP` : "FORGE SHARD SECURED +20 XP", events);
    }
  }

  if (intent.type === "tick") {
    next.tick += 1;
    (Object.keys(next.cooldowns) as AbilityId[]).forEach((key) => {
      next.cooldowns[key] = Math.max(0, next.cooldowns[key] - 1);
    });
    next.player.stamina = Math.min(next.player.maxStamina, next.player.stamina + 2);
    if (next.toastTicks > 0) next.toastTicks -= 1;
    if (next.toastTicks === 0) next.lastToast = null;
    if (next.player.hp === 0 && next.respawnTicks > 0) {
      next.respawnTicks -= 1;
      if (next.respawnTicks === 0) {
        next.player = { ...next.player, x: 0, z: 780, hp: next.player.maxHp, stamina: next.player.maxStamina };
        next.cooldowns = { quick: 0, dash: 0, heavy: 0 };
        withToast(next, "BACK ON YOUR FEET — WEST END SAFE ROUTE RESTORED", events);
      }
    }
    for (const enemy of next.enemies) {
      if (!enemy.alive || next.player.hp <= 0) continue;
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - 1);
      const dx = next.player.x - enemy.x;
      const dz = next.player.z - enemy.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > square(155)) {
        enemy.x += normalizeAxis(dx) * 7;
        enemy.z += normalizeAxis(dz) * 7;
      } else if (enemy.attackCooldown === 0) {
        next.player.hp = Math.max(0, next.player.hp - 7);
        enemy.attackCooldown = 19 + enemy.phase * 2;
        events.push({ type: "playerHit", damage: 7 });
        if (next.player.hp === 0) {
          next.respawnTicks = 60;
          withToast(next, "YOU WENT DOWN — SAFE ROUTE RECOVERS IN 3 SECONDS", events);
        }
      }
    }
    const targetLevel = 3 + Math.floor(next.xp / 120);
    if (targetLevel > next.level) {
      next.level = targetLevel;
      withToast(next, `LEVEL ${next.level} — DAMAGE OUTPUT RAISED`, events);
    }
  }
  return { state: next, events };
}

export function makeSnapshot(state: GameState): GameSnapshot {
  const enemy = state.enemies
    .filter((item) => item.alive)
    .sort((a, b) => distanceSq(a.x, a.z, state.player.x, state.player.z) - distanceSq(b.x, b.z, state.player.x, state.player.z))[0];
  const enemies: EnemySnapshot[] = state.enemies.map((item) => ({
    id: item.id, label: item.label, hp: item.hp, maxHp: item.maxHp, x: item.x, z: item.z, alive: item.alive,
  }));
  const pickups: PickupSnapshot[] = state.pickups.map((item) => ({ ...item }));
  const objectiveDone = state.kills === 3;
  return {
    active: state.active,
    playerHp: state.player.hp,
    playerMaxHp: state.player.maxHp,
    stamina: state.player.stamina,
    maxStamina: state.player.maxStamina,
    xp: state.xp,
    level: state.level,
    kills: state.kills,
    loot: state.loot,
    objective: objectiveDone ? "BLOCK SECURED" : "SECURE THE BLOCK",
    objectiveDetail: objectiveDone ? `${state.pickups.length} SHARDS REMAIN` : `${state.kills} / 3 RIVALS DOWN`,
    objectiveDone,
    equipped: state.equipped,
    nearestEnemy: enemy?.label ?? null,
    cooldowns: { ...state.cooldowns },
    enemies,
    pickups,
    toast: state.lastToast,
    respawnTicks: state.respawnTicks,
  };
}
