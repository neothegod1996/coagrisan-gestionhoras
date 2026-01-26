import z from "zod";

export const profileFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    status: z.enum(["active", "inactive"], {
        error: "El estado es obligatorio",
    }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
