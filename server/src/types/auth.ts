import { role } from "@prisma/client";

export type WpPayload = {
    id: number;
    email: string;
    name: string;
    role: role;
    partner_id?: string;
}