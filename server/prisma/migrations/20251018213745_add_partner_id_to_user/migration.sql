/*
  Warnings:

  - Added the required column `partner_id` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `partner_id` VARCHAR(191) NOT NULL;
