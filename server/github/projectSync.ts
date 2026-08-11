// GitHub import service: only the explicitly configured target repo can receive a confirmed, server-side StreetForge snapshot.
import { projectSnapshot } from "./projectSnapshot.generated";

const owner = "OuroborosCollective";
const repository = "StreetForge_Ouroboros";
const fullName = `${owner}/${repository}`;
const apiRoot = `https://api.github.com/repos/${fullName}`;
const confirmationPhrase = "PUSH_STREETFORGE_TO_OUROBOROS";

type GitHubErrorPayload = { message?: string };
type Repository = { default_branch?: string; empty?: boolean; size?: number; full_name?: string };
type GitRef = { object: { sha: string } };
type GitCommit = { sha: string; tree: { sha: string } };
type GitTree = { sha: string };
type PullRequest = { html_url: string; number: number };

class GitHubApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

function token() {
  const value = process.env.GITHUB_TOKEN;
  if (!value) throw new Error("GitHub import is not configured.");
  return value;
}

async function github<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiRoot}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as GitHubErrorPayload;
    throw new GitHubApiError(response.status, body.message ?? `GitHub request failed with ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

async function getRepository() {
  const repo = await github<Repository>("");
  if (repo.full_name !== fullName) throw new Error("The configured GitHub repository did not match the allowed target.");
  return repo;
}

async function createTree(entries: Array<{ path: string; content: string }>, baseTree?: string) {
  return github<GitTree>("/git/trees", {
    method: "POST",
    body: JSON.stringify({
      ...(baseTree ? { base_tree: baseTree } : {}),
      tree: entries.map((file) => ({ path: file.path, mode: "100644", type: "blob", content: file.content })),
    }),
  });
}

async function createCommit(message: string, tree: string, parents: string[] = []) {
  return github<GitCommit>("/git/commits", { method: "POST", body: JSON.stringify({ message, tree, parents }) });
}

async function getRef(branch: string) {
  return github<GitRef>(`/git/ref/heads/${encodeURIComponent(branch)}`);
}

async function ensureBaseBranch(branch: string) {
  try {
    return { sha: (await getRef(branch)).object.sha, initialized: false };
  } catch (error) {
    if (!(error instanceof GitHubApiError) || (error.status !== 404 && error.status !== 409)) throw error;
  }
  const tree = await createTree([{ path: "README.md", content: "# StreetForge Ouroboros\n\nRepository initialized for the StreetForge import workflow.\n" }]);
  const commit = await createCommit("chore: initialize StreetForge repository", tree.sha);
  await github<GitRef>("/git/refs", { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }) });
  return { sha: commit.sha, initialized: true };
}

function importBranch() {
  return `streetforge/neon-district-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12)}`;
}

export async function getGitHubImportStatus() {
  const repo = await getRepository();
  return { fullName, defaultBranch: repo.default_branch ?? "main", isEmpty: Boolean(repo.empty || repo.size === 0), fileCount: projectSnapshot.length };
}

export async function importStreetForgeProject(input: { confirmation: string }) {
  if (input.confirmation !== confirmationPhrase) throw new Error("The import confirmation phrase was not accepted.");
  const repo = await getRepository();
  const baseBranch = repo.default_branch ?? "main";
  const base = await ensureBaseBranch(baseBranch);
  const baseCommit = await github<GitCommit>(`/git/commits/${base.sha}`);
  const tree = await createTree(projectSnapshot, baseCommit.tree.sha);
  const commit = await createCommit("feat: import StreetForge Neon District vertical slice", tree.sha, [base.sha]);
  const branch = importBranch();
  await github<GitRef>("/git/refs", { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }) });
  const pullRequest = await github<PullRequest>("/pulls", {
    method: "POST",
    body: JSON.stringify({
      title: "feat: import StreetForge Neon District vertical slice",
      head: branch,
      base: baseBranch,
      draft: true,
      body: "## StreetForge import\n\nThis draft PR imports the current StreetForge Neon District playable vertical slice, generated art manifest, deterministic client-side simulation core, and GitHub export workflow.\n\n- [ ] Review gameplay files and assets\n- [ ] Verify local build and tests\n- [ ] Merge when the district is approved\n",
    }),
  });
  return { fullName, baseBranch, branch, initializedBase: base.initialized, fileCount: projectSnapshot.length, pullRequestUrl: pullRequest.html_url, pullRequestNumber: pullRequest.number };
}

export { confirmationPhrase, fullName };

