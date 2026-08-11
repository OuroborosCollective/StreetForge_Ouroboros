// GitHub integration guard: verifies the supplied server-only token can read the configured target repository.
import { describe, expect, it } from "vitest";

const repo = "OuroborosCollective/StreetForge_Ouroboros";

describe("GitHub repository access", () => {
  it("reads the configured target repository without exposing the token", async () => {
    const token = process.env.GITHUB_TOKEN;
    expect(token, "GITHUB_TOKEN must be configured for the import flow").toBeTruthy();

    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.status, "GitHub token must be permitted to read the selected repository").toBe(200);
    const body = await response.json() as { full_name?: string };
    expect(body.full_name).toBe(repo);
  }, 15_000);
});
