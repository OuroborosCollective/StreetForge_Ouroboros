CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scope` enum('district','gang','group') NOT NULL,
	`districtKey` varchar(96),
	`gangId` int,
	`groupId` int,
	`senderUserId` int NOT NULL,
	`body` varchar(480) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dungeon_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dungeonRunId` int NOT NULL,
	`userId` int NOT NULL,
	`xpAwarded` int NOT NULL,
	`lootAwarded` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dungeon_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dungeon_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`dungeonKey` varchar(96) NOT NULL,
	`status` enum('active','completed','failed') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `dungeon_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leaderUserId` int NOT NULL,
	`status` enum('open','in_dungeon','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamfinder_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`groupId` int,
	`dungeonKey` varchar(96) NOT NULL,
	`desiredRole` varchar(32) NOT NULL DEFAULT 'any',
	`status` enum('open','filled','cancelled','expired') NOT NULL DEFAULT 'open',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamfinder_listings_id` PRIMARY KEY(`id`)
);
