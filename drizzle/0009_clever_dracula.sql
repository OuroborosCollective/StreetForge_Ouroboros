CREATE TABLE `bounty_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bountyMissionId` int NOT NULL,
	`userId` int NOT NULL,
	`dungeonRunId` int NOT NULL,
	`rewardAwarded` bigint NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bounty_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bounty_contributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bountyMissionId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bounty_contributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bounty_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`objectiveKey` varchar(96) NOT NULL,
	`districtKey` varchar(96) NOT NULL,
	`title` varchar(120) NOT NULL,
	`detail` varchar(320) NOT NULL,
	`state` enum('open','claimed','resolved','cancelled','expired') NOT NULL DEFAULT 'open',
	`baseReward` bigint NOT NULL,
	`fundedReward` bigint NOT NULL DEFAULT 0,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `bounty_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `civilization_factions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`factionKey` varchar(96) NOT NULL,
	`displayName` varchar(96) NOT NULL,
	`kind` enum('npc_gang','civilian','police') NOT NULL,
	`districtKey` varchar(96) NOT NULL,
	`leaderNpcKey` varchar(96),
	`treasury` bigint NOT NULL DEFAULT 0,
	`foodReserveKappa` bigint NOT NULL DEFAULT 500000,
	`cohesionKappa` bigint NOT NULL DEFAULT 500000,
	`legitimacyKappa` bigint NOT NULL DEFAULT 500000,
	`posture` enum('peace','war','truce') NOT NULL DEFAULT 'peace',
	`lastTick` bigint NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `civilization_factions_id` PRIMARY KEY(`id`),
	CONSTRAINT `civilization_factions_factionKey_unique` UNIQUE(`factionKey`)
);
--> statement-breakpoint
CREATE TABLE `faction_relations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceFactionKey` varchar(96) NOT NULL,
	`targetFactionKey` varchar(96) NOT NULL,
	`stance` enum('peace','war','truce') NOT NULL DEFAULT 'peace',
	`tensionKappa` bigint NOT NULL DEFAULT 0,
	`trustKappa` bigint NOT NULL DEFAULT 500000,
	`lastDecisionTick` bigint NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faction_relations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faction_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`factionKey` varchar(96) NOT NULL,
	`proposalKey` varchar(120) NOT NULL,
	`proposerNpcKey` varchar(96) NOT NULL,
	`topic` enum('war','peace','leadership') NOT NULL,
	`yesWeightKappa` bigint NOT NULL DEFAULT 0,
	`noWeightKappa` bigint NOT NULL DEFAULT 0,
	`startsTick` bigint NOT NULL,
	`resolvesTick` bigint NOT NULL,
	`state` enum('open','accepted','rejected','superseded') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	CONSTRAINT `faction_votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `faction_votes_proposalKey_unique` UNIQUE(`proposalKey`)
);
--> statement-breakpoint
CREATE TABLE `npc_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`npcKey` varchar(96) NOT NULL,
	`districtKey` varchar(96) NOT NULL,
	`factionKey` varchar(96),
	`positionX` bigint NOT NULL DEFAULT 0,
	`positionZ` bigint NOT NULL DEFAULT 0,
	`targetX` bigint NOT NULL DEFAULT 0,
	`targetZ` bigint NOT NULL DEFAULT 0,
	`routeCursor` int NOT NULL DEFAULT 0,
	`collisionCount` int NOT NULL DEFAULT 0,
	`state` enum('idle','travel','reroute','flee','socialize','work','eat') NOT NULL DEFAULT 'idle',
	`hungerKappa` bigint NOT NULL DEFAULT 1000000,
	`wealthKappa` bigint NOT NULL DEFAULT 0,
	`socialKappa` bigint NOT NULL DEFAULT 500000,
	`safetyKappa` bigint NOT NULL DEFAULT 500000,
	`lastTick` bigint NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npc_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `npc_agents_npcKey_unique` UNIQUE(`npcKey`)
);
--> statement-breakpoint
CREATE TABLE `simulation_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionMode` enum('embedded','external') NOT NULL DEFAULT 'embedded',
	`externalEndpoint` varchar(300),
	`tickRateHz` int NOT NULL DEFAULT 10,
	`kappaScale` bigint NOT NULL DEFAULT 1000000,
	`lastAuthoritativeTick` bigint NOT NULL DEFAULT 0,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulation_settings_id` PRIMARY KEY(`id`)
);
