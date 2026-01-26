import { DaysEnum, ShiftTypeEnum } from "@/types/schedule";
import z from "zod";

export const scheduleSessionSchema = z.object({
  id: z.string().optional(),
  start_time: z.string().min(1, "La hora de inicio es obligatoria"),
  end_time: z.string().min(1, "La hora de fin es obligatoria"),
  shift_type: z.nativeEnum(ShiftTypeEnum, {
    error: () => ({ message: "Tipo de turno inválido" })
  }),
  has_break: z.boolean(),
  break_start_time: z.string().optional(),
  break_end_time: z.string().optional(),
});

export const scheduleFormSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  sessions: z.array(scheduleSessionSchema)
    .min(1, "Debe tener al menos una sesión")
    .max(3, "No puede tener más de 3 sesiones por día"),
  days: z.array(z.nativeEnum(DaysEnum, {
    error: () => ({ message: "Día inválido" })
  }))
    .min(1, "Debe seleccionar al menos un día")
    .max(7, "No puede seleccionar más de 7 días")
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
export type ScheduleSessionValues = z.infer<typeof scheduleSessionSchema>;