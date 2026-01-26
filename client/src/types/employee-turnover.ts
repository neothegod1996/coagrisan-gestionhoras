import { PaginationResponse, Params, Response } from ".";

export interface EmployeeTurnover {
    id: string;
    date: string;
    type: TurnoverTypeEnum;
    employee_id: string;
    employee: {
        first_name: string;
        last_name: string;
    };
}

export interface FullEmployeeTurnover {
    id: string;
    date: string;
    type: TurnoverTypeEnum;
    employee_id: string;
    employee: {
        id: string;
        first_name: string;
        last_name: string;
    };
}

export enum TurnoverTypeEnum {
    Hiring = 'hiring',
    Departure = 'departure',
}

export const TurnoverType = {
    [TurnoverTypeEnum.Hiring]: {
        label: 'Alta',
        color: 'bg-brand-primary-100 text-brand-primary-800',
        bgHex: '#dcfce7',
        textHex: '#016630',
    },
    [TurnoverTypeEnum.Departure]: {
        label: 'Baja',
        color: 'bg-red-100 text-red-400',
        bgHex: '#ffe2e2',
        textHex: '#9f0712',
    },
}

export interface TurnoverFilters {
    page?: number;
    limit?: number;
    date?: string;
    employee_id?: string;
    type?: TurnoverTypeEnum;
    search?: string;
}

export interface TurnoverFormData {
    type: TurnoverTypeEnum;
    date: string;
    employee_id: string;
}

export type TurnoverResponse = PaginationResponse<EmployeeTurnover>;
export type TurnoverByIdResponse = Response<FullEmployeeTurnover>;
export type TurnoverParams = Params;