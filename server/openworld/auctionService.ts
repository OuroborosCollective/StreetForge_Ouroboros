// Server-authoritative auction service: listings escrow inventory, bids reserve Street Cred, and all state changes run in one database transaction.
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { auctionBids, auctionListings, contentModules, playerItems, playerProfiles } from "../../drizzle/schema";
import { getDb } from "../db";
import { minimumBid, resolveAuctionExpiry, validateListingInput } from "./auctionRules";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("StreetForge database is unavailable.");
  return db;
}

async function requireProfile(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number) {
  const rows = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  const profile = rows[0];
  if (!profile) throw new Error("Create a StreetForge profile before using the auction house.");
  return profile;
}

export async function resolveExpiredAuctionListings() {
  const db = requireDb(await getDb());
  const expired = await db.select().from(auctionListings).where(and(eq(auctionListings.status, "open"), lt(auctionListings.expiresAt, new Date())));
  for (const listing of expired) {
    await db.transaction(async (tx) => {
      const result = await tx.update(auctionListings).set({ status: "expired", resolvedAt: new Date() }).where(and(eq(auctionListings.id, listing.id), eq(auctionListings.status, "open")));
      if ((result as { affectedRows?: number }).affectedRows !== 1) return;
      await tx.update(playerItems).set({ quantity: sql`${playerItems.quantity} + ${listing.quantity}` }).where(eq(playerItems.id, listing.playerItemId));
      if (listing.highestBidderUserId && listing.highestBid > 0) await tx.update(playerProfiles).set({ streetCred: sql`${playerProfiles.streetCred} + ${listing.highestBid}` }).where(eq(playerProfiles.userId, listing.highestBidderUserId));
    });
  }
}

export async function listOpenAuctions() {
  await resolveExpiredAuctionListings();
  const db = requireDb(await getDb());
  return db.select({ id: auctionListings.id, sellerUserId: auctionListings.sellerUserId, playerItemId: auctionListings.playerItemId, quantity: auctionListings.quantity, startingPrice: auctionListings.startingPrice, buyoutPrice: auctionListings.buyoutPrice, highestBid: auctionListings.highestBid, highestBidderUserId: auctionListings.highestBidderUserId, expiresAt: auctionListings.expiresAt, title: contentModules.title, moduleKey: contentModules.moduleKey }).from(auctionListings).innerJoin(playerItems, eq(auctionListings.playerItemId, playerItems.id)).innerJoin(contentModules, eq(playerItems.itemModuleId, contentModules.id)).where(eq(auctionListings.status, "open"));
}

export async function createAuctionListing(userId: number, input: { playerItemId: number; quantity: number; startingPrice: number; buyoutPrice?: number | null; durationHours: number }) {
  validateListingInput(input);
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    await requireProfile(db, userId);
    const item = (await tx.select().from(playerItems).where(and(eq(playerItems.id, input.playerItemId), eq(playerItems.userId, userId))).limit(1))[0];
    if (!item || item.quantity < input.quantity) throw new Error("The selected inventory item is unavailable for escrow.");
    const debit = await tx.update(playerItems).set({ quantity: sql`${playerItems.quantity} - ${input.quantity}` }).where(and(eq(playerItems.id, input.playerItemId), eq(playerItems.userId, userId), gte(playerItems.quantity, input.quantity)));
    if ((debit as { affectedRows?: number }).affectedRows !== 1) throw new Error("The inventory changed before the listing could be created.");
    const expiry = resolveAuctionExpiry(input.durationHours);
    const inserted = await tx.insert(auctionListings).values({ sellerUserId: userId, playerItemId: input.playerItemId, quantity: input.quantity, startingPrice: input.startingPrice, buyoutPrice: input.buyoutPrice ?? null, expiresAt: expiry });
    const [header] = inserted as unknown as [{ insertId: number }];
    return { listingId: Number(header.insertId), expiresAt: expiry };
  });
}

