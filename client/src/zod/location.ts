import z from "zod";

export const locationFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    status: z.enum(["active", "inactive"], {
        error: "El estado es obligatorio",
    }),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;