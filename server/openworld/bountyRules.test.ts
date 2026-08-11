import { describe, expect, it } from "vitest";
import { bountyReward, validateBountyContribution } from "./bountyRules";

describe("bounty rules", () => {
  it("uses exact whole-number rewards and refuses contributions without sufficient balance", () => {
    expect(bountyReward(500, 125)).toBe(625);
    expect(validateBountyContribution(50, 50)).toBe(50);
    expect(() => validateBountyContribution(51, 50)).toThrow("Insufficient Street Cred");
    expect(() => validateBountyContribution(1.5, 50)).toThrow("whole amount");
  });
});