export async function placeAuctionBid(userId: number, input: { listingId: number; amount: number }) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const listing = (await tx.select().from(auctionListings).where(eq(auctionListings.id, input.listingId)).limit(1))[0];
    if (!listing || listing.status !== "open" || listing.expiresAt <= new Date()) throw new Error("This listing is no longer open.");
    if (listing.sellerUserId === userId || listing.highestBidderUserId === userId) throw new Error("A seller or current high bidder cannot place this bid.");
    const required = minimumBid(listing.startingPrice, listing.highestBid);
    if (!Number.isInteger(input.amount) || input.amount < required) throw new Error(`Minimum bid is ${required} Street Cred.`);
    const profile = await requireProfile(db, userId);
    if (profile.streetCred < input.amount) throw new Error("Not enough Street Cred for this bid.");
    const debit = await tx.update(playerProfiles).set({ streetCred: sql`${playerProfiles.streetCred} - ${input.amount}` }).where(and(eq(playerProfiles.userId, userId), gte(playerProfiles.streetCred, input.amount)));
    if ((debit as { affectedRows?: number }).affectedRows !== 1) throw new Error("Street Cred changed before the bid was reserved.");
    if (listing.highestBidderUserId && listing.highestBid > 0) await tx.update(playerProfiles).set({ streetCred: sql`${playerProfiles.streetCred} + ${listing.highestBid}` }).where(eq(playerProfiles.userId, listing.highestBidderUserId));
    const updated = await tx.update(auctionListings).set({ highestBid: input.amount, highestBidderUserId: userId }).where(and(eq(auctionListings.id, listing.id), eq(auctionListings.status, "open"), eq(auctionListings.highestBid, listing.highestBid)));
    if ((updated as { affectedRows?: number }).affectedRows !== 1) throw new Error("The auction changed before this bid was accepted.");
    await tx.insert(auctionBids).values({ listingId: listing.id, bidderUserId: userId, amount: input.amount });
    return { listingId: listing.id, currentBid: input.amount };
  });
}

export async function buyoutAuction(userId: number, listingId: number) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const listing = (await tx.select().from(auctionListings).where(eq(auctionListings.id, listingId)).limit(1))[0];
    if (!listing || listing.status !== "open" || listing.expiresAt <= new Date() || !listing.buyoutPrice) throw new Error("This listing cannot be bought out.");
    if (listing.sellerUserId === userId) throw new Error("Sellers cannot buy their own listing.");
    const buyer = await requireProfile(db, userId);
    if (buyer.streetCred < listing.buyoutPrice) throw new Error("Not enough Street Cred for this buyout.");
    const sourceItem = (await tx.select().from(playerItems).where(eq(playerItems.id, listing.playerItemId)).limit(1))[0];
    if (!sourceItem) throw new Error("The escrow item could not be resolved.");
    const debit = await tx.update(playerProfiles).set({ streetCred: sql`${playerProfiles.streetCred} - ${listing.buyoutPrice}` }).where(and(eq(playerProfiles.userId, userId), gte(playerProfiles.streetCred, listing.buyoutPrice)));
    if ((debit as { affectedRows?: number }).affectedRows !== 1) throw new Error("Street Cred changed before the buyout completed.");
    if (listing.highestBidderUserId && listing.highestBid > 0) await tx.update(playerProfiles).set({ streetCred: sql`${playerProfiles.streetCred} + ${listing.highestBid}` }).where(eq(playerProfiles.userId, listing.highestBidderUserId));
    await tx.update(playerProfiles).set({ streetCred: sql`${playerProfiles.streetCred} + ${listing.buyoutPrice}` }).where(eq(playerProfiles.userId, listing.sellerUserId));
    await tx.insert(playerItems).values({ userId, itemModuleId: sourceItem.itemModuleId, quantity: listing.quantity });
    const sold = await tx.update(auctionListings).set({ status: "sold", highestBid: listing.buyoutPrice, highestBidderUserId: userId, resolvedAt: new Date() }).where(and(eq(auctionListings.id, listing.id), eq(auctionListings.status, "open")));
    if ((sold as { affectedRows?: number }).affectedRows !== 1) throw new Error("The listing changed before the buyout completed.");
    return { listingId: listing.id, price: listing.buyoutPrice, itemModuleId: sourceItem.itemModuleId };
  });
}
