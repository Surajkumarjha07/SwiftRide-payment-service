-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `rideId` VARCHAR(191) NOT NULL,
    `captainId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `total_amount` INTEGER NOT NULL,
    `captain_commission` INTEGER NOT NULL,
    `platform_commission` INTEGER NOT NULL,
    `status` ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',

    UNIQUE INDEX `payments_paymentId_key`(`paymentId`),
    UNIQUE INDEX `payments_orderId_key`(`orderId`),
    UNIQUE INDEX `payments_rideId_key`(`rideId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
