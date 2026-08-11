import { describe, expect, it } from "vitest";
import { civilizationWorldHash, deriveFactionVote, tickFaction, tickNpc, tickRelation, type FactionCoreState, type NpcCoreState, type RelationCoreState } from "./civilizationCore";

const npc = (npcKey: string, positionX = 0, positionZ = 0): NpcCoreState => ({ npcKey, districtKey: "district.low-line", factionKey: "faction.raider", positionX, positionZ, targetX: 300_000, targetZ: 0, routeCursor: 0, collisionCount: 0, state: "travel", hungerKappa: 600_000, wealthKappa: 600_000, socialKappa: 600_000, safetyKappa: 600_000 });
const faction: FactionCoreState = { factionKey: "faction.raider", leaderNpcKey: "npc.alpha", foodReserveKappa: 500_000, cohesionKappa: 500_000, legitimacyKappa: 500_000, posture: "peace" };

describe("civilization Kappa core", () => {
  it("reroutes a blocked agent with integer positions and produces replay-stable hashes", () => {
    const alpha = npc("npc.alpha");
    const bravo = npc("npc.bravo", 50_000, 0);
    const first = tickNpc(alpha, [alpha, bravo], [{ minX: 40_000, maxX: 100_000, minZ: -20_000, maxZ: 20_000 }], 42);
    const second = tickNpc(alpha, [alpha, bravo], [{ minX: 40_000, maxX: 100_000, minZ: -20_000, maxZ: 20_000 }], 42);
    expect(first.state).toBe("reroute");
    expect(first.collisionCount).toBe(1);
    expect(Number.isSafeInteger(first.positionX)).toBe(true);
    expect(civilizationWorldHash(42, [first, bravo], [faction], [])).toBe(civilizationWorldHash(42, [second, bravo], [faction], []));
  });

  it("reacts to unmet gang needs and derives war or peace only from integer state", () => {
    const stressed = tickFaction({ ...faction, foodReserveKappa: 100_000, cohesionKappa: 300_000, legitimacyKappa: 200_000 }, [npc("npc.alpha"), npc("npc.bravo")], 90);
    const relation: RelationCoreState = { sourceFactionKey: "faction.raider", targetFactionKey: "faction.police", tensionKappa: 799_000, trustKappa: 300_000, stance: "peace" };
    const escalated = tickRelation(relation, { ...stressed, foodReserveKappa: 100_000 }, { ...faction, factionKey: "faction.police", foodReserveKappa: 100_000 });
    expect(stressed.foodReserveKappa).toBeLessThan(100_000);
    expect(escalated.stance).toBe("war");
  });

  it("derives leadership and peace votes from unmet needs instead of a client vote total", () => {
    const leadership = deriveFactionVote("leadership", { ...faction, legitimacyKappa: 100_000, cohesionKappa: 100_000 }, null);
    const peace = deriveFactionVote("peace", faction, { sourceFactionKey: "faction.raider", targetFactionKey: "faction.police", tensionKappa: 700_000, trustKappa: 900_000, stance: "war" });
    expect(leadership.yesWeightKappa).toBeGreaterThan(leadership.noWeightKappa);
    expect(peace.yesWeightKappa).toBeGreaterThan(0);
  });
});
