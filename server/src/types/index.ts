import { role } from "@prisma/client";
import { Request } from "express";

export type User = {
    id: string;
    wp_id: number;
    wp_name: string;
    wp_email: string;
    role: role;
    partner_id?: string;
    employee?: {
        id: string;
    };
};


export type RequestWithUser = Request & {
    user: User;
};