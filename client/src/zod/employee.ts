import z from "zod";

export const employeeFormSchema = z.object({
    card_id: z.string().min(1, "El número de tarjeta es obligatorio"),
    first_name: z.string().min(1, "El nombre es obligatorio"),
    last_name: z.string().min(1, "Los apellidos son obligatorios"),
    dni: z.string().min(9, "El NIF/DNI debe tener al menos 9 caracteres"),
    birth_date: z.date(),
    address: z.string().min(1, "La dirección es obligatoria"),
    postal_code: z.string().min(5, "El código postal debe tener al menos 5 caracteres"),
    province: z.string().min(1, "La provincia es obligatoria"),
    population: z.string().min(1, "La población es obligatoria"),
    phone_number: z.string().optional(),
    mobile_number: z.string().min(1, "El móvil es obligatorio"),
    email: z.string().email("Debe ser un email válido"),
    alias: z.string().optional(),
    profile_id: z.string().min(1, "El perfil es obligatorio"),
    schedule_id: z.string().min(1, "El horario es obligatorio"),
    location_id: z.string().min(1, "La ubicación es obligatoria"),
    device_pin: z.string().optional(),
    is_responsible: z.boolean().optional(),
});