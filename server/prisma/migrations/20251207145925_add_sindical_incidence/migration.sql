-- AlterTable
ALTER TABLE `incidence` MODIFY `type` ENUM('holiday', 'festive', 'absence', 'medical_leave', 'personal_leave', 'sindical_leave', 'other') NOT NULL;
