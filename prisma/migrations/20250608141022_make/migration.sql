/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `payments` ADD COLUMN `orderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payments_orderId_key` ON `payments`(`orderId`);
