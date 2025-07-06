/*
  Warnings:

  - You are about to drop the column `amount` on the `payments` table. All the data in the column will be lost.
  - Added the required column `captain_commission` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_commission` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payments` DROP COLUMN `amount`,
    ADD COLUMN `captain_commission` INTEGER NOT NULL,
    ADD COLUMN `platform_commission` INTEGER NOT NULL,
    ADD COLUMN `total_amount` INTEGER NOT NULL;
