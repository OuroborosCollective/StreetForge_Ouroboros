// Auction rules stay pure so the database transaction owns all currency and item mutations.
export function minimumBid(startingPrice: number, highestBid: number) {
  return Math.max(startingPrice, highestBid + 1);
}

export function validateListingInput(input: { quantity: number; startingPrice: number; buyoutPrice?: number | null; durationHours: number }) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) throw new Error("A listing needs at least one item.");
  if (!Number.isInteger(input.startingPrice) || input.startingPrice < 1) throw new Error("Starting price must be a positive integer.");
  if (input.buyoutPrice !== null && input.buyoutPrice !== undefined && input.buyoutPrice < input.startingPrice) throw new Error("Buyout price cannot be below the starting price.");
  if (!Number.isInteger(input.durationHours) || input.durationHours < 1 || input.durationHours > 168) throw new Error("Auction duration must be between 1 and 168 hours.");
}

export function resolveAuctionExpiry(hours: number, now = new Date()) {
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

