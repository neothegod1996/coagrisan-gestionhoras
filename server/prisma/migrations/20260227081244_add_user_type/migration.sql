-- AlterTable
ALTER TABLE `employee` ADD COLUMN `device_pin` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `user_type` ENUM('user', 'farm') NOT NULL DEFAULT 'user';
