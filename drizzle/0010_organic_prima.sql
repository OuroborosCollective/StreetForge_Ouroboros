CREATE TABLE `social_share_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rewardAmount` bigint NOT NULL,
	`channel` varchar(32) NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_share_rewards_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_share_rewards_userId_unique` UNIQUE(`userId`)
);
