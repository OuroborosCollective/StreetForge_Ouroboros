CREATE TABLE `city_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`districtKey` varchar(96) NOT NULL,
	`enteredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `city_presence_id` PRIMARY KEY(`id`),
	CONSTRAINT `city_presence_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `npc_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`npcKey` varchar(96) NOT NULL,
	`firstContactAt` timestamp NOT NULL DEFAULT (now()),
	`lastContactAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npc_contacts_id` PRIMARY KEY(`id`)
);
