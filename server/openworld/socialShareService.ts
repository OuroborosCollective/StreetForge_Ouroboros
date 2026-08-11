import { eq } from "drizzle-orm";
import { playerProfiles, socialShareRewards } from "../../drizzle/schema";
import { getDb } from "../db";
import { ensurePlayerProfile } from "./profileService";

const SHARE_REWARD = 75;
function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function claimSocialShareReward(userId: number, channel: string) {
  const db = requireDb(await getDb());
  const existing = (await db.select().from(socialShareRewards).where(eq(socialShareRewards.userId, userId)).limit(1))[0];
  if (existing) return { granted: false, rewardAmount: existing.rewardAmount };
  await ensurePlayerProfile(userId);
  const profile = (await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1))[0];
  if (!profile) throw new Error("StreetForge profile is unavailable.");
  await db.transaction(async (tx) => {
    await tx.insert(socialShareRewards).values({ userId, rewardAmount: SHARE_REWARD, channel: channel.slice(0, 32) || "web-share" });
    await tx.update(playerProfiles).set({ streetCred: profile.streetCred + SHARE_REWARD }).where(eq(playerProfiles.id, profile.id));
  });
  return { granted: true, rewardAmount: SHARE_REWARD };
}
