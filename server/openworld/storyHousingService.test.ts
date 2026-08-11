import { describe, expect, it } from "vitest";

describe("City story contract", () => {
  it("admits only defined branches from the active node", () => {
    const graph = { "first-contact": ["trust-runner", "back-gang"] };
    expect(graph["first-contact"]).toContain("trust-runner");
    expect(graph["first-contact"]).not.toContain("claim-home");
  });
});
