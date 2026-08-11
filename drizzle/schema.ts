import { bigint, boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Persistent player progression; level is intentionally uncapped and total XP uses a 64-bit integer. */
export const playerProfiles = mysqlTable("player_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  callsign: varchar("callsign", { length: 48 }).notNull(),
  level: int("level").notNull().default(1),
  totalXp: bigint("totalXp", { mode: "number" }).notNull().default(0),
  streetCred: bigint("streetCred", { mode: "number" }).notNull().default(500),
  skillPoints: int("skillPoints").notNull().default(0),
  personalForgeUnlocked: boolean("personalForgeUnlocked").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Each authenticated account may own multiple roleplay characters; exactly one can be active for a game join. */
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  callsign: varchar("callsign", { length: 32 }).notNull(),
  archetype: mysqlEnum("archetype", ["runner", "enforcer", "scout", "fixer"]).notNull(),
  presentation: mysqlEnum("presentation", ["street", "industrial", "night_ops"]).notNull().default("street"),
  isActive: boolean("isActive").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastPlayedAt: timestamp("lastPlayedAt"),
});

/** Player-owned gangs can claim one or more named territory records. */
export const gangs = mysqlTable("gangs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  tag: varchar("tag", { length: 6 }).notNull().unique(),
  ownerUserId: int("ownerUserId").notNull(),
  reputation: int("reputation").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const gangMemberships = mysqlTable("gang_memberships", {
  id: int("id").autoincrement().primaryKey(),
  gangId: int("gangId").notNull(),
  userId: int("userId").notNull(),
  rank: mysqlEnum("rank", ["owner", "officer", "member"]).notNull().default("member"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

/** A territory describes a stable point in the seed-driven city lattice. */
export const territories = mysqlTable("territories", {
  id: int("id").autoincrement().primaryKey(),
  gangId: int("gangId").notNull().unique(),
  districtKey: varchar("districtKey", { length: 64 }).notNull().unique(),
  districtX: int("districtX").notNull(),
  districtZ: int("districtZ").notNull(),
  worldSeed: int("worldSeed").notNull(),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  state: mysqlEnum("state", ["active", "contested", "abandoned"]).notNull().default("active"),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
});

/** Versioned, schema-shaped authored content that the procedural world can admit by module key. */
export const contentModules = mysqlTable("content_modules", {
  id: int("id").autoincrement().primaryKey(),
  moduleKey: varchar("moduleKey", { length: 96 }).notNull(),
  version: int("version").notNull().default(1),
  kind: mysqlEnum("kind", ["district", "encounter", "npc", "quest", "item", "ability", "drop_table"]).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).notNull().default("draft"),
  payload: json("payload").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const questProgress = mysqlTable("quest_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questModuleId: int("questModuleId").notNull(),
  state: mysqlEnum("state", ["available", "active", "completed", "failed"]).notNull().default("available"),
  currentStep: int("currentStep").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const playerItems = mysqlTable("player_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemModuleId: int("itemModuleId").notNull(),
  quantity: int("quantity").notNull().default(1),
  equippedSlot: varchar("equippedSlot", { length: 24 }),
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
});

/** A character appearance is an explicit projection of player-owned inventory; arbitrary model URLs cannot be equipped. */
export const characterEquipment = mysqlTable("character_equipment", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  playerItemId: int("playerItemId").notNull(),
  slot: mysqlEnum("slot", ["weapon", "head", "torso", "gloves", "legs", "shoes", "cape", "shoulder", "offhand"]).notNull(),
  equippedAt: timestamp("equippedAt").defaultNow().notNull(),
});

/** Transfers are immutable accounting receipts between current members of the same group. */
export const groupMoneyTransfers = mysqlTable("group_money_transfers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  senderUserId: int("senderUserId").notNull(),
  recipientUserId: int("recipientUserId").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const playerSkills = mysqlTable("player_skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  abilityModuleId: int("abilityModuleId").notNull(),
  rank: int("rank").notNull().default(1),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

/** Separate mastery XP: only actions taken with the matching fictionalized weapon category can increase these values. */
export const weaponMasteries = mysqlTable("weapon_masteries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weaponCategory: mysqlEnum("weaponCategory", ["melee", "sidearm", "smg", "shotgun", "rifle", "marksman", "heavy", "thrown"]).notNull(),
  level: int("level").notNull().default(1),
  totalXp: bigint("totalXp", { mode: "number" }).notNull().default(0),
  skillPoints: int("skillPoints").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const weaponMasteryUnlocks = mysqlTable("weapon_mastery_unlocks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weaponCategory: mysqlEnum("weaponCategory", ["melee", "sidearm", "smg", "shotgun", "rifle", "marksman", "heavy", "thrown"]).notNull(),
  nodeKey: varchar("nodeKey", { length: 72 }).notNull(),
  rank: int("rank").notNull().default(1),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

/** Every listing keeps its seller-owned item in escrow until a deterministic buy, cancellation or expiry resolution. */
export const auctionListings = mysqlTable("auction_listings", {
  id: int("id").autoincrement().primaryKey(),
  sellerUserId: int("sellerUserId").notNull(),
  playerItemId: int("playerItemId").notNull(),
  quantity: int("quantity").notNull().default(1),
  startingPrice: bigint("startingPrice", { mode: "number" }).notNull(),
  buyoutPrice: bigint("buyoutPrice", { mode: "number" }),
  highestBid: bigint("highestBid", { mode: "number" }).notNull().default(0),
  highestBidderUserId: int("highestBidderUserId"),
  status: mysqlEnum("status", ["open", "sold", "cancelled", "expired"]).notNull().default("open"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const auctionBids = mysqlTable("auction_bids", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  bidderUserId: int("bidderUserId").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Metadata only: file bytes remain in S3 and become usable only after review. */
export const customAssets = mysqlTable("custom_assets", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  gangId: int("gangId"),
  territoryId: int("territoryId"),
  kind: mysqlEnum("kind", ["character_model", "territory_model"]).notNull(),
  originalName: varchar("originalName", { length: 180 }).notNull(),
  storageKey: varchar("storageKey", { length: 300 }).notNull(),
  storageUrl: text("storageUrl").notNull(),
  mimeType: varchar("mimeType", { length: 96 }).notNull(),
  byteSize: int("byteSize").notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).notNull().default("pending"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Server-side policy only; no user-local or Manus session MCP connectors are stored here. */
export const llmPolicies = mysqlTable("llm_policies", {
  id: int("id").autoincrement().primaryKey(),
  policyKey: varchar("policyKey", { length: 64 }).notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  modelId: varchar("modelId", { length: 120 }),
  purpose: varchar("purpose", { length: 160 }).notNull(),
  maxOutputTokens: int("maxOutputTokens").notNull().default(800),
  humanReviewRequired: boolean("humanReviewRequired").notNull().default(true),
  updatedByUserId: int("updatedByUserId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Live district conditions are server-written and drive the visible city pulse. */
export const cityDistrictStates = mysqlTable("city_district_states", {
  id: int("id").autoincrement().primaryKey(),
  districtKey: varchar("districtKey", { length: 96 }).notNull().unique(),
  control: mysqlEnum("control", ["neutral", "enemy", "raider", "safe", "police"]).notNull().default("neutral"),
  pressure: int("pressure").notNull().default(1),
  supply: int("supply").notNull().default(50),
  alertLevel: int("alertLevel").notNull().default(0),
  phase: mysqlEnum("phase", ["quiet", "active", "volatile", "lockdown"]).notNull().default("quiet"),
  lastPulseAt: timestamp("lastPulseAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** NPC availability is a concrete routine state, not a client-side presentation guess. */
export const npcRoutineStates = mysqlTable("npc_routine_states", {
  id: int("id").autoincrement().primaryKey(),
  npcKey: varchar("npcKey", { length: 96 }).notNull().unique(),
  districtKey: varchar("districtKey", { length: 96 }).notNull(),
  availability: mysqlEnum("availability", ["available", "moving", "offline", "at_risk"]).notNull().default("available"),
  routinePhase: varchar("routinePhase", { length: 48 }).notNull().default("shift_start"),
  nextChangeAt: timestamp("nextChangeAt").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** One account can own one active home parcel; development state is persisted separately from custom assets. */
export const housingParcels = mysqlTable("housing_parcels", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull().unique(),
  districtKey: varchar("districtKey", { length: 96 }).notNull(),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  tier: int("tier").notNull().default(1),
  state: mysqlEnum("state", ["claimed", "active", "upgrading", "suspended"]).notNull().default("claimed"),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Story choices are append-safe state records and unlock only server-validated nodes. */
export const storyProgress = mysqlTable("story_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storyKey: varchar("storyKey", { length: 96 }).notNull(),
  nodeKey: varchar("nodeKey", { length: 96 }).notNull(),
  state: mysqlEnum("state", ["active", "completed", "branched", "locked"]).notNull().default("active"),
  choiceKey: varchar("choiceKey", { length: 96 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Tutorial checkpoints are driven by real completed actions and survive reconnects. */
export const tutorialProgress = mysqlTable("tutorial_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stepKey: varchar("stepKey", { length: 96 }).notNull(),
  state: mysqlEnum("state", ["active", "completed", "dismissed"]).notNull().default("active"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Premium products describe entitlements only; no product is purchasable until an adapter is connected. */
export const premiumProducts = mysqlTable("premium_products", {
  id: int("id").autoincrement().primaryKey(),
  productKey: varchar("productKey", { length: 96 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  entitlementKey: varchar("entitlementKey", { length: 96 }).notNull().unique(),
  priceMinor: int("priceMinor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).notNull().default("draft"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Provider state deliberately has no credentials; secrets are configured only through managed server settings. */
export const paymentProviders = mysqlTable("payment_providers", {
  id: int("id").autoincrement().primaryKey(),
  providerKey: varchar("providerKey", { length: 48 }).notNull().unique(),
  state: mysqlEnum("state", ["unconfigured", "connected", "disabled"]).notNull().default("unconfigured"),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** An entitlement exists only after a verified adapter result; no admin UI toggle grants it directly. */
export const premiumEntitlements = mysqlTable("premium_entitlements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  premiumProductId: int("premiumProductId").notNull(),
  providerKey: varchar("providerKey", { length: 48 }).notNull(),
  providerReceipt: varchar("providerReceipt", { length: 192 }).notNull().unique(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

/** Chat records are scoped to an actual district, gang or group and always retain the sender identity. */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  scope: mysqlEnum("scope", ["district", "gang", "group"]).notNull(),
  districtKey: varchar("districtKey", { length: 96 }),
  gangId: int("gangId"),
  groupId: int("groupId"),
  senderUserId: int("senderUserId").notNull(),
  body: varchar("body", { length: 480 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const playerGroups = mysqlTable("player_groups", {
  id: int("id").autoincrement().primaryKey(),
  leaderUserId: int("leaderUserId").notNull(),
  status: mysqlEnum("status", ["open", "in_dungeon", "closed"]).notNull().default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const groupMembers = mysqlTable("group_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["leader", "member"]).notNull().default("member"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const teamfinderListings = mysqlTable("teamfinder_listings", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  groupId: int("groupId"),
  dungeonKey: varchar("dungeonKey", { length: 96 }).notNull(),
  desiredRole: varchar("desiredRole", { length: 32 }).notNull().default("any"),
  status: mysqlEnum("status", ["open", "filled", "cancelled", "expired"]).notNull().default("open"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dungeonRuns = mysqlTable("dungeon_runs", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  dungeonKey: varchar("dungeonKey", { length: 96 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "failed"]).notNull().default("active"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

/** Rewards are written once per run participant; the service updates profile XP and inventory atomically around this record. */
export const dungeonRewards = mysqlTable("dungeon_rewards", {
  id: int("id").autoincrement().primaryKey(),
  dungeonRunId: int("dungeonRunId").notNull(),
  userId: int("userId").notNull(),
  xpAwarded: int("xpAwarded").notNull(),
  lootAwarded: int("lootAwarded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Current district presence authorizes local communication and world interactions after reconnects. */
export const cityPresence = mysqlTable("city_presence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  districtKey: varchar("districtKey", { length: 96 }).notNull(),
  enteredAt: timestamp("enteredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** NPC contact records are written after a valid district interaction and power later relationship logic. */
export const npcContacts = mysqlTable("npc_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  npcKey: varchar("npcKey", { length: 96 }).notNull(),
  firstContactAt: timestamp("firstContactAt").defaultNow().notNull(),
  lastContactAt: timestamp("lastContactAt").defaultNow().onUpdateNow().notNull(),
});

/** Statistics are server-authored counters derived from completed game events, never client-entered totals. */
export const playerStatistics = mysqlTable("player_statistics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enemiesDefeated: int("enemiesDefeated").notNull().default(0),
  questsCompleted: int("questsCompleted").notNull().default(0),
  dungeonRunsCompleted: int("dungeonRunsCompleted").notNull().default(0),
  messagesSent: int("messagesSent").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const achievementDefinitions = mysqlTable("achievement_definitions", {
  id: int("id").autoincrement().primaryKey(),
  achievementKey: varchar("achievementKey", { length: 96 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  description: varchar("description", { length: 300 }).notNull(),
  metric: mysqlEnum("metric", ["enemies_defeated", "quests_completed", "dungeon_runs_completed", "messages_sent"]).notNull(),
  threshold: int("threshold").notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).notNull().default("draft"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const playerAchievements = mysqlTable("player_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementDefinitionId: int("achievementDefinitionId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

/** One persisted control-plane row keeps external-server handoff separate from the deterministic core. */
export const simulationSettings = mysqlTable("simulation_settings", {
  id: int("id").autoincrement().primaryKey(),
  executionMode: mysqlEnum("executionMode", ["embedded", "external"]).notNull().default("embedded"),
  externalEndpoint: varchar("externalEndpoint", { length: 300 }),
  tickRateHz: int("tickRateHz").notNull().default(10),
  kappaScale: bigint("kappaScale", { mode: "number" }).notNull().default(1_000_000),
  lastAuthoritativeTick: bigint("lastAuthoritativeTick", { mode: "number" }).notNull().default(0),
  updatedByUserId: int("updatedByUserId"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Persistent agents keep only exact fixed-point scalars; their behavior is evaluated in the Kappa core. */
export const npcAgents = mysqlTable("npc_agents", {
  id: int("id").autoincrement().primaryKey(),
  npcKey: varchar("npcKey", { length: 96 }).notNull().unique(),
  districtKey: varchar("districtKey", { length: 96 }).notNull(),
  factionKey: varchar("factionKey", { length: 96 }),
  positionX: bigint("positionX", { mode: "number" }).notNull().default(0),
  positionZ: bigint("positionZ", { mode: "number" }).notNull().default(0),
  targetX: bigint("targetX", { mode: "number" }).notNull().default(0),
  targetZ: bigint("targetZ", { mode: "number" }).notNull().default(0),
  routeCursor: int("routeCursor").notNull().default(0),
  collisionCount: int("collisionCount").notNull().default(0),
  state: mysqlEnum("state", ["idle", "travel", "reroute", "flee", "socialize", "work", "eat"]).notNull().default("idle"),
  hungerKappa: bigint("hungerKappa", { mode: "number" }).notNull().default(1_000_000),
  wealthKappa: bigint("wealthKappa", { mode: "number" }).notNull().default(0),
  socialKappa: bigint("socialKappa", { mode: "number" }).notNull().default(500_000),
  safetyKappa: bigint("safetyKappa", { mode: "number" }).notNull().default(500_000),
  lastTick: bigint("lastTick", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** NPC factions own the political resources from which leadership and conflict decisions are derived. */
export const civilizationFactions = mysqlTable("civilization_factions", {
  id: int("id").autoincrement().primaryKey(),
  factionKey: varchar("factionKey", { length: 96 }).notNull().unique(),
  displayName: varchar("displayName", { length: 96 }).notNull(),
  kind: mysqlEnum("kind", ["npc_gang", "civilian", "police"]).notNull(),
  districtKey: varchar("districtKey", { length: 96 }).notNull(),
  leaderNpcKey: varchar("leaderNpcKey", { length: 96 }),
  treasury: bigint("treasury", { mode: "number" }).notNull().default(0),
  foodReserveKappa: bigint("foodReserveKappa", { mode: "number" }).notNull().default(500_000),
  cohesionKappa: bigint("cohesionKappa", { mode: "number" }).notNull().default(500_000),
  legitimacyKappa: bigint("legitimacyKappa", { mode: "number" }).notNull().default(500_000),
  posture: mysqlEnum("posture", ["peace", "war", "truce"]).notNull().default("peace"),
  lastTick: bigint("lastTick", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const factionRelations = mysqlTable("faction_relations", {
  id: int("id").autoincrement().primaryKey(),
  sourceFactionKey: varchar("sourceFactionKey", { length: 96 }).notNull(),
  targetFactionKey: varchar("targetFactionKey", { length: 96 }).notNull(),
  stance: mysqlEnum("stance", ["peace", "war", "truce"]).notNull().default("peace"),
  tensionKappa: bigint("tensionKappa", { mode: "number" }).notNull().default(0),
  trustKappa: bigint("trustKappa", { mode: "number" }).notNull().default(500_000),
  lastDecisionTick: bigint("lastDecisionTick", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const factionVotes = mysqlTable("faction_votes", {
  id: int("id").autoincrement().primaryKey(),
  factionKey: varchar("factionKey", { length: 96 }).notNull(),
  proposalKey: varchar("proposalKey", { length: 120 }).notNull().unique(),
  proposerNpcKey: varchar("proposerNpcKey", { length: 96 }).notNull(),
  topic: mysqlEnum("topic", ["war", "peace", "leadership"]).notNull(),
  yesWeightKappa: bigint("yesWeightKappa", { mode: "number" }).notNull().default(0),
  noWeightKappa: bigint("noWeightKappa", { mode: "number" }).notNull().default(0),
  startsTick: bigint("startsTick", { mode: "number" }).notNull(),
  resolvesTick: bigint("resolvesTick", { mode: "number" }).notNull(),
  state: mysqlEnum("state", ["open", "accepted", "rejected", "superseded"]).notNull().default("open"),
  resolvedAt: timestamp("resolvedAt"),
});

/** Bounties are real mission contracts. Funding is recorded separately and never stored as a client-trusted total. */
export const bountyMissions = mysqlTable("bounty_missions", {
  id: int("id").autoincrement().primaryKey(),
  objectiveKey: varchar("objectiveKey", { length: 96 }).notNull(),
  districtKey: varchar("districtKey", { length: 96 }).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  detail: varchar("detail", { length: 320 }).notNull(),
  state: mysqlEnum("state", ["open", "claimed", "resolved", "cancelled", "expired"]).notNull().default("open"),
  baseReward: bigint("baseReward", { mode: "number" }).notNull(),
  fundedReward: bigint("fundedReward", { mode: "number" }).notNull().default(0),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const bountyContributions = mysqlTable("bounty_contributions", {
  id: int("id").autoincrement().primaryKey(),
  bountyMissionId: int("bountyMissionId").notNull(),
  userId: int("userId").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bountyClaims = mysqlTable("bounty_claims", {
  id: int("id").autoincrement().primaryKey(),
  bountyMissionId: int("bountyMissionId").notNull(),
  userId: int("userId").notNull(),
  dungeonRunId: int("dungeonRunId").notNull(),
  rewardAwarded: bigint("rewardAwarded", { mode: "number" }).notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
});

/** Social rewards are immutable and unique per player so a browser cannot mint repeated share bonuses. */
export const socialShareRewards = mysqlTable("social_share_rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  rewardAmount: bigint("rewardAmount", { mode: "number" }).notNull(),
  channel: varchar("channel", { length: 32 }).notNull(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
});

export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type Gang = typeof gangs.$inferSelect;
export type Territory = typeof territories.$inferSelect;
export type ContentModule = typeof contentModules.$inferSelect;
export type CustomAsset = typeof customAssets.$inferSelect;
export type WeaponMastery = typeof weaponMasteries.$inferSelect;
export type AuctionListing = typeof auctionListings.$inferSelect;
