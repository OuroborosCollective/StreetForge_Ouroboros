import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "../../client/src/game/sim";

describe("StreetForge deterministic respawn", () => {
  it("restores a defeated player at the safe entry point after the announced countdown", () => {
    let state = createInitialState();
    state.active = true;
    state.player.hp = 7;
    state.enemies[0] = { ...state.enemies[0], x: state.player.x, z: state.player.z, attackCooldown: 0 };
    state = reduce(state, { type: "tick" }).state;
    expect(state.player.hp).toBe(0);
    expect(state.respawnTicks).toBeGreaterThan(0);
    for (let index = 0; index < 60; index += 1) state = reduce(state, { type: "tick" }).state;
    expect(state.player.hp).toBe(state.player.maxHp);
    expect(state.player.z).toBe(780);
    expect(state.respawnTicks).toBe(0);
  });
});
