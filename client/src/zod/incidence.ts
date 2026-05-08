import z from "zod";

export const incidenceFormSchema = z.object({
  category_id: z.string().min(1, "La categoría es obligatoria"),
  description: z.string().optional(),
  all_day: z.boolean(),
  is_global: z.boolean(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration_hours: z.string().optional(),
  paid: z.boolean(),
  employee_ids: z.array(z.string()).optional(),
  profile_ids: z.array(z.string()).optional(),
}).refine((data) => {
  if (!data.all_day) {
    return data.start_time && (data.end_time || data.duration_hours);
  }
  return true;
}, {
  message: "Las horas de inicio y fin son obligatorias cuando no es todo el día",
  path: ["start_time"],
}).refine((data) => {
  if (!data.all_day) {
    return data.start_time && (data.end_time || data.duration_hours);
  }
  return true;
}, {
  message: "Las horas de inicio y fin son obligatorias cuando no es todo el día",
  path: ["end_time"],
}).refine((data) => {
  if (!data.is_global) {
    return (data.employee_ids && data.employee_ids.length > 0) || (data.profile_ids && data.profile_ids.length > 0);
  }
  return true;
}, {
  message: "Debe seleccionar al menos un empleado o categoría cuando no es global",
  path: ["is_global"],
});

export type IncidenceFormValues = z.infer<typeof incidenceFormSchema>;
