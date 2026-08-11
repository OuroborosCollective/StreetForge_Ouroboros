// Admin control surface: moderation and model policy are server-only and cannot access personal MCP connectors.
import { desc, eq } from "drizzle-orm";
import { contentModules, customAssets, gangMemberships, gangs, llmPolicies, territories } from "../../drizzle/schema";
import { listLLMModels } from "../_core/llm";
import { getDb } from "../db";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function adminOverview() {
  const db = requireDb(await getDb());
  const [modules, assets, policies, allGangs, memberships, controlledTerritories] = await Promise.all([
    db.select().from(contentModules).orderBy(desc(contentModules.updatedAt)),
    db.select().from(customAssets).orderBy(desc(customAssets.createdAt)),
    db.select().from(llmPolicies).orderBy(desc(llmPolicies.updatedAt)),
    db.select().from(gangs).orderBy(desc(gangs.createdAt)),
    db.select().from(gangMemberships),
    db.select().from(territories),
  ]);
  return { modules, assets, policies, gangs: allGangs.map((gang) => ({ ...gang, memberCount: memberships.filter((member) => member.gangId === gang.id).length, territory: controlledTerritories.find((territory) => territory.gangId === gang.id)?.displayName ?? null })) };
}

export async function listLiveModelsForAdmin() {
  const catalog = await listLLMModels();
  return catalog.data.map((model) => model.id).sort();
}

export async function setContentStatus(adminUserId: number, input: { moduleId: number; status: "draft" | "active" | "archived" }) {
  const db = requireDb(await getDb());
  const result = await db.update(contentModules).set({ status: input.status }).where(eq(contentModules.id, input.moduleId));
  if ((result as { affectedRows?: number }).affectedRows !== 1) throw new Error("Content module was not found.");
  return { moduleId: input.moduleId, status: input.status, updatedBy: adminUserId };
}

export async function reviewCustomAsset(adminUserId: number, input: { assetId: number; reviewStatus: "approved" | "rejected" }) {
  const db = requireDb(await getDb());
  const result = await db.update(customAssets).set({ reviewStatus: input.reviewStatus, reviewedByUserId: adminUserId, reviewedAt: new Date() }).where(eq(customAssets.id, input.assetId));
  if ((result as { affectedRows?: number }).affectedRows !== 1) throw new Error("Custom asset was not found.");
  return { assetId: input.assetId, reviewStatus: input.reviewStatus };
}

export async function saveLlmPolicy(adminUserId: number, input: { policyKey: string; enabled: boolean; modelId?: string | null; purpose: string; maxOutputTokens: number; humanReviewRequired: boolean }) {
  const db = requireDb(await getDb());
  if (input.modelId) {
    const models = await listLiveModelsForAdmin();
    if (!models.includes(input.modelId)) throw new Error("The selected LLM model is not in the live server-side catalog.");
  }
  const existing = (await db.select().from(llmPolicies).where(eq(llmPolicies.policyKey, input.policyKey)).limit(1))[0];
  const values = { enabled: input.enabled, modelId: input.modelId ?? null, purpose: input.purpose, maxOutputTokens: input.maxOutputTokens, humanReviewRequired: input.humanReviewRequired, updatedByUserId: adminUserId };
  if (existing) await db.update(llmPolicies).set(values).where(eq(llmPolicies.id, existing.id));
  else await db.insert(llmPolicies).values({ policyKey: input.policyKey, ...values });
  return { policyKey: input.policyKey, ...values };
}
