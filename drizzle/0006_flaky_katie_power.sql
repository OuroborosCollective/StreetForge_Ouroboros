CREATE TABLE `achievement_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`achievementKey` varchar(96) NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` varchar(300) NOT NULL,
	`metric` enum('enemies_defeated','quests_completed','dungeon_runs_completed','messages_sent') NOT NULL,
	`threshold` int NOT NULL,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievement_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievement_definitions_achievementKey_unique` UNIQUE(`achievementKey`)
);
--> statement-breakpoint
CREATE TABLE `player_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementDefinitionId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_statistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enemiesDefeated` int NOT NULL DEFAULT 0,
	`questsCompleted` int NOT NULL DEFAULT 0,
	`dungeonRunsCompleted` int NOT NULL DEFAULT 0,
	`messagesSent` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_statistics_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_statistics_userId_unique` UNIQUE(`userId`)
);
