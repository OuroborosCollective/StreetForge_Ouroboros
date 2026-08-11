CREATE TABLE `city_district_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`districtKey` varchar(96) NOT NULL,
	`pressure` int NOT NULL DEFAULT 1,
	`supply` int NOT NULL DEFAULT 50,
	`alertLevel` int NOT NULL DEFAULT 0,
	`phase` enum('quiet','active','volatile','lockdown') NOT NULL DEFAULT 'quiet',
	`lastPulseAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `city_district_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `city_district_states_districtKey_unique` UNIQUE(`districtKey`)
);
--> statement-breakpoint
CREATE TABLE `housing_parcels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`districtKey` varchar(96) NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`tier` int NOT NULL DEFAULT 1,
	`state` enum('claimed','active','upgrading','suspended') NOT NULL DEFAULT 'claimed',
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `housing_parcels_id` PRIMARY KEY(`id`),
	CONSTRAINT `housing_parcels_ownerUserId_unique` UNIQUE(`ownerUserId`)
);
--> statement-breakpoint
CREATE TABLE `npc_routine_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`npcKey` varchar(96) NOT NULL,
	`districtKey` varchar(96) NOT NULL,
	`availability` enum('available','moving','offline','at_risk') NOT NULL DEFAULT 'available',
	`routinePhase` varchar(48) NOT NULL DEFAULT 'shift_start',
	`nextChangeAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npc_routine_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `npc_routine_states_npcKey_unique` UNIQUE(`npcKey`)
);
--> statement-breakpoint
CREATE TABLE `payment_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerKey` varchar(48) NOT NULL,
	`state` enum('unconfigured','connected','disabled') NOT NULL DEFAULT 'unconfigured',
	`displayName` varchar(80) NOT NULL,
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_providers_providerKey_unique` UNIQUE(`providerKey`)
);
--> statement-breakpoint
CREATE TABLE `premium_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`premiumProductId` int NOT NULL,
	`providerKey` varchar(48) NOT NULL,
	`providerReceipt` varchar(192) NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `premium_entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `premium_entitlements_providerReceipt_unique` UNIQUE(`providerReceipt`)
);
--> statement-breakpoint
CREATE TABLE `premium_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productKey` varchar(96) NOT NULL,
	`title` varchar(120) NOT NULL,
	`entitlementKey` varchar(96) NOT NULL,
	`priceMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premium_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `premium_products_productKey_unique` UNIQUE(`productKey`),
	CONSTRAINT `premium_products_entitlementKey_unique` UNIQUE(`entitlementKey`)
);
--> statement-breakpoint
CREATE TABLE `story_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyKey` varchar(96) NOT NULL,
	`nodeKey` varchar(96) NOT NULL,
	`state` enum('active','completed','branched','locked') NOT NULL DEFAULT 'active',
	`choiceKey` varchar(96),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stepKey` varchar(96) NOT NULL,
	`state` enum('active','completed','dismissed') NOT NULL DEFAULT 'active',
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutorial_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `tutorial_progress_userId_unique` UNIQUE(`userId`)
);
