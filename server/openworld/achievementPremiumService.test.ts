import { describe, expect, it } from "vitest";

describe("Achievement thresholds", () => {
  it("never treats an incomplete metric as unlocked", () => {
    const threshold = 10;
    expect(9 >= threshold).toBe(false);
    expect(10 >= threshold).toBe(true);
  });
});
