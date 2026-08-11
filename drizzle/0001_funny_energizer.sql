CREATE TABLE `auction_bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`bidderUserId` int NOT NULL,
	`amount` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auction_bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auction_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerUserId` int NOT NULL,
	`playerItemId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`startingPrice` bigint NOT NULL,
	`buyoutPrice` bigint,
	`highestBid` bigint NOT NULL DEFAULT 0,
	`highestBidderUserId` int,
	`status` enum('open','sold','cancelled','expired') NOT NULL DEFAULT 'open',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `auction_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weapon_masteries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weaponCategory` enum('melee','sidearm','smg','shotgun','rifle','marksman','heavy','thrown') NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`totalXp` bigint NOT NULL DEFAULT 0,
	`skillPoints` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weapon_masteries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weapon_mastery_unlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weaponCategory` enum('melee','sidearm','smg','shotgun','rifle','marksman','heavy','thrown') NOT NULL,
	`nodeKey` varchar(72) NOT NULL,
	`rank` int NOT NULL DEFAULT 1,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weapon_mastery_unlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `streetCred` bigint DEFAULT 500 NOT NULL;