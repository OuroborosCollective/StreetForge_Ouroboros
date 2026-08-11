// Asset upload service: only metadata goes to SQL, asset bytes go into the managed storage layer and remain pending until review.
import { and, desc, eq } from "drizzle-orm";
import { customAssets, gangMemberships, playerProfiles, territories } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { validateCustomAsset } from "./assetRules";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function listCustomAssets(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(customAssets).where(eq(customAssets.ownerUserId, userId)).orderBy(desc(customAssets.createdAt));
}

export async function uploadCustomAsset(userId: number, input: { kind: "character_model" | "territory_model"; originalName: string; mimeType: string; dataBase64: string }) {
  const db = requireDb(await getDb());
  const bytes = Buffer.from(input.dataBase64, "base64");
  const file = validateCustomAsset({ originalName: input.originalName, mimeType: input.mimeType, byteSize: bytes.byteLength });
  const profile = (await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1))[0];
  if (!profile) throw new Error("Create a StreetForge profile before uploading custom assets.");
  let gangId: number | null = null;
  let territoryId: number | null = null;
  if (input.kind === "character_model") {
    if (!profile.personalForgeUnlocked) throw new Error("Character model uploads unlock at profile level 15.");
  } else {
    const membership = (await db.select().from(gangMemberships).where(eq(gangMemberships.userId, userId)).limit(1))[0];
    if (!membership || !["owner", "officer"].includes(membership.rank)) throw new Error("Only a gang owner or officer can upload a territory model.");
    const territory = (await db.select().from(territories).where(eq(territories.gangId, membership.gangId)).limit(1))[0];
    if (!territory) throw new Error("Claim a gang territory before uploading an environment model.");
    gangId = membership.gangId;
    territoryId = territory.id;
  }
  const location = await storagePut(`streetforge/${input.kind}/${userId}/${file.safeName}`, bytes, input.mimeType);
  const inserted = await db.insert(customAssets).values({ ownerUserId: userId, gangId, territoryId, kind: input.kind, originalName: file.safeName, storageKey: location.key, storageUrl: location.url, mimeType: input.mimeType, byteSize: bytes.byteLength, reviewStatus: "pending" });
  const [header] = inserted as unknown as [{ insertId: number }];
  return { id: Number(header.insertId), kind: input.kind, originalName: file.safeName, reviewStatus: "pending" as const };
}

