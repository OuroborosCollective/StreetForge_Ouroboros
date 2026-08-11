CREATE TABLE `characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`callsign` varchar(32) NOT NULL,
	`archetype` enum('runner','enforcer','scout','fixer') NOT NULL,
	`presentation` enum('street','industrial','night_ops') NOT NULL DEFAULT 'street',
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastPlayedAt` timestamp,
	CONSTRAINT `characters_id` PRIMARY KEY(`id`)
);
