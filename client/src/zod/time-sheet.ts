import z from "zod";

export const timeSheetFormSchema = z.object({
    employee_id: z.string().min(1, "El empleado es obligatorio"),
    time: z.string().min(1, "La fecha y hora es obligatoria"),
    terminal_id: z.string().min(1, "El terminal es obligatorio"),
    status: z.enum(["approved", "pending"]).optional(),
});

export type TimeSheetFormValues = z.infer<typeof timeSheetFormSchema>;
