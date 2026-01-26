import z from "zod";

export const terminalFormSchema = z.object({
    external_id: z.string().min(1, "El ID externo es obligatorio"),
    name: z.string().min(1, "El nombre es obligatorio"),
});

export type TerminalFormValues = z.infer<typeof terminalFormSchema>;
