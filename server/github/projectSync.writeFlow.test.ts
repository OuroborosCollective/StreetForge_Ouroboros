// Write-flow contract: mocked GitHub API proves StreetForge initializes an empty target, writes a branch snapshot, then creates a draft PR.
import { afterEach, describe, expect, it, vi } from "vitest";
import { importStreetForgeProject } from "./projectSync";

const originalFetch = global.fetch;
const originalToken = process.env.GITHUB_TOKEN;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  global.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = originalToken;
});

describe("StreetForge GitHub write flow", () => {
  it("initializes an empty target, creates a feature branch and opens a draft pull request", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const responses = [
      json({ full_name: "OuroborosCollective/StreetForge_Ouroboros", default_branch: "main", empty: true, size: 0 }),
      json({ message: "Not Found" }, 404),
      json({ sha: "tree-initial" }),
      json({ sha: "commit-initial", tree: { sha: "tree-initial" } }),
      json({ ref: "refs/heads/main", object: { sha: "commit-initial" } }),
      json({ sha: "commit-initial", tree: { sha: "tree-initial" } }),
      json({ sha: "tree-snapshot" }),
      json({ sha: "commit-snapshot", tree: { sha: "tree-snapshot" } }),
      json({ ref: "refs/heads/streetforge/neon-district", object: { sha: "commit-snapshot" } }),
      json({ html_url: "https://github.com/OuroborosCollective/StreetForge_Ouroboros/pull/1", number: 1 }),
    ];
    global.fetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const next = responses.shift();
      if (!next) throw new Error("Unexpected GitHub request");
      return next;
    }) as unknown as typeof fetch;

    const result = await importStreetForgeProject({ confirmation: "PUSH_STREETFORGE_TO_OUROBOROS" });

    expect(result.initializedBase).toBe(true);
    expect(result.pullRequestUrl).toContain("/pull/1");
    expect(calls.some((call) => call.url.endsWith("/git/refs") && call.method === "POST")).toBe(true);
    const pullCall = calls.find((call) => call.url.endsWith("/pulls"));
    expect(pullCall?.body).toMatchObject({ base: "main", draft: true, title: expect.stringContaining("StreetForge") });
    expect(calls.some((call) => call.url.endsWith("/git/trees") && call.method === "POST")).toBe(true);
  });
});
