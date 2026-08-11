// StreetForge UI boundary: this file exposes small serializable state only, never Babylon objects.
export type AbilityId = "quick" | "dash" | "heavy";

export interface EnemySnapshot {
  id: string;
  label: string;
  hp: number;
  maxHp: number;
  x: number;
  z: number;
  alive: boolean;
}

export interface PickupSnapshot {
  id: string;
  x: number;
  z: number;
  kind: "shard" | "weapon";
  label: string;
}

export interface GameSnapshot {
  active: boolean;
  playerHp: number;
  playerMaxHp: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  level: number;
  kills: number;
  loot: number;
  objective: string;
  objectiveDetail: string;
  objectiveDone: boolean;
  equipped: string;
  nearestEnemy: string | null;
  cooldowns: Record<AbilityId, number>;
  enemies: EnemySnapshot[];
  pickups: PickupSnapshot[];
  toast: string | null;
  respawnTicks: number;
}
