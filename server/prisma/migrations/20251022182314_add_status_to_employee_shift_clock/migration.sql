-- AlterTable
ALTER TABLE `employee` MODIFY `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `employee_shift_clock` ADD COLUMN `status` ENUM('pending', 'approved') NOT NULL DEFAULT 'pending';
