import { and, eq } from "drizzle-orm";
import { achievementDefinitions, paymentProviders, playerAchievements, playerStatistics, premiumProducts } from "../../drizzle/schema";
import { getDb } from "../db";

type Metric = "enemies_defeated" | "quests_completed" | "dungeon_runs_completed" | "messages_sent";
function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function getPlayerStats(userId: number) {
  const db = requireDb(await getDb());
  const existing = (await db.select().from(playerStatistics).where(eq(playerStatistics.userId, userId)).limit(1))[0];
  if (existing) return existing;
  await db.insert(playerStatistics).values({ userId });
  return (await db.select().from(playerStatistics).where(eq(playerStatistics.userId, userId)).limit(1))[0]!;
}

export async function recordStatistic(userId: number, metric: Metric, increment = 1) {
  if (!Number.isInteger(increment) || increment < 1 || increment > 100_000) throw new Error("Invalid statistic increment.");
  const db = requireDb(await getDb());
  const current = await getPlayerStats(userId);
  const field = metric === "enemies_defeated" ? "enemiesDefeated" : metric === "quests_completed" ? "questsCompleted" : metric === "dungeon_runs_completed" ? "dungeonRunsCompleted" : "messagesSent";
  const next = current[field] + increment;
  await db.update(playerStatistics).set({ [field]: next }).where(eq(playerStatistics.id, current.id));
  const active = await db.select().from(achievementDefinitions).where(and(eq(achievementDefinitions.metric, metric), eq(achievementDefinitions.status, "active")));
  for (const definition of active.filter((entry) => entry.threshold <= next)) {
    const granted = (await db.select().from(playerAchievements).where(and(eq(playerAchievements.userId, userId), eq(playerAchievements.achievementDefinitionId, definition.id))).limit(1))[0];
    if (!granted) await db.insert(playerAchievements).values({ userId, achievementDefinitionId: definition.id });
  }
  return getPlayerStats(userId);
}

export async function listPlayerAchievements(userId: number) {
  const db = requireDb(await getDb());
  const unlocked = await db.select().from(playerAchievements).where(eq(playerAchievements.userId, userId));
  const definitions = await db.select().from(achievementDefinitions).where(eq(achievementDefinitions.status, "active"));
  return definitions.map((definition) => ({ ...definition, unlockedAt: unlocked.find((entry) => entry.achievementDefinitionId === definition.id)?.unlockedAt ?? null }));
}

export async function saveAchievementDefinition(userId: number, input: { achievementKey: string; title: string; description: string; metric: Metric; threshold: number; status: "draft" | "active" | "archived" }) {
  const db = requireDb(await getDb());
  const existing = (await db.select().from(achievementDefinitions).where(eq(achievementDefinitions.achievementKey, input.achievementKey)).limit(1))[0];
  if (existing) await db.update(achievementDefinitions).set({ title: input.title, description: input.description, metric: input.metric, threshold: input.threshold, status: input.status }).where(eq(achievementDefinitions.id, existing.id));
  else await db.insert(achievementDefinitions).values({ ...input, createdByUserId: userId });
  return db.select().from(achievementDefinitions).where(eq(achievementDefinitions.achievementKey, input.achievementKey)).limit(1);
}

export async function listPremiumConfiguration() {
  const db = requireDb(await getDb());
  const [products, providers] = await Promise.all([db.select().from(premiumProducts), db.select().from(paymentProviders)]);
  return { products, providers };
}

export async function savePremiumProduct(userId: number, input: { productKey: string; entitlementKey: string; title: string; priceMinor: number; currency: string; status: "draft" | "active" | "archived" }) {
  const db = requireDb(await getDb());
  const existing = (await db.select().from(premiumProducts).where(eq(premiumProducts.productKey, input.productKey)).limit(1))[0];
  if (existing) await db.update(premiumProducts).set({ title: input.title, priceMinor: input.priceMinor, currency: input.currency, status: input.status }).where(eq(premiumProducts.id, existing.id));
  else await db.insert(premiumProducts).values({ ...input, createdByUserId: userId });
  return listPremiumConfiguration();
}

/** Only capability status is stored here. Credentials are never persisted and checkout remains unavailable until an adapter is genuinely connected. */
export async function savePaymentProvider(userId: number, input: { providerKey: string; displayName: string; state: "unconfigured" | "disabled" }) {
  const db = requireDb(await getDb());
  const existing = (await db.select().from(paymentProviders).where(eq(paymentProviders.providerKey, input.providerKey)).limit(1))[0];
  if (existing) await db.update(paymentProviders).set({ displayName: input.displayName, state: input.state, updatedByUserId: userId }).where(eq(paymentProviders.id, existing.id));
  else await db.insert(paymentProviders).values({ ...input, updatedByUserId: userId });
  return listPremiumConfiguration();
}
