import { describe, expect, it } from "vitest";
import { resolveRoutine } from "./cityService";

describe("City routine resolver", () => {
  it("derives routine availability from an explicit UTC server time", () => {
    expect(resolveRoutine(new Date("2026-08-11T03:00:00.000Z")).availability).toBe("offline");
    expect(resolveRoutine(new Date("2026-08-11T11:00:00.000Z")).availability).toBe("available");
    expect(resolveRoutine(new Date("2026-08-11T21:00:00.000Z")).availability).toBe("at_risk");
  });
});
