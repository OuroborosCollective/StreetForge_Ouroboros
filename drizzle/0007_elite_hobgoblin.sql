CREATE TABLE `character_equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`characterId` int NOT NULL,
	`playerItemId` int NOT NULL,
	`slot` enum('weapon','head','torso','gloves','legs','shoes','cape','shoulder','offhand') NOT NULL,
	`equippedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `character_equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_money_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`recipientUserId` int NOT NULL,
	`amount` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_money_transfers_id` PRIMARY KEY(`id`)
);
