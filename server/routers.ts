import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { confirmationPhrase, getGitHubImportStatus, importStreetForgeProject } from "./github/projectSync";
import { starterWorld, starterWeapons, masteryTrees, weaponCategories } from "./openworld/catalog";
import { buyoutAuction, createAuctionListing, listOpenAuctions, placeAuctionBid } from "./openworld/auctionService";
import { playerOverview, recordWeaponUse } from "./openworld/profileService";
import { claimGangTerritory, createGang, joinGang, listGangs } from "./openworld/gangService";
import { ensureStarterInventory } from "./openworld/contentService";
import { listCustomAssets, uploadCustomAsset } from "./openworld/assetService";
import { adminOverview, listLiveModelsForAdmin, reviewCustomAsset, saveLlmPolicy, setContentStatus } from "./openworld/adminService";
import { characterArchetypes, characterPresentations, createAccountCharacter, enterWithCharacter, getActiveCharacter, listAccountCharacters } from "./openworld/characterService";
import { acceptQuest, contactNpc, enterDistrict } from "./openworld/worldInteractionService";
import { getCityOverview, getWorldMap } from "./openworld/cityService";
import { advanceCivilizationTicks, configureSimulationControl, getCivilizationSnapshot, getSimulationControl } from "./openworld/civilizationService";
import { chooseStoryBranch, claimHousing, completeTutorialAction, ensureCityProgress } from "./openworld/storyHousingService";
import { completeDungeonRun, createGroup, createTeamfinderListing, getMyGroup, joinTeamfinderListing, listChatMessages, listCompletedDungeonRuns, listTeamfinder, sendChatMessage, startDungeonRun, transferGroupMoney } from "./openworld/socialService";
import { getPlayerStats, listPlayerAchievements, listPremiumConfiguration, saveAchievementDefinition, savePaymentProvider, savePremiumProduct } from "./openworld/achievementPremiumService";
import { claimBounty, fundBounty, listBounties } from "./openworld/bountyService";
import { equipItem, equipmentSlots, getEquipment } from "./openworld/equipmentService";
import { claimSocialShareReward } from "./openworld/socialShareService";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  githubImport: router({
    status: publicProcedure.query(() => getGitHubImportStatus()),
    stage: adminProcedure
      .input(z.object({ confirmation: z.literal(confirmationPhrase) }))
      .mutation(({ input }) => importStreetForgeProject(input)),
  }),
  world: router({
    catalog: publicProcedure.query(() => ({ world: starterWorld, weapons: starterWeapons, masteryTrees, weaponCategories })),
    city: publicProcedure.query(() => getCityOverview()),
    map: protectedProcedure.query(({ ctx }) => getWorldMap(ctx.user.id)),
    civilization: protectedProcedure.query(() => getCivilizationSnapshot()),
    profile: protectedProcedure.query(({ ctx }) => playerOverview(ctx.user.id, ctx.user.name)),
    inventory: protectedProcedure.query(({ ctx }) => ensureStarterInventory(ctx.user.id)),
    claimShareReward: protectedProcedure.input(z.object({ channel: z.string().min(1).max(32) })).mutation(({ ctx, input }) => claimSocialShareReward(ctx.user.id, input.channel)),
    equipment: protectedProcedure.input(z.object({ characterId: z.number().int().positive() })).query(({ ctx, input }) => getEquipment(ctx.user.id, input.characterId)),
    equip: protectedProcedure.input(z.object({ characterId: z.number().int().positive(), playerItemId: z.number().int().positive(), slot: z.enum(equipmentSlots) })).mutation(({ ctx, input }) => equipItem(ctx.user.id, input.characterId, input.playerItemId, input.slot)),
    weaponUse: protectedProcedure.input(z.object({ equippedCategory: z.enum(weaponCategories), actionCategory: z.enum(weaponCategories), masteryXp: z.number().int().min(0).max(500), playerXp: z.number().int().min(0).max(2_000) })).mutation(({ ctx, input }) => recordWeaponUse(ctx.user.id, input)),
    enterDistrict: protectedProcedure.input(z.object({ districtKey: z.string().min(3).max(120) })).mutation(({ ctx, input }) => enterDistrict(ctx.user.id, input.districtKey)),
    acceptQuest: protectedProcedure.input(z.object({ questKey: z.string().min(3).max(120) })).mutation(({ ctx, input }) => acceptQuest(ctx.user.id, input.questKey)),
    contactNpc: protectedProcedure.input(z.object({ npcKey: z.string().min(3).max(120) })).mutation(({ ctx, input }) => contactNpc(ctx.user.id, input.npcKey)),
    cityProgress: protectedProcedure.query(({ ctx }) => ensureCityProgress(ctx.user.id)),
    chooseStory: protectedProcedure.input(z.object({ choiceKey: z.string().min(3).max(96) })).mutation(({ ctx, input }) => chooseStoryBranch(ctx.user.id, input.choiceKey)),
    claimHousing: protectedProcedure.input(z.object({ districtKey: z.string().min(3).max(96), displayName: z.string().min(3).max(80) })).mutation(({ ctx, input }) => claimHousing(ctx.user.id, input.districtKey, input.displayName)),
    completeTutorialAction: protectedProcedure.input(z.object({ action: z.enum(["enter_district", "accept_quest", "contact_npc"]) })).mutation(({ ctx, input }) => completeTutorialAction(ctx.user.id, input.action)),
  }),
  auction: router({
    open: publicProcedure.query(() => listOpenAuctions()),
    create: protectedProcedure.input(z.object({ playerItemId: z.number().int().positive(), quantity: z.number().int().positive(), startingPrice: z.number().int().positive(), buyoutPrice: z.number().int().positive().nullable().optional(), durationHours: z.number().int().min(1).max(168) })).mutation(({ ctx, input }) => createAuctionListing(ctx.user.id, input)),
    bid: protectedProcedure.input(z.object({ listingId: z.number().int().positive(), amount: z.number().int().positive() })).mutation(({ ctx, input }) => placeAuctionBid(ctx.user.id, input)),
    buyout: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).mutation(({ ctx, input }) => buyoutAuction(ctx.user.id, input.listingId)),
  }),
  bounty: router({
    list: publicProcedure.query(({ ctx }) => listBounties(ctx.user?.id)),
    fund: protectedProcedure.input(z.object({ bountyMissionId: z.number().int().positive(), amount: z.number().int().positive().max(1_000_000) })).mutation(({ ctx, input }) => fundBounty(ctx.user.id, input.bountyMissionId, input.amount)),
    claim: protectedProcedure.input(z.object({ bountyMissionId: z.number().int().positive(), dungeonRunId: z.number().int().positive() })).mutation(({ ctx, input }) => claimBounty(ctx.user.id, input)),
  }),
  gang: router({
    list: publicProcedure.query(() => listGangs()),
    create: protectedProcedure.input(z.object({ name: z.string().min(3).max(64), tag: z.string().min(2).max(6) })).mutation(({ ctx, input }) => createGang(ctx.user.id, input)),
    join: protectedProcedure.input(z.object({ gangId: z.number().int().positive() })).mutation(({ ctx, input }) => joinGang(ctx.user.id, input.gangId)),
    claimTerritory: protectedProcedure.input(z.object({ worldSeed: z.number().int(), districtX: z.number().int(), districtZ: z.number().int(), displayName: z.string().min(3).max(80) })).mutation(({ ctx, input }) => claimGangTerritory(ctx.user.id, input)),
  }),
  assets: router({
    mine: protectedProcedure.query(({ ctx }) => listCustomAssets(ctx.user.id)),
    upload: protectedProcedure.input(z.object({ kind: z.enum(["character_model", "territory_model"]), originalName: z.string().min(1).max(180), mimeType: z.string().min(1).max(96), dataBase64: z.string().min(4).max(7_000_000) })).mutation(({ ctx, input }) => uploadCustomAsset(ctx.user.id, input)),
  }),
  characters: router({
    mine: protectedProcedure.query(({ ctx }) => listAccountCharacters(ctx.user.id)),
    active: protectedProcedure.query(({ ctx }) => getActiveCharacter(ctx.user.id)),
    create: protectedProcedure.input(z.object({ callsign: z.string().min(3).max(32), archetype: z.enum(characterArchetypes), presentation: z.enum(characterPresentations) })).mutation(({ ctx, input }) => createAccountCharacter(ctx.user.id, input)),
    enter: protectedProcedure.input(z.object({ characterId: z.number().int().positive() })).mutation(({ ctx, input }) => enterWithCharacter(ctx.user.id, input.characterId, ctx.user.name)),
  }),
  social: router({
    group: protectedProcedure.query(({ ctx }) => getMyGroup(ctx.user.id)),
    createGroup: protectedProcedure.mutation(({ ctx }) => createGroup(ctx.user.id)),
    transferMoney: protectedProcedure.input(z.object({ recipientUserId: z.number().int().positive(), amount: z.number().int().positive().max(1_000_000) })).mutation(({ ctx, input }) => transferGroupMoney(ctx.user.id, input.recipientUserId, input.amount)),
    teamfinder: publicProcedure.query(() => listTeamfinder()),
    createTeamfinder: protectedProcedure.input(z.object({ dungeonKey: z.string().min(3).max(96), desiredRole: z.string().min(2).max(32) })).mutation(({ ctx, input }) => createTeamfinderListing(ctx.user.id, input.dungeonKey, input.desiredRole)),
    joinTeamfinder: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).mutation(({ ctx, input }) => joinTeamfinderListing(ctx.user.id, input.listingId)),
    chat: protectedProcedure.input(z.object({ scope: z.enum(["district", "gang", "group"]), contextKey: z.string().min(1).max(96) })).query(({ ctx, input }) => listChatMessages(ctx.user.id, input.scope, input.contextKey)),
    sendChat: protectedProcedure.input(z.object({ scope: z.enum(["district", "gang", "group"]), contextKey: z.string().min(1).max(96), body: z.string().min(1).max(480) })).mutation(({ ctx, input }) => sendChatMessage(ctx.user.id, input.scope, input.contextKey, input.body)),
    startDungeon: protectedProcedure.input(z.object({ dungeonKey: z.string().min(3).max(96) })).mutation(({ ctx, input }) => startDungeonRun(ctx.user.id, input.dungeonKey)),
    completeDungeon: protectedProcedure.input(z.object({ runId: z.number().int().positive(), totalXp: z.number().int().positive().max(100_000), totalLoot: z.number().int().min(0).max(100_000) })).mutation(({ ctx, input }) => completeDungeonRun(ctx.user.id, input.runId, input.totalXp, input.totalLoot)),
    completedDungeons: protectedProcedure.query(({ ctx }) => listCompletedDungeonRuns(ctx.user.id)),
  }),
  progress: router({
    stats: protectedProcedure.query(({ ctx }) => getPlayerStats(ctx.user.id)),
    achievements: protectedProcedure.query(({ ctx }) => listPlayerAchievements(ctx.user.id)),
  }),
  admin: router({
    overview: adminProcedure.query(() => adminOverview()),
    models: adminProcedure.query(() => listLiveModelsForAdmin()),
    setContentStatus: adminProcedure.input(z.object({ moduleId: z.number().int().positive(), status: z.enum(["draft", "active", "archived"]) })).mutation(({ ctx, input }) => setContentStatus(ctx.user.id, input)),
    reviewAsset: adminProcedure.input(z.object({ assetId: z.number().int().positive(), reviewStatus: z.enum(["approved", "rejected"]) })).mutation(({ ctx, input }) => reviewCustomAsset(ctx.user.id, input)),
    saveLlmPolicy: adminProcedure.input(z.object({ policyKey: z.string().regex(/^[a-z0-9._-]{3,64}$/), enabled: z.boolean(), modelId: z.string().max(120).nullable().optional(), purpose: z.string().min(3).max(160), maxOutputTokens: z.number().int().min(64).max(4096), humanReviewRequired: z.boolean() })).mutation(({ ctx, input }) => saveLlmPolicy(ctx.user.id, input)),
    premiumConfiguration: adminProcedure.query(() => listPremiumConfiguration()),
    savePremiumProduct: adminProcedure.input(z.object({ productKey: z.string().regex(/^[a-z0-9._-]{3,96}$/), entitlementKey: z.string().regex(/^[a-z0-9._-]{3,96}$/), title: z.string().min(3).max(120), priceMinor: z.number().int().min(0).max(10_000_000), currency: z.string().length(3), status: z.enum(["draft", "active", "archived"]) })).mutation(({ ctx, input }) => savePremiumProduct(ctx.user.id, input)),
    savePaymentProvider: adminProcedure.input(z.object({ providerKey: z.string().regex(/^[a-z0-9._-]{3,48}$/), displayName: z.string().min(3).max(80), state: z.enum(["unconfigured", "disabled"]) })).mutation(({ ctx, input }) => savePaymentProvider(ctx.user.id, input)),
    saveAchievement: adminProcedure.input(z.object({ achievementKey: z.string().regex(/^[a-z0-9._-]{3,96}$/), title: z.string().min(3).max(120), description: z.string().min(3).max(300), metric: z.enum(["enemies_defeated", "quests_completed", "dungeon_runs_completed", "messages_sent"]), threshold: z.number().int().positive().max(1_000_000), status: z.enum(["draft", "active", "archived"]) })).mutation(({ ctx, input }) => saveAchievementDefinition(ctx.user.id, input)),
    simulationControl: adminProcedure.query(() => getSimulationControl()),
    configureSimulation: adminProcedure.input(z.object({ executionMode: z.enum(["embedded", "external"]), externalEndpoint: z.string().url().max(300).nullable().optional() })).mutation(({ ctx, input }) => configureSimulationControl(ctx.user.id, input)),
    advanceCivilization: adminProcedure.input(z.object({ ticks: z.number().int().min(1).max(600) })).mutation(({ input }) => advanceCivilizationTicks(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
