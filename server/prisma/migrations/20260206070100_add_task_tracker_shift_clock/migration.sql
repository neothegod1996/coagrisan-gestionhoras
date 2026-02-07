-- CreateTable
CREATE TABLE `task_tracker_shift_clock` (
    `id` VARCHAR(191) NOT NULL,
    `task_tracker_id` VARCHAR(191) NOT NULL,
    `employee_shift_clock_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_tracker_shift_clock_task_tracker_id_idx`(`task_tracker_id`),
    INDEX `task_tracker_shift_clock_employee_shift_clock_id_idx`(`employee_shift_clock_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `task_tracker_shift_clock` ADD CONSTRAINT `task_tracker_shift_clock_task_tracker_id_fkey` FOREIGN KEY (`task_tracker_id`) REFERENCES `task_tracker`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_tracker_shift_clock` ADD CONSTRAINT `task_tracker_shift_clock_employee_shift_clock_id_fkey` FOREIGN KEY (`employee_shift_clock_id`) REFERENCES `employee_shift_clock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
