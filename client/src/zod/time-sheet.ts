import z from "zod";

export const timeSheetFormSchema = z.object({
    task_tracker_id: z.string().min(1, "El ID del seguimiento de tareas es obligatorio"),
    employee_id: z.string().min(1, "El empleado es obligatorio"),
    time: z.string().min(1, "La fecha y hora es obligatoria"),
    terminal_id: z.string().min(1, "El terminal es obligatorio"),
    status: z.enum(["approved", "pending"]).optional(),
});

export type TimeSheetFormValues = z.infer<typeof timeSheetFormSchema>;
