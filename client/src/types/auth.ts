import { Response } from ".";

export interface Auth {
    id: string;
    wp_id: number;
    wp_name: string;
    wp_email: string;
    role: AuthRoleEnum;
    status: AuthStatusEnum;
    partner_id: string;
}

export enum AuthRoleEnum {
    Admin = 'admin',
    Manager = 'manager',
    Employee = 'employee',
}

export enum AuthStatusEnum {
    Active = 'active',
    Inactive = 'inactive'
}

export type ProfileResponse = Response<Auth>;
export type ValidateResponse = Response<Auth>;