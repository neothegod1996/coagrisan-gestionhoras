import { TurnoverTypeEnum } from "../types/employee-turnover";
import z from "zod";

export const turnoverFormSchema = z.object({
  type: z.nativeEnum(TurnoverTypeEnum, {
    error: "El tipo de registro es obligatorio",
  }),
  date: z.string().min(1, "La fecha es obligatoria"),
  employee_id: z.string().min(1, "El empleado es obligatorio"),
});

export type TurnoverFormValues = z.infer<typeof turnoverFormSchema>;
