// GitHub import unit guard: the generated project snapshot must be a safe text-only Git tree without secrets or build artefacts.
import { describe, expect, it } from "vitest";
import { projectSnapshot } from "./projectSnapshot.generated";

describe("StreetForge GitHub snapshot", () => {
  it("contains project source without transient folders or environment files", () => {
    expect(projectSnapshot.length).toBeGreaterThan(10);
    expect(projectSnapshot.some((file) => file.path === "client/src/components/GameCanvas.tsx")).toBe(true);
    expect(projectSnapshot.every((file) => !file.path.startsWith("node_modules/") && !file.path.startsWith("dist/") && !file.path.includes(".env"))).toBe(true);
    expect(projectSnapshot.every((file) => !file.path.startsWith("/") && !file.path.includes(".."))).toBe(true);
  });
});

