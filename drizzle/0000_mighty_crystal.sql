CREATE TABLE `content_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleKey` varchar(96) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`kind` enum('district','encounter','npc','quest','item','ability','drop_table') NOT NULL,
	`title` varchar(120) NOT NULL,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`payload` json NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`gangId` int,
	`territoryId` int,
	`kind` enum('character_model','territory_model') NOT NULL,
	`originalName` varchar(180) NOT NULL,
	`storageKey` varchar(300) NOT NULL,
	`storageUrl` text NOT NULL,
	`mimeType` varchar(96) NOT NULL,
	`byteSize` int NOT NULL,
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gang_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gangId` int NOT NULL,
	`userId` int NOT NULL,
	`rank` enum('owner','officer','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gang_memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gangs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`tag` varchar(6) NOT NULL,
	`ownerUserId` int NOT NULL,
	`reputation` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gangs_id` PRIMARY KEY(`id`),
	CONSTRAINT `gangs_name_unique` UNIQUE(`name`),
	CONSTRAINT `gangs_tag_unique` UNIQUE(`tag`)
);
--> statement-breakpoint
CREATE TABLE `llm_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`modelId` varchar(120),
	`purpose` varchar(160) NOT NULL,
	`maxOutputTokens` int NOT NULL DEFAULT 800,
	`humanReviewRequired` boolean NOT NULL DEFAULT true,
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `llm_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `llm_policies_policyKey_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `player_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemModuleId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`equippedSlot` varchar(24),
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`callsign` varchar(48) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`totalXp` bigint NOT NULL DEFAULT 0,
	`skillPoints` int NOT NULL DEFAULT 0,
	`personalForgeUnlocked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `player_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`abilityModuleId` int NOT NULL,
	`rank` int NOT NULL DEFAULT 1,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quest_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questModuleId` int NOT NULL,
	`state` enum('available','active','completed','failed') NOT NULL DEFAULT 'available',
	`currentStep` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quest_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `territories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gangId` int NOT NULL,
	`districtKey` varchar(64) NOT NULL,
	`districtX` int NOT NULL,
	`districtZ` int NOT NULL,
	`worldSeed` int NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`state` enum('active','contested','abandoned') NOT NULL DEFAULT 'active',
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `territories_id` PRIMARY KEY(`id`),
	CONSTRAINT `territories_gangId_unique` UNIQUE(`gangId`),
	CONSTRAINT `territories_districtKey_unique` UNIQUE(`districtKey`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
