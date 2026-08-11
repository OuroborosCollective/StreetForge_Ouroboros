import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ write: vi.fn(), policy: vi.fn(), content: vi.fn() }));
vi.mock("../db", () => ({ getDb: vi.fn(async () => ({ insert: vi.fn(() => ({ values: (value: unknown) => ({ onDuplicateKeyUpdate: async () => state.write(value) }) })) })) }));
vi.mock("./cityService", () => ({ getDistrictEntryPolicy: state.policy }));
vi.mock("./contentService", () => ({ ensureStarterContent: state.content }));

import { enterDistrict } from "./worldInteractionService";

describe("District entry service", () => {
  beforeEach(() => {
    state.write.mockReset();
    state.policy.mockReset();
    state.content.mockReset();
    state.content.mockResolvedValue(new Map([["district.west-end-yard", { kind: "district", status: "active" }]]));
  });

  it("writes presence only after an allowed policy with a persisted-claim projection", async () => {
    state.policy.mockResolvedValue({ entryAllowed: true, routeState: "caution", claim: { gangTag: "FGE" } });
    const result = await enterDistrict(41, "district.west-end-yard");
    expect(result.state).toBe("entered");
    expect(state.policy).toHaveBeenCalledOnce();
    expect(state.write).toHaveBeenCalledWith(expect.objectContaining({ userId: 41, districtKey: "district.west-end-yard" }));
  });

  it("rejects a lockdown policy without writing city presence", async () => {
    state.policy.mockResolvedValue({ entryAllowed: false, directive: "POLICE LOCKDOWN" });
    await expect(enterDistrict(41, "district.west-end-yard")).rejects.toThrow("POLICE LOCKDOWN");
    expect(state.write).not.toHaveBeenCalled();
  });
});
