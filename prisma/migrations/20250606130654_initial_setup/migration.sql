/*
  Warnings:

  - The values [paid] on the enum `payments_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `payments` MODIFY `status` ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending';
